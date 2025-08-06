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

    type = this.#normalizeString(type);
    if (type.length === 0) throw new Error(this.#createError('Invalid log type'));

    if (!this.#params.debug || !console[type]) return;
    console[type](`[Pulsy] ${message}`);
  }

  #normalizeString(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str.replace(/\s+/g, '').toLowerCase();
  }

  #createError(message) {
    return `Pulsy: ${message}`;
  }

  #validateToken(token) {
    if (!token || typeof token !== 'symbol') {
      throw new Error(this.#createError('Invalid token'));
    }
  }

  #validateAlias(alias) {
    alias = this.#normalizeString(alias);

    if (alias.length === 0) {
      throw new Error(this.#createError('Alias is required'));
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

  };

  update(token, options) {
    this.#validateToken(token);
    this.#validateOptions(options);
    this.#params = { ...this.#params, ...options };
  }

  get params() {
    return { ...this.#params };
  }

  getOneTimeToken() {
    if (this.#isTokenProvided) {
      throw new Error(this.#createError('Token already provided'));
    }
    this.#isTokenProvided = true;
    return this.#token;
  }

};
