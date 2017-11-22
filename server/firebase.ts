import * as firebase from 'firebase';
import { Garage } from './garage';
import { EventEmitter } from 'events';

const conf = require('../firebase-config');
const app = firebase.initializeApp(conf);

export async function listen() {
  await app.auth().signInAnonymously();

  let ref = app.database().ref();
  console.log('Listening');

  ref.on('child_added', function (item) {
    if (!item) {
      console.log('Received empty');
      return;
    }
    //Read action/query from event
    const act = (item.val().action || '').toLowerCase();
    const query = (item.val().query || '').toLowerCase();

    //Consume message
    if (item.key) {
      ref.child(item.key).remove();
    }

    if (item.key === 'Action') {
      switch (item.val()) {
        case 'Activate':
        case 'Open':
        case 'Close':
          Garage.triggerDoor(item.val());
          break;
      }
    }
  });
}

export async function storeImage(path: string, data: Uint8Array) {
  await app.auth().signInAnonymously();
  let ref = await app.storage().ref();
  let img = ref.child(path);
  ref.put(data);
}
