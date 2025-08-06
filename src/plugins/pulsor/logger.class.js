
export class Logger {

  #prefix = '[Logger]';

  #services = {
    log: false,
    debug: false,
    info: false,
    warn: false,
    error: false
  };

  #console(logged, type) {
    if (Object.prototype.hasOwnProperty.call(this.#services, type) && this.#services[type]) {
      console[type](`${this.#prefix}: `, logged);
    }
  };

  #validatePrefix(prefix) {
    const trimmedPrefix = (prefix || '').trim();

    if (trimmedPrefix.length === 0) {
      throw new Error('Prefix cannot be empty or contain only whitespace');
    }

    return trimmedPrefix;
  };


  constructor(prefix, services = {}) {
    this.#prefix = this.#validatePrefix(prefix);
    this.services(services);
    for (const type of Object.keys(this.#services)) {
      this[type] = (logged) => this.#console(logged, type);
    }
  }

  services(services = {}) {
    if (typeof services !== 'object' || services === null) {
      return;
    }

    for (const key of Object.keys(services)) {
      if (typeof services[key] === 'boolean') {
        this.#services[key] = services[key];
      }
    }
  }

  format(message) {
    return `${this.#prefix}: ${message}`;
  };
};
