/**
 * Pulsor Framework - Main Entry Point
 * @fileoverview Advanced function execution framework with caching, metrics, and performance optimization
 * @version 6.0.0
 * @author Pulsor Team
 */

// ============================================================================
// CORE EXPORTS
// ============================================================================

export * from './core/index.js';
export * from './types/index.js';
export * from './interfaces/index.js';
export * from './services/index.js';

// ============================================================================
// MAIN PULSOR CLASS
// ============================================================================

import type {
  PulserFunction,
  CallbackFunction,
  PulserOptions,
  CallbackOptions,
  PatternCallbackOptions,
  CreatePulserOptions,
  GlobalMetrics
} from './types/index.js';

import type {
  ILogger,
  IServiceFactory
} from './interfaces/index.js';

import {
  EventEmitter,
  PulsorError,
  PulsorTimeoutError,
  PulsorNotFoundError,
  PulsorAlreadyExistsError,
  validateAlias,
  validatePulserOptions,
  validateCallbackOptions,
  nowMs,
  generateExecutionId,
  mergeOptions
} from './core/index.js';

import {
  MetricsService,
  MemoryService,
  SecurityService,
  globalServiceFactory
} from './services/index.js';

/**
 * Configuration for Pulsor instance
 */
export interface PulsorConfig {
  /** Logger instance or configuration */
  logger?: ILogger | any;
  /** Service factory instance or configuration */
  serviceFactory?: IServiceFactory | any;
  /** Enable metrics collection */
  enableMetrics?: boolean;
  /** Enable memory monitoring */
  enableMemoryMonitoring?: boolean;
  /** Enable security features */
  enableSecurity?: boolean;
  /** Global timeout for all operations */
  globalTimeout?: number;
  /** Maximum number of concurrent executions */
  maxConcurrentExecutions?: number;
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Main Pulsor class - Advanced function execution framework
 */
export class Pulsor {
  private readonly pulsers = new Map<string, PulserFunction<readonly unknown[], unknown>>();
  private readonly callbacks = new Map<string, CallbackFunction>();
  private readonly patternCallbacks = new Map<string, CallbackFunction>();
  private readonly executions = new Map<string, Promise<any>>();
  private readonly config: Required<PulsorConfig>;
  private readonly logger: ILogger;
  private readonly eventEmitter: EventEmitter;
  private readonly metricsService: MetricsService;
  private readonly memoryService: MemoryService;
  private readonly securityService: SecurityService;
  private destroyed = false;
  
  constructor(config: PulsorConfig = {}) {
    // Initialize service factory
    const serviceFactory = config.serviceFactory || globalServiceFactory;
    
    // Set default configuration
    this.config = {
      logger: config.logger,
      serviceFactory,
      enableMetrics: config.enableMetrics ?? true,
      enableMemoryMonitoring: config.enableMemoryMonitoring ?? true,
      enableSecurity: config.enableSecurity ?? true,
      globalTimeout: config.globalTimeout ?? 30000,
      maxConcurrentExecutions: config.maxConcurrentExecutions ?? 100,
      debug: config.debug ?? false
    };
    
    // Initialize core services
    this.logger = this.config.logger || serviceFactory.createLogger();
    this.eventEmitter = serviceFactory.createEventEmitter();
    
    // Initialize optional services
    this.metricsService = this.config.enableMetrics ? serviceFactory.createMetricsService() : null as any;
    this.memoryService = this.config.enableMemoryMonitoring ? serviceFactory.createMemoryService() : null as any;
    this.securityService = this.config.enableSecurity ? serviceFactory.createSecurityService() : null as any;
    
    this.logger.info('Pulsor instance initialized', {
      enableMetrics: this.config.enableMetrics,
      enableMemoryMonitoring: this.config.enableMemoryMonitoring,
      enableSecurity: this.config.enableSecurity,
      globalTimeout: this.config.globalTimeout,
      maxConcurrentExecutions: this.config.maxConcurrentExecutions
    });
  }
  
  /**
   * Create a new Pulser function
   * @param alias - Unique identifier for the Pulser
   * @param fn - Function to wrap
   * @param options - Pulser configuration options
   * @returns The created Pulser function
   */
  public createPulser<T extends any[], R>(
    alias: string,
    fn: (...args: T) => R | Promise<R>,
    options: CreatePulserOptions = {}
  ): PulserFunction<T, R> {
    this.ensureNotDestroyed();
    
    // Validate inputs
    validateAlias(alias);
    
    if (this.pulsers.has(alias)) {
      throw new PulsorAlreadyExistsError(`Pulser with alias '${alias}' already exists`);
    }
    
    // Security check
    if (this.securityService) {
      this.securityService.validateFunction(alias, fn);
    }
    
    // Create Pulser function
    const pulserOptions: PulserOptions = mergeOptions({
      timeout: this.config.globalTimeout,
      retries: 3,
      cache: true,
      circuitBreaker: true,
      metrics: this.config.enableMetrics
    }, options);
    
    validatePulserOptions(pulserOptions);
    
    const pulser: PulserFunction<T, R> = async (...args: T): Promise<R> => {
      return this.executePulser(alias, fn, args, pulserOptions);
    };
    
    // Add metadata
    Object.defineProperties(pulser, {
      alias: { value: alias, writable: false },
      originalFunction: { value: fn, writable: false },
      options: { value: pulserOptions, writable: false },
      createdAt: { value: nowMs(), writable: false }
    });
    
    this.pulsers.set(alias, pulser as PulserFunction<readonly unknown[], unknown>);
    
    this.logger.debug(`Pulser '${alias}' created`, { options: pulserOptions });
    this.eventEmitter.emit('pulserCreated', { 
      alias, 
      timestamp: nowMs(),
      isAsync: options.isAsync || false,
      version: 1,
      override: false
    });
    
    return pulser;
  }
  
  /**
   * Execute a Pulser function
   */
  private async executePulser<T extends any[], R>(
    alias: string,
    fn: (...args: T) => R | Promise<R>,
    args: T,
    options: PulserOptions
  ): Promise<R> {
    const executionId = generateExecutionId();
    const startTime = nowMs();
    
    this.logger.debug(`Executing Pulser '${alias}'`, { executionId, args });
    
    try {
      // Security validation
      if (this.securityService) {
        if (!this.securityService.checkRateLimit(alias)) {
          throw new PulsorError('Rate limit exceeded', { code: 'RATE_LIMIT_EXCEEDED' });
        }
      }
      
      // Check concurrent executions
      if (this.executions.size >= this.config.maxConcurrentExecutions) {
        throw new PulsorError('Maximum concurrent executions reached', { code: 'MAX_CONCURRENCY_REACHED' });
      }
      
      // Execute with timeout
      const result = await this.executeWithTimeout(fn, args, options.timeout || this.config.globalTimeout);
      
      const duration = nowMs() - startTime;
      
      // Record metrics
      if (this.metricsService) {
        this.metricsService.recordExecution(alias, executionId, startTime, nowMs(), true);
      }
      
      this.logger.debug(`Pulser '${alias}' executed successfully`, {
        executionId,
        duration
      });
      
      this.eventEmitter.emit('pulseCompleted', {
        timestamp: nowMs(),
        executionId,
        alias,
        status: 'success' as const,
        duration,
        attempt: 1
      });
      
      return result;
      
    } catch (error) {
      const duration = nowMs() - startTime;
      
      // Record error metrics
      if (this.metricsService) {
        this.metricsService.recordError(alias, executionId, error as Error);
      }
      
      this.logger.error(`Pulser '${alias}' execution failed`, {
        executionId,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.eventEmitter.emit('pulseError', {
        timestamp: nowMs(),
        alias,
        error: error as Error
      });
      
      throw error;
    } finally {
      this.executions.delete(executionId);
    }
  }
  
  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>,
    args: T,
    timeout: number
  ): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new PulsorTimeoutError(timeout));
      }, Number(timeout));
      
      Promise.resolve(fn(...args))
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
  
  /**
   * Get a Pulser by alias
   * @param alias - Pulser identifier
   * @returns The Pulser function
   */
  public getPulser<T extends any[], R>(alias: string): PulserFunction<T, R> {
    this.ensureNotDestroyed();
    validateAlias(alias);
    
    const pulser = this.pulsers.get(alias);
    if (!pulser) {
      throw new PulsorNotFoundError(`Pulser with alias '${alias}' not found`);
    }
    
    return pulser as PulserFunction<T, R>;
  }
  
  /**
   * Check if a Pulser exists
   * @param alias - Pulser identifier
   * @returns True if Pulser exists
   */
  public hasPulser(alias: string): boolean {
    this.ensureNotDestroyed();
    validateAlias(alias);
    return this.pulsers.has(alias);
  }
  
  /**
   * Remove a Pulser
   * @param alias - Pulser identifier
   * @returns True if Pulser was removed
   */
  public removePulser(alias: string): boolean {
    this.ensureNotDestroyed();
    validateAlias(alias);
    
    const removed = this.pulsers.delete(alias);
    if (removed) {
      this.logger.debug(`Pulser '${alias}' removed`);
      this.eventEmitter.emit('pulserDestroyed', { timestamp: nowMs(), alias });
    }
    
    return removed;
  }
  
  /**
   * Get all Pulser aliases
   * @returns Array of Pulser aliases
   */
  public getPulserAliases(): string[] {
    this.ensureNotDestroyed();
    return Array.from(this.pulsers.keys());
  }
  
  /**
   * Add a callback function
   * @param alias - Callback identifier
   * @param callback - Callback function
   * @param options - Callback options
   */
  public addCallback(
    alias: string,
    callback: CallbackFunction,
    options: CallbackOptions = {}
  ): void {
    this.ensureNotDestroyed();
    validateAlias(alias);
    validateCallbackOptions(options);
    
    if (this.callbacks.has(alias)) {
      throw new PulsorAlreadyExistsError(`Callback with alias '${alias}' already exists`);
    }
    
    this.callbacks.set(alias, callback);
    
    this.logger.debug(`Callback '${alias}' added`, { options });
    this.eventEmitter.emit('pulserUpdated', { timestamp: nowMs(), alias });
  }
  
  /**
   * Add a pattern-based callback
   * @param pattern - Pattern to match
   * @param callback - Callback function
   * @param options - Pattern callback options
   */
  public addPatternCallback(
    pattern: string,
    callback: CallbackFunction,
    options: PatternCallbackOptions = {}
  ): void {
    this.ensureNotDestroyed();
    // Pattern callback validation
    
    this.patternCallbacks.set(pattern, callback);
    
    this.logger.debug(`Pattern callback '${pattern}' added`, { options });
    this.eventEmitter.emit('pulserUpdated', { timestamp: nowMs(), alias: pattern });
  }
  
  /**
   * Get metrics for all Pulsers
   * @returns Global metrics
   */
  public getMetrics(): GlobalMetrics {
    this.ensureNotDestroyed();
    
    if (!this.metricsService) {
      throw new PulsorError('Metrics service is not enabled', { code: 'METRICS_DISABLED' });
    }
    
    return this.metricsService.getGlobalMetrics();
  }
  
  /**
   * Get memory usage information
   * @returns Memory snapshot
   */
  public getMemoryUsage() {
    this.ensureNotDestroyed();
    
    if (!this.memoryService) {
      throw new PulsorError('Memory service is not enabled', { code: 'MEMORY_SERVICE_DISABLED' });
    }
    
    return this.memoryService.getSnapshots();
  }
  
  /**
   * Get security metrics
   * @returns Security metrics
   */
  public getSecurityMetrics() {
    this.ensureNotDestroyed();
    
    if (!this.securityService) {
      throw new PulsorError('Security service is not enabled', { code: 'SECURITY_SERVICE_DISABLED' });
    }
    
    return this.securityService.getViolations();
  }
  
  /**
   * Clear all Pulsers and callbacks
   */
  public clear(): void {
    this.ensureNotDestroyed();
    
    const pulserCount = this.pulsers.size;
    const callbackCount = this.callbacks.size;
    const patternCallbackCount = this.patternCallbacks.size;
    
    this.pulsers.clear();
    this.callbacks.clear();
    this.patternCallbacks.clear();
    
    this.logger.info('Pulsor cleared', {
      removedPulsers: pulserCount,
      removedCallbacks: callbackCount,
      removedPatternCallbacks: patternCallbackCount
    });
    
    this.eventEmitter.emit('patternsCleaned', {
      timestamp: nowMs(),
      removed: pulserCount + callbackCount,
      removedPatterns: []
    });
  }
  
  /**
   * Destroy the Pulsor instance
   */
  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    
    this.clear();
    
    // Destroy services
    if (this.metricsService && typeof this.metricsService.destroy === 'function') {
      this.metricsService.destroy();
    }
    
    if (this.memoryService && typeof this.memoryService.destroy === 'function') {
      this.memoryService.destroy();
    }
    
    if (this.securityService && typeof this.securityService.destroy === 'function') {
      this.securityService.destroy();
    }
    
    this.destroyed = true;
    
    this.logger.info('Pulsor instance destroyed');
    this.eventEmitter.emit('pulserDestroyed', { timestamp: nowMs(), alias: 'main' });
  }
  
  /**
   * Check if instance is destroyed
   */
  private ensureNotDestroyed(): void {
    if (this.destroyed) {
      throw new PulsorError('Pulsor instance has been destroyed', { code: 'INSTANCE_DESTROYED' });
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new Pulsor instance with default configuration
 * @param config - Pulsor configuration
 * @returns New Pulsor instance
 */
export function createPulsor(config?: PulsorConfig): Pulsor {
  return new Pulsor(config);
}

/**
 * Create a high-performance Pulsor instance
 * @returns High-performance Pulsor instance
 */
export function createHighPerformancePulsor(): Pulsor {
  return new Pulsor({
    serviceFactory: globalServiceFactory,
    enableMetrics: true,
    enableMemoryMonitoring: false,
    enableSecurity: false,
    globalTimeout: 10000,
    maxConcurrentExecutions: 1000,
    debug: false
  });
}

/**
 * Create a development Pulsor instance with detailed logging and monitoring
 * @returns Development Pulsor instance
 */
export function createDevelopmentPulsor(): Pulsor {
  return new Pulsor({
    serviceFactory: globalServiceFactory,
    enableMetrics: true,
    enableMemoryMonitoring: true,
    enableSecurity: true,
    globalTimeout: 30000,
    maxConcurrentExecutions: 50,
    debug: true
  });
}

/**
 * Create a test Pulsor instance
 * @returns Test Pulsor instance
 */
export function createTestPulsor(): Pulsor {
  return new Pulsor({
    serviceFactory: globalServiceFactory,
    enableMetrics: false,
    enableMemoryMonitoring: false,
    enableSecurity: false,
    globalTimeout: 5000,
    maxConcurrentExecutions: 10,
    debug: false
  });
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

/**
 * Global Pulsor instance
 */
export const globalPulsor = createPulsor();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a Pulser function using the global instance
 * @param alias - Unique identifier for the Pulser
 * @param fn - Function to wrap
 * @param options - Pulser configuration options
 * @returns The created Pulser function
 */
export function pulser<T extends any[], R>(
  alias: string,
  fn: (...args: T) => R | Promise<R>,
  options?: CreatePulserOptions
): PulserFunction<T, R> {
  return globalPulsor.createPulser(alias, fn, options);
}

/**
 * Get a Pulser by alias using the global instance
 * @param alias - Pulser identifier
 * @returns The Pulser function
 */
export function getPulser<T extends any[], R>(alias: string): PulserFunction<T, R> {
  return globalPulsor.getPulser<T, R>(alias);
}

/**
 * Check if a Pulser exists using the global instance
 * @param alias - Pulser identifier
 * @returns True if Pulser exists
 */
export function hasPulser(alias: string): boolean {
  return globalPulsor.hasPulser(alias);
}

/**
 * Remove a Pulser using the global instance
 * @param alias - Pulser identifier
 * @returns True if Pulser was removed
 */
export function removePulser(alias: string): boolean {
  return globalPulsor.removePulser(alias);
}

/**
 * Add a callback using the global instance
 * @param alias - Callback identifier
 * @param callback - Callback function
 * @param options - Callback options
 */
export function addCallback(
  alias: string,
  callback: CallbackFunction,
  options?: CallbackOptions
): void {
  return globalPulsor.addCallback(alias, callback, options);
}

/**
 * Add a pattern callback using the global instance
 * @param pattern - Pattern to match
 * @param callback - Callback function
 * @param options - Pattern callback options
 */
export function addPatternCallback(
  pattern: string,
  callback: CallbackFunction,
  options?: PatternCallbackOptions
): void {
  return globalPulsor.addPatternCallback(pattern, callback, options);
}

/**
 * Get metrics using the global instance
 * @returns Global metrics
 */
export function getMetrics(): GlobalMetrics {
  return globalPulsor.getMetrics();
}

/**
 * Clear all Pulsers and callbacks using the global instance
 */
export function clear(): void {
  return globalPulsor.clear();
}

// ============================================================================
// VERSION AND METADATA
// ============================================================================

/**
 * Pulsor framework version
 */
export const VERSION = '6.0.0';

/**
 * Pulsor framework metadata
 */
export const METADATA = {
  name: 'Pulsor',
  version: VERSION,
  description: 'Advanced function execution framework with caching, metrics, and performance optimization',
  author: 'Pulsor Team',
  license: 'MIT',
  repository: 'https://github.com/pulsor/pulsor',
  documentation: 'https://pulsor.dev/docs'
} as const;



// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default Pulsor;