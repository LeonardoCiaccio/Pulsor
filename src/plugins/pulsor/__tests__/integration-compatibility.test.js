/* eslint-disable no-unused-vars */
/**
 * Integration and Compatibility Test Suite for Pulsor Module
 *
 * This test suite focuses on integration scenarios, compatibility with
 * different environments, and interaction with external systems.
 *
 * @requires vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CreatePulser,
  DestroyPulser,
  ListPulsers,
  GetPulserInfo,
  PulserExists,
  Pulser,
  PulsorError
} from '../pulsor.js';

// Mock Logger to avoid external dependencies
vi.mock('./logger.class.js', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    format: vi.fn(msg => msg)
  }))
}));

describe('Integration and Compatibility Tests', () => {
  beforeEach(() => {
    // Clean up all pulsers before each test
    ListPulsers().forEach(alias => {
      try {
        DestroyPulser(alias);
      } catch (e) {
        // Ignore cleanup errors
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Framework Integration Tests', () => {
    it('should integrate with Promise-based workflows', async () => {
      CreatePulser('promise-workflow', async (data) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 10));
        return { processed: data, timestamp: Date.now() };
      });
      
      const pulser = new Pulser('promise-workflow');
      
      // Test Promise.all integration
      const promises = [
        pulser.pulse('data1'),
        pulser.pulse('data2'),
        pulser.pulse('data3')
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.processed).toBe(`data${index + 1}`);
        expect(result.timestamp).toBeTypeOf('number');
      });
    });

    it('should work with async/await patterns', async () => {
      CreatePulser('async-await-test', async (operation) => {
        switch (operation) {
          case 'fetch':
            await new Promise(resolve => setTimeout(resolve, 5));
            return { data: 'fetched' };
          case 'process':
            await new Promise(resolve => setTimeout(resolve, 10));
            return { data: 'processed' };
          case 'save':
            await new Promise(resolve => setTimeout(resolve, 3));
            return { data: 'saved' };
          default:
            throw new Error('Unknown operation');
        }
      });
      
      const pulser = new Pulser('async-await-test');
      
      // Sequential async operations
      const fetchResult = await pulser.pulse('fetch');
      expect(fetchResult.data).toBe('fetched');
      
      const processResult = await pulser.pulse('process');
      expect(processResult.data).toBe('processed');
      
      const saveResult = await pulser.pulse('save');
      expect(saveResult.data).toBe('saved');
    });

    it('should integrate with event-driven architectures', () => {
      const eventLog = [];
      
      CreatePulser('event-emitter', (eventType, data) => {
        eventLog.push({ type: eventType, data, timestamp: Date.now() });
        return `Event ${eventType} processed`;
      });
      
      const pulser = new Pulser('event-emitter');
      
      // Add event listeners as callbacks
      pulser.bind((eventType, data) => {
        if (eventType === 'user-action') {
          eventLog.push({ type: 'analytics', data: `User did: ${data}` });
        }
      });
      
      pulser.bind((eventType, data) => {
        if (eventType === 'error') {
          eventLog.push({ type: 'error-log', data: `Error: ${data}` });
        }
      });
      
      // Emit different types of events
      pulser.pulse('user-action', 'clicked-button');
      pulser.pulse('error', 'network-timeout');
      pulser.pulse('system', 'startup-complete');
      
      expect(eventLog).toHaveLength(5); // 3 main events + 2 callback events
      expect(eventLog.filter(e => e.type === 'analytics')).toHaveLength(1);
      expect(eventLog.filter(e => e.type === 'error-log')).toHaveLength(1);
    });

    it('should work with middleware patterns', () => {
      const middlewareLog = [];
      
      CreatePulser('middleware-test', (data) => {
        middlewareLog.push('main-function');
        return { result: data.toUpperCase() };
      });
      
      const pulser = new Pulser('middleware-test');
      
      // Add middleware-like callbacks
      pulser.bind((data) => {
        middlewareLog.push('auth-middleware');
        if (!data.includes('authorized')) {
          throw new Error('Unauthorized');
        }
      });
      
      pulser.bind((data) => {
        middlewareLog.push('logging-middleware');
        console.log(`Processing: ${data}`);
      });
      
      pulser.bind((data) => {
        middlewareLog.push('validation-middleware');
        if (data.length < 3) {
          throw new Error('Data too short');
        }
      });
      
      // Test successful middleware chain
      const result = pulser.pulse('authorized-data');
      expect(result.result).toBe('AUTHORIZED-DATA');
      expect(middlewareLog).toContain('auth-middleware');
      expect(middlewareLog).toContain('logging-middleware');
      expect(middlewareLog).toContain('validation-middleware');
      expect(middlewareLog).toContain('main-function');
    });
  });

  describe('Environment Compatibility Tests', () => {
    it('should handle different JavaScript environments', () => {
      // Test features that might vary across environments
      CreatePulser('env-test', () => {
        const features = {
          hasSetTimeout: typeof setTimeout !== 'undefined',
          hasPromise: typeof Promise !== 'undefined',
          hasAsyncFunction: (async () => {}).constructor.name === 'AsyncFunction',
          hasSymbol: typeof Symbol !== 'undefined',
          hasWeakMap: typeof WeakMap !== 'undefined',
          hasProxy: typeof Proxy !== 'undefined'
        };
        
        return features;
      });
      
      const pulser = new Pulser('env-test');
      const features = pulser.pulse();
      
      // In modern test environment, these should all be true
      expect(features.hasSetTimeout).toBe(true);
      expect(features.hasPromise).toBe(true);
      expect(features.hasAsyncFunction).toBe(true);
      expect(features.hasSymbol).toBe(true);
      expect(features.hasWeakMap).toBe(true);
      expect(features.hasProxy).toBe(true);
    });

    it('should handle different module systems', () => {
      // Test that the module works with different import patterns
      CreatePulser('module-test', () => {
        return {
          moduleType: typeof module !== 'undefined' ? 'CommonJS' : 'ES6',
          hasExports: typeof exports !== 'undefined',
          hasRequire: typeof require !== 'undefined',
          hasImportMeta: typeof import.meta !== 'undefined'
        };
      });
      
      const pulser = new Pulser('module-test');
      const moduleInfo = pulser.pulse();
      
      expect(moduleInfo.moduleType).toBeTypeOf('string');
    });

    it('should work with different execution contexts', () => {
      // Test different 'this' contexts
      const contexts = [];
      
      CreatePulser('context-test', function(contextName) {
        contexts.push({ name: contextName, thisType: typeof this });
        return `Context: ${contextName}`;
      });
      
      const pulser = new Pulser('context-test');
      
      // Test different ways of calling
      pulser.pulse('direct-call');
      
      const boundPulse = pulser.bound();
      boundPulse('bound-call');
      
      setTimeout(() => boundPulse('timeout-call'), 0);
      
      expect(contexts).toHaveLength(2); // Direct and bound calls
      contexts.forEach(context => {
        expect(context.thisType).toBeTypeOf('string');
      });
    });
  });

  describe('Third-Party Library Integration', () => {
    it('should work with mock libraries (vitest integration)', () => {
      const mockFn = vi.fn((data) => `mocked-${data}`);
      
      CreatePulser('mock-integration', mockFn);
      const pulser = new Pulser('mock-integration');
      
      const result = pulser.pulse('test-data');
      
      expect(result).toBe('mocked-test-data');
      expect(mockFn).toHaveBeenCalledWith('test-data');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should integrate with utility libraries patterns', () => {
      // Simulate lodash-like utility integration
      const utilityFunctions = {
        map: (arr, fn) => arr.map(fn),
        filter: (arr, predicate) => arr.filter(predicate),
        reduce: (arr, reducer, initial) => arr.reduce(reducer, initial)
      };
      
      CreatePulser('utility-integration', (operation, data, ...args) => {
        if (utilityFunctions[operation]) {
          return utilityFunctions[operation](data, ...args);
        }
        throw new Error(`Unknown operation: ${operation}`);
      });
      
      const pulser = new Pulser('utility-integration');
      
      // Test map operation
      const mapResult = pulser.pulse('map', [1, 2, 3], x => x * 2);
      expect(mapResult).toEqual([2, 4, 6]);
      
      // Test filter operation
      const filterResult = pulser.pulse('filter', [1, 2, 3, 4, 5], x => x % 2 === 0);
      expect(filterResult).toEqual([2, 4]);
      
      // Test reduce operation
      const reduceResult = pulser.pulse('reduce', [1, 2, 3, 4], (acc, val) => acc + val, 0);
      expect(reduceResult).toBe(10);
    });

    it('should work with validation libraries patterns', () => {
      // Simulate joi/yup-like validation integration
      const validationSchemas = {
        user: (data) => {
          if (!data.name || typeof data.name !== 'string') {
            throw new Error('Name is required and must be string');
          }
          if (!data.email || !data.email.includes('@')) {
            throw new Error('Valid email is required');
          }
          return true;
        },
        product: (data) => {
          if (!data.title || data.title.length < 3) {
            throw new Error('Title must be at least 3 characters');
          }
          if (!data.price || data.price <= 0) {
            throw new Error('Price must be positive number');
          }
          return true;
        }
      };
      
      CreatePulser('validation-integration', (schema, data) => {
        if (validationSchemas[schema]) {
          validationSchemas[schema](data);
          return { valid: true, data };
        }
        throw new Error(`Unknown schema: ${schema}`);
      });
      
      const pulser = new Pulser('validation-integration');
      
      // Test valid user data
      const validUser = pulser.pulse('user', { name: 'John', email: 'john@example.com' });
      expect(validUser.valid).toBe(true);
      
      // Test invalid user data
      expect(() => pulser.pulse('user', { name: 'John' })).toThrow('Valid email is required');
      
      // Test valid product data
      const validProduct = pulser.pulse('product', { title: 'Test Product', price: 29.99 });
      expect(validProduct.valid).toBe(true);
    });
  });

  describe('Performance Integration Tests', () => {
    it('should integrate with performance monitoring', () => {
      const performanceMetrics = [];
      
      CreatePulser('perf-monitoring', (operation) => {
        const startTime = performance.now();
        
        // Simulate different operations with different complexities
        switch (operation) {
          case 'light':
            for (let i = 0; i < 1000; i++) { /* light work */ }
            break;
          case 'medium':
            for (let i = 0; i < 10000; i++) { /* medium work */ }
            break;
          case 'heavy':
            for (let i = 0; i < 100000; i++) { /* heavy work */ }
            break;
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        performanceMetrics.push({ operation, duration });
        
        return { operation, duration };
      });
      
      const pulser = new Pulser('perf-monitoring');
      
      // Add performance tracking callback
      pulser.bind((operation) => {
        const metric = performanceMetrics[performanceMetrics.length - 1];
        if (metric && metric.duration > 10) {
          console.warn(`Slow operation detected: ${operation} took ${metric.duration}ms`);
        }
      });
      
      // Test different performance scenarios
      pulser.pulse('light');
      pulser.pulse('medium');
      pulser.pulse('heavy');
      
      expect(performanceMetrics).toHaveLength(3);
      expect(performanceMetrics[0].operation).toBe('light');
      expect(performanceMetrics[1].operation).toBe('medium');
      expect(performanceMetrics[2].operation).toBe('heavy');
    });

    it('should handle memory-intensive operations', () => {
      CreatePulser('memory-intensive', (size) => {
        // Create arrays of different sizes to test memory handling
        const data = new Array(size).fill(0).map((_, i) => ({
          id: i,
          data: `item-${i}`,
          timestamp: Date.now()
        }));
        
        // Process the data
        const processed = data.filter(item => item.id % 2 === 0)
                             .map(item => ({ ...item, processed: true }));
        
        return {
          originalSize: data.length,
          processedSize: processed.length,
          memoryUsage: process.memoryUsage ? process.memoryUsage() : 'not-available'
        };
      });
      
      const pulser = new Pulser('memory-intensive');
      
      // Test with different data sizes
      const smallResult = pulser.pulse(100);
      expect(smallResult.originalSize).toBe(100);
      expect(smallResult.processedSize).toBe(50);
      
      const mediumResult = pulser.pulse(1000);
      expect(mediumResult.originalSize).toBe(1000);
      expect(mediumResult.processedSize).toBe(500);
    });
  });

  describe('Error Integration Tests', () => {
    it('should integrate with error tracking systems', () => {
      const errorLog = [];
      
      CreatePulser('error-tracking', (shouldFail) => {
        if (shouldFail) {
          throw new Error('Intentional test error');
        }
        return 'success';
      });
      
      const pulser = new Pulser('error-tracking');
      
      // Add error tracking callback
      pulser.bind((shouldFail) => {
        try {
          // This callback runs regardless of main function success/failure
          errorLog.push({
            timestamp: Date.now(),
            operation: 'error-tracking',
            shouldFail,
            status: 'callback-executed'
          });
        } catch (e) {
          errorLog.push({
            timestamp: Date.now(),
            operation: 'error-tracking',
            error: e.message,
            status: 'callback-failed'
          });
        }
      });
      
      // Test successful operation
      const successResult = pulser.pulse(false);
      expect(successResult).toBe('success');
      
      // Test failed operation
      expect(() => pulser.pulse(true)).toThrow('Intentional test error');
      
      // Verify error tracking worked
      expect(errorLog).toHaveLength(2);
      expect(errorLog[0].shouldFail).toBe(false);
      expect(errorLog[1].shouldFail).toBe(true);
    });

    it('should handle integration with retry mechanisms', async () => {
      let attemptCount = 0;
      const maxRetries = 3;
      
      CreatePulser('retry-integration', async (operation) => {
        attemptCount++;
        
        if (operation === 'flaky' && attemptCount < maxRetries) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        
        return `Success on attempt ${attemptCount}`;
      });
      
      const pulser = new Pulser('retry-integration');
      
      // Simulate retry logic
      let result;
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          result = await pulser.pulse('flaky');
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw error;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      expect(result).toBe(`Success on attempt ${maxRetries}`);
      expect(attemptCount).toBe(maxRetries);
    });
  });
});