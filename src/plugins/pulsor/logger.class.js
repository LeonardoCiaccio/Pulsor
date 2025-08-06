/**
 * @file Logger class for consistent logging with customizable prefixes and levels.
 * @module Logger
 */

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
   * @type {boolean}
   * Indicates whether logging is currently enabled for the entire logger instance.
   */
  #enabled = true;

  /**
   * @private
   * @type {Object}
   * Stores the enabled state for each log level (log, debug, info, warn, error).
   */
  #services = {
    log: true,
    debug: true,
    info: true,
    warn: true,
    error: true
  };

  /**
   * @private
   * @type {Set<string>}
   * Valid log levels supported by the logger.
   */
  #validLogLevels = new Set(['log', 'debug', 'info', 'warn', 'error']);



  /**
   * @private
   * Logs a message to the console with a specified type (e.g., 'log', 'warn', 'error').
   * Logging is skipped if the logger is disabled.
   * @param {string} message - The message content to log.
   * @param {string} [type='log'] - The console method to use for logging (e.g., 'log', 'warn', 'error', 'info', 'debug').
   * @throws {Error} If the specified log type does not correspond to a valid console method.
   */
  #console(message, type = 'log') {
    // Validate message parameter
    if (message === null || message === undefined) {
      throw new Error(this.#format('Message cannot be null or undefined'));
    }

    // If logging is disabled, do nothing.
    if (!this.#enabled) {
      return;
    }

    // Normalize the log type string (remove spaces, convert to lowercase).
    let normalizedType = this.#normalizeString(type);
    // Default to 'log' if the normalized type is empty.
    if (normalizedType.length === 0) {
      normalizedType = 'log';
    }

    // Validate log type using the predefined set of valid levels
    if (!this.#validLogLevels.has(normalizedType)) {
      throw new Error(this.#format(`Invalid log type: '${type}'. Valid types are: ${Array.from(this.#validLogLevels).join(', ')}`));
    }

    // Additional safety check for console method availability
    if (typeof console[normalizedType] !== 'function') {
      throw new Error(this.#format(`Console method '${normalizedType}' is not available`));
    }

    // Convert message to string to ensure safe logging
    const messageStr = String(message);

    // Log the formatted message using the appropriate console method.
    console[normalizedType](this.#format(messageStr));
  };

  /**
   * @private
   * Formats a given message by prepending the logger's prefix.
   * @param {string} message - The message to format.
   * @returns {string} The formatted message.
   */
  #format(message) {
    // Ensure message is converted to string for safe formatting
    const messageStr = message === null || message === undefined ? '' : String(message);
    return `${this.#prefix}: ${messageStr}`;
  };

  /**
   * @private
   * Normalizes a string by trimming whitespace, removing all spaces, and converting to lowercase.
   * @param {*} str - The string to normalize. Can be any type, will return empty string if not a string.
   * @returns {string} The normalized string, or an empty string if input is not a valid string.
   */
  #normalizeString(str) {
    if (typeof str !== 'string') {
      return '';
    }
    return str.trim().replace(/\s+/g, '').toLowerCase();
  };

  /**
   * @private
   * Validates the provided prefix, ensuring it is a non-empty string after trimming.
   * @param {string} prefix - The prefix to validate.
   * @returns {string} The validated and trimmed prefix.
   * @throws {Error} If the prefix is empty or invalid.
   */
  #validatePrefix(prefix) {
    // Check if prefix is null or undefined
    if (prefix === null || prefix === undefined) {
      throw new Error('Prefix cannot be null or undefined');
    }

    // Check if prefix is a string
    if (typeof prefix !== 'string') {
      throw new Error('Prefix must be a string');
    }

    const trimmedPrefix = prefix.trim();

    // Check if prefix is empty after trimming
    if (trimmedPrefix.length === 0) {
      throw new Error('Prefix cannot be empty or contain only whitespace');
    }

    // Check prefix length (reasonable limit)
    if (trimmedPrefix.length > 50) {
      throw new Error('Prefix cannot exceed 50 characters');
    }

    return trimmedPrefix;
  };

  /**
   * Creates an instance of Logger.
   * @param {string} prefix - The string prefix to be prepended to all log messages. Must be a non-empty string.
   * @param {Object} [services] - An object specifying the initial enabled state for each log level.
   * @param {boolean} [services.log=true] - Enables or disables 'log' messages.
   * @param {boolean} [services.debug=true] - Enables or disables 'debug' messages.
   * @param {boolean} [services.info=true] - Enables or disables 'info' messages.
   * @param {boolean} [services.warn=true] - Enables or disables 'warn' messages.
   * @param {boolean} [services.error=true] - Enables or disables 'error' messages.
   * @throws {Error} If the provided prefix is invalid.
   */
  constructor(prefix, services = {}) {
    this.#prefix = this.#validatePrefix(prefix);
    this.services(services);
  }

  /**
   * Enables or disables the entire logger instance.
   * When disabled, no messages will be logged regardless of individual service settings.
   * @param {boolean} enabled - Set to `true` to enable all logging, `false` to disable all logging.
   * @throws {Error} If the enabled parameter is null or undefined
   */
  service(enabled) {
    // Validate enabled parameter
    if (enabled === null || enabled === undefined) {
      throw new Error(this.#format('Enabled parameter cannot be null or undefined'));
    }

    this.#enabled = Boolean(enabled);
  };

  /**
   * Updates the logging services configuration
   * @param {Object} services - Configuration object for logging services
   * @throws {Error} If the service parameter is not an object or contains invalid values
   */
  services(services = {}) {
    // Validate service parameter
    if (services === null || services === undefined) {
      throw new Error(this.#format('Services configuration cannot be null or undefined'));
    }

    if (typeof services !== 'object') {
      throw new Error(this.#format('Services configuration must be an object'));
    }

    // Validate service properties
    const validKeys = Object.keys(this.#services);
    const providedKeys = Object.keys(services);

    for (const key of providedKeys) {
      // Check if the key is valid
      if (!validKeys.includes(key)) {
        throw new Error(this.#format(`Invalid service key: '${key}'. Valid keys are: ${validKeys.join(', ')}`));
      }

      // Check if the value is a boolean
      if (typeof services[key] !== 'boolean') {
        throw new Error(this.#format(`Service '${key}' must be a boolean value`));
      }
    }

    // Update services with provided configuration
    Object.assign(this.#services, services);

    // Update global enabled state
    this.#enabled = Object.values(this.#services).some(Boolean);
  }

  /**
   * Formats a message with the logger's prefix without logging it.
   * Useful for getting the formatted string for other purposes.
   * @param {string} message - The message to format.
   * @returns {string} The formatted message.
   * @throws {Error} If message is null or undefined
   */
  format(message) {
    if (message === null || message === undefined) {
      throw new Error(this.#format('Format message cannot be null or undefined'));
    }
    return this.#format(message);
  };

  /**
   * Logs a message at the 'log' level.
   * @param {string} message - The message content to log.
   * @throws {Error} If message is null or undefined
   */
  log(message) {
    if (message === null || message === undefined) {
      throw new Error(this.#format('Log message cannot be null or undefined'));
    }
    if (this.#services.log) this.#console(message, 'log');
  };

  /**
   * Logs a message at the 'warn' level.
   * @param {string} message - The message content to log.
   * @throws {Error} If message is null or undefined
   */
  warn(message) {
    if (message === null || message === undefined) {
      throw new Error(this.#format('Warn message cannot be null or undefined'));
    }
    if (this.#services.warn) this.#console(message, 'warn');
  };

  /**
   * Logs a message at the 'error' level.
   * @param {string} message - The message content to log.
   * @throws {Error} If message is null or undefined
   */
  error(message) {
    if (message === null || message === undefined) {
      throw new Error(this.#format('Error message cannot be null or undefined'));
    }
    if (this.#services.error) this.#console(message, 'error');
  };

  /**
   * Logs a message at the 'info' level.
   * @param {string} message - The message content to log.
   * @throws {Error} If message is null or undefined
   */
  info(message) {
    if (message === null || message === undefined) {
      throw new Error(this.#format('Info message cannot be null or undefined'));
    }
    if (this.#services.info) this.#console(message, 'info');
  };

  /**
   * Logs a message at the 'debug' level.
   * @param {string} message - The message content to log.
   * @throws {Error} If message is null or undefined
   */
  debug(message) {
    if (message === null || message === undefined) {
      throw new Error(this.#format('Debug message cannot be null or undefined'));
    }
    if (this.#services.debug) this.#console(message, 'debug');
  };
};
