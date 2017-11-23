import * as firebase from 'firebase';
import { Garage } from './garage';
import { EventEmitter } from 'events';

const conf = require('../firebase-config');
const app = firebase.initializeApp(conf);

export const config = conf;

export async function listen() {
  await app.auth().signInAnonymously();

  let ref = app.database().ref();
  console.log('[Firebase] Listening');

  let seen = new Map<string, number>();

  ref.on('child_added', function (item) {
    if (!item || !item.exists) {
      console.log('[Firebase] Received ' + (!item ? 'empty' : 'expired'));
      return;
    }

    let key = item.key;

    //Consume message
    if (key) {
      ref.child(key).remove();
    }

    let val = Object.assign({ value: undefined }, item.val());

    //Read action/query from event
    const value = val.value;

    let time = Date.now();
    time = time - (time % 2000);

    if (seen.get(key!) === time) {
      console.log(`[Firebase] Already processed event ${key}=${value} @ ${time}`);
    } else {
      seen.set(key!, time);
      console.log(`[Firebase] Raw Event { ${key} : ${JSON.stringify(item.val())} }`);
      console.log(`[Firebase] Processing ${key}=${value} @ ${time}`);
    }

    switch (key) {
      case 'Activate':
        Garage.triggerDoor(value);
        break;
      case 'Snapshot':
        Garage.exposeSnapshot();
        break;
    }
  });
}