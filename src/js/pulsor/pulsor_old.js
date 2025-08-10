/**
 * Pulsor Module - Unified, event-driven function execution with phases and policies
 * @version 3.0.0
 *
 * MIGRATION NOTES:
 * - Compatibilità: le API esistenti continuano a funzionare come prima.
 * - Nuove opzioni su CreatePulser/UpdatePulser per controllare callback strategy, scheduling, fail-fast, context.
 * - Callback phases: 'before' | 'after' | 'error' (default: 'after').
 * - Context opzionale ai callback: provideContext: 'none' | 'prepend' | 'append' (default: 'none').
 */

import { Logger } from './logger.class.js';

/**
 * Custom error class for Pulsor-specific errors.
 */
class PulsorError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = 'PulsorError';
        if (cause) this.cause = cause;
    }
}

const Prefix = '[Pulsor]';
const LoggerServices = { log: true, error: true, warn: true, debug: false, info: true };
const Loggy = new Logger(Prefix, LoggerServices);

// --- Registry & helpers ---

/**
 * Entry registry.
 * Map<string, Entry>
 * Entry shape:
 * {
 *   pulseFn: Function,
 *   isAsync: boolean,
 *   version: number,
 *   callbacks: {
 *     before: Map<Function, Meta>,
 *     after:  Map<Function, Meta>,
 *     error:  Map<Function, Meta>
 *   },
 *   options: {
 *     callbackStrategy: 'parallel' | 'sequential',
 *     failFastCallbacks: boolean,
 *     schedule: 'immediate' | 'microtask',
 *     provideContext: 'none' | 'prepend' | 'append',
 *     errorCallbacksBeforeThrow: boolean,
 *     propagateMainError: boolean
 *   },
 *   metrics: {
 *     pulseCount: number,
 *     lastPulsedAt: number | null,
 *     totalDuration: number,
 *     avgDuration: number
 *   }
 * }
 */
const Registry = new Map();

// Cache alias validation
const aliasCache = new Map();
const ALIAS_CACHE_MAX_SIZE = 100;

const DEFAULT_OPTIONS = Object.freeze({
    callbackStrategy: 'parallel',     // 'parallel' | 'sequential'
    failFastCallbacks: false,         // true => ferma (o lancia dopo settle in parallel) su errori nei callback
    schedule: 'immediate',            // 'immediate' | 'microtask' (per after/error)
    provideContext: 'none',           // 'none' | 'prepend' | 'append'
    errorCallbacksBeforeThrow: true,  // esegue i callback di errore prima del rethrow del main error
    propagateMainError: true          // true => rilancia l'errore del main, false => lo sopprime
});

// --- Validation & utils ---

/**
 * Validates and trims an alias string with caching for performance.
 * @param {string} alias
 * @returns {string}
 * @throws {PulsorError}
 */
const validateAlias = (alias) => {
    if (typeof alias !== 'string') {
        throw new PulsorError(Loggy.format('Alias must be a string.'));
    }
    if (aliasCache.has(alias)) return aliasCache.get(alias);

    const trimmedAlias = alias.trim();
    if (trimmedAlias.length === 0 || trimmedAlias.length > 32) {
        throw new PulsorError(Loggy.format('Alias cannot be empty or longer than 32 characters.'));
    }

    if (aliasCache.size >= ALIAS_CACHE_MAX_SIZE) {
        const firstKey = aliasCache.keys().next().value;
        aliasCache.delete(firstKey);
    }
    aliasCache.set(alias, trimmedAlias);
    return trimmedAlias;
};

/**
 * Validates and normalizes function inputs for Pulsor operations.
 * - null/undefined => no-op function () => {}
 * - non-function => throw
 * @param {Function|null|undefined} fn
 * @param {string} [type='Function']
 * @returns {Function}
 * @throws {PulsorError}
 */
const validateFunction = (fn, type = 'Function') => {
    if (fn === null || fn === undefined) {
        fn = () => { };
    } else if (typeof fn !== 'function') {
        throw new PulsorError(Loggy.format(`${type} must be a function.`));
    }
    return fn;
};

const isThenable = (v) => v != null && (typeof v === 'object' || typeof v === 'function') && typeof v.then === 'function';

const nowMs = () => Date.now();

/**
 * Convert wildcard pattern ('user:*') or RegExp to RegExp.
 * @param {string|RegExp} pattern
 * @returns {RegExp}
 */
const toRegex = (pattern) => {
    if (pattern instanceof RegExp) return pattern;
    const str = String(pattern);
    // escape regex special chars except *
    const escaped = str.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
};

// --- Logger config ---

/**
 * Sets the logging level for the Pulsor module.
 * @param {Object} logLevels
 */
export const SetLoggy = (logLevels) => {
    if (typeof logLevels !== 'object' || logLevels === null) {
        throw new Error('Log levels must be an object.');
    }
    Loggy.services(logLevels);
};

// --- Callback storage helpers ---

/**
 * Create empty callbacks maps for phases.
 */
const createCallbacksBag = () => ({
    before: new Map(),
    after: new Map(),
    error: new Map()
});

/**
 * Create initial metrics bag.
 */
const createMetrics = () => ({
    pulseCount: 0,
    lastPulsedAt: null,
    totalDuration: 0,
    avgDuration: 0
});

/**
 * Normalize and freeze options merge.
 */
const resolveOptions = (options = {}) => {
    return Object.freeze({
        ...DEFAULT_OPTIONS,
        ...options
    });
};

/**
 * Create a new entry structure.
 */
const createEntry = (pulseFn, isAsync, options = {}) => ({
    pulseFn,
    isAsync: !!isAsync,
    version: 1,
    callbacks: createCallbacksBag(),
    options: resolveOptions(options),
    metrics: createMetrics()
});

// --- Internal execution of callbacks ---

/**
 * Build callback args based on provideContext policy.
 * - context: { alias, args, result, error, startedAt, endedAt, duration }
 * - originalArgs: array
 */
const buildCallbackArgs = (provideContext, context, originalArgs) => {
    if (provideContext === 'prepend') return [context, ...originalArgs];
    if (provideContext === 'append') return [...originalArgs, context];
    return originalArgs;
};

/**
 * Execute callbacks of a given phase with policy.
 * @param {string} alias
 * @param {'before'|'after'|'error'} phase
 * @param {Map<Function, {priority:number, once:boolean, addedAt:number}>} callbacksMap
 * @param {Object} options entry.options
 * @param {Array} originalArgs
 * @param {Object} context
 */
const executePhaseCallbacks = async (alias, phase, callbacksMap, options, originalArgs, context) => {
    if (!callbacksMap || callbacksMap.size === 0) return;

    const entries = Array.from(callbacksMap.entries())
        .map(([fn, meta]) => ({ fn, ...meta }))
        .sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority; // higher priority first
            return a.addedAt - b.addedAt; // FIFO among equal priority
        });

    const args = buildCallbackArgs(options.provideContext, context, originalArgs);

    const runOne = async (item) => {
        try {
            const out = item.fn(...args);
            if (isThenable(out)) await out;
            if (item.once) callbacksMap.delete(item.fn);
            return null;
        } catch (err) {
            Loggy.warn(`Callback error in '${alias}' [${phase}]:`, err && err.message ? err.message : err);
            return err;
        }
    };

    if (options.schedule === 'microtask' && (phase === 'after' || phase === 'error')) {
        queueMicrotask(async () => {
            if (!callbacksMap || callbacksMap.size === 0) return;
            await executePhaseCallbacks(alias, phase, callbacksMap, { ...options, schedule: 'immediate' }, originalArgs, context);
        });
        return;
    }

    if (options.callbackStrategy === 'sequential') {
        for (const item of entries) {
            const err = await runOne(item);
            if (err && options.failFastCallbacks) {
                throw new PulsorError(Loggy.format(`Callback failed in '${alias}' [${phase}]`), err);
            }
        }
    } else {
        // parallel
        const promises = entries.map(item => runOne(item));
        const results = await Promise.all(promises);
        if (options.failFastCallbacks) {
            const firstErr = results.find(e => e instanceof Error);
            if (firstErr) {
                throw new PulsorError(Loggy.format(`One or more callbacks failed in '${alias}' [${phase}]`), firstErr);
            }
        }
    }
};

// --- Public API ---

/**
 * Creates and registers a new pulser.
 * Options (all opzionali):
 * - override: boolean (se true e alias esiste, aggiorna funzione e opzioni, preservando i callback e le metriche, salvo reset*)
 * - isAsync: boolean (hint; si userà comunque await se il risultato è thenable)
 * - callbackStrategy: 'parallel' | 'sequential'
 * - failFastCallbacks: boolean
 * - schedule: 'immediate' | 'microtask'
 * - provideContext: 'none' | 'prepend' | 'append'
 * - errorCallbacksBeforeThrow: boolean
 * - propagateMainError: boolean
 * - resetCallbacks: boolean (solo in override)
 * - resetMetrics: boolean (solo in override)
 *
 * @returns {Pulser}
 */
export const CreatePulser = (alias, pulseFn, options = {}) => {
    const { override = false, isAsync, resetCallbacks = false, resetMetrics = false, ...rest } = options;
    const aliasValidated = validateAlias(alias);
    const pulseValidated = validateFunction(pulseFn, 'Pulser function');

    const exists = Registry.get(aliasValidated);

    if (exists && !override) {
        throw new PulsorError(Loggy.format(`Pulser '${aliasValidated}' already exists. Use { override: true } to replace it.`));
    }

    if (!exists) {
        // new
        const asyncHint = isAsync !== undefined
            ? !!isAsync
            : ['AsyncFunction', 'AsyncGeneratorFunction'].includes(pulseValidated.constructor.name);

        const entry = createEntry(pulseValidated, asyncHint, rest);
        Registry.set(aliasValidated, entry);
        Loggy.log(`Pulser '${aliasValidated}' (${asyncHint ? 'async' : 'sync'}) created.`);
    } else {
        // override: preserve callbacks/metrics unless reset*
        const newOptions = resolveOptions({ ...exists.options, ...rest });
        const asyncHint = isAsync !== undefined
            ? !!isAsync
            : ['AsyncFunction', 'AsyncGeneratorFunction'].includes(pulseValidated.constructor.name);

        const callbacks = resetCallbacks ? createCallbacksBag() : exists.callbacks;
        const metrics = resetMetrics ? createMetrics() : exists.metrics;

        Registry.set(aliasValidated, {
            pulseFn: pulseValidated,
            isAsync: asyncHint,
            version: exists.version + 1,
            callbacks,
            options: newOptions,
            metrics
        });
        Loggy.log(`Pulser '${aliasValidated}' overridden. Version ${exists.version + 1}.`);
    }

    return new Pulser(aliasValidated);
};

/**
 * Updates an existing pulser, preserving callbacks by default.
 * Same options of CreatePulser (excluding override/resetFlags).
 */
export const UpdatePulser = (alias, pulseFn, options = {}) => {
    const aliasValidated = validateAlias(alias);
    const entry = Registry.get(aliasValidated);
    if (!entry) {
        throw new PulsorError(Loggy.format(`Pulser '${aliasValidated}' does not exist.`));
    }

    const pulseValidated = validateFunction(pulseFn, 'Pulser function');
    const { isAsync, ...rest } = options;
    const asyncHint = isAsync !== undefined
        ? !!isAsync
        : ['AsyncFunction', 'AsyncGeneratorFunction'].includes(pulseValidated.constructor.name);

    Registry.set(aliasValidated, {
        pulseFn: pulseValidated,
        isAsync: asyncHint,
        version: entry.version + 1,
        callbacks: entry.callbacks,
        options: resolveOptions({ ...entry.options, ...rest }),
        metrics: entry.metrics
    });
    Loggy.log(`Pulser '${aliasValidated}' updated. Version ${entry.version + 1}.`);
};

/**
 * Destroys a pulser and all its associated callbacks.
 */
export const DestroyPulser = (alias) => {
    const aliasValidated = validateAlias(alias);
    if (!Registry.has(aliasValidated)) {
        throw new PulsorError(Loggy.format(`Pulser '${aliasValidated}' does not exist.`));
    }
    Registry.delete(aliasValidated);
    Loggy.log(`Pulser '${aliasValidated}' and all its callbacks have been destroyed.`);
};

/**
 * Checks if a pulser exists.
 */
export const PulserExists = (alias) => {
    try {
        return Registry.has(validateAlias(alias));
    } catch {
        return false;
    }
};

/**
 * Lists registered pulser aliases. Accepts optional pattern (string with * or RegExp).
 * @param {string|RegExp} [pattern]
 * @returns {string[]}
 */
export const ListPulsers = (pattern) => {
    const all = Array.from(Registry.keys());
    if (!pattern) return all;
    const rx = toRegex(pattern);
    return all.filter(a => rx.test(a));
};

/**
 * Gets info about a pulser.
 * Includes metrics and options snapshot.
 */
export const GetPulserInfo = (alias) => {
    try {
        const aliasValidated = validateAlias(alias);
        const entry = Registry.get(aliasValidated);
        if (!entry) return null;

        const counts = {
            before: entry.callbacks.before.size,
            after: entry.callbacks.after.size,
            error: entry.callbacks.error.size,
            total: entry.callbacks.before.size + entry.callbacks.after.size + entry.callbacks.error.size
        };

        return {
            alias: aliasValidated,
            isAsync: entry.isAsync,
            callbackCount: counts.total,
            callbackCounts: counts,
            functionName: entry.pulseFn.name || 'anonymous',
            version: entry.version,
            metrics: { ...entry.metrics },
            options: { ...entry.options }
        };
    } catch {
        return null;
    }
};

// Factory wrapper to avoid using 'new' keyword with Pulser class
export const Pulsor = (alias) => new Pulser(alias);

// --- Pulser class ---

export class Pulser {
    #alias;

    constructor(alias) {
        this.#alias = validateAlias(alias);
        if (!Registry.get(this.#alias)) {
            throw new PulsorError(Loggy.format(`Cannot create Pulser instance. Pulser '${this.#alias}' is not registered.`));
        }
    }

    get alias() { return this.#alias; }

    get isAsync() {
        const entry = Registry.get(this.#alias);
        if (!entry) throw new PulsorError(Loggy.format(`Pulser '${this.#alias}' is not registered.`));
        return entry.isAsync;
    }

    get callbackCount() {
        const entry = Registry.get(this.#alias);
        if (!entry) throw new PulsorError(Loggy.format(`Pulser '${this.#alias}' is not registered.`));
        return entry.callbacks.before.size + entry.callbacks.after.size + entry.callbacks.error.size;
    }

    /**
     * Execute the pulser's function with phases:
     * - before callbacks
     * - main function
     * - after callbacks on success, error callbacks on failure
     * Returns the result (or Promise of it).
     */
    pulse(...args) {
        return this.#pulseUnified(args);
    }

    async #pulseUnified(args) {
        const entry = Registry.get(this.#alias);
        if (!entry) throw new PulsorError(Loggy.format(`Pulser '${this.#alias}' is not registered.`));

        const startedAt = nowMs();
        const baseContext = { alias: this.#alias, args, result: undefined, error: undefined, startedAt, endedAt: undefined, duration: undefined };

        // BEFORE
        await executePhaseCallbacks(this.#alias, 'before', entry.callbacks.before, entry.options, args, { ...baseContext });

        // MAIN
        let result, mainError;
        try {
            const out = entry.pulseFn(...args);
            result = entry.isAsync || isThenable(out) ? await out : out;
        } catch (err) {
            mainError = err;
        }

        const endedAt = nowMs();
        const duration = endedAt - startedAt;

        // Metrics
        entry.metrics.pulseCount += 1;
        entry.metrics.lastPulsedAt = endedAt;
        entry.metrics.totalDuration += duration;
        entry.metrics.avgDuration = entry.metrics.totalDuration / entry.metrics.pulseCount;

        if (mainError) {
            const errorContext = { ...baseContext, error: mainError, endedAt, duration };
            try {
                if (entry.options.errorCallbacksBeforeThrow) {
                    await executePhaseCallbacks(this.#alias, 'error', entry.callbacks.error, entry.options, args, errorContext);
                } else {
                    // schedule or run after throw — but we still honor scheduling
                    await executePhaseCallbacks(this.#alias, 'error', entry.callbacks.error, { ...entry.options, schedule: 'microtask' }, args, errorContext);
                }
            } catch (cbErr) {
                // Callback policy may throw. Decide if to wrap or propagate.
                if (entry.options.propagateMainError) {
                    // prefer original error
                } else {
                    // suppress main error; propagate callback error if fail-fast
                    throw cbErr;
                }
            }
            if (entry.options.propagateMainError) {
                throw mainError;
            } else {
                return undefined;
            }
        }

        // AFTER
        const successContext = { ...baseContext, result, endedAt, duration };
        await executePhaseCallbacks(this.#alias, 'after', entry.callbacks.after, entry.options, args, successContext);

        return result;
    }

    /**
     * Bind a callback to a phase with options.
     * @param {Function} callback
     * @param {Object} [options]
     *   - phase: 'before'|'after'|'error' (default 'after')
     *   - priority: number (default 0; higher runs first)
     *   - once: boolean (default false)
     */
    bind(callback, options = {}) {
        const cb = validateFunction(callback, 'Callback');
        const entry = Registry.get(this.#alias);
        if (!entry) throw new PulsorError(Loggy.format(`Pulser '${this.#alias}' is not registered.`));

        const phase = options.phase || 'after';
        const bag = entry.callbacks[phase];
        if (!bag) throw new PulsorError(Loggy.format(`Invalid phase '${phase}' for '${this.#alias}'.`));

        if (bag.has(cb)) {
            throw new PulsorError(Loggy.format(`Callback is already bound to '${this.#alias}' [${phase}].`));
        }

        bag.set(cb, {
            priority: Number.isFinite(options.priority) ? options.priority : 0,
            once: !!options.once,
            addedAt: nowMs()
        });

        Loggy.log(`Callback added to '${this.#alias}' [${phase}].`);
        return this;
    }

    /**
     * Bind multiple callbacks.
     * - If array of functions, all bound with same options.
     * - If array of objects: { fn, options }
     */
    binds(callbacks, options = {}) {
        if (!Array.isArray(callbacks)) {
            throw new PulsorError(Loggy.format(`Expected array of callbacks for '${this.#alias}', got ${typeof callbacks}.`));
        }

        callbacks.forEach((item, index) => {
            try {
                if (typeof item === 'function') {
                    this.bind(item, options);
                } else if (item && typeof item.fn === 'function') {
                    this.bind(item.fn, item.options || options);
                } else {
                    throw new PulsorError(Loggy.format(`Invalid callback at index ${index}.`));
                }
            } catch (error) {
                throw new PulsorError(Loggy.format(`Error binding callback at index ${index} for '${this.#alias}': ${error.message}`));
            }
        });

        return this;
    }

    /**
     * Unbind a callback. Default phase: 'after' (compat).
     * Pass options.phase to target a specific phase; if omitted and the callback
     * isn't in 'after', tenterà di rimuoverlo da tutte le fasi.
     * @returns {boolean}
     */
    unbind(callback, options = {}) {
        const cb = validateFunction(callback, 'Callback');
        const entry = Registry.get(this.#alias);
        if (!entry) throw new PulsorError(Loggy.format(`Pulser '${this.#alias}' is not registered.`));

        const phase = options.phase;
        if (phase) {
            const bag = entry.callbacks[phase];
            if (!bag) throw new PulsorError(Loggy.format(`Invalid phase '${phase}' for '${this.#alias}'.`));
            const removed = bag.delete(cb);
            if (removed) Loggy.log(`Callback removed from '${this.#alias}' [${phase}].`);
            return removed;
        }

        // compat: try 'after' first, then others
        if (entry.callbacks.after.delete(cb)) {
            Loggy.log(`Callback removed from '${this.#alias}' [after].`);
            return true;
        }
        let removed = false;
        ['before', 'error'].forEach(ph => {
            if (entry.callbacks[ph].delete(cb)) removed = true;
        });
        if (removed) Loggy.log(`Callback removed from '${this.#alias}' [before/error].`);
        return removed;
    }

    /**
     * Unbind multiple callback functions.
     * @returns {number} count removed
     */
    unbinds(callbacks, options = {}) {
        if (!Array.isArray(callbacks)) {
            throw new PulsorError(Loggy.format(`Expected array of callbacks for '${this.#alias}', got ${typeof callbacks}.`));
        }
        let removedCount = 0;
        callbacks.forEach(cb => {
            if (this.unbind(cb, options)) removedCount++;
        });
        return removedCount;
    }

    /**
     * Unbind all callbacks (optionally for a specific phase).
     * @param {Object} [options]
     *   - phase: 'before'|'after'|'error' (if omitted, all phases)
     * @returns {number} removed count
     */
    unbindAll(options = {}) {
        const entry = Registry.get(this.#alias);
        if (!entry) throw new PulsorError(Loggy.format(`Pulser '${this.#alias}' is not registered.`));

        const clearMap = (m) => {
            const size = m.size;
            m.clear();
            return size;
        };

        if (options.phase) {
            const bag = entry.callbacks[options.phase];
            if (!bag) throw new PulsorError(Loggy.format(`Invalid phase '${options.phase}' for '${this.#alias}'.`));
            const count = bag.size;
            bag.clear();
            if (count > 0) Loggy.log(`All ${count} callbacks removed from '${this.#alias}' [${options.phase}].`);
            return count;
        }

        const count = clearMap(entry.callbacks.before) + clearMap(entry.callbacks.after) + clearMap(entry.callbacks.error);
        if (count > 0) Loggy.log(`All ${count} callbacks removed from '${this.#alias}'.`);
        return count;
    }

    /**
     * Returns a bound version of pulse().
     */
    bound() {
        return this.pulse.bind(this);
    }
}

// Export the PulsorError class
export { PulsorError };
