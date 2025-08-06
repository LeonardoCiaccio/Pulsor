
/**
 * Represents a Logger utility class.
 * Provides methods for logging messages with a custom prefix and enabling/disabling logging.
 */
export class Logger {

  /**
   * @private
   * @type {string}
   * The prefix to prepend to all log messages.
   */
  #prefix = '[Logger]';

  /**
   * @private
   * @type {Object<string, boolean>}
   * Stores the enabled state for each log level (log, debug, info, warn, error).
   */
  #services = {
    log: false,
    debug: false,
    info: false,
    warn: false,
    error: false
  };

  /**
   * @private
   * Handles the actual console logging.
   * @param {*} logged - The content to log.
   * @param {string} type - The console method to use (e.g., 'log', 'warn', 'error').
   */
  #console(logged, type) {
    // Check if the service type exists in #services and is enabled.
    if (Object.prototype.hasOwnProperty.call(this.#services, type) && this.#services[type]) {
      console[type](`${this.#prefix}: `, logged);
    }
  };


  /**
   * @private
   * Validates the provided prefix.
   * @param {string} prefix - The prefix to validate.
   * @returns {string} The validated prefix.
   * @throws {Error} If the prefix is empty or contains only whitespace.
   */
  #validatePrefix(prefix) {
    const trimmedPrefix = (prefix || '').trim();

    if (trimmedPrefix.length === 0) {
      throw new Error('Prefix cannot be empty or contain only whitespace');
    }

    return trimmedPrefix;
  };



  /**
   * Creates an instance of Logger.
   * @param {string} prefix - The prefix to use for all log messages.
   * @param {Object<string, boolean>} [services={}] - An object to configure initial service enablement.
   */
  constructor(prefix, services = {}) {
    this.#prefix = this.#validatePrefix(prefix);
    this.services(services);
    // Dynamically assign logging methods (log, debug, info, warn, error) based on #services keys.
    for (const type of Object.keys(this.#services)) {
      this[type] = (logged) => this.#console(logged, type);
    }
  }

  /**
   * Configures the logging services (log, debug, info, warn, error).
   * Only boolean values are considered for enabling/disabling services.
   * @param {Object<string, boolean>} [services={}] - An object containing service names as keys and boolean values.
   * @throws {Error} If the provided services parameter is not an object.
   */
  services(services = {}) {
    if (typeof services !== 'object' || services === null) {
      throw new Error(this.format('Services must be an object'));
    }

    for (const key of Object.keys(services)) {
      // Only update if the provided service key exists and its value is strictly a boolean.
      if (typeof services[key] === 'boolean') {
        this.#services[key] = services[key];
      }
    }
  }

  /**
   * Formats a given message using the logger's prefix.
   * @param {string} message - The message to format.
   * @returns {string} The formatted message.
   */
  format(message) {
    const trimmedMessage = (message || '').toString().trim();

    if (trimmedMessage.length === 0) {
      throw new Error(this.format('Format message cannot be empty or contain only whitespace'));
    }
    return `${this.#prefix}: ${message}`;
  };

};
