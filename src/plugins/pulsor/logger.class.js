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
   * Indicates whether logging is currently enabled.
   */
  #enabled = true;

  /**
   * @private
   * Logs a message to the console with a specified type (e.g., 'log', 'warn', 'error').
   * Logging is skipped if the logger is disabled.
   * @param {string} message - The message to log.
   * @param {string} [type='log'] - The type of log (e.g., 'log', 'warn', 'error', 'info', 'debug').
   * @throws {Error} If the provided log type is not a valid console method.
   */
  #log(message, type = 'log') {
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

    // Check if the console object has a method corresponding to the normalized type.
    if (typeof console[normalizedType] !== 'function') {
      throw new Error(this.#format(`Invalid log type: '${type}'`));
    }

    // Log the formatted message using the appropriate console method.
    console[normalizedType](this.#format(message));
  };

  /**
   * @private
   * Formats a given message by prepending the logger's prefix.
   * @param {string} message - The message to format.
   * @returns {string} The formatted message.
   */
  #format(message) {
    return `${this.#prefix}: ${message}`;
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
    const trimmedPrefix = prefix?.trim();

    if (!trimmedPrefix || trimmedPrefix.length === 0) {
      throw new Error(this.#format('Prefix is required and cannot be empty.'));
    }

    return trimmedPrefix;
  };

  /**
   * Creates an instance of Logger.
   * @param {string} prefix - The prefix for all log messages. Must be a non-empty string.
   * @param {boolean} [enabled=true] - Initial state of the logger (enabled or disabled).
   * @throws {Error} If the provided prefix is invalid.
   */
  constructor(prefix, enabled = true) {
    this.#prefix = this.#validatePrefix(prefix);
    this.#enabled = Boolean(enabled);
  };

  /**
   * Enables or disables the logger service.
   * @param {boolean} enabled - Set to `true` to enable logging, `false` to disable.
   */
  service(enabled) {
    this.#enabled = Boolean(enabled);
  };

  /**
   * Formats a message with the logger's prefix without logging it.
   * Useful for getting the formatted string for other purposes.
   * @param {string} message - The message to format.
   * @returns {string} The formatted message.
   */
  format(message) {
    return this.#format(message);
  };

  /**
   * Logs a message to the console. This is the primary method for logging.
   * @param {string} message - The message to log.
   */
  log(message) {
    this.#log(message, 'log');
  };

  /**
   * Logs a warning message to the console.
   * @param {string} message - The warning message to log.
   */
  warn(message) {
    this.#log(message, 'warn');
  };

  /**
   * Logs an error message to the console.
   * @param {string} message - The error message to log.
   */
  error(message) {
    this.#log(message, 'error');
  };

  /**
   * Logs an info message to the console.
   * @param {string} message - The info message to log.
   */
  info(message) {
    this.#log(message, 'info');
  };

  /**
   * Logs a debug message to the console.
   * @param {string} message - The debug message to log.
   */
  debug(message) {
    this.#log(message, 'debug');
  };
};
