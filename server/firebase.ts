import * as firebase from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseDb from 'firebase/database';
import { Garage } from './garage';
import { Inject, Injectable } from '@travetto/di';

const conf = require('../firebase-config');

export const config = conf;

@Injectable({ autoCreate: true })
export class FirebaseListener {

  @Inject()
  garage: Garage;

  seen = new Map<string, number>([
    ['Activate', 0],
    ['Snapshot', 0]
  ]);

  onUpdate(item: firebaseDb.DataSnapshot): void {
    if (!item || item.key !== 'Activate') {
      return;
    }

    if (!item.exists) {
      console.log('[Firebase] Received', item);
      return;
    }

    const key = item.key;

    //Consume message

    const val = Object.assign({ value: undefined }, item.val());

    //Read action/query from event
    const value = val.value;

    let time = Date.now();
    let prev = this.seen.get(key) || 0;

    if ((time - prev) < 2000) {
      console.log('[Firebase] Already processed event', { [key]: value, time });
    } else {
      console.log('[Firebase] Raw Event', { [key]: item.val() });
      console.log('[Firebase] Processing', { [key]: value, time });
      console.log('[Firebase] Timestamps', { prev, curr: time });
      this.seen.set(key, time);
    }

    switch (key) {
      case 'Activate': this.garage.triggerDoor(value); break;
    }
  }

  async postConstruct() {
    const app = firebase.initializeApp(conf);
    const auth = firebaseAuth.getAuth(app);
    const db = firebaseDb.getDatabase(app);

    firebaseAuth.signInAnonymously(auth);
    const ref = firebaseDb.ref(db);
    console.log('[Firebase] Listening');

    const q = firebaseDb.query(ref, firebaseDb.orderByKey());

    firebaseDb.onChildAdded(q, (item) => this.onUpdate(item));
    firebaseDb.onChildChanged(q, (item) => this.onUpdate(item));
  }
}