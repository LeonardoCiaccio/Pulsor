/**
 * Advanced asynchronous locking mechanism for the Pulsor framework
 * @fileoverview Enhanced async lock with priority queues, timeouts, and deadlock detection
 * @version 6.0.0
 * @author Pulsor Team
 */

import type { IAsyncLock } from '../interfaces/index.js';
import { PulsorTimeoutError, PulsorConcurrencyError } from './errors.js';
import { nowMs, generateExecutionId } from './utils.js';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Lock acquisition request
 */
interface LockRequest {
  readonly id: string;
  readonly key: string;
  readonly priority: number;
  readonly timeout: number;
  readonly acquiredAt: number;
  readonly resolve: (value: void) => void;
  readonly reject: (error: Error) => void;
  readonly timeoutHandle?: NodeJS.Timeout;
}

/**
 * Lock statistics
 */
interface LockStats {
  readonly totalAcquisitions: number;
  readonly totalReleases: number;
  readonly totalTimeouts: number;
  readonly totalDeadlocks: number;
  readonly averageWaitTime: number;
  readonly maxWaitTime: number;
  readonly currentlyHeld: number;
  readonly currentlyWaiting: number;
}

/**
 * Lock configuration
 */
interface AsyncLockConfig {
  readonly defaultTimeout: number;
  readonly maxConcurrentLocks: number;
  readonly enableDeadlockDetection: boolean;
  readonly deadlockDetectionInterval: number;
  readonly enableStats: boolean;
  readonly maxQueueSize: number;
}

/**
 * Lock holder information
 */
interface LockHolder {
  readonly id: string;
  readonly key: string;
  readonly acquiredAt: number;
  readonly priority: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AsyncLockConfig = {
  defaultTimeout: 30000, // 30 seconds
  maxConcurrentLocks: 1000,
  enableDeadlockDetection: true,
  deadlockDetectionInterval: 5000, // 5 seconds
  enableStats: true,
  maxQueueSize: 10000
};

/**
 * Default priority for lock requests
 */
const DEFAULT_PRIORITY = 0;



/**
 * Maximum wait time for deadlock detection (ms)
 */
const MAX_DEADLOCK_WAIT_TIME = 60000; // 1 minute

// ============================================================================
// ASYNC LOCK IMPLEMENTATION
// ============================================================================

/**
 * Advanced asynchronous lock implementation
 */
export class AsyncLock implements IAsyncLock {
  private defaultKey = 'default';
  private readonly config: AsyncLockConfig;
  private readonly heldLocks = new Map<string, LockHolder>();
  private readonly waitingQueues = new Map<string, LockRequest[]>();
  private readonly stats: LockStats;
  private readonly waitTimes: number[] = [];
  private deadlockDetectionTimer?: NodeJS.Timeout | undefined;
  private readonly cleanupIntervals = new Map<string, NodeJS.Timeout>();
  private isDestroyed = false;

  constructor(config: Partial<AsyncLockConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.stats = {
      totalAcquisitions: 0,
      totalReleases: 0,
      totalTimeouts: 0,
      totalDeadlocks: 0,
      averageWaitTime: 0,
      maxWaitTime: 0,
      currentlyHeld: 0,
      currentlyWaiting: 0
    };

    if (this.config.enableDeadlockDetection) {
      this.startDeadlockDetection();
    }
  }

  /**
   * Acquire a lock with optional timeout (IAsyncLock interface)
   */
  public async acquire(timeoutMs?: number): Promise<void> {
    return this.acquireKey(this.defaultKey, timeoutMs);
  }

  /**
   * Acquire a lock for the specified key
   */
  public async acquireKey(
    key: string,
    timeout: number = this.config.defaultTimeout,
    priority: number = DEFAULT_PRIORITY
  ): Promise<void> {
    if (this.isDestroyed) {
      throw new PulsorConcurrencyError('AsyncLock has been destroyed');
    }

    if (this.heldLocks.size >= this.config.maxConcurrentLocks) {
      throw new PulsorConcurrencyError(
        `Maximum concurrent locks (${this.config.maxConcurrentLocks}) exceeded`
      );
    }

    const totalWaiting = Array.from(this.waitingQueues.values())
      .reduce((sum, queue) => sum + queue.length, 0);
    
    if (totalWaiting >= this.config.maxQueueSize) {
      throw new PulsorConcurrencyError(
        `Maximum queue size (${this.config.maxQueueSize}) exceeded`
      );
    }

    // Check if lock is already held
    if (!this.heldLocks.has(key)) {
      // Lock is available, acquire immediately
      this.acquireLockImmediately(key, priority);
      return;
    }

    // Lock is held, add to waiting queue
    return this.addToWaitingQueue(key, timeout, priority);
  }

  /**
   * Release the lock (IAsyncLock interface)
   */
  public release(): void {
    this.releaseKey(this.defaultKey);
  }

  /**
   * Release a lock for the specified key
   */
  public releaseKey(key: string): void {
    if (this.isDestroyed) {
      return;
    }

    const holder = this.heldLocks.get(key);
    if (!holder) {
      // Lock not held, nothing to release
      return;
    }

    // Remove from held locks
    this.heldLocks.delete(key);
    
    // Update stats
    if (this.config.enableStats) {
      (this.stats as any).totalReleases++;
      (this.stats as any).currentlyHeld = this.heldLocks.size;
    }

    // Process next waiting request
    this.processNextWaiting(key);
  }

  /**
   * Try to acquire a lock without waiting
   */
  public tryAcquire(key: string, priority: number = DEFAULT_PRIORITY): boolean {
    if (this.isDestroyed || this.isKeyLocked(key)) {
      return false;
    }

    this.acquireLockImmediately(key, priority);
    return true;
  }

  /**
   * Check if a lock is currently held
   */
  public isKeyLocked(key: string): boolean {
    return this.heldLocks.has(key);
  }

  /**
   * Get the number of requests waiting for a specific key
   */
  public getWaitingCount(key: string): number {
    const queue = this.waitingQueues.get(key);
    return queue ? queue.length : 0;
  }

  /**
   * Get total number of held locks
   */
  public getHeldCount(): number {
    return this.heldLocks.size;
  }

  /**
   * Get total number of waiting requests
   */
  public getTotalWaitingCount(): number {
    return Array.from(this.waitingQueues.values())
      .reduce((sum, queue) => sum + queue.length, 0);
  }

  /**
   * Number of queued operations (required by IAsyncLock)
   */
  public get queueLength(): number {
    return this.getTotalWaitingCount();
  }

  /**
   * Check if lock is currently acquired (required by IAsyncLock)
   */
  public get isLocked(): boolean {
    return this.isKeyLocked(this.defaultKey);
  }

  /**
   * Get lock statistics
   */
  public getStats(): Readonly<LockStats> {
    if (!this.config.enableStats) {
      throw new Error('Statistics are disabled');
    }

    // Calculate current averages
    const avgWaitTime = this.waitTimes.length > 0
      ? this.waitTimes.reduce((sum, time) => sum + time, 0) / this.waitTimes.length
      : 0;
    
    const maxWaitTime = this.waitTimes.length > 0
      ? Math.max(...this.waitTimes)
      : 0;

    return {
      ...this.stats,
      averageWaitTime: avgWaitTime,
      maxWaitTime: maxWaitTime,
      currentlyHeld: this.heldLocks.size,
      currentlyWaiting: this.getTotalWaitingCount()
    };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    if (!this.config.enableStats) {
      return;
    }

    (this.stats as any).totalAcquisitions = 0;
    (this.stats as any).totalReleases = 0;
    (this.stats as any).totalTimeouts = 0;
    (this.stats as any).totalDeadlocks = 0;
    this.waitTimes.length = 0;
  }

  /**
   * Get all currently held locks
   */
  public getHeldLocks(): ReadonlyMap<string, Readonly<LockHolder>> {
    return new Map(this.heldLocks);
  }

  /**
   * Get all waiting queues
   */
  public getWaitingQueues(): ReadonlyMap<string, readonly LockRequest[]> {
    const result = new Map<string, readonly LockRequest[]>();
    for (const [key, queue] of this.waitingQueues) {
      result.set(key, [...queue]);
    }
    return result;
  }

  /**
   * Force release all locks (emergency use)
   */
  public releaseAll(): void {
    if (this.isDestroyed) {
      return;
    }

    // Release all held locks
    const heldKeys = Array.from(this.heldLocks.keys());
    for (const key of heldKeys) {
      this.releaseKey(key);
    }

    // Reject all waiting requests with proper cleanup
    for (const [key, queue] of this.waitingQueues) {
      for (const request of queue) {
        if (request.timeoutHandle) {
          clearTimeout(request.timeoutHandle);
        }
        try {
          request.reject(new PulsorConcurrencyError(
            `Lock acquisition cancelled: all locks released for key '${key}'`
          ));
        } catch (error) {
          // Handle potential race condition where reject might be called twice
          console.warn(`Potential race condition in releaseAll for key '${key}':`, error);
        }
      }
    }

    this.waitingQueues.clear();
    
    // Clean up stats to prevent memory leaks
    if (this.config.enableStats) {
      (this.stats as any).currentlyHeld = 0;
      (this.stats as any).currentlyWaiting = 0;
    }
  }

  /**
   * Destroy the lock manager
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    // Stop deadlock detection
    if (this.deadlockDetectionTimer) {
      clearInterval(this.deadlockDetectionTimer);
      this.deadlockDetectionTimer = undefined;
    }

    // Clear all cleanup intervals
    for (const [key, interval] of this.cleanupIntervals) {
      clearInterval(interval);
    }
    this.cleanupIntervals.clear();

    // Release all locks and reject waiting requests
    this.releaseAll();
    
    // Clear all data structures to prevent memory leaks
    this.heldLocks.clear();
    this.waitingQueues.clear();
    this.waitTimes.length = 0;
  }

  /**
   * Check if the lock manager is destroyed
   */
  public isDestroyed_(): boolean {
    return this.isDestroyed;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Acquire lock immediately without waiting
   */
  private acquireLockImmediately(key: string, priority: number): void {
    const holder: LockHolder = {
      id: generateExecutionId(),
      key,
      acquiredAt: nowMs(),
      priority
    };

    this.heldLocks.set(key, holder);

    // Update stats
    if (this.config.enableStats) {
      (this.stats as any).totalAcquisitions++;
      (this.stats as any).currentlyHeld = this.heldLocks.size;
    }
  }

  /**
   * Add request to waiting queue
   */
  private async addToWaitingQueue(
    key: string,
    timeout: number,
    priority: number
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isDestroyed) {
        reject(new PulsorConcurrencyError('AsyncLock has been destroyed'));
        return;
      }

      const requestId = generateExecutionId();
      const startTime = nowMs();

      // Create timeout handler with race condition protection
      const timeoutHandle = setTimeout(() => {
        if (!this.isDestroyed) {
          this.handleTimeout(key, requestId);
          reject(new PulsorTimeoutError(
            timeout,
            { context: { key, message: `Lock acquisition timeout after ${timeout}ms for key '${key}'` } }
          ));
        }
      }, timeout);

      // Create lock request
      const request: LockRequest = {
        id: requestId,
        key,
        priority,
        timeout,
        acquiredAt: startTime,
        resolve: () => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }
          
          // Record wait time with memory leak protection
          if (this.config.enableStats && !this.isDestroyed) {
            const waitTime = nowMs() - startTime;
            this.waitTimes.push(waitTime);
            
            // Keep only recent wait times to prevent memory growth
            if (this.waitTimes.length > 1000) {
              this.waitTimes.splice(0, this.waitTimes.length - 1000);
            }
          }
          
          resolve();
        },
        reject: (error: Error) => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }
          reject(error);
        },
        timeoutHandle
      };

      // Add to queue with priority ordering and race condition protection
      let queue = this.waitingQueues.get(key);
      if (!queue) {
        if (this.isDestroyed) {
          clearTimeout(timeoutHandle);
          reject(new PulsorConcurrencyError('AsyncLock has been destroyed'));
          return;
        }
        queue = [];
        this.waitingQueues.set(key, queue);
      }

      // Insert in priority order (higher priority first)
      const insertIndex = queue.findIndex(req => req.priority < priority);
      if (insertIndex === -1) {
        queue.push(request);
      } else {
        queue.splice(insertIndex, 0, request);
      }

      // Update stats with thread safety
      if (this.config.enableStats && !this.isDestroyed) {
        (this.stats as any).currentlyWaiting = this.getTotalWaitingCount();
      }
    });
  }

  /**
   * Process next waiting request for a key
   */
  private processNextWaiting(key: string): void {
    if (this.isDestroyed) {
      return;
    }

    const queue = this.waitingQueues.get(key);
    if (!queue || queue.length === 0) {
      this.waitingQueues.delete(key);
      return;
    }

    // Get highest priority request with race condition protection
    const request = queue.shift();
    if (!request) {
      this.waitingQueues.delete(key);
      return;
    }
    
    // Clean up timeout handle to prevent memory leak
    if (request.timeoutHandle) {
      clearTimeout(request.timeoutHandle);
    }
    
    // Acquire lock for this request
    this.acquireLockImmediately(key, request.priority);
    
    // Resolve the request safely
    try {
      request.resolve();
    } catch (error) {
      // Handle potential race condition where resolve might be called twice
      console.warn(`Potential race condition in processNextWaiting for key '${key}':`, error);
    }

    // Update stats with thread safety
    if (this.config.enableStats && !this.isDestroyed) {
      (this.stats as any).currentlyWaiting = this.getTotalWaitingCount();
    }

    // Clean up empty queue
    if (queue.length === 0) {
      this.waitingQueues.delete(key);
    }
  }

  /**
   * Handle timeout for a lock request
   */
  private handleTimeout(key: string, requestId: string): void {
    if (this.isDestroyed) {
      return;
    }

    const queue = this.waitingQueues.get(key);
    if (!queue) {
      return;
    }

    // Remove timed out request from queue
    const requestIndex = queue.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      const request = queue[requestIndex];
      
      // Clean up timeout handle to prevent memory leak
      if (request.timeoutHandle) {
        clearTimeout(request.timeoutHandle);
      }
      
      queue.splice(requestIndex, 1);
      
      // Clean up empty queue
      if (queue.length === 0) {
        this.waitingQueues.delete(key);
      }
    }

    // Update stats
    if (this.config.enableStats) {
      (this.stats as any).totalTimeouts++;
      (this.stats as any).currentlyWaiting = this.getTotalWaitingCount();
    }
  }

  /**
   * Start deadlock detection
   */
  private startDeadlockDetection(): void {
    if (this.deadlockDetectionTimer) {
      clearInterval(this.deadlockDetectionTimer);
    }
    
    this.deadlockDetectionTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.detectDeadlocks();
      }
    }, this.config.deadlockDetectionInterval);
  }

  /**
   * Detect potential deadlocks
   */
  private detectDeadlocks(): void {
    if (this.isDestroyed) {
      return;
    }

    const currentTime = nowMs();
    const deadlockedRequests: { key: string; request: LockRequest }[] = [];

    // Check for requests that have been waiting too long
    for (const [key, queue] of this.waitingQueues) {
      for (const request of queue) {
        const waitTime = currentTime - request.acquiredAt;
        if (waitTime > MAX_DEADLOCK_WAIT_TIME) {
          deadlockedRequests.push({ key, request });
        }
      }
    }

    // Handle deadlocked requests
    for (const { key, request } of deadlockedRequests) {
      this.handleDeadlock(key, request);
    }
  }

  /**
   * Handle a detected deadlock
   */
  private handleDeadlock(key: string, request: LockRequest): void {
    if (this.isDestroyed) {
      return;
    }

    // Remove from queue with proper cleanup
    const queue = this.waitingQueues.get(key);
    if (queue) {
      const index = queue.findIndex(req => req.id === request.id);
      if (index !== -1) {
        // Clean up timeout handle
        if (request.timeoutHandle) {
          clearTimeout(request.timeoutHandle);
        }
        
        queue.splice(index, 1);
        
        // Clean up empty queue
        if (queue.length === 0) {
          this.waitingQueues.delete(key);
        }
      }
    }

    // Update stats with thread safety
    if (this.config.enableStats && !this.isDestroyed) {
      (this.stats as any).totalDeadlocks++;
      (this.stats as any).currentlyWaiting = this.getTotalWaitingCount();
    }

    // Reject the request safely
    try {
      request.reject(new PulsorConcurrencyError(
        `Potential deadlock detected for key '${key}' after ${MAX_DEADLOCK_WAIT_TIME}ms`
      ));
    } catch (error) {
      // Handle potential race condition where reject might be called twice
      console.warn(`Potential race condition in handleDeadlock for key '${key}':`, error);
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new AsyncLock instance
 */
export function createAsyncLock(config: Partial<AsyncLockConfig> = {}): AsyncLock {
  return new AsyncLock(config);
}

/**
 * Create an AsyncLock with high performance settings
 */
export function createHighPerformanceAsyncLock(): AsyncLock {
  return new AsyncLock({
    enableDeadlockDetection: false,
    enableStats: false,
    maxConcurrentLocks: 10000,
    maxQueueSize: 50000
  });
}

/**
 * Create an AsyncLock for testing
 */
export function createTestAsyncLock(): AsyncLock {
  return new AsyncLock({
    defaultTimeout: 1000,
    maxConcurrentLocks: 100,
    enableDeadlockDetection: true,
    deadlockDetectionInterval: 100,
    enableStats: true,
    maxQueueSize: 1000
  });
}