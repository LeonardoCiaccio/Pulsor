/**
 * Pulsy è l'oggetto che definisce i parametri
 */
import Logger from './logger.class.js';
const Loggy = new Logger('Pulsy');

export class Pulsy {

  #token;
  #isTokenProvided = false;

  #params = {
    loggy: {
      log: false,
      debug: false,
      info: false,
      warn: false,
      error: false,
    },
    alias: '' // required
  };

  #validateToken(token) {
    if (!token || typeof token !== 'symbol') {
      throw new Error(Loggy.format('Invalid token'));
    }
  }

  #validateAlias(alias) {
    alias = alias?.trim() || '';

    if (alias.length === 0) {
      throw new Error(Loggy.format('Alias is required'));
    }

    return alias;
  }

  #validateOptions(options) {
    this.#params.alias = this.#validateAlias(options.alias);
  }

  // Constructor
  constructor(options = {}) {

    this.#validateOptions(options);
    this.#token = Symbol(`Pulsor ${Date.now()}`);

    Loggy.services(options.loggy);
    Loggy.debug(`Instance created successfully: ${this.#token}`);

  };

  update(token, options) {
    this.#validateToken(token);
    this.#validateOptions(options);
    this.#params = { ...this.#params, ...options };

    Loggy.debug(`Instance updated successfully: ${this.#token}`);
    return { ...this.#params };

  }

  get params() {
    return { ...this.#params };
  }

  getOneTimeToken() {
    if (this.#isTokenProvided) {
      throw new Error(Loggy.format('Token already provided'));
    }
    this.#isTokenProvided = true;
    Loggy.debug(`Token provided: ${this.#token}`);
    return this.#token;
  }

};
