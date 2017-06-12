import { Component } from "@angular/core";
import { Http } from '@angular/http';
import * as platformModule from "tns-core-modules/platform";


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

  constructor(private http: Http) {

  }

  activate() {
    this.http.post('http://raspberrypi.local/activate', {}).subscribe();
  }
}
