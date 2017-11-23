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
    //Consume message
    if (item.key) {
      ref.child(item.key).remove();
    }

    //Read action/query from event
    const value = (item.val().value || '').toLowerCase();
    let time = (item.val().time || 0);
    time = time - (time % 1000);


    if (seen.get(item.key!) === time) {
      console.log(`[Firebase] Already processed event ${item.key}=${value} @ ${time}`);
    } else {
      console.log(`[Firebase] Raw Event { ${item.key} : ${JSON.stringify(item.val())} }`);
      console.log(`[Firebase] Processing ${item.key}=${value} @ ${time}`);
    }

    switch (item.key) {
      case 'Activate':
        Garage.triggerDoor(value);
        break;
      case 'Snapshot':
        Garage.exposeSnapshot();
        break;
    }
  });
}