/**
 * Core types and interfaces for the Pulsor system
 * @fileoverview TypeScript definitions for type safety and automatic documentation
 * @version 6.0.0
 * @author Pulsor Team
 */

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * Unique identifier for a Pulser
 */
export type PulserAlias = string;

/**
 * Unique identifier for an execution
 */
export type ExecutionId = string;

/**
 * Unique identifier for a callback pattern
 */
export type PatternId = string;

/**
 * Timestamp in milliseconds
 */
export type Timestamp = number;

/**
 * Pulser lifecycle phases
 */
export type PulsePhase = 'before' | 'after' | 'error';

/**
 * Circuit Breaker states
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Callback execution strategies
 */
export type CallbackStrategy = 'parallel' | 'sequential';

/**
 * Scheduling strategies
 */
export type ScheduleStrategy = 'immediate' | 'microtask';

/**
 * Context provision modes for callbacks
 */
export type ContextProvisionMode = 'none' | 'prepend' | 'append';

/**
 * Supported log levels
 */
export type LogLevel = 'log' | 'debug' | 'info' | 'warn' | 'error';

/**
 * System health status
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical';

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main function of a Pulser
 */
export interface PulserFunction<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> {
  (...args: TArgs): TReturn | Promise<TReturn>;
}

/**
 * Callback function for lifecycle phases
 */
export interface CallbackFunction<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> {
  (...args: TArgs): TReturn | Promise<TReturn> | typeof PULSOR_STOP;
}

/**
 * Symbol to stop Pulser execution
 */
export declare const PULSOR_STOP: unique symbol;
export type PulsorStopSymbol = typeof PULSOR_STOP;

// ============================================================================
// OPTIONS AND CONFIGURATIONS
// ============================================================================

/**
 * Options for creating a Pulser
 */
export interface PulserOptions {
  /** Callback execution strategy */
  readonly callbackStrategy?: CallbackStrategy;
  /** Whether to stop callback execution on first error */
  readonly failFastCallbacks?: boolean;
  /** Execution scheduling strategy */
  readonly schedule?: ScheduleStrategy;
  /** Context provision mode */
  readonly provideContext?: ContextProvisionMode;
  /** Whether to execute error callbacks before throwing exception */
  readonly errorCallbacksBeforeThrow?: boolean;
  /** Whether to propagate the main error */
  readonly propagateMainError?: boolean;
  /** Whether to prevent concurrent execution */
  readonly preventConcurrentExecution?: boolean;
  /** Whether to freeze arguments */
  readonly freezeArgs?: boolean;
  /** Timeout in milliseconds */
  readonly timeout?: number;
  /** Maximum number of retries */
  readonly maxRetries?: number;
  /** Circuit breaker threshold */
  readonly circuitBreakerThreshold?: number;
}

/**
 * Options for creation with override
 */
export interface CreatePulserOptions extends PulserOptions {
  /** Whether to override an existing Pulser */
  readonly override?: boolean;
  /** Explicit hint for async functions */
  readonly isAsync?: boolean;
  /** Whether to reset existing callbacks */
  readonly resetCallbacks?: boolean;
  /** Whether to reset metrics */
  readonly resetMetrics?: boolean;
}

/**
 * Options for callbacks
 */
export interface CallbackOptions {
  /** Lifecycle phase */
  readonly phase?: PulsePhase;
  /** Execution priority */
  readonly priority?: number;
  /** Whether to execute only once */
  readonly once?: boolean;
  /** Time-to-live in milliseconds */
  readonly ttl?: number;
}

/**
 * Options for pattern callbacks
 */
export interface PatternCallbackOptions extends CallbackOptions {
  // Inherits all options from normal callbacks
}

// ============================================================================
// METRICS AND MONITORING
// ============================================================================

/**
 * Performance metrics for a single Pulser
 */
export interface PulserMetrics {
  /** Total number of executions */
  readonly pulseCount: number;
  /** Timestamp of last execution */
  readonly lastPulsedAt: Timestamp | null;
  /** Total duration of all executions */
  readonly totalDuration: number;
  /** Average duration of executions */
  readonly avgDuration: number;
}

/**
 * Metriche globali del sistema
 */
export interface GlobalMetrics {
  /** Numero totale di Pulser registrati */
  readonly totalPulsers: number;
  /** Numero totale di esecuzioni */
  readonly totalPulses: number;
  /** Durata media globale */
  readonly averageDuration: number;
  /** 95° percentile della durata */
  readonly p95Duration: number;
  /** 99° percentile della durata */
  readonly p99Duration: number;
  /** Numero di pattern callback attivi */
  readonly patternCallbackCount: number;
  /** Numero di esecuzioni attive */
  readonly activeExecutions: number;
  /** Statistiche della cache */
  readonly cacheStats: CacheStats;
  /** Utilizzo della memoria */
  readonly memoryUsage: MemoryUsage;
}

/**
 * Metriche avanzate con percentili e trend
 */
export interface AdvancedMetrics extends GlobalMetrics {
  /** Percentili delle durate */
  readonly percentiles: {
    readonly p50: number;
    readonly p90: number;
    readonly p99: number;
  } | null;
  /** Trend delle performance recenti */
  readonly trend: number | null;
}

/**
 * Statistiche della cache
 */
export interface CacheStats {
  /** Dimensione attuale della cache */
  readonly size: number;
  /** Numero di hit */
  readonly hits: number;
  /** Numero di miss */
  readonly misses: number;
  /** Ratio di hit */
  readonly hitRatio: number;
}

/**
 * Utilizzo della memoria
 */
export interface MemoryUsage {
  /** Memoria utilizzata dai Pulser */
  readonly pulsers: number;
  /** Memoria utilizzata dalle callback */
  readonly callbacks: number;
  /** Memoria utilizzata dai pattern */
  readonly patterns: number;
  /** Memoria totale utilizzata */
  readonly total: number;
}

// ============================================================================
// STATO E INFORMAZIONI
// ============================================================================

/**
 * Informazioni dettagliate su un Pulser
 */
export interface PulserInfo {
  /** Alias del Pulser */
  readonly alias: PulserAlias;
  /** Se la funzione è asincrona */
  readonly isAsync: boolean;
  /** Numero totale di callback */
  readonly callbackCount: number;
  /** Conteggio delle callback per fase */
  readonly callbackCounts: Record<PulsePhase, number>;
  /** Dettagli delle callback */
  readonly callbackDetails: Record<PulsePhase, readonly CallbackDetail[]>;
  /** Nome della funzione */
  readonly functionName: string;
  /** Versione del Pulser */
  readonly version: number;
  /** Metriche di performance */
  readonly metrics: PulserMetrics;
  /** Opzioni di configurazione */
  readonly options: PulserOptions;
}

/**
 * Dettagli di una callback
 */
export interface CallbackDetail {
  /** Nome della funzione */
  readonly functionName: string;
  /** Priorità */
  readonly priority: number;
  /** Se esegue solo una volta */
  readonly once: boolean;
  /** Timestamp di aggiunta */
  readonly addedAt: Timestamp;
}

/**
 * Stato del Circuit Breaker
 */
export interface CircuitBreakerStatus {
  /** Stato attuale */
  readonly state: CircuitBreakerState;
  /** Conteggio dei fallimenti */
  readonly failureCount: number;
  /** Soglia di fallimenti */
  readonly threshold: number;
  /** Timestamp del prossimo tentativo */
  readonly nextAttempt: Timestamp;
}

/**
 * Rapporto di salute del sistema
 */
export interface HealthReport {
  /** Stato generale */
  readonly status: HealthStatus;
  /** Timestamp del rapporto */
  readonly timestamp: number;
  /** Metriche avanzate */
  readonly metrics: AdvancedMetrics;
  /** Pressione sulla memoria */
  readonly memoryPressure: MemoryPressure;
  /** Pulser obsoleti */
  readonly stalePulsers: {
    readonly count: number;
    readonly aliases: readonly PulserAlias[];
  };
  /** Raccomandazioni */
  readonly recommendations: readonly string[];
}

/**
 * Pressione sulla memoria
 */
export interface MemoryPressure {
  /** Numero di pattern callback */
  readonly patternCallbacks: number;
  /** Numero di event listener */
  readonly eventListeners: number;
}

// ============================================================================
// EVENTI
// ============================================================================

/**
 * Dati base per gli eventi
 */
export interface BaseEventData {
  /** Timestamp dell'evento */
  readonly timestamp: number;
  /** Alias del Pulser (se applicabile) */
  readonly pulserAlias?: PulserAlias;
}

/**
 * Dati per l'evento di creazione Pulser
 */
export interface PulserCreatedEventData extends BaseEventData {
  readonly alias: PulserAlias;
  readonly isAsync: boolean;
  readonly version: number;
  readonly override: boolean;
}

/**
 * Dati per l'evento di inizio esecuzione
 */
export interface PulseStartedEventData extends BaseEventData {
  readonly executionId: ExecutionId;
  readonly alias: PulserAlias;
  readonly attempt: number;
}

/**
 * Dati per l'evento di completamento esecuzione
 */
export interface PulseCompletedEventData extends BaseEventData {
  readonly executionId: ExecutionId;
  readonly alias: PulserAlias;
  readonly status: 'success' | 'error' | 'stopped';
  readonly duration: number;
  readonly attempt: number;
  readonly error?: Error;
}

/**
 * Mappa dei tipi di evento
 */
export interface EventDataMap {
  pulserCreated: PulserCreatedEventData;
  pulserUpdated: BaseEventData & { alias: PulserAlias };
  pulserDestroyed: BaseEventData & { alias: PulserAlias };
  pulseStarted: PulseStartedEventData;
  pulseCompleted: PulseCompletedEventData;
  pulseError: BaseEventData & { alias: PulserAlias; error: Error };
  circuitBreakerReset: BaseEventData & { alias: PulserAlias };
  patternsCleaned: BaseEventData & { removed: number; removedPatterns: readonly PatternId[] };
  bindsCompleted: BaseEventData & {
    total: number;
    successful: number;
    failed: number;
    errors: readonly { index: number; error: string }[];
  };
  alias_blocked: BaseEventData & { alias: PulserAlias; reason: string };
  alias_unblocked: BaseEventData & { alias: PulserAlias };
  security_violation: BaseEventData & { violation: unknown };
  memory_pressure: BaseEventData & { pressure: any };
  memory_leak_detected: BaseEventData & { leak: any };
  monitoring_stopped: BaseEventData;
  monitoring_started: BaseEventData;
  gc_completed: BaseEventData & { duration: number; freedMemory: number; };
  'pulser:executed': BaseEventData & { alias: PulserAlias; duration: number; result?: any };
  'pulser:error': BaseEventData & { alias: PulserAlias; error: Error };
  'pulser:removed': BaseEventData & { alias: PulserAlias };
  'pulser:callback-added': BaseEventData & { alias: string; options?: any };
  'pulser:pattern-callback-added': BaseEventData & { pattern: string; options?: any };
  'pulser:cleared': BaseEventData & { removedPulsers: number; removedCallbacks: number; removedPatternCallbacks: number };
  'pulser:destroyed': BaseEventData;
}

/**
 * Listener per eventi
 */
export interface EventListener<T extends keyof EventDataMap> {
  (data: EventDataMap[T]): void | Promise<void>;
}

// ============================================================================
// RISULTATI OPERAZIONI
// ============================================================================

/**
 * Risultato di operazioni batch
 */
export interface BatchResult<TSuccess, TFailure> {
  /** Operazioni riuscite */
  readonly created: readonly TSuccess[];
  /** Operazioni fallite */
  readonly failed: readonly TFailure[];
}

/**
 * Risultato della creazione batch di Pulser
 */
export interface BatchCreateResult extends BatchResult<
  { alias: PulserAlias; pulser: IPulser },
  { index: number; alias: PulserAlias; error: Error }
> {}

/**
 * Risultato della distruzione batch di Pulser
 */
export interface BatchDestroyResult extends BatchResult<
  PulserAlias,
  { pattern: string; error: Error }
> {
  readonly destroyed: readonly PulserAlias[];
}

/**
 * Risultato del binding multiplo di callback
 */
export interface BindsResult {
  /** Funzioni per rimuovere i binding */
  readonly unbinders: readonly (() => void)[];
  /** Errori durante il binding */
  readonly errors: readonly {
    readonly index: number;
    readonly item: unknown;
    readonly error: Error;
  }[];
}

/**
 * Risultato dello shutdown graceful
 */
export interface GracefulShutdownResult {
  /** Se lo shutdown è completato con successo */
  readonly success: boolean;
  /** Esecuzioni ancora attive */
  readonly activeExecutions: readonly PulserAlias[];
}

// ============================================================================
// INTERFACCE PRINCIPALI
// ============================================================================

/**
 * Interfaccia per un singolo Pulser
 */
export interface IPulser {
  /** Alias del Pulser */
  readonly alias: PulserAlias;
  
  /** Esegue la funzione del Pulser */
  pulse<TArgs extends readonly unknown[], TReturn>(
    ...args: TArgs
  ): Promise<TReturn>;
  
  /** Associa una callback */
  bind<TArgs extends readonly unknown[]>(
    callback: CallbackFunction<TArgs>,
    options?: CallbackOptions
  ): () => void;
  
  /** Rimuove una callback */
  unbind<TArgs extends readonly unknown[]>(
    callback: CallbackFunction<TArgs>,
    options?: { phase?: PulsePhase }
  ): boolean;
  
  /** Rimuove tutte le callback */
  unbindAll(options?: { phase?: PulsePhase }): number;
  
  /** Associa multiple callback */
  binds<TArgs extends readonly unknown[]>(
    callbacks: readonly (CallbackFunction<TArgs> | {
      fn: CallbackFunction<TArgs>;
      options?: CallbackOptions;
    })[],
    globalOptions?: CallbackOptions
  ): BindsResult;
  
  /** Aggiorna il Pulser */
  update<TArgs extends readonly unknown[], TReturn>(
    pulseFn: PulserFunction<TArgs, TReturn>,
    options?: PulserOptions
  ): IPulser;
  
  /** Restituisce una versione bound della funzione pulse */
  bound<TArgs extends readonly unknown[], TReturn>(): (
    ...args: TArgs
  ) => Promise<TReturn>;
  
  /** Distrugge il Pulser */
  destroy(): boolean;
}

/**
 * Interfaccia per il manager dei Pulser
 */
export interface IPulsorManager {
  /** Crea un nuovo Pulser */
  CreatePulser<TArgs extends readonly unknown[], TReturn>(
    alias: PulserAlias,
    pulseFn: PulserFunction<TArgs, TReturn>,
    options?: CreatePulserOptions
  ): IPulser;
  
  /** Esegue un Pulser */
  pulse<TReturn>(
    alias: PulserAlias,
    args: readonly unknown[]
  ): Promise<TReturn>;
  
  /** Aggiorna un Pulser esistente */
  UpdatePulser<TArgs extends readonly unknown[], TReturn>(
    alias: PulserAlias,
    pulseFn: PulserFunction<TArgs, TReturn>,
    options?: PulserOptions
  ): IPulser;
  
  /** Distrugge un Pulser */
  DestroyPulser(alias: PulserAlias): boolean;
  
  /** Lista i Pulser registrati */
  ListPulsers(pattern?: string): readonly PulserAlias[];
  
  /** Ottiene informazioni su un Pulser */
  GetPulserInfo(alias: PulserAlias): PulserInfo | null;
  
  /** Associa una callback a un pattern */
  bindToPattern<TArgs extends readonly unknown[]>(
    pattern: string,
    callback: CallbackFunction<TArgs>,
    options?: PatternCallbackOptions
  ): PatternId;
  
  /** Rimuove callback per pattern */
  unbindByPatternId(patternId: PatternId): boolean;
  
  /** Operazioni batch */
  createPulsers(definitions: readonly {
    alias: PulserAlias;
    pulseFn: PulserFunction;
    options?: CreatePulserOptions;
  }[]): BatchCreateResult;
  
  destroyPulsers(patterns: readonly string[]): BatchDestroyResult;
  
  /** Shutdown graceful */
  gracefulShutdown(timeoutMs?: number): Promise<GracefulShutdownResult>;
  
  /** Metriche e monitoraggio */
  getGlobalMetrics(): GlobalMetrics;
  getAdvancedMetrics(): AdvancedMetrics;
  getHealthStatus(): HealthReport;
  configureMetrics(options: { windowSize?: number }): void;
  
  /** Circuit breaker */
  getCircuitBreakerStatus(alias: PulserAlias): CircuitBreakerStatus | null;
  resetCircuitBreaker(alias: PulserAlias): boolean;
  
  /** Eventi */
  on<T extends keyof EventDataMap>(event: T, listener: EventListener<T>): void;
  off<T extends keyof EventDataMap>(event: T, listener: EventListener<T>): void;
  emitEvent<T extends keyof EventDataMap>(event: T, data: EventDataMap[T]): void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Rende tutte le proprietà di un tipo readonly ricorsivamente
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Estrae i tipi degli argomenti da una funzione
 */
export type ExtractArgs<T> = T extends (...args: infer A) => unknown ? A : never;

/**
 * Estrae il tipo di ritorno da una funzione
 */
export type ExtractReturn<T> = T extends (...args: unknown[]) => infer R ? R : never;

/**
 * Tipo condizionale per Promise
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Tipo per funzioni che possono essere sync o async
 */
export type SyncOrAsync<T> = T | Promise<T>;

/**
 * Chiavi opzionali di un tipo
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Chiavi obbligatorie di un tipo
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Rende opzionali solo le chiavi specificate
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Rende obbligatorie solo le chiavi specificate
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;