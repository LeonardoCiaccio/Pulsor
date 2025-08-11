import { PulsorError } from './errors.class.js';

// --- Constants and Defaults ---

export const VALID_OPTIONS = Object.freeze({
  callbackStrategy: ['parallel', 'sequential'],
  schedule: ['immediate', 'microtask'],
  provideContext: ['none', 'prepend', 'append'],
  failFastCallbacks: 'boolean',
  errorCallbacksBeforeThrow: 'boolean',
  propagateMainError: 'boolean',
  preventConcurrentExecution: 'boolean',
  freezeArgs: 'boolean',
  timeout: 'number',
  maxRetries: 'number',
  circuitBreakerThreshold: 'number'
});

export const DEFAULT_OPTIONS = Object.freeze({
  callbackStrategy: 'parallel',
  failFastCallbacks: false,
  schedule: 'immediate',
  provideContext: 'none',
  errorCallbacksBeforeThrow: true,
  propagateMainError: true,
  preventConcurrentExecution: false,
  freezeArgs: false,
  timeout: 30000, // 30 seconds default timeout
  maxRetries: 0,
  circuitBreakerThreshold: 5
});

// --- Security & Validation Utils ---

export const DANGEROUS_KEYS = Object.freeze(['__proto__', 'constructor', 'prototype']);
export const ALIAS_REGEX = /^[a-zA-Z0-9_:-]+$/;
export const MAX_PATTERN_CALLBACKS = 1000;
export const MAX_CACHE_SIZE = 1000;

/**
 * Valida un alias per assicurarsi che sia una stringa valida e sicura.
 * @param {string} alias - L'alias da validare.
 * @returns {string} L'alias validato e pulito.
 * @throws {PulsorError} Se l'alias non è valido.
 */
export const validateAlias = (alias) => {
  if (typeof alias !== 'string' || alias.trim().length === 0 || alias.trim().length > 32) {
    throw new PulsorError('Alias must be a non-empty string, max 32 chars.');
  }
  const trimmed = alias.trim();
  if (!ALIAS_REGEX.test(trimmed)) {
    throw new PulsorError('Alias contains invalid characters. Only alphanumeric, underscore, colon and dash allowed.');
  }
  return trimmed;
};

/**
 * Valida che un valore sia una funzione. Se null o undefined, restituisce una funzione vuota.
 * @param {Function} fn - La funzione da validare.
 * @param {string} [type='Function'] - Il tipo di funzione per il messaggio di errore.
 * @returns {Function} La funzione validata o una funzione vuota.
 * @throws {PulsorError} Se il valore non è una funzione.
 */
export const validateFunction = (fn, type = 'Function') => {
  if (fn === null || fn === undefined) return () => { };
  if (typeof fn !== 'function') throw new PulsorError(`${type} must be a function.`);
  return fn;
};

/**
 * Valida le opzioni fornite rispetto a un set di opzioni valide predefinite.
 * @param {object} options - Le opzioni da validare.
 * @param {string} source - La fonte delle opzioni (per messaggi di errore più chiari).
 * @throws {PulsorError} Se una o più opzioni non sono valide.
 */
export const validateOptions = (options, source) => {
  const errors = [];
  Object.entries(options).forEach(([key, value]) => {
    // Security: Prevent prototype pollution
    if (DANGEROUS_KEYS.includes(key)) {
      errors.push(`Dangerous key '${key}' not allowed`);
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(VALID_OPTIONS, key)) {
      errors.push(`Invalid option '${key}'`);
      return;
    }
    const expected = VALID_OPTIONS[key];
    if (Array.isArray(expected) && !expected.includes(value)) {
      errors.push(`Invalid value for '${key}': '${value}'. Expected one of: ${expected.join(', ')}`);
    } else if (expected === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Invalid type for '${key}': expected boolean, got ${typeof value}`);
    }
  });
  if (errors.length > 0) {
    throw new PulsorError(`Option validation failed for ${source}: ${errors.join('; ')}`);
  }
};

/**
 * Sanitizza gli argomenti clonando profondamente gli oggetti per prevenire la prototype pollution e garantire l'immutabilità.
 * Utilizza `structuredClone` per una clonazione profonda robusta in ambienti browser moderni.
 * @param {Array<any>} args - Gli argomenti da sanitizzare.
 * @param {boolean} deepClone - Se eseguire una clonazione profonda usando structuredClone. Defaults a false (copia superficiale).
 * @returns {Array<any>} Un nuovo array con gli argomenti sanitizzati (clonati profondamente o copiati superficialmente).
 * @throws {PulsorError} Se gli argomenti non sono un array valido.
 */
export const sanitizeArgs = (args, deepClone = false) => {
  // Validazione rigorosa degli input
  if (!Array.isArray(args)) {
    throw new PulsorError('Gli argomenti devono essere forniti come array');
  }
  
  // Controllo di sicurezza per array molto grandi
  if (args.length > 1000) {
    console.warn('[Pulsor] Array di argomenti molto grande (>1000 elementi). Possibile problema di performance.');
  }
  
  return args.map((arg, index) => {
    try {
      // Controllo per valori pericolosi
      if (arg && typeof arg === 'object') {
        // Prevenzione prototype pollution
        if (DANGEROUS_KEYS.some(key => Object.prototype.hasOwnProperty.call(arg, key))) {
          console.warn(`[Pulsor] Rilevata chiave pericolosa nell'argomento ${index}. Rimozione delle chiavi pericolose.`);
          const sanitized = Array.isArray(arg) ? [...arg] : { ...arg };
          DANGEROUS_KEYS.forEach(key => delete sanitized[key]);
          return sanitized;
        }
        
        if (deepClone) {
          // Controllo disponibilità structuredClone
          if (typeof structuredClone === 'undefined') {
            console.warn('[Pulsor] structuredClone non disponibile. Fallback a copia superficiale.');
            return Array.isArray(arg) ? [...arg] : { ...arg };
          }
          
          try {
            return structuredClone(arg);
          } catch (cloneError) {
            console.warn(`[Pulsor] Impossibile clonare profondamente l'argomento ${index} (tipo: ${typeof arg}). Fallback a copia superficiale. Errore: ${cloneError.message}`);
            return Array.isArray(arg) ? [...arg] : { ...arg };
          }
        } else {
          // Copia superficiale sicura
          return Array.isArray(arg) ? [...arg] : { ...arg };
        }
      }
      
      // Per tipi primitivi, restituisci il valore così com'è
      return arg;
      
    } catch (sanitizeError) {
      console.error(`[Pulsor] Errore durante la sanitizzazione dell'argomento ${index}:`, sanitizeError.message);
      // In caso di errore, restituisci undefined per sicurezza
      return undefined;
    }
  });
};

/**
 * Restituisce il timestamp corrente in millisecondi con gestione degli errori.
 * Fornisce un fallback sicuro in caso di problemi con Date.now().
 * @returns {number} Il timestamp corrente in millisecondi.
 */
export const nowMs = () => {
  try {
    const timestamp = Date.now();
    
    // Validazione del risultato
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp < 0) {
      console.warn('[Pulsor] Date.now() ha restituito un valore non valido. Usando performance.now() come fallback.');
      
      // Fallback a performance.now() se disponibile
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        const perfTime = performance.now();
        // performance.now() restituisce il tempo relativo, quindi aggiungiamo un offset approssimativo
        return Math.floor(perfTime + 1640995200000); // Offset approssimativo per 2022
      }
      
      // Ultimo fallback: costruzione manuale del timestamp
      return Math.floor(new Date().getTime());
    }
    
    return timestamp;
    
  } catch (error) {
    console.error('[Pulsor] Errore critico nel recupero del timestamp:', error.message);
    
    // Fallback di emergenza
    try {
      return Math.floor(new Date().getTime());
    } catch (fallbackError) {
      console.error('[Pulsor] Anche il fallback del timestamp è fallito:', fallbackError.message);
      // Ultimo resort: timestamp fisso (non ideale ma previene crash)
      return 1640995200000; // 1 gennaio 2022
    }
  }
};

/**
 * Converte un pattern (stringa o RegExp) in un oggetto RegExp.
 * Le stringhe vengono convertite in RegExp con gestione dei caratteri speciali e del wildcard '*'.
 * @param {string|RegExp} pattern - Il pattern da convertire.
 * @returns {RegExp} L'oggetto RegExp risultante.
 */
export const toRegex = (pattern) => {
  if (pattern instanceof RegExp) return pattern;
  const str = String(pattern).replace(/[-/\\^$+?.()|[\\]{}]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${str}$`);
};