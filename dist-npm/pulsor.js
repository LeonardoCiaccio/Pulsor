/**
 * Pulsor Module - A Unified, Event-driven Function Execution System
 *
 * A lightweight and robust module for managing named function executors (pulsers).
 * It provides a unified API for both synchronous and asynchronous operations,
 * complete with a powerful callback system. The design emphasizes simplicity,
 * performance, and maintainability.
 *
 * @version 2.3.1
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
    throw new PulsorError(Loggy.format('Alias must be a string.'));
  }

  // Check cache first
  if (aliasCache.has(alias)) {
    return aliasCache.get(alias);
  }

  const trimmedAlias = alias.trim();
  if (trimmedAlias.length === 0 || trimmedAlias.length > 32) {
    throw new PulsorError(Loggy.format('Alias cannot be empty or longer than 32 characters.'));
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
 * Validates and normalizes function inputs for Pulsor operations.
 * This function provides defensive programming by handling edge cases gracefully.
 *
 * @param {Function|null|undefined} fn - The function to validate and normalize.
 * @param {string} [type='Function'] - The type name used in error messages for better debugging.
 * @returns {Function} A validated function - either the original or a safe no-op function.
 * @throws {PulsorError} If fn is not a function, null, or undefined.
 *
 * @example
 * // Valid function passes through unchanged
 * const validFn = validateFunction(() => 'hello');
 *
 * @example
 * // null/undefined becomes a no-op function
 * const noOpFn = validateFunction(null); // Returns () => {}
 *
 * @example
 * // Invalid types throw errors
 * validateFunction('not a function'); // Throws PulsorError
 *
 * @private
 */
const validateFunction = (fn, type = 'Function') => {
  // Handle null/undefined gracefully by providing a safe no-op function
  // This prevents runtime errors when optional functions are not provided
  if (fn === null || fn === undefined) {
    fn = () => { }; // Return empty function as safe default
  }
  // Strict type checking for all other values
  // This ensures type safety and prevents unexpected behavior
  else if (typeof fn !== 'function') {
    throw new PulsorError(Loggy.format(`${type} must be a function.`));
  }

  // Return the validated/normalized function
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
 * Sets the logging level for the Pulsor module
 * @param {Object} logLevels - An object where keys are logging levels ('error', 'warn', 'info', 'log') and values are boolean-coercible to enable/disable them. The 'debug' level will be ignored if present.
 * @throws {Error} If any provided level is not a valid logging level (excluding 'debug').
 * @example
 * // Enable error and info logging
 * setLoggy({ error: true, info: true });
 *
 * // Disable warn logging
 * setLoggy({ warn: false });
 *
 * // Debug level will be ignored
 * setLoggy({ debug: true, warn: true });
 */
export const SetLoggy = (logLevels) => {

  if (typeof logLevels !== 'object' || logLevels === null) {
    throw new Error('Log levels must be an object.');
  }

  // Update the logger services with the new configuration, Loggy class will handle the rest
  Loggy.services(logLevels);
};

/**
 * Creates and registers a new pulser.
 * @param {string} alias - A unique identifier for the pulser (max 32 chars).
 * @param {Function} pulseFn - The function to execute when pulsed. Can be sync or async.
 * @param {object} [options={}] - Configuration options for the pulser.
 * @param {boolean} [options.override=false] - If true, an existing pulser with the same alias will be overwritten.
 * @param {boolean} [options.isAsync] - If specified, forces async/sync mode. If not specified, auto-detects from function.
 * @returns {Pulser} A new Pulser instance ready for immediate use.
 * @throws {PulsorError} If validation fails or if the pulser already exists and `override` is false.
 *
 * @example
 * // Synchronous pulser - returns instance for immediate use
 * const greeter = CreatePulser('greeter', (name) => `Hello, ${name}!`);
 * const message = greeter.pulse('World'); // "Hello, World!"
 *
 * // Asynchronous pulser (auto-detected)
 * const delay = CreatePulser('delay', async (ms) => new Promise(res => setTimeout(res, ms)));
 * await delay.pulse(1000); // Waits 1 second
 *
 * // Force sync mode for async function
 * const forceSync = CreatePulser('forceSync', async () => 'immediate', { isAsync: false });
 *
 * // Override an existing pulser
 * const newGreeter = CreatePulser('greeter', (name) => `Hi, ${name}!`, { override: true });
 */
export const CreatePulser = (alias, pulseFn, options = {}) => {
  const { override = false, isAsync } = options;
  const aliasValidated = validateAlias(alias);
  const pulseValidated = validateFunction(pulseFn, 'Pulser function');

  if (aliasValidated in Registry) {
    if (override) {
      Loggy.log(`Pulser '${aliasValidated}' already exists. Overriding.`);
    } else {
      throw new PulsorError(Loggy.format(`Pulser '${aliasValidated}' already exists. Use { override: true } to replace it.`));
    }
  }

  // Auto-detect async if not specified
  // Support both AsyncFunction and AsyncGeneratorFunction
  const isAsyncResolved = isAsync !== undefined
    ? isAsync
    : ['AsyncFunction', 'AsyncGeneratorFunction'].includes(pulseValidated.constructor.name);

  Registry[aliasValidated] = createPulserEntry(pulseValidated, isAsyncResolved);

  Loggy.log(`Pulser '${aliasValidated}' (${isAsyncResolved ? 'async' : 'sync'}) created.`);

  // Return an instantiated Pulser for immediate use
  return new Pulser(aliasValidated);
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
    throw new PulsorError(Loggy.format(`Pulser '${aliasValidated}' does not exist.`));
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
 * Factory function to create a Pulser instance without using the 'new' keyword.
 * This provides a more functional programming approach and cleaner syntax.
 *
 * @param {string} alias - The alias of the pulser to control.
 * @returns {Pulser} A new Pulser instance for the specified alias.
 * @throws {PulsorError} If no pulser with the given alias is found.
 *
 * @example
 * // Instead of: const myPulser = new Pulser('my-alias');
 * const myPulser = Pulsor('my-alias');
 * myPulser.pulse('data');
 *
 * @example
 * // Functional chaining style
 * Pulsor('calculator')
 *   .bind(result => console.log('Result:', result))
 *   .pulse(10, 5);
 */
// Factory wrapper to avoid using 'new' keyword with Pulser class
export const Pulsor = (alias) => {
  // Delegate to the Pulser class constructor
  return new Pulser(alias);
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
      throw new PulsorError(Loggy.format(`Cannot create Pulsor instance. Pulser '${this.#alias}' is not registered.`));
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
      throw new PulsorError(Loggy.format(`Callback is already bound to '${this.#alias}'.`));
    }

    this.#entry.callbacks.add(callback);
    Loggy.log(`Callback added to '${this.#alias}'.`);
    return this;
  };

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
  };

  /**
   * Binds multiple callback functions that will be executed after the main pulser function.
   * Each callback in the array will be bound individually.
   * @param {Function[]} callbacks - Array of callback functions to bind.
   * @throws {PulsorError} If any callback is not a function or is already bound.
   *
   * @example
   * const callbacks = [
   *   (...args) => console.log('First callback:', args),
   *   (...args) => console.log('Second callback:', args)
   * ];
   * myPulsor.binds(callbacks);
   */
  binds(callbacks) {
    if (!Array.isArray(callbacks)) {
      throw new PulsorError(Loggy.format(`Expected array of callbacks for '${this.#alias}', got ${typeof callbacks}.`));
    }

    callbacks.forEach((callback, index) => {
      try {
        this.bind(callback);
      } catch (error) {
        throw new PulsorError(Loggy.format(`Error binding callback at index ${index} for '${this.#alias}': ${error.message}`));
      }
    });

    return this;
  };

  /**
   * Unbinds multiple callback functions.
   * @param {Function[]} callbacks - Array of callback functions to unbind.
   * @returns {number} Number of callbacks that were successfully removed.
   *
   * @example
   * const removedCount = myPulsor.unbinds([callback1, callback2]);
   * console.log(`Removed ${removedCount} callbacks`);
   */
  unbinds(callbacks) {
    if (!Array.isArray(callbacks)) {
      throw new PulsorError(Loggy.format(`Expected array of callbacks for '${this.#alias}', got ${typeof callbacks}.`));
    }

    let removedCount = 0;
    callbacks.forEach(callback => {
      if (this.unbind(callback)) {
        removedCount++;
      }
    });

    return removedCount;
  };

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
