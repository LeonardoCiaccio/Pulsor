/* eslint-disable no-unused-vars */
/**
 * Test Suite for Pulsor Factory Wrapper Function
 *
 * This test suite focuses on testing the Pulsor factory function that allows
 * creating Pulser instances without using the 'new' keyword.
 *
 * @requires vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CreatePulser,
  DestroyPulser,
  ListPulsers,
  Pulsor, // Factory function
  Pulser  // Class
} from '../pulsor.js';

// --- Test Lifecycle Hooks ---

// Clean up all pulsers before each test
beforeEach(() => {
  const existingPulsers = ListPulsers();
  existingPulsers.forEach(alias => {
    try {
      DestroyPulser(alias);
    } catch {
      // Ignore errors during cleanup
    }
  });
});

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// --- Test Utilities ---

const createMockFunction = (returnValue = 'test-result') => vi.fn(() => returnValue);
const createMockAsyncFunction = (returnValue = 'async-test-result') => vi.fn(async () => returnValue);

describe('Pulsor Factory Wrapper Tests', () => {

  describe('Basic Factory Function Behavior', () => {

    it('should create a Pulser instance without using new keyword', () => {
      CreatePulser('wrapper-test', createMockFunction());

      // Use factory function instead of new Pulser()
      const pulser = Pulsor('wrapper-test');

      expect(pulser).toBeInstanceOf(Pulser);
      expect(pulser.alias).toBe('wrapper-test');
    });

    it('should throw PulsorError when alias does not exist', () => {
      expect(() => Pulsor('non-existent-alias')).toThrow();
    });

    it('should return equivalent instance to new Pulser()', () => {
      CreatePulser('equivalence-test', createMockFunction('same-result'));

      const factoryInstance = Pulsor('equivalence-test');
      const classInstance = new Pulser('equivalence-test');

      // Both should have same properties
      expect(factoryInstance.alias).toBe(classInstance.alias);
      expect(factoryInstance.isAsync).toBe(classInstance.isAsync);
      expect(factoryInstance.callbackCount).toBe(classInstance.callbackCount);

      // Both should produce same results
      expect(factoryInstance.pulse()).toBe('same-result');
      expect(classInstance.pulse()).toBe('same-result');
    });
  });

  describe('Method Chaining Support', () => {

    it('should support method chaining with bind()', () => {
      CreatePulser('chain-test', createMockFunction('chain-result'));
      const callback = vi.fn();

      // Test fluent interface
      const result = Pulsor('chain-test')
        .bind(callback)
        .pulse('test-data');

      expect(result).toBe('chain-result');
      expect(callback).toHaveBeenCalledWith('test-data');
    });

    it('should support multiple bind() calls in chain', () => {
      CreatePulser('multi-chain-test', createMockFunction());
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      Pulsor('multi-chain-test')
        .bind(callback1)
        .bind(callback2)
        .bind(callback3)
        .pulse('multi-data');

      expect(callback1).toHaveBeenCalledWith('multi-data');
      expect(callback2).toHaveBeenCalledWith('multi-data');
      expect(callback3).toHaveBeenCalledWith('multi-data');
    });

    it('should support bound() method in chain', () => {
      CreatePulser('bound-chain-test', (x) => x * 2);

      const boundPulse = Pulsor('bound-chain-test').bound();

      expect(typeof boundPulse).toBe('function');
      expect(boundPulse(5)).toBe(10);
    });
  });

  describe('Async Pulser Factory Support', () => {

    it('should work with async pulsers', async () => {
      CreatePulser('async-wrapper-test', createMockAsyncFunction('async-result'), { isAsync: true });

      const asyncPulser = Pulsor('async-wrapper-test');

      expect(asyncPulser.isAsync).toBe(true);

      const result = await asyncPulser.pulse();
      expect(result).toBe('async-result');
    });

    it('should support async method chaining', async () => {
      CreatePulser('async-chain-test', createMockAsyncFunction('async-chain-result'), { isAsync: true });
      const asyncCallback = vi.fn();

      const result = await Pulsor('async-chain-test')
        .bind(asyncCallback)
        .pulse('async-data');

      expect(result).toBe('async-chain-result');
      expect(asyncCallback).toHaveBeenCalledWith('async-data');
    });
  });

  describe('Functional Programming Style', () => {

    it('should enable functional composition patterns', () => {
      CreatePulser('compose-test', (x) => x + 10);

      const addTen = (data) => Pulsor('compose-test').pulse(data);
      const processData = (data) => addTen(data) * 2;

      expect(processData(5)).toBe(30); // (5 + 10) * 2
    });

    it('should work in array operations', () => {
      CreatePulser('map-test', (x) => x.toUpperCase());

      const words = ['hello', 'world', 'test'];
      const upperWords = words.map(word => Pulsor('map-test').pulse(word));

      expect(upperWords).toEqual(['HELLO', 'WORLD', 'TEST']);
    });

    it('should support immediate execution pattern', () => {
      CreatePulser('immediate-test', createMockFunction('immediate-result'));

      // One-liner execution without storing instance
      const result = Pulsor('immediate-test').pulse();

      expect(result).toBe('immediate-result');
    });
  });

  describe('Error Handling and Edge Cases', () => {

    it('should handle errors in the same way as class constructor', () => {
      // Both should throw the same error for non-existent alias
      expect(() => Pulsor('missing-alias')).toThrow();
      expect(() => new Pulser('missing-alias')).toThrow();
    });

    it('should maintain error context in chained operations', () => {
      CreatePulser('error-chain-test', () => {
        throw new Error('Test error');
      });

      expect(() => {
        Pulsor('error-chain-test')
          .bind(() => console.log('This should not run'))
          .pulse();
      }).toThrow('Test error');
    });

    it('should handle special characters in alias names', () => {
      const specialAlias = 'test-with-special_chars.123';
      CreatePulser(specialAlias, createMockFunction());

      expect(() => Pulsor(specialAlias)).not.toThrow();
      expect(Pulsor(specialAlias).alias).toBe(specialAlias);
    });
  });

  describe('Performance and Memory', () => {

    it('should not create memory leaks with repeated factory calls', () => {
      CreatePulser('memory-test', createMockFunction());

      // Create many instances
      const instances = [];
      for (let i = 0; i < 100; i++) {
        instances.push(Pulsor('memory-test'));
      }

      // All should reference the same underlying pulser
      expect(instances.every(instance => instance.alias === 'memory-test')).toBe(true);

      // Cleanup should work normally
      DestroyPulser('memory-test');
      expect(() => Pulsor('memory-test')).toThrow();
    });

    it('should have minimal performance overhead compared to class constructor', () => {
      CreatePulser('perf-test', createMockFunction());

      const startFactory = performance.now();
      for (let i = 0; i < 1000; i++) {
        Pulsor('perf-test');
      }
      const factoryTime = performance.now() - startFactory;

      const startClass = performance.now();
      for (let i = 0; i < 1000; i++) {
        new Pulser('perf-test');
      }
      const classTime = performance.now() - startClass;

      // Factory should not be significantly slower (allow 50% overhead)
      expect(factoryTime).toBeLessThan(classTime * 1.5);
    });
  });

  describe('Integration with Existing Pulsor Ecosystem', () => {

    it('should work seamlessly with CreatePulser return value', () => {
      // CreatePulser returns a Pulser instance
      const createdPulser = CreatePulser('integration-test', createMockFunction('integration-result'));

      // Factory function should create equivalent instance
      const factoryPulser = Pulsor('integration-test');

      expect(createdPulser.alias).toBe(factoryPulser.alias);
      expect(createdPulser.pulse()).toBe(factoryPulser.pulse());
    });

    it('should maintain callback bindings across different access methods', () => {
      CreatePulser('callback-integration-test', createMockFunction());
      const callback = vi.fn();

      // Bind callback using class constructor
      const classInstance = new Pulser('callback-integration-test');
      classInstance.bind(callback);

      // Access same pulser using factory and pulse
      Pulsor('callback-integration-test').pulse('test-data');

      expect(callback).toHaveBeenCalledWith('test-data');
    });

    it('should work with all Pulsor management functions', () => {
      CreatePulser('management-test', createMockFunction());

      // Factory instance should work with management functions
      const factoryInstance = Pulsor('management-test');

      expect(ListPulsers()).toContain('management-test');
      expect(() => DestroyPulser('management-test')).not.toThrow();
      expect(() => Pulsor('management-test')).toThrow(); // Should be destroyed
    });
  });
});
