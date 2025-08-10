# Pulsor v3

> Event-driven Function Orchestrator
> Sistema modulare per registrare, eseguire e gestire funzioni nominate con hook multi-fase, metriche e gestione avanzata dei callback.

## Sommario

* Introduzione
* Caratteristiche Principali
* Installazione
* Struttura del Progetto
* Utilizzo Base
* Configurazione e Opzioni
* Hook e Strategie di Callback
* API Reference
* Metriche e Osservabilità
* Gestione Errori
* Esempi Avanzati
* Best Practice
* Licenza

## Introduzione

Pulsor è un orchestratore di funzioni JavaScript/TypeScript che consente di registrare metodi sincroni e asincroni sotto alias nominali, aggiungere hook in tre fasi (`before`, `after`, `error`), raccogliere metriche e gestire side-effects in modo disaccoppiato.

Ideale per plugin system, microfrontend, pipeline di eventi, logging, metriche e ogni scenario in cui serva estendere o osservare l’esecuzione di funzioni in modo modulare e scalabile.

## Caratteristiche Principali

* Registrazione e aggiornamento di funzioni con alias stringa
* Esecuzione unica per funzioni sincrone e asincrone
* Hook di fase (`before`, `after`, `error`) con priorità, contesto e flag `once`
* Strategie di callback: `parallel` o `sequential`
* Configurazione fail-fast sui callback
* Iniezione di contesto pre/post esecuzione
* Metriche interne (conteggio, durata media, timestamp)
* Supporto a wildcard e namespace per introspezione
* API per distruzione, verifica esistenza, elenchi e debug

## Installazione

npm install pulsor

// ES Module
import {
  CreatePulser,
  Pulsor,
  UpdatePulser,
  DestroyPulser,
  PulserExists,
  ListPulsers,
  GetPulserInfo,
  SetLoggy,
  PulsorError
} from 'pulsor';

// CommonJS
const {
  CreatePulser,
  Pulsor,
  UpdatePulser,
  DestroyPulser,
  PulserExists,
  ListPulsers,
  GetPulserInfo,
  SetLoggy,
  PulsorError
} = require('pulsor');

## Struttura del Progetto

/src
  /orchestrator
    pulsor.js          # Import e setup base Pulsor
  /modules
    logger.js          # Plugin di logging
    analytics.js       # Plugin di metriche personalizzate
    ui-spinner.js      # Spinner per UI
  index.js             # Punto di ingresso
README.md              # Documentazione progetto

## Utilizzo Base

// Definisci la funzione sotto alias 'sum'
CreatePulser('sum', (a, b) => a + b);

// Ottieni il controller
const sumPulser = Pulsor('sum');

// Esegui la funzione
const result = sumPulser.pulse(3, 5);
console.log(result); // 8

// Funzione asincrona
CreatePulser('fetchUser', async (id) => {
  const resp = await fetch(`/api/user/${id}`);
  return resp.json();
}, { isAsync: true });

const fetchUser = Pulsor('fetchUser');
const user = await fetchUser.pulse(42);

## Configurazione e Opzioni

| Opzione | Tipo | Default | Descrizione | 
| --- | --- | --- | --- | 
| isAsync | boolean | auto | Forza il pulser a trattare la funzione come async o sync | 
| callbackStrategy | 'parallel' | 'sequential' | 'parallel' | Modalità di esecuzione dei callback | 
| failFastCallbacks | boolean | false | Se true, ferma l’esecuzione dei callback al primo errore | 
| schedule | 'immediate' | 'microtask' | 'immediate' | Quando eseguire i callback post-esecuzione | 
| provideContext | 'none' | 'prepend' | 'append' | 'none' | Inietta un oggetto contesto nei callback | 
| errorCallbacksBeforeThrow | boolean | true | Esegue hook error prima di rilanciare l’errore principale | 
| propagateMainError | boolean | true | Se true, rilancia l’errore generato dalla funzione principale | 
| override | boolean | false | Se true, sovrascrive un pulser già esistente | 
| resetCallbacks | boolean | false | Se true e override, rimuove i callback esistenti | 
| resetMetrics | boolean | false | Se true e override, azzera le metriche | 

## Hook e Strategie di Callback

Ogni Pulser controller espone i metodi:

* bind(fn, options?)
* unbind(fn, options?)
* unbindAll(options?)

Le opzioni per hook:

| Opzione | Tipo | Default | Descrizione | 
| --- | --- | --- | --- | 
| phase | 'before' | 'after' | 'error' | 'after' | Fase in cui eseguire il callback | 
| priority | number | 0 | Ordine di esecuzione (più alto = prima) | 
| once | boolean | false | Esegui solo una volta | 

// Esempio con hook di fase
const checkout = Pulsor('checkout');

// Prima dell’esecuzione
checkout.bind((order, ctx) => {
  ctx.startedAt = Date.now();
}, { phase: 'before' });

// Dopo l’esecuzione
checkout.bind((order, ctx) => {
  console.log('Durata:', Date.now() - ctx.startedAt, 'ms');
}, { phase: 'after', priority: 5 });

// In caso di errore
checkout.bind((order, ctx) => {
  console.error('Errore durante checkout:', ctx.error);
}, { phase: 'error', once: true });

## API Reference

CreatePulser(alias: string, fn: Function, options?: object): void
UpdatePulser(alias: string, fn: Function, options?: object): void
DestroyPulser(alias: string): void
PulserExists(alias: string): boolean
ListPulsers(pattern?: string): string[]
GetPulserInfo(alias: string): {
  options, pulseCount, lastPulsedAt, avgDuration, totalDuration
}
SetLoggy(config: { error: boolean, warn: boolean, info: boolean, log: boolean }): void
Pulsor(alias: string): PulserController

PulserController interface:

interface PulserController {
  pulse(...args: any[]): any | Promise<any>
  bind(fn: Function, options?: { phase?: string; priority?: number; once?: boolean }): void
  unbind(fn: Function, options?: object): void
  unbindAll(options?: object): void
  bound(): (...args: any[]) => any | Promise<any>
}

## Metriche e Osservabilità

Ogni Pulser traccia:

* pulseCount — numero di esecuzioni
* lastPulsedAt — timestamp ultima pulsazione
* avgDuration — durata media in millisecondi
* totalDuration — somma delle durate

const info = GetPulserInfo('sum');
console.table(info);

## Gestione Errori

* Callback phase: 'error' intercetta errori della funzione principale
* propagateMainError: false sopprime il rilancio dell’errore
* failFastCallbacks: true arresta la catena callback in caso di eccezione

try {
  await Pulsor('checkout').pulse(order);
} catch (err) {
  if (err instanceof PulsorError) {
    console.error('Errore pulsor:', err.message);
  } else {
    throw err;
  }
}

## Esempi Avanzati

// Modulo Logger Separato
import { Pulsor } from 'pulsor';

export function initLogger() {
  const logger = Pulsor('sum');
  logger.bind((a, b, result, ctx) => {
    console.info(`[SUM] Args: ${a},${b} → ${result}`);
  }, { phase: 'after' });
}

// Pipeline di Eventi con Wildcard
CreatePulser('user:created', data => sendWelcomeEmail(data), { isAsync: true });
CreatePulser('user:created', data => analytics.track('signup', data));
CreatePulser('user:deleted', data => analytics.track('delete', data));

const handlers = ListPulsers('user:*').map(alias => Pulsor(alias));
handlers.forEach(h => h.bind((data) => console.log(alias, data), { phase: 'after' }));

// UI Spinner Plugin
import { Pulsor } from 'pulsor';

export function attachSpinner(alias) {
  const p = Pulsor(alias);
  p.bind(() => showSpinner(), { phase: 'before' });
  p.bind(() => hideSpinner(), { phase: 'after', once: true });
}

## Best Practice

* Usa alias namespaced (module:action) per chiarezza
* Separa plugin in moduli distinti
* Inietta contesto per comunicare dati tra hook
* Monitora le metriche per ottimizzare le performance
* Aggiorna funzioni con UpdatePulser per deploy senza downtime

## Licenza

Rilasciato sotto licenza MIT. Libera a riutilizzare e modificare secondo le tue esigenze.
