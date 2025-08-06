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
   * @type {Object}
   * Stores the enabled state for each log level (log, debug, info, warn, error).
   */
  #services = {
    log: false,
    debug: false,
    info: false,
    warn: false,
    error: false
  };

  #console(message, type, enabled) {

    if (!enabled) return;
    message = message?.trim() || '';
    if (message.length === 0) {
      throw new Error(this.#format('Console message cannot be empty or contain only whitespace'));
    }
    console[type](this.#format(message));

  };

  #format(message) {

    message = message?.trim() || '';
    return `${this.#prefix}: ${message}`;

  };

  #validatePrefix(prefix) {

    prefix = prefix?.trim() || '';

    // Check if prefix is empty after trimming
    if (prefix.length === 0) {
      throw new Error('Prefix cannot be empty or contain only whitespace');
    }

    return prefix;
  };


  constructor(prefix, services = {}) {
    this.#prefix = this.#validatePrefix(prefix);
    this.services(services);
  }

  services(services = {}) {

    for (const key in this.#services) {
      if (services[key] !== undefined && typeof services[key] !== 'boolean') continue;
      this.#services[key] = !!services[key];
    }

  };

  format(message) {
    message = message?.trim() || '';
    if (message.length === 0) {
      throw new Error(this.#format('Format message cannot be empty or contain only whitespace'));
    }
    return this.#format(message);
  };

  log(message) {
    this.#console(message, 'log', this.#services.log);
  };

  warn(message) {
    this.#console(message, 'warn', this.#services.warn);
  };

  error(message) {
    this.#console(message, 'error', this.#services.error);
  };

  info(message) {
    this.#console(message, 'info', this.#services.info);
  };

  debug(message) {
    this.#console(message, 'debug', this.#services.debug);
  };
};
