
/**
 * Pulsor module
 */

import { Logger } from './logger.class.js';

class PulsorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PulsorError';
  }
}

const // PROPRIETA'
  Prefix = '[Pulsor]',
  Pulsers = {},
  PulsersAsync = {},
  Callbacks = {},
  CallbacksAsync = {},
  LoggerServices = {
    log: true,
    error: true,
    warn: true,
    debug: true,
    info: true
  },
  Loggy = new Logger(Prefix, LoggerServices),
  F = Loggy.format;

const // --> VALIDAZIONI private
  validateAlias = (alias) => {
    const trimmedAlias = (alias || '').trim();
    if (trimmedAlias.length === 0 || trimmedAlias.length > 32) {
      throw new PulsorError(F('Alias cannot be empty or longer than 32 characters'));
    }
    return trimmedAlias;
  },
  validatePulse = (pulse) => {
    if (typeof pulse !== 'function') {
      throw new PulsorError(F('Pulser/Async must be a function'));
    }
    return pulse;
  },
  validateCallback = (callback) => {
    if (typeof callback !== 'function') {
      throw new PulsorError(F('Callback must be a function'));
    }
    return callback;
  };

const // --> METODI privati
  pulserExists = (aliasValidated, securePulsersDb) => {
    return securePulsersDb[aliasValidated] !== undefined;
  },
  createPulser = (aliasValidated, pulseValidated, securePulsersDb, override = false) => {

    if (pulserExists(aliasValidated, securePulsersDb)) {
      if (override) {
        securePulsersDb[aliasValidated] = pulseValidated;
        Loggy.log(`Pulser '${aliasValidated}' already exists, overrided`);
        return;
      } else {
        throw new PulsorError(F(`Pulser '${aliasValidated}' already exists`));
      }
    }
    securePulsersDb[aliasValidated] = pulseValidated;
    Loggy.log(`Pulser '${aliasValidated}' created`);
  },
  destroyPulser = (aliasValidated, securePulsersDb) => {

    if (!pulserExists(aliasValidated, securePulsersDb)) {
      throw new PulsorError(F(`Pulser '${aliasValidated}' does not exist`));
    }

    delete securePulsersDb[aliasValidated];

    Loggy.log(`Pulser '${aliasValidated}' destroyed`);
  };

const // --> METODI ESPORTATI
  CreatePulser = (alias, pulse, override = false) => {

    const aliasValidated = validateAlias(alias);
    const pulseValidated = validatePulse(pulse);

    createPulser(aliasValidated, pulseValidated, Pulsers, override);

  },
  DestroyPulser = (alias) => {

    const aliasValidated = validateAlias(alias);
    destroyPulser(aliasValidated, Pulsers);

  },
  CreatePulserAsync = (alias, pulseAsync, override = false) => {
    const aliasValidated = validateAlias(alias);
    const pulseAsyncValidated = validatePulse(pulseAsync);
    createPulser(aliasValidated, pulseAsyncValidated, PulsersAsync, override);

  },
  DestroyPulserAsync = (alias) => {

    const aliasValidated = validateAlias(alias);
    destroyPulser(aliasValidated, PulsersAsync);

  },
  Pulsor = function (alias) {

    const aliasValidated = validateAlias(alias);

    this.Pulse = (...args) => {

      const pulsor = getPulser(aliasValidated, Pulsers);
      if (pulsor === undefined) {
        throw new PulsorError(F(`Pulser '${aliasValidated}' does not exist`));
      }
      return pulsor.pulse(...args);

    };

    this.PulseAsync = async (...args) => {

      const pulsorAsync = getPulser(aliasValidated, PulsersAsync);
      if (pulsorAsync === undefined) {
        throw new PulsorError(F(`PulserAsync '${aliasValidated}' does not exist`));
      }
      return await pulsorAsync.pulse(...args);

    };

    this.on = (callback) => {
      const callbackValidated = validateCallback(callback);
      Callbacks.push(callbackValidated);
    };

    this.onAsync = (callbackAsync) => {
      const callbackAsyncValidated = validateCallback(callbackAsync);
      CallbacksAsync.push(callbackAsyncValidated);
    };

    this.off = (callback) => {
      const callbackValidated = validateCallback(callback);
      Callbacks = Callbacks.filter((c) => c !== callbackValidated);
    };

    this.offAsync = (callbackAsync) => {
      CallbacksAsync = CallbacksAsync.filter((c) => c !== callbackAsync);
    };
  };


export { CreatePulser, DestroyPulser, CreatePulserAsync, DestroyPulserAsync, Pulsor };
