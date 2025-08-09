import { CreatePulser, Pulsor } from '../js/pulsor/pulsor';

export const CreateStructure = function () {

  return CreatePulser('structure:created', async () => {

    const content = await Pulsor('fetch:fragment').pulse('structure1');

    if (content === null) {
      console.warn('Fragment not found, returning null.');
      return null; // Return null if fragment not found
    }

    // Creo un elemento div
    const div = document.createElement('div');
    div.id = 'structure';
    div.innerHTML = content;

    // Inserisco il div nel body
    document.body.appendChild(div);

    // Ritorna il div
    return div;

  });

};
