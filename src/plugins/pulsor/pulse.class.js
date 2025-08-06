/**
 * Pulse è l'elemento di base per l'oggetto che verrà esposto
 */
import Pulsy from './pulsy.class.js';

export class Pulse {

  #params;

  #formatLog(message) {
    return `[Pulse]: ${message}`;
  }


  // Constructor
  constructor(pulsy) {

    if (!(pulsy instanceof Pulsy)) {
      throw new Error(this.#formatLog('Pulsy must be an instance of Pulsy'));
    }

    this.#params = pulsy.params;

  }

};
