/**
 * Il main è il punto d'ingresso, qui gestiamo il caricamento del framework
 */
import { InstallPulsorFetchFragment } from './js/tools/pulsor.fetch.fragment';
import { CreateStructure } from './components/create.structure';

document.addEventListener('DOMContentLoaded', async () => {

  InstallPulsorFetchFragment().bind((fragment) => {
    console.log('Fragment fetched: ', fragment);
  });

  CreateStructure()
    .bind(() => {
      console.log('Structure created');
    })
    .pulse();

});
