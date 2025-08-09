/**
 * @file create.structure.js
 * @description This module provides a function to create and append a structure element to the DOM.
 * It leverages the Pulsor utility for asynchronous operations and fragment fetching.
 */

import { CreatePulser, Pulsor } from '../js/pulsor/pulsor';

/**
 * Creates and appends a structure element to the document body.
 * This function uses `CreatePulser` to manage the lifecycle of the structure creation process,
 * fetching an HTML fragment and injecting it into a new div element.
 *
 * @returns {Promise<HTMLDivElement|null>} A promise that resolves with the created div element
 *                                         if successful, or `null` if the fragment is not found
 *                                         or an error occurs during the process.
 */
export const CreateStructure = function (template) {
  return CreatePulser('structure:created', async () => {
    try {

      /**
       * Fetches the 'structure1' HTML fragment using Pulsor.
       * @type {string|null}
       */
      const content = await Pulsor('fetch:template').pulse(template);

      // Validate if the content template was successfully retrieved.
      if (content === null) {
        console.warn(`Template '${template}' not found, returning null.`);
        return null; // Return null if template not found.
      }

      /**
       * Creates a new div element to house the structure content.
       * @type {HTMLDivElement}
       */
      const structureDiv = document.createElement('div');
      structureDiv.id = 'structure';
      structureDiv.innerHTML = content;

      // Appends the newly created div element to the document body.
      document.body.appendChild(structureDiv);

      // Returns the created div element for further manipulation or reference.
      return structureDiv;
    } catch (error) {
      // Logs any errors that occur during the fragment fetching or DOM manipulation.
      console.error('Error creating structure:', error);
      return null; // Ensures the function gracefully handles errors.
    }
  });
};
