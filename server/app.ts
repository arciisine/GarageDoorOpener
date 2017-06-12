import * as express from 'express';
import { Pi } from './pi';

Pi.init();

const app = express();

app.post('/activate', async (req, res, next) => {
  await Pi.triggerDoor();
  res.json({ status: 'active' });
});

app.get('/camera/stream', async (req, res, next) => {
  await Pi.camera(req, res);
});

app.get('/camera/snapshot', async (req, res, next) => {
  await Pi.camera(req, res, false);
});

app.listen(80);