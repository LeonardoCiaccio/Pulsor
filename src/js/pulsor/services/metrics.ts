/**
 * Advanced metrics service for the Pulsor framework
 * @fileoverview Comprehensive metrics collection, aggregation, and reporting
 * @version 6.0.0
 * @author Pulsor Team
 */

import type {
  IMetricsService
} from '../interfaces/index.js';
import type {
  PulserAlias,
  ExecutionId,
  Timestamp,
  PulserMetrics,
  GlobalMetrics,
  AdvancedMetrics,
  MemoryUsage
} from '../types/index.js';
import { nowMs, calculatePercentile, formatDuration, generateExecutionId } from '../core/utils.js';
import { globalLogger } from '../core/logger.js';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

/**
 * Configuration for metrics service
 */
export interface MetricsConfig {
  /** Enable metrics collection */
  enabled: boolean;
  /** Maximum number of execution records to keep */
  maxExecutions: number;
  /** Maximum number of error records to keep */
  maxErrors: number;
  /** Metrics aggregation interval in milliseconds */
  aggregationInterval: number;
  /** Enable memory usage tracking */
  trackMemory: boolean;
  /** Enable performance percentiles calculation */
  calculatePercentiles: boolean;
  /** Percentiles to calculate */
  percentiles: number[];
  /** Enable detailed timing breakdown */
  detailedTiming: boolean;
  /** Maximum age of metrics data in milliseconds */
  maxAge: number;
}

/**
 * Execution record for detailed tracking
 */
export interface ExecutionRecord {
  readonly executionId: ExecutionId;
  readonly alias: PulserAlias;
  readonly startTime: Timestamp;
  readonly endTime: Timestamp;
  readonly duration: number;
  readonly success: boolean;
  readonly error?: Error;
  readonly memoryBefore?: MemoryUsage;
  readonly memoryAfter?: MemoryUsage;
  readonly args?: readonly unknown[];
  readonly result?: unknown;
  readonly timing?: {
    readonly preparation: number;
    readonly execution: number;
    readonly cleanup: number;
  };
}

/**
 * Error record for tracking failures
 */
export interface ErrorRecord {
  readonly timestamp: Timestamp;
  readonly alias: PulserAlias;
  readonly executionId: ExecutionId;
  readonly error: Error;
  readonly context?: Record<string, unknown>;
}

/**
 * Aggregated metrics for a specific time window
 */
export interface AggregatedMetrics {
  readonly windowStart: Timestamp;
  readonly windowEnd: Timestamp;
  readonly totalExecutions: number;
  readonly successfulExecutions: number;
  readonly failedExecutions: number;
  readonly averageDuration: number;
  readonly minDuration: number;
  readonly maxDuration: number;
  readonly percentiles: Record<number, number>;
  readonly throughput: number; // executions per second
  readonly errorRate: number; // percentage
}

/**
 * Performance trend data
 */
export interface PerformanceTrend {
  readonly alias: PulserAlias;
  readonly trend: 'improving' | 'degrading' | 'stable';
  readonly changePercentage: number;
  readonly confidence: number;
  readonly dataPoints: number;
}

// ============================================================================
// METRICS SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Advanced metrics service implementation
 */
export class MetricsService implements IMetricsService {
  private readonly config: MetricsConfig;
  private readonly executions = new Map<PulserAlias, ExecutionRecord[]>();
  private readonly errors = new Map<PulserAlias, ErrorRecord[]>();
  private readonly aggregatedMetrics = new Map<string, AggregatedMetrics>();
  private readonly performanceTrends = new Map<PulserAlias, PerformanceTrend>();
  private aggregationTimer?: NodeJS.Timeout | undefined;
  private cleanupTimer?: NodeJS.Timeout | undefined;

  
  constructor(config: Partial<MetricsConfig> = {}) {
    this.config = {
      enabled: true,
      maxExecutions: 10000,
      maxErrors: 1000,
      aggregationInterval: 60000, // 1 minute
      trackMemory: false,
      calculatePercentiles: true,
      percentiles: [50, 75, 90, 95, 99],
      detailedTiming: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };
    

    
    if (this.config.enabled) {
      this.startAggregation();
      this.startCleanup();
    }
  }
  
  // ========================================================================
  // PUBLIC API
  // ========================================================================
  
  /**
   * Record a Pulser execution
   */
  public recordExecution(
    alias: PulserAlias,
    executionId: ExecutionId,
    startTime: Timestamp,
    endTime: Timestamp,
    success: boolean,
    error?: Error,
    options?: {
      memoryBefore?: MemoryUsage;
      memoryAfter?: MemoryUsage;
      args?: readonly unknown[];
      result?: unknown;
      timing?: {
        preparation: number;
        execution: number;
        cleanup: number;
      };
    }
  ): void {
    if (!this.config.enabled) return;
    
    const record: ExecutionRecord = {
      executionId,
      alias,
      startTime,
      endTime,
      duration: endTime - startTime,
      success,
      ...(error && { error }),
      ...options
    };
    
    // Store execution record
    if (!this.executions.has(alias)) {
      this.executions.set(alias, []);
    }
    
    const records = this.executions.get(alias)!;
    records.push(record);
    
    // Limit records to prevent memory leaks
    if (records.length > this.config.maxExecutions) {
      records.shift();
    }
    
    // Record error if execution failed
    if (!success && error) {
      this.recordError(alias, executionId, error);
    }
    
    globalLogger.debug(`Recorded execution for ${alias}: ${success ? 'success' : 'failure'} (${record.duration}ms)`);
  }
  
  /**
   * Record an error
   */
  public recordError(
    alias: PulserAlias,
    executionId: ExecutionId,
    error: Error,
    context?: Record<string, unknown>
  ): void {
    if (!this.config.enabled) return;
    
    const errorRecord: ErrorRecord = {
      timestamp: nowMs(),
      alias,
      executionId,
      error,
      ...(context && { context })
    };
    
    if (!this.errors.has(alias)) {
      this.errors.set(alias, []);
    }
    
    const errors = this.errors.get(alias)!;
    errors.push(errorRecord);
    
    // Limit error records
    if (errors.length > this.config.maxErrors) {
      errors.shift();
    }
    
    globalLogger.debug(`Recorded error for ${alias}: ${error.message}`);
  }
  
  /**
   * Get metrics for a specific Pulser
   */
  public getPulserMetrics(alias: PulserAlias): PulserMetrics | null {
    const executions = this.executions.get(alias) || [];
    
    if (executions.length === 0) {
      return {
        pulseCount: 0,
        lastPulsedAt: null,
        totalDuration: 0,
        avgDuration: 0
      };
    }

    const durations = executions.map(e => e.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    
    return {
      pulseCount: executions.length,
      lastPulsedAt: executions[executions.length - 1]?.endTime || null,
      totalDuration,
      avgDuration: totalDuration / executions.length
    };
  }
  
  /**
   * Get global metrics across all Pulsers
   */
  public getGlobalMetrics(): GlobalMetrics {
    const allExecutions: ExecutionRecord[] = [];
    const allErrors: ErrorRecord[] = [];
    
    for (const executions of this.executions.values()) {
      allExecutions.push(...executions);
    }
    
    for (const errors of this.errors.values()) {
      allErrors.push(...errors);
    }
    
    if (allExecutions.length === 0) {
      return {
        totalPulsers: 0,
        totalPulses: 0,
        averageDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        patternCallbackCount: 0,
        activeExecutions: 0,
        cacheStats: {
          size: 0,
          hits: 0,
          misses: 0,
          hitRatio: 0
        },
        memoryUsage: this.getCurrentMemoryUsage()
      };
    }
    
    const durations = allExecutions.map(e => e.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);
    
    return {
      totalPulsers: this.executions.size,
      totalPulses: allExecutions.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95Duration: calculatePercentile(sortedDurations, 95),
      p99Duration: calculatePercentile(sortedDurations, 99),
      patternCallbackCount: 0,
      activeExecutions: 0,
      cacheStats: {
        size: 0,
        hits: 0,
        misses: 0,
        hitRatio: 0
      },
      memoryUsage: this.getCurrentMemoryUsage()
    };
  }
  
  /**
   * Get advanced metrics with detailed analysis
   */
  public getAdvancedMetrics(alias?: PulserAlias): AdvancedMetrics {
    const global = this.getGlobalMetrics();
    const executions = alias 
      ? (this.executions.get(alias) || [])
      : Array.from(this.executions.values()).flat();
    
    const durations = executions.map(e => e.duration);
    const percentiles = durations.length > 0 ? {
      p50: this.calculatePercentile(durations, 50),
      p90: this.calculatePercentile(durations, 90),
      p99: this.calculatePercentile(durations, 99)
    } : null;
    
    const trend = durations.length > 1 ? this.calculateTrend(durations) : null;
    
    return {
      ...global,
      percentiles,
      trend
    };
  }
  
  /**
   * Get aggregated metrics for a time window
   */
  public getAggregatedMetrics(
    startTime: Timestamp,
    endTime: Timestamp,
    alias?: PulserAlias
  ): AggregatedMetrics | null {
    const key = `${startTime}-${endTime}-${alias || 'global'}`;
    return this.aggregatedMetrics.get(key) || null;
  }
  
  /**
   * Export metrics data
   */
  public exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: nowMs(),
      config: this.config,
      global: this.getGlobalMetrics(),
      pulsers: {} as Record<PulserAlias, PulserMetrics>,
      executions: {} as Record<PulserAlias, ExecutionRecord[]>,
      errors: {} as Record<PulserAlias, ErrorRecord[]>
    };
    
    for (const alias of this.executions.keys()) {
      const metrics = this.getPulserMetrics(alias);
      if (metrics) {
        data.pulsers[alias] = metrics;
      }
      data.executions[alias] = this.executions.get(alias) || [];
      data.errors[alias] = this.errors.get(alias) || [];
    }
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      return this.convertToCSV(data);
    }
  }
  
  /**
   * Record a performance metric
   */
  public recordPerformance(alias: PulserAlias, duration: number): void {
    this.recordExecution(
      generateExecutionId(),
      alias,
      nowMs() - duration,
      nowMs(),
      true
    );
  }

  /**
   * Configure metrics
   */
  public configure(options: { windowSize?: number }): void {
    if (options.windowSize) {
      this.config.maxExecutions = options.windowSize;
    }
  }

  /**
   * Clear metrics for a specific Pulser
   */
  public clearPulserMetrics(alias: PulserAlias): void {
    this.executions.delete(alias);
    this.errors.delete(alias);
    globalLogger.debug(`Cleared metrics for ${alias}`);
  }

  /**
   * Clear all metrics
   */
  public clearAllMetrics(): void {
    this.executions.clear();
    this.errors.clear();
    this.aggregatedMetrics.clear();
    globalLogger.debug('Cleared all metrics');
  }

  /**
   * Clear all metrics data
   */
  public clearMetrics(alias?: PulserAlias): void {
    if (alias) {
      this.executions.delete(alias);
      this.errors.delete(alias);
      this.performanceTrends.delete(alias);
      globalLogger.info(`Cleared metrics for ${alias}`);
    } else {
      this.executions.clear();
      this.errors.clear();
      this.aggregatedMetrics.clear();
      this.performanceTrends.clear();
      globalLogger.info('Cleared all metrics');
    }
  }
  
  /**
   * Get metrics summary report
   */
  public getReport(): string {
    const global = this.getGlobalMetrics();
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('PULSOR METRICS REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    
    lines.push('GLOBAL STATISTICS:');
    lines.push(`  Total Pulsers: ${global.totalPulsers}`);
    lines.push(`  Total Pulses: ${global.totalPulses}`);
    lines.push(`  Average Duration: ${formatDuration(global.averageDuration)}`);
    lines.push(`  P95 Duration: ${formatDuration(global.p95Duration)}`);
    lines.push(`  P99 Duration: ${formatDuration(global.p99Duration)}`);
    lines.push(`  Total Pulsers: ${global.totalPulsers}`);
    lines.push('');
    
    lines.push('PULSER BREAKDOWN:');
    for (const alias of this.executions.keys()) {
      const metrics = this.getPulserMetrics(alias);
      if (metrics) {
        lines.push(`  ${alias}:`);
        lines.push(`    Pulse Count: ${metrics.pulseCount}`);
        lines.push(`    Total Duration: ${formatDuration(metrics.totalDuration)}`);
        lines.push(`    Avg Duration: ${formatDuration(metrics.avgDuration)}`);
        lines.push(`    Last Pulsed: ${metrics.lastPulsedAt ? new Date(metrics.lastPulsedAt).toISOString() : 'Never'}`);
      }
    }
    
    lines.push('');
    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }
  
  /**
   * Destroy the metrics service
   */
  public destroy(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = undefined;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    this.clearMetrics();
    globalLogger.info('Metrics service destroyed');
  }
  
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
      return sorted[Math.floor(index)] || 0;
    }
    
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    const lowerValue = sorted[lower] || 0;
    const upperValue = sorted[upper] || 0;
    
    return lowerValue * (1 - weight) + upperValue * weight;
  }
  
  private calculateTrend(durations: number[]): number {
    if (durations.length < 2) return 0;
    
    // Simple linear trend calculation
    const n = durations.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = durations;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * (y[i] || 0), 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return 0;
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    return slope;
  }
  
  private startAggregation(): void {
    this.aggregationTimer = setInterval(() => {
      this.aggregateMetrics();
    }, this.config.aggregationInterval);
  }
  
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, this.config.aggregationInterval * 10); // Cleanup every 10 aggregation intervals
  }
  
  private aggregateMetrics(): void {
    const now = nowMs();
    const windowStart = now - this.config.aggregationInterval;
    
    for (const [alias, executions] of this.executions) {
      const windowExecutions = executions.filter(
        e => e.endTime >= windowStart && e.endTime <= now
      );
      
      if (windowExecutions.length > 0) {
        const aggregated = this.calculateAggregatedMetrics(
          windowExecutions,
          windowStart,
          now
        );
        
        const key = `${windowStart}-${now}-${alias}`;
        this.aggregatedMetrics.set(key, aggregated);
      }
    }
    
    // Update performance trends
    this.updatePerformanceTrends();
  }
  
  private calculateAggregatedMetrics(
    executions: ExecutionRecord[],
    windowStart: Timestamp,
    windowEnd: Timestamp
  ): AggregatedMetrics {
    const successful = executions.filter(e => e.success);
    const failed = executions.filter(e => !e.success);
    const durations = executions.map(e => e.duration);
    
    const percentiles: Record<number, number> = {};
    if (this.config.calculatePercentiles) {
      for (const p of this.config.percentiles) {
        percentiles[p] = calculatePercentile(durations, p);
      }
    }
    
    const windowDuration = (windowEnd - windowStart) / 1000; // seconds
    
    return {
      windowStart,
      windowEnd,
      totalExecutions: executions.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      percentiles,
      throughput: executions.length / windowDuration,
      errorRate: (failed.length / executions.length) * 100
    };
  }
  
  private updatePerformanceTrends(): void {
    for (const alias of this.executions.keys()) {
      const trend = this.calculatePerformanceTrend(alias);
      if (trend) {
        this.performanceTrends.set(alias, trend);
      }
    }
  }
  
  private calculatePerformanceTrend(alias: PulserAlias): PerformanceTrend | null {
    const executions = this.executions.get(alias) || [];
    if (executions.length < 10) return null; // Need sufficient data
    
    const recentExecutions = executions.slice(-20); // Last 20 executions
    const olderExecutions = executions.slice(-40, -20); // Previous 20 executions
    
    if (olderExecutions.length === 0) return null;
    
    const recentAvg = recentExecutions.reduce((sum, e) => sum + e.duration, 0) / recentExecutions.length;
    const olderAvg = olderExecutions.reduce((sum, e) => sum + e.duration, 0) / olderExecutions.length;
    
    const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    let trend: 'improving' | 'degrading' | 'stable';
    if (Math.abs(changePercentage) < 5) {
      trend = 'stable';
    } else if (changePercentage < 0) {
      trend = 'improving'; // Lower duration is better
    } else {
      trend = 'degrading';
    }
    
    return {
      alias,
      trend,
      changePercentage: Math.abs(changePercentage),
      confidence: Math.min(recentExecutions.length / 20, 1),
      dataPoints: recentExecutions.length
    };
  }
  

  
  private getCurrentMemoryUsage(): MemoryUsage {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
        return {
          pulsers: usage.heapUsed || 0,
          callbacks: usage.external || 0,
          patterns: usage.arrayBuffers || 0,
          total: usage.rss || 0
        };
    }
    
    return {
        pulsers: 0,
        callbacks: 0,
        patterns: 0,
        total: 0
      };
  }
  
  private cleanupOldData(): void {
    const cutoff = nowMs() - this.config.maxAge;
    
    // Clean old executions
    for (const [alias, executions] of this.executions) {
      const filtered = executions.filter(e => e.endTime > cutoff);
      if (filtered.length !== executions.length) {
        this.executions.set(alias, filtered);
      }
    }
    
    // Clean old errors
    for (const [alias, errors] of this.errors) {
      const filtered = errors.filter(e => e.timestamp > cutoff);
      if (filtered.length !== errors.length) {
        this.errors.set(alias, filtered);
      }
    }
    
    // Clean old aggregated metrics
    for (const [key, metrics] of this.aggregatedMetrics) {
      if (metrics.windowEnd < cutoff) {
        this.aggregatedMetrics.delete(key);
      }
    }
  }
  
  private convertToCSV(data: any): string {
    // Simplified CSV conversion - would need more sophisticated implementation
    const lines: string[] = [];
    lines.push('timestamp,alias,pulse_count,total_duration,avg_duration,last_pulsed_at');
    
    for (const [alias, metrics] of Object.entries(data.pulsers)) {
      const m = metrics as PulserMetrics;
      if (m) {
        lines.push([
          data.timestamp,
          alias,
          m.pulseCount,
          m.totalDuration.toFixed(2),
          m.avgDuration.toFixed(2),
          m.lastPulsedAt || 'null'
        ].join(','));
      }
    }
    
    return lines.join('\n');
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default metrics service
 */
export function createMetricsService(config?: Partial<MetricsConfig>): MetricsService {
  return new MetricsService(config);
}

/**
 * Create a high-performance metrics service with minimal overhead
 */
export function createHighPerformanceMetricsService(): MetricsService {
  return new MetricsService({
    enabled: true,
    maxExecutions: 1000,
    maxErrors: 100,
    aggregationInterval: 300000, // 5 minutes
    trackMemory: false,
    calculatePercentiles: false,
    detailedTiming: false,
    maxAge: 60 * 60 * 1000 // 1 hour
  });
}

/**
 * Create a detailed metrics service for development/debugging
 */
export function createDetailedMetricsService(): MetricsService {
  return new MetricsService({
    enabled: true,
    maxExecutions: 50000,
    maxErrors: 5000,
    aggregationInterval: 30000, // 30 seconds
    trackMemory: true,
    calculatePercentiles: true,
    percentiles: [25, 50, 75, 90, 95, 99, 99.9],
    detailedTiming: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

/**
 * Create a test metrics service
 */
export function createTestMetricsService(): MetricsService {
  return new MetricsService({
    enabled: true,
    maxExecutions: 100,
    maxErrors: 50,
    aggregationInterval: 1000, // 1 second
    trackMemory: false,
    calculatePercentiles: true,
    detailedTiming: false,
    maxAge: 60000 // 1 minute
  });
}

/**
 * Global metrics service instance
 */
export const globalMetricsService = createMetricsService();