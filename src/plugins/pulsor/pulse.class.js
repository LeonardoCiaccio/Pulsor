import { Logger } from './logger.class.js';

/**
 * Base class for pulse functionality with common validation and logging.
 * @abstract
 */
class PulseBase {

  #alias = 'default';
  _console = null;
  _pulser = () => { };

  /**
   * Creates an instance of BasePulse.
   * @param {string} prefix - The prefix for logging messages.
   * @param {string} alias - The alias for this pulse instance.
   * @param {Function} pulser - The pulser function to execute.
   * @param {Object} [loggerServices={}] - Configuration for logger services.
   */
  constructor(prefix, alias, pulser, loggerServices = {}) {

    this.#alias = this.#validateAlias(alias);
    this._console = new Logger(`${prefix}(${this.#alias})`, loggerServices);

    this._pulser = this.#validatePulser(pulser);
    this._console.log('Instance created');

  };

  /**
   * Formats a message with the current prefix and alias.
   * @param {string} message - The message to format.
   * @returns {string} The formatted message.
   */
  #format(message) {
    return `${this._console?.format?.(message) ?? message}`;
  };

  /**
   * Validates and trims the alias.
   * @param {string} alias - The alias to validate.
   * @returns {string} The validated alias.
   * @throws {Error} If alias is empty or contains only whitespace.
   */
  #validateAlias(alias) {
    const aliasTrimmed = (alias || '').trim();

    if (aliasTrimmed.length === 0) {
      throw new Error(this.#format('Alias cannot be empty or contain only whitespace'));
    }

    return aliasTrimmed;
  };

  /**
   * Validates that the pulser is a function.
   * @param {Function} pulser - The pulser to validate.
   * @returns {Function} The validated pulser.
   * @throws {Error} If pulser is not a function.
   */
  #validatePulser(pulser) {
    if (typeof pulser !== 'function') {
      throw new Error(this.#format('Pulser must be a function'));
    }
    return pulser;
  };

};

/**
 * Synchronous pulse class for executing functions.
 */
export class Pulse extends PulseBase {

  /**
   * Creates an instance of Pulse.
   * @param {string} alias - The alias for this pulse instance.
   * @param {Function} pulser - The pulser function to execute.
   * @param {Object} [loggerServices={}] - Configuration for logger services.
   */
  constructor(alias, pulser, loggerServices = {}) {
    super('[Pulse]', alias, pulser, loggerServices);
  }

  /**
   * Emits the pulser with the provided arguments.
   * @param {...*} args - Arguments to pass to the pulser.
   */
  emit(...args) {
    this._pulser(...args);
    this._console.log('Pulser emitted');
  }
};

/**
 * Asynchronous pulse class for executing async functions.
 */
export class PulseAsync extends PulseBase {

  /**
   * Creates an instance of PulseAsync.
   * @param {string} alias - The alias for this pulse instance.
   * @param {Function} pulserAsync - The async pulser function to execute.
   * @param {Object} [loggerServices={}] - Configuration for logger services.
   */
  constructor(alias, pulserAsync, loggerServices = {}) {
    super('[PulseAsync]', alias, pulserAsync, loggerServices);
  }

  /**
   * Emits the async pulser with the provided arguments.
   * @param {...*} args - Arguments to pass to the pulser.
   * @returns {Promise<void>} A promise that resolves when the pulser completes.
   */
  async emit(...args) {
    await this._pulser(...args);
    this._console.log('Pulser emitted asynchronously');
  }
};
