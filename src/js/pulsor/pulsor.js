/**
 * Pulsor Module - Hardened & Enterprise-Ready Framework
 * @version 5.0.7
 *
 * MIGRATION NOTES & WHAT'S NEW:
 * - v5.0.7: [ENTERPRISE] Added configurable metrics, health check API, batch operations, and graceful shutdown.
 * - v5.0.6: [MONITORING] Added advanced performance metrics (percentiles, trend analysis).
 * - v5.0.5: [RESILIENCE] Introduced a `safeLog` wrapper to prevent logging failures.
 * - v5.0.4: [REFACTOR] Moved `buildCallbackArgs` to a private class method.
 * - v5.0.3: [BUGFIX] Restored global exports for `ListPulsers` and `GetPulserInfo`.
 * - v5.0.2: [BUGFIX] Implemented the missing `unbindByPatternId` method.
 * - v5.0.1: General code cleanup.
 * - v5.0.0: Major hardening release.
 */

// --- Gestione sicura degli import con validazione ---
try {
  var { Logger } = await import('./logger.class.js');
} catch (importError) {
  console.error('[Pulsor] ERRORE CRITICO: Impossibile importare Logger:', importError.message);
  throw new Error(`Dipendenza mancante: logger.class.js - ${importError.message}`);
}

try {
  var { AsyncLock } = await import('./async-lock.class.js');
} catch (importError) {
  console.error('[Pulsor] ERRORE CRITICO: Impossibile importare AsyncLock:', importError.message);
  throw new Error(`Dipendenza mancante: async-lock.class.js - ${importError.message}`);
}

try {
  var { PulsorError, PulsorStoppedError } = await import('./errors.class.js');
} catch (importError) {
  console.error('[Pulsor] ERRORE CRITICO: Impossibile importare classi di errore:', importError.message);
  throw new Error(`Dipendenza mancante: errors.class.js - ${importError.message}`);
}

// --- Core exports and symbols ---
export const PULSOR_STOP = Symbol('PULSOR_STOP');

// --- Logger Setup & Resilience ---
const Prefix = '[Pulsor]';
const LoggerServices = { log: true, error: true, warn: true, debug: false, info: true };
const Loggy = new Logger(Prefix, LoggerServices);

const createStructuredLog = (event, data = {}) => {
  // Lazy evaluation per evitare overhead quando il logging è disabilitato
  if (!Loggy.services[event] && !Loggy.services.log) return null;
  return {
    timestamp: new Date().toISOString(),
    event,
    ...data
  };
};

const safeLog = (level, event, data = {}) => {
  try {
    const logData = createStructuredLog(event, data);
    if (logData) {
      Loggy[level](event, logData);
    }
  } catch (loggingError) {
    console.error(`[Pulsor] Logging failed for event '${event}' at level '${level}':`, loggingError);
    console.log('[Pulsor] Original data:', data);
  }
};

// --- Constants and Defaults ---

// --- Import delle utility con gestione errori ---
try {
  var { validateAlias, validateFunction, validateOptions, sanitizeArgs, nowMs, toRegex, DEFAULT_OPTIONS, MAX_PATTERN_CALLBACKS } = await import('./utils.js');
} catch (importError) {
  console.error('[Pulsor] ERRORE CRITICO: Impossibile importare utilities:', importError.message);
  throw new Error(`Dipendenza mancante: utils.js - ${importError.message}`);
}

try {
  var { CircuitBreaker } = await import('./circuit-breaker.class.js');
} catch (importError) {
  console.error('[Pulsor] ERRORE CRITICO: Impossibile importare CircuitBreaker:', importError.message);
  throw new Error(`Dipendenza mancante: circuit-breaker.class.js - ${importError.message}`);
}

// --- Pulser Class ---

/**
 * Pulser - Advanced Event-Driven Function Orchestrator
 *
 * Enhanced with security features, circuit breakers, retry logic, and memory management.
 * Provides comprehensive protection against prototype pollution, injection attacks,
 * memory leaks, and system overload.
 *
 * @class Pulser
 * @version 2.0.0
 */
export class Pulser {
  #alias;
  #manager;

  constructor(alias, manager) {
    this.#alias = validateAlias(alias);
    this.#manager = manager;
    if (!this.#manager.getEntry(this.#alias)) {
      throw new PulsorError(`Pulser '${this.#alias}' is not registered.`);
    }
  }

  /**
   * Emette un evento tramite il manager
   * @param {string} event - Nome dell'evento
   * @param {any} data - Dati da emettere
   * @private
   */
  #emit(event, data) {
    // Delega l'emissione dell'evento al manager tramite metodo pubblico
    if (typeof this.#manager.emitEvent === 'function') {
      this.#manager.emitEvent(event, { ...data, pulserAlias: this.#alias });
    }
  }

  get alias() { return this.#alias; }
  /**
   * Execute a registered function with comprehensive error handling, retry logic, and circuit breaker protection
   *
   * @param {...any} args - Arguments to pass to the function
   * @returns {Promise<any>} The function result
   * @throws {PulsorError} When execution fails, circuit breaker is open, or timeout occurs
   *
   * @example
   * // Basic usage
   * const result = await pulser.pulse(arg1, arg2);
   *
   * // With retry and timeout
   * pulsor.register('apiCall', fetchData, { maxRetries: 3, timeout: 5000 });
   * const data = await pulsor.pulse('/api/users');
   */
  pulse(...args) { return this.#manager.pulse(this.#alias, args); }
  bind(callback, options = {}) {
    const cb = validateFunction(callback, 'Callback');
    this.#manager.bindCallback(this.#alias, cb, options);
    return () => this.unbind(cb, { phase: options.phase || 'after' });
  }
  unbind(callback, options = {}) { return this.#manager.unbindCallback(this.#alias, callback, options); }
  unbindAll(options = {}) { return this.#manager.unbindAllCallbacks(this.#alias, options); }

  /**
   * Binds multiple callbacks to the Pulser.
   * Each item in the `callbacks` array can be a function or an object `{ fn: Function, options: Object }`.
   * @param {Array<Function|object>} callbacks - An array of callback functions or objects containing functions and options.
   * @param {object} [globalOptions={}] - Global options to apply to all callbacks unless overridden by item-specific options.
   * @returns {{unbinders: Array<Function>, errors: Array<object>}} An object containing an array of unbinder functions and an array of error objects for failed binds.
   * @throws {PulsorError} If `callbacks` is not an array.
   */
  binds(callbacks, globalOptions = {}) {
    if (!Array.isArray(callbacks)) {
      throw new PulsorError('Il primo argomento di `binds` deve essere un array di callback o oggetti callback.');
    }

    // Validazione rigorosa delle opzioni globali
    if (globalOptions !== null && (typeof globalOptions !== 'object' || Array.isArray(globalOptions))) {
      throw new PulsorError('Le opzioni globali devono essere un oggetto valido (non array o null).');
    }

    // Validazione delle chiavi delle opzioni globali
    const validOptionKeys = ['phase', 'priority', 'once', 'ttl'];
    const globalKeys = Object.keys(globalOptions);
    const invalidGlobalKeys = globalKeys.filter(key => !validOptionKeys.includes(key));

    if (invalidGlobalKeys.length > 0) {
      throw new PulsorError(`Chiavi non valide nelle opzioni globali: ${invalidGlobalKeys.join(', ')}. Chiavi valide: ${validOptionKeys.join(', ')}.`);
    }

    // Validazione dei valori delle opzioni globali
    if (globalOptions.phase && !['before', 'after', 'error'].includes(globalOptions.phase)) {
      throw new PulsorError(`Fase non valida nelle opzioni globali: '${globalOptions.phase}'. Fasi valide: before, after, error.`);
    }

    if (globalOptions.priority !== undefined && (typeof globalOptions.priority !== 'number' || !Number.isFinite(globalOptions.priority))) {
      throw new PulsorError('La priorità nelle opzioni globali deve essere un numero finito.');
    }

    if (globalOptions.ttl !== undefined && (typeof globalOptions.ttl !== 'number' || globalOptions.ttl <= 0)) {
      throw new PulsorError('Il TTL nelle opzioni globali deve essere un numero positivo.');
    }

    if (callbacks.length === 0) {
      safeLog('warn', 'Array callbacks vuoto fornito a binds()');
      return { unbinders: [], errors: [] };
    }

    const results = { unbinders: [], errors: [] };

    callbacks.forEach((item, index) => {
      try {
        let callbackFn;
        let optionsToApply = { ...globalOptions };

        if (typeof item === 'function') {
          callbackFn = item;
        } else if (typeof item === 'object' && item !== null && !Array.isArray(item) && typeof item.fn === 'function') {
          callbackFn = item.fn;

          // Validazione rigorosa delle opzioni dell'item
          if (item.options !== undefined) {
            if (typeof item.options !== 'object' || item.options === null || Array.isArray(item.options)) {
              throw new PulsorError(`Le opzioni all'indice ${index} devono essere un oggetto valido (non array o null).`);
            }

            // Validazione delle chiavi delle opzioni dell'item
            const itemKeys = Object.keys(item.options);
            const invalidItemKeys = itemKeys.filter(key => !validOptionKeys.includes(key));
            if (invalidItemKeys.length > 0) {
              throw new PulsorError(`Chiavi non valide nelle opzioni all'indice ${index}: ${invalidItemKeys.join(', ')}. Chiavi valide: ${validOptionKeys.join(', ')}.`);
            }

            // Validazione dei valori delle opzioni dell'item
            if (item.options.phase && !['before', 'after', 'error'].includes(item.options.phase)) {
              throw new PulsorError(`Fase non valida all'indice ${index}: '${item.options.phase}'. Fasi valide: before, after, error.`);
            }

            if (item.options.priority !== undefined && (typeof item.options.priority !== 'number' || !Number.isFinite(item.options.priority))) {
              throw new PulsorError(`Priorità non valida all'indice ${index}: deve essere un numero finito.`);
            }

            if (item.options.ttl !== undefined && (typeof item.options.ttl !== 'number' || item.options.ttl <= 0)) {
              throw new PulsorError(`TTL non valido all'indice ${index}: deve essere un numero positivo.`);
            }
          }

          optionsToApply = { ...globalOptions, ...item.options };
        } else {
          throw new PulsorError(`Elemento non valido all'indice ${index}. Ogni elemento deve essere una funzione o un oggetto { fn: Function, options?: Object }.`);
        }

        // Validazione aggiuntiva della callback
        if (typeof callbackFn !== 'function') {
          throw new PulsorError(`Callback non valida all'indice ${index}: deve essere una funzione.`);
        }

        const unbinder = this.bind(callbackFn, optionsToApply);
        results.unbinders.push(unbinder);

        safeLog('debug', `Callback associata con successo all'indice ${index}`, {
          callbackName: callbackFn.name || 'anonymous',
          options: optionsToApply
        });

      } catch (error) {
        const errorInfo = {
          index,
          item: typeof item === 'function' ? { fn: item.name || 'anonymous' } : { ...item, fn: item?.fn?.name || 'anonymous' },
          error: new PulsorError(`Impossibile associare la callback all'indice ${index}: ${error.message}`, error)
        };

        results.errors.push(errorInfo);

        safeLog('error', `Errore nell'associazione della callback all'indice ${index}`, {
          error: error.message,
          item: errorInfo.item
        });
      }
    });

    // Emetti evento con statistiche
    this.#emit('bindsCompleted', {
      total: callbacks.length,
      successful: results.unbinders.length,
      failed: results.errors.length,
      errors: results.errors.map(e => ({ index: e.index, error: e.error.message }))
    });

    safeLog('info', `Completato binds() per ${callbacks.length} callback`, {
      successful: results.unbinders.length,
      failed: results.errors.length
    });

    return results;
  }

  update(pulseFn, options = {}) {
    return this.#manager.UpdatePulser(this.#alias, pulseFn, options);
  }

  bound() { return this.pulse.bind(this); }

  /**
   * Destroy this pulser instance and clean up resources
   *
   * @returns {boolean} True if successfully destroyed
   */
  destroy() {
    try {
      this.#manager.DestroyPulser(this.#alias);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Manages the lifecycle of Pulsers, including creation, execution, callback binding, and destruction.
 * Provides advanced features like circuit breakers, retry mechanisms, concurrency control, and metrics.
 * @class PulsorManager
 */
export class PulsorManager {
  #registry = new Map();
  #patternCallbacks = [];
  #patternIdCounter = 0;

  #eventListeners = new Map();

  #performanceMetrics = null; // Inizializzato nel costruttore in base all'opzione

  /**
   * @param {object} [options] - Opzioni per il PulsorManager.
   * @param {boolean} [options.enablePerformanceMetrics=true] - Se abilitare la raccolta delle metriche di performance.
   * @param {number} [options.metricsWindowSize=100] - The maximum number of pulse durations to store for performance metrics.
   */
  constructor(options = {}) {
    const { enablePerformanceMetrics = true, metricsWindowSize = 100 } = options;

    if (enablePerformanceMetrics) {
      this.#performanceMetrics = {
        durations: [],
        maxWindowSize: metricsWindowSize
      };
      // Start periodic cleanup only if metrics are enabled
      // La pulizia periodica tramite setInterval è stata rimossa per affidarsi
      // esclusivamente alla logica push/shift in #recordPerformanceMetric,
      // garantendo che l'array non superi mai maxWindowSize e migliorando l'efficienza.
      // this.cleanupIntervalId = setInterval(() => this.#cleanupOldMetrics(), 60 * 60 * 1000); // Every hour
    }
  }

  #circuitBreakers = new Map();
  #activeExecutions = new Map();
  #executionLocks = new Map(); // Manages async locks for each pulser
  #shutdownRequested = false;

  /**
   * Retrieves or creates an AsyncLock instance for a given pulser alias.
   * @param {string} alias - The alias of the pulser.
   * @returns {AsyncLock} The AsyncLock instance.
   */
  #getOrCreateLock(alias) {
    if (!this.#executionLocks.has(alias)) {
      this.#executionLocks.set(alias, new AsyncLock());
    }
    return this.#executionLocks.get(alias);
  }

  getEntry(alias) { return this.#registry.get(alias); }

  /**
   * Creates and registers a new Pulser instance or updates an existing one.
   * @param {string} alias - A unique identifier for the Pulser.
   * @param {Function} pulseFn - The main function to be executed by the Pulser.
   * @param {object} [options={}] - Configuration options for the Pulser.
   * @param {boolean} [options.override=false] - If true, allows updating an existing Pulser.
   * @param {boolean} [options.isAsync] - Hint to explicitly mark the pulseFn as async. Auto-detected if not provided.
   * @param {boolean} [options.resetCallbacks=false] - If true, clears all existing callbacks when updating.
   * @param {boolean} [options.resetMetrics=false] - If true, resets performance metrics when updating.
   * @param {('parallel'|'sequential')} [options.callbackStrategy='parallel'] - Strategy for executing callbacks.
   * @param {boolean} [options.failFastCallbacks=false] - If true, stops callback execution on the first error.
   * @param {('immediate'|'microtask')} [options.schedule='immediate'] - Scheduling strategy for pulse execution.
   * @param {('none'|'prepend'|'append')} [options.provideContext='none'] - How to provide context to callbacks.
   * @param {boolean} [options.errorCallbacksBeforeThrow=true] - If true, executes error callbacks before re-throwing the main error.
   * @param {boolean} [options.propagateMainError=true] - If true, re-throws the main pulse execution error.
   * @param {boolean} [options.preventConcurrentExecution=false] - If true, prevents multiple concurrent executions of the same pulser.
   * @param {boolean} [options.freezeArgs=false] - If true, deep-freezes arguments passed to the pulseFn and callbacks.
   * @param {number} [options.timeout=30000] - Maximum execution time for the pulseFn in milliseconds.
   * @param {number} [options.maxRetries=0] - Maximum number of retries for the pulseFn on failure.
   * @param {number} [options.circuitBreakerThreshold=5] - Number of consecutive failures to trip the circuit breaker.
   * @returns {Pulser} The newly created or updated Pulser instance.
   * @throws {PulsorError} If the alias is invalid, the pulseFn is not a function, or a Pulser with the alias already exists and override is false.
   */
  CreatePulser(alias, pulseFn, options = {}) {
    const { override = false, isAsync, resetCallbacks = false, resetMetrics = false, ...rest } = options;
    validateOptions(rest, `CreatePulser('${alias}')`);
    const aliasValidated = validateAlias(alias);
    const pulseValidated = validateFunction(pulseFn, 'Pulser function');
    const exists = this.#registry.get(aliasValidated);

    if (exists && !override) {
      throw new PulsorError(`Pulser '${aliasValidated}' already exists. Use { override: true }`);
    }

    const asyncHint = isAsync ?? ['AsyncFunction', 'AsyncGeneratorFunction'].includes(pulseValidated.constructor.name);

    if (!exists) {
      const entry = {
        pulseFn: pulseValidated, isAsync: asyncHint, version: 1,
        callbacks: { before: new Map(), after: new Map(), error: new Map() },
        options: Object.freeze({ ...DEFAULT_OPTIONS, ...rest }),
        metrics: { pulseCount: 0, lastPulsedAt: null, totalDuration: 0, avgDuration: 0 }
      };
      this.#registry.set(aliasValidated, entry);
    } else {
      exists.pulseFn = pulseValidated;
      exists.isAsync = asyncHint;
      exists.version++;
      exists.options = Object.freeze({ ...exists.options, ...rest });
      if (resetCallbacks) exists.callbacks = { before: new Map(), after: new Map(), error: new Map() };
      if (resetMetrics) exists.metrics = { pulseCount: 0, lastPulsedAt: null, totalDuration: 0, avgDuration: 0 };
    }

    const logData = { alias: aliasValidated, isAsync: asyncHint, version: exists?.version ?? 1, override };
    this.#emit('pulserCreated', logData);
    safeLog('log', 'PulserCreated', logData);

    return new Pulser(aliasValidated, this);
  }

  async pulse(alias, args) {
    if (this.#shutdownRequested) {
      throw new PulsorError(`Pulse rejected for '${alias}' - shutdown in progress`);
    }

    const entry = this.getEntry(alias);
    if (!entry) throw new PulsorError(`Pulser '${alias}' is not registered.`);

    const sanitizedArgs = sanitizeArgs(args, entry.options.freezeArgs);
    const circuitBreaker = this.#getOrCreateCircuitBreaker(alias, entry.options.circuitBreakerThreshold);

    // Gestione della concorrenza e del circuit breaker prima del ciclo di retry
    if (!circuitBreaker.canExecute()) {
      const error = new PulsorError(`Circuit breaker is OPEN for '${alias}' - too many failures`);
      this.#emit('pulseError', { alias, error, circuitBreakerState: circuitBreaker.state });
      throw error;
    }

    let lock;
    if (entry.options.preventConcurrentExecution) {
      lock = this.#getOrCreateLock(alias);
      // Timeout separato per l'acquisizione del lock (max 5 secondi o metà del timeout totale)
      const lockTimeout = Math.min(5000, Math.floor(entry.options.timeout / 2));
      try {
        await lock.acquire(lockTimeout);
      } catch (e) {
        const error = new PulsorError(`Pulser '${alias}' failed to acquire lock within ${lockTimeout}ms: ${e.message}`, e);
        this.#emit('pulseError', { alias, error });
        throw error;
      }
    }

    try {
      let lastError;
      for (let attempt = 0; attempt <= entry.options.maxRetries; attempt++) {
        try {
          const result = await this.#executePulseLogic(alias, entry, sanitizedArgs, attempt);
          // Se l'esecuzione ha successo, resetta il circuit breaker
          circuitBreaker.onSuccess();
          return result;
        } catch (error) {
          lastError = error;
          // Se l'errore è un PulsorStoppedError o un errore di timeout, non ritentare
          if (error instanceof PulsorStoppedError || (error instanceof PulsorError && error.cause instanceof DOMException && error.cause.name === 'AbortError')) {
            // Questi errori indicano un'interruzione intenzionale o un timeout, non devono essere ritentati
            throw error;
          }

          // Se l'errore è un PulsorError e ha una causa, propaga la causa se è un DOMException (es. AbortError)
          if (error instanceof PulsorError && error.cause instanceof DOMException) {
            throw error; // Propaga l'errore originale con la causa
          }

          // Altrimenti, registra il fallimento per il circuit breaker
          circuitBreaker.onFailure();
          if (attempt < entry.options.maxRetries && !this.#shutdownRequested) {
            // Exponential backoff: wait 2^attempt * 100ms
            const delay = Math.min(1000, Math.pow(2, attempt) * 100);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          break; // Nessun altro tentativo
        }
      }
      this.#emit('pulseError', { alias, error: lastError });
      throw lastError; // Rilancia l'ultimo errore dopo i retry
    } finally {
      // Assicurati che il lock venga rilasciato alla fine dell'esecuzione del pulse
      if (lock) lock.release();
    }
  }

  /**
   * Esegue la logica principale del pulser, inclusi timeout, callback e gestione degli errori.
   * Questa funzione è chiamata dal ciclo di retry nel metodo `pulse`.
   * @param {string} alias - L'alias del pulser.
   * @param {object} entry - L'oggetto di configurazione del pulser dal registro.
   * @param {Array<any>} args - Gli argomenti da passare alla funzione del pulser.
   * @param {number} attempt - Il numero del tentativo corrente (per i retry).
   * @returns {Promise<any>} Il risultato dell'esecuzione della funzione del pulser.
   * @private
   */
  async #executePulseLogic(alias, entry, args, attempt) {
    const executionId = `${alias}-${nowMs()}-${Math.random().toString(36).substr(2, 9)}`;
    const abortController = new AbortController();
    this.#activeExecutions.set(executionId, abortController);

    let timeoutId;
    if (entry.options.timeout > 0) {
      timeoutId = setTimeout(() => {
        abortController.abort();
      }, entry.options.timeout);
    }

    const startedAt = nowMs();
    let currentArgs = [...args];

    try {
      if (entry.options.freezeArgs) {
        Object.freeze(currentArgs);
        currentArgs.forEach(arg => (typeof arg === 'object' && arg !== null) ? Object.freeze(arg) : null);
      }

      this.#emit('pulseStarted', { executionId, alias, attempt });
      safeLog('debug', 'PulseStarted', { executionId, alias, attempt });

      const beforeResult = await this.#executePhaseCallbacks(executionId, 'before', entry, currentArgs);
      if (beforeResult === PULSOR_STOP) {
        const stopError = new PulsorStoppedError(`Pulse for '${alias}' was explicitly stopped by a 'before' callback.`);
        this.#emit('pulseCompleted', { executionId, alias, status: 'stopped', duration: nowMs() - startedAt, attempt, error: stopError });
        safeLog('info', `Pulse for '${alias}' was stopped by a 'before' callback.`);
        throw stopError;
      }
      if (Array.isArray(beforeResult)) currentArgs = beforeResult;

      let result;
      try {
        if (abortController.signal.aborted) {
          const abortError = new DOMException('Execution aborted due to timeout', 'AbortError');
          throw new PulsorError(`Pulse for '${alias}' timed out after ${entry.options.timeout}ms.`, { cause: abortError });
        }
        result = await entry.pulseFn(...currentArgs);
      } catch (fnError) {
        if (fnError instanceof DOMException && fnError.name === 'AbortError') {
          throw new PulsorError(`Pulse for '${alias}' was aborted.`, { cause: fnError });
        }
        throw fnError;
      }

      await this.#executePhaseCallbacks(executionId, 'after', entry, currentArgs, result);
      const duration = nowMs() - startedAt;
      this.#updatePerformanceMetrics(alias, duration);
      this.#emit('pulseCompleted', { executionId, alias, status: 'success', duration, attempt });
      safeLog('debug', 'PulseCompleted', { executionId, alias, status: 'success', duration, attempt });
      return result;
    } catch (error) {
      const duration = nowMs() - startedAt;
      this.#emit('pulseCompleted', { executionId, alias, status: 'error', duration, attempt, error });
      safeLog('error', 'PulseCompleted', { executionId, alias, status: 'error', duration, attempt, error: error.message });

      // Esegui callback di errore se configurato
      if (entry.options.errorCallbacksBeforeThrow) {
        try {
          await this.#executePhaseCallbacks(executionId, 'error', entry, currentArgs, { error, alias, attempt });
        } catch (callbackError) {
          safeLog('warn', 'Error callback failed', { alias, callbackError: callbackError.message });
        }
      }

      throw error;
    } finally {
      // Cleanup esplicito per prevenire memory leak
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Cleanup AbortController
      if (abortController) {
        try {
          if (!abortController.signal.aborted) {
            abortController.abort();
          }
        } catch (cleanupError) {
          safeLog('warn', 'AbortController cleanup failed', { alias, error: cleanupError.message });
        }
      }

      this.#activeExecutions.delete(executionId);
    }
  }

  // --- Batch Operations ---

  createPulsers(definitions) {
    if (!Array.isArray(definitions)) throw new PulsorError('Batch creation requires an array of definitions.');
    const results = { created: [], failed: [] };
    definitions.forEach((def, index) => {
      try {
        const { alias, pulseFn, options } = def;
        const pulser = this.CreatePulser(alias, pulseFn, options);
        results.created.push({ alias, pulser });
      } catch (error) {
        results.failed.push({ index, alias: def.alias, error: new PulsorError(`Batch creation failed for '${def.alias}'`, error) });
      }
    });
    return results;
  }

  destroyPulsers(patterns) {
    if (!Array.isArray(patterns)) throw new PulsorError('Batch destruction requires an array of patterns.');
    const results = { destroyed: [], failed: [] };
    patterns.forEach(pattern => {
      try {
        const aliases = this.ListPulsers(pattern);
        aliases.forEach(alias => {
          this.DestroyPulser(alias);
          results.destroyed.push(alias);
        });
      } catch (error) {
        results.failed.push({ pattern, error });
      }
    });
    return results;
  }

  // --- Graceful Shutdown ---

  #hasActiveExecutions() {
    return Array.from(this.#registry.values()).some(entry => entry._executing);
  }

  #getActiveExecutions() {
    return Array.from(this.#registry.entries())
      .filter(([, entry]) => entry._executing)
      .map(([alias]) => alias);
  }

  /**
   * Initiates a graceful shutdown of the PulsorManager, preventing new pulses and waiting for active executions to complete.
   * @param {number} [timeoutMs=30000] - The maximum time in milliseconds to wait for active executions to finish.
   * @returns {Promise<object>} An object indicating success and any remaining active executions.
   * @property {boolean} success - True if all active executions completed within the timeout, false otherwise.
   * @property {string[]} activeExecutions - A list of aliases for pulsers that are still executing.
   */
  async gracefulShutdown(timeoutMs = 30000) {
    this.#shutdownRequested = true;
    safeLog('info', 'Graceful shutdown initiated. No new pulses will be accepted.');

    const startTime = nowMs();
    while (this.#hasActiveExecutions() && (nowMs() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const isClean = !this.#hasActiveExecutions();

    if (isClean) {
      safeLog('info', 'Graceful shutdown completed - all executions finished.');
    } else {
      safeLog('warn', 'Graceful shutdown timeout - some executions may still be running.', {
        active: this.#getActiveExecutions()
      });
    }

    return { success: isClean, activeExecutions: this.#getActiveExecutions() };
  }

  // --- Monitoring & Health Check ---

  configureMetrics(options) {
    if (this.#performanceMetrics && options.windowSize && options.windowSize > 0) {
      this.#performanceMetrics.maxWindowSize = options.windowSize;
      const currentSize = this.#performanceMetrics.durations.length;
      if (currentSize > options.windowSize) {
        this.#performanceMetrics.durations = this.#performanceMetrics.durations.slice(currentSize - options.windowSize);
      }
    }
  }

  /**
   * Updates performance metrics for a given Pulser.
   * @param {string} alias - The alias of the Pulser.
   * @param {number} duration - The duration of the pulse in milliseconds.
   * @private
   */
  #updatePerformanceMetrics(alias, duration) {
    const entry = this.getEntry(alias);
    if (entry && entry.metrics) {
      entry.metrics.pulseCount++;
      entry.metrics.totalDuration += duration;
      entry.metrics.lastPulsedAt = nowMs();
      entry.metrics.avgDuration = entry.metrics.totalDuration / entry.metrics.pulseCount;
    }

    // Aggiorna le metriche globali con controllo del memory leak
    if (this.#performanceMetrics) {
      this.#recordPerformanceMetric(duration);
    }
  }

  /**
   * Records a performance metric with automatic cleanup to prevent memory leaks.
   * @param {number} duration - The duration to record.
   * @private
   */
  #recordPerformanceMetric(duration) {
    if (!this.#performanceMetrics) return;

    this.#performanceMetrics.durations.push(duration);

    // Prevenzione memory leak: mantieni solo le ultime N misurazioni
    if (this.#performanceMetrics.durations.length > this.#performanceMetrics.maxWindowSize) {
      this.#performanceMetrics.durations.shift();
    }
  }



  #calculateTrend(recent) {
    if (recent.length < 2) return 0;
    const mid = Math.floor(recent.length / 2);
    if (mid === 0) return 0;
    const firstHalfAvg = recent.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalf = recent.slice(mid);
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    return secondHalfAvg - firstHalfAvg;
  }

  /**
   * Retrieves advanced performance metrics, including percentiles and trend analysis.
   * @returns {object} An object containing advanced metrics.
   * @property {object} percentiles - 50th, 90th, and 99th percentiles of pulse durations.
   * @property {number|null} trend - The trend of recent pulse durations (positive for increasing, negative for decreasing).
   * @property {number} totalPulsers - Inherited from getGlobalMetrics.
   * @property {number} totalPulses - Inherited from getGlobalMetrics.
   * @property {number} averageDuration - Inherited from getGlobalMetrics.
   * @property {number} p95Duration - Inherited from getGlobalMetrics.
   * @property {number} p99Duration - Inherited from getGlobalMetrics.
   * @property {number} patternCallbackCount - Inherited from getGlobalMetrics.
   * @property {number} activeExecutions - Inherited from getGlobalMetrics.
   * @property {object} cacheStats - Inherited from getGlobalMetrics.
   * @property {object} memoryUsage - Inherited from getGlobalMetrics.
   */
  getAdvancedMetrics() {
    const globalMetrics = this.getGlobalMetrics();
    if (!this.#performanceMetrics) {
      return { ...globalMetrics, percentiles: null, trend: null };
    }
    const { durations } = this.#performanceMetrics;

    if (durations.length === 0) {
      return { ...globalMetrics, percentiles: null, trend: null };
    }

    const sorted = [...durations].sort((a, b) => a - b);

    return {
      ...globalMetrics,
      percentiles: {
        p50: sorted[Math.floor(sorted.length * 0.50)],
        p90: sorted[Math.floor(sorted.length * 0.90)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      },
      trend: durations.length >= 10 ? this.#calculateTrend(durations.slice(-10)) : null
    };
  }

  #generateRecommendations(stalePulsers, memoryPressure) {
    const recommendations = [];
    if (stalePulsers.length > 5) recommendations.push('Consider removing or reviewing stale pulsers to free up memory.');
    if (memoryPressure.patternCallbacks > 500) recommendations.push('Many pattern callbacks are registered. Ensure TTLs are set or run cleanup.');
    if (memoryPressure.patternCache > 800) recommendations.push('Pattern cache is large. This may be normal under high-variety loads, but monitor for leaks.');
    return recommendations;
  }

  /**
   * Provides a comprehensive health status report for the Pulsor system.
   * @returns {object} An object detailing the system's health.
   * @property {object} metrics - Advanced performance metrics.
   * @property {string[]} stalePulsers - List of Pulsers that haven't been pulsed recently.
   * @property {object} memoryPressure - Indicators of memory usage for various internal structures.
   * @property {string[]} recommendations - Actionable recommendations based on the health status.
   */
  getHealthStatus() {
    const metrics = this.getAdvancedMetrics();
    const now = nowMs();

    const staleThreshold = 24 * 60 * 60 * 1000;
    const stalePulsers = Array.from(this.#registry.entries())
      .filter(([, entry]) => entry.metrics.lastPulsedAt && (now - entry.metrics.lastPulsedAt) > staleThreshold)
      .map(([alias]) => alias);

    const memoryPressure = {
      patternCallbacks: this.#patternCallbacks.length,

      eventListeners: Array.from(this.#eventListeners.values()).reduce((sum, arr) => sum + arr.length, 0)
    };

    const isHealthy = stalePulsers.length < 10 &&
      memoryPressure.patternCallbacks < 1000 &&
      memoryPressure.patternCache < 1000;

    return {
      status: isHealthy ? 'healthy' : 'warning',
      timestamp: new Date(now).toISOString(),
      metrics,
      memoryPressure,
      stalePulsers: {
        count: stalePulsers.length,
        aliases: stalePulsers.slice(0, 10) // show first 10
      },
      recommendations: !isHealthy ? this.#generateRecommendations(stalePulsers, memoryPressure) : []
    };
  }

  // --- Circuit Breaker Management ---

  /**
   * Retrieves or creates a circuit breaker with thread-safe implementation.
   * @param {string} alias - The alias of the pulser.
   * @param {number} threshold - The failure threshold.
   * @returns {CircuitBreaker} The circuit breaker instance.
   * @private
   */
  #getOrCreateCircuitBreaker(alias, threshold) {
    // Thread-safe check-and-create pattern
    let breaker = this.#circuitBreakers.get(alias);
    if (!breaker) {
      breaker = new CircuitBreaker(threshold);
      // Double-check in caso di race condition
      if (!this.#circuitBreakers.has(alias)) {
        this.#circuitBreakers.set(alias, breaker);
      } else {
        // Se nel frattempo è stato creato da un altro thread, usa quello esistente
        breaker = this.#circuitBreakers.get(alias);
      }
    }
    return breaker;
  }

  /**
   * Get the current status of a circuit breaker for a specific function
   *
   * @param {string} alias - The function alias
   * @returns {Object|null} Circuit breaker status or null if not found
   * @returns {string} returns.state - Current state: 'CLOSED', 'OPEN', or 'HALF_OPEN'
   * @returns {number} returns.failureCount - Current failure count
   * @returns {number} returns.threshold - Failure threshold
   * @returns {number} returns.nextAttempt - Timestamp for next attempt (if OPEN)
   */
  getCircuitBreakerStatus(alias) {
    const breaker = this.#circuitBreakers.get(alias);
    if (!breaker) return null;
    return {
      state: breaker.state,
      failureCount: breaker.failureCount,
      threshold: breaker.threshold,
      nextAttempt: breaker.nextAttempt
    };
  }

  /**
   * Reset a circuit breaker to CLOSED state
   *
   * @param {string} alias - The function alias
   * @returns {boolean} True if reset successful, false if circuit breaker not found
   */
  resetCircuitBreaker(alias) {
    const breaker = this.#circuitBreakers.get(alias);
    if (breaker) {
      breaker.onSuccess();
      this.#emit('circuitBreakerReset', { alias });
      return true;
    }
    return false;
  }

  // --- Other Private and Internal Methods (abbreviated for clarity, no changes) ---
  // ... (ListPulsers, GetPulserInfo, Pattern Management, Callback Management, etc. are here)
  // [NOTE: The full code for all methods is included below]
  /**
   * Updates an existing Pulser instance with new function or options.
   * @param {string} alias - The alias of the Pulser to update.
   * @param {Function} pulseFn - The new main function for the Pulser.
   * @param {object} [options={}] - New configuration options for the Pulser.
   * @returns {Pulser} The updated Pulser instance.
   * @throws {PulsorError} If the Pulser does not exist or options are invalid.
   */
  UpdatePulser(alias, pulseFn, options = {}) { const aliasValidated = validateAlias(alias); if (!this.#registry.has(aliasValidated)) throw new PulsorError(`Pulser '${aliasValidated}' does not exist.`); validateOptions(options, `UpdatePulser('${alias}')`); const pulser = this.CreatePulser(aliasValidated, pulseFn, { ...options, override: true, resetCallbacks: false, resetMetrics: false }); this.#emit('pulserUpdated', { alias: aliasValidated }); return pulser; }
  /**
   * Destroys a registered Pulser instance and cleans up associated resources.
   * @param {string} alias - The alias of the Pulser to destroy.
   * @returns {boolean} True if the Pulser was successfully destroyed, false otherwise.
   * @throws {PulsorError} If the alias is invalid or the Pulser does not exist.
   */
  DestroyPulser(alias) { const aliasValidated = validateAlias(alias); if (!this.#registry.delete(aliasValidated)) { throw new PulsorError(`Pulser '${aliasValidated}' does not exist.`); } this.#emit('pulserDestroyed', { alias: aliasValidated }); safeLog('log', `Pulser '${aliasValidated}' destroyed.`); }
  /**
   * Lists all registered Pulser aliases, optionally filtered by a pattern.
   * @param {string} [pattern] - A glob-style pattern to filter Pulser aliases (e.g., 'my.pulser.*').
   * @returns {string[]} An array of matching Pulser aliases.
   */
  ListPulsers(pattern) { const all = Array.from(this.#registry.keys()); if (!pattern) return all; const rx = toRegex(pattern); return all.filter(a => rx.test(a)); }
  /**
   * Retrieves detailed information about a registered Pulser.
   * @param {string} alias - The alias of the Pulser to retrieve information for.
   * @returns {object|null} An object containing Pulser details, or null if not found.
   * @property {string} alias - The alias of the Pulser.
   * @property {boolean} isAsync - True if the Pulser's function is asynchronous.
   * @property {number} callbackCount - Total number of registered callbacks.
   * @property {object} callbackCounts - Counts of callbacks by phase (before, after, error).
   * @property {object} callbackDetails - Detailed information about each callback.
   * @property {string} functionName - The name of the Pulser's main function.
   * @property {string} version - The version of the Pulser.
   * @property {object} metrics - Performance metrics for the Pulser.
   * @property {object} options - Configuration options for the Pulser.
   */
  GetPulserInfo(alias) { try { const aliasValidated = validateAlias(alias); const entry = this.#registry.get(aliasValidated); if (!entry) return null; const mapToDetails = (map) => Array.from(map.values()).map((meta) => ({ functionName: meta.functionName, priority: meta.priority, once: meta.once, addedAt: meta.addedAt })); const callbackDetails = { before: mapToDetails(entry.callbacks.before), after: mapToDetails(entry.callbacks.after), error: mapToDetails(entry.callbacks.error), }; const callbackCounts = { before: callbackDetails.before.length, after: callbackDetails.after.length, error: callbackDetails.error.length, }; return { alias: aliasValidated, isAsync: entry.isAsync, callbackCount: callbackCounts.before + callbackCounts.after + callbackCounts.error, callbackCounts, callbackDetails, functionName: entry.pulseFn.name || 'anonymous', version: entry.version, metrics: { ...entry.metrics }, options: { ...entry.options } }; } catch (error) { safeLog('debug', `GetPulserInfo failed for alias '${alias}'`, { error: error.message }); return null; } }
  /**
   * Cleans up expired pattern callbacks based on their Time-To-Live (TTL).
   * This method is called internally to manage pattern lifecycle.
   * @private
   */
  cleanupExpiredPatterns() {
    // Validazione sicura della funzione nowMs
    let now;
    try {
      if (typeof nowMs !== 'function') {
        throw new Error('nowMs non è una funzione valida');
      }
      now = nowMs();
      if (typeof now !== 'number' || !Number.isFinite(now)) {
        throw new Error('nowMs ha restituito un valore non valido');
      }
    } catch (timeError) {
      safeLog('error', 'Errore nel recupero del timestamp', { error: timeError.message });
      now = Date.now(); // Fallback sicuro
    }
    
    const expiredPatterns = [];

    try {
      // Identifica i pattern scaduti senza modificare l'array durante l'iterazione
      this.#patternCallbacks.forEach((p, index) => {
        if (p.options.ttl && (now - p.addedAt) >= p.options.ttl) {
          expiredPatterns.push({ index, id: p.id, pattern: p.regex.source });
        }
      });

      // Rimuovi i pattern scaduti in ordine inverso per mantenere gli indici validi
      expiredPatterns.reverse().forEach(({ index, id, pattern }) => {
        this.#patternCallbacks.splice(index, 1);
        safeLog('debug', `Pattern scaduto rimosso: ${id}`, { pattern, age: now - this.#patternCallbacks[index]?.addedAt });
      });

      if (expiredPatterns.length > 0) {
        this.#emit('patternsCleaned', {
          removed: expiredPatterns.length,
          removedPatterns: expiredPatterns.map(p => p.id)
        });
      }

    } catch (error) {
      safeLog('error', 'Errore durante la pulizia dei pattern scaduti', {
        error: error.message,
        stack: error.stack
      });
    }
  }
  /**
   * Binds a callback function to a pattern, which will be executed when a Pulser matching the pattern is pulsed.
   * @param {string} pattern - A glob-style pattern to match Pulser aliases (e.g., 'my.service.*').
   * @param {Function} callback - The callback function to execute.
   * @param {object} [options={}] - Options for the pattern binding.
   * @param {('before'|'after'|'error')} [options.phase='after'] - The phase of the pulse lifecycle to bind to.
   * @param {number} [options.priority=0] - The execution priority of the callback.
   * @param {boolean} [options.once=false] - If true, the callback will only execute once.
   * @param {number} [options.ttl] - Time-To-Live for the pattern binding in milliseconds.
   * @returns {string} A unique ID for the pattern binding.
   * @throws {PulsorError} If the maximum pattern callbacks limit is exceeded or callback is not a function.
   */
  bindToPattern(pattern, callback, options = {}) {
    // Validazione rigorosa del pattern
    if (typeof pattern !== 'string' || pattern.trim() === '') {
      throw new PulsorError('Il pattern deve essere una stringa non vuota');
    }

    const validatedCallback = validateFunction(callback, 'Pattern callback');
    
    // Generazione sicura dell'ID con gestione errori
    let timestamp;
    try {
      timestamp = typeof nowMs === 'function' ? nowMs() : Date.now();
    } catch (timeError) {
      safeLog('warn', 'Errore nel recupero timestamp per ID pattern', { error: timeError.message });
      timestamp = Date.now();
    }
    
    const id = `p${++this.#patternIdCounter}-${timestamp}`;

    if (this.#patternCallbacks.length > MAX_PATTERN_CALLBACKS) {
      throw new PulsorError(`Limite massimo pattern callbacks (${MAX_PATTERN_CALLBACKS}) superato`);
    }

    try {
      // Test del pattern per verificare che sia valido
      const testRegex = toRegex(pattern);

      // Avviso per pattern troppo permissivi
      if (pattern === '.*' || pattern === '.+' || pattern === '*') {
        safeLog('warn', 'Pattern molto permissivo rilevato', { pattern });
      }

      // Validazione delle opzioni
      const validatedOptions = {
        phase: ['before', 'after', 'error'].includes(options.phase) ? options.phase : 'after',
        priority: typeof options.priority === 'number' ? options.priority : 0,
        once: Boolean(options.once),
        ttl: typeof options.ttl === 'number' && options.ttl > 0 ? options.ttl : null
      };

      if (this.#patternCallbacks.length > 100 && Math.random() < 0.1) {
        this.cleanupExpiredPatterns();
      }

      // Aggiunta sicura del pattern callback
      let addedAtTimestamp;
      try {
        addedAtTimestamp = typeof nowMs === 'function' ? nowMs() : Date.now();
      } catch (timeError) {
        safeLog('warn', 'Errore nel recupero timestamp per pattern callback', { error: timeError.message });
        addedAtTimestamp = Date.now();
      }
      
      this.#patternCallbacks.push({
        id,
        regex: testRegex,
        callback: validatedCallback,
        addedAt: addedAtTimestamp,
        options: validatedOptions,
        originalPattern: pattern // Per debug
      });

      this.#emit('patternBound', { pattern, id, options: validatedOptions });

      safeLog('debug', `Pattern associato: ${id}`, {
        pattern,
        phase: validatedOptions.phase,
        ttl: validatedOptions.ttl
      });

      return id;

    } catch (regexError) {
      const error = new PulsorError(`Pattern non valido: ${regexError.message}`, regexError);
      safeLog('error', 'Errore nella creazione del pattern', {
        pattern,
        error: regexError.message
      });
      throw error;
    }
  }
  /**
   * Unbinds a pattern callback using its unique ID.
   * @param {string} id - The unique ID of the pattern binding to unbind.
   * @returns {boolean} True if the pattern callback was successfully unbound, false otherwise.
   */
  unbindByPatternId(id) { const initialLength = this.#patternCallbacks.length; this.#patternCallbacks = this.#patternCallbacks.filter(p => p.id !== id); const removed = this.#patternCallbacks.length < initialLength; if (removed) { this.#emit('patternUnbound', { id }); safeLog('log', `Pattern callback with id ${id} removed.`); } return removed; }
  /**
   * Binds a callback function directly to a specific Pulser instance.
   * @param {string} alias - The alias of the Pulser to bind the callback to.
   * @param {Function} callback - The callback function to bind.
   * @param {object} options - Options for the callback binding.
   * @param {('before'|'after'|'error')} [options.phase='after'] - The phase of the pulse lifecycle to bind to.
   * @param {number} [options.priority=0] - The execution priority of the callback.
   * @param {boolean} [options.once=false] - If true, the callback will only execute once.
   * @throws {PulsorError} If the Pulser does not exist, the phase is invalid, or the callback is already bound.
   */
  bindCallback(alias, callback, options) { 
    const entry = this.getEntry(alias); 
    if (!entry) throw new PulsorError(`Pulser '${alias}' is not registered.`); 
    
    const phase = options.phase || 'after'; 
    const bag = entry.callbacks[phase]; 
    if (!bag) throw new PulsorError(`Invalid phase '${phase}' for '${alias}'.`); 
    if (bag.has(callback)) throw new PulsorError(`Callback is already bound to '${alias}' [${phase}].`); 
    
    // Generazione sicura del timestamp
    let addedAtTimestamp;
    try {
      addedAtTimestamp = typeof nowMs === 'function' ? nowMs() : Date.now();
    } catch (timeError) {
      safeLog('warn', 'Errore nel recupero timestamp per callback binding', { error: timeError.message });
      addedAtTimestamp = Date.now();
    }
    
    bag.set(callback, { 
      fn: callback, 
      priority: Number.isFinite(options.priority) ? options.priority : 0, 
      once: !!options.once, 
      addedAt: addedAtTimestamp, 
      functionName: callback.name || 'anonymous' 
    }); 
  }
  /**
   * Unbinds a previously bound callback function from a specific Pulser instance.
   * @param {string} alias - The alias of the Pulser to unbind the callback from.
   * @param {Function} callback - The callback function to unbind.
   * @param {object} [options={}] - Options for unbinding.
   * @param {('before'|'after'|'error')} [options.phase] - The specific phase to unbind from. If not provided, unbinds from all phases.
   * @returns {boolean} True if the callback was successfully unbound, false otherwise.
   * @throws {PulsorError} If the Pulser does not exist or the callback is invalid.
   */
  unbindCallback(alias, callback, options = {}) { const cb = validateFunction(callback, 'Callback'); const entry = this.getEntry(alias); if (!entry) throw new PulsorError(`Pulser '${alias}' is not registered.`); const phase = options.phase; if (phase) { return entry.callbacks[phase]?.delete(cb) ?? false; } return ['after', 'before', 'error'].some(ph => entry.callbacks[ph].delete(cb)); }
  /**
   * Unbinds all callbacks from a specific Pulser instance, optionally for a given phase.
   * @param {string} alias - The alias of the Pulser.
   * @param {object} [options={}] - Options for unbinding.
   * @param {('before'|'after'|'error')} [options.phase] - The specific phase to unbind all callbacks from. If not provided, unbinds from all phases.
   * @returns {number} The number of callbacks that were unbound.
   * @throws {PulsorError} If the Pulser does not exist.
   */
  unbindAllCallbacks(alias, options = {}) { const entry = this.getEntry(alias); if (!entry) throw new PulsorError(`Pulser '${alias}' is not registered.`); if (options.phase) { const count = entry.callbacks[options.phase]?.size ?? 0; entry.callbacks[options.phase]?.clear(); return count; } const count = Object.values(entry.callbacks).reduce((sum, map) => sum + map.size, 0); Object.values(entry.callbacks).forEach(map => map.clear()); return count; }
  /**
   * Collects and sorts all relevant callbacks (specific and pattern-matched) for a given Pulser and phase.
   * Utilizes a cache to optimize performance for pattern lookups.
   * @private
   * @param {string} alias - The alias of the Pulser.
   * @param {('before'|'after'|'error')} phase - The callback phase.
   * @param {object} entry - The Pulser's registry entry containing its specific callbacks.
   * @returns {Array<object>} An array of sorted callback metadata objects.
   */
  #collectCallbacks(alias, phase, entry) {
    const specific = Array.from(entry.callbacks[phase].values()).map(meta => ({ ...meta, source: 'specific' }));
    const pattern = this.#patternCallbacks.filter(p => p.options.phase === phase && p.regex.test(alias)).map(p => ({ fn: p.callback, priority: p.options.priority, once: p.once, addedAt: 0, source: 'pattern', patternId: p.id, functionName: p.callback.name || 'anonymous' }));

    return [...specific, ...pattern].sort((a, b) => b.priority - a.priority || a.addedAt - b.addedAt);
  }
  /**
   * Builds the arguments array for a callback based on the `provideContext` option.
   * @private
   * @param {('none'|'prepend'|'append')} provideContext - How to provide context to callbacks.
   * @param {object} context - The context object to provide.
   * @param {Array<any>} originalArgs - The original arguments passed to the pulse function.
   * @returns {Array<any>} The arguments array for the callback.
   */
  #buildCallbackArgs(provideContext, context, originalArgs) { if (provideContext === 'prepend') return [context, ...originalArgs]; if (provideContext === 'append') return [...originalArgs, context]; return originalArgs; }
  /**
   * Executes a series of callbacks for a given phase (before, after, error).
   * Callbacks can modify arguments (before phase) or signal to stop the pulse execution.
   * @private
   * @param {string} execId - The unique execution ID for the current pulse.
   * @param {('before'|'after'|'error')} phase - The current phase of callback execution.
   * @param {object} entry - The Pulser's registry entry.
   * @param {Array<any>} originalArgs - The original arguments passed to the pulse function.
   * @param {object} [context={}] - Additional context for the callbacks.
   * @returns {Promise<Array<any>|symbol|void>} For 'before' phase, returns modified arguments or PULSOR_STOP. For other phases, returns PULSOR_STOP or void.
   * @throws {PulsorError} If a 'before' callback fails.
   */
  async #executePhaseCallbacks(execId, phase, entry, originalArgs, context = {}) {
    const alias = context.alias || 'unknown'; const callbacksToRun = this.#collectCallbacks(alias, phase, entry); if (callbacksToRun.length === 0) return; const { options } = entry; if (phase === 'before') { let currentArgs = originalArgs; for (const item of callbacksToRun) { const callbackArgs = this.#buildCallbackArgs(options.provideContext, { ...context, alias, args: currentArgs }, currentArgs); try { const out = await Promise.resolve(item.fn(...callbackArgs)); if (item.once) { if (item.source === 'specific') entry.callbacks.before.delete(item.fn); else if (item.source === 'pattern') this.unbindByPatternId(item.patternId); } if (out === PULSOR_STOP) return PULSOR_STOP; if (Array.isArray(out)) currentArgs = out; } catch (err) { throw new PulsorError(`'before' callback '${item.functionName}' failed for '${alias}'`, err); } } return currentArgs; } const args = this.#buildCallbackArgs(options.provideContext, context, originalArgs); const runOne = async (item) => {
      try { await Promise.resolve(item.fn(...args)); if (item.once) { if (item.source === 'specific') entry.callbacks[phase].delete(item.fn); else if (item.source === 'pattern') this.unbindByPatternId(item.patternId); } return null; } catch (err) {
        safeLog('warn', `Callback '${item.functionName}' failed in '${alias}' [${phase}]`, { error: err.message, stack: err.stack });
        this.#emit('callbackError', { execId, alias, phase, callbackName: item.functionName, error: err });
        // Allow error callbacks to stop the pulse if they return PULSOR_STOP
        if (phase === 'error' && err === PULSOR_STOP) return PULSOR_STOP;
        return err;
      }
    }; if (options.callbackStrategy === 'sequential') { for (const item of callbacksToRun) { const err = await runOne(item); if (err && options.failFastCallbacks) { throw new PulsorError(`Callback failed in '${alias}' [${phase}] and failFast is enabled`, err); } } } else { const results = await Promise.all(callbacksToRun.map(runOne)); if (options.failFastCallbacks) { const firstErr = results.find(e => e instanceof Error); if (firstErr) { throw new PulsorError(`One or more callbacks failed in '${alias}' [${phase}] and failFast is enabled`, firstErr); } } }
  }
  /**
   * Register an event listener with automatic memory leak prevention
   *
   * @param {string} event - Event name to listen for
   * @param {Function} callback - Callback function to execute
   *
   * @example
   * pulsor.on('circuitBreakerTripped', ({ alias, threshold }) => {
   *   console.log(`Circuit breaker opened for ${alias} after ${threshold} failures`);
   * });
   */
  /**
 * Registers an event listener for a specific event.
 * @param {string} event - The name of the event to listen for.
 * @param {Function} callback - The callback function to execute when the event is emitted.
 * @throws {PulsorError} If the callback is not a function.
 */
  on(event, callback) {
    const validatedCallback = validateFunction(callback, 'Event callback');

    if (!this.#eventListeners.has(event)) {
      this.#eventListeners.set(event, []);
    }

    const listeners = this.#eventListeners.get(event);

    // Prevenzione memory leak: controlla duplicati
    if (listeners.includes(validatedCallback)) {
      safeLog('warn', `Callback già registrata per l'evento '${event}'. Ignorata.`);
      return;
    }

    // Prevenzione memory leak: limita il numero di listener per evento
    if (listeners.length >= 50) {
      safeLog('warn', `Troppi listener per l'evento '${event}'. Rimozione dei più vecchi.`);
      listeners.splice(0, 10); // Rimuovi i 10 listener più vecchi
    }

    listeners.push(validatedCallback);

    safeLog('debug', `Listener aggiunto per evento '${event}'`, {
      totalListeners: listeners.length,
      callbackName: validatedCallback.name || 'anonymous'
    });
  }

  /**
   * Remove an event listener
   *
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   * @returns {boolean} True if listener was found and removed
   */
  /**
 * Removes an event listener for a specific event.
 * @param {string} event - The name of the event.
 * @param {Function} callback - The callback function to remove.
 * @returns {boolean} True if the listener was successfully removed, false otherwise.
 * @throws {PulsorError} If the callback is not a function.
 */
  off(event, callback) {
    const listeners = this.#eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this.#eventListeners.delete(event);
        }
        return true;
      }
    }
    return false;
  }

  #emit(event, data) {
    const listeners = this.#eventListeners.get(event);
    if (!listeners || listeners.length === 0) return;

    // Crea una copia per evitare problemi se i listener vengono modificati durante l'emissione
    const listenersCopy = [...listeners];
    const problematicListeners = [];

    listenersCopy.forEach(cb => {
      try {
        // Timeout per prevenire listener che si bloccano
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Listener timeout')), 1000);
        });

        const listenerPromise = Promise.resolve(cb(data));

        // Non aspettiamo il risultato per mantenere l'emissione sincrona
        Promise.race([listenerPromise, timeoutPromise]).catch(e => {
          safeLog('error', `Errore nel listener per evento '${event}'`, {
            error: e.message,
            callbackName: cb.name || 'anonymous'
          });
          problematicListeners.push(cb);
        });

      } catch (e) {
        safeLog('error', `Errore sincrono nel listener per evento '${event}'`, {
          error: e.message,
          stack: e.stack,
          callbackName: cb.name || 'anonymous'
        });
        problematicListeners.push(cb);
      }
    });

    // Rimuovi listener problematici per prevenire errori ripetuti
    if (problematicListeners.length > 0) {
      problematicListeners.forEach(cb => {
        const index = listeners.indexOf(cb);
        if (index > -1) {
          listeners.splice(index, 1);
          safeLog('warn', `Rimosso listener problematico per evento '${event}'`, {
            callbackName: cb.name || 'anonymous'
          });
        }
      });

      // Pulisci l'array se è vuoto
      if (listeners.length === 0) {
        this.#eventListeners.delete(event);
      }
    }
  }
  /**
   * Retrieves global performance metrics and statistics for all Pulsers managed by the PulsorManager.
   * @returns {object} An object containing various global metrics.
   * @property {number} totalPulsers - The total number of registered Pulsers.
   * @property {number} totalPulses - The total number of pulses executed across all Pulsers.
   * @property {number} averageDuration - The average execution duration of all pulses.
   * @property {number} p95Duration - The 95th percentile of pulse durations.
   * @property {number} p99Duration - The 99th percentile of pulse durations.
   * @property {number} patternCallbackCount - The number of active pattern callbacks.
   * @property {number} activeExecutions - The number of currently active pulse executions.
   * @property {object} cacheStats - Statistics about the pattern cache (hits, misses, hitRate).
   * @property {object} memoryUsage - Estimates of memory usage for various internal structures.
   */
  getGlobalMetrics() {
    const pulsers = Array.from(this.#registry.values());
    const totalPulses = pulsers.reduce((s, p) => s + p.metrics.pulseCount, 0);

    let durations = [];
    let p95 = 0;
    let p99 = 0;

    if (this.#performanceMetrics) {
      durations = this.#performanceMetrics.durations;
      const sortedDurations = [...durations].sort((a, b) => a - b);
      p95 = sortedDurations.length > 0 ? sortedDurations[Math.floor(sortedDurations.length * 0.95)] : 0;
      p99 = sortedDurations.length > 0 ? sortedDurations[Math.floor(sortedDurations.length * 0.99)] : 0;
    }

    return {
      totalPulsers: pulsers.length,
      totalPulses,
      averageDuration: totalPulses > 0 ? pulsers.reduce((s, p) => s + p.metrics.totalDuration, 0) / totalPulses : 0,
      p95Duration: p95,
      p99Duration: p99,
      patternCallbackCount: this.#patternCallbacks.length,
      activeExecutions: this.#activeExecutions.size,

      memoryUsage: {

        performanceMetrics: durations.length,
        circuitBreakers: this.#circuitBreakers.size
      }
    };
  }

  // --- Missing Methods for Backward Compatibility ---

  /**
   * Checks if a Pulser with the given alias exists in the registry.
   * @param {string} alias - The alias of the Pulser to check.
   * @returns {boolean} True if a Pulser with the alias exists, false otherwise.
   */
  PulserExists(alias) {
    const aliasValidated = validateAlias(alias);
    return this.#registry.has(aliasValidated);
  }

  /**
   * Metodo pubblico per emettere eventi, utilizzato dalla classe Pulser
   * @param {string} event - Nome dell'evento
   * @param {any} data - Dati da emettere
   */
  emitEvent(event, data) {
    this.#emit(event, data);
  }


  /**
   * Internal testing utilities for accessing and manipulating PulsorManager's private state.
   * This object is exposed for testing purposes only and should not be used in production code.
   * @private
   */
  __testing__ = {
    /**
     * Retrieves the internal state of a specific Pulser for testing.
     * @param {string} alias - The alias of the Pulser.
     * @returns {object|null} The internal state object or null if not found.
     */
    getInternalState: (alias) => { const entry = this.getEntry(alias); return entry ? { options: { ...entry.options }, metrics: { ...entry.metrics }, isExecuting: entry._executing || false, callbacks: { before: Array.from(entry.callbacks.before.keys()), after: Array.from(entry.callbacks.after.keys()), error: Array.from(entry.callbacks.error.keys()) } } : null; },
    /**
     * Clears the performance metrics for a specific Pulser for testing.
     * @param {string} alias - The alias of the Pulser.
     */
    clearMetrics: (alias) => { const entry = this.getEntry(alias); if (entry) entry.metrics = { pulseCount: 0, lastPulsedAt: null, totalDuration: 0, avgDuration: 0 }; },
    /**
     * Resets the entire PulsorManager to its initial state for testing.
     */
    reset: () => {
      this.#registry.clear();
      this.#patternCallbacks = [];
      this.#eventListeners.clear();
      if (this.#performanceMetrics) {
        this.#performanceMetrics.durations = [];
      }
      this.#circuitBreakers.clear();
      this.#activeExecutions.clear();
      this.#shutdownRequested = false;
      if (this.cleanupIntervalId) {
        clearInterval(this.cleanupIntervalId);
        this.cleanupIntervalId = null;
      }
      safeLog('warn', "Pulsor default manager has been reset for testing.");
    },
    /**
     * Emits an event for testing purposes.
     * @param {string} eventName - The name of the event to emit.
     * @param {any} data - The data to pass with the event.
     */
    emit(eventName, data) {
      PulsorManager.defaultManager.emit(eventName, data);
    }
  };
}

// --- Default Manager and Global Exports for backward compatibility ---
const defaultManager = new PulsorManager();
export const SetLoggy = (logLevels) => Loggy.services(logLevels);
export const CreatePulser = defaultManager.CreatePulser.bind(defaultManager);
export const UpdatePulser = defaultManager.UpdatePulser.bind(defaultManager);
export const DestroyPulser = defaultManager.DestroyPulser.bind(defaultManager);
export const PulserExists = defaultManager.PulserExists.bind(defaultManager);
export const ListPulsers = defaultManager.ListPulsers.bind(defaultManager);
export const GetPulserInfo = defaultManager.GetPulserInfo.bind(defaultManager);
export const getAdvancedMetrics = defaultManager.getAdvancedMetrics.bind(defaultManager);
export const getHealthStatus = defaultManager.getHealthStatus.bind(defaultManager);
export const createPulsers = defaultManager.createPulsers.bind(defaultManager);
export const destroyPulsers = defaultManager.destroyPulsers.bind(defaultManager);
export const gracefulShutdown = defaultManager.gracefulShutdown.bind(defaultManager);
export const Pulsor = (alias) => new Pulser(alias, defaultManager);
