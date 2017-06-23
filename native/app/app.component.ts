import { Component, ViewChild, ElementRef, OnDestroy, OnInit } from "@angular/core";
import { WebView, LoadEventData } from "ui/web-view";
import * as platformModule from "tns-core-modules/platform";
import * as http from 'http';
import * as app from "application";


@Component({
  selector: "my-app",
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

  constructor() {
    this.startCamera = this.startCamera.bind(this);
    this.stopCamera = this.stopCamera.bind(this);
  }

  ngOnInit() {
    app.on(app.suspendEvent, this.stopCamera);
    app.on(app.resumeEvent, this.startCamera);
    this.startCamera();
    setTimeout(this.startCamera, 5000);
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
    http.request({ url: 'http://192.168.2.119/activate', method: 'POST' });
  }
}
