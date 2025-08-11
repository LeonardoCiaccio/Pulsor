/**
 * Services module exports for the Pulsor framework
 * @fileoverview Central export point for all service components
 * @version 6.0.0
 * @author Pulsor Team
 */

// ============================================================================
// METRICS SERVICE
// ============================================================================

export {
  MetricsService,
  createMetricsService,
  createHighPerformanceMetricsService,
  createDetailedMetricsService,
  createTestMetricsService,
  globalMetricsService
} from './metrics.js';

export type {
  MetricsConfig,
  ExecutionRecord,
  ErrorRecord,
  AggregatedMetrics,
  PerformanceTrend
} from './metrics.js';

// ============================================================================
// MEMORY SERVICE
// ============================================================================

export {
  MemoryService,
  createMemoryService,
  createHighPerformanceMemoryService,
  createDetailedMemoryService,
  createTestMemoryService,
  globalMemoryService
} from './memory.js';

export type {
  MemoryConfig,
  MemorySnapshot,
  MemoryLeak,
  MemoryOptimization,
  AllocationTracker
} from './memory.js';

// ============================================================================
// SECURITY SERVICE
// ============================================================================

export {
  SecurityService,
  createSecurityService,
  createStrictSecurityService,
  createLenientSecurityService,
  createTestSecurityService,
  globalSecurityService
} from './security.js';

export type {
  SecurityConfig,
  SecurityViolation,
  RateLimitState,
  SecurityAuditEntry,
  ThreatAssessment,
  SecurityMetrics
} from './security.js';

// ============================================================================
// SERVICE FACTORY
// ============================================================================

import type { IServiceFactory, IAsyncLock, ICircuitBreaker, IValidator, ILogger, IEventEmitter, IMemoryService, ISecurityService, IMetricsService } from '../interfaces/index.js';
import { MetricsService } from './metrics.js';
import { MemoryService } from './memory.js';
import { SecurityService } from './security.js';
import { Logger, createLogger } from '../core/logger.js';
import { AsyncLock, createAsyncLock } from '../core/async-lock.js';
import { CircuitBreaker, createCircuitBreaker } from '../core/circuit-breaker.js';
import { EventEmitter, createEventEmitter } from '../core/event-emitter.js';
import { Validator, createValidator } from '../core/validator.js';

/**
 * Configuration for service factory
 */
export interface ServiceFactoryConfig {
  /** Metrics service configuration */
  metrics?: {
    enabled: boolean;
    type: 'default' | 'high-performance' | 'detailed' | 'test';
    config?: any;
  };
  /** Memory service configuration */
  memory?: {
    enabled: boolean;
    type: 'default' | 'high-performance' | 'detailed' | 'test';
    config?: any;
  };
  /** Security service configuration */
  security?: {
    enabled: boolean;
    type: 'default' | 'strict' | 'lenient' | 'test';
    config?: any;
  };
  /** Logger configuration */
  logger?: {
    enabled: boolean;
    type: 'default' | 'performance' | 'silent' | 'test';
    config?: any;
  };
  /** Async lock configuration */
  asyncLock?: {
    enabled: boolean;
    type: 'default' | 'high-performance' | 'test';
    config?: any;
  };
  /** Circuit breaker configuration */
  circuitBreaker?: {
    enabled: boolean;
    type: 'default' | 'fast-fail' | 'adaptive' | 'test';
    config?: any;
  };
  /** Event emitter configuration */
  eventEmitter?: {
    enabled: boolean;
    type: 'default' | 'high-performance' | 'test';
    config?: any;
  };
  /** Validator configuration */
  validator?: {
    enabled: boolean;
    type: 'default' | 'strict' | 'lenient' | 'test';
    config?: any;
  };
}

/**
 * Service factory implementation
 */
export class ServiceFactory implements IServiceFactory {
  private readonly config: ServiceFactoryConfig;
  private readonly services = new Map<string, any>();
  
  constructor(config: ServiceFactoryConfig = {}) {
    this.config = {
      metrics: { enabled: true, type: 'default' },
      memory: { enabled: true, type: 'default' },
      security: { enabled: true, type: 'default' },
      logger: { enabled: true, type: 'default' },
      asyncLock: { enabled: true, type: 'default' },
      circuitBreaker: { enabled: true, type: 'default' },
      eventEmitter: { enabled: true, type: 'default' },
      validator: { enabled: true, type: 'default' },
      ...config
    };
  }
  
  /**
   * Create metrics service
   */
  public createMetricsService(): IMetricsService {
    const key = 'metrics';
    if (this.services.has(key)) {
      return this.services.get(key);
    }
    
    const config = this.config.metrics!;
    if (!config.enabled) {
      throw new Error('Metrics service is disabled');
    }
    
    let service: MetricsService;
    switch (config.type) {
      case 'high-performance':
        const { createHighPerformanceMetricsService } = require('./metrics.js');
        service = createHighPerformanceMetricsService();
        break;
      case 'detailed':
        const { createDetailedMetricsService } = require('./metrics.js');
        service = createDetailedMetricsService();
        break;
      case 'test':
        const { createTestMetricsService } = require('./metrics.js');
        service = createTestMetricsService();
        break;
      default:
        const { createMetricsService } = require('./metrics.js');
        service = createMetricsService(config.config);
    }
    
    this.services.set(key, service);
    return service as IMetricsService;
  }
  
  /**
   * Create memory service
   */
  public createMemoryService(): IMemoryService {
    const key = 'memory';
    if (this.services.has(key)) {
      return this.services.get(key);
    }
    
    const config = this.config.memory!;
    if (!config.enabled) {
      throw new Error('Memory service is disabled');
    }
    
    let service: MemoryService;
    switch (config.type) {
      case 'high-performance':
        const { createHighPerformanceMemoryService } = require('./memory.js');
        service = createHighPerformanceMemoryService();
        break;
      case 'detailed':
        const { createDetailedMemoryService } = require('./memory.js');
        service = createDetailedMemoryService();
        break;
      case 'test':
        const { createTestMemoryService } = require('./memory.js');
        service = createTestMemoryService();
        break;
      default:
        const { createMemoryService } = require('./memory.js');
        service = createMemoryService(config.config);
    }
    
    this.services.set(key, service);
    return service as IMemoryService;
  }
  
  /**
   * Create security service
   */
  public createSecurityService(): ISecurityService {
    const key = 'security';
    if (this.services.has(key)) {
      return this.services.get(key);
    }
    
    const config = this.config.security!;
    if (!config.enabled) {
      throw new Error('Security service is disabled');
    }
    
    let service: SecurityService;
    switch (config.type) {
      case 'strict':
        const { createStrictSecurityService } = require('./security.js');
        service = createStrictSecurityService();
        break;
      case 'lenient':
        const { createLenientSecurityService } = require('./security.js');
        service = createLenientSecurityService();
        break;
      case 'test':
        const { createTestSecurityService } = require('./security.js');
        service = createTestSecurityService();
        break;
      default:
        const { createSecurityService } = require('./security.js');
        service = createSecurityService(config.config);
    }
    
    this.services.set(key, service);
    return service as ISecurityService;
  }
  
  /**
   * Create logger
   */
  public createLogger(): ILogger {
    const key = 'logger';
    if (this.services.has(key)) {
      return this.services.get(key);
    }
    
    const config = this.config.logger!;
    if (!config.enabled) {
      throw new Error('Logger is disabled');
    }
    
    let service: Logger;
    switch (config.type) {
      case 'performance':
        const { createPerformanceLogger } = require('../core/logger.js');
        service = createPerformanceLogger(config.config);
        break;
      case 'silent':
        const { createSilentLogger } = require('../core/logger.js');
        service = createSilentLogger();
        break;
      case 'test':
        const { createTestLogger } = require('../core/logger.js');
        service = createTestLogger();
        break;
      default:
        service = createLogger(config.config);
    }
    
    this.services.set(key, service);
    return service as ILogger;
  }
  
  /**
   * Create async lock
   */
  public createAsyncLock(): IAsyncLock {
    const key = 'asyncLock';
    if (this.services.has(key)) {
      return this.services.get(key);
    }
    
    const config = this.config.asyncLock!;
    if (!config.enabled) {
      throw new Error('Async lock is disabled');
    }
    
    let service: AsyncLock;
    switch (config.type) {
      case 'high-performance':
        const { createHighPerformanceAsyncLock } = require('../core/async-lock.js');
        service = createHighPerformanceAsyncLock();
        break;
      case 'test':
        const { createTestAsyncLock } = require('../core/async-lock.js');
        service = createTestAsyncLock();
        break;
      default:
        service = createAsyncLock(config.config);
    }
    
    this.services.set(key, service);
    return service as IAsyncLock;
  }
  
  /**
   * Create circuit breaker
   */
  public createCircuitBreaker(): ICircuitBreaker;
  public createCircuitBreaker(threshold: number, timeoutMs: number): ICircuitBreaker;
  public createCircuitBreaker(threshold?: number, timeoutMs?: number): ICircuitBreaker {
    // Use default values if parameters are not provided
    const defaultThreshold = 5;
    const defaultTimeoutMs = 60000;
    const actualThreshold = threshold ?? defaultThreshold;
    const actualTimeoutMs = timeoutMs ?? defaultTimeoutMs;
    
    const key = `circuitBreaker_${actualThreshold}_${actualTimeoutMs}`;
    if (this.services.has(key)) {
      return this.services.get(key);
    }
    
    const config = this.config.circuitBreaker!;
    if (!config.enabled) {
      throw new Error('Circuit breaker is disabled');
    }
    
    // Create circuit breaker config with provided parameters
    const circuitBreakerConfig = {
      ...config.config,
      failureThreshold: actualThreshold,
      recoveryTimeout: actualTimeoutMs
    };
    
    let service: CircuitBreaker;
    switch (config.type) {
      case 'fast-fail':
        const { createFastFailCircuitBreaker } = require('../core/circuit-breaker.js');
        service = createFastFailCircuitBreaker(circuitBreakerConfig);
        break;
      case 'adaptive':
        const { createAdaptiveCircuitBreaker } = require('../core/circuit-breaker.js');
        service = createAdaptiveCircuitBreaker(circuitBreakerConfig);
        break;
      case 'test':
        const { createTestCircuitBreaker } = require('../core/circuit-breaker.js');
        service = createTestCircuitBreaker(circuitBreakerConfig);
        break;
      default:
        service = createCircuitBreaker(circuitBreakerConfig);
    }
    
    this.services.set(key, service);
    return service as ICircuitBreaker;
  }
  
  /**
   * Create event emitter
   */
  public createEventEmitter(): IEventEmitter {
    const key = 'eventEmitter';
    if (this.services.has(key)) {
      return this.services.get(key);
    }
    
    const config = this.config.eventEmitter!;
    if (!config.enabled) {
      throw new Error('Event emitter is disabled');
    }
    
    let service: EventEmitter;
    switch (config.type) {
      case 'high-performance':
        const { createHighPerformanceEventEmitter } = require('../core/event-emitter.js');
        service = createHighPerformanceEventEmitter();
        break;
      case 'test':
        const { createTestEventEmitter } = require('../core/event-emitter.js');
        service = createTestEventEmitter();
        break;
      default:
        service = createEventEmitter(config.config);
    }
    
    this.services.set(key, service);
    return service as IEventEmitter;
  }
  
  /**
   * Create validator
   */
  public createValidator(): IValidator {
    const key = 'validator';
    if (this.services.has(key)) {
      return this.services.get(key);
    }
    
    const config = this.config.validator!;
    if (!config.enabled) {
      throw new Error('Validator is disabled');
    }
    
    let service: Validator;
    switch (config.type) {
      case 'strict':
        const { createStrictValidator } = require('../core/validator.js');
        service = createStrictValidator();
        break;
      case 'lenient':
        const { createLenientValidator } = require('../core/validator.js');
        service = createLenientValidator();
        break;
      case 'test':
        const { createTestValidator } = require('../core/validator.js');
        service = createTestValidator();
        break;
      default:
        service = createValidator(config.config);
    }
    
    this.services.set(key, service);
    return service as IValidator;
  }
  
  /**
   * Get all created services
   */
  public getServices(): ReadonlyMap<string, any> {
    return new Map(this.services);
  }
  
  /**
   * Check if a service exists
   */
  public hasService(name: string): boolean {
    return this.services.has(name);
  }
  
  /**
   * Destroy all services
   */
  public destroy(): void {
    for (const [name, service] of this.services) {
      if (service && typeof service.destroy === 'function') {
        try {
          service.destroy();
        } catch (error) {
          console.error(`Error destroying service ${name}:`, error);
        }
      }
    }
    
    this.services.clear();
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default service factory
 */
export function createServiceFactory(config?: ServiceFactoryConfig): ServiceFactory {
  return new ServiceFactory(config);
}

/**
 * Create a high-performance service factory
 */
export function createHighPerformanceServiceFactory(): ServiceFactory {
  return new ServiceFactory({
    metrics: { enabled: true, type: 'high-performance' },
    memory: { enabled: true, type: 'high-performance' },
    security: { enabled: true, type: 'default' },
    logger: { enabled: true, type: 'performance' },
    asyncLock: { enabled: true, type: 'high-performance' },
    circuitBreaker: { enabled: true, type: 'fast-fail' },
    eventEmitter: { enabled: true, type: 'high-performance' },
    validator: { enabled: true, type: 'default' }
  });
}

/**
 * Create a detailed service factory for development
 */
export function createDetailedServiceFactory(): ServiceFactory {
  return new ServiceFactory({
    metrics: { enabled: true, type: 'detailed' },
    memory: { enabled: true, type: 'detailed' },
    security: { enabled: true, type: 'strict' },
    logger: { enabled: true, type: 'default' },
    asyncLock: { enabled: true, type: 'default' },
    circuitBreaker: { enabled: true, type: 'adaptive' },
    eventEmitter: { enabled: true, type: 'default' },
    validator: { enabled: true, type: 'strict' }
  });
}

/**
 * Create a test service factory
 */
export function createTestServiceFactory(): ServiceFactory {
  return new ServiceFactory({
    metrics: { enabled: true, type: 'test' },
    memory: { enabled: true, type: 'test' },
    security: { enabled: true, type: 'test' },
    logger: { enabled: true, type: 'test' },
    asyncLock: { enabled: true, type: 'test' },
    circuitBreaker: { enabled: true, type: 'test' },
    eventEmitter: { enabled: true, type: 'test' },
    validator: { enabled: true, type: 'test' }
  });
}

/**
 * Global service factory instance
 */
export const globalServiceFactory = createServiceFactory();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Initialize all services with default configuration
 */
export function initializeServices(config?: ServiceFactoryConfig): {
  metrics: IMetricsService;
  memory: IMemoryService;
  security: ISecurityService;
  logger: ILogger;
  asyncLock: IAsyncLock;
  circuitBreaker: ICircuitBreaker;
  eventEmitter: IEventEmitter;
  validator: IValidator;
} {
  const factory = createServiceFactory(config);
  
  return {
    metrics: factory.createMetricsService(),
    memory: factory.createMemoryService(),
    security: factory.createSecurityService(),
    logger: factory.createLogger(),
    asyncLock: factory.createAsyncLock(),
    circuitBreaker: factory.createCircuitBreaker(5, 30000),
    eventEmitter: factory.createEventEmitter(),
    validator: factory.createValidator()
  };
}

/**
 * Initialize high-performance services
 */
export function initializeHighPerformanceServices() {
  return initializeServices({
    metrics: { enabled: true, type: 'high-performance' },
    memory: { enabled: true, type: 'high-performance' },
    security: { enabled: true, type: 'default' },
    logger: { enabled: true, type: 'performance' },
    asyncLock: { enabled: true, type: 'high-performance' },
    circuitBreaker: { enabled: true, type: 'fast-fail' },
    eventEmitter: { enabled: true, type: 'high-performance' },
    validator: { enabled: true, type: 'default' }
  });
}

/**
 * Initialize detailed services for development
 */
export function initializeDetailedServices() {
  return initializeServices({
    metrics: { enabled: true, type: 'detailed' },
    memory: { enabled: true, type: 'detailed' },
    security: { enabled: true, type: 'strict' },
    logger: { enabled: true, type: 'default' },
    asyncLock: { enabled: true, type: 'default' },
    circuitBreaker: { enabled: true, type: 'adaptive' },
    eventEmitter: { enabled: true, type: 'default' },
    validator: { enabled: true, type: 'strict' }
  });
}

/**
 * Initialize test services
 */
export function initializeTestServices() {
  return initializeServices({
    metrics: { enabled: true, type: 'test' },
    memory: { enabled: true, type: 'test' },
    security: { enabled: true, type: 'test' },
    logger: { enabled: true, type: 'test' },
    asyncLock: { enabled: true, type: 'test' },
    circuitBreaker: { enabled: true, type: 'test' },
    eventEmitter: { enabled: true, type: 'test' },
    validator: { enabled: true, type: 'test' }
  });
}