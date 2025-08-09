/* eslint-disable no-unused-vars */
/**
 * Test Suite for Async Function Auto-Detection in Pulsor Module
 *
 * This test suite specifically focuses on testing the auto-detection capabilities
 * of async functions and edge cases that might not be properly handled.
 *
 * @requires vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CreatePulser,
  DestroyPulser,
  ListPulsers,
  GetPulserInfo,
  Pulser
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

describe('Async Function Auto-Detection', () => {
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

  describe('Current Auto-Detection Method (constructor.name)', () => {
    it('should correctly detect standard async functions', () => {
      const asyncFn = async () => 'test';
      CreatePulser('test-async', asyncFn);

      const info = GetPulserInfo('test-async');
      expect(info.isAsync).toBe(true);
      expect(asyncFn.constructor.name).toBe('AsyncFunction');
    });

    it('should correctly detect standard sync functions', () => {
      const syncFn = () => 'test';
      CreatePulser('test-sync', syncFn);

      const info = GetPulserInfo('test-sync');
      expect(info.isAsync).toBe(false);
      expect(syncFn.constructor.name).toBe('Function');
    });

    it('should handle arrow async functions', () => {
      const arrowAsync = async () => 'arrow-async';
      CreatePulser('arrow-async', arrowAsync);

      const info = GetPulserInfo('arrow-async');
      expect(info.isAsync).toBe(true);
    });

    it('should handle regular function declarations', () => {
      async function declaredAsync() {
        return 'declared-async';
      }

      function declaredSync() {
        return 'declared-sync';
      }

      CreatePulser('declared-async', declaredAsync);
      CreatePulser('declared-sync', declaredSync);

      expect(GetPulserInfo('declared-async').isAsync).toBe(true);
      expect(GetPulserInfo('declared-sync').isAsync).toBe(false);
    });
  });

  describe('Edge Cases and Potential Issues', () => {
    it('should handle bound async functions', () => {
      const obj = {
        value: 42,
        async getValue() {
          return this.value;
        }
      };

      const boundAsync = obj.getValue.bind(obj);
      CreatePulser('bound-async', boundAsync);

      const info = GetPulserInfo('bound-async');
      console.log('Bound async function constructor name:', boundAsync.constructor.name);

      // Surprising result: bound functions actually KEEP their AsyncFunction constructor!
      expect(boundAsync.constructor.name).toBe('AsyncFunction'); // They maintain their type!
      expect(info.isAsync).toBe(true); // Current implementation works correctly!
    });

    it('should handle functions created with Function constructor', () => {
      // eslint-disable-next-line no-new-func
      const dynamicAsync = new Function('return async function() { return "dynamic"; }')();
      // eslint-disable-next-line no-new-func
      const dynamicSync = new Function('return function() { return "dynamic"; }')();

      CreatePulser('dynamic-async', dynamicAsync);
      CreatePulser('dynamic-sync', dynamicSync);

      console.log('Dynamic async constructor name:', dynamicAsync.constructor.name);
      console.log('Dynamic sync constructor name:', dynamicSync.constructor.name);

      expect(GetPulserInfo('dynamic-async').isAsync).toBe(true);
      expect(GetPulserInfo('dynamic-sync').isAsync).toBe(false);
    });

    it('should handle functions that return promises but are not async', () => {
      const promiseReturningFn = () => Promise.resolve('promise-result');
      CreatePulser('promise-fn', promiseReturningFn);

      const info = GetPulserInfo('promise-fn');
      // This should be false since it's not an async function, even though it returns a promise
      expect(info.isAsync).toBe(false);
    });

    it('should handle async generator functions', () => {
      async function* asyncGenerator() {
        yield 'first';
        yield 'second';
      }

      CreatePulser('async-gen', asyncGenerator);

      console.log('Async generator constructor name:', asyncGenerator.constructor.name);
      const info = GetPulserInfo('async-gen');

      // AsyncGeneratorFunction should be detected as async
      expect(asyncGenerator.constructor.name).toBe('AsyncGeneratorFunction');
      expect(info.isAsync).toBe(true); // Now works with improved implementation!
    });

    it('should handle regular generator functions', () => {
      function* regularGenerator() {
        yield 'first';
        yield 'second';
      }

      CreatePulser('reg-gen', regularGenerator);

      console.log('Regular generator constructor name:', regularGenerator.constructor.name);
      const info = GetPulserInfo('reg-gen');

      expect(regularGenerator.constructor.name).toBe('GeneratorFunction');
      expect(info.isAsync).toBe(false);
    });
  });

  describe('Manual Override Behavior', () => {
    it('should allow forcing async mode on sync functions', () => {
      const syncFn = () => 'sync-forced-async';
      CreatePulser('sync-forced', syncFn, { isAsync: true });

      const info = GetPulserInfo('sync-forced');
      expect(info.isAsync).toBe(true);
    });

    it('should allow forcing sync mode on async functions', () => {
      const asyncFn = async () => 'async-forced-sync';
      CreatePulser('async-forced', asyncFn, { isAsync: false });

      const info = GetPulserInfo('async-forced');
      expect(info.isAsync).toBe(false);
    });

    it('should prioritize manual override over auto-detection', () => {
      const asyncFn = async () => 'test';

      // Test both directions
      CreatePulser('override-to-sync', asyncFn, { isAsync: false });
      CreatePulser('override-to-async', () => 'test', { isAsync: true });

      expect(GetPulserInfo('override-to-sync').isAsync).toBe(false);
      expect(GetPulserInfo('override-to-async').isAsync).toBe(true);
    });
  });

  describe('Execution Behavior with Auto-Detection', () => {
    it('should execute auto-detected async functions correctly', async () => {
      const asyncFn = async (value) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `async-${value}`;
      };

      CreatePulser('auto-async', asyncFn);
      const pulser = new Pulser('auto-async');

      const result = await pulser.pulse('test');
      expect(result).toBe('async-test');
    });

    it('should execute auto-detected sync functions correctly', () => {
      const syncFn = (value) => `sync-${value}`;

      CreatePulser('auto-sync', syncFn);
      const pulser = new Pulser('auto-sync');

      const result = pulser.pulse('test');
      expect(result).toBe('sync-test');
    });

    it('should execute auto-detected async generator functions correctly', async () => {
      async function* asyncGenFn(prefix) {
        yield `${prefix}-first`;
        await new Promise(resolve => setTimeout(resolve, 5));
        yield `${prefix}-second`;
        return `${prefix}-done`;
      }

      CreatePulser('auto-async-gen', asyncGenFn);
      const pulser = new Pulser('auto-async-gen');

      // Async generators return an AsyncGenerator object
      const generator = await pulser.pulse('test');
      expect(generator).toBeDefined();
      expect(typeof generator.next).toBe('function');

      // Test the generator works
      const first = await generator.next();
      expect(first.value).toBe('test-first');
      expect(first.done).toBe(false);

      const second = await generator.next();
      expect(second.value).toBe('test-second');
      expect(second.done).toBe(false);

      const final = await generator.next();
      expect(final.value).toBe('test-done');
      expect(final.done).toBe(true);
    });
  });

  describe('Proposed Improvements', () => {
    it('should document better async detection methods', () => {
      // This test documents potential improvements to async detection

      const testFunctions = [
        { fn: async () => { }, name: 'arrow async', expectedAsync: true },
        { fn: () => { }, name: 'arrow sync', expectedAsync: false },
        { fn: async function () { }, name: 'function async', expectedAsync: true },
        { fn: function () { }, name: 'function sync', expectedAsync: false },
        { fn: (async () => { }).bind({}), name: 'bound async', expectedAsync: true },
        { fn: (() => { }).bind({}), name: 'bound sync', expectedAsync: false },
      ];

      testFunctions.forEach(({ fn, name, expectedAsync }) => {
        console.log(`\n${name}:`);
        console.log('  constructor.name:', fn.constructor.name);
        console.log('  toString() includes "async":', fn.toString().includes('async'));
        console.log('  expected async:', expectedAsync);

        // Alternative detection method: check function string
        const stringBasedDetection = fn.toString().trim().startsWith('async');
        console.log('  string-based detection:', stringBasedDetection);
      });

      // This test always passes - it's for documentation
      expect(true).toBe(true);
    });
  });
});
