/**
 * Core module exports for the Pulsor framework
 * @fileoverview Central export point for all core components
 * @version 6.0.0
 * @author Pulsor Team
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

export {
  PulsorError,
  PulsorStoppedError,
  PulsorValidationError,
  PulsorTimeoutError,
  PulsorNotFoundError,
  PulsorAlreadyExistsError,
  PulsorCircuitBreakerError,
  PulsorConcurrencyError,
  PulsorMaxRetriesError,
  isPulsorError,
  extractErrorInfo,
  normalizeError,
  wrapWithErrorNormalization,
  wrapAsyncWithErrorNormalization
} from './errors.js';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  SECURITY_CONSTANTS,
  DEFAULT_PULSER_OPTIONS,
  DEFAULT_CALLBACK_OPTIONS,
  validateAlias,
  validateFunction,
  validatePulserOptions,
  validateCallbackOptions,
  validatePattern,
  isDangerousKey,
  sanitizeArgs,
  deepFreeze,
  nowMs,
  generateExecutionId,
  generatePatternId,
  isPromise,
  isAsyncFunction,
  mergeOptions,
  debounce,
  throttle,
  calculateBackoffDelay,
  formatDuration,
  calculatePercentile
} from './utils.js';

// ============================================================================
// LOGGING
// ============================================================================

export {
  Logger,
  createLogger,
  createPerformanceLogger,
  createSilentLogger,
  createTestLogger,
  globalLogger,
  log,
  debug,
  info,
  warn,
  error
} from './logger.js';

// ============================================================================
// ASYNC LOCK
// ============================================================================

export {
  AsyncLock,
  createAsyncLock,
  createHighPerformanceAsyncLock,
  createTestAsyncLock
} from './async-lock.js';

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export {
  CircuitBreaker,
  createCircuitBreaker,
  createFastFailCircuitBreaker,
  createAdaptiveCircuitBreaker,
  createTestCircuitBreaker
} from './circuit-breaker.js';

// ============================================================================
// EVENT EMITTER
// ============================================================================

export {
  EventEmitter,
  createEventEmitter,
  createHighPerformanceEventEmitter,
  createTestEventEmitter
} from './event-emitter.js';

// ============================================================================
// VALIDATOR
// ============================================================================

export {
  Validator,
  createValidator,
  createStrictValidator,
  createLenientValidator,
  createTestValidator,
  quickValidate
} from './validator.js';

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Check if a value is a valid Pulsor alias
 */
export function isValidAlias(value: unknown): boolean {
  return typeof value === 'string' && 
         value.length > 0 && 
         value.length <= 100 && 
         /^[a-zA-Z0-9_-]+$/.test(value);
}

/**
 * Check if a value is a valid function for Pulsor
 */
export function isValidFunction(value: unknown): boolean {
  return typeof value === 'function';
}

/**
 * Check if a value is a valid callback function
 */
export function isValidCallback(value: unknown): boolean {
  return typeof value === 'function' && (value as Function).length > 0;
}

/**
 * Create a safe execution context
 */
export function createSafeContext<T>(fn: () => T): () => T | Error {
  return () => {
    try {
      return fn();
    } catch (error) {
      return normalizeError(error);
    }
  };
}

/**
 * Create a safe async execution context
 */
export function createSafeAsyncContext<T>(fn: () => Promise<T>): () => Promise<T | Error> {
  return async () => {
    try {
      return await fn();
    } catch (error) {
      return normalizeError(error);
    }
  };
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Performance measurement utility
 */
export class PerformanceMonitor {
  private measurements = new Map<string, number>();
  
  public start(name: string): void {
    this.measurements.set(name, nowMs());
  }
  
  public end(name: string): number {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      throw new Error(`No measurement started for '${name}'`);
    }
    
    const duration = nowMs() - startTime;
    this.measurements.delete(name);
    return duration;
  }
  
  public measure<T>(name: string, fn: () => T): T {
    this.start(name);
    try {
      const result = fn();
      return result;
    } finally {
      this.end(name);
    }
  }
  
  public async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(name);
    }
  }
  
  public clear(): void {
    this.measurements.clear();
  }
  
  public getActive(): string[] {
    return Array.from(this.measurements.keys());
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

// ============================================================================
// MEMORY MANAGEMENT
// ============================================================================

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  private snapshots: Array<{ timestamp: number; usage: any }> = [];
  
  public takeSnapshot(): void {
    const timestamp = nowMs();
    let usage: any = {};
    
    // Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      usage = process.memoryUsage();
    }
    // Browser environment
    else if (typeof performance !== 'undefined' && (performance as any).memory) {
      usage = (performance as any).memory;
    }
    
    this.snapshots.push({ timestamp, usage });
    
    // Keep only last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }
  }
  
  public getSnapshots(): ReadonlyArray<{ timestamp: number; usage: any }> {
    return [...this.snapshots];
  }
  
  public getLatest(): { timestamp: number; usage: any } | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }
  
  public clear(): void {
    this.snapshots.length = 0;
  }
  
  public startMonitoring(interval: number = 5000): NodeJS.Timeout {
    return setInterval(() => {
      this.takeSnapshot();
    }, interval);
  }
}

/**
 * Global memory tracker instance
 */
export const globalMemoryTracker = new MemoryTracker();

// ============================================================================
// RESOURCE CLEANUP
// ============================================================================

/**
 * Resource cleanup manager
 */
export class ResourceManager {
  private resources = new Set<{ destroy(): void }>();
  private cleanupHandlers = new Set<() => void>();
  
  public register(resource: { destroy(): void }): void {
    this.resources.add(resource);
  }
  
  public unregister(resource: { destroy(): void }): boolean {
    return this.resources.delete(resource);
  }
  
  public addCleanupHandler(handler: () => void): void {
    this.cleanupHandlers.add(handler);
  }
  
  public removeCleanupHandler(handler: () => void): boolean {
    return this.cleanupHandlers.delete(handler);
  }
  
  public cleanup(): void {
    // Execute cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        handler();
      } catch (error) {
        console.error('Cleanup handler error:', error);
      }
    }
    
    // Destroy resources
    for (const resource of this.resources) {
      try {
        resource.destroy();
      } catch (error) {
        console.error('Resource destruction error:', error);
      }
    }
    
    this.resources.clear();
    this.cleanupHandlers.clear();
  }
  
  public getResourceCount(): number {
    return this.resources.size;
  }
  
  public getHandlerCount(): number {
    return this.cleanupHandlers.size;
  }
}

/**
 * Global resource manager instance
 */
export const globalResourceManager = new ResourceManager();

// ============================================================================
// INITIALIZATION HELPERS
// ============================================================================

/**
 * Initialize core components with default configuration
 */
export function initializeCore(config: {
  logger?: boolean;
  performance?: boolean;
  memory?: boolean;
  cleanup?: boolean;
} = {}) {
  const {
    logger = true,
    performance = true,
    memory = false,
    cleanup = true
  } = config;
  
  if (logger) {
    globalLogger.info('Pulsor core initialized');
  }
  
  if (performance) {
    globalResourceManager.register(globalPerformanceMonitor);
  }
  
  if (memory) {
    const memoryInterval = globalMemoryTracker.startMonitoring();
    globalResourceManager.addCleanupHandler(() => {
      clearInterval(memoryInterval);
    });
  }
  
  if (cleanup) {
    // Register cleanup on process exit (Node.js)
    if (typeof process !== 'undefined') {
      const cleanupOnExit = () => {
        globalResourceManager.cleanup();
      };
      
      process.on('exit', cleanupOnExit);
      process.on('SIGINT', cleanupOnExit);
      process.on('SIGTERM', cleanupOnExit);
      process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
        cleanupOnExit();
        process.exit(1);
      });
    }
    
    // Register cleanup on window unload (Browser)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        globalResourceManager.cleanup();
      });
    }
  }
}

/**
 * Cleanup all core components
 */
export function cleanupCore(): void {
  globalResourceManager.cleanup();
  globalPerformanceMonitor.clear();
  globalMemoryTracker.clear();
  globalLogger.info('Pulsor core cleaned up');
}