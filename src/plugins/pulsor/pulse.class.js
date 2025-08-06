import { Logger } from './logger.class.js';

export class Pulse {

  #prefix = '[Pulse]';
  #alias = '';
  #console = null;
  #pulsers = [];
  #pulsersAsync = [];
  #callbacks = [];
  #callbacksAsync = [];

  #format(message) {
    return `${this.#prefix}(${this.#alias}): ${message}`;
  }

  #validateAlias(alias) {
    const aliasTrimmed = (alias || '').trim();

    if (aliasTrimmed.length === 0) {
      throw new Error(this.#format('Alias cannot be empty or contain only whitespace'));
    }

    return aliasTrimmed;
  };

  #validateCallback(fn) {
    if (typeof fn !== 'function') {
      throw new Error(this.#format('Callback must be a function'));
    }
  };

  // Array di oggetti {'foo': () => {}}
  #validatePulsers(pulsers) {

    const cleanPulsers = [];

    if (!Array.isArray(pulsers)) {
      throw new Error(this.#format('Pulsers must be an array'));
    }

    for (const pulsar of pulsers) {
      if (typeof pulsar !== 'object') {
        throw new Error(this.#format('Pulsers must be an array of objects'));
      }

      if (Object.keys(pulsar).length !== 1) {
        throw new Error(this.#format('Pulsers must be an array of objects with only one key'));
      }

      const key = Object.keys(pulsar)[0]?.trim() ?? '';
      if (key.length === 0) {
        throw new Error(this.#format('Pulsers must be an array of objects with only one key'));
      }

      if (typeof pulsar[key] !== 'function') {
        throw new Error(this.#format('Pulsers must be an array of objects with only one function'));
      }

      cleanPulsers.push({
        alias: key,
        fn: pulsar[key]
      });
    }
    return cleanPulsers;
  }

  #callbackExists(alias, callback) {
    const aliasTrimmed = this.#validateAlias(alias);
    return this.#callbacks.find((c) => c.alias === aliasTrimmed && c.fn === callback);
  }

  #callbackAsyncExists(alias, callback) {
    const aliasTrimmed = this.#validateAlias(alias);
    return this.#callbacksAsync.find((c) => c.alias === aliasTrimmed && c.fn === callback);
  }

  #addCallback(alias, callback) {
    const aliasTrimmed = this.#validateAlias(alias);
    this.#validateCallback(callback);

    if (this.#callbackExists(aliasTrimmed, callback)) {
      throw new Error(this.#format(`Callback '${aliasTrimmed}' already exists`));
    }
    this.#callbacks.push({
      alias: aliasTrimmed,
      fn: callback
    });
    this.#console.log(`Callback '${aliasTrimmed}' added`);
  };

  #addCallbackAsync(alias, callback) {
    const aliasTrimmed = this.#validateAlias(alias);
    this.#validateCallback(callback);

    if (this.#callbackAsyncExists(aliasTrimmed, callback)) {
      throw new Error(this.#format(`Callback async '${aliasTrimmed}' already exists`));
    }
    this.#callbacksAsync.push({
      alias: aliasTrimmed,
      fn: callback
    });
    this.#console.log(`Callback async '${aliasTrimmed}' added`);
  };

  #removeCallback(alias, callback) {
    const aliasTrimmed = this.#validateAlias(alias);
    this.#validateCallback(callback);

    if (!this.#callbackExists(aliasTrimmed, callback)) {
      return this.#console.warn(`Callback '${aliasTrimmed}' not found`);
    }
    this.#callbacks = this.#callbacks.filter((c) => c.alias !== aliasTrimmed && c.fn !== callback);
    this.#console.log(`Callback '${aliasTrimmed}' removed`);
  };

  #removeCallbackAsync(alias, callback) {
    const aliasTrimmed = this.#validateAlias(alias);
    this.#validateCallback(callback);

    if (!this.#callbackAsyncExists(aliasTrimmed, callback)) {
      return this.#console.warn(`Callback async '${aliasTrimmed}' not found`);
    }
    this.#callbacksAsync = this.#callbacksAsync.filter((c) => c.alias !== aliasTrimmed && c.fn !== callback);
    this.#console.log(`Callback async '${aliasTrimmed}' removed`);
  };

  // Constructor
  constructor(alias, pulsers, pulsersAsync = [], loggerServices = {}) {

    this.#alias = this.#validateAlias(alias);
    this.#pulsers = this.#validatePulsers(pulsers);
    this.#pulsersAsync = this.#validatePulsers(pulsersAsync);
    this.#console = new Logger(`${this.#prefix}(${this.#alias})`, loggerServices);

    this.#console.log('Instance created');

  };

  emit(alias, ...args) {

    const pulsar = this.#pulsers.find((p) => p.alias === alias);

    if (!pulsar) {
      throw new Error(this.#format(`Pulsar '${alias}' not found`));
    }
    pulsar.fn(...args);
    this.#console.log(`Pulsar '${alias}' emitted`);
  };

  async emitAsync(alias, ...args) {

    const pulsar = this.#pulsersAsync.find((p) => p.alias === alias);

    if (!pulsar) {
      throw new Error(this.#format(`Pulsar '${alias}' not found`));
    }
    await pulsar.fn(...args);
    this.#console.log(`Pulsar '${alias}' emitted`);
  };

  on(alias, callback) {
    this.#addCallback(alias, callback);
  };

  off(alias, callback) {
    this.#removeCallback(alias, callback);
  };

  onAsync(alias, callback) {
    this.#addCallbackAsync(alias, callback);
  };

  offAsync(alias, callback) {
    this.#removeCallbackAsync(alias, callback);
  };

};
