/**
 * AsyncLock - Implementazione semplice di un meccanismo di lock asincrono.
 * Garantisce che le operazioni che richiedono il lock vengano eseguite in sequenza.
 * Supporta un timeout per prevenire blocchi indefiniti.
 *
 * @class AsyncLock
 */
export class AsyncLock {
  constructor() {
    this.locked = false;
    this.queue = [];
  }

  /**
   * Acquisisce il lock. Restituisce una Promise che si risolve quando il lock è acquisito.
   * Se un timeout è specificato, la Promise verrà rigettata se il lock non può essere acquisito entro il tempo limite.
   * @param {number} [timeout=0] - Tempo massimo in ms per attendere il lock. 0 per nessun timeout.
   * @returns {Promise<void>} Una Promise che si risolve quando il lock è acquisito.
   */
  acquire(timeout = 0) {
    return new Promise((resolve, reject) => {
      let timeoutId;
      const releaseLockAndResolve = () => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve();
      };

      this.queue.push(releaseLockAndResolve);

      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          // Rimuovi la funzione di risoluzione dalla coda se il timeout scatta prima dell'acquisizione
          const index = this.queue.indexOf(releaseLockAndResolve);
          if (index > -1) {
            this.queue.splice(index, 1);
          }
          reject(new PulsorError(`Acquisition of lock timed out after ${timeout}ms.`));
        }, timeout);
      }

      if (!this.locked) {
        this.#processNext();
      }
    });
  }

  /**
   * Rilascia il lock, permettendo alla prossima operazione in coda di procedere.
   */
  release() {
    this.locked = false;
    this.#processNext();
  }

  /**
   * Processa la prossima operazione in coda se il lock è disponibile.
   * @private
   */
  #processNext() {
    if (this.queue.length > 0 && !this.locked) {
      this.locked = true;
      const next = this.queue.shift();
      next(); // Risolve la Promise in acquire()
    }
  }
}

// Importa PulsorError se necessario, assumendo che sia definito altrove o passato come dipendenza.
// Per ora, lo importiamo direttamente per coerenza con il file originale.
import { PulsorError } from './pulsor.js';