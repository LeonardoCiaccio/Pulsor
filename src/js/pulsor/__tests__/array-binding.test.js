/**
 * Test Suite for Array Binding Functions (binds/unbinds)
 *
 * This test suite focuses on testing the new binds() and unbinds() methods
 * that allow binding and unbinding multiple callbacks at once using arrays.
 *
 * @requires vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CreatePulser,
  Pulser,
  DestroyAllPulsers,
  PulserExists
} from '../pulsor.js';

// --- Test Lifecycle Hooks ---

// Clean up all pulsers before each test
beforeEach(() => {
  try {
    DestroyAllPulsers();
  } catch (error) {
    // Ignore cleanup errors
  }
});

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// --- Test Utilities ---

const createMockCallback = (name) => vi.fn((...args) => `${name}: ${args.join(', ')}`);

describe('Array Binding Functions Tests', () => {

  describe('binds() method', () => {
    it('should bind multiple callbacks from an array', () => {
      CreatePulser('multi-bind-test', (data) => `main: ${data}`);
      const pulser = new Pulser('multi-bind-test');
      
      const callback1 = createMockCallback('callback1');
      const callback2 = createMockCallback('callback2');
      const callback3 = createMockCallback('callback3');
      
      const callbacks = [callback1, callback2, callback3];
      
      // Test method chaining
      const result = pulser.binds(callbacks);
      expect(result).toBe(pulser); // Should return the pulser for chaining
      
      // Test that all callbacks are executed
      pulser.pulse('test-data');
      
      expect(callback1).toHaveBeenCalledWith('test-data');
      expect(callback2).toHaveBeenCalledWith('test-data');
      expect(callback3).toHaveBeenCalledWith('test-data');
    });

    it('should handle empty array', () => {
      CreatePulser('empty-bind-test', () => 'main');
      const pulser = new Pulser('empty-bind-test');
      
      expect(() => pulser.binds([])).not.toThrow();
      
      // Should still work normally
      const result = pulser.pulse();
      expect(result).toBe('main');
    });

    it('should throw error for non-array input', () => {
      CreatePulser('invalid-bind-test', () => 'main');
      const pulser = new Pulser('invalid-bind-test');
      
      expect(() => pulser.binds('not-an-array')).toThrow(/Expected array of callbacks/);
      expect(() => pulser.binds(123)).toThrow(/Expected array of callbacks/);
      expect(() => pulser.binds(null)).toThrow(/Expected array of callbacks/);
      expect(() => pulser.binds(undefined)).toThrow(/Expected array of callbacks/);
    });

    it('should throw error for invalid callbacks in array', () => {
      CreatePulser('invalid-callback-test', () => 'main');
      const pulser = new Pulser('invalid-callback-test');
      
      const validCallback = createMockCallback('valid');
      const invalidCallbacks = [
        validCallback,
        'not-a-function', // Invalid at index 1
        createMockCallback('valid2')
      ];
      
      expect(() => pulser.binds(invalidCallbacks))
        .toThrow(/Error binding callback at index 1/);
    });

    it('should throw error for duplicate callbacks', () => {
      CreatePulser('duplicate-bind-test', () => 'main');
      const pulser = new Pulser('duplicate-bind-test');
      
      const callback = createMockCallback('duplicate');
      
      // First bind should succeed
      pulser.bind(callback);
      
      // Trying to bind the same callback again in array should fail
      expect(() => pulser.binds([callback]))
        .toThrow(/Error binding callback at index 0/);
    });

    it('should work with mixed function types', () => {
      CreatePulser('mixed-bind-test', (data) => `main: ${data}`);
      const pulser = new Pulser('mixed-bind-test');
      
      const arrowFn = (data) => `arrow: ${data}`;
      const regularFn = function(data) { return `regular: ${data}`; };
      const asyncFn = async (data) => `async: ${data}`;
      
      pulser.binds([arrowFn, regularFn, asyncFn]);
      
      pulser.pulse('test');
      
      // Note: async callback won't be awaited in sync pulse
      // but it should still be called
    });
  });

  describe('unbinds() method', () => {
    it('should unbind multiple callbacks from an array', () => {
      CreatePulser('multi-unbind-test', (data) => `main: ${data}`);
      const pulser = new Pulser('multi-unbind-test');
      
      const callback1 = createMockCallback('callback1');
      const callback2 = createMockCallback('callback2');
      const callback3 = createMockCallback('callback3');
      
      // First bind all callbacks
      pulser.binds([callback1, callback2, callback3]);
      
      // Test unbinding
      const removedCount = pulser.unbinds([callback1, callback3]);
      expect(removedCount).toBe(2);
      
      // Test that only callback2 is still bound
      pulser.pulse('test-data');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('test-data');
      expect(callback3).not.toHaveBeenCalled();
    });

    it('should handle empty array', () => {
      CreatePulser('empty-unbind-test', () => 'main');
      const pulser = new Pulser('empty-unbind-test');
      
      const removedCount = pulser.unbinds([]);
      expect(removedCount).toBe(0);
    });

    it('should throw error for non-array input', () => {
      CreatePulser('invalid-unbind-test', () => 'main');
      const pulser = new Pulser('invalid-unbind-test');
      
      expect(() => pulser.unbinds('not-an-array')).toThrow(/Expected array of callbacks/);
      expect(() => pulser.unbinds(123)).toThrow(/Expected array of callbacks/);
      expect(() => pulser.unbinds(null)).toThrow(/Expected array of callbacks/);
      expect(() => pulser.unbinds(undefined)).toThrow(/Expected array of callbacks/);
    });

    it('should return correct count for mixed existing/non-existing callbacks', () => {
      CreatePulser('mixed-unbind-test', () => 'main');
      const pulser = new Pulser('mixed-unbind-test');
      
      const boundCallback = createMockCallback('bound');
      const unboundCallback = createMockCallback('unbound');
      
      // Bind only one callback
      pulser.bind(boundCallback);
      
      // Try to unbind both (one exists, one doesn't)
      const removedCount = pulser.unbinds([boundCallback, unboundCallback]);
      expect(removedCount).toBe(1);
    });

    it('should handle invalid callbacks gracefully', () => {
      CreatePulser('invalid-callback-unbind-test', () => 'main');
      const pulser = new Pulser('invalid-callback-unbind-test');
      
      const validCallback = createMockCallback('valid');
      pulser.bind(validCallback);
      
      // Mix of valid and invalid callbacks
      const mixedCallbacks = [
        validCallback,
        'not-a-function',
        123
      ];
      
      // Should handle invalid callbacks without throwing
      // (unbind method validates each callback individually)
      expect(() => pulser.unbinds(mixedCallbacks)).toThrow();
    });
  });

  describe('Integration with existing bind/unbind methods', () => {
    it('should work seamlessly with individual bind/unbind', () => {
      CreatePulser('integration-test', (data) => `main: ${data}`);
      const pulser = new Pulser('integration-test');
      
      const callback1 = createMockCallback('callback1');
      const callback2 = createMockCallback('callback2');
      const callback3 = createMockCallback('callback3');
      const callback4 = createMockCallback('callback4');
      
      // Mix individual and array binding
      pulser.bind(callback1);
      pulser.binds([callback2, callback3]);
      pulser.bind(callback4);
      
      // Test all are bound
      pulser.pulse('test');
      
      expect(callback1).toHaveBeenCalledWith('test');
      expect(callback2).toHaveBeenCalledWith('test');
      expect(callback3).toHaveBeenCalledWith('test');
      expect(callback4).toHaveBeenCalledWith('test');
      
      // Mix individual and array unbinding
      pulser.unbind(callback1);
      const removedCount = pulser.unbinds([callback2, callback4]);
      expect(removedCount).toBe(2);
      
      // Reset mocks and test again
      vi.clearAllMocks();
      pulser.pulse('test2');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).toHaveBeenCalledWith('test2');
      expect(callback4).not.toHaveBeenCalled();
    });

    it('should work with unbindAll method', () => {
      CreatePulser('unbind-all-test', () => 'main');
      const pulser = new Pulser('unbind-all-test');
      
      const callbacks = [
        createMockCallback('cb1'),
        createMockCallback('cb2'),
        createMockCallback('cb3')
      ];
      
      pulser.binds(callbacks);
      
      // Verify all are bound
      pulser.pulse('before');
      callbacks.forEach(cb => expect(cb).toHaveBeenCalledWith('before'));
      
      // Clear all
      const removedCount = pulser.unbindAll();
      expect(removedCount).toBe(3);
      
      // Verify none are bound
      vi.clearAllMocks();
      pulser.pulse('after');
      callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled());
    });
  });

  describe('Performance considerations', () => {
    it('should handle large arrays efficiently', () => {
      CreatePulser('performance-test', () => 'main');
      const pulser = new Pulser('performance-test');
      
      // Create a large array of callbacks
      const callbacks = Array.from({ length: 100 }, (_, i) => 
        createMockCallback(`callback${i}`)
      );
      
      const startTime = performance.now();
      pulser.binds(callbacks);
      const bindTime = performance.now() - startTime;
      
      // Should complete reasonably quickly (adjust threshold as needed)
      expect(bindTime).toBeLessThan(100); // 100ms threshold
      
      // Test unbinding performance
      const unbindStartTime = performance.now();
      const removedCount = pulser.unbinds(callbacks);
      const unbindTime = performance.now() - unbindStartTime;
      
      expect(removedCount).toBe(100);
      expect(unbindTime).toBeLessThan(100); // 100ms threshold
    });
  });
});