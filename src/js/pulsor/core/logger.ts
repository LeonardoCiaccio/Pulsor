/**
 * Enhanced logging system for the Pulsor framework
 * @fileoverview Advanced logging with levels, formatting, and performance optimization
 * @version 6.0.0
 * @author Pulsor Team
 */

import type { LogLevel } from '../types/index.js';
import type { ILogger } from '../interfaces/index.js';
import { nowMs, formatDuration } from './utils.js';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Log entry structure
 */
interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly args: readonly unknown[];
  readonly prefix?: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  readonly prefix: string;
  readonly enabledLevels: Partial<Record<LogLevel, boolean>>;
  readonly enableTimestamps: boolean;
  readonly enableColors: boolean;
  readonly maxHistorySize: number;
  readonly enablePerformanceLogging: boolean;
  readonly enableAsyncLogging: boolean;
  readonly enableBatching: boolean;
  readonly batchSize: number;
  readonly flushInterval: number;
  readonly enableStructuredLogging: boolean;
  readonly logRotation: {
    enabled: boolean;
    maxSizeBytes: number;
    maxFiles: number;
  };
  readonly console?: Console;
}

/**
 * Performance measurement
 */
interface PerformanceMeasurement {
  readonly name: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly duration?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  prefix: '[Pulsor]',
  enabledLevels: {
    log: true,
    debug: false,
    info: true,
    warn: true,
    error: true
  },
  enableTimestamps: true,
  enableColors: true,
  maxHistorySize: 1000,
  enablePerformanceLogging: false,
  enableAsyncLogging: false,
  enableBatching: false,
  batchSize: 100,
  flushInterval: 1000, // 1 second
  enableStructuredLogging: false,
  logRotation: {
    enabled: false,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  }
};

/**
 * ANSI color codes for console output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
} as const;

/**
 * Color mapping for log levels
 */
const LEVEL_COLORS: Record<LogLevel, string> = {
  log: COLORS.white,
  debug: COLORS.gray,
  info: COLORS.blue,
  warn: COLORS.yellow,
  error: COLORS.red
};

/**
 * Log level priorities (higher number = higher priority)
 */
const LEVEL_PRIORITIES: Record<LogLevel, number> = {
  debug: 1,
  log: 2,
  info: 3,
  warn: 4,
  error: 5
};

/**
 * Batch queue for async logging
 */
interface LogBatch {
  entries: LogEntry[];
  timestamp: number;
}


// ============================================================================
// LOGGER IMPLEMENTATION
// ============================================================================

/**
 * Enhanced logger implementation with advanced features
 */
export class Logger implements ILogger {
  private readonly config: LoggerConfig;
  private readonly history: LogEntry[] = [];
  private readonly performanceMeasurements = new Map<string, PerformanceMeasurement>();
  private readonly console: Console;
  private readonly logQueue: LogEntry[] = [];
  private batchTimer?: NodeJS.Timeout;
  private readonly logBuffer = new Map<LogLevel, LogEntry[]>();
  private currentLogSize = 0;
  private isDestroyed = false;

  constructor(
    prefix: string = DEFAULT_CONFIG.prefix,
    config: Partial<LoggerConfig> = {}
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      prefix,
      logRotation: {
        ...DEFAULT_CONFIG.logRotation,
        ...config.logRotation
      }
    };
    
    // Use global console or provided console
    this.console = (config as any).console ?? globalThis.console;
    
    // Initialize log buffers for each level
    Object.keys(LEVEL_PRIORITIES).forEach(level => {
      this.logBuffer.set(level as LogLevel, []);
    });
    
    // Start batch timer if batching is enabled
    if (this.config.enableBatching) {
      this.startBatchTimer();
    }
  }

  /**
   * Configure enabled logging services
   */
  public services(config: Partial<Record<LogLevel, boolean>>): void {
    Object.assign(this.config.enabledLevels, config);
  }

  /**
   * Format a message with logger prefix
   */
  public format(message: string): string {
    const timestamp = this.config.enableTimestamps 
      ? `[${new Date().toISOString()}] `
      : '';
    
    return `${timestamp}${this.config.prefix} ${message}`;
  }

  /**
   * Log a message at the specified level
   */
  public log(message: string, ...args: unknown[]): void {
    this.logAtLevel('log', message, ...args);
  }

  /**
   * Log a debug message
   */
  public debug(message: string, ...args: unknown[]): void {
    this.logAtLevel('debug', message, ...args);
  }

  /**
   * Log an info message
   */
  public info(message: string, ...args: unknown[]): void {
    this.logAtLevel('info', message, ...args);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, ...args: unknown[]): void {
    this.logAtLevel('warn', message, ...args);
  }

  /**
   * Log an error message
   */
  public error(message: string, ...args: unknown[]): void {
    this.logAtLevel('error', message, ...args);
  }

  /**
   * Log with additional context
   */
  public logWithContext(
    level: LogLevel,
    message: string,
    context: Record<string, unknown>,
    ...args: unknown[]
  ): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      args,
      prefix: this.config.prefix,
      context
    };

    this.addToHistory(entry);
    this.outputToConsole(entry);
  }

  /**
   * Start a performance measurement
   */
  public startPerformanceMeasurement(name: string): void {
    if (!this.config.enablePerformanceLogging) {
      return;
    }

    this.performanceMeasurements.set(name, {
      name,
      startTime: nowMs()
    });
  }

  /**
   * End a performance measurement and log the result
   */
  public endPerformanceMeasurement(name: string): number | null {
    if (!this.config.enablePerformanceLogging) {
      return null;
    }

    const measurement = this.performanceMeasurements.get(name);
    if (!measurement) {
      this.warn(`Performance measurement '${name}' not found`);
      return null;
    }

    const endTime = nowMs();
    const duration = endTime - measurement.startTime;

    this.performanceMeasurements.set(name, {
      ...measurement,
      endTime,
      duration
    });

    this.debug(`Performance: ${name} took ${formatDuration(duration)}`);
    return duration;
  }

  /**
   * Log a performance measurement
   */
  public logPerformance(name: string, duration: number): void {
    if (!this.config.enablePerformanceLogging) {
      return;
    }

    this.debug(`Performance: ${name} took ${formatDuration(duration)}`);
  }

  /**
   * Get performance measurements
   */
  public getPerformanceMeasurements(): ReadonlyMap<string, PerformanceMeasurement> {
    return new Map(this.performanceMeasurements);
  }

  /**
   * Clear performance measurements
   */
  public clearPerformanceMeasurements(): void {
    this.performanceMeasurements.clear();
  }

  /**
   * Get log history
   */
  public getHistory(level?: LogLevel, limit?: number): readonly LogEntry[] {
    let filtered = level 
      ? this.history.filter(entry => entry.level === level)
      : this.history;

    if (limit && limit > 0) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Clear log history
   */
  public clearHistory(): void {
    this.history.length = 0;
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(level?: LogLevel): string {
    const logs = this.getHistory(level);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Create a child logger with additional prefix
   */
  public createChild(childPrefix: string): Logger {
    return new Logger(
      `${this.config.prefix}:${childPrefix}`,
      {
        ...this.config,
        prefix: `${this.config.prefix}:${childPrefix}`
      }
    );
  }

  /**
   * Enable or disable colors
   */
  public setColorsEnabled(enabled: boolean): void {
    (this.config as any).enableColors = enabled;
  }

  /**
   * Enable or disable timestamps
   */
  public setTimestampsEnabled(enabled: boolean): void {
    (this.config as any).enableTimestamps = enabled;
  }

  /**
   * Enable or disable performance logging
   */
  public setPerformanceLoggingEnabled(enabled: boolean): void {
    (this.config as any).enablePerformanceLogging = enabled;
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Log at the specified level
   */
  private logAtLevel(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.isLevelEnabled(level) || this.isDestroyed) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      args: this.sanitizeArgs(args),
      prefix: this.config.prefix
    };

    this.addToHistory(entry);
    
    if (this.config.enableAsyncLogging || this.config.enableBatching) {
      this.queueLogEntry(entry);
    } else {
      this.outputToConsole(entry);
    }
    
    // Check for log rotation if enabled
    if (this.config.logRotation.enabled) {
      this.checkLogRotation(entry);
    }
  }

  /**
   * Check if a log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return this.config.enabledLevels[level] ?? false;
  }

  /**
   * Add entry to history with size management and optimization
   */
  private addToHistory(entry: LogEntry): void {
    this.history.push(entry);
    
    // Maintain history size limit with efficient cleanup
    if (this.history.length > this.config.maxHistorySize) {
      const removeCount = Math.floor(this.config.maxHistorySize * 0.1); // Remove 10%
      this.history.splice(0, removeCount);
    }
    
    // Update current log size for rotation
    this.currentLogSize += this.estimateLogEntrySize(entry);
  }

  /**
   * Output entry to console with formatting and error handling
   */
  private outputToConsole(entry: LogEntry): void {
    try {
      const formattedMessage = this.formatEntryForConsole(entry);
      const consoleMethod = this.getConsoleMethod(entry.level);
      
      if (entry.args.length > 0) {
        consoleMethod(formattedMessage, ...entry.args);
      } else {
        consoleMethod(formattedMessage);
      }
    } catch (error) {
      // Fallback to basic console.log if formatting fails
      try {
        this.console.log(`[Logger Error] ${entry.message}`, error);
      } catch {
        // Silent failure if even basic logging fails
      }
    }
  }

  /**
   * Format log entry for console output
   */
  private formatEntryForConsole(entry: LogEntry): string {
    const timestamp = this.config.enableTimestamps 
      ? `[${entry.timestamp}] `
      : '';
    
    const levelTag = `[${entry.level.toUpperCase()}]`;
    const prefix = entry.prefix ? `${entry.prefix} ` : '';
    
    let formatted = `${timestamp}${prefix}${levelTag} ${entry.message}`;
    
    // Add context if present
    if (entry.context && Object.keys(entry.context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(entry.context)}`;
    }
    
    // Apply colors if enabled
    if (this.config.enableColors && this.supportsColors()) {
      const color = LEVEL_COLORS[entry.level];
      formatted = `${color}${formatted}${COLORS.reset}`;
    }
    
    return formatted;
  }

  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case 'error':
        return this.console.error.bind(this.console);
      case 'warn':
        return this.console.warn.bind(this.console);
      case 'info':
        return this.console.info.bind(this.console);
      case 'debug':
        return this.console.debug?.bind(this.console) ?? this.console.log.bind(this.console);
      case 'log':
      default:
        return this.console.log.bind(this.console);
    }
  }

  /**
   * Check if the environment supports colors
   */
  private supportsColors(): boolean {
    // Check for Node.js environment
    if (typeof process !== 'undefined' && process.stdout) {
      return process.stdout.isTTY ?? false;
    }
    
    // Check for browser environment
    if (typeof window !== 'undefined') {
      return true; // Most modern browsers support console colors
    }
    
    return false;
  }
  
  /**
   * Queue log entry for batch processing
   */
  private queueLogEntry(entry: LogEntry): void {
    if (this.config.enableBatching) {
      const levelBuffer = this.logBuffer.get(entry.level);
      if (levelBuffer) {
        levelBuffer.push(entry);
        
        // Flush if batch size reached
        if (levelBuffer.length >= this.config.batchSize) {
          this.flushBatch(entry.level);
        }
      }
    } else {
      this.logQueue.push(entry);
      this.processQueueAsync();
    }
  }
  
  /**
   * Process log queue asynchronously
   */
  private async processQueueAsync(): Promise<void> {
    if (this.logQueue.length === 0) {
      return;
    }
    
    // Use setTimeout to avoid blocking the main thread
    setTimeout(() => {
      const batch = this.logQueue.splice(0, this.config.batchSize);
      batch.forEach(entry => this.outputToConsole(entry));
      
      if (this.logQueue.length > 0) {
        this.processQueueAsync();
      }
    }, 0);
  }
  
  /**
   * Start batch timer for periodic flushing
   */
  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    this.batchTimer = setInterval(() => {
      this.flushAllBatches();
    }, this.config.flushInterval);
  }
  
  /**
   * Flush a specific level batch
   */
  private flushBatch(level: LogLevel): void {
    const levelBuffer = this.logBuffer.get(level);
    if (!levelBuffer || levelBuffer.length === 0) {
      return;
    }
    
    const batch = levelBuffer.splice(0);
    batch.forEach(entry => this.outputToConsole(entry));
  }
  
  /**
   * Flush all batches
   */
  private flushAllBatches(): void {
    for (const level of Object.keys(LEVEL_PRIORITIES) as LogLevel[]) {
      this.flushBatch(level);
    }
  }
  
  /**
   * Sanitize arguments to prevent logging of sensitive data
   */
  private sanitizeArgs(args: readonly unknown[]): readonly unknown[] {
    return args.map(arg => {
      if (arg && typeof arg === 'object') {
        try {
          // Create a sanitized copy
          const sanitized = JSON.parse(JSON.stringify(arg, (key, value) => {
            // Remove potentially sensitive keys
            const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
              return '[REDACTED]';
            }
            return value;
          }));
          return sanitized;
        } catch {
          return '[Object]';
        }
      }
      return arg;
    });
  }
  
  /**
   * Estimate log entry size in bytes
   */
  private estimateLogEntrySize(entry: LogEntry): number {
    try {
      return JSON.stringify(entry).length * 2; // UTF-16 estimate
    } catch {
      return entry.message.length * 2 + 100; // Basic estimate
    }
  }
  
  /**
   * Check if log rotation is needed
   */
  private checkLogRotation(entry: LogEntry): void {
    if (this.currentLogSize > this.config.logRotation.maxSizeBytes) {
      this.rotateLog();
    }
  }
  
  /**
   * Rotate log by clearing old entries
   */
  private rotateLog(): void {
    const keepCount = Math.floor(this.config.maxHistorySize * 0.5); // Keep 50%
    this.history.splice(0, this.history.length - keepCount);
    this.currentLogSize = this.history.reduce((size, entry) => 
      size + this.estimateLogEntrySize(entry), 0);
    
    this.info(`Log rotated, kept ${keepCount} entries`);
  }
  
  /**
   * Destroy logger and cleanup resources
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    
    this.isDestroyed = true;
    
    // Flush any remaining batches
    this.flushAllBatches();
    
    // Clear batch timer
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = undefined;
    }
    
    // Clear all buffers and queues
    this.logQueue.length = 0;
    this.logBuffer.clear();
    this.performanceMeasurements.clear();
    this.history.length = 0;
  }
  
  /**
   * Get logger performance statistics
   */
  public getPerformanceStats(): {
    totalEntries: number;
    queueSize: number;
    bufferSizes: Record<LogLevel, number>;
    currentLogSize: number;
  } {
    const bufferSizes = {} as Record<LogLevel, number>;
    for (const [level, buffer] of this.logBuffer) {
      bufferSizes[level] = buffer.length;
    }
    
    return {
      totalEntries: this.history.length,
      queueSize: this.logQueue.length,
      bufferSizes,
      currentLogSize: this.currentLogSize
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new logger instance
 */
export function createLogger(
  prefix: string = '[Pulsor]',
  config: Partial<LoggerConfig> = {}
): Logger {
  return new Logger(prefix, config);
}

/**
 * Create a logger with performance logging enabled
 */
export function createPerformanceLogger(
  prefix: string = '[Pulsor:Perf]',
  config: Partial<LoggerConfig> = {}
): Logger {
  return new Logger(prefix, {
    ...config,
    enablePerformanceLogging: true,
    enableAsyncLogging: true,
    enableBatching: true,
    batchSize: 50,
    enabledLevels: {
      ...DEFAULT_CONFIG.enabledLevels,
      debug: true,
      ...config.enabledLevels
    }
  });
}

/**
 * Create a silent logger (all levels disabled)
 */
export function createSilentLogger(): Logger {
  return new Logger('[Pulsor:Silent]', {
    enabledLevels: {
      log: false,
      debug: false,
      info: false,
      warn: false,
      error: false
    }
  });
}

/**
 * Create a logger for testing (no console output, history enabled)
 */
export function createTestLogger(
  prefix: string = '[Pulsor:Test]'
): Logger {
  return new Logger(prefix, {
    enabledLevels: {
      log: true,
      debug: true,
      info: true,
      warn: true,
      error: true
    },
    maxHistorySize: 10000,
    enableAsyncLogging: false,
    enableBatching: false,
    console: {
      log: () => {},
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    } as Console
  });
}

/**
 * Create a high-performance logger with optimized settings
 */
export function createHighPerformanceLogger(
  prefix: string = '[Pulsor:HiPerf]',
  config: Partial<LoggerConfig> = {}
): Logger {
  return new Logger(prefix, {
    ...config,
    enableAsyncLogging: true,
    enableBatching: true,
    batchSize: 200,
    flushInterval: 500,
    enableTimestamps: false,
    enableColors: false,
    maxHistorySize: 500,
    enablePerformanceLogging: false
  });
}

/**
 * Create a structured logger for machine-readable logs
 */
export function createStructuredLogger(
  prefix: string = '[Pulsor:Structured]',
  config: Partial<LoggerConfig> = {}
): Logger {
  return new Logger(prefix, {
    ...config,
    enableStructuredLogging: true,
    enableTimestamps: true,
    enableColors: false,
    enableAsyncLogging: true,
    enableBatching: true,
    batchSize: 100
  });
}

// ============================================================================
// GLOBAL LOGGER INSTANCE
// ============================================================================

/**
 * Default global logger instance
 */
export const globalLogger = createLogger();

/**
 * Convenience functions using the global logger
 */
export const log = globalLogger.log.bind(globalLogger);
export const debug = globalLogger.debug.bind(globalLogger);
export const info = globalLogger.info.bind(globalLogger);
export const warn = globalLogger.warn.bind(globalLogger);
export const error = globalLogger.error.bind(globalLogger);