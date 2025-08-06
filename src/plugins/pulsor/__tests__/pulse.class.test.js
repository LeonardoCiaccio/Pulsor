import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Pulse, PulseAsync } from '../pulse.class.js';
import { Logger } from '../logger.class.js';

// Mock the Logger class
vi.mock('../logger.class.js', () => {
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    format: vi.fn((message) => `MockLogger: ${message}`)
  };

  return {
    Logger: vi.fn().mockImplementation(() => mockLogger)
  };
});

describe('Pulse Class Tests', () => {
  let mockPulser;
  let mockLogger;

  beforeEach(() => {
    mockPulser = vi.fn();
    mockLogger = {
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      format: vi.fn((message) => `[Pulse](test): ${message}`)
    };
    Logger.mockImplementation(() => mockLogger);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor Validation', () => {
    it('should create a Pulse instance with valid parameters', () => {
      const pulse = new Pulse('test', mockPulser);

      expect(Logger).toHaveBeenCalledWith('[Pulse](test)', {});
      expect(mockLogger.log).toHaveBeenCalledWith('Instance created');
      expect(pulse).toBeInstanceOf(Pulse);
    });

    it('should create a Pulse instance with logger services', () => {
      const loggerServices = { debug: true, info: false };
      const pulse = new Pulse('test', mockPulser, loggerServices);

      expect(Logger).toHaveBeenCalledWith('[Pulse](test)', loggerServices);
      expect(pulse).toBeInstanceOf(Pulse);
    });

    it('should throw error for empty alias', () => {
      expect(() => new Pulse('', mockPulser)).toThrow('Alias cannot be empty or contain only whitespace');
    });

    it('should throw error for whitespace-only alias', () => {
      expect(() => new Pulse('   ', mockPulser)).toThrow('Alias cannot be empty or contain only whitespace');
    });

    it('should throw error for null alias', () => {
      expect(() => new Pulse(null, mockPulser)).toThrow('Alias cannot be empty or contain only whitespace');
    });

    it('should throw error for undefined alias', () => {
      expect(() => new Pulse(undefined, mockPulser)).toThrow('Alias cannot be empty or contain only whitespace');
    });

    it('should trim alias whitespace', () => {
      const pulse = new Pulse('  test  ', mockPulser);

      expect(Logger).toHaveBeenCalledWith('[Pulse](test)', {});
      expect(pulse).toBeInstanceOf(Pulse);
    });

    it('should throw error for non-function pulser', () => {
      expect(() => new Pulse('test', 'not-a-function')).toThrow('Pulser must be a function');
    });

    it('should throw error for null pulser', () => {
      expect(() => new Pulse('test', null)).toThrow('Pulser must be a function');
    });

    it('should throw error for undefined pulser', () => {
      expect(() => new Pulse('test', undefined)).toThrow('Pulser must be a function');
    });

    it('should throw error for object pulser', () => {
      expect(() => new Pulse('test', {})).toThrow('Pulser must be a function');
    });

    it('should throw error for array pulser', () => {
      expect(() => new Pulse('test', [])).toThrow('Pulser must be a function');
    });
  });

  describe('Emit Functionality', () => {
    let pulse;

    beforeEach(() => {
      pulse = new Pulse('test', mockPulser);
      vi.clearAllMocks(); // Clear constructor calls
    });

    it('should emit pulser without arguments', () => {
      pulse.emit();

      expect(mockPulser).toHaveBeenCalledTimes(1);
      expect(mockPulser).toHaveBeenCalledWith();
      expect(mockLogger.log).toHaveBeenCalledWith('Pulser emitted');
    });

    it('should emit pulser with single argument', () => {
      const arg = 'test-arg';
      pulse.emit(arg);

      expect(mockPulser).toHaveBeenCalledTimes(1);
      expect(mockPulser).toHaveBeenCalledWith(arg);
      expect(mockLogger.log).toHaveBeenCalledWith('Pulser emitted');
    });

    it('should emit pulser with multiple arguments', () => {
      const args = ['arg1', 'arg2', 'arg3'];
      pulse.emit(...args);

      expect(mockPulser).toHaveBeenCalledTimes(1);
      expect(mockPulser).toHaveBeenCalledWith(...args);
      expect(mockLogger.log).toHaveBeenCalledWith('Pulser emitted');
    });

    it('should emit pulser with complex arguments', () => {
      const complexArgs = [{ key: 'value' }, [1, 2, 3], null, undefined, 42];
      pulse.emit(...complexArgs);

      expect(mockPulser).toHaveBeenCalledTimes(1);
      expect(mockPulser).toHaveBeenCalledWith(...complexArgs);
    });

    it('should handle pulser that throws error', () => {
      const errorPulser = vi.fn(() => {
        throw new Error('Pulser error');
      });
      const pulse = new Pulse('test', errorPulser);

      expect(() => pulse.emit()).toThrow('Pulser error');
      expect(errorPulser).toHaveBeenCalledTimes(1);
    });

    it('should emit multiple times', () => {
      pulse.emit('first');
      pulse.emit('second');
      pulse.emit('third');

      expect(mockPulser).toHaveBeenCalledTimes(3);
      expect(mockPulser).toHaveBeenNthCalledWith(1, 'first');
      expect(mockPulser).toHaveBeenNthCalledWith(2, 'second');
      expect(mockPulser).toHaveBeenNthCalledWith(3, 'third');
      expect(mockLogger.log).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle special characters in alias', () => {
      const specialAlias = 'test-alias_123!@#';
      const pulse = new Pulse(specialAlias, mockPulser);

      expect(Logger).toHaveBeenCalledWith(`[Pulse](${specialAlias})`, {});
      expect(pulse).toBeInstanceOf(Pulse);
    });

    it('should handle unicode characters in alias', () => {
      const unicodeAlias = 'test-🚀-alias';
      const pulse = new Pulse(unicodeAlias, mockPulser);

      expect(Logger).toHaveBeenCalledWith(`[Pulse](${unicodeAlias})`, {});
      expect(pulse).toBeInstanceOf(Pulse);
    });

    it('should handle arrow function as pulser', () => {
      const arrowPulser = () => 'arrow function';
      const pulse = new Pulse('test', arrowPulser);

      expect(pulse).toBeInstanceOf(Pulse);
    });

    it('should handle async function as pulser (but not await)', () => {
      const asyncPulser = vi.fn(async () => 'async function');
      const pulse = new Pulse('test', asyncPulser);

      pulse.emit();
      expect(asyncPulser).toHaveBeenCalledTimes(1);
    });

    it('should handle function with return value', () => {
      const returningPulser = vi.fn(() => 'return value');
      const pulse = new Pulse('test', returningPulser);

      pulse.emit();
      expect(returningPulser).toHaveBeenCalledTimes(1);
    });
  });
});

describe('PulseAsync Class Tests', () => {
  let mockAsyncPulser;
  let mockLogger;

  beforeEach(() => {
    mockAsyncPulser = vi.fn().mockResolvedValue('async result');
    mockLogger = {
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      format: vi.fn((message) => `[PulseAsync](test): ${message}`)
    };
    Logger.mockImplementation(() => mockLogger);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor Validation', () => {
    it('should create a PulseAsync instance with valid parameters', () => {
      const pulseAsync = new PulseAsync('test', mockAsyncPulser);

      expect(Logger).toHaveBeenCalledWith('[PulseAsync](test)', {});
      expect(mockLogger.log).toHaveBeenCalledWith('Instance created');
      expect(pulseAsync).toBeInstanceOf(PulseAsync);
    });

    it('should create a PulseAsync instance with logger services', () => {
      const loggerServices = { debug: true, info: false };
      const pulseAsync = new PulseAsync('test', mockAsyncPulser, loggerServices);

      expect(Logger).toHaveBeenCalledWith('[PulseAsync](test)', loggerServices);
      expect(pulseAsync).toBeInstanceOf(PulseAsync);
    });

    it('should throw error for invalid alias (same as Pulse)', () => {
      expect(() => new PulseAsync('', mockAsyncPulser)).toThrow('Alias cannot be empty or contain only whitespace');
      expect(() => new PulseAsync('   ', mockAsyncPulser)).toThrow('Alias cannot be empty or contain only whitespace');
      expect(() => new PulseAsync(null, mockAsyncPulser)).toThrow('Alias cannot be empty or contain only whitespace');
    });

    it('should throw error for invalid pulser (same as Pulse)', () => {
      expect(() => new PulseAsync('test', 'not-a-function')).toThrow('Pulser must be a function');
      expect(() => new PulseAsync('test', null)).toThrow('Pulser must be a function');
      expect(() => new PulseAsync('test', {})).toThrow('Pulser must be a function');
    });
  });

  describe('Async Emit Functionality', () => {
    let pulseAsync;

    beforeEach(() => {
      pulseAsync = new PulseAsync('test', mockAsyncPulser);
      vi.clearAllMocks(); // Clear constructor calls
    });

    it('should emit async pulser without arguments', async () => {
      await pulseAsync.emit();

      expect(mockAsyncPulser).toHaveBeenCalledTimes(1);
      expect(mockAsyncPulser).toHaveBeenCalledWith();
      expect(mockLogger.log).toHaveBeenCalledWith('Pulser emitted asynchronously');
    });

    it('should emit async pulser with single argument', async () => {
      const arg = 'test-arg';
      await pulseAsync.emit(arg);

      expect(mockAsyncPulser).toHaveBeenCalledTimes(1);
      expect(mockAsyncPulser).toHaveBeenCalledWith(arg);
      expect(mockLogger.log).toHaveBeenCalledWith('Pulser emitted asynchronously');
    });

    it('should emit async pulser with multiple arguments', async () => {
      const args = ['arg1', 'arg2', 'arg3'];
      await pulseAsync.emit(...args);

      expect(mockAsyncPulser).toHaveBeenCalledTimes(1);
      expect(mockAsyncPulser).toHaveBeenCalledWith(...args);
      expect(mockLogger.log).toHaveBeenCalledWith('Pulser emitted asynchronously');
    });

    it('should handle async pulser that rejects', async () => {
      const rejectingPulser = vi.fn().mockRejectedValue(new Error('Async error'));
      const pulseAsync = new PulseAsync('test', rejectingPulser);

      await expect(pulseAsync.emit()).rejects.toThrow('Async error');
      expect(rejectingPulser).toHaveBeenCalledTimes(1);
    });

    it('should handle async pulser with delayed resolution', async () => {
      const delayedPulser = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('delayed'), 10))
      );
      const pulseAsync = new PulseAsync('test', delayedPulser);

      await pulseAsync.emit();

      expect(delayedPulser).toHaveBeenCalledTimes(1);
      expect(mockLogger.log).toHaveBeenCalledWith('Pulser emitted asynchronously');
    });

    it('should emit multiple times asynchronously', async () => {
      await pulseAsync.emit('first');
      await pulseAsync.emit('second');
      await pulseAsync.emit('third');

      expect(mockAsyncPulser).toHaveBeenCalledTimes(3);
      expect(mockAsyncPulser).toHaveBeenNthCalledWith(1, 'first');
      expect(mockAsyncPulser).toHaveBeenNthCalledWith(2, 'second');
      expect(mockAsyncPulser).toHaveBeenNthCalledWith(3, 'third');
      expect(mockLogger.log).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent emissions', async () => {
      const promises = [
        pulseAsync.emit('concurrent1'),
        pulseAsync.emit('concurrent2'),
        pulseAsync.emit('concurrent3')
      ];

      await Promise.all(promises);

      expect(mockAsyncPulser).toHaveBeenCalledTimes(3);
      expect(mockLogger.log).toHaveBeenCalledTimes(3);
    });
  });

  describe('Async Edge Cases', () => {
    it('should handle non-async function as async pulser', async () => {
      const syncPulser = vi.fn(() => 'sync result');
      const pulseAsync = new PulseAsync('test', syncPulser);

      await pulseAsync.emit();

      expect(syncPulser).toHaveBeenCalledTimes(1);
      expect(mockLogger.log).toHaveBeenCalledWith('Pulser emitted asynchronously');
    });

    it('should handle async function that returns undefined', async () => {
      const undefinedPulser = vi.fn().mockResolvedValue(undefined);
      const pulseAsync = new PulseAsync('test', undefinedPulser);

      await pulseAsync.emit();

      expect(undefinedPulser).toHaveBeenCalledTimes(1);
      expect(mockLogger.log).toHaveBeenCalledWith('Pulser emitted asynchronously');
    });

    it('should handle async function that throws synchronously', async () => {
      const throwingPulser = vi.fn(() => {
        throw new Error('Sync error in async context');
      });
      const pulseAsync = new PulseAsync('test', throwingPulser);

      await expect(pulseAsync.emit()).rejects.toThrow('Sync error in async context');
      expect(throwingPulser).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Pulse vs PulseAsync Comparison', () => {
  let mockPulser;
  let mockAsyncPulser;

  beforeEach(() => {
    mockPulser = vi.fn();
    mockAsyncPulser = vi.fn().mockResolvedValue('result');
    const mockLogger = {
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      format: vi.fn((message) => `MockLogger: ${message}`)
    };
    Logger.mockImplementation(() => mockLogger);
    vi.clearAllMocks();
  });

  it('should have different prefixes in logger', () => {
    const pulse = new Pulse('test', mockPulser);
    const pulseAsync = new PulseAsync('test', mockAsyncPulser);

    expect(Logger).toHaveBeenCalledWith('[Pulse](test)', {});
    expect(Logger).toHaveBeenCalledWith('[PulseAsync](test)', {});
    expect(pulse).toBeInstanceOf(Pulse);
    expect(pulseAsync).toBeInstanceOf(PulseAsync);
  });

  it('should have different emit behaviors', async () => {
    const pulse = new Pulse('test', mockPulser);
    const pulseAsync = new PulseAsync('test', mockAsyncPulser);

    // Sync emit
    const syncResult = pulse.emit('sync');
    expect(syncResult).toBeUndefined();

    // Async emit
    const asyncResult = pulseAsync.emit('async');
    expect(asyncResult).toBeInstanceOf(Promise);
    await asyncResult;

    expect(mockPulser).toHaveBeenCalledWith('sync');
    expect(mockAsyncPulser).toHaveBeenCalledWith('async');
  });

  it('should both inherit from same base class behavior', () => {
    // Both should validate alias the same way
    expect(() => new Pulse('', mockPulser)).toThrow('Alias cannot be empty or contain only whitespace');
    expect(() => new PulseAsync('', mockAsyncPulser)).toThrow('Alias cannot be empty or contain only whitespace');

    // Both should validate pulser the same way
    expect(() => new Pulse('test', null)).toThrow('Pulser must be a function');
    expect(() => new PulseAsync('test', null)).toThrow('Pulser must be a function');
  });
});
