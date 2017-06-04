import * as rpio from 'rpio';

export class Pi {

  static DOOR = 18
  static SONIC_TRIG = 12;
  static SONIC_ECHO = 16;

  static start = 0;
  static end = 0;
  static distance;

  static init() {

    rpio.open(this.DOOR, rpio.OUTPUT, rpio.LOW);
    rpio.open(this.SONIC_TRIG, rpio.OUTPUT, rpio.LOW);
    rpio.open(this.SONIC_ECHO, rpio.INPUT, rpio.LOW);

    rpio.poll(this.SONIC_ECHO, Pi.echo);

    process.on('exit', Pi.cleanup);
    process.on('SIGINT', Pi.cleanup);
    process.on('uncaughtException', Pi.cleanup);
  }

  static echo() {
    let state = rpio.read(this.SONIC_ECHO);
    console.log("State Change", state);
    if (state === rpio.LOW) {
      this.start = Date.now();
    } else {
      this.end = Date.now();
      let duration = this.end - this.start;
      this.distance = duration * 17150;
    }
  }

  static triggerDistance() {
    rpio.write(this.SONIC_TRIG, rpio.HIGH);
    rpio.msleep(1);
    rpio.write(this.SONIC_TRIG, rpio.LOW);
  }

  static triggerDoor() {
    rpio.write(this.DOOR, rpio.HIGH);
    rpio.sleep(.5)
    rpio.write(this.DOOR, rpio.LOW);
  }

  static cleanup() {
    rpio.close(this.DOOR);
    rpio.close(this.SONIC_TRIG);
    rpio.close(this.SONIC_ECHO);
  }
}