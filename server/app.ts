import * as fs from 'fs';
import * as https from 'https';
import * as express from 'express';
import { Garage } from './garage';
import { listen } from './firebase';

Garage.init();
//Listen for firebase
listen();

const app = express();

app.post('/activate', async (req, res, next) => {
  await Garage.triggerDoor();
  res.json({ status: 'active' });
});

app.post('/snapshot', async (req, res, next) => {
  try {
    let url = await Garage.snapshot(req.query.img);
    res.json({ url });
  } catch (e) {
    res.status(500).json(e)
  }
});

try {
  let privateKey = fs.readFileSync('../cert/key.pem', 'utf-8');
  let certificate = fs.readFileSync('../cert/cert.pem', 'utf-8')

  let credentials = {
    key: privateKey,
    cert: certificate
  };

  https.createServer(credentials, app)
    .listen(443);

} catch (e) { }

app
  .listen(9000, () => {
    console.log('[Express] Listening', 9000);
  })

app
  .listen(80);
