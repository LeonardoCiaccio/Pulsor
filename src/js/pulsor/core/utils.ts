/**
 * Core utilities and constants for the Pulsor system
 * @fileoverview Enhanced utility functions with better type safety and performance
 * @version 6.0.0
 * @author Pulsor Team
 */

import type {
  PulserAlias,
  PulserOptions,
  CallbackOptions,
  PatternCallbackOptions,
  CallbackStrategy,
  ScheduleStrategy,
  ContextProvisionMode
} from '../types/index.js';

import {
  PulsorValidationError,
  normalizeError
} from './errors.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Security-related constants
 */
export const SECURITY_CONSTANTS = {
  /** Keys that are considered dangerous for prototype pollution */
  DANGEROUS_KEYS: Object.freeze([
    '__proto__',
    'constructor',
    'prototype',
    'valueOf',
    'toString',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString'
  ] as const),
  
  /** Regex for validating Pulser aliases */
  ALIAS_REGEX: /^[a-zA-Z_$][a-zA-Z0-9_$.-]*$/,
  
  /** Maximum alias length */
  MAX_ALIAS_LENGTH: 255,
  
  /** Maximum pattern length */
  MAX_PATTERN_LENGTH: 1000
} as const;

/**
 * Performance-related constants
 */
export const PERFORMANCE_CONSTANTS = {
  /** Default metrics window size */
  DEFAULT_METRICS_WINDOW_SIZE: 1000,
  
  /** Maximum metrics window size */
  MAX_METRICS_WINDOW_SIZE: 10000,
  
  /** Default cleanup interval in milliseconds */
  DEFAULT_CLEANUP_INTERVAL: 300000, // 5 minutes
  
  /** Default pattern TTL in milliseconds */
  DEFAULT_PATTERN_TTL: 3600000, // 1 hour
  
  /** Maximum callback priority */
  MAX_CALLBACK_PRIORITY: 1000,
  
  /** Minimum callback priority */
  MIN_CALLBACK_PRIORITY: -1000
} as const;

/**
 * Default options for Pulser creation
 */
export const DEFAULT_PULSER_OPTIONS: Required<PulserOptions> = Object.freeze({
  callbackStrategy: 'parallel' as CallbackStrategy,
  failFastCallbacks: false,
  schedule: 'immediate' as ScheduleStrategy,
  provideContext: 'none' as ContextProvisionMode,
  errorCallbacksBeforeThrow: true,
  propagateMainError: true,
  preventConcurrentExecution: false,
  freezeArgs: false,
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  circuitBreakerThreshold: 5
});

/**
 * Default options for callbacks
 */
export const DEFAULT_CALLBACK_OPTIONS: Required<CallbackOptions> = Object.freeze({
  phase: 'before',
  priority: 0,
  once: false,
  ttl: 0 // No expiration by default
});

/**
 * Default options for pattern callbacks
 */
export const DEFAULT_PATTERN_CALLBACK_OPTIONS: Required<PatternCallbackOptions> = Object.freeze({
  ...DEFAULT_CALLBACK_OPTIONS,
  ttl: PERFORMANCE_CONSTANTS.DEFAULT_PATTERN_TTL
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate a Pulser alias
 */
export function validateAlias(alias: unknown): asserts alias is PulserAlias {
  if (typeof alias !== 'string') {
    throw new PulsorValidationError('Alias must be a string', {
      field: 'alias',
      value: alias,
      expectedType: 'string'
    });
  }
  
  if (alias.length === 0) {
    throw new PulsorValidationError('Alias cannot be empty', {
      field: 'alias',
      value: alias
    });
  }
  
  if (alias.length > SECURITY_CONSTANTS.MAX_ALIAS_LENGTH) {
    throw new PulsorValidationError(
      `Alias too long (max ${SECURITY_CONSTANTS.MAX_ALIAS_LENGTH} characters)`,
      {
        field: 'alias',
        value: alias,
        context: { maxLength: SECURITY_CONSTANTS.MAX_ALIAS_LENGTH }
      }
    );
  }
  
  if (!SECURITY_CONSTANTS.ALIAS_REGEX.test(alias)) {
    throw new PulsorValidationError(
      'Alias contains invalid characters. Must start with letter, underscore, or $ and contain only alphanumeric characters, underscores, dots, and hyphens',
      {
        field: 'alias',
        value: alias,
        context: { pattern: SECURITY_CONSTANTS.ALIAS_REGEX.source }
      }
    );
  }
  
  if (SECURITY_CONSTANTS.DANGEROUS_KEYS.includes(alias as any)) {
    throw new PulsorValidationError(
      `Alias '${alias}' is reserved and cannot be used`,
      {
        field: 'alias',
        value: alias,
        context: { dangerousKeys: SECURITY_CONSTANTS.DANGEROUS_KEYS }
      }
    );
  }
}

/**
 * Validate a function
 */
export function validateFunction(fn: unknown): asserts fn is Function {
  if (typeof fn !== 'function') {
    throw new PulsorValidationError('Expected a function', {
      field: 'function',
      value: fn,
      expectedType: 'function'
    });
  }
}

/**
 * Validate Pulser options
 */
export function validatePulserOptions(options: unknown): asserts options is PulserOptions {
  if (options === null || options === undefined) {
    return; // Options are optional
  }
  
  if (typeof options !== 'object') {
    throw new PulsorValidationError('Options must be an object', {
      field: 'options',
      value: options,
      expectedType: 'object'
    });
  }
  
  const opts = options as Record<string, unknown>;
  
  // Validate each option if present
  if ('callbackStrategy' in opts && opts['callbackStrategy'] !== undefined) {
    if (!['parallel', 'sequential'].includes(opts['callbackStrategy'] as string)) {
      throw new PulsorValidationError(
        'callbackStrategy must be "parallel" or "sequential"',
        {
          field: 'options.callbackStrategy',
          value: opts['callbackStrategy'],
          expectedType: '"parallel" | "sequential"'
        }
      );
    }
  }
  
  if ('schedule' in opts && opts['schedule'] !== undefined) {
    if (!['immediate', 'microtask'].includes(opts['schedule'] as string)) {
      throw new PulsorValidationError(
        'schedule must be "immediate" or "microtask"',
        {
          field: 'options.schedule',
          value: opts['schedule'],
          expectedType: '"immediate" | "microtask"'
        }
      );
    }
  }
  
  if ('provideContext' in opts && opts['provideContext'] !== undefined) {
    if (!['none', 'prepend', 'append'].includes(opts['provideContext'] as string)) {
      throw new PulsorValidationError(
        'provideContext must be "none", "prepend", or "append"',
        {
          field: 'options.provideContext',
          value: opts['provideContext'],
          expectedType: '"none" | "prepend" | "append"'
        }
      );
    }
  }
  
  // Validate numeric options
  const numericOptions = ['timeout', 'maxRetries', 'circuitBreakerThreshold'] as const;
  for (const option of numericOptions) {
    if (option in opts && opts[option] !== undefined) {
      if (typeof opts[option] !== 'number' || !Number.isInteger(opts[option] as number) || (opts[option] as number) < 0) {
        throw new PulsorValidationError(
          `${option} must be a non-negative integer`,
          {
            field: `options.${option}`,
            value: opts[option],
            expectedType: 'non-negative integer'
          }
        );
      }
    }
  }
  
  // Validate boolean options
  const booleanOptions = [
    'failFastCallbacks',
    'errorCallbacksBeforeThrow',
    'propagateMainError',
    'preventConcurrentExecution',
    'freezeArgs'
  ] as const;
  
  for (const option of booleanOptions) {
    if (option in opts && opts[option] !== undefined) {
      if (typeof opts[option] !== 'boolean') {
        throw new PulsorValidationError(
          `${option} must be a boolean`,
          {
            field: `options.${option}`,
            value: opts[option],
            expectedType: 'boolean'
          }
        );
      }
    }
  }
}

/**
 * Validate callback options
 */
export function validateCallbackOptions(options: unknown): asserts options is CallbackOptions {
  if (options === null || options === undefined) {
    return; // Options are optional
  }
  
  if (typeof options !== 'object') {
    throw new PulsorValidationError('Callback options must be an object', {
      field: 'callbackOptions',
      value: options,
      expectedType: 'object'
    });
  }
  
  const opts = options as Record<string, unknown>;
  
  if ('phase' in opts && opts.phase !== undefined) {
    if (!['before', 'after', 'error'].includes(opts.phase as string)) {
      throw new PulsorValidationError(
        'phase must be "before", "after", or "error"',
        {
          field: 'callbackOptions.phase',
          value: opts.phase,
          expectedType: '"before" | "after" | "error"'
        }
      );
    }
  }
  
  if ('priority' in opts && opts['priority'] !== undefined) {
    if (typeof opts['priority'] !== 'number' || !Number.isInteger(opts['priority'])) {
      throw new PulsorValidationError(
        'priority must be an integer',
        {
          field: 'callbackOptions.priority',
          value: opts['priority'],
          expectedType: 'integer'
        }
      );
    }
    
    if (opts['priority'] < PERFORMANCE_CONSTANTS.MIN_CALLBACK_PRIORITY || 
        opts['priority'] > PERFORMANCE_CONSTANTS.MAX_CALLBACK_PRIORITY) {
      throw new PulsorValidationError(
        `priority must be between ${PERFORMANCE_CONSTANTS.MIN_CALLBACK_PRIORITY} and ${PERFORMANCE_CONSTANTS.MAX_CALLBACK_PRIORITY}`,
        {
          field: 'callbackOptions.priority',
          value: opts['priority'],
          context: {
            min: PERFORMANCE_CONSTANTS.MIN_CALLBACK_PRIORITY,
            max: PERFORMANCE_CONSTANTS.MAX_CALLBACK_PRIORITY
          }
        }
      );
    }
  }
  
  if ('once' in opts && opts['once'] !== undefined) {
    if (typeof opts['once'] !== 'boolean') {
      throw new PulsorValidationError(
        'once must be a boolean',
        {
          field: 'callbackOptions.once',
          value: opts['once'],
          expectedType: 'boolean'
        }
      );
    }
  }
  
  if ('ttl' in opts && opts['ttl'] !== undefined) {
    if (typeof opts['ttl'] !== 'number' || !Number.isInteger(opts['ttl']) || opts['ttl'] < 0) {
      throw new PulsorValidationError(
        'ttl must be a non-negative integer',
        {
          field: 'callbackOptions.ttl',
          value: opts['ttl'],
          expectedType: 'non-negative integer'
        }
      );
    }
  }
}

/**
 * Validate a pattern string
 */
export function validatePattern(pattern: unknown): asserts pattern is string {
  if (typeof pattern !== 'string') {
    throw new PulsorValidationError('Pattern must be a string', {
      field: 'pattern',
      value: pattern,
      expectedType: 'string'
    });
  }
  
  if (pattern.length === 0) {
    throw new PulsorValidationError('Pattern cannot be empty', {
      field: 'pattern',
      value: pattern
    });
  }
  
  if (pattern.length > SECURITY_CONSTANTS.MAX_PATTERN_LENGTH) {
    throw new PulsorValidationError(
      `Pattern too long (max ${SECURITY_CONSTANTS.MAX_PATTERN_LENGTH} characters)`,
      {
        field: 'pattern',
        value: pattern,
        context: { maxLength: SECURITY_CONSTANTS.MAX_PATTERN_LENGTH }
      }
    );
  }
  
  // Validate regex pattern
  try {
    new RegExp(pattern);
  } catch (error) {
    throw new PulsorValidationError(
      'Pattern is not a valid regular expression',
      {
        field: 'pattern',
        value: pattern,
        cause: normalizeError(error)
      }
    );
  }
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Check if a key is dangerous for prototype pollution
 */
export function isDangerousKey(key: string): boolean {
  return SECURITY_CONSTANTS.DANGEROUS_KEYS.includes(key as any);
}

/**
 * Sanitize arguments to prevent prototype pollution
 * Creates a deep clone while filtering out dangerous keys
 */
export function sanitizeArgs<T extends readonly unknown[]>(args: T): unknown[] {
  return args.map(arg => sanitizeValue(arg));
}

/**
 * Sanitize a single value recursively
 */
export function sanitizeValue<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item)) as T;
    }
    
    if (value instanceof Date || value instanceof RegExp || value instanceof Error) {
      return value; // These are safe to pass through
    }
    
    // For plain objects, create a sanitized copy
    const sanitized = {} as Record<string, unknown>;
    for (const [key, val] of Object.entries(value)) {
      if (!isDangerousKey(key)) {
        sanitized[key] = sanitizeValue(val);
      }
    }
    return sanitized as T;
  }
  
  return value;
}

/**
 * Deep freeze an object to prevent mutations
 */
export function deepFreeze<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  // Freeze the object itself
  Object.freeze(obj);
  
  // Recursively freeze all properties
  Object.values(obj).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });
  
  return obj;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current timestamp in milliseconds with fallback
 */
export function nowMs(): number {
  try {
    return performance?.now?.() ?? Date.now();
  } catch {
    return Date.now();
  }
}

/**
 * Generate a unique execution ID
 */
export function generateExecutionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
}

/**
 * Generate a unique pattern ID
 */
export function generatePatternId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `pattern-${timestamp}-${random}`;
}

/**
 * Check if a value is a Promise
 */
export function isPromise<T>(value: unknown): value is Promise<T> {
  return value !== null && 
         typeof value === 'object' && 
         'then' in value && 
         typeof (value as any).then === 'function';
}

/**
 * Check if a function is async
 */
export function isAsyncFunction(fn: Function): boolean {
  return fn.constructor.name === 'AsyncFunction' || 
         fn.toString().includes('async ');
}

/**
 * Merge options with defaults
 */
export function mergeOptions<T extends Record<string, unknown>>(
  defaults: Required<T>,
  options?: Partial<T>
): Required<T> {
  if (!options) {
    return { ...defaults };
  }
  
  const merged = { ...defaults };
  
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      (merged as any)[key] = value;
    }
  }
  
  return merged;
}

/**
 * Create a debounced version of a function
 */
export function debounce<TArgs extends readonly unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number
): (...args: TArgs) => void {
  let timeoutId: NodeJS.Timeout | number | undefined;
  
  return (...args: TArgs): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
    }, delayMs);
  };
}

/**
 * Create a throttled version of a function
 */
export function throttle<TArgs extends readonly unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number
): (...args: TArgs) => void {
  let lastCall = 0;
  
  return (...args: TArgs): void => {
    const now = nowMs();
    if (now - lastCall >= delayMs) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  jitter: boolean = true
): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  
  if (jitter) {
    // Add random jitter (±25%)
    const jitterAmount = exponentialDelay * 0.25;
    return exponentialDelay + (Math.random() - 0.5) * 2 * jitterAmount;
  }
  
  return exponentialDelay;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Calculate percentile from a sorted array of numbers
 */
export function calculatePercentile(sortedValues: readonly number[], percentile: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  
  if (percentile <= 0) {
    return sortedValues[0] ?? 0;
  }
  
  if (percentile >= 100) {
    return sortedValues[sortedValues.length - 1] ?? 0;
  }
  
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) {
    return sortedValues[lower] ?? 0;
  }
  
  const weight = index - lower;
  const lowerValue = sortedValues[lower] ?? 0;
  const upperValue = sortedValues[upper] ?? 0;
  return lowerValue * (1 - weight) + upperValue * weight;
}