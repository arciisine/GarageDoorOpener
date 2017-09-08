import * as fs from 'fs';
import * as https from 'https';
import * as express from 'express';
import { Garage } from './garage';
import { listen } from './firebase';

Garage.init();

const app = express();

app.post('/activate', async (req, res, next) => {
  await Garage.triggerDoor();
  res.json({ status: 'active' });
});

app.get('/camera/stream', async (req, res, next) => {
  await Garage.camera(req, res);
});

app.get('/camera/snapshot', async (req, res, next) => {
  await Garage.camera(req, res, 'snapshot');
});

app.listen(8080);
//Listen for firebase
listen();
