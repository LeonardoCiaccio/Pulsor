/**
 * Il main è il punto d'ingresso, qui gestiamo il caricamento del framework
 */
import { InstallPulsorFetchTemplate } from './js/plugins/pulsor.fetch.template';
import { CreateStructure } from './components/create.structure';

document.addEventListener('DOMContentLoaded', async () => {

  InstallPulsorFetchTemplate();

  CreateStructure('structure').pulse();

});
