/**
 * Pulsy è l'oggetto che definisce i parametri
 */

export class Pulsy {

  #token;
  #isTokenProvided = false;

  #params = {
    debug: false,
    alias: '' // required
  };

  #log(message, type = 'log') {

    if (!this.#params.debug) return;

    type = this.#normalizeString(type);
    if (type.length === 0) type = 'log';

    if (!console[type])
      throw new Error(this.#formatLog('Invalid log type'));

    console[type](this.#formatLog(message));
  }

  #formatLog(message) {
    return `[Pulsy]: ${message}`;
  }

  #normalizeString(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str.replace(/\s+/g, '').toLowerCase();
  }

  #validateToken(token) {
    if (!token || typeof token !== 'symbol') {
      throw new Error(this.#formatLog('Invalid token'));
    }
  }

  #validateAlias(alias) {
    alias = alias?.trim() || '';

    if (alias.length === 0) {
      throw new Error(this.#formatLog('Alias is required'));
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

    this.#log(`Instance created successfully: ${this.#token}`);

  };

  update(token, options) {
    this.#validateToken(token);
    this.#validateOptions(options);
    this.#params = { ...this.#params, ...options };

    this.#log(`Instance updated successfully: ${this.#token}`);
    return { ...this.#params };

  }

  get params() {
    return { ...this.#params };
  }

  getOneTimeToken() {
    if (this.#isTokenProvided) {
      throw new Error(this.#formatLog('Token already provided'));
    }
    this.#isTokenProvided = true;
    return this.#token;
  }

};
