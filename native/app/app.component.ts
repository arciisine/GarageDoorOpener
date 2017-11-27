/// <reference path="../node_modules/tns-platform-declarations/android.d.ts" />

import { Component, ViewChild, ElementRef, OnDestroy, OnInit } from "@angular/core";
import { WebView, LoadEventData } from "ui/web-view";
import { Image } from "ui/image";
import { Page } from "ui/page";
import * as platformModule from "tns-core-modules/platform";
import * as connectivity from "tns-core-modules/connectivity";
import * as http from 'http';
import * as app from "application";
import * as im from 'image-source';
import firebase = require("nativescript-plugin-firebase");
import * as Permissions from 'nativescript-permissions';
import { Telephony } from 'nativescript-telephony';

import { SETTINGS } from './main-activity';

@Component({
  selector: "ns-app",
  template: `
    <FlexboxLayout flexDirection="row" alignContent="center">
        <Image [imageSource]="imageSource" (longPress)="activate()" stretch="aspectFill"></Image>
    </FlexboxLayout>
  `,
  styles: [``]
})
export class AppComponent implements OnInit, OnDestroy {

  private ip = '192.168.1.168';
  private appId = 'garagedoorapp-1d1fe.appspot.com';

  private user: any;
  private lastSent = 0;

  private imageSource: im.ImageSource;
  private authPerm: Promise<any>;
  private imageLoading: Promise<any>;

  constructor(private _page: Page) {
    this.resume = this.resume.bind(this);
    this.loadSnapshot = this.loadSnapshot.bind(this);
    _page.actionBarHidden = true;
  }

  async ngOnInit() {
    console.log('Initted');
    app.on(app.resumeEvent, this.resume);
    app.on(app.exitEvent, this.ngOnDestroy.bind(this));
    this.resume();
  }

  async resume() {
    console.log('Resumed');
    this.loadSnapshot()

    if (SETTINGS.voice) {
      SETTINGS.voice = false;
      this.activate();
    }
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
    app.off(app.resumeEvent, this.resume);
  }

  async loadSnapshot() {
    if (!this.imageLoading) {
      this.imageLoading = this._loadSnapshot();
    }
    return this.imageLoading;
  }

  async _loadSnapshot() {
    while (true) {
      console.log('Loading Image');
      this.imageSource = await im.fromUrl(`https://storage.googleapis.com/${this.appId}/images/door-snap.jpg?cache=${Date.now()}`);
      console.log('Loaded Image');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
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
    if (Date.now() < (this.lastSent + 1000)) { // Don't double tap
      return;
    }
    try {
      await this.sendMessage('Activate');
    } catch (e) {
      // fallback if firebase is down
      http.request({ url: `http://${this.ip}/activate`, method: 'POST' });
    }
  }
}

firebase.init();