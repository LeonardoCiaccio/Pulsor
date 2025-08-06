/**
 * Pulsy è l'oggetto che definisce i parametri
 */

export class Pulsy {

  #token = Symbol(`Pulsor ${Date.now()}`);
  #isTokenProvided = false;

  #params = {
    alias: '' // required
  };

  #normalizeString(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str.replace(/\s+/g, '').toLowerCase();
  }

  #createError(message) {
    return `Pulsy: ${message}`;
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

  };

  update(token, options) {
    if (token !== this.#token) {
      throw new Error(this.#createError('Invalid token for update params'));
    }
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
