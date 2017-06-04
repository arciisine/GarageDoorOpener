import * as express from 'express';
import { Pi } from './pi';

const app = express();

app.post('/activate', (req, res, next) => {
  Pi.triggerDoor();
  res.json({ status: 'active' });
});

app.get('/status', (req, res, next) => {
  Pi.triggerDistance();
  res.json({ distance: Pi.distance });
});

app.listen(80);