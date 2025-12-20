import * as firebase from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseDb from 'firebase/database';

import { Inject, Injectable, InjectableFactory } from '@travetto/di';
import { Cache } from '@travetto/cache';
import type { MemoryModelService } from '@travetto/model-memory';

import { Garage } from './garage';
import { RuntimeResources } from '@travetto/runtime';

class GetFirebaseDb {
  @InjectableFactory()
  static async getDb(): Promise<firebaseDb.Database> {
    const conf = JSON.parse(await RuntimeResources.read('firebase-config.json'));
    const app = firebase.initializeApp(conf);
    const auth = firebaseAuth.getAuth(app);
    const db = firebaseDb.getDatabase(app);
    firebaseAuth.signInAnonymously(auth);
    return db;
  }
}

@Injectable({ autoCreate: true })
export class FirebaseListener {

  @Inject()
  store: MemoryModelService;

  @Inject()
  db: firebaseDb.Database;

  @Inject()
  garage: Garage;

  @Cache('store', '2s', { key: (item: firebaseDb.DataSnapshot) => item.key ?? 'unknown' })
  async onUpdate(item: firebaseDb.DataSnapshot): Promise<void> {
    if (!item || item.key !== 'Activate' || !item.exists()) {
      console.log('[Firebase] Received', item);
      return;
    }
    await this.garage.triggerDoor(item.val().value);
  }

  async postConstruct() {
    console.log('[Firebase] Listening');
    const ref = firebaseDb.ref(this.db);
    const q = firebaseDb.query(ref, firebaseDb.orderByKey());
    firebaseDb.onChildAdded(q, (item) => this.onUpdate(item));
    firebaseDb.onChildChanged(q, (item) => this.onUpdate(item));
  }
}