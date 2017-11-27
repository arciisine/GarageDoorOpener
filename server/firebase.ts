import * as firebase from 'firebase';
import { Garage } from './garage';
import { EventEmitter } from 'events';

const conf = require('../firebase-config');
const app = firebase.initializeApp(conf);

export const config = conf;

export async function listen() {
  await app.auth().signInAnonymously();

  const ref = app.database().ref();
  console.log('[Firebase] Listening');

  const seen = new Map<string, number>();
  seen.set('Activate', 0);
  seen.set('Snapshot', 0);

  ref.on('child_added', async function (item) {
    if (!item || !item.exists) {
      console.log('[Firebase] Received ' + (!item ? 'empty' : 'expired'));
      return;
    }

    const key = item.key;
    if (!key) {
      return;
    }

    //Consume message
    await ref.child(key).remove();

    const val = Object.assign({ value: undefined }, item.val());

    //Read action/query from event
    const value = val.value;

    let time = Date.now();
    let prev = seen.get(key) || 0;


    if ((time - prev) < 2000) {
      console.log(`[Firebase] Already processed event ${key}=${value} @ ${time}`);
    } else {
      console.log(`[Firebase] Raw Event { ${key} : ${JSON.stringify(item.val())} }`);
      console.log(`[Firebase] Processing ${key}=${value} @ ${time}`);
      console.log(`[Firebase] Timestamps prev=${prev} curr=${time}`);
      seen.set(key, time);
    }

    switch (key) {
      case 'Activate': Garage.triggerDoor(value); break;
    }
  });
}