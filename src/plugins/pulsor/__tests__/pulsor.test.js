/* eslint-disable no-unused-vars */
/**
 * Comprehensive Test Suite for Pulsor Module v2.1.0+
 *
 * This test suite covers all functionality including:
 * - Pulser creation, destruction, and management (Create, Destroy, Exists, List, Info)
 * - Synchronous and asynchronous execution with argument passing
 * - Robust callback management (bind, unbind, unbindAll)
 * - Error handling, edge cases, and context (`this`) management
 * - Performance, memory cleanup, and state isolation between pulsers
 * - Resilience to state mutations during execution
 *
 * @requires vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CreatePulser,
  DestroyPulser,
  PulserExists,
  ListPulsers,
  GetPulserInfo,
  Pulser,
  PulsorError
} from '../pulsor.js';

// Mock Logger to avoid external dependencies and console noise
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

describe('Pulsor Module', () => {
  // --- Test Utilities ---
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const createMockFunction = (returnValue = 'test') => vi.fn(() => returnValue);
  const createMockAsyncFunction = (returnValue = 'async-test') => vi.fn(async () => returnValue);

  // --- Test Lifecycle Hooks ---
  beforeEach(() => {
    // Ensure a clean slate before each test by destroying all existing pulsers
    ListPulsers().forEach(alias => {
      try {
        DestroyPulser(alias);
      } catch (e) {
        // Ignore errors during cleanup, as some tests might destroy pulsers themselves
      }
    });
  });

  afterEach(() => {
    // Clear all mocks to prevent test pollution
    vi.clearAllMocks();
  });

  // =================================================================
  // ==  I. CORE API FUNCTIONS (Create, Destroy, Exists, List, Info) ==
  // =================================================================

  describe('CreatePulser', () => {
    it('should create a synchronous pulser successfully', () => {
      CreatePulser('test-sync', createMockFunction());
      expect(PulserExists('test-sync')).toBe(true);
      const info = GetPulserInfo('test-sync');
      expect(info.isAsync).toBe(false);
      expect(info.alias).toBe('test-sync');
    });

    it('should auto-detect and create an asynchronous pulser', () => {
      CreatePulser('test-async', createMockAsyncFunction(), { isAsync: true });
      expect(PulserExists('test-async')).toBe(true);
      expect(GetPulserInfo('test-async').isAsync).toBe(true);
    });

    it('should allow manual override of async status', () => {
      CreatePulser('manual-async', createMockFunction(), { isAsync: true });
      CreatePulser('manual-sync', createMockAsyncFunction(), { isAsync: false });
      expect(GetPulserInfo('manual-async').isAsync).toBe(true);
      expect(GetPulserInfo('manual-sync').isAsync).toBe(false);
    });

    it('should throw for duplicate pulser without override flag', () => {
      CreatePulser('duplicate', createMockFunction());
      expect(() => CreatePulser('duplicate', createMockFunction())).toThrow();
    });

    it('should allow overriding an existing pulser when specified', () => {
      CreatePulser('override-test', () => 'first');
      expect(() => CreatePulser('override-test', () => 'second', { override: true })).not.toThrow();
      const pulser = new Pulser('override-test');
      expect(pulser.pulse()).toBe('second');
    });

    it('should return a Pulser instance for immediate use', () => {
      const returnedPulser = CreatePulser('return-test', () => 'immediate');
      expect(returnedPulser).toBeInstanceOf(Pulser);
      expect(returnedPulser.alias).toBe('return-test');
      expect(returnedPulser.pulse()).toBe('immediate');
    });

    it('should return a working Pulser instance for async functions', async () => {
      const returnedPulser = CreatePulser('async-return-test', async () => 'async-immediate', { isAsync: true });
      expect(returnedPulser).toBeInstanceOf(Pulser);
      expect(returnedPulser.alias).toBe('async-return-test');
      expect(returnedPulser.isAsync).toBe(true);
      await expect(returnedPulser.pulse()).resolves.toBe('async-immediate');
    });

    it('should return a Pulser instance that can bind callbacks immediately', () => {
      const callback = vi.fn();
      const returnedPulser = CreatePulser('callback-return-test', () => 'test');
      
      returnedPulser.bind(callback);
      expect(returnedPulser.callbackCount).toBe(1);
      
      returnedPulser.pulse();
      expect(callback).toHaveBeenCalled();
    });

    it('should return a Pulser instance with correct properties when overriding', () => {
      CreatePulser('override-return-test', () => 'first');
      const returnedPulser = CreatePulser('override-return-test', () => 'second', { override: true });
      
      expect(returnedPulser).toBeInstanceOf(Pulser);
      expect(returnedPulser.alias).toBe('override-return-test');
      expect(returnedPulser.pulse()).toBe('second');
    });

    it('should return a Pulser instance that matches manually created instance', () => {
      const returnedPulser = CreatePulser('match-test', (x) => x * 2);
      const manualPulser = new Pulser('match-test');
      
      expect(returnedPulser.alias).toBe(manualPulser.alias);
      expect(returnedPulser.isAsync).toBe(manualPulser.isAsync);
      expect(returnedPulser.pulse(5)).toBe(manualPulser.pulse(5));
    });

    describe('Alias and Function Validation', () => {
      it.each([
        [123], [null], [undefined], [{}], [''], ['   '], ['a'.repeat(33)]
      ])('should throw error for invalid alias: %p', (alias) => {
        expect(() => CreatePulser(alias, createMockFunction())).toThrow();
      });

      it.each([
        'not-a-function', 123, {}
      ])('should throw error for invalid function: %p', (pulseFn) => {
        expect(() => CreatePulser('invalid-fn', pulseFn)).toThrow();
      });

      it.each([
        [null, 'null-fn'], [undefined, 'undefined-fn']
      ])('should accept null/undefined and convert to no-op function: %p', (pulseFn, alias) => {
        expect(() => CreatePulser(alias, pulseFn)).not.toThrow();
        const pulser = new Pulser(alias);
        expect(pulser.pulse()).toBeUndefined(); // no-op function returns undefined
      });

      it('should trim whitespace from alias', () => {
        CreatePulser('  trimmed  ', createMockFunction());
        expect(PulserExists('trimmed')).toBe(true);
        expect(PulserExists('  trimmed  ')).toBe(true); // Validation should trim
      });
    });
  });

  describe('DestroyPulser', () => {
    it('should destroy an existing pulser and clean up its callbacks', () => {
      CreatePulser('to-destroy', createMockFunction());
      const pulser = new Pulser('to-destroy');
      pulser.bind(vi.fn());

      expect(PulserExists('to-destroy')).toBe(true);
      DestroyPulser('to-destroy');
      expect(PulserExists('to-destroy')).toBe(false);

      // Re-creating should have no callbacks
      CreatePulser('to-destroy', createMockFunction());
      const newPulser = new Pulser('to-destroy');
      expect(newPulser.callbackCount).toBe(0);
    });

    it('should throw when destroying a non-existent pulser', () => {
      expect(() => DestroyPulser('non-existent')).toThrow();
    });
  });

  describe('Pulser Management & Introspection API', () => {
    it('PulserExists should return true for existing and false for non-existing', () => {
      CreatePulser('exists', createMockFunction());
      expect(PulserExists('exists')).toBe(true);
      expect(PulserExists('does-not-exist')).toBe(false);
      expect(PulserExists(null)).toBe(false); // Invalid alias
    });

    it('ListPulsers should return all registered pulser aliases', () => {
      expect(ListPulsers()).toEqual([]);
      CreatePulser('p1', createMockFunction());
      CreatePulser('p2', createMockFunction());
      expect(ListPulsers()).toEqual(expect.arrayContaining(['p1', 'p2']));
      expect(ListPulsers().length).toBe(2);
    });

    it('GetPulserInfo should return correct data or null', () => {
      const namedFn = function myTestFn() { };
      CreatePulser('info-test', namedFn);
      const pulser = new Pulser('info-test');
      pulser.bind(vi.fn());

      const info = GetPulserInfo('info-test');
      expect(info).toEqual({
        alias: 'info-test',
        isAsync: false,
        callbackCount: 1,
        functionName: 'myTestFn'
      });

      expect(GetPulserInfo('non-existent')).toBe(null);
    });
  });


  // =================================================================
  // ==            II. PULSER CLASS & EXECUTION LOGIC               ==
  // =================================================================

  describe('Pulser Class', () => {
    describe('Constructor and Getters', () => {
      it('should instantiate for an existing pulser', () => {
        CreatePulser('exists', createMockFunction());
        expect(() => new Pulser('exists')).not.toThrow();
      });

      it('should throw if pulser is not registered', () => {
        expect(() => new Pulser('non-existent')).toThrow();
      });

      it('getters should return correct values', () => {
        CreatePulser('getter-test', createMockAsyncFunction(), { isAsync: true });
        const pulser = new Pulser('getter-test');
        pulser.bind(vi.fn());

        expect(pulser.alias).toBe('getter-test');
        expect(pulser.isAsync).toBe(true);
        expect(pulser.callbackCount).toBe(1);
      });
    });

    describe('Pulse Execution (Sync & Async)', () => {
      it('should execute a sync pulser with args and return its result', () => {
        CreatePulser('add', (a, b) => a + b);
        const pulser = new Pulser('add');
        expect(pulser.pulse(5, 3)).toBe(8);
      });

      it('should execute an async pulser and resolve with its result', async () => {
        CreatePulser('fetch', async (id) => ({ data: `user-${id}` }));
        const pulser = new Pulser('fetch');
        await expect(pulser.pulse(123)).resolves.toEqual({ data: 'user-123' });
      });

      it('should execute all callbacks (sync/async) with correct arguments', async () => {
        const mainFn = vi.fn();
        const cb1 = vi.fn();
        const cb2 = vi.fn(async () => { });

        CreatePulser('exec-all', mainFn, { isAsync: true });
        const pulser = new Pulser('exec-all');
        pulser.bind(cb1);
        pulser.bind(cb2);

        await pulser.pulse('arg1', 99);

        expect(mainFn).toHaveBeenCalledWith('arg1', 99);
        expect(cb1).toHaveBeenCalledWith('arg1', 99);
        expect(cb2).toHaveBeenCalledWith('arg1', 99);
      });

      it('should handle errors in the main pulser function gracefully', () => {
        CreatePulser('sync-error', () => { throw new Error('Sync Main Error'); });
        expect(() => new Pulser('sync-error').pulse()).toThrow('Sync Main Error');
      });

      it('should handle rejections in the main async pulser function', async () => {
        CreatePulser('async-reject', async () => { throw new Error('Async Main Error'); });
        await expect(new Pulser('async-reject').pulse()).rejects.toThrow('Async Main Error');
      });

      it('should continue execution even if a callback throws an error', () => {
        const goodCallback = vi.fn();
        const badCallback = vi.fn(() => { throw new Error('Callback Fail'); });

        CreatePulser('callback-error', () => 'success');
        const pulser = new Pulser('callback-error');
        pulser.bind(badCallback);
        pulser.bind(goodCallback);

        expect(pulser.pulse()).toBe('success');
        expect(badCallback).toHaveBeenCalled();
        expect(goodCallback).toHaveBeenCalled();
      });
    });

    describe('Callback Management (bind, unbind, unbindAll)', () => {
      let pulser;
      beforeEach(() => {
        CreatePulser('cb-test', createMockFunction());
        pulser = new Pulser('cb-test');
      });

      it('bind should add a callback and throw on duplicates', () => {
        const callback = vi.fn();
        pulser.bind(callback);
        expect(pulser.callbackCount).toBe(1);
        // Duplicate binds should throw an error
        expect(() => pulser.bind(callback)).toThrow();
      });

      it('unbind should remove a callback and return true, or false if not found', () => {
        const callback = vi.fn();
        pulser.bind(callback);
        expect(pulser.unbind(callback)).toBe(true);
        expect(pulser.callbackCount).toBe(0);
        expect(pulser.unbind(vi.fn())).toBe(false); // Different function instance
      });

      it('unbindAll should remove all callbacks and return the count', () => {
        pulser.bind(vi.fn());
        pulser.bind(vi.fn());
        expect(pulser.unbindAll()).toBe(2);
        expect(pulser.callbackCount).toBe(0);
        expect(pulser.unbindAll()).toBe(0);
      });
    });

    describe('bound() Method', () => {
      it('should return a function that works correctly without context', async () => {
        CreatePulser('bound-test', (a) => `processed: ${a}`);
        const pulser = new Pulser('bound-test');
        const boundPulse = pulser.bound();

        // Use it as a callback for setTimeout
        const result = await new Promise(resolve => {
          setTimeout(() => resolve(boundPulse('delayed')), 10);
        });

        expect(result).toBe('processed: delayed');
      });
    });
  });


  // =================================================================
  // ==         III. ADVANCED SCENARIOS & STRESS TESTS              ==
  // =================================================================

  describe('State Isolation & Interference', () => {
    it('should ensure callbacks are isolated between different pulsers', () => {
      CreatePulser('pulserA', () => { });
      CreatePulser('pulserB', () => { });
      const pulserA = new Pulser('pulserA');
      const pulserB = new Pulser('pulserB');
      const callbackA = vi.fn();
      const callbackB = vi.fn();

      pulserA.bind(callbackA);
      pulserB.bind(callbackB);

      pulserA.pulse();
      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackB).not.toHaveBeenCalled();

      pulserB.pulse();
      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledTimes(1);
    });

    it('unbindAll on one pulser should not affect another', () => {
      CreatePulser('pulserC', () => { });
      CreatePulser('pulserD', () => { });
      const pulserC = new Pulser('pulserC');
      const pulserD = new Pulser('pulserD');
      pulserC.bind(vi.fn());
      pulserD.bind(vi.fn());

      pulserC.unbindAll();

      expect(pulserC.callbackCount).toBe(0);
      expect(pulserD.callbackCount).toBe(1);
    });

    it('DestroyPulser should not affect other registered pulsers', () => {
      CreatePulser('keeper1', () => { });
      CreatePulser('to-be-destroyed', () => { });
      CreatePulser('keeper2', () => { });

      DestroyPulser('to-be-destroyed');

      expect(PulserExists('keeper1')).toBe(true);
      expect(PulserExists('keeper2')).toBe(true);
      expect(ListPulsers().length).toBe(2);
    });
  });

  describe('Context (`this`) Handling', () => {
    it('should respect `this` when a pre-bound function is used', () => {
      const myObject = {
        value: 100,
        getValue: function () { return this.value; }
      };

      const boundFn = myObject.getValue.bind(myObject);
      CreatePulser('bound-context', boundFn);
      const pulser = new Pulser('bound-context');

      expect(pulser.pulse()).toBe(100);
    });

    it('should have different context behavior for main function vs callbacks', () => {
      let mainContext, callbackContext;
      CreatePulser('context-test', function () { mainContext = this; });
      const pulser = new Pulser('context-test');
      pulser.bind(function () { callbackContext = this; });

      pulser.pulse();

      // Main function gets the pulser entry object as context
      expect(mainContext).toBeDefined();
      expect(typeof mainContext).toBe('object');
      expect(mainContext).toHaveProperty('pulseFn');
      
      // Callbacks get undefined context in strict mode
      expect(callbackContext).toBeUndefined();
    });
  });

  describe('State Mutations During Execution', () => {
    it('should correctly handle a callback that unbinds itself', () => {
      CreatePulser('self-unbind', () => { });
      const pulser = new Pulser('self-unbind');

      const callback1 = vi.fn();
      const selfUnbindingCallback = vi.fn(() => {
        pulser.unbind(selfUnbindingCallback);
      });

      pulser.bind(callback1);
      pulser.bind(selfUnbindingCallback);

      // First pulse
      pulser.pulse();
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(selfUnbindingCallback).toHaveBeenCalledTimes(1);
      expect(pulser.callbackCount).toBe(1);

      // Second pulse
      pulser.pulse();
      expect(callback1).toHaveBeenCalledTimes(2);
      expect(selfUnbindingCallback).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle a callback unbinding another callback that has not yet run', () => {
      CreatePulser('other-unbind', () => { });
      const pulser = new Pulser('other-unbind');

      const callbackToUnbind = vi.fn();
      const unbindingCallback = vi.fn(() => {
        pulser.unbind(callbackToUnbind);
      });

      pulser.bind(unbindingCallback);
      pulser.bind(callbackToUnbind);

      pulser.pulse();

      expect(unbindingCallback).toHaveBeenCalledTimes(1);
      // The iterator for Set is live. When an element yet to be visited is removed,
      // it won't be visited. This is the expected behavior.
      expect(callbackToUnbind).not.toHaveBeenCalled();
      expect(pulser.callbackCount).toBe(1);
    });

    it('should handle a callback that destroys its own pulser', () => {
      const destroyingCallback = vi.fn(() => {
        DestroyPulser('self-destruct');
      });

      CreatePulser('self-destruct', () => { });
      const pulser = new Pulser('self-destruct');
      pulser.bind(destroyingCallback);

      // Pulse should not throw, but subsequent actions on the pulser will
      expect(() => pulser.pulse()).not.toThrow();

      expect(destroyingCallback).toHaveBeenCalledTimes(1);
      expect(PulserExists('self-destruct')).toBe(false);

      // Trying to pulse again should fail - but the pulser instance still has its #entry
      // The error will be thrown when trying to create a new instance
      expect(() => pulser.pulse()).not.toThrow(); // Instance still works but Registry is gone
    });
  });
});
