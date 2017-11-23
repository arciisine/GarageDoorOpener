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

  private ip = '192.168.1.168';
  private appId = 'garagedoorapp-1d1fe.appspot.com';

  private url = `~/resources/image.html?ip${this.ip}&appId=${this.appId}`;
  private user: any;

  private authPerm: Promise<any>;

  constructor() {

    this.resume = this.resume.bind(this);
    this.suspend = this.suspend.bind(this);
    this.startCamera = this.startCamera.bind(this);
  }

  async ngOnInit() {
    firebase.init();
    app.on(app.suspendEvent, this.suspend);
    app.on(app.resumeEvent, this.resume);
    this.resume();
  }

  suspend() {
    this.stopCamera();
  }

  async resume() {
    this.startCamera()
    this.snapshot();
  }

  async auth() {
    if (!this.authPerm) {
      this.authPerm = this._auth();
    }
    return this.authPerm;
  }

  async _auth() {
    let deviceId = '';
    let email = '';

    await Permissions.requestPermission((android as any).Manifest.permission.GET_ACCOUNTS, "Needed for auth")
    let telephony = await Telephony();

    let intent = android.accounts.AccountManager.newChooseAccountIntent(null, null, ['com.google'], false, null, null, null, null)
    app.android.foregroundActivity.startActivityForResult(intent, 1);

    let u = await new Promise((resolve, reject) => {
      app.android.on(app.AndroidApplication.activityResultEvent, function (args: app.AndroidActivityResultEventData) {
        if (args.requestCode === 1) {
          let all = android.accounts.AccountManager.get(app.android.currentContext).getAccounts();
          let primary = all[0];

          firebase.login({
            type: firebase.LoginType.PASSWORD,
            passwordOptions: {
              email: primary.name,
              password: telephony.deviceId
            }
          }).then(resolve, reject);

        }
      })
    });
    this.user = u;
    // Clear out after use, so if needed again, it will not cache
    setTimeout(() => this._auth = undefined, 1);
  }

  ngOnDestroy() {
    app.off(app.suspendEvent, this.suspend);
    app.off(app.resumeEvent, this.resume);
  }

  async startCamera() {
    if (this._webView && this.webViewElement.android) {
      this.webViewElement.android.getSettings().setJavaScriptEnabled(true);
      this.webViewElement.src = this.url + '&nonce=' + Date.now();
    } else {
      setTimeout(this.startCamera, 10);
    }
  }

  stopCamera() {
    if (this._webView) {
      this.webViewElement.src = '';
    }
  }

  async snapshot() {
    await this.sendMessage('Snapshot');
  }

  get webViewElement() {
    return this._webView.nativeElement as WebView;
  }

  async sendMessage(key: string, value?: any) {
    try {
      await firebase.getCurrentUser();
    } catch (e) {
      await this.auth();
    }

    await firebase.setValue('/', { [key]: { value: (value || true) } });
  }

  async activate() {
    try {
      await this.sendMessage('Activate');
    } catch (e) {
      // fallback if firebase is down
      http.request({ url: `http://${this.ip}/activate`, method: 'POST' });
    }
  }
}
