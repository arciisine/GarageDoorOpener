import { Component } from "@angular/core";
import * as platformModule from "tns-core-modules/platform";
import * as http from 'http';


@Component({
  selector: "my-app",
  template: `
    <FlexboxLayout flexDirection="column">
      <WebView  flexGrow="1" src="~/resources/image.html"></WebView>     
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
export class AppComponent {

  constructor() {

  }

  activate() {
    http.request({ url: 'http://192.168.2.119/activate', method: 'POST' });
  }
}
