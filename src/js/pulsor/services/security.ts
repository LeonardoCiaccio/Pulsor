/**
 * Advanced security service for the Pulsor framework
 * @fileoverview Security validation, sanitization, and threat detection
 * @version 6.0.0
 * @author Pulsor Team
 */

import type {
  ISecurityService
} from '../interfaces/index.js';
import type {
  PulserAlias,
  ExecutionId,
  Timestamp,

} from '../types/index.js';
import { nowMs, isDangerousKey, sanitizeArgs, sanitizeValue, deepFreeze } from '../core/utils.js';
 import type { EventEmitterConfig } from '../core/event-emitter.js';
 import { globalLogger } from '../core/logger.js';

import { EventEmitter } from '../core/event-emitter.js';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

/**
 * Configuration for security service
 */
export interface SecurityConfig extends EventEmitterConfig {
  /** Enable security monitoring */
  enabled: boolean;
  /** Enable argument sanitization */
  sanitizeArguments: boolean;
  /** Enable function validation */
  validateFunctions: boolean;
  /** Enable execution monitoring */
  monitorExecution: boolean;
  /** Rate limiting configuration */
  rateLimit: {
    enabled: boolean;
    maxExecutionsPerMinute: number;
    maxExecutionsPerHour: number;
    blockDuration: number; // milliseconds
  };
  /** Input validation rules */
  validation: {
    maxArgumentSize: number; // bytes
    maxArgumentCount: number;
    allowedTypes: string[];
    blockedPatterns: RegExp[];
  };
  /** Security policies */
  policies: {
    allowEval: boolean;
    allowDynamicImports: boolean;
    allowFileSystemAccess: boolean;
    allowNetworkAccess: boolean;
    allowProcessAccess: boolean;
  };
  /** Threat detection */
  threatDetection: {
    enabled: boolean;
    suspiciousPatterns: RegExp[];
    maxFailureRate: number; // percentage
    anomalyThreshold: number;
  };
}

/**
 * Security violation record
 */
export interface SecurityViolation {
  readonly id: string;
  readonly timestamp: Timestamp;
  readonly alias: PulserAlias;
  readonly executionId?: ExecutionId;
  readonly type: 'rate_limit' | 'validation' | 'policy' | 'threat' | 'anomaly';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly details: Record<string, unknown>;
  blocked: boolean;
  readonly source?: {
    ip?: string;
    userAgent?: string;
    origin?: string;
  };
}

/**
 * Rate limiting state
 */
export interface RateLimitState {
  readonly alias: PulserAlias;
  executions: Timestamp[];
  blocked: boolean;
  blockExpiry?: Timestamp | undefined;
  violations: number;
}

/**
 * Security audit log entry
 */
export interface SecurityAuditEntry {
  readonly timestamp: Timestamp;
  readonly alias: PulserAlias;
  readonly executionId: ExecutionId;
  readonly action: 'execute' | 'validate' | 'sanitize' | 'block';
  readonly result: 'success' | 'failure' | 'blocked';
  readonly details?: Record<string, unknown>;
  readonly duration: number;
}

/**
 * Threat assessment result
 */
export interface ThreatAssessment {
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly score: number; // 0-100
  readonly factors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
  readonly recommendation: string;
  readonly shouldBlock: boolean;
}

/**
 * Security metrics
 */
export interface SecurityMetrics {
  readonly totalValidations: number;
  readonly totalViolations: number;
  readonly totalBlocked: number;
  readonly violationsByType: Record<string, number>;
  readonly violationsBySeverity: Record<string, number>;
  readonly averageRiskScore: number;
  readonly topThreats: Array<{
    alias: PulserAlias;
    violations: number;
    lastViolation: Timestamp;
  }>;
}

// ============================================================================
// SECURITY SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Advanced security service implementation
 */
const DEFAULT_CONFIG: Partial<SecurityConfig> = {
  // Default values for SecurityConfig
  // ... (add default values here based on the SecurityConfig interface)
};

export class SecurityService extends EventEmitter implements ISecurityService {
  private readonly securityConfig: SecurityConfig;
   private readonly violations = new Map<string, SecurityViolation>();
  private readonly rateLimits = new Map<PulserAlias, RateLimitState>();
  private readonly auditLog: SecurityAuditEntry[] = [];
  private readonly blockedAliases = new Set<PulserAlias>();
  private violationCounter = 0;
  
  constructor(config: Partial<SecurityConfig> = {}) {
    super(config);
    
    this.securityConfig = {
      ...(DEFAULT_CONFIG as SecurityConfig),

      enabled: true,
      sanitizeArguments: true,
      validateFunctions: true,
      monitorExecution: true,
      rateLimit: {
        enabled: true,
        maxExecutionsPerMinute: 1000,
        maxExecutionsPerHour: 10000,
        blockDuration: 300000 // 5 minutes
      },
      validation: {
        maxArgumentSize: 1024 * 1024, // 1MB
        maxArgumentCount: 100,
        allowedTypes: ['string', 'number', 'boolean', 'object', 'undefined'],
        blockedPatterns: [
          /eval\s*\(/i,
          /function\s*\(/i,
          /new\s+Function/i,
          /setTimeout\s*\(/i,
          /setInterval\s*\(/i,
          /<script[^>]*>/i,
          /javascript:/i,
          /on\w+\s*=/i
        ]
      },
      policies: {
        allowEval: false,
        allowDynamicImports: false,
        allowFileSystemAccess: false,
        allowNetworkAccess: true,
        allowProcessAccess: false
      },
      threatDetection: {
        enabled: true,
        suspiciousPatterns: [
          /\.\.[\/\\]/g, // Path traversal
          /[<>"'&]/g, // XSS characters
          /\b(union|select|insert|update|delete|drop|create|alter)\b/i, // SQL injection
          /\b(eval|exec|system|shell_exec)\b/i, // Code execution
          /\b(file_get_contents|fopen|readfile)\b/i // File access
        ],
        maxFailureRate: 50, // 50%
        anomalyThreshold: 3 // Standard deviations
      },
      ...config
    };
  }
  
  /**
   * Verifica se una chiave è pericolosa per la prototype pollution.
   * @param key La chiave da controllare.
   * @returns True se la chiave è pericolosa, altrimenti false.
   */
  public isDangerousKey(key: string): boolean {
    return isDangerousKey(key);
  }

  /**
   * Sanitizza un oggetto rimuovendo chiavi pericolose per la prototype pollution.
   * @param obj L'oggetto da sanificare.
   * @returns Una copia sanificata dell'oggetto.
   */
  public sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    return sanitizeValue(obj);
  }

  /**
   * Congela ricorsivamente un oggetto per prevenirne le mutazioni.
   * @param obj L'oggetto da congelare.
   * @returns L'oggetto congelato.
   */
  public deepFreeze<T>(obj: T): T {
    return deepFreeze(obj);
  }

  /**
   * Verifica se un valore è sicuro per la serializzazione JSON.
   * @param value Il valore da controllare.
   * @returns True se il valore è sicuro per la serializzazione, altrimenti false.
   */
  public isSafeForSerialization(value: unknown): boolean {
    try {
      JSON.stringify(value);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Crea una copia sicura di un oggetto, rimuovendo riferimenti circolari e chiavi pericolose.
   * @param obj L'oggetto da copiare.
   * @returns Una copia sicura dell'oggetto.
   */
  public createSafeCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(sanitizeValue(obj)));
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================
  
  /**
   * Validate function arguments
   */
  public validateArguments(alias: PulserAlias, args: readonly unknown[]): boolean {
    if (!this.securityConfig.enabled || !this.securityConfig.validateFunctions) {
      return true;
    }
    
    const startTime = nowMs();
    
    try {
      // Check argument count
      if (args.length > this.securityConfig.validation.maxArgumentCount) {
        this.recordViolation({
          alias,
          type: 'validation',
          severity: 'medium',
          description: `Too many arguments: ${args.length} > ${this.securityConfig.validation.maxArgumentCount}`,
          details: { argumentCount: args.length },
          blocked: true
        });
        return false;
      }
      
      // Validate each argument
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        // Check argument type
        const argType = typeof arg;
        if (!this.securityConfig.validation.allowedTypes.includes(argType)) {
          this.recordViolation({
            alias,
            type: 'validation',
            severity: 'medium',
            description: `Invalid argument type: ${argType} at index ${i}`,
            details: { argumentIndex: i, argumentType: argType },
            blocked: true
          });
          return false;
        }
        
        // Check argument size
        const argSize = this.calculateArgumentSize(arg);
        if (argSize > this.securityConfig.validation.maxArgumentSize) {
          this.recordViolation({
            alias,
            type: 'validation',
            severity: 'high',
            description: `Argument too large: ${argSize} bytes > ${this.securityConfig.validation.maxArgumentSize} bytes`,
            details: { argumentIndex: i, argumentSize: argSize },
            blocked: true
          });
          return false;
        }
        
        // Check for blocked patterns
        if (this.containsBlockedPatterns(arg)) {
          this.recordViolation({
            alias,
            type: 'validation',
            severity: 'high',
            description: `Argument contains blocked patterns at index ${i}`,
            details: { argumentIndex: i },
            blocked: true
          });
          return false;
        }
      }
      
      this.recordAuditEntry({
        alias,
        executionId: this.generateExecutionId(),
        action: 'validate',
        result: 'success',
        duration: nowMs() - startTime
      });
      
      return true;
      
    } catch (error) {
      this.recordViolation({
        alias,
        type: 'validation',
        severity: 'medium',
        description: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : String(error) },
        blocked: true
      });
      
      return false;
    }
  }
  
  /**
   * Sanitize function arguments
   */
  public sanitizeArguments(alias: PulserAlias, args: readonly unknown[]): readonly unknown[] {
    if (!this.securityConfig.enabled || !this.securityConfig.sanitizeArguments) {
      return [...args];
    }
    
    const startTime = nowMs();
    
    try {
      const sanitized = sanitizeArgs(args);
      
      this.recordAuditEntry({
        alias,
        executionId: this.generateExecutionId(),
        action: 'sanitize',
        result: 'success',
        duration: nowMs() - startTime
      });
      
      return sanitized;
      
    } catch (error) {
      this.recordViolation({
        alias,
        type: 'validation',
        severity: 'medium',
        description: `Sanitization error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : String(error) },
        blocked: false
      });
      
      return [...args]; // Return original args if sanitization fails
    }
  }
  
  /**
   * Validate function code
   */
  public validateFunction(alias: PulserAlias, fn: Function): boolean {
    if (!this.securityConfig.enabled || !this.securityConfig.validateFunctions) {
      return true;
    }
    
    const startTime = nowMs();
    
    try {
      const fnString = fn.toString();
      
      // Check for policy violations
      if (!this.securityConfig.policies.allowEval && /\beval\s*\(/.test(fnString)) {
        this.recordViolation({
          alias,
          type: 'policy',
          severity: 'high',
          description: 'Function contains eval() which is not allowed',
          details: { policy: 'allowEval' },
          blocked: true
        });
        return false;
      }
      
      if (!this.securityConfig.policies.allowDynamicImports && /\bimport\s*\(/.test(fnString)) {
        this.recordViolation({
          alias,
          type: 'policy',
          severity: 'high',
          description: 'Function contains dynamic imports which are not allowed',
          details: { policy: 'allowDynamicImports' },
          blocked: true
        });
        return false;
      }
      
      // Check for suspicious patterns
      if (this.securityConfig.threatDetection.enabled) {
        for (const pattern of this.securityConfig.threatDetection.suspiciousPatterns) {
          if (pattern.test(fnString)) {
            this.recordViolation({
              alias,
              type: 'threat',
              severity: 'high',
              description: 'Function contains suspicious patterns',
              details: { pattern: pattern.source },
              blocked: true
            });
            return false;
          }
        }
      }
      
      this.recordAuditEntry({
        alias,
        executionId: this.generateExecutionId(),
        action: 'validate',
        result: 'success',
        duration: nowMs() - startTime
      });
      
      return true;
      
    } catch (error) {
      this.recordViolation({
        alias,
        type: 'validation',
        severity: 'medium',
        description: `Function validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : String(error) },
        blocked: true
      });
      
      return false;
    }
  }
  
  /**
   * Check rate limits
   */
  public checkRateLimit(alias: PulserAlias): boolean {
    if (!this.securityConfig.enabled || !this.securityConfig.rateLimit.enabled) {
      return true;
    }
    
    const now = nowMs();
    let state = this.rateLimits.get(alias);
    
    if (!state) {
      state = {
        alias,
        executions: [],
        blocked: false,
        violations: 0
      };
      this.rateLimits.set(alias, state);
    }
    
    // Check if currently blocked
    if (state.blocked && state.blockExpiry && now < state.blockExpiry) {
      this.recordViolation({
        alias,
        type: 'rate_limit',
        severity: 'medium',
        description: 'Rate limit exceeded - currently blocked',
        details: { 
          blockExpiry: state.blockExpiry,
          remainingTime: state.blockExpiry - now
        },
        blocked: true
      });
      return false;
    }
    
    // Clear expired block
    if (state.blocked && state.blockExpiry && now >= state.blockExpiry) {
      state.blocked = false;
      state.blockExpiry = undefined;
    }
    
    // Clean old executions
    const oneHourAgo = now - 3600000; // 1 hour
    const oneMinuteAgo = now - 60000; // 1 minute
    
    state.executions = state.executions.filter(time => time > oneHourAgo);
    
    // Check rate limits
    const executionsLastMinute = state.executions.filter(time => time > oneMinuteAgo).length;
    const executionsLastHour = state.executions.length;
    
    if (executionsLastMinute >= this.securityConfig.rateLimit.maxExecutionsPerMinute) {
      this.blockAlias(alias, 'Rate limit exceeded: too many executions per minute');
      return false;
    }
    
    if (executionsLastHour >= this.securityConfig.rateLimit.maxExecutionsPerHour) {
      this.blockAlias(alias, 'Rate limit exceeded: too many executions per hour');
      return false;
    }
    
    // Record execution
    state.executions.push(now);
    this.rateLimits.set(alias, state);
    
    return true;
  }
  
  /**
   * Assess threat level
   */
  public assessThreat(alias: PulserAlias): ThreatAssessment {
    const factors: Array<{ factor: string; weight: number; description: string }> = [];
    let score = 0;
    
    // Check violation history
    const violations = this.getViolationsForAlias(alias);
    if (violations.length > 0) {
      const recentViolations = violations.filter(v => nowMs() - v.timestamp < 3600000); // Last hour
      const violationWeight = Math.min(recentViolations.length * 10, 40);
      score += violationWeight;
      factors.push({
        factor: 'violation_history',
        weight: violationWeight,
        description: `${recentViolations.length} violations in the last hour`
      });
    }
    
    // Check rate limit state
    const rateLimitState = this.rateLimits.get(alias);
    if (rateLimitState && rateLimitState.blocked) {
      score += 30;
      factors.push({
        factor: 'rate_limited',
        weight: 30,
        description: 'Currently rate limited'
      });
    }
    
    // Check if alias is blocked
    if (this.blockedAliases.has(alias)) {
      score += 50;
      factors.push({
        factor: 'blocked_alias',
        weight: 50,
        description: 'Alias is currently blocked'
      });
    }
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 80) {
      riskLevel = 'critical';
    } else if (score >= 60) {
      riskLevel = 'high';
    } else if (score >= 30) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    
    return {
      riskLevel,
      score,
      factors,
      recommendation: this.getThreatRecommendation(riskLevel),
      shouldBlock: score >= 70
    };
  }
  
  /**
   * Block an alias
   */
  public blockAlias(alias: PulserAlias, reason: string): void {
    this.blockedAliases.add(alias);
    
    // Update rate limit state
    const state = this.rateLimits.get(alias) || {
      alias,
      executions: [],
      blocked: false,
      violations: 0
    };
    
    state.blocked = true;
    state.blockExpiry = nowMs() + this.securityConfig.rateLimit.blockDuration;
    state.violations++;
    
    this.rateLimits.set(alias, state);
    
    this.recordViolation({
      alias,
      type: 'rate_limit',
      severity: 'high',
      description: reason,
      details: { blockDuration: this.securityConfig.rateLimit.blockDuration },
      blocked: true
    });
    
    this.emit('alias_blocked', { alias, reason, timestamp: Date.now() });
    globalLogger.warn(`Blocked alias ${alias}: ${reason}`);
  }
  
  /**
   * Unblock an alias
   */
  public unblockAlias(alias: PulserAlias): boolean {
    const wasBlocked = this.blockedAliases.delete(alias);
    
    const state = this.rateLimits.get(alias);
    if (state) {
      state.blocked = false;
      state.blockExpiry = undefined;
      this.rateLimits.set(alias, state);
    }
    
    if (wasBlocked) {
      this.emit('alias_unblocked', { alias, timestamp: Date.now() });
      globalLogger.info(`Unblocked alias ${alias}`);
    }
    
    return wasBlocked;
  }
  
  /**
   * Check if alias is blocked
   */
  public isBlocked(alias: PulserAlias): boolean {
    return this.blockedAliases.has(alias);
  }
  
  /**
   * Get security violations
   */
  public getViolations(limit?: number): ReadonlyArray<SecurityViolation> {
    const violations = Array.from(this.violations.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return limit ? violations.slice(0, limit) : violations;
  }
  
  /**
   * Get violations for a specific alias
   */
  public getViolationsForAlias(alias: PulserAlias): ReadonlyArray<SecurityViolation> {
    return Array.from(this.violations.values())
      .filter(v => v.alias === alias)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Get security metrics
   */
  public getSecurityMetrics(): SecurityMetrics {
    const violations = Array.from(this.violations.values());
    
    const violationsByType: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};
    const aliasViolationCounts = new Map<PulserAlias, number>();
    
    let totalRiskScore = 0;
    let riskAssessments = 0;
    
    for (const violation of violations) {
      // Count by type
      violationsByType[violation.type] = (violationsByType[violation.type] || 0) + 1;
      
      // Count by severity
      violationsBySeverity[violation.severity] = (violationsBySeverity[violation.severity] || 0) + 1;
      
      // Count by alias
      const aliasCount = aliasViolationCounts.get(violation.alias) || 0;
      aliasViolationCounts.set(violation.alias, aliasCount + 1);
      
      // Calculate average risk score
      const threat = this.assessThreat(violation.alias);
      totalRiskScore += threat.score;
      riskAssessments++;
    }
    
    const topThreats = Array.from(aliasViolationCounts.entries())
      .map(([alias, violations]) => ({
        alias,
        violations,
        lastViolation: Math.max(...this.getViolationsForAlias(alias).map(v => v.timestamp))
      }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10);
    
    return {
      totalValidations: this.auditLog.filter(entry => entry.action === 'validate').length,
      totalViolations: violations.length,
      totalBlocked: violations.filter(v => v.blocked).length,
      violationsByType,
      violationsBySeverity,
      averageRiskScore: riskAssessments > 0 ? totalRiskScore / riskAssessments : 0,
      topThreats
    };
  }
  
  /**
   * Get security report
   */
  public getSecurityReport(): string {
    const metrics = this.getSecurityMetrics();
    const recentViolations = this.getViolations(10);
    
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('PULSOR SECURITY REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    
    lines.push('SECURITY METRICS:');
    lines.push(`  Total Validations: ${metrics.totalValidations}`);
    lines.push(`  Total Violations: ${metrics.totalViolations}`);
    lines.push(`  Total Blocked: ${metrics.totalBlocked}`);
    lines.push(`  Average Risk Score: ${metrics.averageRiskScore.toFixed(2)}`);
    lines.push('');
    
    lines.push('VIOLATIONS BY TYPE:');
    for (const [type, count] of Object.entries(metrics.violationsByType)) {
      lines.push(`  ${type}: ${count}`);
    }
    lines.push('');
    
    lines.push('VIOLATIONS BY SEVERITY:');
    for (const [severity, count] of Object.entries(metrics.violationsBySeverity)) {
      lines.push(`  ${severity}: ${count}`);
    }
    lines.push('');
    
    lines.push('TOP THREATS:');
    for (const threat of metrics.topThreats) {
      lines.push(`  ${threat.alias}: ${threat.violations} violations`);
    }
    lines.push('');
    
    lines.push('RECENT VIOLATIONS:');
    for (const violation of recentViolations) {
      const timeAgo = nowMs() - violation.timestamp;
      lines.push(`  [${violation.severity.toUpperCase()}] ${violation.alias}: ${violation.description} (${Math.round(timeAgo / 1000)}s ago)`);
    }
    
    lines.push('');
    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }
  
  /**
   * Clear security data
   */
  public clearSecurityData(alias?: PulserAlias): void {
    if (alias) {
      // Remove violations for specific alias
      for (const [id, violation] of this.violations) {
        if (violation.alias === alias) {
          this.violations.delete(id);
        }
      }
      
      // Remove rate limit state
      this.rateLimits.delete(alias);
      
      // Unblock alias
      this.unblockAlias(alias);
      
      globalLogger.info(`Cleared security data for ${alias}`);
    } else {
      this.violations.clear();
      this.rateLimits.clear();
      this.blockedAliases.clear();
      this.auditLog.length = 0;
      this.violationCounter = 0;
      
      globalLogger.info('Cleared all security data');
    }
  }
  
  /**
   * Destroy the security service
   */
  public override destroy(): void {
    this.clearSecurityData();
    this.removeAllListeners();
    globalLogger.info('Security service destroyed');
  }
  
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  
  private recordViolation(violation: Omit<SecurityViolation, 'id' | 'timestamp'>): void {
    const id = `violation_${++this.violationCounter}_${nowMs()}`;
    const fullViolation: SecurityViolation = {
      id,
      timestamp: nowMs(),
      ...violation
    };
    
    this.violations.set(id, fullViolation);
    
    // Emit violation event
    this.emit('security_violation', { violation: fullViolation, timestamp: Date.now() });
    
    // Log violation
    const logLevel = violation.severity === 'critical' || violation.severity === 'high' ? 'error' : 'warn';
    globalLogger[logLevel](`Security violation [${violation.severity}] for ${violation.alias}: ${violation.description}`);
    
    // Auto-block for critical violations
    if (violation.severity === 'critical' && !this.isBlocked(violation.alias)) {
      this.blockAlias(violation.alias, `Critical security violation: ${violation.description}`);
    }
  }
  
  private recordAuditEntry(entry: Omit<SecurityAuditEntry, 'timestamp'>): void {
    const fullEntry: SecurityAuditEntry = {
      timestamp: nowMs(),
      ...entry
    };
    
    this.auditLog.push(fullEntry);
    
    // Limit audit log size
    if (this.auditLog.length > 10000) {
      this.auditLog.shift();
    }
  }
  
  private calculateArgumentSize(arg: unknown): number {
    try {
      return JSON.stringify(arg).length * 2; // Rough estimate (UTF-16)
    } catch {
      return String(arg).length * 2;
    }
  }
  
  private containsBlockedPatterns(arg: unknown): boolean {
    if (typeof arg !== 'string') {
      try {
        arg = JSON.stringify(arg);
      } catch {
        arg = String(arg);
      }
    }
    
    const str = arg as string;
    return this.securityConfig.validation.blockedPatterns.some((pattern: RegExp) => pattern.test(str));
  }
  
  private generateExecutionId(): ExecutionId {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ExecutionId;
  }
  
  private getThreatRecommendation(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical':
        return 'Immediate action required: Block alias and investigate security breach';
      case 'high':
        return 'High risk detected: Increase monitoring and consider temporary restrictions';
      case 'medium':
        return 'Moderate risk: Monitor closely and review recent activity';
      case 'low':
      default:
        return 'Low risk: Continue normal monitoring';
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default security service
 */
export function createSecurityService(config?: Partial<SecurityConfig>): SecurityService {
  return new SecurityService(config);
}

/**
 * Create a strict security service with enhanced protection
 */
export function createStrictSecurityService(): SecurityService {
  return new SecurityService({
    enabled: true,
    sanitizeArguments: true,
    validateFunctions: true,
    monitorExecution: true,
    rateLimit: {
      enabled: true,
      maxExecutionsPerMinute: 100,
      maxExecutionsPerHour: 1000,
      blockDuration: 600000 // 10 minutes
    },
    validation: {
      maxArgumentSize: 64 * 1024, // 64KB
      maxArgumentCount: 10,
      allowedTypes: ['string', 'number', 'boolean'],
      blockedPatterns: [
        /eval\s*\(/i,
        /function\s*\(/i,
        /new\s+Function/i,
        /setTimeout\s*\(/i,
        /setInterval\s*\(/i,
        /<script[^>]*>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /\.\.[\/\\]/g,
        /[<>"'&]/g
      ]
    },
    policies: {
      allowEval: false,
      allowDynamicImports: false,
      allowFileSystemAccess: false,
      allowNetworkAccess: false,
      allowProcessAccess: false
    },
    threatDetection: {
      enabled: true,
      suspiciousPatterns: [
        /\.\.[\/\\]/g,
        /[<>"'&]/g,
        /\b(union|select|insert|update|delete|drop|create|alter)\b/i,
        /\b(eval|exec|system|shell_exec)\b/i,
        /\b(file_get_contents|fopen|readfile)\b/i,
        /\b(require|import)\s*\(/i
      ],
      maxFailureRate: 25,
      anomalyThreshold: 2
    }
  });
}

/**
 * Create a lenient security service for development
 */
export function createLenientSecurityService(): SecurityService {
  return new SecurityService({
    enabled: true,
    sanitizeArguments: false,
    validateFunctions: false,
    monitorExecution: true,
    rateLimit: {
      enabled: false,
      maxExecutionsPerMinute: 10000,
      maxExecutionsPerHour: 100000,
      blockDuration: 60000 // 1 minute
    },
    validation: {
      maxArgumentSize: 10 * 1024 * 1024, // 10MB
      maxArgumentCount: 1000,
      allowedTypes: ['string', 'number', 'boolean', 'object', 'undefined', 'function'],
      blockedPatterns: []
    },
    policies: {
      allowEval: true,
      allowDynamicImports: true,
      allowFileSystemAccess: true,
      allowNetworkAccess: true,
      allowProcessAccess: true
    },
    threatDetection: {
      enabled: false,
      suspiciousPatterns: [],
      maxFailureRate: 90,
      anomalyThreshold: 5
    }
  });
}

/**
 * Create a test security service
 */
export function createTestSecurityService(): SecurityService {
  return new SecurityService({
    enabled: true,
    sanitizeArguments: true,
    validateFunctions: true,
    monitorExecution: true,
    rateLimit: {
      enabled: true,
      maxExecutionsPerMinute: 10,
      maxExecutionsPerHour: 100,
      blockDuration: 1000 // 1 second
    },
    validation: {
      maxArgumentSize: 1024, // 1KB
      maxArgumentCount: 5,
      allowedTypes: ['string', 'number', 'boolean'],
      blockedPatterns: [/test_blocked/i]
    },
    policies: {
      allowEval: false,
      allowDynamicImports: false,
      allowFileSystemAccess: false,
      allowNetworkAccess: false,
      allowProcessAccess: false
    },
    threatDetection: {
      enabled: true,
      suspiciousPatterns: [/test_threat/i],
      maxFailureRate: 50,
      anomalyThreshold: 2
    }
  });
}

/**
 * Global security service instance
 */
export const globalSecurityService = createSecurityService();