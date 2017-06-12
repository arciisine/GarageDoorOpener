import * as express from 'express';
import { Pi } from './pi';
import * as fs from 'fs';
import * as https from 'https';

let privateKey = fs.readFileSync('../cert/key.pem', 'utf-8')
let certificate = fs.readFileSync('../cert/cert.pem', 'utf-8')

let credentials = {
  key: privateKey,
  cert: certificate
};

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

https.createServer(credentials, app).listen(443);