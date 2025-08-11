/**
 * Configurazione di Sicurezza per Pulsor
 * @version 1.0.0
 * 
 * Questo file contiene le configurazioni di sicurezza e le policy
 * per il framework Pulsor, incluse le validazioni, i limiti e
 * le protezioni contro attacchi comuni.
 */

// --- Configurazioni di Sicurezza ---

/**
 * Limiti di sicurezza per prevenire attacchi DoS e uso eccessivo di risorse
 */
export const SECURITY_LIMITS = Object.freeze({
  // Limiti per pattern e callback
  MAX_PATTERN_CALLBACKS: 1000,
  MAX_CALLBACKS_PER_PULSER: 100,
  MAX_NESTED_CALLS: 50,
  
  // Limiti per argomenti e dati
  MAX_ARGS_LENGTH: 1000,
  MAX_STRING_LENGTH: 10000,
  MAX_OBJECT_DEPTH: 10,
  
  // Limiti temporali
  DEFAULT_TIMEOUT: 30000, // 30 secondi
  MAX_TIMEOUT: 300000,    // 5 minuti
  MIN_TIMEOUT: 100,       // 100ms
  
  // Limiti per retry e circuit breaker
  MAX_RETRIES: 10,
  DEFAULT_CIRCUIT_BREAKER_THRESHOLD: 5
});

/**
 * Chiavi pericolose che possono causare prototype pollution
 */
export const DANGEROUS_KEYS = Object.freeze([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toString',
  'valueOf'
]);

/**
 * Pattern regex per validazione sicura degli alias
 */
export const SECURITY_PATTERNS = Object.freeze({
  SAFE_ALIAS: /^[a-zA-Z0-9_:-]+$/,
  SAFE_PATTERN: /^[a-zA-Z0-9_:.*-]+$/,
  DANGEROUS_SCRIPT: /<script[^>]*>.*?<\/script>/gi,
  DANGEROUS_EVAL: /(eval|Function|setTimeout|setInterval)\s*\(/gi
});

/**
 * Configurazioni per Content Security Policy (CSP)
 */
export const CSP_CONFIG = Object.freeze({
  ALLOWED_SOURCES: {
    script: ["'self'", "'unsafe-inline'"],
    style: ["'self'", "'unsafe-inline'"],
    img: ["'self'", "data:", "https:"],
    connect: ["'self'"]
  },
  
  BLOCKED_SOURCES: [
    "'unsafe-eval'",
    "data:text/html",
    "javascript:"
  ]
});

/**
 * Funzioni di validazione di sicurezza
 */
export class SecurityValidator {
  /**
   * Valida se una stringa contiene contenuto potenzialmente pericoloso
   * @param {string} input - La stringa da validare
   * @returns {boolean} True se la stringa è sicura
   */
  static isSafeString(input) {
    if (typeof input !== 'string') return false;
    
    // Controlla lunghezza
    if (input.length > SECURITY_LIMITS.MAX_STRING_LENGTH) return false;
    
    // Controlla pattern pericolosi
    if (SECURITY_PATTERNS.DANGEROUS_SCRIPT.test(input)) return false;
    if (SECURITY_PATTERNS.DANGEROUS_EVAL.test(input)) return false;
    
    return true;
  }
  
  /**
   * Valida se un oggetto è sicuro (non contiene chiavi pericolose)
   * @param {object} obj - L'oggetto da validare
   * @param {number} depth - Profondità corrente (per prevenire ricorsione infinita)
   * @returns {boolean} True se l'oggetto è sicuro
   */
  static isSafeObject(obj, depth = 0) {
    if (depth > SECURITY_LIMITS.MAX_OBJECT_DEPTH) return false;
    if (obj === null || typeof obj !== 'object') return true;
    
    // Controlla chiavi pericolose
    const keys = Object.keys(obj);
    if (keys.some(key => DANGEROUS_KEYS.includes(key))) return false;
    
    // Validazione ricorsiva per oggetti annidati
    return keys.every(key => {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        return this.isSafeObject(value, depth + 1);
      }
      if (typeof value === 'string') {
        return this.isSafeString(value);
      }
      return true;
    });
  }
  
  /**
   * Sanitizza un oggetto rimuovendo chiavi pericolose
   * @param {object} obj - L'oggetto da sanitizzare
   * @returns {object} L'oggetto sanitizzato
   */
  static sanitizeObject(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    Object.keys(obj).forEach(key => {
      if (!DANGEROUS_KEYS.includes(key)) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    });
    
    return sanitized;
  }
  
  /**
   * Valida i limiti di timeout
   * @param {number} timeout - Il timeout da validare
   * @returns {number} Il timeout validato e limitato
   */
  static validateTimeout(timeout) {
    if (typeof timeout !== 'number' || !Number.isFinite(timeout)) {
      return SECURITY_LIMITS.DEFAULT_TIMEOUT;
    }
    
    return Math.max(
      SECURITY_LIMITS.MIN_TIMEOUT,
      Math.min(timeout, SECURITY_LIMITS.MAX_TIMEOUT)
    );
  }
}

/**
 * Rate limiter per prevenire abusi
 */
export class RateLimiter {
  #requests = new Map();
  #windowMs;
  #maxRequests;
  
  constructor(windowMs = 60000, maxRequests = 100) {
    this.#windowMs = windowMs;
    this.#maxRequests = maxRequests;
  }
  
  /**
   * Controlla se una richiesta è permessa
   * @param {string} identifier - Identificatore univoco per il rate limiting
   * @returns {boolean} True se la richiesta è permessa
   */
  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.#windowMs;
    
    // Pulisci richieste vecchie
    if (!this.#requests.has(identifier)) {
      this.#requests.set(identifier, []);
    }
    
    const requests = this.#requests.get(identifier);
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.#maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.#requests.set(identifier, validRequests);
    
    return true;
  }
  
  /**
   * Pulisce le richieste scadute
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.#windowMs;
    
    for (const [identifier, requests] of this.#requests.entries()) {
      const validRequests = requests.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        this.#requests.delete(identifier);
      } else {
        this.#requests.set(identifier, validRequests);
      }
    }
  }
}

export default {
  SECURITY_LIMITS,
  DANGEROUS_KEYS,
  SECURITY_PATTERNS,
  CSP_CONFIG,
  SecurityValidator,
  RateLimiter
};