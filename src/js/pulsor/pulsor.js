/**
 * Pulsor Module - Hardened & Enterprise-Ready Framework
 * @version 5.0.7
 *
 * MIGRATION NOTES & WHAT'S NEW:
 * - v5.0.7: [ENTERPRISE] Added configurable metrics, health check API, batch operations, and graceful shutdown.
 * - v5.0.6: [MONITORING] Added advanced performance metrics (percentiles, trend analysis).
 * - v5.0.5: [RESILIENCE] Introduced a `safeLog` wrapper to prevent logging failures.
 * - v5.0.4: [REFACTOR] Moved `buildCallbackArgs` to a private class method.
 * - v5.0.3: [BUGFIX] Restored global exports for `ListPulsers` and `GetPulserInfo`.
 * - v5.0.2: [BUGFIX] Implemented the missing `unbindByPatternId` method.
 * - v5.0.1: General code cleanup.
 * - v5.0.0: Major hardening release.
 */

import { Logger } from './logger.class.js';

// --- Core exports and symbols ---
export const PULSOR_STOP = Symbol('PULSOR_STOP');
export class PulsorError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'PulsorError';
    if (cause) {
      this.cause = cause;
      if (cause instanceof Error && cause.stack) {
        this.stack = `${this.stack.split('\n')[0]}\nCaused by: ${cause.stack}`;
      }
    }
  }
}

// --- Logger Setup & Resilience ---
const Prefix = '[Pulsor]';
const LoggerServices = { log: true, error: true, warn: true, debug: false, info: true };
const Loggy = new Logger(Prefix, LoggerServices);

const createStructuredLog = (event, data = {}) => ({
  timestamp: new Date().toISOString(),
  event,
  ...data
});

const safeLog = (level, event, data = {}) => {
  try {
    Loggy[level](event, createStructuredLog(event, data));
  } catch (loggingError) {
    console.error(`[Pulsor] Logging failed for ${event}:`, loggingError.message);
    console.log('[Pulsor] Original data:', data);
  }
};

// --- Constants and Defaults ---

const VALID_OPTIONS = Object.freeze({
  callbackStrategy: ['parallel', 'sequential'],
  schedule: ['immediate', 'microtask'],
  provideContext: ['none', 'prepend', 'append'],
  failFastCallbacks: 'boolean',
  errorCallbacksBeforeThrow: 'boolean',
  propagateMainError: 'boolean',
  preventConcurrentExecution: 'boolean',
  freezeArgs: 'boolean'
});

const DEFAULT_OPTIONS = Object.freeze({
  callbackStrategy: 'parallel',
  failFastCallbacks: false,
  schedule: 'immediate',
  provideContext: 'none',
  errorCallbacksBeforeThrow: true,
  propagateMainError: true,
  preventConcurrentExecution: false,
  freezeArgs: false
});

// --- Validation & Utils ---

const validateAlias = (alias) => {
  if (typeof alias !== 'string' || alias.trim().length === 0 || alias.trim().length > 32) {
    throw new PulsorError('Alias must be a non-empty string, max 32 chars.');
  }
  return alias.trim();
};

const validateFunction = (fn, type = 'Function') => {
  if (fn === null || fn === undefined) return () => { };
  if (typeof fn !== 'function') throw new PulsorError(`${type} must be a function.`);
  return fn;
};

const validateOptions = (options, source) => {
  const errors = [];
  Object.entries(options).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(VALID_OPTIONS, key)) {
      errors.push(`Invalid option '${key}'`);
      return;
    }
    const expected = VALID_OPTIONS[key];
    if (Array.isArray(expected) && !expected.includes(value)) {
      errors.push(`Invalid value for '${key}': '${value}'. Expected one of: ${expected.join(', ')}`);
    } else if (expected === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Invalid type for '${key}': expected boolean, got ${typeof value}`);
    }
  });
  if (errors.length > 0) {
    throw new PulsorError(`Option validation failed for ${source}: ${errors.join('; ')}`);
  }
};

const nowMs = () => Date.now();
const toRegex = (pattern) => {
  if (pattern instanceof RegExp) return pattern;
  const str = String(pattern).replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${str}$`);
};

// --- Pulser Class ---

export class Pulser {
  #alias;
  #manager;

  constructor(alias, manager) {
    this.#alias = validateAlias(alias);
    this.#manager = manager;
    if (!this.#manager.getEntry(this.#alias)) {
      throw new PulsorError(`Pulser '${this.#alias}' is not registered.`);
    }
  }

  get alias() { return this.#alias; }
  pulse(...args) { return this.#manager.pulse(this.#alias, args); }
  bind(callback, options = {}) {
    const cb = validateFunction(callback, 'Callback');
    this.#manager.bindCallback(this.#alias, cb, options);
    return () => this.unbind(cb, { phase: options.phase || 'after' });
  }
  unbind(callback, options = {}) { return this.#manager.unbindCallback(this.#alias, callback, options); }
  unbindAll(options = {}) { return this.#manager.unbindAllCallbacks(this.#alias, options); }

  binds(callbacks, options = {}) {
    if (!Array.isArray(callbacks)) throw new PulsorError('Expected array for binds');
    const results = { unbinders: [], errors: [] };
    callbacks.forEach((item, index) => {
      try {
        let unbinder;
        if (typeof item === 'function') unbinder = this.bind(item, options);
        else if (item?.fn) unbinder = this.bind(item.fn, item.options || options);
        else throw new PulsorError('Invalid callback item');
        results.unbinders.push(unbinder);
      } catch (error) {
        results.errors.push({ index, error: new PulsorError(`Failed to bind callback at index ${index}`, error) });
      }
    });
    return results;
  }

  update(pulseFn, options = {}) {
    return this.#manager.UpdatePulser(this.#alias, pulseFn, options);
  }

  bound() { return this.pulse.bind(this); }
}

// --- Pulsor Manager ---

export class PulsorManager {
  #registry = new Map();
  #patternCallbacks = [];
  #patternIdCounter = 0;

  #patternCache = new Map();
  #lastPatternChange = 0;
  #cacheStats = { hits: 0, misses: 0 };

  #eventListeners = new Map();

  #performanceMetrics = {
    durations: [],
    maxWindowSize: 100
  };

  #shutdownRequested = false;

  constructor(options = {}) {
    this.#performanceMetrics.maxWindowSize = options.metricsWindowSize || 100;
  }

  getEntry(alias) { return this.#registry.get(alias); }

  CreatePulser(alias, pulseFn, options = {}) {
    const { override = false, isAsync, resetCallbacks = false, resetMetrics = false, ...rest } = options;
    validateOptions(rest, `CreatePulser('${alias}')`);
    const aliasValidated = validateAlias(alias);
    const pulseValidated = validateFunction(pulseFn, 'Pulser function');
    const exists = this.#registry.get(aliasValidated);

    if (exists && !override) {
      throw new PulsorError(`Pulser '${aliasValidated}' already exists. Use { override: true }`);
    }

    const asyncHint = isAsync ?? ['AsyncFunction', 'AsyncGeneratorFunction'].includes(pulseValidated.constructor.name);

    if (!exists) {
      const entry = {
        pulseFn: pulseValidated, isAsync: asyncHint, version: 1,
        callbacks: { before: new Map(), after: new Map(), error: new Map() },
        options: Object.freeze({ ...DEFAULT_OPTIONS, ...rest }),
        metrics: { pulseCount: 0, lastPulsedAt: null, totalDuration: 0, avgDuration: 0 },
        _executing: false
      };
      this.#registry.set(aliasValidated, entry);
    } else {
      exists.pulseFn = pulseValidated;
      exists.isAsync = asyncHint;
      exists.version++;
      exists.options = Object.freeze({ ...exists.options, ...rest });
      if (resetCallbacks) exists.callbacks = { before: new Map(), after: new Map(), error: new Map() };
      if (resetMetrics) exists.metrics = { pulseCount: 0, lastPulsedAt: null, totalDuration: 0, avgDuration: 0 };
    }

    const logData = { alias: aliasValidated, isAsync: asyncHint, version: exists?.version ?? 1, override };
    this.#emit('pulserCreated', logData);
    safeLog('log', 'PulserCreated', logData);

    return new Pulser(aliasValidated, this);
  }

  async pulse(alias, args) {
    if (this.#shutdownRequested) {
      throw new PulsorError(`Pulse rejected for '${alias}' - shutdown in progress`);
    }

    const entry = this.getEntry(alias);
    if (!entry) throw new PulsorError(`Pulser '${alias}' is not registered.`);

    if (entry.options.preventConcurrentExecution && entry._executing) {
      const error = new PulsorError(`Pulser '${alias}' is already executing.`);
      this.#emit('pulseError', { alias, error });
      throw error;
    }

    const executionId = `${alias}-${nowMs()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      entry._executing = true;
      const startedAt = nowMs();
      let currentArgs = [...args];

      if (entry.options.freezeArgs) {
        Object.freeze(currentArgs);
        currentArgs.forEach(arg => (typeof arg === 'object' && arg !== null) ? Object.freeze(arg) : null);
      }

      this.#emit('pulseStarted', { executionId, alias });
      safeLog('debug', 'PulseStarted', { executionId, alias });

      const beforeResult = await this.#executePhaseCallbacks(executionId, 'before', entry, currentArgs);
      if (beforeResult === PULSOR_STOP) {
        this.#emit('pulseCompleted', { executionId, alias, status: 'stopped', duration: nowMs() - startedAt });
        safeLog('log', `Pulse for '${alias}' was stopped by a 'before' callback.`);
        return undefined;
      }
      if (Array.isArray(beforeResult)) currentArgs = beforeResult;

      let result, mainError;
      try {
        result = await Promise.resolve(entry.pulseFn(...currentArgs));
      } catch (err) { mainError = err; }

      const endedAt = nowMs();
      const duration = endedAt - startedAt;

      const newTotalDuration = entry.metrics.totalDuration + duration;
      const newPulseCount = entry.metrics.pulseCount + 1;
      Object.assign(entry.metrics, {
        pulseCount: newPulseCount,
        lastPulsedAt: endedAt,
        totalDuration: newTotalDuration,
        avgDuration: newTotalDuration / newPulseCount
      });

      this.#updatePerformanceMetrics(duration);

      const baseContext = { alias, args: currentArgs, startedAt, endedAt, duration };

      if (mainError) {
        if (entry.options.errorCallbacksBeforeThrow) {
          await this.#executePhaseCallbacks(executionId, 'error', entry, currentArgs, { ...baseContext, error: mainError });
        }
        this.#emit('pulseCompleted', { executionId, alias, status: 'error', duration, error: mainError });
        if (entry.options.propagateMainError) throw mainError;
        return undefined;
      }

      await this.#executePhaseCallbacks(executionId, 'after', entry, currentArgs, { ...baseContext, result });
      this.#emit('pulseCompleted', { executionId, alias, status: 'success', duration });
      return result;
    } catch (error) {
      const finalError = new PulsorError(`Pulse execution failed for '${alias}'`, error);
      safeLog('error', 'PulseFailed', { executionId, alias, error: finalError });
      throw finalError;
    } finally {
      if (entry) entry._executing = false;
    }
  }

  // --- Batch Operations ---

  createPulsers(definitions) {
    if (!Array.isArray(definitions)) throw new PulsorError('Batch creation requires an array of definitions.');
    const results = { created: [], failed: [] };
    definitions.forEach((def, index) => {
      try {
        const { alias, pulseFn, options } = def;
        const pulser = this.CreatePulser(alias, pulseFn, options);
        results.created.push({ alias, pulser });
      } catch (error) {
        results.failed.push({ index, alias: def.alias, error: new PulsorError(`Batch creation failed for '${def.alias}'`, error) });
      }
    });
    return results;
  }

  destroyPulsers(patterns) {
    if (!Array.isArray(patterns)) throw new PulsorError('Batch destruction requires an array of patterns.');
    const results = { destroyed: [], failed: [] };
    patterns.forEach(pattern => {
      try {
        const aliases = this.ListPulsers(pattern);
        aliases.forEach(alias => {
          this.DestroyPulser(alias);
          results.destroyed.push(alias);
        });
      } catch (error) {
        results.failed.push({ pattern, error });
      }
    });
    return results;
  }

  // --- Graceful Shutdown ---

  #hasActiveExecutions() {
    return Array.from(this.#registry.values()).some(entry => entry._executing);
  }

  #getActiveExecutions() {
    return Array.from(this.#registry.entries())
      .filter(([, entry]) => entry._executing)
      .map(([alias]) => alias);
  }

  async gracefulShutdown(timeoutMs = 30000) {
    this.#shutdownRequested = true;
    safeLog('info', 'Graceful shutdown initiated. No new pulses will be accepted.');

    const startTime = nowMs();
    while (this.#hasActiveExecutions() && (nowMs() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const isClean = !this.#hasActiveExecutions();

    if (isClean) {
      safeLog('info', 'Graceful shutdown completed - all executions finished.');
    } else {
      safeLog('warn', 'Graceful shutdown timeout - some executions may still be running.', {
        active: this.#getActiveExecutions()
      });
    }

    return { success: isClean, activeExecutions: this.#getActiveExecutions() };
  }

  // --- Monitoring & Health Check ---

  configureMetrics(options) {
    if (options.windowSize && options.windowSize > 0) {
      this.#performanceMetrics.maxWindowSize = options.windowSize;
      const currentSize = this.#performanceMetrics.durations.length;
      if (currentSize > options.windowSize) {
        this.#performanceMetrics.durations = this.#performanceMetrics.durations.slice(currentSize - options.windowSize);
      }
    }
  }

  #updatePerformanceMetrics(duration) {
    this.#performanceMetrics.durations.push(duration);
    if (this.#performanceMetrics.durations.length > this.#performanceMetrics.maxWindowSize) {
      this.#performanceMetrics.durations.shift();
    }
  }

  #calculateTrend(recent) {
    if (recent.length < 2) return 0;
    const mid = Math.floor(recent.length / 2);
    if (mid === 0) return 0;
    const firstHalfAvg = recent.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalf = recent.slice(mid);
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    return secondHalfAvg - firstHalfAvg;
  }

  getAdvancedMetrics() {
    const globalMetrics = this.getGlobalMetrics();
    const { durations } = this.#performanceMetrics;

    if (durations.length === 0) {
      return { ...globalMetrics, percentiles: null, trend: null };
    }

    const sorted = [...durations].sort((a, b) => a - b);

    return {
      ...globalMetrics,
      percentiles: {
        p50: sorted[Math.floor(sorted.length * 0.50)],
        p90: sorted[Math.floor(sorted.length * 0.90)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      },
      trend: durations.length >= 10 ? this.#calculateTrend(durations.slice(-10)) : null
    };
  }

  #generateRecommendations(stalePulsers, memoryPressure) {
    const recommendations = [];
    if (stalePulsers.length > 5) recommendations.push('Consider removing or reviewing stale pulsers to free up memory.');
    if (memoryPressure.patternCallbacks > 500) recommendations.push('Many pattern callbacks are registered. Ensure TTLs are set or run cleanup.');
    if (memoryPressure.patternCache > 800) recommendations.push('Pattern cache is large. This may be normal under high-variety loads, but monitor for leaks.');
    return recommendations;
  }

  getHealthStatus() {
    const metrics = this.getAdvancedMetrics();
    const now = nowMs();

    const staleThreshold = 24 * 60 * 60 * 1000;
    const stalePulsers = Array.from(this.#registry.entries())
      .filter(([, entry]) => entry.metrics.lastPulsedAt && (now - entry.metrics.lastPulsedAt) > staleThreshold)
      .map(([alias]) => alias);

    const memoryPressure = {
      patternCallbacks: this.#patternCallbacks.length,
      patternCache: this.#patternCache.size,
      eventListeners: Array.from(this.#eventListeners.values()).reduce((sum, arr) => sum + arr.length, 0)
    };

    const isHealthy = stalePulsers.length < 10 &&
      memoryPressure.patternCallbacks < 1000 &&
      memoryPressure.patternCache < 1000;

    return {
      status: isHealthy ? 'healthy' : 'warning',
      timestamp: new Date(now).toISOString(),
      metrics,
      memoryPressure,
      stalePulsers: {
        count: stalePulsers.length,
        aliases: stalePulsers.slice(0, 10) // show first 10
      },
      recommendations: !isHealthy ? this.#generateRecommendations(stalePulsers, memoryPressure) : []
    };
  }

  // --- Other Private and Internal Methods (abbreviated for clarity, no changes) ---
  // ... (ListPulsers, GetPulserInfo, Pattern Management, Callback Management, etc. are here)
  // [NOTE: The full code for all methods is included below]
  UpdatePulser(alias, pulseFn, options = {}) { const aliasValidated = validateAlias(alias); if (!this.#registry.has(aliasValidated)) throw new PulsorError(`Pulser '${aliasValidated}' does not exist.`); validateOptions(options, `UpdatePulser('${alias}')`); const pulser = this.CreatePulser(aliasValidated, pulseFn, { ...options, override: true, resetCallbacks: false, resetMetrics: false }); this.#emit('pulserUpdated', { alias: aliasValidated }); return pulser; }
  DestroyPulser(alias) { const aliasValidated = validateAlias(alias); if (!this.#registry.delete(aliasValidated)) { throw new PulsorError(`Pulser '${aliasValidated}' does not exist.`); } this.#emit('pulserDestroyed', { alias: aliasValidated }); safeLog('log', `Pulser '${aliasValidated}' destroyed.`); }
  ListPulsers(pattern) { const all = Array.from(this.#registry.keys()); if (!pattern) return all; const rx = toRegex(pattern); return all.filter(a => rx.test(a)); }
  GetPulserInfo(alias) { try { const aliasValidated = validateAlias(alias); const entry = this.#registry.get(aliasValidated); if (!entry) return null; const mapToDetails = (map) => Array.from(map.values()).map((meta) => ({ functionName: meta.functionName, priority: meta.priority, once: meta.once, addedAt: meta.addedAt })); const callbackDetails = { before: mapToDetails(entry.callbacks.before), after: mapToDetails(entry.callbacks.after), error: mapToDetails(entry.callbacks.error), }; const callbackCounts = { before: callbackDetails.before.length, after: callbackDetails.after.length, error: callbackDetails.error.length, }; return { alias: aliasValidated, isAsync: entry.isAsync, callbackCount: callbackCounts.before + callbackCounts.after + callbackCounts.error, callbackCounts, callbackDetails, functionName: entry.pulseFn.name || 'anonymous', version: entry.version, metrics: { ...entry.metrics }, options: { ...entry.options } }; } catch (error) { safeLog('debug', `GetPulserInfo failed for alias '${alias}'`, { error: error.message }); return null; } }
  cleanupExpiredPatterns() { const now = nowMs(); const initialCount = this.#patternCallbacks.length; this.#patternCallbacks = this.#patternCallbacks.filter(p => !p.options.ttl || (now - p.addedAt) < p.options.ttl); if (initialCount > this.#patternCallbacks.length) { this.#lastPatternChange = now; this.#patternCache.clear(); this.#emit('patternsCleaned', { removed: initialCount - this.#patternCallbacks.length }); } }
  bindToPattern(pattern, callback, options = {}) { const id = `p${++this.#patternIdCounter}-${nowMs()}`; if (this.#patternCallbacks.length > 100 && Math.random() < 0.1) { this.cleanupExpiredPatterns(); } this.#patternCallbacks.push({ id, regex: toRegex(pattern), callback: validateFunction(callback), addedAt: nowMs(), options: { phase: 'after', priority: 0, once: false, ttl: null, ...options } }); this.#lastPatternChange = nowMs(); this.#patternCache.clear(); this.#emit('patternBound', { pattern, id }); return id; }
  unbindByPatternId(id) { const initialLength = this.#patternCallbacks.length; this.#patternCallbacks = this.#patternCallbacks.filter(p => p.id !== id); const removed = this.#patternCallbacks.length < initialLength; if (removed) { this.#lastPatternChange = nowMs(); this.#patternCache.clear(); this.#emit('patternUnbound', { id }); safeLog('log', `Pattern callback with id ${id} removed.`); } return removed; }
  bindCallback(alias, callback, options) { const entry = this.getEntry(alias); if (!entry) throw new PulsorError(`Pulser '${alias}' is not registered.`); const phase = options.phase || 'after'; const bag = entry.callbacks[phase]; if (!bag) throw new PulsorError(`Invalid phase '${phase}' for '${alias}'.`); if (bag.has(callback)) throw new PulsorError(`Callback is already bound to '${alias}' [${phase}].`); bag.set(callback, { fn: callback, priority: Number.isFinite(options.priority) ? options.priority : 0, once: !!options.once, addedAt: nowMs(), functionName: callback.name || 'anonymous' }); }
  unbindCallback(alias, callback, options = {}) { const cb = validateFunction(callback, 'Callback'); const entry = this.getEntry(alias); if (!entry) throw new PulsorError(`Pulser '${alias}' is not registered.`); const phase = options.phase; if (phase) { return entry.callbacks[phase]?.delete(cb) ?? false; } return ['after', 'before', 'error'].some(ph => entry.callbacks[ph].delete(cb)); }
  unbindAllCallbacks(alias, options = {}) { const entry = this.getEntry(alias); if (!entry) throw new PulsorError(`Pulser '${alias}' is not registered.`); if (options.phase) { const count = entry.callbacks[options.phase]?.size ?? 0; entry.callbacks[options.phase]?.clear(); return count; } const count = Object.values(entry.callbacks).reduce((sum, map) => sum + map.size, 0); Object.values(entry.callbacks).forEach(map => map.clear()); return count; }
  #collectCallbacks(alias, phase, entry) { const cacheKey = `${alias}:${phase}`; if (this.#patternCache.has(cacheKey) && this.#patternCache.get(cacheKey).timestamp >= this.#lastPatternChange) { this.#cacheStats.hits++; const cached = this.#patternCache.get(cacheKey); const specific = Array.from(entry.callbacks[phase].values()).map(meta => ({ ...meta, source: 'specific' })); return [...specific, ...cached.pattern].sort((a, b) => b.priority - a.priority || a.addedAt - b.addedAt); } this.#cacheStats.misses++; const specific = Array.from(entry.callbacks[phase].values()).map(meta => ({ ...meta, source: 'specific' })); const pattern = this.#patternCallbacks.filter(p => p.options.phase === phase && p.regex.test(alias)).map(p => ({ fn: p.callback, priority: p.options.priority, once: p.options.once, addedAt: 0, source: 'pattern', patternId: p.id, functionName: p.callback.name || 'anonymous' })); this.#patternCache.set(cacheKey, { pattern, timestamp: nowMs() }); if (this.#patternCache.size > 500) this.#patternCache.delete(this.#patternCache.keys().next().value); return [...specific, ...pattern].sort((a, b) => b.priority - a.priority || a.addedAt - b.addedAt); }
  #buildCallbackArgs(provideContext, context, originalArgs) { if (provideContext === 'prepend') return [context, ...originalArgs]; if (provideContext === 'append') return [...originalArgs, context]; return originalArgs; }
  async #executePhaseCallbacks(execId, phase, entry, originalArgs, context = {}) { const alias = context.alias || 'unknown'; const callbacksToRun = this.#collectCallbacks(alias, phase, entry); if (callbacksToRun.length === 0) return; const { options } = entry; if (phase === 'before') { let currentArgs = originalArgs; for (const item of callbacksToRun) { const callbackArgs = this.#buildCallbackArgs(options.provideContext, { ...context, alias, args: currentArgs }, currentArgs); try { const out = await Promise.resolve(item.fn(...callbackArgs)); if (item.once) { if (item.source === 'specific') entry.callbacks.before.delete(item.fn); else if (item.source === 'pattern') this.unbindByPatternId(item.patternId); } if (out === PULSOR_STOP) return PULSOR_STOP; if (Array.isArray(out)) currentArgs = out; } catch (err) { throw new PulsorError(`'before' callback '${item.functionName}' failed for '${alias}'`, err); } } return currentArgs; } const args = this.#buildCallbackArgs(options.provideContext, context, originalArgs); const runOne = async (item) => { try { await Promise.resolve(item.fn(...args)); if (item.once) { if (item.source === 'specific') entry.callbacks[phase].delete(item.fn); else if (item.source === 'pattern') this.unbindByPatternId(item.patternId); } return null; } catch (err) { safeLog('warn', `Callback '${item.functionName}' failed in '${alias}' [${phase}]`, { error: err.message }); this.#emit('callbackError', { execId, alias, phase, callbackName: item.functionName, error: err }); return err; } }; if (options.callbackStrategy === 'sequential') { for (const item of callbacksToRun) { const err = await runOne(item); if (err && options.failFastCallbacks) { throw new PulsorError(`Callback failed in '${alias}' [${phase}] and failFast is enabled`, err); } } } else { const results = await Promise.all(callbacksToRun.map(runOne)); if (options.failFastCallbacks) { const firstErr = results.find(e => e instanceof Error); if (firstErr) { throw new PulsorError(`One or more callbacks failed in '${alias}' [${phase}] and failFast is enabled`, firstErr); } } } }
  on(event, callback) { if (!this.#eventListeners.has(event)) this.#eventListeners.set(event, []); this.#eventListeners.get(event).push(validateFunction(callback)); }
  #emit(event, data) { this.#eventListeners.get(event)?.forEach(cb => { try { cb(data); } catch (e) { safeLog('error', `Error in '${event}' event listener`, { error: e }); } }); }
  getGlobalMetrics() { const pulsers = Array.from(this.#registry.values()); const totalPulses = pulsers.reduce((s, p) => s + p.metrics.pulseCount, 0); return { totalPulsers: pulsers.length, totalPulses, averageDuration: totalPulses > 0 ? pulsers.reduce((s, p) => s + p.metrics.totalDuration, 0) / totalPulses : 0, patternCallbackCount: this.#patternCallbacks.length, cacheStats: { ...this.#cacheStats, hitRate: (this.#cacheStats.hits + this.#cacheStats.misses) > 0 ? this.#cacheStats.hits / (this.#cacheStats.hits + this.#cacheStats.misses) : 0 } }; }

  __testing__ = {
    getInternalState: (alias) => { const entry = this.getEntry(alias); return entry ? { options: { ...entry.options }, metrics: { ...entry.metrics }, isExecuting: entry._executing || false, callbacks: { before: Array.from(entry.callbacks.before.keys()), after: Array.from(entry.callbacks.after.keys()), error: Array.from(entry.callbacks.error.keys()) } } : null; },
    clearMetrics: (alias) => { const entry = this.getEntry(alias); if (entry) entry.metrics = { pulseCount: 0, lastPulsedAt: null, totalDuration: 0, avgDuration: 0 }; },
    reset: () => { this.#registry.clear(); this.#patternCallbacks = []; this.#patternCache.clear(); this.#eventListeners.clear(); this.#cacheStats = { hits: 0, misses: 0 }; this.#performanceMetrics.durations = []; this.#shutdownRequested = false; safeLog('warn', "Pulsor default manager has been reset for testing."); }
  };
}

// --- Default Manager and Global Exports for backward compatibility ---
const defaultManager = new PulsorManager();
export const SetLoggy = (logLevels) => Loggy.services(logLevels);
export const CreatePulser = defaultManager.CreatePulser.bind(defaultManager);
export const UpdatePulser = defaultManager.UpdatePulser.bind(defaultManager);
export const DestroyPulser = defaultManager.DestroyPulser.bind(defaultManager);
export const PulserExists = defaultManager.PulserExists.bind(defaultManager);
export const ListPulsers = defaultManager.ListPulsers.bind(defaultManager);
export const GetPulserInfo = defaultManager.GetPulserInfo.bind(defaultManager);
export const getAdvancedMetrics = defaultManager.getAdvancedMetrics.bind(defaultManager);
export const getHealthStatus = defaultManager.getHealthStatus.bind(defaultManager);
export const createPulsers = defaultManager.createPulsers.bind(defaultManager);
export const destroyPulsers = defaultManager.destroyPulsers.bind(defaultManager);
export const gracefulShutdown = defaultManager.gracefulShutdown.bind(defaultManager);
export const Pulsor = (alias) => new Pulser(alias, defaultManager);
