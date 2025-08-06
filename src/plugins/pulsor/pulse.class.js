import { Logger } from './logger.class.js';

export class Pulse {

  #prefix = '[Pulse]';
  #alias = 'default';
  #console = null;
  #pulser = () => { };

  #prefixer() {
    return `${this.#prefix}(${this.#alias})`;
  }

  #format(message) {
    return `${this.#prefixer()}: ${message}`;
  }

  #validateAlias(alias) {
    const aliasTrimmed = (alias || '').trim();

    if (aliasTrimmed.length === 0) {
      throw new Error(this.#format('Alias cannot be empty or contain only whitespace'));
    }

    return aliasTrimmed;
  };

  #validatePulser(pulser) {

    if (typeof pulser !== 'function') {
      throw new Error(this.#format('Pulser must be a function'));
    }
    return pulser;
  }

  // Constructor
  constructor(alias, pulser, loggerServices = {}) {

    this.#alias = this.#validateAlias(alias);
    this.#pulser = this.#validatePulser(pulser);
    this.#console = new Logger(this.#prefixer(), loggerServices);

    this.#console.log('Instance created');

  };

  emit(...args) {
    this.#pulser(...args);
    this.#console.log(`Pulser emitted`);
  };

};

export class PulseAsync {

  #prefix = '[PulseAsync]';
  #alias = 'default';
  #console = null;
  #pulserAsync = () => { };

  #prefixer() {
    return `${this.#prefix}(${this.#alias})`;
  }

  #format(message) {
    return `${this.#prefixer()}: ${message}`;
  }

  #validateAlias(alias) {
    const aliasTrimmed = (alias || '').trim();

    if (aliasTrimmed.length === 0) {
      throw new Error(this.#format('Alias cannot be empty or contain only whitespace'));
    }

    return aliasTrimmed;
  };

  #validatePulser(pulser) {

    if (typeof pulser !== 'function') {
      throw new Error(this.#format('Pulser must be a function'));
    }
    return pulser;
  }

  // Constructor
  constructor(alias, pulserAsync, loggerServices = {}) {

    this.#alias = this.#validateAlias(alias);
    this.#pulserAsync = this.#validatePulser(pulserAsync);
    this.#console = new Logger(this.#prefixer(), loggerServices);

    this.#console.log('Instance created');

  };

  async emit(...args) {
    await this.#pulserAsync(...args);
    this.#console.log(`Pulser emitted asynchronously`);
  };

};
