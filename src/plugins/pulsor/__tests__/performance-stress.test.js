/* eslint-disable no-unused-vars */
/**
 * Performance and Stress Test Suite for Pulsor Module
 *
 * This test suite focuses on performance, memory management, stress testing,
 * and concurrency scenarios that are not covered in the main test suite.
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

describe('Performance and Stress Tests', () => {
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

  describe('Performance Tests', () => {
    it('should handle rapid pulser creation and destruction efficiently', () => {
      const startTime = performance.now();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        CreatePulser(`perf-test-${i}`, () => `result-${i}`);
      }

      expect(ListPulsers().length).toBe(iterations);

      for (let i = 0; i < iterations; i++) {
        DestroyPulser(`perf-test-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(ListPulsers().length).toBe(0);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle rapid pulse execution efficiently', () => {
      const executions = 10000;
      let counter = 0;
      
      CreatePulser('rapid-pulse', () => {
        counter++;
        return counter;
      });
      
      const pulser = new Pulser('rapid-pulse');
      const startTime = performance.now();

      for (let i = 0; i < executions; i++) {
        pulser.pulse();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(counter).toBe(executions);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle many callbacks efficiently', () => {
      const callbackCount = 1000;
      const callbacks = [];
      
      CreatePulser('many-callbacks', () => 'main-result');
      const pulser = new Pulser('many-callbacks');

      // Add many callbacks
      for (let i = 0; i < callbackCount; i++) {
        const callback = vi.fn();
        callbacks.push(callback);
        pulser.bind(callback);
      }

      expect(pulser.callbackCount).toBe(callbackCount);

      const startTime = performance.now();
      pulser.pulse('test-arg');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify all callbacks were called
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledWith('test-arg');
      });

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('Memory Management Tests', () => {
    it('should properly clean up callbacks when pulser is destroyed', () => {
      const callbacks = [];
      
      CreatePulser('memory-test', () => 'result');
      const pulser = new Pulser('memory-test');

      // Add callbacks with references
      for (let i = 0; i < 100; i++) {
        const callback = vi.fn();
        callbacks.push(callback);
        pulser.bind(callback);
      }

      expect(pulser.callbackCount).toBe(100);

      // Destroy the pulser
      DestroyPulser('memory-test');

      // Verify cleanup
      expect(ListPulsers()).not.toContain('memory-test');
      
      // Create new pulser with same alias - should have no callbacks
      CreatePulser('memory-test', () => 'new-result');
      const newPulser = new Pulser('memory-test');
      expect(newPulser.callbackCount).toBe(0);
    });

    it('should handle callback unbinding without memory leaks', () => {
      CreatePulser('unbind-test', () => 'result');
      const pulser = new Pulser('unbind-test');
      const callbacks = [];

      // Add many callbacks
      for (let i = 0; i < 500; i++) {
        const callback = vi.fn();
        callbacks.push(callback);
        pulser.bind(callback);
      }

      expect(pulser.callbackCount).toBe(500);

      // Unbind half of them
      for (let i = 0; i < 250; i++) {
        pulser.unbind(callbacks[i]);
      }

      expect(pulser.callbackCount).toBe(250);

      // Pulse and verify only remaining callbacks are called
      pulser.pulse();
      
      for (let i = 0; i < 250; i++) {
        expect(callbacks[i]).not.toHaveBeenCalled();
      }
      for (let i = 250; i < 500; i++) {
        expect(callbacks[i]).toHaveBeenCalled();
      }
    });
  });

  describe('Stress Tests', () => {
    it('should handle maximum alias length stress test', () => {
      const maxLength = 32;
      const longAlias = 'a'.repeat(maxLength);
      
      expect(() => CreatePulser(longAlias, () => 'test')).not.toThrow();
      expect(PulserExists(longAlias)).toBe(true);
      
      const pulser = new Pulser(longAlias);
      expect(pulser.pulse()).toBe('test');
    });

    it('should handle stress test with mixed sync/async operations', async () => {
      const operations = 100;
      const promises = [];
      
      // Create mix of sync and async pulsers
      for (let i = 0; i < operations; i++) {
        if (i % 2 === 0) {
          CreatePulser(`sync-${i}`, (val) => `sync-${val}`);
        } else {
          CreatePulser(`async-${i}`, async (val) => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return `async-${val}`;
          });
        }
      }

      // Execute all pulsers simultaneously
      for (let i = 0; i < operations; i++) {
        const alias = i % 2 === 0 ? `sync-${i}` : `async-${i}`;
        const pulser = new Pulser(alias);
        
        if (i % 2 === 0) {
          // Sync execution
          const result = pulser.pulse(i);
          expect(result).toBe(`sync-${i}`);
        } else {
          // Async execution
          promises.push(
            pulser.pulse(i).then(result => {
              expect(result).toBe(`async-${i}`);
            })
          );
        }
      }

      // Wait for all async operations to complete
      await Promise.all(promises);
    });

    it('should handle rapid bind/unbind operations', () => {
      CreatePulser('bind-stress', () => 'result');
      const pulser = new Pulser('bind-stress');

      // Rapid bind/unbind cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        // Bind phase
        const callbacks = [];
        for (let i = 0; i < 100; i++) {
          const callback = vi.fn();
          callbacks.push(callback);
          pulser.bind(callback);
        }
        
        expect(pulser.callbackCount).toBe(100);
        
        // Unbind phase
        callbacks.forEach(callback => {
          pulser.unbind(callback);
        });
        
        expect(pulser.callbackCount).toBe(0);
      }
    });
  });

  describe('Concurrency and Race Condition Tests', () => {
    it('should handle concurrent pulser creation attempts', () => {
      const promises = [];
      const alias = 'concurrent-test';
      
      // Attempt to create the same pulser concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise((resolve, reject) => {
            try {
              CreatePulser(alias, () => `result-${i}`);
              resolve(i);
            } catch (error) {
              resolve(error.message);
            }
          })
        );
      }

      return Promise.all(promises).then(results => {
        // Only one should succeed, others should fail
        const successes = results.filter(r => typeof r === 'number');
        const failures = results.filter(r => typeof r === 'string');
        
        expect(successes.length).toBe(1);
        expect(failures.length).toBe(9);
        expect(PulserExists(alias)).toBe(true);
      });
    });

    it('should handle concurrent callback modifications during execution', () => {
      CreatePulser('concurrent-callbacks', () => 'main-result');
      const pulser = new Pulser('concurrent-callbacks');
      
      const callbacks = [];
      let executionCount = 0;
      
      // Add initial callbacks
      for (let i = 0; i < 50; i++) {
        const callback = vi.fn(() => {
          executionCount++;
          
          // Some callbacks try to modify the callback list during execution
          if (i % 10 === 0 && callbacks.length > 0) {
            try {
              // Try to add a new callback during execution
              const newCallback = vi.fn();
              pulser.bind(newCallback);
            } catch (e) {
              // Expected to potentially fail due to concurrent modification
            }
          }
        });
        
        callbacks.push(callback);
        pulser.bind(callback);
      }

      // Execute the pulser
      const result = pulser.pulse();
      
      expect(result).toBe('main-result');
      expect(executionCount).toBeGreaterThan(0);
      
      // Verify the pulser is still in a consistent state
      expect(pulser.callbackCount).toBeGreaterThanOrEqual(50);
    });

    it('should handle async callback execution order', async () => {
      CreatePulser('async-order', async () => 'main-async-result');
      const pulser = new Pulser('async-order');
      
      const executionOrder = [];
      const delays = [50, 10, 30, 5, 25]; // Different delays to test ordering
      
      delays.forEach((delay, index) => {
        const callback = vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, delay));
          executionOrder.push(index);
        });
        pulser.bind(callback);
      });

      await pulser.pulse();
      
      // Wait a bit more to ensure all callbacks complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify all callbacks executed (order may vary due to async nature)
      expect(executionOrder.length).toBe(5);
      expect(executionOrder).toEqual(expect.arrayContaining([0, 1, 2, 3, 4]));
    });
  });

  describe('Edge Case Stress Tests', () => {
    it('should handle empty string edge cases in validation', () => {
      expect(() => CreatePulser('', () => 'test')).toThrow();
      expect(() => CreatePulser('   ', () => 'test')).toThrow();
      expect(() => CreatePulser('\t\n', () => 'test')).toThrow();
    });

    it('should handle special characters in alias names', () => {
      const specialAliases = [
        'test-with-dashes',
        'test_with_underscores',
        'test.with.dots',
        'test123numbers',
        'MixedCaseTest'
      ];

      specialAliases.forEach(alias => {
        expect(() => CreatePulser(alias, () => `result-${alias}`)).not.toThrow();
        expect(PulserExists(alias)).toBe(true);
        
        const pulser = new Pulser(alias);
        expect(pulser.pulse()).toBe(`result-${alias}`);
      });
    });

    it('should handle function with complex return types', () => {
      const complexReturnTypes = [
        { alias: 'return-object', fn: () => ({ key: 'value', nested: { data: 123 } }) },
        { alias: 'return-array', fn: () => [1, 2, 3, 'string', { obj: true }] },
        { alias: 'return-null', fn: () => null },
        { alias: 'return-undefined', fn: () => undefined },
        { alias: 'return-function', fn: () => () => 'nested-function' },
        { alias: 'return-promise', fn: () => Promise.resolve('promise-result') }
      ];

      complexReturnTypes.forEach(({ alias, fn }) => {
        CreatePulser(alias, fn);
        const pulser = new Pulser(alias);
        const result = pulser.pulse();
        
        // Just verify it doesn't throw and returns something
        expect(() => pulser.pulse()).not.toThrow();
      });
    });
  });
});