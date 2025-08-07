
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
  Pulsers = [],
  PulsersAsync = [],
  Callbacks = [],
  CallbacksAsync = [],
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
    if (trimmedAlias.length === 0) {
      throw new PulsorError(F('Alias cannot be empty'));
    }
    return trimmedAlias;
  },
  validatePulse = (pulse) => {
    if (typeof pulse !== 'function') {
      throw new PulsorError(F('Pulser/Async must be a function'));
    }
    return pulse;
  };

const // --> METODI privati
  getPulser = (aliasValidated, securePulsersDb) => {
    return securePulsersDb.find((pulsor) => pulsor.alias === aliasValidated);
  },
  pulserExists = (aliasValidated, securePulsersDb) => {
    return getPulser(aliasValidated, securePulsersDb) !== undefined;
  },
  createPulser = (aliasValidated, pulseValidated) => {
    return {
      alias: aliasValidated,
      pulse: pulseValidated
    };
  },
  createAndAddPulser = (alias, pulse, securePulsersDb) => {
    const
      aliasValidated = validateAlias(alias),
      pulseValidated = validatePulse(pulse);

    if (pulserExists(aliasValidated, securePulsersDb)) {
      throw new PulsorError(F(`Pulser '${aliasValidated}' already exists`));
    }

    securePulsersDb.push(createPulser(aliasValidated, pulseValidated));
    Loggy.log(`Pulser '${aliasValidated}' created`);
  },
  destroyPulser = (alias, securePulsersDb) => {
    const
      aliasValidated = validateAlias(alias);

    if (!pulserExists(aliasValidated, securePulsersDb)) {
      throw new PulsorError(F(`Pulser '${aliasValidated}' does not exist`));
    }

    const
      pulserIndex = securePulsersDb.findIndex((pulsor) => pulsor.alias === aliasValidated);
    securePulsersDb.splice(pulserIndex, 1);

    Loggy.log(`Pulser '${aliasValidated}' destroyed`);
  };

const // --> METODI ESPORTATI
  CreatePulser = (alias, pulse) => {

    createAndAddPulser(alias, pulse, Pulsers);

  },
  DestroyPulser = (alias) => {

    destroyPulser(alias, Pulsers);

  },
  CreatePulserAsync = (alias, pulseAsync) => {

    createAndAddPulser(alias, pulseAsync, PulsersAsync);

  },
  DestroyPulserAsync = (alias) => {

    destroyPulser(alias, PulsersAsync);

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
  };


export { CreatePulser, DestroyPulser, CreatePulserAsync, DestroyPulserAsync, Pulsor };
