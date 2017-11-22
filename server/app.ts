import * as fs from 'fs';
import * as https from 'https';
import * as express from 'express';
import { Garage } from './garage';
import { listen } from './firebase';


let privateKey = fs.readFileSync('../cert/key.pem', 'utf-8')
let certificate = fs.readFileSync('../cert/cert.pem', 'utf-8')

let credentials = {
  key: privateKey,
  cert: certificate
};

Garage.init();

const app = express();

app.post('/activate', async (req, res, next) => {
  await Garage.triggerDoor();
  res.json({ status: 'active' });
});

app.get('/camera/stream', async (req, res, next) => {
  await Garage.camera(res);
});

app.get('/camera/snapshot', async (req, res, next) => {
  await Garage.camera(res, 'snapshot');
});

app.post('/camera/exposeSnapshot', async (req, res, next) => {
  try {
    let url = await Garage.exposeSnapshot();
    res.json({ url });
  } catch (e) {
    res.status(500).json(e)
  }
});


//Listen for firebase
listen();

https.createServer(credentials, app)
  .listen(443);

app
  .listen(80);

