import * as firebase from 'firebase';
import { Garage } from './garage';

const app = firebase.initializeApp({
  apiKey: "AIzaSyD0Au3CmDkW0xJEMx48RwrT9LQx_JxEi-A",
  authDomain: "garagedoorapp-1d1fe.firebaseapp.com",
  databaseURL: "https://garagedoorapp-1d1fe.firebaseio.com",
  projectId: "garagedoorapp-1d1fe",
  storageBucket: "",
  messagingSenderId: "955528203315"
});

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

    //Run listeners
    console.log("RECEIVED:", act, query, item.val());
  });
}
