import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '../logger.class.js';

describe('Logger', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    // Reset console spies before each test
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  // Test constructor
  it('should create a Logger instance with a valid prefix', () => {
    logger = new Logger('TestPrefix');
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should throw an error if prefix is null or undefined', () => {
    expect(() => new Logger(null)).toThrow('Prefix cannot be null or undefined');
    expect(() => new Logger(undefined)).toThrow('Prefix cannot be null or undefined');
  });

  it('should throw an error if prefix is not a string', () => {
    expect(() => new Logger(123)).toThrow('Prefix must be a string');
    expect(() => new Logger({})).toThrow('Prefix must be a string');
  });

  it('should throw an error if prefix is empty or only whitespace', () => {
    expect(() => new Logger('')).toThrow('Prefix cannot be empty or contain only whitespace');
    expect(() => new Logger('   ')).toThrow('Prefix cannot be empty or contain only whitespace');
  });

  it('should throw an error if prefix exceeds 50 characters', () => {
    const longPrefix = 'a'.repeat(51);
    expect(() => new Logger(longPrefix)).toThrow('Prefix cannot exceed 50 characters');
  });

  it('should initialize services with default values if not provided', () => {
    logger = new Logger('TestPrefix');
    // Access private property for testing purposes (not ideal in real-world, but necessary for private fields)
    // Test indirectly via public methods or expected behavior
    // For example, ensure default services are enabled by checking log output
    logger.log('test');
    expect(consoleSpy.log).toHaveBeenCalledWith('TestPrefix: test');
    consoleSpy.log.mockClear();
    logger.error('test');
    expect(consoleSpy.error).toHaveBeenCalledWith('TestPrefix: test');
  });

  it('should initialize services with provided values', () => {
    logger = new Logger('TestPrefix', { log: false, error: true });
    // Test indirectly via public methods or expected behavior
    logger.log('test');
    expect(consoleSpy.log).not.toHaveBeenCalled();
    logger.error('test');
    expect(consoleSpy.error).toHaveBeenCalledWith('TestPrefix: test');
  });

  // Test service() method
  it('should enable/disable the logger instance', () => {
    logger = new Logger('TestPrefix');
    logger.service(false);
    logger.log('This should not be logged');
    expect(consoleSpy.log).not.toHaveBeenCalled();
    consoleSpy.log.mockClear();
    logger.service(true);
    logger.log('This should be logged');
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should throw an error if service enabled parameter is null or undefined', () => {
    logger = new Logger('TestPrefix');
    expect(() => logger.service(null)).toThrow('TestPrefix: Enabled parameter cannot be null or undefined');
    expect(() => logger.service(undefined)).toThrow('TestPrefix: Enabled parameter cannot be null or undefined');
  });

  // Test services() method
  it('should update specific services', () => {
    logger = new Logger('TestPrefix');
    logger.services({ log: false, warn: false });
    logger.log('This should not be logged');
    expect(consoleSpy.log).not.toHaveBeenCalled();
    consoleSpy.log.mockClear();
    logger.warn('This should not be logged');
    expect(consoleSpy.warn).not.toHaveBeenCalled();
    consoleSpy.warn.mockClear();
    logger.debug('This should be logged');
    expect(consoleSpy.debug).toHaveBeenCalled();
  });

  it('should throw an error if services parameter is not an object', () => {
    logger = new Logger('TestPrefix');
    expect(() => logger.services('invalid')).toThrow('TestPrefix: Services configuration must be an object');
    expect(() => logger.services(123)).toThrow('TestPrefix: Services configuration must be an object');
  });

  it('should throw an error for invalid service keys', () => {
    logger = new Logger('TestPrefix');
    expect(() => logger.services({ invalidKey: true })).toThrow('TestPrefix: Invalid service key: \'invalidKey\'. Valid keys are: log, debug, info, warn, error');
  });

  it('should throw an error for invalid service values', () => {
    logger = new Logger('TestPrefix');
    expect(() => logger.services({ log: 'notABoolean' })).toThrow('TestPrefix: Service \'log\' must be a boolean value');
  });

  // Test log methods (log, debug, info, warn, error)
  it('should log a message with log level', () => {
    logger = new Logger('TestPrefix');
    logger.log('This is a log message');
    expect(consoleSpy.log).toHaveBeenCalledWith('TestPrefix: This is a log message');
  });

  it('should log a message with debug level', () => {
    logger = new Logger('TestPrefix');
    logger.debug('This is a debug message');
    expect(consoleSpy.debug).toHaveBeenCalledWith('TestPrefix: This is a debug message');
  });

  it('should log a message with info level', () => {
    logger = new Logger('TestPrefix');
    logger.info('This is an info message');
    expect(consoleSpy.info).toHaveBeenCalledWith('TestPrefix: This is an info message');
  });

  it('should log a message with warn level', () => {
    logger = new Logger('TestPrefix');
    logger.warn('This is a warn message');
    expect(consoleSpy.warn).toHaveBeenCalledWith('TestPrefix: This is a warn message');
  });

  it('should log a message with error level', () => {
    logger = new Logger('TestPrefix');
    logger.error('This is an error message');
    expect(consoleSpy.error).toHaveBeenCalledWith('TestPrefix: This is an error message');
  });

  it('should not log if the logger is disabled', () => {
    logger = new Logger('TestPrefix');
    logger.service(false);
    logger.log('This should not be logged');
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  it('should not log if a specific service is disabled', () => {
    logger = new Logger('TestPrefix', { log: false });
    logger.log('This should not be logged');
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  it('should log if a specific service is enabled', () => {
    logger = new Logger('TestPrefix', { log: true });
    logger.log('This should be logged');
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should handle non-string messages by converting them to string', () => {
    logger = new Logger('TestPrefix');
    logger.log(123);
    expect(consoleSpy.log).toHaveBeenCalledWith('TestPrefix: 123');
    logger.log({ key: 'value' });
    expect(consoleSpy.log).toHaveBeenCalledWith('TestPrefix: [object Object]');
    logger.log(true);
    expect(consoleSpy.log).toHaveBeenCalledWith('TestPrefix: true');
  });

});