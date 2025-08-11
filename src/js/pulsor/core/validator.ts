/**
 * Advanced validation system for the Pulsor framework
 * @fileoverview Comprehensive validation with security checks, custom rules, and performance optimization
 * @version 6.0.0
 * @author Pulsor Team
 */

import type { 
  PulserAlias, 
  PulserOptions, 
  CallbackOptions,
  PulserFunction,
  CallbackFunction
} from '../types/index.js';
import type { IValidator } from '../interfaces/index.js';
import { 
  PulsorValidationError, 
  extractErrorInfo,
  normalizeError 
} from './errors.js';
import { 
  SECURITY_CONSTANTS,
  isDangerousKey,
  sanitizeArgs,
  isAsyncFunction,
  isPromise
} from './utils.js';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Validation rule function
 */
type ValidationRule<T = any> = (value: T, context?: ValidationContext) => boolean | string | Promise<boolean | string>;

/**
 * Validation context
 */
interface ValidationContext {
  readonly field: string;
  readonly parent?: any;
  readonly root?: any;
  readonly path: string[];
  readonly options: ValidationOptions;
}

/**
 * Validation options
 */
interface ValidationOptions {
  readonly strict: boolean;
  readonly allowUndefined: boolean;
  readonly allowNull: boolean;
  readonly enableSecurity: boolean;
  readonly maxDepth: number;
  readonly customRules: Map<string, ValidationRule>;
}

/**
 * Validation result
 */
interface ValidationResult {
  readonly valid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
  readonly sanitized?: any;
}

/**
 * Validation error details
 */
interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly value: any;
  readonly path: string[];
  readonly rule?: string;
}

/**
 * Validation warning
 */
interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly value: any;
  readonly suggestion?: string;
}

/**
 * Schema definition
 */
interface Schema {
  readonly type: string | string[];
  readonly required?: boolean;
  readonly rules?: ValidationRule[];
  readonly children?: Record<string, Schema>;
  readonly items?: Schema;
  readonly min?: number;
  readonly max?: number;
  readonly pattern?: RegExp;
  readonly enum?: any[];
  readonly custom?: ValidationRule;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: ValidationOptions = {
  strict: true,
  allowUndefined: false,
  allowNull: false,
  enableSecurity: true,
  maxDepth: 10,
  customRules: new Map()
};

/**
 * Built-in validation rules
 */
const BUILT_IN_RULES = {
  required: (value: any) => value !== undefined && value !== null,
  string: (value: any) => typeof value === 'string',
  number: (value: any) => typeof value === 'number' && !isNaN(value),
  boolean: (value: any) => typeof value === 'boolean',
  function: (value: any) => typeof value === 'function',
  object: (value: any) => value !== null && typeof value === 'object',
  array: (value: any) => Array.isArray(value),
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  url: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  alphanumeric: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
  safe: (value: string) => !isDangerousKey(value)
};

/**
 * Error codes
 */
const ERROR_CODES = {
  INVALID_TYPE: 'INVALID_TYPE',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  CUSTOM_RULE_FAILED: 'CUSTOM_RULE_FAILED',
  MAX_DEPTH_EXCEEDED: 'MAX_DEPTH_EXCEEDED',
  INVALID_ENUM: 'INVALID_ENUM'
} as const;

// ============================================================================
// VALIDATOR IMPLEMENTATION
// ============================================================================

/**
 * Advanced validation system
 */
export class Validator implements IValidator {
  private readonly options: ValidationOptions;
  private readonly schemas = new Map<string, Schema>();
  private readonly cache = new Map<string, ValidationResult>();
  private cacheEnabled = true;

  constructor(options: Partial<ValidationOptions> = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      customRules: new Map([
        ...DEFAULT_OPTIONS.customRules,
        ...(options.customRules || new Map())
      ])
    };
  }

  /**
   * Validate Pulser alias
   */
  public validateAlias(alias: unknown): alias is PulserAlias {
    try {
      const result = this.validateValue(alias, {
        type: 'string',
        required: true,
        rules: [
          (value: string) => value.length > 0 || 'Alias cannot be empty',
          (value: string) => value.length <= 100 || 'Alias too long (max 100 characters)',
          (value: string) => /^[a-zA-Z0-9_-]+$/.test(value) || 'Alias contains invalid characters',
          (value: string) => !isDangerousKey(value) || 'Alias contains dangerous patterns'
        ]
      });
      
      return result.valid;
    } catch {
      return false;
    }
  }

  /**
   * Validate Pulser function
   */
  public validateFunction(fn: unknown): fn is PulserFunction {
    try {
      const result = this.validateValue(fn, {
        type: 'function',
        required: true,
        rules: [
          (value: Function) => {
            // Check if function is not a constructor
            const fnStr = value.toString();
            if (fnStr.includes('class ') || fnStr.startsWith('class')) {
              return 'Constructor functions are not allowed';
            }
            return true;
          },
          (value: Function) => {
            // Security check for dangerous function content
            const fnStr = value.toString();
            const dangerousPatterns = [
              'eval(',
              'Function(',
              'setTimeout(',
              'setInterval(',
              'require(',
              'import(',
              'process.',
              'global.',
              'window.'
            ];
            
            for (const pattern of dangerousPatterns) {
              if (fnStr.includes(pattern)) {
                return `Function contains potentially dangerous pattern: ${pattern}`;
              }
            }
            return true;
          }
        ]
      });
      
      return result.valid;
    } catch {
      return false;
    }
  }

  /**
   * Validate callback function
   */
  public validateCallback(fn: unknown): fn is CallbackFunction {
    try {
      const result = this.validateValue(fn, {
        type: 'function',
        required: true,
        rules: [
          (value: Function) => {
            // Callback should accept at least one parameter
            if (value.length === 0) {
              return 'Callback function must accept at least one parameter';
            }
            return true;
          }
        ]
      });
      
      return result.valid;
    } catch {
      return false;
    }
  }

  /**
   * Validate Pulser options
   */
  public validatePulserOptions(options: unknown): ValidationResult {
    const schema: Schema = {
      type: 'object',
      required: false,
      children: {
        timeout: {
          type: 'number',
          min: 0,
          max: 300000 // 5 minutes max
        },
        retries: {
          type: 'number',
          min: 0,
          max: 10
        },
        retryDelay: {
          type: 'number',
          min: 0,
          max: 60000 // 1 minute max
        },
        circuitBreaker: {
          type: 'object',
          children: {
            enabled: { type: 'boolean' },
            failureThreshold: { type: 'number', min: 1, max: 100 },
            recoveryTimeout: { type: 'number', min: 1000, max: 300000 }
          }
        },
        cache: {
          type: 'object',
          children: {
            enabled: { type: 'boolean' },
            ttl: { type: 'number', min: 0, max: 86400000 }, // 24 hours max
            maxSize: { type: 'number', min: 1, max: 10000 }
          }
        },
        security: {
          type: 'object',
          children: {
            enabled: { type: 'boolean' },
            maxExecutionTime: { type: 'number', min: 100, max: 300000 },
            allowedOrigins: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    };

    return this.validateValue(options, schema);
  }

  /**
   * Validate callback options
   */
  public validateCallbackOptions(options: unknown): ValidationResult {
    const schema: Schema = {
      type: 'object',
      required: false,
      children: {
        priority: {
          type: 'number',
          min: -100,
          max: 100
        },
        once: {
          type: 'boolean'
        },
        timeout: {
          type: 'number',
          min: 0,
          max: 300000
        },
        condition: {
          type: 'function'
        },
        context: {
          type: 'object'
        }
      }
    };

    return this.validateValue(options, schema);
  }

  /**
   * Validate a value against a schema
   */
  public validateValue(value: any, schema: Schema, context?: Partial<ValidationContext>): ValidationResult {
    const fullContext: ValidationContext = {
      field: context?.field || 'value',
      parent: context?.parent,
      root: context?.root || value,
      path: context?.path || [],
      options: this.options
    };

    // Check cache
    const cacheKey = this.generateCacheKey(value, schema, fullContext);
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = this.performValidation(value, schema, fullContext);
    
    // Cache result
    if (this.cacheEnabled) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Add custom validation rule
   */
  public addRule(name: string, rule: ValidationRule): void {
    this.options.customRules.set(name, rule);
    this.clearCache(); // Clear cache when rules change
  }

  /**
   * Remove custom validation rule
   */
  public removeRule(name: string): boolean {
    const removed = this.options.customRules.delete(name);
    if (removed) {
      this.clearCache();
    }
    return removed;
  }

  /**
   * Register a schema
   */
  public registerSchema(name: string, schema: Schema): void {
    this.schemas.set(name, schema);
    this.clearCache();
  }

  /**
   * Get registered schema
   */
  public getSchema(name: string): Schema | undefined {
    return this.schemas.get(name);
  }

  /**
   * Validate using registered schema
   */
  public validateWithSchema(value: any, schemaName: string): ValidationResult {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw new PulsorValidationError(`Schema '${schemaName}' not found`);
    }
    
    return this.validateValue(value, schema);
  }

  /**
   * Sanitize input value
   */
  public sanitize(value: any): any {
    if (typeof value === 'string') {
      // Basic string sanitization
      return value
        .trim()
        .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
        .substring(0, 1000); // Limit length
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.sanitize(item)).slice(0, 100); // Limit array size
    }
    
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        if (!isDangerousKey(key)) {
          sanitized[key] = this.sanitize(val);
        }
      }
      return sanitized;
    }
    
    return value;
  }

  /**
   * Enable or disable caching
   */
  public setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Clear validation cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; hitRate: number } {
    // This is a simplified implementation
    // In a real scenario, you'd track hits/misses
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to track this
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Perform the actual validation
   */
  private performValidation(value: any, schema: Schema, context: ValidationContext): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let sanitized = value;

    try {
      // Check depth limit
      if (context.path.length > this.options.maxDepth) {
        errors.push({
          field: context.field,
          message: `Maximum validation depth (${this.options.maxDepth}) exceeded`,
          code: ERROR_CODES.MAX_DEPTH_EXCEEDED,
          value,
          path: context.path
        });
        return { valid: false, errors, warnings };
      }

      // Handle undefined/null values
      if (value === undefined) {
        if (schema.required) {
          errors.push({
            field: context.field,
            message: 'Field is required',
            code: ERROR_CODES.REQUIRED_FIELD,
            value,
            path: context.path
          });
        }
        return { valid: errors.length === 0, errors, warnings };
      }

      if (value === null) {
        if (schema.required || !this.options.allowNull) {
          errors.push({
            field: context.field,
            message: 'Null values are not allowed',
            code: ERROR_CODES.INVALID_TYPE,
            value,
            path: context.path
          });
        }
        return { valid: errors.length === 0, errors, warnings };
      }

      // Type validation
      const typeErrors = this.validateType(value, schema, context);
      errors.push(...typeErrors);

      if (typeErrors.length === 0) {
        // Range validation
        const rangeErrors = this.validateRange(value, schema, context);
        errors.push(...rangeErrors);

        // Pattern validation
        const patternErrors = this.validatePattern(value, schema, context);
        errors.push(...patternErrors);

        // Enum validation
        const enumErrors = this.validateEnum(value, schema, context);
        errors.push(...enumErrors);

        // Custom rules validation
        const customErrors = this.validateCustomRules(value, schema, context);
        errors.push(...customErrors);

        // Children validation (for objects)
        if (schema.children && typeof value === 'object') {
          const childErrors = this.validateChildren(value, schema, context);
          errors.push(...childErrors);
        }

        // Array items validation
        if (schema.items && Array.isArray(value)) {
          const itemErrors = this.validateArrayItems(value, schema, context);
          errors.push(...itemErrors);
        }

        // Security validation
        if (this.options.enableSecurity) {
          const securityErrors = this.validateSecurity(value, context);
          errors.push(...securityErrors);
        }

        // Sanitization
        if (errors.length === 0) {
          sanitized = this.sanitize(value);
        }
      }

    } catch (error) {
      errors.push({
        field: context.field,
        message: `Validation error: ${(error as Error).message}`,
        code: 'VALIDATION_ERROR',
        value,
        path: context.path
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }

  /**
   * Validate type
   */
  private validateType(value: any, schema: Schema, context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    const isValidType = types.some(type => {
      switch (type) {
        case 'array':
          return Array.isArray(value);
        case 'object':
          return value !== null && typeof value === 'object' && !Array.isArray(value);
        default:
          return typeof value === type;
      }
    });

    if (!isValidType) {
      errors.push({
        field: context.field,
        message: `Expected type ${types.join(' or ')}, got ${actualType}`,
        code: ERROR_CODES.INVALID_TYPE,
        value,
        path: context.path
      });
    }

    return errors;
  }

  /**
   * Validate range (min/max)
   */
  private validateRange(value: any, schema: Schema, context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        errors.push({
          field: context.field,
          message: `Value ${value} is below minimum ${schema.min}`,
          code: ERROR_CODES.OUT_OF_RANGE,
          value,
          path: context.path
        });
      }
      
      if (schema.max !== undefined && value > schema.max) {
        errors.push({
          field: context.field,
          message: `Value ${value} is above maximum ${schema.max}`,
          code: ERROR_CODES.OUT_OF_RANGE,
          value,
          path: context.path
        });
      }
    }
    
    if (typeof value === 'string' || Array.isArray(value)) {
      const length = value.length;
      
      if (schema.min !== undefined && length < schema.min) {
        errors.push({
          field: context.field,
          message: `Length ${length} is below minimum ${schema.min}`,
          code: ERROR_CODES.OUT_OF_RANGE,
          value,
          path: context.path
        });
      }
      
      if (schema.max !== undefined && length > schema.max) {
        errors.push({
          field: context.field,
          message: `Length ${length} is above maximum ${schema.max}`,
          code: ERROR_CODES.OUT_OF_RANGE,
          value,
          path: context.path
        });
      }
    }

    return errors;
  }

  /**
   * Validate pattern
   */
  private validatePattern(value: any, schema: Schema, context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (schema.pattern && typeof value === 'string') {
      if (!schema.pattern.test(value)) {
        errors.push({
          field: context.field,
          message: `Value does not match required pattern`,
          code: ERROR_CODES.INVALID_FORMAT,
          value,
          path: context.path
        });
      }
    }

    return errors;
  }

  /**
   * Validate enum values
   */
  private validateEnum(value: any, schema: Schema, context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        field: context.field,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        code: ERROR_CODES.INVALID_ENUM,
        value,
        path: context.path
      });
    }

    return errors;
  }

  /**
   * Validate custom rules
   */
  private validateCustomRules(value: any, schema: Schema, context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const rules = schema.rules || [];
    
    if (schema.custom) {
      rules.push(schema.custom);
    }

    for (const rule of rules) {
      try {
        const result = rule(value, context);
        
        if (isPromise(result)) {
          // For async rules, we'd need to handle this differently
          // This is a simplified sync-only implementation
          continue;
        }
        
        if (result !== true) {
          errors.push({
            field: context.field,
            message: typeof result === 'string' ? result : 'Custom validation failed',
            code: ERROR_CODES.CUSTOM_RULE_FAILED,
            value,
            path: context.path,
            rule: rule.name || 'custom'
          });
        }
      } catch (error) {
        errors.push({
          field: context.field,
          message: `Custom rule error: ${(error as Error).message}`,
          code: ERROR_CODES.CUSTOM_RULE_FAILED,
          value,
          path: context.path
        });
      }
    }

    return errors;
  }

  /**
   * Validate object children
   */
  private validateChildren(value: any, schema: Schema, context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!schema.children) {
      return errors;
    }

    for (const [childKey, childSchema] of Object.entries(schema.children)) {
      const childValue = value[childKey];
      const childContext: ValidationContext = {
        ...context,
        field: `${context.field}.${childKey}`,
        parent: value,
        path: [...context.path, childKey]
      };
      
      const childResult = this.validateValue(childValue, childSchema, childContext);
      errors.push(...childResult.errors);
    }

    return errors;
  }

  /**
   * Validate array items
   */
  private validateArrayItems(value: any[], schema: Schema, context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!schema.items) {
      return errors;
    }

    for (let i = 0; i < value.length; i++) {
      const itemValue = value[i];
      const itemContext: ValidationContext = {
        ...context,
        field: `${context.field}[${i}]`,
        parent: value,
        path: [...context.path, i.toString()]
      };
      
      const itemResult = this.validateValue(itemValue, schema.items, itemContext);
      errors.push(...itemResult.errors);
    }

    return errors;
  }

  /**
   * Validate security constraints
   */
  private validateSecurity(value: any, context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value === 'string') {
      if (isDangerousKey(value)) {
        errors.push({
          field: context.field,
          message: 'Value contains potentially dangerous content',
          code: ERROR_CODES.SECURITY_VIOLATION,
          value,
          path: context.path
        });
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        if (isDangerousKey(key)) {
          errors.push({
            field: `${context.field}.${key}`,
            message: 'Object key contains potentially dangerous content',
            code: ERROR_CODES.SECURITY_VIOLATION,
            value: key,
            path: [...context.path, key]
          });
        }
      }
    }

    return errors;
  }

  /**
   * Generate cache key for validation result
   */
  private generateCacheKey(value: any, schema: Schema, context: ValidationContext): string {
    // This is a simplified cache key generation
    // In production, you'd want a more sophisticated approach
    const valueHash = JSON.stringify(value).substring(0, 100);
    const schemaHash = JSON.stringify(schema).substring(0, 100);
    const contextHash = context.path.join('.');
    
    return `${valueHash}:${schemaHash}:${contextHash}`;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new Validator instance
 */
export function createValidator(options: Partial<ValidationOptions> = {}): Validator {
  return new Validator(options);
}

/**
 * Create a strict validator
 */
export function createStrictValidator(): Validator {
  return new Validator({
    strict: true,
    allowUndefined: false,
    allowNull: false,
    enableSecurity: true,
    maxDepth: 5
  });
}

/**
 * Create a lenient validator
 */
export function createLenientValidator(): Validator {
  return new Validator({
    strict: false,
    allowUndefined: true,
    allowNull: true,
    enableSecurity: false,
    maxDepth: 20
  });
}

/**
 * Create a validator for testing
 */
export function createTestValidator(): Validator {
  return new Validator({
    strict: true,
    allowUndefined: false,
    allowNull: false,
    enableSecurity: true,
    maxDepth: 10
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick validation functions for common types
 */
export const quickValidate = {
  alias: (value: unknown): value is PulserAlias => {
    return typeof value === 'string' && 
           value.length > 0 && 
           value.length <= 100 && 
           /^[a-zA-Z0-9_-]+$/.test(value) && 
           !isDangerousKey(value);
  },
  
  function: (value: unknown): value is Function => {
    return typeof value === 'function';
  },
  
  options: (value: unknown): boolean => {
    return value === undefined || 
           value === null || 
           (typeof value === 'object' && !Array.isArray(value));
  }
};