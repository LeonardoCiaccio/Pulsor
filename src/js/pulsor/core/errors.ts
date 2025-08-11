/**
 * Enhanced error classes for the Pulsor system
 * @fileoverview Comprehensive error handling with better debugging capabilities
 * @version 6.0.0
 * @author Pulsor Team
 */

import type { PulserAlias, ExecutionId } from '../types/index.js';

// ============================================================================
// BASE ERROR CLASSES
// ============================================================================

/**
 * Base error class for all Pulsor-related errors
 * Provides enhanced debugging information and error chaining
 */
export class PulsorError extends Error {
  /** Error code for programmatic handling */
  public readonly code: string;
  
  /** Original error that caused this error (if any) */
  public readonly cause?: Error;
  
  /** Additional context data */
  public readonly context: Record<string, unknown>;
  
  /** Timestamp when error occurred */
  public readonly timestamp: string;
  
  /** Stack trace from the original error */
  public readonly originalStack?: string;

  constructor(
    message: string,
    options: {
      code?: string;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = options.code ?? 'PULSOR_ERROR';
    this.cause = options.cause;
    this.context = options.context ?? {};
    this.timestamp = new Date().toISOString();
    this.originalStack = options.cause?.stack;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get a detailed error report including context and cause chain
   */
  public getDetailedReport(): string {
    const parts = [
      `${this.name}: ${this.message}`,
      `Code: ${this.code}`,
      `Timestamp: ${this.timestamp}`
    ];

    if (Object.keys(this.context).length > 0) {
      parts.push(`Context: ${JSON.stringify(this.context, null, 2)}`);
    }

    if (this.cause) {
      parts.push(`Caused by: ${this.cause.name}: ${this.cause.message}`);
      if (this.originalStack) {
        parts.push(`Original stack: ${this.originalStack}`);
      }
    }

    if (this.stack) {
      parts.push(`Stack: ${this.stack}`);
    }

    return parts.join('\n');
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined,
      stack: this.stack
    };
  }
}

// ============================================================================
// SPECIFIC ERROR CLASSES
// ============================================================================

/**
 * Error thrown when a Pulser operation is stopped/interrupted
 */
export class PulsorStoppedError extends PulsorError {
  public readonly pulserAlias?: PulserAlias;
  public readonly executionId?: ExecutionId;

  constructor(
    message: string = 'Pulser operation was stopped',
    options: {
      pulserAlias?: PulserAlias;
      executionId?: ExecutionId;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      code: 'PULSOR_STOPPED',
      cause: options.cause,
      context: {
        ...options.context,
        pulserAlias: options.pulserAlias,
        executionId: options.executionId
      }
    });
    
    this.pulserAlias = options.pulserAlias;
    this.executionId = options.executionId;
  }
}

/**
 * Error thrown when validation fails
 */
export class PulsorValidationError extends PulsorError {
  public readonly field?: string;
  public readonly value?: unknown;
  public readonly expectedType?: string;

  constructor(
    message: string,
    options: {
      field?: string;
      value?: unknown;
      expectedType?: string;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      code: 'PULSOR_VALIDATION_ERROR',
      cause: options.cause,
      context: {
        ...options.context,
        field: options.field,
        value: options.value,
        expectedType: options.expectedType
      }
    });
    
    this.field = options.field;
    this.value = options.value;
    this.expectedType = options.expectedType;
  }
}

/**
 * Error thrown when a timeout occurs
 */
export class PulsorTimeoutError extends PulsorError {
  public readonly timeoutMs: number;
  public readonly pulserAlias?: PulserAlias;
  public readonly executionId?: ExecutionId;

  constructor(
    timeoutMs: number,
    options: {
      pulserAlias?: PulserAlias;
      executionId?: ExecutionId;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(`Operation timed out after ${timeoutMs}ms`, {
      code: 'PULSOR_TIMEOUT',
      cause: options.cause,
      context: {
        ...options.context,
        timeoutMs,
        pulserAlias: options.pulserAlias,
        executionId: options.executionId
      }
    });
    
    this.timeoutMs = timeoutMs;
    this.pulserAlias = options.pulserAlias;
    this.executionId = options.executionId;
  }
}

/**
 * Error thrown when a Pulser is not found
 */
export class PulsorNotFoundError extends PulsorError {
  public readonly pulserAlias: PulserAlias;

  constructor(
    pulserAlias: PulserAlias,
    options: {
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(`Pulser '${pulserAlias}' not found`, {
      code: 'PULSOR_NOT_FOUND',
      cause: options.cause,
      context: {
        ...options.context,
        pulserAlias
      }
    });
    
    this.pulserAlias = pulserAlias;
  }
}

/**
 * Error thrown when trying to create a Pulser that already exists
 */
export class PulsorAlreadyExistsError extends PulsorError {
  public readonly pulserAlias: PulserAlias;

  constructor(
    pulserAlias: PulserAlias,
    options: {
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(`Pulser '${pulserAlias}' already exists`, {
      code: 'PULSOR_ALREADY_EXISTS',
      cause: options.cause,
      context: {
        ...options.context,
        pulserAlias
      }
    });
    
    this.pulserAlias = pulserAlias;
  }
}

/**
 * Error thrown when circuit breaker is open
 */
export class PulsorCircuitBreakerError extends PulsorError {
  public readonly pulserAlias: PulserAlias;
  public readonly failureCount: number;
  public readonly threshold: number;

  constructor(
    pulserAlias: PulserAlias,
    failureCount: number,
    threshold: number,
    options: {
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(
      `Circuit breaker is open for '${pulserAlias}' (${failureCount}/${threshold} failures)`,
      {
        code: 'PULSOR_CIRCUIT_BREAKER_OPEN',
        cause: options.cause,
        context: {
          ...options.context,
          pulserAlias,
          failureCount,
          threshold
        }
      }
    );
    
    this.pulserAlias = pulserAlias;
    this.failureCount = failureCount;
    this.threshold = threshold;
  }
}

/**
 * Error thrown when concurrent execution is prevented
 */
export class PulsorConcurrencyError extends PulsorError {
  public readonly pulserAlias: PulserAlias;
  public readonly executionId?: ExecutionId;

  constructor(
    pulserAlias: PulserAlias,
    options: {
      executionId?: ExecutionId;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(`Concurrent execution prevented for '${pulserAlias}'`, {
      code: 'PULSOR_CONCURRENCY_PREVENTED',
      cause: options.cause,
      context: {
        ...options.context,
        pulserAlias,
        executionId: options.executionId
      }
    });
    
    this.pulserAlias = pulserAlias;
    this.executionId = options.executionId;
  }
}

/**
 * Error thrown when maximum retries are exceeded
 */
export class PulsorMaxRetriesError extends PulsorError {
  public readonly pulserAlias: PulserAlias;
  public readonly maxRetries: number;
  public readonly lastError: Error;

  constructor(
    pulserAlias: PulserAlias,
    maxRetries: number,
    lastError: Error,
    options: {
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(
      `Maximum retries (${maxRetries}) exceeded for '${pulserAlias}'`,
      {
        code: 'PULSOR_MAX_RETRIES_EXCEEDED',
        cause: lastError,
        context: {
          ...options.context,
          pulserAlias,
          maxRetries
        }
      }
    );
    
    this.pulserAlias = pulserAlias;
    this.maxRetries = maxRetries;
    this.lastError = lastError;
  }
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Check if an error is a Pulsor-related error
 */
export function isPulsorError(error: unknown): error is PulsorError {
  return error instanceof PulsorError;
}

/**
 * Check if an error indicates a stopped operation
 */
export function isPulsorStoppedError(error: unknown): error is PulsorStoppedError {
  return error instanceof PulsorStoppedError;
}

/**
 * Check if an error is a validation error
 */
export function isPulsorValidationError(error: unknown): error is PulsorValidationError {
  return error instanceof PulsorValidationError;
}

/**
 * Check if an error is a timeout error
 */
export function isPulsorTimeoutError(error: unknown): error is PulsorTimeoutError {
  return error instanceof PulsorTimeoutError;
}

/**
 * Check if an error is a circuit breaker error
 */
export function isPulsorCircuitBreakerError(error: unknown): error is PulsorCircuitBreakerError {
  return error instanceof PulsorCircuitBreakerError;
}

/**
 * Extract error information for logging
 */
export function extractErrorInfo(error: unknown): {
  name: string;
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, unknown>;
} {
  if (isPulsorError(error)) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      context: error.context
    };
  }
  
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  
  return {
    name: 'UnknownError',
    message: String(error)
  };
}

/**
 * Create a standardized error from any thrown value
 */
export function normalizeError(error: unknown, context?: Record<string, unknown>): PulsorError {
  if (isPulsorError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new PulsorError(error.message, {
      code: 'WRAPPED_ERROR',
      cause: error,
      context
    });
  }
  
  return new PulsorError(String(error), {
    code: 'UNKNOWN_ERROR',
    context: {
      ...context,
      originalValue: error
    }
  });
}

/**
 * Wrap a function to convert any thrown errors to PulsorError
 */
export function wrapWithErrorNormalization<TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  context?: Record<string, unknown>
): (...args: TArgs) => TReturn {
  return (...args: TArgs): TReturn => {
    try {
      return fn(...args);
    } catch (error) {
      throw normalizeError(error, context);
    }
  };
}

/**
 * Wrap an async function to convert any thrown errors to PulsorError
 */
export function wrapAsyncWithErrorNormalization<TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  context?: Record<string, unknown>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw normalizeError(error, context);
    }
  };
}