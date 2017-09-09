#!/bin/sh
tns run android --release --key-store-path ./keystore.jks --key-store-password password --key-store-alias test --key-store-alias-password password --device 1
