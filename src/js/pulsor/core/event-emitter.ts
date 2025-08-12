/**
 * Advanced Event Emitter implementation for the Pulsor framework
 * @fileoverview Enhanced event system with type safety, performance optimization, and advanced features
 * @version 6.0.0
 * @author Pulsor Team
 */

import type { 
  EventDataMap, 
  BaseEventData 
} from '../types/index.js';
import type { IEventEmitter } from '../interfaces/index.js';
import { PulsorError } from './errors.js';
import { nowMs, generateExecutionId } from './utils.js';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Event listener with metadata
 */
interface ListenerEntry<TData = unknown> {
  readonly id: string;
  readonly listener: (data: TData) => void | Promise<void>;
  readonly once: boolean;
  readonly priority: number;
  readonly addedAt: number;
  readonly context?: any;
  callCount: number;
  lastCalledAt: number;
}

/**
 * Event emission result
 */
interface EmissionResult {
  readonly eventType: string;
  readonly listenersCount: number;
  successfulCalls: number;
  failedCalls: number;
  totalDuration: number;
  readonly errors: Error[];
}

/**
 * Event statistics
 */
interface EventStats {
  readonly eventType: string;
  readonly totalEmissions: number;
  readonly totalListeners: number;
  readonly averageListeners: number;
  readonly averageDuration: number;
  readonly lastEmittedAt: number;
  readonly errors: number;
}

/**
 * EventEmitter configuration
 */
export interface EventEmitterConfig {
  readonly maxListeners: number;
  readonly enableStats: boolean;
  readonly enableAsyncEmission: boolean;
  readonly errorHandling: 'throw' | 'log' | 'ignore';
  readonly enableWildcards: boolean;
  readonly enableNamespaces: boolean;
  readonly statsRetentionTime: number;
}

/**
 * Wildcard pattern matcher
 */
type WildcardPattern = string;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: EventEmitterConfig = {
  maxListeners: 100,
  enableStats: true,
  enableAsyncEmission: true,
  errorHandling: 'log',
  enableWildcards: true,
  enableNamespaces: true,
  statsRetentionTime: 3600000 // 1 hour
};

/**
 * Default listener priority
 */
const DEFAULT_PRIORITY = 0;

/**
 * Wildcard characters
 */
const NAMESPACE_SEPARATOR = ':';

// ============================================================================
// EVENT EMITTER IMPLEMENTATION
// ============================================================================

/**
 * Advanced Event Emitter implementation
 */
export class EventEmitter<TEventMap extends EventDataMap = EventDataMap> 
  implements IEventEmitter {
  
  private readonly config: EventEmitterConfig;
  private readonly listeners = new Map<string, ListenerEntry[]>();
  private readonly wildcardListeners = new Map<WildcardPattern, ListenerEntry[]>();
  private readonly stats = new Map<string, EventStats>();
  private readonly emissionHistory: Array<{ eventType: string; timestamp: number; duration: number }> = [];
  private isDestroyed = false;
  private totalEmissions = 0;
  private totalErrors = 0;
  private readonly pendingEmissions = new Map<string, Promise<void>>();
  private readonly listenerPool = new Map<string, ListenerEntry[]>();

  constructor(config: Partial<EventEmitterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add an event listener
   */
  public on<K extends keyof TEventMap>(
    eventType: K,
    listener: (data: TEventMap[K]) => void | Promise<void>,
    options: {
      priority?: number;
      once?: boolean;
    } = {}
  ): this {
    if (this.isDestroyed) {
      throw new PulsorError('EventEmitter has been destroyed');
    }
    return this.addListenerInternal(eventType, listener, false, options);
  }

  /**
   * Add a one-time event listener
   */
  public once<K extends keyof TEventMap>(
    eventType: K,
    listener: (data: TEventMap[K]) => void | Promise<void>,
    options: {
      priority?: number;
      context?: any;
    } = {}
  ): this {
    this.addListenerInternal(eventType, listener, true, options);
    return this;
  }

  /**
   * Remove an event listener
   */
  public off<K extends keyof TEventMap>(
    eventType: K,
    listener?: (data: TEventMap[K]) => void | Promise<void>
  ): void {
    this.removeListener(eventType, listener);
  }

  /**
   * Remove an event listener (internal method)
   */
  private removeListener<K extends keyof TEventMap>(
    eventType: K,
    listener?: (data: TEventMap[K]) => void | Promise<void>
  ): void {
    if (this.isDestroyed) {
      return;
    }

    const eventKey = String(eventType);
    
    if (!listener) {
      // Remove all listeners for this event
      this.listeners.delete(eventKey);
      return;
    }

    const eventListeners = this.listeners.get(eventKey);
    if (!eventListeners) {
      return;
    }

    const index = eventListeners.findIndex(entry => entry.listener === listener);
    if (index !== -1) {
      eventListeners.splice(index, 1);
      
      if (eventListeners.length === 0) {
        this.listeners.delete(eventKey);
      }
    }
  }

  /**
   * Remove all listeners for an event or all events
   */
  public removeAllListeners<K extends keyof TEventMap>(eventType?: K): void {
    this.clearListeners(eventType);
  }

  /**
   * Remove all listeners (internal method)
   */
  private clearListeners<K extends keyof TEventMap>(eventType?: K): this {
    if (this.isDestroyed) {
      return this;
    }

    if (eventType) {
      this.listeners.delete(String(eventType));
    } else {
      this.listeners.clear();
      this.wildcardListeners.clear();
    }

    return this;
  }

  /**
   * Emit an event
   */
  public emit<K extends keyof TEventMap>(
    eventType: K,
    data: TEventMap[K]
  ): void {
    if (this.isDestroyed) {
      return;
    }
    
    // Use optimized synchronous emission for performance
    this.emitEventOptimized(eventType, data);
  }

  /**
   * Emit an event with optimized performance
   */
  private emitEventOptimized<K extends keyof TEventMap>(
    eventType: K,
    data: TEventMap[K]
  ): boolean {
    if (this.isDestroyed) {
      return false;
    }

    const eventKey = String(eventType);
    const startTime = this.config.enableStats ? nowMs() : 0;
    
    this.totalEmissions++;
    
    try {
      // Fast path for events with no listeners
      const directListeners = this.listeners.get(eventKey);
      const hasWildcards = this.config.enableWildcards && this.wildcardListeners.size > 0;
      
      if (!directListeners && !hasWildcards) {
        return false;
      }
      
      const result = this.emitSyncOptimized(eventKey, data);
      
      if (this.config.enableStats) {
        const duration = nowMs() - startTime;
        this.recordEmission(eventKey, duration, result);
      }
      
      return result.listenersCount > 0;
    } catch (error) {
      this.totalErrors++;
      this.handleError(error as Error, eventKey);
      return false;
    }
  }

  /**
   * Emit an event asynchronously
   */
  public async emitAsync<K extends keyof TEventMap>(
    eventType: K,
    data: TEventMap[K]
  ): Promise<EmissionResult> {
    if (this.isDestroyed) {
      return this.createEmptyResult(String(eventType));
    }

    const eventKey = String(eventType);
    return this.emitAsyncInternal(eventKey, data);
  }

  /**
   * Get listener count for an event
   */
  public listenerCount<K extends keyof TEventMap>(eventType: K): number {
    const eventKey = String(eventType);
    const directListeners = this.listeners.get(eventKey)?.length ?? 0;
    const wildcardListeners = this.getWildcardListeners(eventKey).length;
    
    return directListeners + wildcardListeners;
  }

  /**
   * Get all listeners for an event
   */
  public getListeners<K extends keyof TEventMap>(
    eventType: K
  ): ((data: TEventMap[K]) => void | Promise<void>)[] {
    const eventKey = String(eventType);
    const directListeners = this.listeners.get(eventKey) ?? [];
    const wildcardListeners = this.getWildcardListeners(eventKey);
    
    return [...directListeners, ...wildcardListeners]
      .sort((a, b) => b.priority - a.priority)
      .map(entry => entry.listener);
  }

  /**
   * Get event names that have listeners
   */
  public eventNames(): (keyof TEventMap)[] {
    return Array.from(this.listeners.keys()) as (keyof TEventMap)[];
  }

  /**
   * Add a wildcard listener
   */
  public onWildcard(
    pattern: WildcardPattern,
    listener: (data: BaseEventData) => void | Promise<void>,
    options: {
      priority?: number;
      context?: any;
    } = {}
  ): this {
    if (!this.config.enableWildcards) {
      throw new PulsorError('Wildcard listeners are disabled');
    }

    return this.addWildcardListener(pattern, listener, false, options);
  }

  /**
   * Add a one-time wildcard listener
   */
  public onceWildcard(
    pattern: WildcardPattern,
    listener: (data: BaseEventData) => void | Promise<void>,
    options: {
      priority?: number;
      context?: any;
    } = {}
  ): this {
    if (!this.config.enableWildcards) {
      throw new PulsorError('Wildcard listeners are disabled');
    }

    return this.addWildcardListener(pattern, listener, true, options);
  }

  /**
   * Remove wildcard listener
   */
  public offWildcard(
    pattern: WildcardPattern,
    listener?: (data: BaseEventData) => void | Promise<void>
  ): this {
    if (!listener) {
      this.wildcardListeners.delete(pattern);
      return this;
    }

    const patternListeners = this.wildcardListeners.get(pattern);
    if (!patternListeners) {
      return this;
    }

    const index = patternListeners.findIndex(entry => entry.listener === listener);
    if (index !== -1) {
      patternListeners.splice(index, 1);
      
      if (patternListeners.length === 0) {
        this.wildcardListeners.delete(pattern);
      }
    }

    return this;
  }

  /**
   * Get event statistics
   */
  public getStats(eventType?: string): EventStats | Map<string, EventStats> {
    if (!this.config.enableStats) {
      throw new Error('Statistics are disabled');
    }

    if (eventType) {
      const stats = this.stats.get(eventType);
      if (!stats) {
        throw new Error(`No statistics found for event type: ${eventType}`);
      }
      return stats;
    }

    return new Map(this.stats);
  }

  /**
   * Get global statistics
   */
  public getGlobalStats(): {
    totalEmissions: number;
    totalErrors: number;
    totalListeners: number;
    totalEventTypes: number;
    averageListenersPerEvent: number;
  } {
    const totalListeners = Array.from(this.listeners.values())
      .reduce((sum, listeners) => sum + listeners.length, 0) +
      Array.from(this.wildcardListeners.values())
        .reduce((sum, listeners) => sum + listeners.length, 0);
    
    const totalEventTypes = this.listeners.size + this.wildcardListeners.size;
    const averageListenersPerEvent = totalEventTypes > 0 
      ? totalListeners / totalEventTypes 
      : 0;

    return {
      totalEmissions: this.totalEmissions,
      totalErrors: this.totalErrors,
      totalListeners,
      totalEventTypes,
      averageListenersPerEvent
    };
  }

  /**
   * Clear statistics
   */
  public clearStats(): void {
    this.stats.clear();
    this.emissionHistory.length = 0;
    this.totalEmissions = 0;
    this.totalErrors = 0;
  }

  /**
   * Set maximum listeners
   */
  public setMaxListeners(max: number): this {
    (this.config as any).maxListeners = Math.max(0, max);
    return this;
  }

  /**
   * Get maximum listeners
   */
  public getMaxListeners(): number {
    return this.config.maxListeners;
  }

  /**
   * Create a namespaced event emitter
   */
  public createNamespace(namespace: string): EventEmitter<TEventMap> {
    if (!this.config.enableNamespaces) {
      throw new PulsorError('Namespaces are disabled');
    }

    return new NamespacedEventEmitter(this, namespace);
  }

  /**
   * Wait for an event to be emitted
   */
  public waitFor<K extends keyof TEventMap>(
    eventType: K,
    timeout?: number
  ): Promise<TEventMap[K]> {
    return new Promise<TEventMap[K]>((resolve, reject) => {
      let timeoutHandle: NodeJS.Timeout | undefined;
      
      const listener = (data: TEventMap[K]) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        resolve(data);
      };
      
      this.once(eventType, listener);
      
      if (timeout && timeout > 0) {
        timeoutHandle = setTimeout(() => {
          this.off(eventType, listener);
          reject(new Error(`Timeout waiting for event '${String(eventType)}' after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * Destroy the event emitter
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    
    // Wait for any pending emissions to complete
    const pendingPromises = Array.from(this.pendingEmissions.values());
    if (pendingPromises.length > 0) {
      Promise.allSettled(pendingPromises).then(() => {
        this.performCleanup();
      }).catch(() => {
        this.performCleanup();
      });
    } else {
      this.performCleanup();
    }
  }
  
  /**
   * Perform cleanup operations
   */
  private performCleanup(): void {
    this.removeAllListeners();
    this.clearStats();
    
    // Clear all internal maps and arrays
    this.pendingEmissions.clear();
    this.listenerPool.clear();
    this.emissionHistory.length = 0;
    
    // Reset counters
    this.totalEmissions = 0;
    this.totalErrors = 0;
  }

  /**
   * Check if the event emitter is destroyed
   */
  public isDestroyed_(): boolean {
    return this.isDestroyed;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Add a listener with options
   */
  private addListenerInternal<K extends keyof TEventMap>(
    eventType: K,
    listener: (data: TEventMap[K]) => void | Promise<void>,
    once: boolean,
    options: { priority?: number; context?: any }
  ): this {
    if (this.isDestroyed) {
      return this;
    }

    const eventKey = String(eventType);
    const priority = options.priority ?? DEFAULT_PRIORITY;
    
    // Check max listeners
    const currentCount = this.listenerCount(eventType);
    if (currentCount >= this.config.maxListeners) {
      throw new PulsorError(
        `Maximum listeners (${this.config.maxListeners}) exceeded for event '${eventKey}'`
      );
    }

    const entry: ListenerEntry<TEventMap[K]> = {
      id: generateExecutionId(),
      listener,
      once,
      priority,
      addedAt: nowMs(),
      context: options.context,
      callCount: 0,
      lastCalledAt: 0
    };

    let eventListeners = this.listeners.get(eventKey);
    if (!eventListeners) {
      eventListeners = [];
      this.listeners.set(eventKey, eventListeners);
    }

    // Insert in priority order
    const insertIndex = eventListeners.findIndex(existing => existing.priority < priority);
    if (insertIndex === -1) {
      eventListeners.push(entry as ListenerEntry<unknown>);
    } else {
      eventListeners.splice(insertIndex, 0, entry as ListenerEntry<unknown>);
    }

    return this;
  }

  /**
   * Add a wildcard listener
   */
  private addWildcardListener(
    pattern: WildcardPattern,
    listener: (data: BaseEventData) => void | Promise<void>,
    once: boolean,
    options: { priority?: number; context?: any }
  ): this {
    const priority = options.priority ?? DEFAULT_PRIORITY;
    
    const entry: ListenerEntry<BaseEventData> = {
      id: generateExecutionId(),
      listener,
      once,
      priority,
      addedAt: nowMs(),
      context: options.context,
      callCount: 0,
      lastCalledAt: 0
    };

    let patternListeners = this.wildcardListeners.get(pattern);
    if (!patternListeners) {
      patternListeners = [];
      this.wildcardListeners.set(pattern, patternListeners);
    }

    // Insert in priority order
    const insertIndex = patternListeners.findIndex(existing => existing.priority < priority);
    if (insertIndex === -1) {
      patternListeners.push(entry as ListenerEntry<unknown>);
    } else {
      patternListeners.splice(insertIndex, 0, entry as ListenerEntry<unknown>);
    }

    return this;
  }

  /**
   * Optimized synchronous event emission
   */
  private emitSyncOptimized(eventKey: string, data: any): EmissionResult {
    const directListeners = this.listeners.get(eventKey) || [];
    const wildcardListeners = this.config.enableWildcards ? this.getWildcardListeners(eventKey) : [];
    
    const totalListeners = directListeners.length + wildcardListeners.length;
    
    if (totalListeners === 0) {
      return this.createEmptyResult(eventKey);
    }
    
    const result: EmissionResult = {
      eventType: eventKey,
      listenersCount: totalListeners,
      successfulCalls: 0,
      failedCalls: 0,
      totalDuration: 0,
      errors: []
    };

    const startTime = this.config.enableStats ? nowMs() : 0;
    const onceListeners: ListenerEntry[] = [];
    
    // Process direct listeners first (more common case)
    for (let i = 0; i < directListeners.length; i++) {
      const entry = directListeners[i];
      try {
        entry.listener(data);
        entry.callCount++;
        entry.lastCalledAt = startTime || nowMs();
        (result as any).successfulCalls++;
        
        if (entry.once) {
          onceListeners.push(entry);
        }
      } catch (error) {
        (result as any).failedCalls++;
        result.errors.push(error as Error);
        this.handleError(error as Error, eventKey);
      }
    }
    
    // Process wildcard listeners
    for (let i = 0; i < wildcardListeners.length; i++) {
      const entry = wildcardListeners[i];
      try {
        entry.listener(data);
        entry.callCount++;
        entry.lastCalledAt = startTime || nowMs();
        (result as any).successfulCalls++;
        
        if (entry.once) {
          onceListeners.push(entry);
        }
      } catch (error) {
        (result as any).failedCalls++;
        result.errors.push(error as Error);
        this.handleError(error as Error, eventKey);
      }
    }
    
    // Remove one-time listeners in batch
    if (onceListeners.length > 0) {
      this.batchRemoveListeners(eventKey, onceListeners);
    }

    if (this.config.enableStats) {
      (result as any).totalDuration = nowMs() - startTime;
    }
    
    return result;
  }

  /**
   * Emit event asynchronously (internal)
   */
  private async emitAsyncInternal(eventKey: string, data: any): Promise<EmissionResult> {
    const allListeners = this.getAllListeners(eventKey);
    const result: EmissionResult = {
      eventType: eventKey,
      listenersCount: allListeners.length,
      successfulCalls: 0,
      failedCalls: 0,
      totalDuration: 0,
      errors: []
    };

    const startTime = nowMs();
    
    const promises = allListeners.map(async (entry) => {
      try {
        await entry.listener(data);
        entry.callCount++;
        entry.lastCalledAt = nowMs();
        (result as any).successfulCalls++;
        
        // Remove one-time listeners
        if (entry.once) {
          this.removeListenerEntry(eventKey, entry);
        }
      } catch (error) {
        (result as any).failedCalls++;
        result.errors.push(error as Error);
        this.handleError(error as Error, eventKey);
      }
    });

    await Promise.allSettled(promises);
    (result as any).totalDuration = nowMs() - startTime;
    return result;
  }

  /**
   * Get all listeners for an event (direct + wildcard)
   */
  private getAllListeners(eventKey: string): ListenerEntry[] {
    const directListeners = this.listeners.get(eventKey) ?? [];
    const wildcardListeners = this.getWildcardListeners(eventKey);
    
    return [...directListeners, ...wildcardListeners]
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get wildcard listeners that match the event
   */
  private getWildcardListeners(eventKey: string): ListenerEntry[] {
    if (!this.config.enableWildcards) {
      return [];
    }

    const matchingListeners: ListenerEntry[] = [];
    
    for (const [pattern, listeners] of Array.from(this.wildcardListeners.entries())) {
      if (this.matchesWildcard(eventKey, pattern)) {
        matchingListeners.push(...listeners);
      }
    }
    
    return matchingListeners;
  }

  /**
   * Check if event matches wildcard pattern (optimized)
   */
  private matchesWildcard(eventKey: string, pattern: WildcardPattern): boolean {
    // Cache compiled regex patterns for performance
    if (!this.compiledPatterns) {
      this.compiledPatterns = new Map<string, RegExp>();
    }
    
    let regex = this.compiledPatterns.get(pattern);
    if (!regex) {
      try {
        // Convert wildcard pattern to regex
        const regexPattern = pattern
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
          .replace(/\\\*/g, '.*') // Replace * with .*
          .replace(/\\\?/g, '.'); // Replace ? with .
        
        regex = new RegExp(`^${regexPattern}$`);
        
        // Cache the compiled regex (limit cache size)
        if (this.compiledPatterns.size < 100) {
          this.compiledPatterns.set(pattern, regex);
        }
      } catch (error) {
        // Invalid regex pattern, no match
        return false;
      }
    }
    
    try {
      return regex.test(eventKey);
    } catch (error) {
      // Regex test failed, no match
      return false;
    }
  }
  
  private compiledPatterns?: Map<string, RegExp>;

  /**
   * Remove a specific listener entry
   */
  private removeListenerEntry(eventKey: string, entry: ListenerEntry): void {
    // Check direct listeners
    const directListeners = this.listeners.get(eventKey);
    if (directListeners) {
      const index = directListeners.findIndex(e => e.id === entry.id);
      if (index !== -1) {
        directListeners.splice(index, 1);
        if (directListeners.length === 0) {
          this.listeners.delete(eventKey);
        }
        return;
      }
    }

    // Check wildcard listeners
    for (const [pattern, listeners] of this.wildcardListeners) {
      const index = listeners.findIndex(e => e.id === entry.id);
      if (index !== -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this.wildcardListeners.delete(pattern);
        }
        return;
      }
    }
  }
  
  /**
   * Batch remove multiple listener entries for performance
   */
  private batchRemoveListeners(eventKey: string, entries: ListenerEntry[]): void {
    if (entries.length === 0) {
      return;
    }
    
    const entryIds = new Set(entries.map(e => e.id));
    
    // Remove from direct listeners
    const directListeners = this.listeners.get(eventKey);
    if (directListeners) {
      const filteredListeners = directListeners.filter(e => !entryIds.has(e.id));
      if (filteredListeners.length === 0) {
        this.listeners.delete(eventKey);
      } else if (filteredListeners.length < directListeners.length) {
        this.listeners.set(eventKey, filteredListeners);
      }
    }
    
    // Remove from wildcard listeners
    for (const [pattern, listeners] of this.wildcardListeners) {
      const filteredListeners = listeners.filter(e => !entryIds.has(e.id));
      if (filteredListeners.length === 0) {
        this.wildcardListeners.delete(pattern);
      } else if (filteredListeners.length < listeners.length) {
        this.wildcardListeners.set(pattern, filteredListeners);
      }
    }
  }

  /**
   * Record emission statistics (optimized)
   */
  private recordEmission(eventKey: string, duration: number, result: EmissionResult): void {
    if (!this.config.enableStats) {
      return;
    }

    const now = nowMs();
    
    // Update event-specific stats with optimized calculations
    let eventStats = this.stats.get(eventKey);
    if (!eventStats) {
      eventStats = {
        eventType: eventKey,
        totalEmissions: 0,
        totalListeners: 0,
        averageListeners: 0,
        averageDuration: 0,
        lastEmittedAt: 0,
        errors: 0
      };
      this.stats.set(eventKey, eventStats);
    }

    // Batch update stats for better performance
    const mutableStats = eventStats as any;
    const prevEmissions = mutableStats.totalEmissions;
    
    mutableStats.totalEmissions++;
    mutableStats.totalListeners += result.listenersCount;
    mutableStats.averageListeners = mutableStats.totalListeners / mutableStats.totalEmissions;
    mutableStats.averageDuration = (mutableStats.averageDuration * prevEmissions + duration) / mutableStats.totalEmissions;
    mutableStats.lastEmittedAt = now;
    mutableStats.errors += result.failedCalls;

    // Record in emission history with size limit
    if (this.emissionHistory.length >= 1000) {
      // Remove oldest entries in batch for better performance
      this.emissionHistory.splice(0, 100);
    }
    
    this.emissionHistory.push({
      eventType: eventKey,
      timestamp: now,
      duration
    });

    // Periodically clean old history (every 100 emissions)
    if (this.totalEmissions % 100 === 0) {
      this.cleanupOldHistory();
    }
  }
  
  /**
   * Cleanup old emission history
   */
  private cleanupOldHistory(): void {
    const cutoff = nowMs() - this.config.statsRetentionTime;
    let removeCount = 0;
    
    for (let i = 0; i < this.emissionHistory.length; i++) {
      if (this.emissionHistory[i] && this.emissionHistory[i].timestamp >= cutoff) {
        break;
      }
      removeCount++;
    }
    
    if (removeCount > 0) {
      this.emissionHistory.splice(0, removeCount);
    }
  }

  /**
   * Handle errors based on configuration
   */
  private handleError(error: Error, eventKey: string): void {
    switch (this.config.errorHandling) {
      case 'throw':
        throw error;
      
      case 'log':
        console.error(`EventEmitter error in '${eventKey}':`, error);
        break;
      
      case 'ignore':
        // Do nothing
        break;
    }
  }

  /**
   * Create empty emission result
   */
  private createEmptyResult(eventType: string): EmissionResult {
    return {
      eventType,
      listenersCount: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalDuration: 0,
      errors: []
    };
  }
}

// ============================================================================
// NAMESPACED EVENT EMITTER
// ============================================================================

/**
 * Namespaced event emitter that prefixes all events
 */
class NamespacedEventEmitter<TEventMap extends EventDataMap = EventDataMap> 
  extends EventEmitter<TEventMap> {
  
  constructor(
    private readonly parent: EventEmitter<TEventMap>,
    private readonly namespaceName: string
  ) {
    super();
  }

  public override emit<K extends keyof TEventMap>(
    eventType: K,
    data: TEventMap[K]
  ): void {
    const namespacedEvent = `${this.namespaceName}${NAMESPACE_SEPARATOR}${String(eventType)}` as K;
    this.parent.emit(namespacedEvent, data);
  }

  public override on<K extends keyof TEventMap>(
    eventType: K,
    listener: (data: TEventMap[K]) => void | Promise<void>,
    options: {
      priority?: number;
      once?: boolean;
    } = {}
  ): this {
    const namespacedEvent = `${this.namespaceName}${NAMESPACE_SEPARATOR}${String(eventType)}` as K;
    this.parent.on(namespacedEvent, listener, options);
    return this;
  }

  public override once<K extends keyof TEventMap>(
    eventType: K,
    listener: (data: TEventMap[K]) => void | Promise<void>,
    options: {
      priority?: number;
    } = {}
  ): this {
    const namespacedEvent = `${this.namespaceName}${NAMESPACE_SEPARATOR}${String(eventType)}` as K;
    this.parent.once(namespacedEvent, listener, options);
    return this;
  }

  public override off<K extends keyof TEventMap>(
    eventType: K,
    listener?: (data: TEventMap[K]) => void | Promise<void>
  ): void {
    const namespacedEvent = `${this.namespaceName}${NAMESPACE_SEPARATOR}${String(eventType)}` as K;
    this.parent.off(namespacedEvent, listener);
  }

  public override removeAllListeners<K extends keyof TEventMap>(eventType?: K): void {
    if (eventType) {
      const namespacedEvent = `${this.namespaceName}${NAMESPACE_SEPARATOR}${String(eventType)}` as K;
      this.parent.removeAllListeners(namespacedEvent);
    } else {
      this.parent.removeAllListeners();
    }
  }

  public override listenerCount<K extends keyof TEventMap>(eventType: K): number {
    const namespacedEvent = `${this.namespaceName}${NAMESPACE_SEPARATOR}${String(eventType)}` as K;
    return this.parent.listenerCount(namespacedEvent);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new EventEmitter instance
 */
export function createEventEmitter<TEventMap extends EventDataMap = EventDataMap>(
  config?: Partial<EventEmitterConfig>
): EventEmitter<TEventMap> {
  return new EventEmitter<TEventMap>(config);
}

/**
 * Create a high-performance EventEmitter
 */
export function createHighPerformanceEventEmitter<TEventMap extends EventDataMap = EventDataMap>(
  config?: Partial<EventEmitterConfig>
): EventEmitter<TEventMap> {
  const optimizedConfig: Partial<EventEmitterConfig> = {
    maxListeners: 1000,
    enableStats: false,
    enableWildcards: false,
    ...config
  };
  return new EventEmitter<TEventMap>(optimizedConfig);
}

/**
 * Create an EventEmitter for testing
 */
export function createTestEventEmitter<TEventMap extends EventDataMap = EventDataMap>(): EventEmitter<TEventMap> {
  return new EventEmitter<TEventMap>({
    maxListeners: 50,
    enableStats: true,
    enableAsyncEmission: true,
    errorHandling: 'throw',
    enableWildcards: true,
    enableNamespaces: true,
    statsRetentionTime: 60000
  });
}