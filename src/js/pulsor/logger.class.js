
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
  #console(type, ...args) {
    // Check if the service type exists in #services and is enabled.
    if (Object.prototype.hasOwnProperty.call(this.#services, type) && this.#services[type]) {
      console[type](`${this.#prefix}: `, ...args);
    }
  };

  /**
   * Creates an instance of Logger.
   * @param {string} validatedPrefix - The prefix to use for log messages. This value is assumed to be already validated.
   * @param {Object<string, boolean>} [validatedServices={}] - An object specifying the initial enabled state for each log level. This value is assumed to be already validated.
   */
  constructor(validatedPrefix, validatedServices = {}) {
    this.#prefix = validatedPrefix;
    this.services(validatedServices);
    // Dynamically assign logging methods (log, debug, info, warn, error) based on #services keys.
    // This allows calling logger.log(), logger.debug(), etc., which internally call #console.
    for (const type of Object.keys(this.#services)) {
      this[type] = (...args) => this.#console(type, ...args);
    }
  };

  /**
   * Sets the enabled state for various logging services (log, debug, info, warn, error).
   * Only boolean values are accepted for enabling/disabling services.
   * @param {Object<string, boolean>} [validatedServices={}] - An object where keys are service names and values are booleans indicating enabled/disabled state. This value is assumed to be already validated.
   * @returns {void}
   */
  services(validatedServices = {}) {
    for (const key of Object.keys(validatedServices)) {
      const tKey = key.trim().toLowerCase();
      // Ignore the 'debug' service.
      if (tKey === 'debug') {
        continue;
      }
      // Ensure that the provided service key is a valid property and its value is a boolean.
      if (Object.prototype.hasOwnProperty.call(this.#services, tKey) && typeof validatedServices[tKey] === 'boolean') {
        this.#services[tKey] = !!validatedServices[tKey];
      }
    }
  };

  /**
   * Formats a message by prepending the logger's prefix.
   * @param {string} validatedMessage - The message to format. This value is assumed to be already validated.
   * @returns {string} The formatted message.
   */
  format(validatedMessage) {
    return `${this.#prefix}: ${validatedMessage}`;
  };

};
