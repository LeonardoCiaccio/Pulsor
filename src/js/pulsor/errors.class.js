/**
 * PulsorError - Classe base per gli errori specifici di Pulsor.
 * Estende la classe Error nativa di JavaScript per fornire messaggi più specifici
 * e la possibilità di incapsulare una causa originale dell'errore.
 *
 * @class PulsorError
 * @extends Error
 */
export class PulsorError extends Error {
  /**
   * Crea un'istanza di PulsorError.
   * @param {string} message - Il messaggio di errore.
   * @param {Error} [cause] - L'errore originale che ha causato questo errore.
   */
  constructor(message, cause) {
    super(message);
    this.name = 'PulsorError';
    if (cause) {
      this.cause = cause;
      if (cause instanceof Error && cause.stack) {
        this.stack = `${this.stack.split('\n')[0]}\nCaused by: ${cause.stack}`;
      }
    }
  }
}

/**
 * PulsorStoppedError - Errore specifico per indicare che un'operazione è stata interrotta.
 * Estende PulsorError.
 *
 * @class PulsorStoppedError
 * @extends PulsorError
 */
export class PulsorStoppedError extends PulsorError {
  /**
   * Crea un'istanza di PulsorStoppedError.
   * @param {string} message - Il messaggio di errore.
   * @param {Error} [cause] - L'errore originale che ha causato questo errore.
   */
  constructor(message, cause) {
    super(message, cause);
    this.name = 'PulsorStoppedError';
  }
}