import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '../logger.class.js';

describe('Logger Class', () => {
  let consoleSpy;

  beforeEach(() => {
    // Reset console spy before each test
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'debug').mockImplementation(() => { });
    vi.spyOn(console, 'info').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  describe('Constructor', () => {
    it('should create a logger instance with valid prefix', () => {
      const logger = new Logger('TestLogger');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create a logger instance with empty prefix', () => {
      const logger = new Logger('');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create a logger instance with whitespace only prefix', () => {
      const logger = new Logger('   ');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create a logger instance with null prefix', () => {
      const logger = new Logger(null);
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create a logger instance with undefined prefix', () => {
      const logger = new Logger(undefined);
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should initialize with default services when no services provided', () => {
      const logger = new Logger('TestLogger');
      expect(logger).toBeDefined();
      // All services should be disabled by default
      expect(() => logger.log('test')).not.toThrow();
    });

    it('should initialize with provided services configuration', () => {
      const services = { log: true, debug: false, info: true };
      const logger = new Logger('TestLogger', services);
      expect(logger).toBeDefined();
    });
  });

  describe('Services Configuration', () => {
    it('should enable specified services', () => {
      const logger = new Logger('TestLogger');
      logger.services({ log: true, debug: true });

      logger.log('test message');
      logger.debug('debug message');

      expect(console.log).toHaveBeenCalledWith('TestLogger: ', 'test message');
      expect(console.debug).toHaveBeenCalledWith('TestLogger: ', 'debug message');
    });

    it('should disable specified services', () => {
      const logger = new Logger('TestLogger', { log: true, debug: true });
      logger.services({ log: false, debug: false });

      logger.log('test message');
      logger.debug('debug message');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should only update existing service keys', () => {
      const logger = new Logger('TestLogger');
      logger.services({
        log: true,
        debug: true,
        nonexistent: true,
        invalid: 'not boolean'
      });

      logger.log('test message');
      logger.debug('debug message');

      expect(console.log).toHaveBeenCalled();
      expect(console.debug).toHaveBeenCalled();
    });

    it('should throw error when services parameter is null', () => {
      const logger = new Logger('TestLogger');
      expect(() => logger.services(null)).toThrow(TypeError);
    });

    it('should not throw error when services parameter is undefined', () => {
      const logger = new Logger('TestLogger');
      expect(() => logger.services(undefined)).not.toThrow();
    });

    it('should not throw error when services parameter is a string, number, or empty array', () => {
      const logger = new Logger('TestLogger');
      expect(() => logger.services('invalid')).not.toThrow();
      expect(() => logger.services(123)).not.toThrow();
      expect(() => logger.services([])).not.toThrow();
    });

    it('should handle empty services object', () => {
      const logger = new Logger('TestLogger');
      expect(() => logger.services({})).not.toThrow();
    });
  });

  describe('Logging Methods', () => {
    it('should log when service is enabled', () => {
      const logger = new Logger('TestLogger', { log: true });
      logger.log('test message');

      expect(console.log).toHaveBeenCalledWith('TestLogger: ', 'test message');
    });

    it('should not log when service is disabled', () => {
      const logger = new Logger('TestLogger', { log: false });
      logger.log('test message');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should support all log levels', () => {
      const logger = new Logger('TestLogger', {
        log: true,
        debug: true,
        info: true,
        warn: true,
        error: true
      });

      logger.log('log message');
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(console.log).toHaveBeenCalledWith('TestLogger: ', 'log message');
      expect(console.debug).toHaveBeenCalledWith('TestLogger: ', 'debug message');
      expect(console.info).toHaveBeenCalledWith('TestLogger: ', 'info message');
      expect(console.warn).toHaveBeenCalledWith('TestLogger: ', 'warn message');
      expect(console.error).toHaveBeenCalledWith('TestLogger: ', 'error message');
    });

    it('should handle different data types as log messages', () => {
      const logger = new Logger('TestLogger', { log: true });

      logger.log(123);
      logger.log({ key: 'value' });
      logger.log([1, 2, 3]);
      logger.log(true);
      logger.log(null);

      expect(console.log).toHaveBeenCalledWith('TestLogger: ', 123);
      expect(console.log).toHaveBeenCalledWith('TestLogger: ', { key: 'value' });
      expect(console.log).toHaveBeenCalledWith('TestLogger: ', [1, 2, 3]);
      expect(console.log).toHaveBeenCalledWith('TestLogger: ', true);
      expect(console.log).toHaveBeenCalledWith('TestLogger: ', null);
    });
  });

  describe('Format Method', () => {
    it('should format message with prefix', () => {
      const logger = new Logger('TestLogger');
      const formatted = logger.format('test message');

      expect(formatted).toBe('TestLogger: test message');
    });

    it('should not trim whitespace from message in format method', () => {
      const logger = new Logger('TestLogger');
      const formatted = logger.format('  test message  ');

      expect(formatted).toBe('TestLogger:   test message  ');
    });

    it('should handle numeric messages', () => {
      const logger = new Logger('TestLogger');
      const formatted = logger.format(123);

      expect(formatted).toBe('TestLogger: 123');
    });

    it('should handle object messages', () => {
      const logger = new Logger('TestLogger');
      const formatted = logger.format({ key: 'value' });

      expect(formatted).toBe('TestLogger: [object Object]');
    });

    it('should handle empty string messages', () => {
      const logger = new Logger('TestLogger');
      const formatted = logger.format('');
      expect(formatted).toBe('TestLogger: ');
    });

    it('should handle whitespace only messages', () => {
      const logger = new Logger('TestLogger');
      const formatted = logger.format('   ');
      expect(formatted).toBe('TestLogger:    ');
    });

    it('should handle null messages', () => {
      const logger = new Logger('TestLogger');
      const formatted = logger.format(null);
      expect(formatted).toBe('TestLogger: null');
    });

    it('should handle undefined messages', () => {
      const logger = new Logger('TestLogger');
      const formatted = logger.format(undefined);
      expect(formatted).toBe('TestLogger: undefined');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should maintain separate instances with different prefixes', () => {
      const logger1 = new Logger('Logger1', { log: true });
      const logger2 = new Logger('Logger2', { log: true });

      logger1.log('message from logger1');
      logger2.log('message from logger2');

      expect(console.log).toHaveBeenCalledWith('Logger1: ', 'message from logger1');
      expect(console.log).toHaveBeenCalledWith('Logger2: ', 'message from logger2');
    });

    it('should allow dynamic service configuration after instantiation', () => {
      const logger = new Logger('TestLogger');

      // Initially disabled
      logger.log('should not appear');
      expect(console.log).not.toHaveBeenCalled();

      // Enable logging
      logger.services({ log: true });
      logger.log('should appear');
      expect(console.log).toHaveBeenCalledWith('TestLogger: ', 'should appear');

      // Disable again
      consoleSpy.mockClear();
      logger.services({ log: false });
      logger.log('should not appear again');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle multiple service configurations', () => {
      const logger = new Logger('TestLogger');

      expect(() => {
        logger.services({ log: true });
        logger.services({ debug: true });
      }).not.toThrow();
    });

    it('should handle special characters in prefix', () => {
      const logger = new Logger('Test-Logger_123');
      logger.services({ log: true });
      logger.log('test');

      expect(console.log).toHaveBeenCalledWith('Test-Logger_123: ', 'test');
    });

    it('should handle unicode characters in prefix and messages', () => {
      const logger = new Logger('🚀 Logger');
      logger.services({ log: true });
      logger.log('Hello 世界! 🌍');

      expect(console.log).toHaveBeenCalledWith('🚀 Logger: ', 'Hello 世界! 🌍');
    });
  });

  describe('Error Handling', () => {
    it('should handle circular references in log messages gracefully', () => {
      const logger = new Logger('TestLogger', { log: true });
      const circularObj = {};
      circularObj.self = circularObj;

      expect(() => logger.log(circularObj)).not.toThrow();
    });
  });
});
