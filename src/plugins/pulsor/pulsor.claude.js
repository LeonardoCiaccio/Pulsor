/**
 * Pulsor Module - Event-driven function execution system
 *
 * A lightweight module for managing named function executors (pulsers) with callback support.
 * Supports both synchronous and asynchronous operations with binding/unbinding capabilities.
 *
 * @example
 * import { CreatePulser, Pulsor } from './pulsor.js';
 *
 * // Create a pulser
 * CreatePulser('math', (a, b) => a + b);
 *
 * // Use the pulser
 * const calculator = new Pulsor('math');
 * const result = calculator.Pulse(5, 3); // Returns 8
 */

import { Logger } from './logger.class.js';

/**
 * Custom error class for Pulsor-specific errors
 */
class PulsorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PulsorError';
  }
}

// Module constants and internal state
const Prefix = '[Pulsor]';
const Pulsers = Object.create(null); // Use null prototype for better performance
const PulsersAsync = Object.create(null);
const Callbacks = Object.create(null);
const CallbacksAsync = Object.create(null);

const LoggerServices = {
  log: true,
  error: true,
  warn: true,
  debug: true,
  info: true
};

const Loggy = new Logger(Prefix, LoggerServices);
const F = Loggy.format;

// Private validation functions
/**
 * Validates and trims alias string
 * @param {string} alias - The alias to validate
 * @returns {string} Validated and trimmed alias
 * @throws {PulsorError} If alias is invalid
 */
const validateAlias = (alias) => {
  if (typeof alias !== 'string') {
    throw new PulsorError(F('Alias must be a string'));
  }

  const trimmedAlias = alias.trim();
  if (trimmedAlias.length === 0 || trimmedAlias.length > 32) {
    throw new PulsorError(F('Alias cannot be empty or longer than 32 characters'));
  }
  return trimmedAlias;
};

/**
 * Validates that pulse is a function
 * @param {Function} pulse - The function to validate
 * @returns {Function} The validated function
 * @throws {PulsorError} If pulse is not a function
 */
const validatePulse = (pulse) => {
  if (typeof pulse !== 'function') {
    throw new PulsorError(F('Pulser/PulserAsync must be a function'));
  }
  return pulse;
};

/**
 * Validates that callback is a function
 * @param {Function} callback - The callback to validate
 * @returns {Function} The validated callback
 * @throws {PulsorError} If callback is not a function
 */
const validateCallback = (callback) => {
  if (typeof callback !== 'function') {
    throw new PulsorError(F('Callback/CallbackAsync must be a function'));
  }
  return callback;
};

/**
 * Ensures callback array exists for given alias
 * @param {string} aliasValidated - The validated alias
 * @param {Object} callbacksDb - The callbacks database (Callbacks or CallbacksAsync)
 * @returns {Array} The callback array
 */
const ensureCallbackArray = (aliasValidated, callbacksDb) => {
  if (!Array.isArray(callbacksDb[aliasValidated])) {
    callbacksDb[aliasValidated] = [];
  }
  return callbacksDb[aliasValidated];
};

// Private utility functions
/**
 * Checks if pulser exists in database
 * @param {string} aliasValidated - Validated alias
 * @param {Object} pulsersDb - Pulsers database
 * @returns {boolean} True if pulser exists
 */
const pulserExists = (aliasValidated, pulsersDb) => {
  return aliasValidated in pulsersDb;
};

/**
 * Creates a new pulser in the database
 * @param {string} aliasValidated - Validated alias
 * @param {Function} pulseValidated - Validated pulse function
 * @param {Object} pulsersDb - Target pulsers database
 * @param {boolean} override - Whether to override existing pulser
 * @throws {PulsorError} If pulser already exists and override is false
 */
const createPulser = (aliasValidated, pulseValidated, pulsersDb, override = false) => {
  if (pulserExists(aliasValidated, pulsersDb)) {
    if (override) {
      pulsersDb[aliasValidated] = pulseValidated;
      Loggy.log(`Pulser '${aliasValidated}' already exists, overridden`);
      return;
    } else {
      throw new PulsorError(F(`Pulser '${aliasValidated}' already exists`));
    }
  }

  pulsersDb[aliasValidated] = pulseValidated;
  Loggy.log(`Pulser '${aliasValidated}' created`);
};

/**
 * Destroys a pulser from the database
 * @param {string} aliasValidated - Validated alias
 * @param {Object} pulsersDb - Target pulsers database
 * @param {Object} callbacksDb - Associated callbacks database
 * @throws {PulsorError} If pulser doesn't exist
 */
const destroyPulser = (aliasValidated, pulsersDb, callbacksDb) => {
  if (!pulserExists(aliasValidated, pulsersDb)) {
    throw new PulsorError(F(`Pulser '${aliasValidated}' does not exist`));
  }

  delete pulsersDb[aliasValidated];
  delete callbacksDb[aliasValidated]; // Clean up associated callbacks

  Loggy.log(`Pulser '${aliasValidated}' destroyed`);
};

// Public API functions

/**
 * Creates a synchronous pulser
 * @param {string} alias - Unique identifier for the pulser (max 32 chars)
 * @param {Function} pulse - Function to execute when pulsed
 * @param {boolean} [override=false] - Whether to override existing pulser
 * @throws {PulsorError} If alias is invalid, pulse is not a function, or pulser already exists
 *
 * @example
 * CreatePulser('add', (a, b) => a + b);
 * CreatePulser('greet', (name) => `Hello, ${name}!`);
 * CreatePulser('existing', () => 'new', true); // Override existing
 */
const CreatePulser = (alias, pulse, override = false) => {
  const aliasValidated = validateAlias(alias);
  const pulseValidated = validatePulse(pulse);

  createPulser(aliasValidated, pulseValidated, Pulsers, override);
  ensureCallbackArray(aliasValidated, Callbacks);
};

/**
 * Destroys a synchronous pulser and its callbacks
 * @param {string} alias - Pulser alias to destroy
 * @throws {PulsorError} If alias is invalid or pulser doesn't exist
 *
 * @example
 * DestroyPulser('add');
 */
const DestroyPulser = (alias) => {
  const aliasValidated = validateAlias(alias);
  destroyPulser(aliasValidated, Pulsers, Callbacks);
};

/**
 * Creates an asynchronous pulser
 * @param {string} alias - Unique identifier for the pulser (max 32 chars)
 * @param {Function} pulseAsync - Async function to execute when pulsed
 * @param {boolean} [override=false] - Whether to override existing pulser
 * @throws {PulsorError} If alias is invalid, pulse is not a function, or pulser already exists
 *
 * @example
 * CreatePulserAsync('fetchData', async (url) => {
 *   const response = await fetch(url);
 *   return response.json();
 * });
 */
const CreatePulserAsync = (alias, pulseAsync, override = false) => {
  const aliasValidated = validateAlias(alias);
  const pulseAsyncValidated = validatePulse(pulseAsync);

  createPulser(aliasValidated, pulseAsyncValidated, PulsersAsync, override);
  ensureCallbackArray(aliasValidated, CallbacksAsync);
};

/**
 * Destroys an asynchronous pulser and its callbacks
 * @param {string} alias - Pulser alias to destroy
 * @throws {PulsorError} If alias is invalid or pulser doesn't exist
 *
 * @example
 * DestroyPulserAsync('fetchData');
 */
const DestroyPulserAsync = (alias) => {
  const aliasValidated = validateAlias(alias);
  destroyPulser(aliasValidated, PulsersAsync, CallbacksAsync);
};

/**
 * Pulsor class - Interface for executing pulsers and managing callbacks
 *
 * @example
 * const calculator = new Pulsor('math');
 * calculator.BindPulse((a, b) => console.log(`Computing ${a} + ${b}`));
 * const result = calculator.Pulse(5, 3); // Logs and returns 8
 */
const Pulsor = function (alias) {
  const aliasValidated = validateAlias(alias);

  /**
   * Executes the synchronous pulser with given arguments
   * @param {...any} args - Arguments to pass to the pulser and callbacks
   * @returns {any} Result of the pulser execution
   * @throws {PulsorError} If pulser doesn't exist
   *
   * @example
   * const result = pulsor.Pulse(1, 2, 3);
   */
  this.Pulse = (...args) => {
    const pulser = Pulsers[aliasValidated];
    if (pulser === undefined) {
      throw new PulsorError(F(`Pulser '${aliasValidated}' does not exist`));
    }

    const result = pulser(...args);
    const callbackItems = Callbacks[aliasValidated];

    if (Array.isArray(callbackItems) && callbackItems.length > 0) {
      // Use for loop for better performance than forEach
      for (let i = 0; i < callbackItems.length; i++) {
        try {
          callbackItems[i](...args);
        } catch (error) {
          Loggy.warn(`Callback error in '${aliasValidated}':`, error.message);
        }
      }
    }

    return result;
  };

  /**
   * Executes the asynchronous pulser with given arguments
   * @param {...any} args - Arguments to pass to the pulser and callbacks
   * @returns {Promise<any>} Promise resolving to the pulser result
   * @throws {PulsorError} If pulser doesn't exist
   *
   * @example
   * const result = await pulsor.PulseAsync('https://api.example.com/data');
   */
  this.PulseAsync = async (...args) => {
    const pulsorAsync = PulsersAsync[aliasValidated];
    if (pulsorAsync === undefined) {
      throw new PulsorError(F(`PulserAsync '${aliasValidated}' does not exist`));
    }

    const result = await pulsorAsync(...args);
    const callbackItems = CallbacksAsync[aliasValidated];

    if (Array.isArray(callbackItems) && callbackItems.length > 0) {
      // Execute callbacks in parallel with error handling
      const callbackPromises = callbackItems.map(callback =>
        Promise.resolve(callback(...args)).catch(error => {
          Loggy.warn(`Async callback error in '${aliasValidated}':`, error.message);
        })
      );
      await Promise.allSettled(callbackPromises);
    }

    return result;
  };

  /**
   * Binds a callback to synchronous pulse execution
   * @param {Function} callback - Callback function to bind
   * @throws {PulsorError} If callback is not a function or already bound
   *
   * @example
   * pulsor.BindPulse((result) => console.log('Result:', result));
   */
  this.BindPulse = (callback) => {
    const callbackValidated = validateCallback(callback);
    const callbackItems = ensureCallbackArray(aliasValidated, Callbacks);

    if (callbackItems.includes(callbackValidated)) {
      throw new PulsorError(F(`Callback already bound to '${aliasValidated}'`));
    }

    callbackItems.push(callbackValidated);
    Loggy.log(`Callback added to '${aliasValidated}'`);
  };

  /**
   * Binds a callback to asynchronous pulse execution
   * @param {Function} callbackAsync - Async callback function to bind
   * @throws {PulsorError} If callback is not a function or already bound
   *
   * @example
   * pulsor.BindPulseAsync(async (result) => {
   *   await saveToDatabase(result);
   * });
   */
  this.BindPulseAsync = (callbackAsync) => {
    const callbackAsyncValidated = validateCallback(callbackAsync);
    const callbackItems = ensureCallbackArray(aliasValidated, CallbacksAsync);

    if (callbackItems.includes(callbackAsyncValidated)) {
      throw new PulsorError(F(`CallbackAsync already bound to '${aliasValidated}'`));
    }

    callbackItems.push(callbackAsyncValidated);
    Loggy.log(`CallbackAsync added to '${aliasValidated}'`);
  };

  /**
   * Unbinds a specific callback from synchronous pulse execution
   * @param {Function} callback - Callback function to unbind
   *
   * @example
   * const myCallback = () => console.log('Called');
   * pulsor.BindPulse(myCallback);
   * pulsor.UnBindPulse(myCallback);
   */
  this.UnBindPulse = (callback) => {
    const callbackValidated = validateCallback(callback);
    const callbackItems = Callbacks[aliasValidated];

    if (Array.isArray(callbackItems)) {
      const index = callbackItems.indexOf(callbackValidated);
      if (index !== -1) {
        callbackItems.splice(index, 1);
        Loggy.log(`Callback removed from '${aliasValidated}'`);
      }
    }
  };

  /**
   * Unbinds a specific callback from asynchronous pulse execution
   * @param {Function} callbackAsync - Async callback function to unbind
   *
   * @example
   * const myAsyncCallback = async () => await doSomething();
   * pulsor.BindPulseAsync(myAsyncCallback);
   * pulsor.UnBindPulseAsync(myAsyncCallback);
   */
  this.UnBindPulseAsync = (callbackAsync) => {
    const callbackAsyncValidated = validateCallback(callbackAsync);
    const callbackItems = CallbacksAsync[aliasValidated];

    if (Array.isArray(callbackItems)) {
      const index = callbackItems.indexOf(callbackAsyncValidated);
      if (index !== -1) {
        callbackItems.splice(index, 1);
        Loggy.log(`CallbackAsync removed from '${aliasValidated}'`);
      }
    }
  };

  /**
   * Unbinds all callbacks from synchronous pulse execution
   *
   * @example
   * pulsor.UnbindAllPulses();
   */
  this.UnbindAllPulses = () => {
    if (Callbacks[aliasValidated]) {
      Callbacks[aliasValidated].length = 0; // Clear array efficiently
      Loggy.log(`All callbacks removed from '${aliasValidated}'`);
    }
  };

  /**
   * Unbinds all callbacks from asynchronous pulse execution
   *
   * @example
   * pulsor.UnbindAllPulsesAsync();
   */
  this.UnbindAllPulsesAsync = () => {
    if (CallbacksAsync[aliasValidated]) {
      CallbacksAsync[aliasValidated].length = 0; // Clear array efficiently
      Loggy.log(`All callbacksAsync removed from '${aliasValidated}'`);
    }
  };
};

export { CreatePulser, DestroyPulser, CreatePulserAsync, DestroyPulserAsync, Pulsor, PulsorError };
