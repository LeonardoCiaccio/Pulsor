/**
 * Advanced memory management service for the Pulsor framework
 * @fileoverview Memory monitoring, pressure detection, and optimization
 * @version 6.0.0
 * @author Pulsor Team
 */

import type {
  IMemoryService
} from '../interfaces/index.js';
import type {
  PulserAlias,
  Timestamp,
  HealthStatus
} from '../types/index.js';
import { nowMs } from '../core/utils.js';
import { EventEmitter } from '../core/event-emitter.js';
import { globalLogger } from '../core/logger.js';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

/**
 * Configuration for memory service
 */
export interface MemoryConfig {
  /** Enable memory monitoring */
  enabled: boolean;
  /** Memory monitoring interval in milliseconds */
  monitoringInterval: number;
  /** Memory pressure thresholds */
  thresholds: {
    /** Low memory warning threshold (percentage) */
    warning: number;
    /** Critical memory threshold (percentage) */
    critical: number;
    /** Emergency memory threshold (percentage) */
    emergency: number;
  };
  /** Enable automatic garbage collection suggestions */
  autoGC: boolean;
  /** Maximum memory history entries to keep */
  maxHistoryEntries: number;
  /** Enable memory leak detection */
  leakDetection: boolean;
  /** Memory leak detection sensitivity */
  leakThreshold: number;
  /** Enable memory optimization */
  optimization: boolean;
}

/**
 * System memory usage (different from framework MemoryUsage)
 */
export interface SystemMemoryUsage {
  readonly heapUsed: number;
  readonly heapTotal: number;
  readonly external: number;
  readonly rss: number;
}

/**
 * System memory pressure (different from framework MemoryPressure)
 */
export interface SystemMemoryPressure {
  readonly level: 'normal' | 'warning' | 'critical' | 'emergency';
  readonly severity: number;
  readonly usagePercentage: number;
  readonly availableMemory: number;
  readonly recommendation: string;
}

/**
 * Memory health report
 */
export interface MemoryHealthReport {
  readonly status: HealthStatus;
  readonly timestamp: number;
  readonly details: {
    readonly memoryPressure: SystemMemoryPressure;
    readonly memoryLeak: MemoryLeak;
    readonly issues: readonly string[];
  };
}

/**
 * Memory snapshot for tracking usage over time
 */
export interface MemorySnapshot {
  readonly timestamp: Timestamp;
  readonly usage: SystemMemoryUsage;
  readonly pressure: SystemMemoryPressure;
  readonly gcInfo?: {
    readonly collections: number;
    readonly duration: number;
    readonly freed: number;
  };
  readonly processInfo?: {
    readonly pid: number;
    readonly uptime: number;
    readonly cpuUsage: number;
  };
}

/**
 * Memory leak detection result
 */
export interface MemoryLeak {
  readonly detected: boolean;
  readonly severity: 'low' | 'medium' | 'high';
  readonly growthRate: number; // bytes per second
  readonly duration: number; // milliseconds
  readonly confidence: number; // 0-1
  readonly recommendation: string;
}

/**
 * Memory optimization suggestion
 */
export interface MemoryOptimization {
  readonly type: 'gc' | 'cache_clear' | 'buffer_resize' | 'object_pool';
  readonly description: string;
  readonly estimatedSavings: number; // bytes
  readonly priority: 'low' | 'medium' | 'high';
  readonly action: () => Promise<void>;
}

/**
 * Memory allocation tracker
 */
export interface AllocationTracker {
  readonly alias: PulserAlias;
  readonly allocations: number;
  readonly deallocations: number;
  readonly netAllocations: number;
  readonly totalBytes: number;
  readonly averageSize: number;
  readonly peakUsage: number;
  readonly lastActivity: Timestamp;
}

// ============================================================================
// MEMORY SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Advanced memory management service
 */
export class MemoryService extends EventEmitter implements IMemoryService {
  private readonly memoryConfig: MemoryConfig;
  private readonly snapshots: MemorySnapshot[] = [];
  private readonly allocations = new Map<PulserAlias, AllocationTracker>();
  private monitoringTimer?: NodeJS.Timeout | undefined;
  private lastGCTime: Timestamp = 0;
  private baselineMemory: SystemMemoryUsage | null = null;
  private isMonitoring = false;
  
  constructor(config: Partial<MemoryConfig> = {}) {
    super();
    
    this.memoryConfig = {
      enabled: true,
      monitoringInterval: 5000, // 5 seconds
      thresholds: {
        warning: 70,
        critical: 85,
        emergency: 95
      },
      autoGC: false,
      maxHistoryEntries: 1000,
      leakDetection: true,
      leakThreshold: 1024 * 1024, // 1MB growth per minute
      optimization: true,
      ...config
    };
    
    if (this.memoryConfig.enabled) {
      this.startMonitoring();
    }
  }
  
  // ========================================================================
  // PUBLIC API
  // ========================================================================
  
  /**
   * Get current memory usage
   */
  public getCurrentMemoryUsage(): SystemMemoryUsage {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss
      };
    }
    
    // Browser environment fallback
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize || 0,
        heapTotal: memory.totalJSHeapSize || 0,
        external: 0,
        rss: memory.totalJSHeapSize || 0
      };
    }
    
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0
    };
  }
  
  /**
   * Get current memory pressure
   */
  public getMemoryPressure(): SystemMemoryPressure {
    const usage = this.getCurrentMemoryUsage();
    const usagePercentage = usage.heapTotal > 0 
      ? (usage.heapUsed / usage.heapTotal) * 100 
      : 0;
    
    let level: SystemMemoryPressure['level'];
    let severity: number;
    
    if (usagePercentage >= this.memoryConfig.thresholds.emergency) {
      level = 'emergency';
      severity = 1.0;
    } else if (usagePercentage >= this.memoryConfig.thresholds.critical) {
      level = 'critical';
      severity = 0.8;
    } else if (usagePercentage >= this.memoryConfig.thresholds.warning) {
      level = 'warning';
      severity = 0.5;
    } else {
      level = 'normal';
      severity = usagePercentage / 100;
    }
    
    return {
      level,
      severity,
      usagePercentage,
      availableMemory: usage.heapTotal - usage.heapUsed,
      recommendation: this.getMemoryRecommendation(level)
    };
  }
  
  /**
   * Track memory allocation for a Pulser
   */
  public trackAllocation(
    alias: PulserAlias,
    bytes: number,
    type: 'allocation' | 'deallocation' = 'allocation'
  ): void {
    if (!this.memoryConfig.enabled) return;
    
    let tracker = this.allocations.get(alias);
    if (!tracker) {
      tracker = {
        alias,
        allocations: 0,
        deallocations: 0,
        netAllocations: 0,
        totalBytes: 0,
        averageSize: 0,
        peakUsage: 0,
        lastActivity: nowMs()
      };
      this.allocations.set(alias, tracker);
    }
    
    const updatedTracker = { ...tracker };
    updatedTracker.lastActivity = nowMs();
    
    if (type === 'allocation') {
      updatedTracker.allocations++;
      updatedTracker.totalBytes += bytes;
      updatedTracker.netAllocations++;
    } else {
      updatedTracker.deallocations++;
      updatedTracker.totalBytes -= bytes;
      updatedTracker.netAllocations--;
    }
    
    updatedTracker.averageSize = updatedTracker.totalBytes / Math.max(updatedTracker.allocations, 1);
    updatedTracker.peakUsage = Math.max(updatedTracker.peakUsage, updatedTracker.totalBytes);
    
    this.allocations.set(alias, updatedTracker);
    
    globalLogger.debug(`Memory ${type} for ${alias}: ${bytes} bytes`);
  }
  
  /**
   * Get memory allocation statistics for a Pulser
   */
  public getAllocationStats(alias: PulserAlias): AllocationTracker | null {
    return this.allocations.get(alias) || null;
  }
  
  /**
   * Get all allocation statistics
   */
  public getAllAllocationStats(): ReadonlyMap<PulserAlias, AllocationTracker> {
    return new Map(this.allocations);
  }
  
  /**
   * Take a memory snapshot
   */
  public takeSnapshot(): MemorySnapshot {
    const timestamp = nowMs();
    const usage = this.getCurrentMemoryUsage();
    const pressure = this.getMemoryPressure();
    
    const gcInfo = this.getGCInfo();
    const processInfo = this.getProcessInfo();
    const snapshot: MemorySnapshot = {
      timestamp,
      usage,
      pressure,
      ...(gcInfo && { gcInfo }),
      ...(processInfo && { processInfo })
    };
    
    this.snapshots.push(snapshot);
    
    // Limit snapshot history
    if (this.snapshots.length > this.memoryConfig.maxHistoryEntries) {
      this.snapshots.shift();
    }
    
    // Set baseline if not set
    if (!this.baselineMemory) {
      this.baselineMemory = usage;
    }
    
    return snapshot;
  }
  
  /**
   * Get memory snapshots history
   */
  public getSnapshots(limit?: number): ReadonlyArray<MemorySnapshot> {
    const snapshots = [...this.snapshots];
    return limit ? snapshots.slice(-limit) : snapshots;
  }
  
  /**
   * Detect memory leaks
   */
  public detectMemoryLeaks(): MemoryLeak {
    if (this.snapshots.length < 10) {
      return {
        detected: false,
        severity: 'low',
        growthRate: 0,
        duration: 0,
        confidence: 0,
        recommendation: 'Insufficient data for leak detection'
      };
    }
    
    const recentSnapshots = this.snapshots.slice(-10);
    const newestSnapshot = recentSnapshots[recentSnapshots.length - 1];
    const oldestSnapshot = recentSnapshots[0];
    if (!newestSnapshot || !oldestSnapshot) {
      return { detected: false, severity: 'low', growthRate: 0, duration: 0, confidence: 0, recommendation: 'Insufficient data for leak detection' };
    }
    const duration = newestSnapshot.timestamp - oldestSnapshot.timestamp;
    const memoryGrowth = newestSnapshot.usage.heapUsed - oldestSnapshot.usage.heapUsed;
    const growthRate = (memoryGrowth / duration) * 1000; // bytes per second
    
    // Calculate trend confidence
    let increasingCount = 0;
    for (let i = 1; i < recentSnapshots.length; i++) {
      const current = recentSnapshots[i];
      const previous = recentSnapshots[i - 1];
      if (current && previous && current.usage.heapUsed > previous.usage.heapUsed) {
        increasingCount++;
      }
    }
    const confidence = increasingCount / (recentSnapshots.length - 1);
    
    const detected = growthRate > this.memoryConfig.leakThreshold && confidence > 0.7;
    
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (detected) {
      if (growthRate > this.memoryConfig.leakThreshold * 5) {
        severity = 'high';
      } else if (growthRate > this.memoryConfig.leakThreshold * 2) {
        severity = 'medium';
      }
    }
    
    return {
      detected,
      severity,
      growthRate,
      duration,
      confidence,
      recommendation: this.getLeakRecommendation(detected, severity)
    };
  }
  
  /**
   * Get memory optimization suggestions
   */
  public getOptimizationSuggestions(): MemoryOptimization[] {
    if (!this.memoryConfig.optimization) return [];
    
    const suggestions: MemoryOptimization[] = [];
    const pressure = this.getMemoryPressure();
    const usage = this.getCurrentMemoryUsage();
    
    // Suggest garbage collection
    if (pressure.level !== 'normal' && this.shouldSuggestGC()) {
      suggestions.push({
        type: 'gc',
        description: 'Run garbage collection to free unused memory',
        estimatedSavings: usage.heapUsed * 0.1, // Estimate 10% savings
        priority: pressure.level === 'emergency' ? 'high' : 'medium',
        action: async () => {
          await this.forceGarbageCollection();
        }
      });
    }
    
    // Suggest clearing allocation trackers for inactive Pulsers
    const inactiveAllocations = this.getInactiveAllocations();
    if (inactiveAllocations.length > 0) {
      suggestions.push({
        type: 'cache_clear',
        description: `Clear allocation tracking for ${inactiveAllocations.length} inactive Pulsers`,
        estimatedSavings: inactiveAllocations.length * 1024, // Rough estimate
        priority: 'low',
        action: async () => {
          for (const alias of inactiveAllocations) {
            this.allocations.delete(alias);
          }
        }
      });
    }
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Force garbage collection (if available)
   */
  public async forceGarbageCollection(): Promise<boolean> {
    if (typeof global !== 'undefined' && global.gc) {
      const before = this.getCurrentMemoryUsage();
      const startTime = nowMs();
      
      global.gc();
      
      const after = this.getCurrentMemoryUsage();
      const duration = nowMs() - startTime;
      const freed = before.heapUsed - after.heapUsed;
      
      this.lastGCTime = nowMs();
      
      globalLogger.info(`Garbage collection completed: freed ${freed} bytes in ${duration}ms`);
      
      this.emit('gc_completed', {
        duration,
        freedMemory: freed,
        timestamp: nowMs()
      });
      
      return true;
    }
    
    globalLogger.warn('Garbage collection not available');
    return false;
  }
  
  /**
   * Get memory health status
   */
  public getHealthStatus(): MemoryHealthReport {
    const pressure = this.getMemoryPressure();
    const leak = this.detectMemoryLeaks();
    
    let status: HealthStatus;
    const issues: string[] = [];
    
    if (pressure.level === 'emergency' || (leak.detected && leak.severity === 'high')) {
      status = 'critical';
      issues.push('Critical memory pressure or severe memory leak detected');
    } else if (pressure.level === 'critical' || (leak.detected && leak.severity === 'medium')) {
      status = 'warning';
      issues.push('High memory pressure or moderate memory leak detected');
    } else if (pressure.level === 'warning' || (leak.detected && leak.severity === 'low')) {
      status = 'warning';
      issues.push('Elevated memory usage or minor memory leak detected');
    } else {
      status = 'healthy';
    }
    
    return {
      status,
      timestamp: nowMs(),
      details: {
        memoryPressure: pressure,
        memoryLeak: leak,
        issues
      }
    };
  }
  
  /**
   * Start memory monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring || !this.memoryConfig.enabled) return;
    
    this.isMonitoring = true;
    this.monitoringTimer = setInterval(() => {
      this.performMonitoringCycle();
    }, this.memoryConfig.monitoringInterval);
    
    globalLogger.info('Memory monitoring started');
    this.emit('monitoring_started', { timestamp: nowMs() });
  }
  
  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
    
    this.isMonitoring = false;
    globalLogger.info('Memory monitoring stopped');
    this.emit('monitoring_stopped', { timestamp: nowMs() });
  }
  
  /**
   * Clear all memory data
   */
  public clearMemoryData(alias?: PulserAlias): void {
    if (alias) {
      this.allocations.delete(alias);
      globalLogger.info(`Cleared memory data for ${alias}`);
    } else {
      this.allocations.clear();
      this.snapshots.length = 0;
      this.baselineMemory = null;
      globalLogger.info('Cleared all memory data');
    }
  }
  
  /**
   * Get memory report
   */
  public getMemoryReport(): string {
    const usage = this.getCurrentMemoryUsage();
    const pressure = this.getMemoryPressure();
    const leak = this.detectMemoryLeaks();
    const health = this.getHealthStatus();
    
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('PULSOR MEMORY REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    
    lines.push('CURRENT USAGE:');
    lines.push(`  Heap Used: ${this.formatBytes(usage.heapUsed)}`);
    lines.push(`  Heap Total: ${this.formatBytes(usage.heapTotal)}`);
    lines.push(`  External: ${this.formatBytes(usage.external)}`);
    lines.push(`  RSS: ${this.formatBytes(usage.rss)}`);
    lines.push('');
    
    lines.push('MEMORY PRESSURE:');
    lines.push(`  Level: ${pressure.level.toUpperCase()}`);
    lines.push(`  Usage: ${pressure.usagePercentage.toFixed(2)}%`);
    lines.push(`  Available: ${this.formatBytes(pressure.availableMemory)}`);
    lines.push(`  Recommendation: ${pressure.recommendation}`);
    lines.push('');
    
    lines.push('LEAK DETECTION:');
    lines.push(`  Detected: ${leak.detected ? 'YES' : 'NO'}`);
    if (leak.detected) {
      lines.push(`  Severity: ${leak.severity.toUpperCase()}`);
      lines.push(`  Growth Rate: ${this.formatBytes(leak.growthRate)}/sec`);
      lines.push(`  Confidence: ${(leak.confidence * 100).toFixed(1)}%`);
    }
    lines.push(`  Recommendation: ${leak.recommendation}`);
    lines.push('');
    
    lines.push('HEALTH STATUS:');
    lines.push(`  Status: ${health.status.toUpperCase()}`);
    if (health.details.issues.length > 0) {
      lines.push('  Issues:');
      for (const issue of health.details.issues) {
        lines.push(`    - ${issue}`);
      }
    }
    lines.push('');
    
    lines.push('ALLOCATION TRACKING:');
    for (const [alias, tracker] of this.allocations) {
      lines.push(`  ${alias}:`);
      lines.push(`    Net Allocations: ${tracker.netAllocations}`);
      lines.push(`    Total Bytes: ${this.formatBytes(tracker.totalBytes)}`);
      lines.push(`    Peak Usage: ${this.formatBytes(tracker.peakUsage)}`);
      lines.push(`    Average Size: ${this.formatBytes(tracker.averageSize)}`);
    }
    
    lines.push('');
    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }
  
  /**
   * Get memory usage information
   */
  public getMemoryUsage(): {
    pulsers: number;
    callbacks: number;
    patterns: number;
    total: number;
  } {
    const allocStats = this.getAllAllocationStats();
    let pulsers = 0;
    let callbacks = 0;
    let patterns = 0;
    
    for (const [, tracker] of allocStats) {
      pulsers += tracker.totalBytes;
    }
    
    return {
      pulsers,
      callbacks,
      patterns,
      total: pulsers + callbacks + patterns
    };
  }

  /**
   * Clean up expired resources
   */
  public cleanup(): {
    pulsersRemoved: number;
    callbacksRemoved: number;
    patternsRemoved: number;
  } {
    const before = this.allocations.size;
    const cutoffTime = nowMs() - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [alias, tracker] of this.allocations) {
      if (tracker.lastActivity < cutoffTime) {
        this.allocations.delete(alias);
      }
    }
    
    const pulsersRemoved = before - this.allocations.size;
    
    return {
      pulsersRemoved,
      callbacksRemoved: 0,
      patternsRemoved: 0
    };
  }

  /**
   * Force garbage collection if available
   */
  public forceGC(): boolean {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
      return true;
    }
    return false;
  }

  /**
   * Get memory statistics
   */
  public getMemoryStats(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } | null {
    const usage = this.getCurrentMemoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    };
  }

  /**
   * Destroy the memory service
   */
  public override destroy(): void {
    this.stopMonitoring();
    this.clearMemoryData();
    this.removeAllListeners();
    globalLogger.info('Memory service destroyed');
  }
  
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  
  private performMonitoringCycle(): void {
    const snapshot = this.takeSnapshot();
    
    // Check for memory pressure changes
    if (snapshot.pressure.level !== 'normal') {
      this.emit('memory_pressure', { pressure: snapshot.pressure, timestamp: nowMs() });
      
      if (this.memoryConfig.autoGC && this.shouldSuggestGC()) {
        this.forceGarbageCollection();
      }
    }
    
    // Check for memory leaks
    if (this.memoryConfig.leakDetection) {
      const leak = this.detectMemoryLeaks();
      if (leak.detected) {
        this.emit('memory_leak_detected', { leak, timestamp: nowMs() });
      }
    }
    
    globalLogger.debug(`Memory monitoring cycle completed: ${snapshot.pressure.level} pressure`);
  }
  
  private shouldSuggestGC(): boolean {
    const timeSinceLastGC = nowMs() - this.lastGCTime;
    return timeSinceLastGC > 30000; // At least 30 seconds since last GC
  }
  
  private getInactiveAllocations(): PulserAlias[] {
    const cutoff = nowMs() - 300000; // 5 minutes
    const inactive: PulserAlias[] = [];
    
    for (const [alias, tracker] of this.allocations) {
      if (tracker.lastActivity < cutoff) {
        inactive.push(alias);
      }
    }
    
    return inactive;
  }
  
  private getMemoryRecommendation(level: SystemMemoryPressure['level']): string {
    switch (level) {
      case 'emergency':
        return 'Immediate action required: Stop non-critical operations and force garbage collection';
      case 'critical':
        return 'High memory usage detected: Consider reducing workload or optimizing memory usage';
      case 'warning':
        return 'Elevated memory usage: Monitor closely and consider optimization';
      default:
        return 'Memory usage is within normal limits';
    }
  }
  
  private getLeakRecommendation(detected: boolean, severity: 'low' | 'medium' | 'high'): string {
    if (!detected) {
      return 'No memory leak detected';
    }
    
    switch (severity) {
      case 'high':
        return 'Severe memory leak detected: Immediate investigation required';
      case 'medium':
        return 'Moderate memory leak detected: Review recent code changes and object lifecycle';
      case 'low':
        return 'Minor memory leak detected: Monitor and consider optimization';
      default:
        return 'Memory leak detected: Investigation recommended';
    }
  }
  
  private getGCInfo(): MemorySnapshot['gcInfo'] {
    // This would require access to V8 GC statistics
    // For now, return undefined as it's not easily accessible
    return undefined;
  }
  
  private getProcessInfo(): MemorySnapshot['processInfo'] {
    if (typeof process !== 'undefined') {
      return {
        pid: process.pid,
        uptime: process.uptime() * 1000,
        cpuUsage: process.cpuUsage ? process.cpuUsage().user / 1000000 : 0
      };
    }
    
    return undefined;
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default memory service
 */
export function createMemoryService(config?: Partial<MemoryConfig>): MemoryService {
  return new MemoryService(config);
}

/**
 * Create a high-performance memory service with minimal overhead
 */
export function createHighPerformanceMemoryService(): MemoryService {
  return new MemoryService({
    enabled: true,
    monitoringInterval: 30000, // 30 seconds
    thresholds: {
      warning: 80,
      critical: 90,
      emergency: 95
    },
    autoGC: false,
    maxHistoryEntries: 100,
    leakDetection: false,
    optimization: false
  });
}

/**
 * Create a detailed memory service for development
 */
export function createDetailedMemoryService(): MemoryService {
  return new MemoryService({
    enabled: true,
    monitoringInterval: 1000, // 1 second
    thresholds: {
      warning: 60,
      critical: 75,
      emergency: 90
    },
    autoGC: true,
    maxHistoryEntries: 5000,
    leakDetection: true,
    leakThreshold: 512 * 1024, // 512KB per minute
    optimization: true
  });
}

/**
 * Create a test memory service
 */
export function createTestMemoryService(): MemoryService {
  return new MemoryService({
    enabled: true,
    monitoringInterval: 100, // 100ms
    thresholds: {
      warning: 50,
      critical: 70,
      emergency: 85
    },
    autoGC: false,
    maxHistoryEntries: 50,
    leakDetection: true,
    leakThreshold: 1024, // 1KB per minute
    optimization: true
  });
}

/**
 * Global memory service instance
 */
export const globalMemoryService = createMemoryService();