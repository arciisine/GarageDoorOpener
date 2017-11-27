#!/bin/bash
#tns run android --release --key-store-path ./keystore.jks --key-store-password password --key-store-alias test --key-store-alias-password password --device 1
npm run build-android-bundle --uglify -- --release --key-store-path ./keystore.jks --key-store-password password --key-store-alias test --key-store-alias-password password
adb install -r platforms/android/build/outputs/apk/GarageDoor-release.apk
