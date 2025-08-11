/**
 * CircuitBreaker - Implementazione del pattern Circuit Breaker.
 * Aiuta a prevenire che un sistema tenti ripetutamente un'operazione che probabilmente fallirà,
 * consentendo al sistema di recuperare e sprecando meno risorse.
 *
 * @class CircuitBreaker
 */
export class CircuitBreaker {
  /**
   * Crea un'istanza di CircuitBreaker.
   * @param {number} [threshold=5] - Numero di fallimenti consecutivi per aprire il circuito.
   * @param {number} [resetTimeoutMs=60000] - Tempo in millisecondi dopo il quale il circuito passa a HALF_OPEN.
   */
  constructor(threshold = 5, resetTimeoutMs = 60000) {
    this.threshold = threshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = 0;
  }

  /**
   * Verifica se l'operazione può essere eseguita.
   * @returns {boolean} True se l'operazione può essere eseguita, altrimenti false.
   */
  canExecute() {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return this.state === 'HALF_OPEN';
  }

  /**
   * Chiamato quando l'operazione ha successo.
   * Resetta il contatore dei fallimenti e chiude il circuito.
   */
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  /**
   * Chiamato quando l'operazione fallisce.
   * Incrementa il contatore dei fallimenti e apre il circuito se la soglia è raggiunta.
   */
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
    }
  }
}