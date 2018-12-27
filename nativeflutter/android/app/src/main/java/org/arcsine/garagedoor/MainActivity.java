package org.arcsine.garagedoor;

import android.os.Bundle;
import android.content.Intent;
import io.flutter.app.FlutterActivity;
import io.flutter.plugin.common.MethodCall;
import io.flutter.plugin.common.MethodChannel;
import io.flutter.plugin.common.MethodChannel.MethodCallHandler;
import io.flutter.plugin.common.MethodChannel.Result;
import io.flutter.plugins.GeneratedPluginRegistrant;

public class MainActivity extends FlutterActivity {

  boolean voice = false;

  void computeIntent() {
    Intent intent = getIntent();
    int flags = intent.getFlags();
    String pkg = intent.getPackage();

    if (pkg != null && (flags & Intent.FLAG_ACTIVITY_NEW_TASK) > 0) {
      voice = true;
    } else {
      voice = false;
    }
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    GeneratedPluginRegistrant.registerWith(this);

    computeIntent();

    new MethodChannel(getFlutterView(), "app.channel.shared.intent").setMethodCallHandler(new MethodCallHandler() {
      @Override
      public void onMethodCall(MethodCall call, MethodChannel.Result result) {
        if (call.method.contentEquals("voiceLaunch")) {
          result.success("" + voice);
          voice = false;
        }
      }
    });
  }

  @Override
  protected void onResume() {
    try {
      computeIntent();
    } catch (Exception e) {
      voice = false;
    }
  }
}
