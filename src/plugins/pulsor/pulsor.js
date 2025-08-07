/**
 * Pulsor Module - A Unified, Event-driven Function Execution System
 *
 * A lightweight and robust module for managing named function executors (pulsers).
 * It provides a unified API for both synchronous and asynchronous operations,
 * complete with a powerful callback system. The design emphasizes simplicity,
 * performance, and maintainability.
 *
 * @version 2.1.0
 * @example
 * import { CreatePulser, Pulser } from './pulsor.refactored.js';
 *
 * // Create a synchronous pulser
 * CreatePulser('add', (a, b) => a + b);
 *
 * // Create an asynchronous pulser
 * CreatePulser('fetchData', async (url) => {
 *   const response = await fetch(url);
 *   return response.json();
 * }, { isAsync: true });
 *
 * // Use a pulser
 * const mathPulsor = new Pulser('add');
 * const result = mathPulsor.pulse(5, 3); // result is 8
 *
 * const dataPulsor = new Pulser('fetchData');
 * const data = await dataPulsor.pulse('https://api.example.com/data');
 */

import { Logger } from './logger.class.js';

/**
 * Custom error class for Pulsor-specific errors.
 */
class PulsorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PulsorError';
  }
}

// --- Module-level constants and state ---

const Prefix = '[Pulsor]';

/**
 * The central registry for all pulsers. Using a null-prototype object for performance
 * and to prevent potential prototype chain conflicts.
 * @type {Object.<string, {pulseFn: Function, isAsync: boolean, callbacks: Set<Function>}>}
 */
const Registry = Object.create(null);

const LoggerServices = { log: true, error: true, warn: true, debug: false, info: true };
const Loggy = new Logger(Prefix, LoggerServices);
const F = Loggy.format;

// Cache for validated aliases to avoid repeated validation
const aliasCache = new Map();
const ALIAS_CACHE_MAX_SIZE = 100; // Prevent memory leaks

// --- Private validation functions ---

/**
 * Validates and trims an alias string with caching for performance.
 * @param {string} alias - The alias to validate.
 * @returns {string} The validated and trimmed alias.
 * @throws {PulsorError} If the alias is invalid.
 * @private
 */
const validateAlias = (alias) => {
  if (typeof alias !== 'string') {
    throw new PulsorError(F('Alias must be a string.'));
  }

  // Check cache first
  if (aliasCache.has(alias)) {
    return aliasCache.get(alias);
  }

  const trimmedAlias = alias.trim();
  if (trimmedAlias.length === 0 || trimmedAlias.length > 32) {
    throw new PulsorError(F('Alias cannot be empty or longer than 32 characters.'));
  }

  // Cache the result (with size limit)
  if (aliasCache.size >= ALIAS_CACHE_MAX_SIZE) {
    // Remove oldest entry (FIFO)
    const firstKey = aliasCache.keys().next().value;
    aliasCache.delete(firstKey);
  }
  aliasCache.set(alias, trimmedAlias);

  return trimmedAlias;
};

/**
 * Validates that the provided pulse is a function.
 * @param {Function} fn - The function to validate.
 * @param {string} type - The type name for error messages.
 * @returns {Function} The validated function.
 * @throws {PulsorError} If fn is not a function.
 * @private
 */
const validateFunction = (fn, type = 'Function') => {
  if (typeof fn !== 'function') {
    throw new PulsorError(F(`${type} must be a function.`));
  }
  return fn;
};

/**
 * Creates a new pulser entry with optimized structure.
 * @param {Function} pulseFn - The pulser function.
 * @param {boolean} isAsync - Whether the pulser is asynchronous.
 * @returns {Object} The pulser entry.
 * @private
 */
const createPulserEntry = (pulseFn, isAsync) => ({
  pulseFn,
  isAsync,
  callbacks: new Set(),
  // Pre-calculate execution strategy to avoid runtime checks
  executeCallbacks: isAsync ? executeCallbacksAsync : executeCallbacksSync
});

/**
 * Executes synchronous callbacks with error handling.
 * @param {Set<Function>} callbacks - The callbacks to execute.
 * @param {Array} args - Arguments to pass.
 * @param {string} alias - Alias for logging.
 * @private
 */
const executeCallbacksSync = (callbacks, args, alias) => {
  for (const callback of callbacks) {
    try {
      callback(...args);
    } catch (error) {
      Loggy.warn(`Sync callback error in '${alias}':`, error.message);
    }
  }
};

/**
 * Executes asynchronous callbacks with error handling.
 * @param {Set<Function>} callbacks - The callbacks to execute.
 * @param {Array} args - Arguments to pass.
 * @param {string} alias - Alias for logging.
 * @returns {Promise<void>}
 * @private
 */
const executeCallbacksAsync = async (callbacks, args, alias) => {
  if (callbacks.size === 0) return;

  const promises = Array.from(callbacks, callback =>
    Promise.resolve(callback(...args)).catch(error => {
      Loggy.warn(`Async callback error in '${alias}':`, error.message);
    })
  );

  await Promise.allSettled(promises);
};

// --- Public API Functions ---

/**
 * Creates and registers a new pulser.
 * @param {string} alias - A unique identifier for the pulser (max 32 chars).
 * @param {Function} pulseFn - The function to execute when pulsed. Can be sync or async.
 * @param {object} [options={}] - Configuration options for the pulser.
 * @param {boolean} [options.override=false] - If true, an existing pulser with the same alias will be overwritten.
 * @param {boolean} [options.isAsync] - If specified, forces async/sync mode. If not specified, auto-detects from function.
 * @throws {PulsorError} If validation fails or if the pulser already exists and `override` is false.
 *
 * @example
 * // Synchronous pulser
 * CreatePulser('greeter', (name) => `Hello, ${name}!`);
 *
 * // Asynchronous pulser (auto-detected)
 * CreatePulser('delay', async (ms) => new Promise(res => setTimeout(res, ms)));
 *
 * // Force sync mode for async function
 * CreatePulser('forceSync', async () => 'immediate', { isAsync: false });
 *
 * // Override an existing pulser
 * CreatePulser('greeter', (name) => `Hi, ${name}!`, { override: true });
 */
export const CreatePulser = (alias, pulseFn, options = {}) => {
  const { override = false, isAsync } = options;
  const aliasValidated = validateAlias(alias);
  const pulseValidated = validateFunction(pulseFn, 'Pulser function');

  if (aliasValidated in Registry) {
    if (override) {
      Loggy.log(`Pulser '${aliasValidated}' already exists. Overriding.`);
    } else {
      throw new PulsorError(F(`Pulser '${aliasValidated}' already exists. Use { override: true } to replace it.`));
    }
  }

  // Auto-detect async if not specified
  const isAsyncResolved = isAsync !== undefined
    ? isAsync
    : pulseValidated.constructor.name === 'AsyncFunction';

  Registry[aliasValidated] = createPulserEntry(pulseValidated, isAsyncResolved);

  Loggy.log(`Pulser '${aliasValidated}' (${isAsyncResolved ? 'async' : 'sync'}) created.`);
};

/**
 * Destroys a pulser and all its associated callbacks from the registry.
 * @param {string} alias - The alias of the pulser to destroy.
 * @throws {PulsorError} If the pulser does not exist.
 *
 * @example
 * DestroyPulser('greeter');
 */
export const DestroyPulser = (alias) => {
  const aliasValidated = validateAlias(alias);
  if (!(aliasValidated in Registry)) {
    throw new PulsorError(F(`Pulser '${aliasValidated}' does not exist.`));
  }

  delete Registry[aliasValidated];
  Loggy.log(`Pulser '${aliasValidated}' and all its callbacks have been destroyed.`);
};

/**
 * Checks if a pulser with the given alias exists in the registry.
 * @param {string} alias - The alias to check.
 * @returns {boolean} True if the pulser exists, false otherwise.
 *
 * @example
 * if (PulserExists('add')) {
 *   console.log('The add pulser is ready!');
 * }
 */
export const PulserExists = (alias) => {
  try {
    return validateAlias(alias) in Registry;
  } catch {
    return false;
  }
};

/**
 * Lists all registered pulser aliases.
 * @returns {string[]} Array of all registered aliases.
 *
 * @example
 * const pulsers = ListPulsers();
 * console.log('Available pulsers:', pulsers);
 */
export const ListPulsers = () => Object.keys(Registry);

/**
 * Gets information about a specific pulser.
 * @param {string} alias - The alias to get info for.
 * @returns {Object|null} Pulser info or null if not found.
 *
 * @example
 * const info = GetPulserInfo('add');
 * console.log(`Pulser 'add' is ${info.isAsync ? 'async' : 'sync'} with ${info.callbackCount} callbacks`);
 */
export const GetPulserInfo = (alias) => {
  try {
    const aliasValidated = validateAlias(alias);
    const entry = Registry[aliasValidated];
    if (!entry) return null;

    return {
      alias: aliasValidated,
      isAsync: entry.isAsync,
      callbackCount: entry.callbacks.size,
      functionName: entry.pulseFn.name || 'anonymous'
    };
  } catch {
    return null;
  }
};

/**
 * The Pulsor class provides an interface to interact with a registered pulser.
 * It is used to execute the pulser's main function and manage its callbacks.
 */
export class Pulser {
  /**
   * @private
   * @type {string}
   */
  #alias;

  /**
   * @private
   * @type {{pulseFn: Function, isAsync: boolean, callbacks: Set<Function>, executeCallbacks: Function}}
   */
  #entry;

  /**
   * Creates an instance of a Pulsor controller.
   * @param {string} alias - The alias of the pulser to control.
   * @throws {PulsorError} If no pulser with the given alias is found.
   */
  constructor(alias) {
    this.#alias = validateAlias(alias);
    this.#entry = Registry[this.#alias];

    if (!this.#entry) {
      throw new PulsorError(F(`Cannot create Pulsor instance. Pulser '${this.#alias}' is not registered.`));
    }
  }

  /**
   * Gets the alias of this pulser instance.
   * @returns {string} The pulser alias.
   */
  get alias() {
    return this.#alias;
  }

  /**
   * Gets whether this pulser is asynchronous.
   * @returns {boolean} True if async, false if sync.
   */
  get isAsync() {
    return this.#entry.isAsync;
  }

  /**
   * Gets the number of bound callbacks.
   * @returns {number} The callback count.
   */
  get callbackCount() {
    return this.#entry.callbacks.size;
  }

  /**
   * Executes the pulser's main function and subsequently all its bound callbacks.
   * If the pulser is asynchronous, this method returns a Promise.
   * Otherwise, it returns the result of the synchronous execution.
   *
   * @param {...any} args - Arguments to pass to the pulser's function and all its callbacks.
   * @returns {any | Promise<any>} The result of the pulser's function.
   *
   * @example
   * const calculator = new Pulser('add');
   * const sum = calculator.pulse(10, 5); // 15
   *
   * const fetcher = new Pulser('fetchData');
   * fetcher.pulse('https://...').then(data => console.log(data));
   */
  pulse(...args) {
    if (this.#entry.isAsync) {
      return this.#pulseAsync(...args);
    } else {
      return this.#pulseSync(...args);
    }
  }

  /** @private */
  #pulseSync(...args) {
    const result = this.#entry.pulseFn(...args);

    if (this.#entry.callbacks.size > 0) {
      this.#entry.executeCallbacks(this.#entry.callbacks, args, this.#alias);
    }

    return result;
  }

  /** @private */
  async #pulseAsync(...args) {
    const result = await this.#entry.pulseFn(...args);

    if (this.#entry.callbacks.size > 0) {
      await this.#entry.executeCallbacks(this.#entry.callbacks, args, this.#alias);
    }

    return result;
  }

  /**
   * Binds a callback function that will be executed after the main pulser function.
   * The same callback cannot be bound more than once.
   * @param {Function} callback - The callback function to bind.
   * @throws {PulsorError} If the callback is not a function or is already bound.
   *
   * @example
   * const loggerCallback = (...args) => console.log('Pulsed with:', args);
   * myPulsor.bind(loggerCallback);
   */
  bind(callback) {
    validateFunction(callback, 'Callback');
    if (this.#entry.callbacks.has(callback)) {
      throw new PulsorError(F(`Callback is already bound to '${this.#alias}'.`));
    }

    this.#entry.callbacks.add(callback);
    Loggy.log(`Callback added to '${this.#alias}'.`);
  }

  /**
   * Unbinds a specific callback function.
   * @param {Function} callback - The callback function to unbind.
   * @returns {boolean} True if the callback was found and removed, false otherwise.
   *
   * @example
   * const removed = myPulsor.unbind(loggerCallback);
   * if (removed) console.log('Callback successfully removed');
   */
  unbind(callback) {
    validateFunction(callback, 'Callback');
    const wasRemoved = this.#entry.callbacks.delete(callback);
    if (wasRemoved) {
      Loggy.log(`Callback removed from '${this.#alias}'.`);
    }
    return wasRemoved;
  }

  /**
   * Unbinds all callbacks from this pulser.
   * @returns {number} The number of callbacks that were removed.
   *
   * @example
   * const removedCount = myPulsor.unbindAll();
   * console.log(`Removed ${removedCount} callbacks`);
   */
  unbindAll() {
    const count = this.#entry.callbacks.size;
    if (count > 0) {
      this.#entry.callbacks.clear();
      Loggy.log(`All ${count} callbacks removed from '${this.#alias}'.`);
    }
    return count;
  }

  /**
   * Creates a bound version of the pulse method that can be called without context.
   * Useful for passing as a callback or event handler.
   *
   * @returns {Function} A bound pulse function.
   *
   * @example
   * const boundPulse = myPulsor.bound();
   * setTimeout(boundPulse, 1000, 'delayed', 'execution');
   */
  bound() {
    return this.pulse.bind(this);
  }
}

// Export the PulsorError class for consumers who might want to catch it specifically.
export { PulsorError };
