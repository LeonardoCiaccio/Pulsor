
/**
 * L'orchestratore Pulsor
 */
import { Pulse as PulseClass, PulseAsync as PulseAsyncClass } from './pulse.class.js';
import { Logger } from './logger.class.js';

const // PROPRIETA'
  Prefix = '[Pulsor]',
  Pulsers = [],
  PulsersAsync = [],
  LoggerServices = {
    log: true,
    error: true,
    warn: true,
    debug: true,
    info: true
  },
  Loggy = new Logger(Prefix, LoggerServices),
  Format = Loggy.format;

const // --> VALIDAZIONI
  ValidateAlias = (alias) => {
    const trimmedAlias = (alias || '').trim();
    if (trimmedAlias.length === 0) {
      throw new Error(Format('Alias cannot be empty'));
    }
    return trimmedAlias;
  },
  ValidatePulse = (pulse) => {
    if (typeof pulse !== 'function') {
      throw new Error(Format('Pulse/Async must be a function'));
    }
    return pulse;
  };

const // --> METODI
  GetPulser = (aliasValidated, pulsersDb) => {
    return pulsersDb.find((pulsor) => pulsor.alias === aliasValidated);
  },
  PulserExists = (aliasValidated) => {
    return GetPulser(aliasValidated, Pulsers) !== undefined;
  },
  PulserAsyncExists = (aliasValidated) => {
    return GetPulser(aliasValidated, PulsersAsync) !== undefined;
  };

const // --> METODI ESPORTATI
  Create = (alias, pulse) => {

    const
      aliasValidated = ValidateAlias(alias),
      pulseValidated = ValidatePulse(pulse);

    if (PulserExists(aliasValidated)) {
      throw new Error(Format(`Pulser '${aliasValidated}' already exists`));
    }
    Pulsers.push(new PulseClass(aliasValidated, pulseValidated, LoggerServices));

    Loggy.log(`Pulser '${aliasValidated}' created`);

  },
  Destroy = (alias) => {

    const aliasValidated = ValidateAlias(alias);
    if (!PulserExists(aliasValidated)) {
      throw new Error(Format(`Pulser '${aliasValidated}' does not exist`));
    }
    Pulsers = Pulsers.filter((pulsor) => pulsor.alias !== aliasValidated);
    Loggy.log(`Pulser '${aliasValidated}' destroyed`);

  },
  CreateAsync = (alias, pulseAsync) => {

    const
      aliasValidated = ValidateAlias(alias),
      pulseAsyncValidated = ValidatePulse(pulseAsync);

    if (PulserAsyncExists(aliasValidated)) {
      throw new Error(Format(`PulserAsync '${aliasValidated}' already exists`));
    }
    PulsersAsync.push(new PulseAsyncClass(aliasValidated, pulseAsyncValidated, LoggerServices));

    Loggy.log(`PulserAsync '${aliasValidated}' created`);

  },
  Pulse = (alias, ...args) => {
    const
      aliasValidated = ValidateAlias(alias),
      pulser = GetPulser(aliasValidated, Pulsers);
    if (pulser === undefined) {
      throw new Error(Format(`Pulser '${aliasValidated}' does not exist`));
    }
    return pulser.emit(...args);
  };

export { Create, CreateAsync, Pulse };
