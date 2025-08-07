
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
      throw new PulsorError(F('Pulser/PulserAsync must be a function'));
    }
    return pulse;
  },
  validateCallback = (callback) => {
    if (typeof callback !== 'function') {
      throw new PulsorError(F('Callback/CallbackAsync must be a function'));
    }
    return callback;
  },
  validateCallbackItems = (callbackItems) => {
    if (callbackItems === undefined || !Array.isArray(callbackItems)) callbackItems = [];
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
    validateCallbackItems(Callbacks[aliasValidated]);

  },
  DestroyPulser = (alias) => {

    const aliasValidated = validateAlias(alias);
    destroyPulser(aliasValidated, Pulsers);

  },
  CreatePulserAsync = (alias, pulseAsync, override = false) => {

    const aliasValidated = validateAlias(alias);
    const pulseAsyncValidated = validatePulse(pulseAsync);

    createPulser(aliasValidated, pulseAsyncValidated, PulsersAsync, override);
    validateCallbackItems(CallbacksAsync[aliasValidated]);

  },
  DestroyPulserAsync = (alias) => {

    const aliasValidated = validateAlias(alias);
    destroyPulser(aliasValidated, PulsersAsync);

  },
  Pulsor = function (alias) {

    const aliasValidated = validateAlias(alias);

    this.Pulse = (...args) => {

      const pulsor = Pulsers[aliasValidated];
      if (pulsor === undefined) {
        throw new PulsorError(F(`Pulser '${aliasValidated}' does not exist`));
      }
      const result = pulsor(...args);
      const callbackItems = validateCallbackItems(Callbacks[aliasValidated]);
      callbackItems.forEach(callback => callback(...args));
      return result;

    };

    this.PulseAsync = async (...args) => {

      const pulsorAsync = PulsersAsync[aliasValidated];
      if (pulsorAsync === undefined) {
        throw new PulsorError(F(`PulserAsync '${aliasValidated}' does not exist`));
      }
      const result = await pulsorAsync(...args);
      const callbackItems = validateCallbackItems(CallbacksAsync[aliasValidated]);
      await Promise.all(callbackItems.map(callback => callback(...args)));
      return result;

    };

    this.BindPulse = (callback) => {
      const callbackValidated = validateCallback(callback);

      validateCallbackItems(Callbacks[aliasValidated]);
      if (Callbacks[aliasValidated].includes(callbackValidated)) {
        throw new PulsorError(F(`Callback already bound to '${aliasValidated}'`));
      }

      Callbacks[aliasValidated].push(callbackValidated);
      Loggy.log(`Callback added to '${aliasValidated}'`);
    };

    this.BindPulseAsync = (callbackAsync) => {
      const callbackAsyncValidated = validateCallback(callbackAsync);

      validateCallbackItems(CallbacksAsync[aliasValidated]);
      if (CallbacksAsync[aliasValidated].includes(callbackAsyncValidated)) {
        throw new PulsorError(F(`CallbackAsync already bound to '${aliasValidated}'`));
      }

      CallbacksAsync[aliasValidated].push(callbackAsyncValidated);
      Loggy.log(`CallbackAsync added to '${aliasValidated}'`);
    };

    this.UnBindPulse = (callback) => {
      const callbackValidated = validateCallback(callback);
      Callbacks[aliasValidated] = Callbacks[aliasValidated].filter((c) => c !== callbackValidated);
      Loggy.log(`Callback removed from '${aliasValidated}'`);
    };

    this.UnBindPulseAsync = (callbackAsync) => {
      const callbackAsyncValidated = validateCallback(callbackAsync);
      CallbacksAsync[aliasValidated] = CallbacksAsync[aliasValidated].filter((c) => c !== callbackAsyncValidated);
      Loggy.log(`CallbackAsync removed from '${aliasValidated}'`);
    };

    this.UnbindAllPulses = () => {
      delete Callbacks[aliasValidated];
      Loggy.log(`All callbacks removed from '${aliasValidated}'`);
    };

    this.UnbindAllPulsesAsync = () => {
      delete CallbacksAsync[aliasValidated];
      Loggy.log(`All callbacksAsync removed from '${aliasValidated}'`);
    };
  };


export { CreatePulser, DestroyPulser, CreatePulserAsync, DestroyPulserAsync, Pulsor, PulsorError };
