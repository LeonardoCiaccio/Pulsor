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
 */
export const sanitizeArgs = (args, deepClone = false) => {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      if (deepClone) {
        try {
          return structuredClone(arg);
        } catch (e) {
          // Fallback a copia superficiale se structuredClone fallisce, con un log di avviso.
          // Questo rende il sistema più resiliente, ma la clonazione profonda potrebbe essere compromessa.
          // safeLog deve essere importato o passato se necessario.
          // Per ora, assumiamo che safeLog sia disponibile o che questa funzione sia usata in un contesto dove lo è.
          // Se safeLog non è disponibile qui, si dovrebbe usare console.warn o un meccanismo di log alternativo.
          console.warn(`[Pulsor] Impossibile clonare profondamente l'argomento (tipo: ${typeof arg}). Fallback a copia superficiale. Errore: ${e.message}`, { argType: typeof arg, error: e.message, argValue: arg });
          return Array.isArray(arg) ? [...arg] : { ...arg };
        }
      } else {
          // Per deepClone=false, si esegue una copia superficiale per gli oggetti.
          // Questo previene la modifica diretta dell'oggetto originale, ma non degli oggetti annidati.
          // Si usa Object.assign per una copia superficiale che gestisce anche array e altri oggetti iterabili.
          return Array.isArray(arg) ? [...arg] : { ...arg };
        }
    }
    return arg;
  });
};

export const nowMs = () => Date.now();

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