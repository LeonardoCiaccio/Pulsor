/**
 * Advanced Circuit Breaker implementation for the Pulsor framework
 * @fileoverview Enhanced circuit breaker with adaptive thresholds, metrics, and recovery strategies
 * @version 6.0.0
 * @author Pulsor Team
 */

import type { CircuitBreakerState, CircuitBreakerStatus } from '../types/index.js';
import type { ICircuitBreaker } from '../interfaces/index.js';
import { PulsorCircuitBreakerError } from './errors.js';
import { nowMs, calculatePercentile } from './utils.js';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  readonly failureThreshold: number;
  readonly recoveryTimeout: number;
  readonly monitoringPeriod: number;
  readonly halfOpenMaxCalls: number;
  readonly enableAdaptiveThreshold: boolean;
  readonly adaptiveThresholdFactor: number;
  readonly enableMetrics: boolean;
  readonly metricsWindowSize: number;
  readonly slowCallThreshold: number;
  readonly slowCallDurationThreshold: number;
  readonly minimumThroughput: number;
}

/**
 * Execution result
 */
interface ExecutionResult {
  readonly success: boolean;
  readonly duration: number;
  readonly timestamp: number;
  readonly error?: Error;
}

/**
 * Circuit breaker metrics
 */
interface CircuitBreakerMetrics {
  readonly totalCalls: number;
  readonly successfulCalls: number;
  readonly failedCalls: number;
  readonly slowCalls: number;
  readonly rejectedCalls: number;
  readonly averageResponseTime: number;
  readonly p95ResponseTime: number;
  readonly p99ResponseTime: number;
  readonly failureRate: number;
  readonly slowCallRate: number;
  readonly throughput: number;
  readonly uptime: number;
}

/**
 * State transition event
 */
interface StateTransition {
  readonly from: CircuitBreakerState;
  readonly to: CircuitBreakerState;
  readonly timestamp: number;
  readonly reason: string;
  readonly metrics?: CircuitBreakerMetrics;
}

/**
 * Health check function
 */
type HealthCheckFunction = () => Promise<boolean> | boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  monitoringPeriod: 10000, // 10 seconds
  halfOpenMaxCalls: 3,
  enableAdaptiveThreshold: false,
  adaptiveThresholdFactor: 1.5,
  enableMetrics: true,
  metricsWindowSize: 100,
  slowCallThreshold: 50, // 50% slow calls
  slowCallDurationThreshold: 1000, // 1 second
  minimumThroughput: 10 // minimum calls per monitoring period
};



// ============================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================================================

/**
 * Advanced Circuit Breaker implementation
 */
export class CircuitBreaker implements ICircuitBreaker {
  private readonly config: CircuitBreakerConfig;
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenCalls = 0;
  private readonly executionHistory: ExecutionResult[] = [];
  private readonly stateHistory: StateTransition[] = [];
  private readonly responseTimes: number[] = [];
  private totalCalls = 0;
  private successfulCalls = 0;
  private failedCalls = 0;
  private slowCalls = 0;
  private rejectedCalls = 0;
  private readonly createdAt = nowMs();
  private healthCheckFunction?: HealthCheckFunction;
  private monitoringTimer?: NodeJS.Timeout | undefined;
  private isDestroyed = false;
  private readonly stateLock = new Set<string>();
  private lastStateChange = 0;

  constructor(
    private readonly name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enableMetrics) {
      this.startMonitoring();
    }
  }

  /**
   * Check if execution can proceed
   */
  public canExecute(): boolean {
    if (this.isDestroyed) {
      return false;
    }

    // Prevent race conditions during state transitions
    const currentState = this.state;
    
    switch (currentState) {
      case 'CLOSED':
        return true;
      
      case 'OPEN':
        const shouldReset = this.shouldAttemptReset();
        if (shouldReset && !this.stateLock.has('transition')) {
          // Attempt transition to HALF_OPEN
          this.transitionTo('HALF_OPEN', 'Recovery timeout reached');
        }
        return shouldReset;
      
      case 'HALF_OPEN':
        return this.halfOpenCalls < this.config.halfOpenMaxCalls;
      
      default:
        return false;
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  public async execute<T>(
    fn: () => Promise<T> | T,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    if (this.isDestroyed) {
      throw new PulsorCircuitBreakerError(
        this.name,
        this.failureCount,
        this.config.failureThreshold,
        { context: { state: 'DESTROYED', name: this.name } }
      );
    }

    if (!this.canExecute()) {
      this.rejectedCalls++;
      
      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          throw new PulsorCircuitBreakerError(
            this.name,
            this.failureCount,
            this.config.failureThreshold,
            { 
              context: { 
                state: this.state, 
                name: this.name,
                fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
              } 
            }
          );
        }
      }
      
      throw new PulsorCircuitBreakerError(
        this.name,
        this.failureCount,
        this.config.failureThreshold,
        { context: { state: this.state, name: this.name } }
      );
    }

    const startTime = nowMs();
    const initialState = this.state;
    
    // Atomic increment of counters
    this.totalCalls++;
    
    if (initialState === 'HALF_OPEN') {
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      const duration = nowMs() - startTime;
      
      this.onSuccess(duration);
      return result;
    } catch (error) {
      const duration = nowMs() - startTime;
      
      // Only record failure if we're still in a valid state
      if (!this.isDestroyed) {
        this.recordFailure(error as Error, duration);
      }
      throw error;
    }
  }

  /**
   * Record a successful execution
   */
  public onSuccess(duration?: number): void {
    if (this.isDestroyed) {
      return;
    }

    const executionDuration = duration ?? 0;
    const timestamp = nowMs();
    const currentState = this.state;
    
    // Atomic updates
    this.successfulCalls++;
    
    // Check for slow calls
    if (executionDuration > this.config.slowCallDurationThreshold) {
      this.slowCalls++;
    }
    
    // Record execution result
    if (this.config.enableMetrics) {
      this.recordExecution({
        success: true,
        duration: executionDuration,
        timestamp
      });
    }

    // Handle state transitions with race condition protection
    switch (currentState) {
      case 'HALF_OPEN':
        if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
          // Prevent multiple transitions
          if (!this.stateLock.has('transition') && this.state === 'HALF_OPEN') {
            this.transitionTo('CLOSED', 'Half-open test successful');
          }
        }
        break;
      
      case 'CLOSED':
        // Reset failure count on success (atomic operation)
        if (this.failureCount > 0) {
          this.failureCount = 0;
        }
        break;
    }
  }

  /**
   * Record a failed execution (interface implementation)
   */
  public onFailure(): void {
    this.recordFailure();
  }

  /**
   * Record a failed execution with details
   */
  public recordFailure(error?: Error, duration?: number): void {
    if (this.isDestroyed) {
      return;
    }

    const executionDuration = duration ?? 0;
    const timestamp = nowMs();
    const currentState = this.state;
    
    // Atomic updates
    this.failedCalls++;
    this.failureCount++;
    this.lastFailureTime = timestamp;
    
    // Check for slow calls
    if (executionDuration > this.config.slowCallDurationThreshold) {
      this.slowCalls++;
    }
    
    // Record execution result
    if (this.config.enableMetrics) {
      const executionResult: ExecutionResult = {
        success: false,
        duration: executionDuration,
        timestamp,
        ...(error && { error })
      };
      this.recordExecution(executionResult);
    }

    // Handle state transitions with race condition protection
    switch (currentState) {
      case 'CLOSED':
        if (this.shouldOpen() && !this.stateLock.has('transition') && this.state === 'CLOSED') {
          this.transitionTo('OPEN', `Failure threshold exceeded: ${this.failureCount}`);
        }
        break;
      
      case 'HALF_OPEN':
        if (!this.stateLock.has('transition') && this.state === 'HALF_OPEN') {
          this.transitionTo('OPEN', 'Failure during half-open test');
        }
        break;
    }
  }

  /**
   * Get current state
   */
  public getState(): CircuitBreakerState {
    return this.state;
  }
  
  /**
   * Get current status
   */
  public getStatus(): CircuitBreakerStatus {
    return {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold,
      nextAttempt: this.state === 'OPEN' ? this.lastFailureTime + this.config.recoveryTimeout : 0
    };
  }

  /**
   * Get circuit breaker name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): CircuitBreakerMetrics {
    if (!this.config.enableMetrics) {
      throw new Error('Metrics are disabled');
    }

    const now = nowMs();
    const uptime = now - this.createdAt;
    const throughput = this.totalCalls > 0 ? (this.totalCalls / (uptime / 1000)) : 0;
    
    const failureRate = this.totalCalls > 0 
      ? (this.failedCalls / this.totalCalls) * 100 
      : 0;
    
    const slowCallRate = this.totalCalls > 0 
      ? (this.slowCalls / this.totalCalls) * 100 
      : 0;
    
    const averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;
    
    const p95ResponseTime = calculatePercentile(this.responseTimes, 95);
    const p99ResponseTime = calculatePercentile(this.responseTimes, 99);

    return {
      totalCalls: this.totalCalls,
      successfulCalls: this.successfulCalls,
      failedCalls: this.failedCalls,
      slowCalls: this.slowCalls,
      rejectedCalls: this.rejectedCalls,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      failureRate,
      slowCallRate,
      throughput,
      uptime
    };
  }

  /**
   * Get state transition history
   */
  public getStateHistory(): readonly StateTransition[] {
    return [...this.stateHistory];
  }

  /**
   * Get execution history
   */
  public getExecutionHistory(limit?: number): readonly ExecutionResult[] {
    const history = [...this.executionHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Reset circuit breaker to initial state
   */
  public reset(): void {
    if (this.isDestroyed) {
      return;
    }

    this.transitionTo('CLOSED', 'Manual reset');
    this.failureCount = 0;
    this.halfOpenCalls = 0;
    this.lastFailureTime = 0;
  }

  /**
   * Force circuit breaker to open state
   */
  public forceOpen(reason: string = 'Manual force open'): void {
    if (this.isDestroyed) {
      return;
    }

    this.transitionTo('OPEN', reason);
  }

  /**
   * Force circuit breaker to closed state
   */
  public forceClosed(reason: string = 'Manual force closed'): void {
    if (this.isDestroyed) {
      return;
    }

    this.transitionTo('CLOSED', reason);
    this.failureCount = 0;
    this.halfOpenCalls = 0;
  }

  /**
   * Set health check function
   */
  public setHealthCheck(healthCheck: HealthCheckFunction): void {
    this.healthCheckFunction = healthCheck;
  }

  /**
   * Perform health check
   */
  public async performHealthCheck(): Promise<boolean> {
    if (!this.healthCheckFunction) {
      return true;
    }

    try {
      return await this.healthCheckFunction();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get configuration
   */
  public getConfig(): Readonly<CircuitBreakerConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration (limited properties)
   */
  public updateConfig(updates: Partial<Pick<CircuitBreakerConfig, 
    'failureThreshold' | 'recoveryTimeout' | 'halfOpenMaxCalls' | 'slowCallDurationThreshold'
  >>): void {
    Object.assign(this.config as any, updates);
  }

  /**
   * Clear metrics and history
   */
  public clearMetrics(): void {
    this.executionHistory.length = 0;
    this.responseTimes.length = 0;
    this.totalCalls = 0;
    this.successfulCalls = 0;
    this.failedCalls = 0;
    this.slowCalls = 0;
    this.rejectedCalls = 0;
  }

  /**
   * Destroy circuit breaker
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    // Prevent any state transitions during destruction
    this.stateLock.add('destroying');
    this.isDestroyed = true;
    
    // Clean up monitoring timer
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
    
    // Clear all data structures to prevent memory leaks
    this.executionHistory.length = 0;
    this.stateHistory.length = 0;
    this.responseTimes.length = 0;
    this.stateLock.clear();
    
    // Reset counters
    this.totalCalls = 0;
    this.successfulCalls = 0;
    this.failedCalls = 0;
    this.slowCalls = 0;
    this.rejectedCalls = 0;
    this.failureCount = 0;
    this.halfOpenCalls = 0;
  }

  /**
   * Check if circuit breaker is destroyed
   */
  public isDestroyed_(): boolean {
    return this.isDestroyed;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Check if circuit breaker should open
   */
  private shouldOpen(): boolean {
    // Check basic failure threshold
    if (this.failureCount >= this.config.failureThreshold) {
      return true;
    }

    // Check adaptive threshold if enabled
    if (this.config.enableAdaptiveThreshold && this.config.enableMetrics) {
      const metrics = this.getMetrics();
      
      // Check if we have minimum throughput
      if (metrics.totalCalls < this.config.minimumThroughput) {
        return false;
      }
      
      // Check failure rate
      const adaptiveThreshold = this.config.failureThreshold * this.config.adaptiveThresholdFactor;
      if (metrics.failureRate > adaptiveThreshold) {
        return true;
      }
      
      // Check slow call rate
      if (metrics.slowCallRate > this.config.slowCallThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if circuit breaker should attempt reset
   */
  private shouldAttemptReset(): boolean {
    const timeSinceLastFailure = nowMs() - this.lastFailureTime;
    return timeSinceLastFailure >= this.config.recoveryTimeout;
  }

  /**
   * Transition to new state with race condition protection
   */
  private transitionTo(newState: CircuitBreakerState, reason: string): void {
    if (this.isDestroyed || this.state === newState) {
      return;
    }

    // Prevent concurrent state transitions
    if (this.stateLock.has('transition')) {
      return;
    }
    
    this.stateLock.add('transition');
    
    try {
      const oldState = this.state;
      const now = nowMs();
      
      // Prevent rapid state changes
      if (now - this.lastStateChange < 100) { // 100ms minimum between transitions
        return;
      }
      
      this.lastStateChange = now;
      this.state = newState;
      
      // Reset half-open calls when transitioning
      if (newState !== 'HALF_OPEN') {
        this.halfOpenCalls = 0;
      }
      
      // Special handling for OPEN -> CLOSED transitions
      if (oldState === 'OPEN' && newState === 'CLOSED') {
        this.state = 'HALF_OPEN';
        newState = 'HALF_OPEN';
        this.halfOpenCalls = 0;
      }

      // Record state transition
      const transition: StateTransition = {
        from: oldState,
        to: newState,
        timestamp: now,
        reason,
        ...(this.config.enableMetrics && !this.isDestroyed && { metrics: this.getMetrics() })
      };
      
      this.stateHistory.push(transition);
      
      // Keep state history size manageable
      if (this.stateHistory.length > 100) {
        this.stateHistory.splice(0, this.stateHistory.length - 100);
      }
    } finally {
      // Always release the lock
      this.stateLock.delete('transition');
    }
  }

  /**
   * Record execution result
   */
  private recordExecution(result: ExecutionResult): void {
    this.executionHistory.push(result);
    this.responseTimes.push(result.duration);
    
    // Maintain window size
    if (this.executionHistory.length > this.config.metricsWindowSize) {
      this.executionHistory.splice(0, this.executionHistory.length - this.config.metricsWindowSize);
    }
    
    if (this.responseTimes.length > this.config.metricsWindowSize) {
      this.responseTimes.splice(0, this.responseTimes.length - this.config.metricsWindowSize);
    }
  }

  /**
   * Start monitoring for adaptive behavior
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.performPeriodicCheck();
    }, this.config.monitoringPeriod);
  }

  /**
   * Perform periodic health and performance checks
   */
  private async performPeriodicCheck(): Promise<void> {
    if (this.isDestroyed || this.stateLock.has('destroying')) {
      return;
    }

    // Capture current state to prevent race conditions
    const currentState = this.state;
    
    // Perform health check if available and in OPEN state
    if (this.healthCheckFunction && currentState === 'OPEN') {
      try {
        const isHealthy = await this.performHealthCheck();
        if (isHealthy && this.shouldAttemptReset() && this.state === 'OPEN') {
          this.transitionTo('HALF_OPEN', 'Health check passed');
        }
      } catch (error) {
        // Health check failed, remain in current state
        // Log error for debugging but don't propagate
        if (error instanceof Error) {
          console.warn(`Health check failed for circuit breaker '${this.name}':`, error.message);
        }
      }
    }

    // Check for adaptive threshold adjustments
    if (this.config.enableAdaptiveThreshold && currentState === 'CLOSED') {
      try {
        const metrics = this.getMetrics();
        
        if (metrics.totalCalls >= this.config.minimumThroughput) {
          if (metrics.slowCallRate > this.config.slowCallThreshold && this.state === 'CLOSED') {
            this.transitionTo('OPEN', `High slow call rate: ${metrics.slowCallRate.toFixed(2)}%`);
          }
        }
      } catch (error) {
        // Metrics calculation failed, skip this check
        console.warn(`Metrics calculation failed for circuit breaker '${this.name}':`, error);
      }
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new CircuitBreaker instance
 */
export function createCircuitBreaker(
  name: string,
  config: Partial<CircuitBreakerConfig> = {}
): CircuitBreaker {
  return new CircuitBreaker(name, config);
}

/**
 * Create a fast-fail circuit breaker
 */
export function createFastFailCircuitBreaker(name: string): CircuitBreaker {
  return new CircuitBreaker(name, {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    halfOpenMaxCalls: 1,
    enableAdaptiveThreshold: false
  });
}

/**
 * Create an adaptive circuit breaker
 */
export function createAdaptiveCircuitBreaker(name: string): CircuitBreaker {
  return new CircuitBreaker(name, {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    halfOpenMaxCalls: 3,
    enableAdaptiveThreshold: true,
    adaptiveThresholdFactor: 1.5,
    slowCallThreshold: 50,
    slowCallDurationThreshold: 2000,
    minimumThroughput: 20
  });
}

/**
 * Create a circuit breaker for testing
 */
export function createTestCircuitBreaker(name: string = 'test'): CircuitBreaker {
  return new CircuitBreaker(name, {
    failureThreshold: 2,
    recoveryTimeout: 1000,
    halfOpenMaxCalls: 1,
    enableMetrics: true,
    metricsWindowSize: 10,
    monitoringPeriod: 100
  });
}