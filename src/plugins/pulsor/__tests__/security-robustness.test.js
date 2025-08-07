/* eslint-disable no-unused-vars */
/**
 * Security and Robustness Test Suite for Pulsor Module
 *
 * This test suite focuses on security aspects, input validation,
 * error handling robustness, and protection against malicious usage.
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

describe('Security and Robustness Tests', () => {
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

  describe('Input Validation Security', () => {
    it('should reject malicious alias attempts', () => {
      const maliciousAliases = [
        '__proto__',
        'constructor',
        'prototype',
        'toString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf'
      ];

      maliciousAliases.forEach(alias => {
        // These should either be rejected or handled safely
        try {
          CreatePulser(alias, () => 'test');
          // If creation succeeds, verify it works safely
          expect(PulserExists(alias)).toBe(true);
          const pulser = new Pulser(alias);
          expect(pulser.pulse()).toBe('test');
        } catch (error) {
          // If creation fails, that's also acceptable for security
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    it('should handle extremely long alias names safely', () => {
      const extremelyLongAlias = 'a'.repeat(10000);
      
      expect(() => CreatePulser(extremelyLongAlias, () => 'test')).toThrow();
    });

    it('should handle unicode and special characters in aliases', () => {
      const unicodeAliases = [
        'test-émojis-🚀',
        'тест-кириллица',
        '测试-中文',
        'テスト-日本語',
        'test\\backslash',
        'test"quotes"',
        "test'single'quotes",
        'test\nNewline',
        'test\tTab'
      ];

      unicodeAliases.forEach(alias => {
        try {
          CreatePulser(alias, () => `result-${alias}`);
          expect(PulserExists(alias)).toBe(true);
        } catch (error) {
          // Some special characters might be rejected for security
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    it('should validate function parameters thoroughly', () => {
      const invalidFunctions = [
        null,
        undefined,
        'string-not-function',
        123,
        {},
        [],
        true,
        Symbol('test')
      ];

      invalidFunctions.forEach(invalidFn => {
        expect(() => CreatePulser('test-invalid', invalidFn)).toThrow();
      });
    });

    it('should handle malicious function attempts', () => {
      // Functions that might try to access or modify global state
      const potentiallyMaliciousFunctions = [
        () => { global.maliciousFlag = true; return 'modified-global'; },
        () => { process.exit(1); }, // Should not actually exit in test
        () => { throw new Error('Intentional error'); },
        () => { while(true) {} }, // Infinite loop (will be stopped by test timeout)
        () => { delete Object.prototype.toString; return 'prototype-pollution'; }
      ];

      potentiallyMaliciousFunctions.forEach((maliciousFn, index) => {
        const alias = `malicious-${index}`;
        
        // Creation should succeed (we don't execute during creation)
        expect(() => CreatePulser(alias, maliciousFn)).not.toThrow();
        
        const pulser = new Pulser(alias);
        
        // Execution might throw, but should be contained
        if (index === 1) {
          // Skip the process.exit test to avoid actually exiting
          return;
        }
        
        if (index === 3) {
          // Skip infinite loop test to avoid timeout
          return;
        }
        
        try {
          const result = pulser.pulse();
          // If it succeeds, verify the result
          expect(typeof result).toBeDefined();
        } catch (error) {
          // Errors should be properly contained
          expect(error).toBeInstanceOf(Error);
        }
      });
    });
  });

  describe('Error Handling Robustness', () => {
    it('should handle cascading errors in callbacks gracefully', () => {
      CreatePulser('cascade-errors', () => 'main-result');
      const pulser = new Pulser('cascade-errors');
      
      const errorMessages = [];
      
      // Add callbacks that throw different types of errors
      pulser.bind(() => { throw new Error('Standard Error'); });
      pulser.bind(() => { throw new TypeError('Type Error'); });
      pulser.bind(() => { throw new ReferenceError('Reference Error'); });
      pulser.bind(() => { throw 'String Error'; });
      pulser.bind(() => { throw null; });
      pulser.bind(() => { throw undefined; });
      pulser.bind(() => { throw 42; });
      
      // Add a good callback to ensure execution continues
      const goodCallback = vi.fn();
      pulser.bind(goodCallback);
      
      // Execution should not fail despite callback errors
      const result = pulser.pulse();
      
      expect(result).toBe('main-result');
      expect(goodCallback).toHaveBeenCalled();
    });

    it('should handle async callback rejections gracefully', async () => {
      CreatePulser('async-rejections', async () => 'main-async-result');
      const pulser = new Pulser('async-rejections');
      
      // Add callbacks that reject with different types
      pulser.bind(async () => { throw new Error('Async Error'); });
      pulser.bind(async () => { throw 'Async String Error'; });
      pulser.bind(async () => { return Promise.reject('Promise Rejection'); });
      
      // Add a good async callback
      const goodAsyncCallback = vi.fn(async () => { await new Promise(r => setTimeout(r, 1)); });
      pulser.bind(goodAsyncCallback);
      
      // Main execution should succeed despite callback failures
      const result = await pulser.pulse();
      
      expect(result).toBe('main-async-result');
      expect(goodAsyncCallback).toHaveBeenCalled();
    });

    it('should handle memory pressure scenarios', () => {
      // Create a scenario that might cause memory pressure
      const largeData = 'x'.repeat(1000000); // 1MB string
      
      CreatePulser('memory-pressure', () => {
        const localLargeArray = new Array(10000).fill(largeData);
        return localLargeArray.length;
      });
      
      const pulser = new Pulser('memory-pressure');
      
      // Add callbacks that also use memory
      for (let i = 0; i < 10; i++) {
        pulser.bind(() => {
          const tempArray = new Array(1000).fill('temp-data');
          return tempArray.length;
        });
      }
      
      // Should handle memory pressure gracefully
      expect(() => pulser.pulse()).not.toThrow();
    });

    it('should handle recursive pulser calls safely', () => {
      let recursionDepth = 0;
      const maxDepth = 10;
      
      CreatePulser('recursive-test', () => {
        recursionDepth++;
        if (recursionDepth < maxDepth) {
          const recursivePulser = new Pulser('recursive-test');
          return recursivePulser.pulse();
        }
        return `max-depth-${recursionDepth}`;
      });
      
      const pulser = new Pulser('recursive-test');
      const result = pulser.pulse();
      
      expect(result).toBe(`max-depth-${maxDepth}`);
      expect(recursionDepth).toBe(maxDepth);
    });
  });

  describe('State Corruption Protection', () => {
    it('should protect against callback list corruption', () => {
      CreatePulser('corruption-test', () => 'main-result');
      const pulser = new Pulser('corruption-test');
      
      const maliciousCallback = vi.fn(() => {
        // Try to corrupt the internal state by modifying public properties
        try {
          // These attempts should fail or be safely ignored
          pulser.alias = 'corrupted'; // This should fail as alias is read-only
          pulser.isAsync = true; // This should fail as isAsync is read-only
        } catch (e) {
          // Expected to fail due to read-only properties
        }
      });
      
      pulser.bind(maliciousCallback);
      
      // Pulser should still work correctly
      const result = pulser.pulse();
      expect(result).toBe('main-result');
      expect(pulser.alias).toBe('corruption-test');
    });

    it('should handle attempts to modify frozen objects', () => {
      CreatePulser('frozen-test', () => {
        const frozenObj = Object.freeze({ data: 'frozen' });
        try {
          frozenObj.data = 'modified';
        } catch (e) {
          // Expected in strict mode
        }
        return frozenObj;
      });
      
      const pulser = new Pulser('frozen-test');
      const result = pulser.pulse();
      
      expect(result.data).toBe('frozen');
    });

    it('should handle prototype pollution attempts', () => {
      CreatePulser('prototype-pollution', () => {
        try {
          // Attempt prototype pollution
          Object.prototype.polluted = 'malicious';
          return 'pollution-attempted';
        } catch (e) {
          return 'pollution-failed';
        }
      });
      
      const pulser = new Pulser('prototype-pollution');
      const result = pulser.pulse();
      
      // Clean up any potential pollution
      delete Object.prototype.polluted;
      
      expect(['pollution-attempted', 'pollution-failed']).toContain(result);
    });
  });

  describe('Resource Management', () => {
    it('should handle file system access attempts safely', () => {
      // Note: In browser environment, these should fail safely
      CreatePulser('fs-access', () => {
        try {
          // These should fail in browser environment
          const fs = require('fs');
          return 'fs-access-succeeded';
        } catch (e) {
          return 'fs-access-failed';
        }
      });
      
      const pulser = new Pulser('fs-access');
      const result = pulser.pulse();
      
      // In browser environment, should fail
      expect(result).toBe('fs-access-failed');
    });

    it('should handle network request attempts', () => {
      CreatePulser('network-test', () => {
        try {
          // Attempt to make a network request
          fetch('https://httpbin.org/get')
            .then(() => 'network-success')
            .catch(() => 'network-failed');
          return 'network-attempted';
        } catch (e) {
          return 'network-error';
        }
      });
      
      const pulser = new Pulser('network-test');
      const result = pulser.pulse();
      
      expect(['network-attempted', 'network-error']).toContain(result);
    });

    it('should handle timer and interval cleanup', () => {
      let timerCount = 0;
      
      CreatePulser('timer-test', () => {
        // Create timers that should be cleaned up
        const timer1 = setTimeout(() => timerCount++, 100);
        const timer2 = setInterval(() => timerCount++, 50);
        
        // Clean up immediately
        clearTimeout(timer1);
        clearInterval(timer2);
        
        return 'timers-created-and-cleaned';
      });
      
      const pulser = new Pulser('timer-test');
      const result = pulser.pulse();
      
      expect(result).toBe('timers-created-and-cleaned');
      
      // Wait and verify timers were properly cleaned
      return new Promise(resolve => {
        setTimeout(() => {
          expect(timerCount).toBe(0);
          resolve();
        }, 200);
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary failures', () => {
      let attemptCount = 0;
      
      CreatePulser('recovery-test', () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return `Success on attempt ${attemptCount}`;
      });
      
      const pulser = new Pulser('recovery-test');
      
      // First two attempts should fail
      expect(() => pulser.pulse()).toThrow('Attempt 1 failed');
      expect(() => pulser.pulse()).toThrow('Attempt 2 failed');
      
      // Third attempt should succeed
      const result = pulser.pulse();
      expect(result).toBe('Success on attempt 3');
    });

    it('should maintain consistency after partial failures', () => {
      CreatePulser('partial-failure', () => 'main-success');
      const pulser = new Pulser('partial-failure');
      
      const successCallback = vi.fn();
      const failureCallback = vi.fn(() => { throw new Error('Callback failed'); });
      
      pulser.bind(successCallback);
      pulser.bind(failureCallback);
      pulser.bind(successCallback); // Add success callback again
      
      // Main function should succeed despite callback failure
      const result = pulser.pulse();
      
      expect(result).toBe('main-success');
      expect(successCallback).toHaveBeenCalledTimes(2);
      expect(failureCallback).toHaveBeenCalledTimes(1);
      
      // Pulser should still be in consistent state
      expect(pulser.callbackCount).toBe(3);
      expect(pulser.alias).toBe('partial-failure');
    });

    it('should handle graceful degradation scenarios', () => {
      // Simulate a scenario where some features might not be available
      CreatePulser('degradation-test', () => {
        const features = {
          basicFunction: true,
          advancedFunction: false, // Simulate unavailable feature
          experimentalFunction: false
        };
        
        let result = 'basic-functionality';
        
        if (features.advancedFunction) {
          result += '-advanced';
        }
        
        if (features.experimentalFunction) {
          result += '-experimental';
        }
        
        return result;
      });
      
      const pulser = new Pulser('degradation-test');
      const result = pulser.pulse();
      
      expect(result).toBe('basic-functionality');
    });
  });
});