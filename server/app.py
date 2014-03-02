#!/usr/bin/python

from flask import Flask, jsonify, Response, stream_with_context
from time import sleep
import requests

try:
  from RPi import GPIO
except:
  class FakeGPIO:  
    def setup(self, a,b): 
      print "Setup",a,b
    def output(self, a,b):
      print "Output", a,b     
    def setmode(self, a):
      print "Set Mode", a
    BCM = 1
    OUT = 1
  GPIO = FakeGPIO()

app = Flask(__name__)

def response(content=None, status=200):
  response = jsonify(content)
  response.status_code = status
  return response

def init():
  print "initializing"
  GPIO.setmode(GPIO.BCM)
  GPIO.setup(DOOR, GPIO.OUT)
  GPIO.output(DOOR, False)

@app.route("/camera", methods=['GET'])
def camera():
  req = requests.get('http://%s:%d/?action=stream' % (IP, CAMERA_PORT), stream = True)
  return Response(stream_with_context(req.iter_content()), content_type = req.headers['content-type'])

@app.route("/activate", methods=['POST'])
def activate():
  GPIO.output(DOOR, True)
  sleep(.5)
  GPIO.output(DOOR, False)
  return response({ "status" : "active" })

DOOR=18
CAMERA_PORT=9000
IP='127.0.0.1'

if __name__ == '__main__':
  init()
  app.run(host=IP, port=8001)
