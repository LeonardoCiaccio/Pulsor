/**
 * Interfaces for Pulsor system services
 * @fileoverview Interface definitions for dependency injection and modularity
 * @version 6.0.0
 * @author Pulsor Team
 */

import type {
  PulserAlias,
  ExecutionId,
  PatternId,
  Timestamp,
  PulsePhase,
  LogLevel,
  PulserFunction,
  CallbackFunction,
  PulserOptions,
  CallbackOptions,
  PatternCallbackOptions,
  PulserMetrics,
  GlobalMetrics,
  AdvancedMetrics,
  CircuitBreakerStatus,
  EventDataMap,
  EventListener
} from '../types/index.js';
import type { MemorySnapshot } from '../services/memory.js';

// ============================================================================
// CORE SERVICE INTERFACES
// ============================================================================

/**
 * Interface for logging service
 */
export interface ILogger {
  /** Configure enabled logging services */
  services(config: Partial<Record<LogLevel, boolean>>): void;
  
  /** Format a message with logger prefix */
  format(message: string): string;
  
  /** Logging methods */
  log(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Interface for async lock service
 */
export interface IAsyncLock {
  /** Acquire a lock with optional timeout */
  acquire(timeoutMs?: number): Promise<void>;
  
  /** Release the lock */
  release(): void;
  
  /** Check if lock is currently acquired */
  readonly isLocked: boolean;
  
  /** Number of queued operations */
  readonly queueLength: number;
}

/**
 * Service factory interface for creating and managing services
 */
export interface IServiceFactory {
  /**
   * Create metrics service
   * @returns Metrics service instance
   */
  createMetricsService(): any;
  
  /**
   * Create memory service
   * @returns Memory service instance
   */
  createMemoryService(): any;
  
  /**
   * Create security service
   * @returns Security service instance
   */
  createSecurityService(): any;
  
  /**
   * Create logger
   * @returns Logger instance
   */
  createLogger(): any;
  
  /**
   * Create async lock
   * @returns Async lock instance
   */
  createAsyncLock(): any;
  
  /**
   * Create circuit breaker
   * @returns Circuit breaker instance
   */
  createCircuitBreaker(): any;
  
  /**
   * Create event emitter
   * @returns Event emitter instance
   */
  createEventEmitter(): any;
  
  /**
   * Create validator
   * @returns Validator instance
   */
  createValidator(): any;
  
  /**
   * Get all created services
   * @returns Map of service names to instances
   */
  getServices(): ReadonlyMap<string, any>;
  
  /**
   * Check if a service exists
   * @param name - Service name
   * @returns True if service exists
   */
  hasService(name: string): boolean;
  
  /**
   * Destroy all services
   */
  destroy(): void;
}

/**
 * Circuit breaker interface
 */
export interface ICircuitBreaker {
  /** Check if the operation can be executed */
  canExecute(): boolean;
  
  /** Record a success */
  onSuccess(): void;
  
  /** Record a failure */
  onFailure(): void;
  
  /** Get the current status */
  getStatus(): CircuitBreakerStatus;
  
  /** Reset the circuit breaker */
  reset(): void;
}

/**
 * Interfaccia per il gestore degli eventi
 */
export interface IEventEmitter {
  /** Registra un listener per un evento */
  on<T extends keyof EventDataMap>(event: T, listener: EventListener<T>): void;
  
  /** Rimuove un listener per un evento */
  off<T extends keyof EventDataMap>(event: T, listener: EventListener<T>): void;
  
  /** Emette un evento */
  emit<T extends keyof EventDataMap>(event: T, data: EventDataMap[T]): void;
  
  /** Rimuove tutti i listener */
  removeAllListeners(): void;
  
  /** Ottiene il numero di listener per un evento */
  listenerCount<T extends keyof EventDataMap>(event: T): number;
}

/**
 * Interfaccia per il servizio di validazione
 */
export interface IValidator {
  /** Valida un alias */
  validateAlias(alias: unknown): asserts alias is PulserAlias;
  
  /** Valida una funzione */
  validateFunction(fn: unknown): asserts fn is PulserFunction;
  
  /** Valida le opzioni */
  validateOptions(options: unknown): asserts options is PulserOptions;
  
  /** Valida le opzioni delle callback */
  validateCallbackOptions(options: unknown): asserts options is CallbackOptions;
  
  /** Valida una callback function */
  validateCallback(callback: unknown): asserts callback is CallbackFunction;
  
  /** Valida un pattern */
  validatePattern(pattern: unknown): asserts pattern is string;
  
  /** Sanitizza gli argomenti per prevenire prototype pollution */
  sanitizeArgs<T extends readonly unknown[]>(args: T): T;
}

/**
 * Interfaccia per il servizio di metriche
 */
export interface IMetricsService {
  /** Registra una metrica di performance */
  recordPerformance(alias: PulserAlias, duration: number): void;
  
  /** Ottiene le metriche per un Pulser specifico */
  getPulserMetrics(alias: PulserAlias): PulserMetrics | null;
  
  /** Ottiene le metriche globali */
  getGlobalMetrics(): GlobalMetrics;
  
  /** Ottiene le metriche avanzate */
  getAdvancedMetrics(): AdvancedMetrics;
  
  /** Configura le metriche */
  configure(options: { windowSize?: number }): void;
  
  /** Pulisce le metriche per un Pulser */
  clearPulserMetrics(alias: PulserAlias): void;
  
  /** Pulisce tutte le metriche */
  clearAllMetrics(): void;
}

/**
 * Interfaccia per il servizio di gestione della memoria
 */
export interface IMemoryService {
  /** Ottiene l'utilizzo della memoria */
  getMemoryUsage(): {
    pulsers: number;
    callbacks: number;
    patterns: number;
    total: number;
  };
  
  /** Pulisce le risorse scadute */
  cleanup(): {
    pulsersRemoved: number;
    callbacksRemoved: number;
    patternsRemoved: number;
  };
  
  /** Forza la garbage collection se disponibile */
  forceGC(): boolean;
  
  /** Ottiene statistiche della memoria */
  getMemoryStats(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } | null;
  
  /** Ottiene la cronologia degli snapshot della memoria */
  getSnapshots(limit?: number): ReadonlyArray<MemorySnapshot>;
}

/**
 * Interfaccia per il servizio di sicurezza
 */
export interface ISecurityService {
  /** Verifica se una chiave è pericolosa */
  isDangerousKey(key: string): boolean;
  
  /** Sanitizza un oggetto rimuovendo chiavi pericolose */
  sanitizeObject<T extends Record<string, unknown>>(obj: T): T;
  
  /** Congela un oggetto ricorsivamente */
  deepFreeze<T>(obj: T): T;
  
  /** Verifica se un valore è sicuro per la serializzazione */
  isSafeForSerialization(value: unknown): boolean;
  
  /** Crea una copia sicura di un oggetto */
  createSafeCopy<T>(obj: T): T;
}

// ============================================================================
// INTERFACCE REPOSITORY
// ============================================================================

/**
 * Interfaccia per il repository dei Pulser
 */
export interface IPulserRepository {
  /** Registra un nuovo Pulser */
  register(alias: PulserAlias, pulser: IPulserEntry): void;
  
  /** Ottiene un Pulser */
  get(alias: PulserAlias): IPulserEntry | null;
  
  /** Verifica se un Pulser esiste */
  has(alias: PulserAlias): boolean;
  
  /** Rimuove un Pulser */
  remove(alias: PulserAlias): boolean;
  
  /** Lista tutti gli alias */
  listAliases(pattern?: string): readonly PulserAlias[];
  
  /** Ottiene tutti i Pulser */
  getAll(): ReadonlyMap<PulserAlias, IPulserEntry>;
  
  /** Pulisce tutti i Pulser */
  clear(): void;
  
  /** Ottiene il numero di Pulser registrati */
  size(): number;
}

/**
 * Interfaccia per il repository delle callback pattern
 */
export interface IPatternRepository {
  /** Registra una callback per un pattern */
  register(patternId: PatternId, pattern: string, callback: IPatternCallback): void;
  
  /** Ottiene le callback per un pattern */
  getByPattern(pattern: string): readonly IPatternCallback[];
  
  /** Ottiene una callback per ID */
  getById(patternId: PatternId): IPatternCallback | null;
  
  /** Rimuove una callback per ID */
  removeById(patternId: PatternId): boolean;
  
  /** Rimuove callback scadute */
  removeExpired(): {
    removed: number;
    removedPatterns: readonly PatternId[];
  };
  
  /** Lista tutti i pattern */
  listPatterns(): readonly string[];
  
  /** Pulisce tutti i pattern */
  clear(): void;
  
  /** Ottiene il numero di pattern registrati */
  size(): number;
}

/**
 * Interfaccia per il repository dei Circuit Breaker
 */
export interface ICircuitBreakerRepository {
  /** Ottiene o crea un Circuit Breaker */
  getOrCreate(alias: PulserAlias, threshold: number): ICircuitBreaker;
  
  /** Ottiene un Circuit Breaker esistente */
  get(alias: PulserAlias): ICircuitBreaker | null;
  
  /** Rimuove un Circuit Breaker */
  remove(alias: PulserAlias): boolean;
  
  /** Resetta un Circuit Breaker */
  reset(alias: PulserAlias): boolean;
  
  /** Pulisce tutti i Circuit Breaker */
  clear(): void;
  
  /** Ottiene il numero di Circuit Breaker */
  size(): number;
}

// ============================================================================
// INTERFACCE ENTRY
// ============================================================================

/**
 * Interfaccia per un'entry del Pulser nel repository
 */
export interface IPulserEntry {
  /** Alias del Pulser */
  readonly alias: PulserAlias;
  
  /** Funzione del Pulser */
  readonly pulseFn: PulserFunction;
  
  /** Se la funzione è asincrona */
  readonly isAsync: boolean;
  
  /** Opzioni di configurazione */
  readonly options: PulserOptions;
  
  /** Callback per fase */
  readonly callbacks: ReadonlyMap<PulsePhase, readonly ICallbackEntry[]>;
  
  /** Versione del Pulser */
  readonly version: number;
  
  /** Timestamp di creazione */
  readonly createdAt: Timestamp;
  
  /** Timestamp dell'ultimo aggiornamento */
  readonly updatedAt: Timestamp;
  
  /** Aggiunge una callback */
  addCallback(callback: CallbackFunction, options?: CallbackOptions): () => void;
  
  /** Rimuove una callback */
  removeCallback(callback: CallbackFunction, options?: { phase?: PulsePhase }): boolean;
  
  /** Rimuove tutte le callback */
  removeAllCallbacks(options?: { phase?: PulsePhase }): number;
  
  /** Ottiene le callback per una fase */
  getCallbacks(phase: PulsePhase): readonly ICallbackEntry[];
  
  /** Aggiorna la funzione e le opzioni */
  update(pulseFn: PulserFunction, options?: PulserOptions): void;
}

/**
 * Interfaccia per un'entry di callback
 */
export interface ICallbackEntry {
  /** Funzione callback */
  readonly callback: CallbackFunction;
  
  /** Opzioni della callback */
  readonly options: CallbackOptions;
  
  /** Timestamp di aggiunta */
  readonly addedAt: Timestamp;
  
  /** Se è stata eseguita (per callback once) */
  readonly executed: boolean;
  
  /** Verifica se la callback è scaduta */
  isExpired(): boolean;
  
  /** Marca la callback come eseguita */
  markExecuted(): void;
}

/**
 * Interfaccia per una callback pattern
 */
export interface IPatternCallback {
  /** ID del pattern */
  readonly patternId: PatternId;
  
  /** Pattern regex */
  readonly pattern: string;
  
  /** Funzione callback */
  readonly callback: CallbackFunction;
  
  /** Opzioni della callback */
  readonly options: PatternCallbackOptions;
  
  /** Timestamp di aggiunta */
  readonly addedAt: Timestamp;
  
  /** Verifica se la callback è scaduta */
  isExpired(): boolean;
  
  /** Verifica se il pattern corrisponde all'alias */
  matches(alias: PulserAlias): boolean;
}

// ============================================================================
// INTERFACCE FACTORY
// ============================================================================

/**
 * Interfaccia per la factory dei servizi
 */
export interface IServiceFactory {
  /** Crea un logger */
  createLogger(prefix: string): ILogger;
  
  /** Crea un async lock */
  createAsyncLock(): IAsyncLock;
  
  /** Crea un circuit breaker */
  createCircuitBreaker(threshold: number, timeoutMs: number): ICircuitBreaker;
  
  /** Crea un event emitter */
  createEventEmitter(): IEventEmitter;
  
  /** Crea un validator */
  createValidator(): IValidator;
  
  /** Crea un servizio metriche */
  createMetricsService(): IMetricsService;
  
  /** Crea un servizio memoria */
  createMemoryService(): IMemoryService;
  
  /** Crea un servizio sicurezza */
  createSecurityService(): ISecurityService;
}

/**
 * Interfaccia per la factory dei repository
 */
export interface IRepositoryFactory {
  /** Crea un repository Pulser */
  createPulserRepository(): IPulserRepository;
  
  /** Crea un repository pattern */
  createPatternRepository(): IPatternRepository;
  
  /** Crea un repository circuit breaker */
  createCircuitBreakerRepository(): ICircuitBreakerRepository;
}

// ============================================================================
// INTERFACCE STRATEGY
// ============================================================================

/**
 * Interfaccia per la strategia di esecuzione delle callback
 */
export interface ICallbackExecutionStrategy {
  /** Esegue le callback secondo la strategia */
  execute<TArgs extends readonly unknown[]>(
    callbacks: readonly ICallbackEntry[],
    args: TArgs,
    context?: {
      alias: PulserAlias;
      executionId: ExecutionId;
      phase: PulsePhase;
    }
  ): Promise<void>;
}

/**
 * Interfaccia per la strategia di retry
 */
export interface IRetryStrategy {
  /** Calcola il delay per il prossimo tentativo */
  calculateDelay(attempt: number, baseDelay?: number): number;
  
  /** Verifica se dovrebbe essere fatto un altro tentativo */
  shouldRetry(attempt: number, maxRetries: number, error: Error): boolean;
}

/**
 * Interfaccia per la strategia di scheduling
 */
export interface ISchedulingStrategy {
  /** Schedula l'esecuzione di una funzione */
  schedule<T>(fn: () => T | Promise<T>): Promise<T>;
}

// ============================================================================
// INTERFACCE CONTEXT
// ============================================================================

/**
 * Interfaccia per il contesto di esecuzione
 */
export interface IExecutionContext {
  /** ID dell'esecuzione */
  readonly executionId: ExecutionId;
  
  /** Alias del Pulser */
  readonly alias: PulserAlias;
  
  /** Timestamp di inizio */
  readonly startTime: Timestamp;
  
  /** Numero del tentativo */
  readonly attempt: number;
  
  /** Controller per l'abort */
  readonly abortController: AbortController;
  
  /** Se l'esecuzione è stata abortita */
  readonly isAborted: boolean;
  
  /** Aborta l'esecuzione */
  abort(reason?: string): void;
  
  /** Ottiene il tempo trascorso */
  getElapsedTime(): number;
}

/**
 * Interfaccia per il contesto delle callback
 */
export interface ICallbackContext extends IExecutionContext {
  /** Fase corrente */
  readonly phase: PulsePhase;
  
  /** Argomenti originali */
  readonly originalArgs: readonly unknown[];
  
  /** Risultato dell'esecuzione (se disponibile) */
  readonly result?: unknown;
  
  /** Errore dell'esecuzione (se disponibile) */
  readonly error?: Error;
}

// ============================================================================
// INTERFACCE CONFIGURATION
// ============================================================================

/**
 * Interfaccia per la configurazione del sistema
 */
export interface IPulsorConfiguration {
  /** Opzioni di default per i Pulser */
  readonly defaultPulserOptions: PulserOptions;
  
  /** Opzioni di default per le callback */
  readonly defaultCallbackOptions: CallbackOptions;
  
  /** Configurazione delle metriche */
  readonly metricsConfig: {
    readonly windowSize: number;
    readonly enableAdvanced: boolean;
  };
  
  /** Configurazione della sicurezza */
  readonly securityConfig: {
    readonly enableSanitization: boolean;
    readonly enableFreezing: boolean;
    readonly dangerousKeys: readonly string[];
  };
  
  /** Configurazione del logging */
  readonly loggingConfig: {
    readonly enabled: boolean;
    readonly levels: Partial<Record<LogLevel, boolean>>;
  };
  
  /** Configurazione della memoria */
  readonly memoryConfig: {
    readonly enableCleanup: boolean;
    readonly cleanupInterval: number;
    readonly maxPatternAge: number;
  };
}

// ============================================================================
// RE-EXPORT DELLE INTERFACCE PRINCIPALI
// ============================================================================

// Re-export delle interfacce principali dai types
export type {
  IPulser,
  IPulsorManager
} from '../types/index.js';