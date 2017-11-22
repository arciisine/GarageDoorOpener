/// <reference path="../node_modules/tns-platform-declarations/android.d.ts" />

import { Component, ViewChild, ElementRef, OnDestroy, OnInit } from "@angular/core";
import { WebView, LoadEventData } from "ui/web-view";
import * as platformModule from "tns-core-modules/platform";
import * as connectivity from "tns-core-modules/connectivity";
import * as http from 'http';
import * as app from "application";
import firebase = require("nativescript-plugin-firebase");
import { Telephony } from 'nativescript-telephony';
import * as Permissions from 'nativescript-permissions';

@Component({
  selector: "ns-app",
  template: `
    <FlexboxLayout flexDirection="column">
      <WebView #image flexGrow="1"></WebView>     
      <Button class="action" text="Activate" (tap)="activate()"></Button>
    </FlexboxLayout>
  `,
  styles: [`

    .main {
      color: darkgreen;
      background-color: #ddd;  
    }

    .action {
      font-size: 20pt;
      height: 100;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild("image") _webView: ElementRef;

  private url = '~/resources/image.html';
  private user: any;

  constructor() {

    this.startCamera = this.startCamera.bind(this);
    this.stopCamera = this.stopCamera.bind(this);
  }

  ngOnInit() {
    app.on(app.suspendEvent, this.stopCamera);
    app.on(app.resumeEvent, this.startCamera);
    this.startCamera();
    setTimeout(this.startCamera, 5000);

    firebase.init();
  }

  auth() {
    let deviceId = '';
    let email = '';

    Permissions.requestPermission((android as any).Manifest.permission.GET_ACCOUNTS, "Needed for auth")
      .then(() => {
        return Telephony()
      }).then(function (resolved) {
        let intent = android.accounts.AccountManager.newChooseAccountIntent(null, null, ['com.google'], false, null, null, null, null)
        app.android.foregroundActivity.startActivityForResult(intent, 1);

        return new Promise((resolve, reject) => {
          app.android.on(app.AndroidApplication.activityResultEvent, function (args: app.AndroidActivityResultEventData) {
            if (args.requestCode === 1) {
              let all = android.accounts.AccountManager.get(app.android.currentContext).getAccounts();
              let primary = all[0];

              firebase.login({
                type: firebase.LoginType.PASSWORD,
                passwordOptions: {
                  email: primary.name,
                  password: resolved.deviceId
                }
              }).then(resolve, reject);

            }
          })
        });
      }).then(u => {
        this.user = u;
      });
  }

  ngOnDestroy() {
    app.off(app.suspendEvent, this.stopCamera);
    app.off(app.resumeEvent, this.startCamera);
  }

  startCamera() {
    if (this._webView) {
      if (this.webViewElement.src !== this.url) {
        this.webViewElement.src = this.url;
      } else {
        this.webViewElement.reload();
      }
    }
  }

  stopCamera() {
    if (this._webView) {
      this.webViewElement.src = '';
    }
  }

  get webViewElement() {
    return this._webView.nativeElement as WebView;
  }

  activate() {
    firebase.getCurrentUser()
      .catch(e => {
        return this.auth();
      })
      .then(() => {
        firebase.setValue('/', { Action: 'Activate' });
      })
      .catch(e => {
        // fallback if firebase is down
        http.request({ url: 'http://192.168.2.119/activate', method: 'POST' });
      });
  }
}
