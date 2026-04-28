import * as firebase from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseDb from 'firebase/database';

import { InjectableFactory } from '@travetto/di';
import { CacheModelSymbol } from '@travetto/cache';
import { JSONUtil, RuntimeResources } from '@travetto/runtime';
import { MemoryModelConfig, MemoryModelService } from '@travetto/model-memory';

class GetFirebaseDb {
  @InjectableFactory()
  static async getDb(): Promise<firebaseDb.Database> {
    const conf: firebase.FirebaseOptions = JSONUtil.fromUTF8(await RuntimeResources.readUTF8('firebase-config.json'));
    const app = firebase.initializeApp(conf);
    const auth = firebaseAuth.getAuth(app);
    const db = firebaseDb.getDatabase(app);
    firebaseAuth.signInAnonymously(auth);
    return db;
  }

  @InjectableFactory(CacheModelSymbol)
  static getModel(config: MemoryModelConfig) {
    return new MemoryModelService(config);
  }
}
