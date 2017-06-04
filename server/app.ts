import * as express from "express";
import * as rpio from "rpio";

const DOOR = 18

const app = express();

rpio.open(DOOR, rpio.OUTPUT, rpio.LOW);

app.post('/activate', (req, res, next) => {
  rpio.write(DOOR, rpio.HIGH);
  rpio.sleep(.5)
  rpio.write(DOOR, rpio.LOW);
  return next({ "status": "active" });
});

app.listen(8080);
