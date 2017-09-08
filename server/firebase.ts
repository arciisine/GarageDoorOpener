import * as firebase from 'firebase';
import { Garage } from './garage';

const app = firebase.initializeApp(require('../firebase-config'));

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
