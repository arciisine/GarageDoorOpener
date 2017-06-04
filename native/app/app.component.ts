import { Component } from "@angular/core";
import * as platformModule from "tns-core-modules/platform";


@Component({
  selector: "my-app",
  template: `
    <ActionBar class="main" title="Garage Door Opener"></ActionBar>
    <FlexboxLayout flexDirection="column">
      <WebView  flexGrow="1" src="~/resources/image.html"></WebView>     
      <Button class="action" text="Activate" (click)="activate()"></Button>
    </FlexboxLayout>
  `,
  styles: [`

    .main {
      color: darkgreen;
      background-color: #ccc;  
    }

    .action {
      font-size: 20pt;
      height: 100;
    }
  `]
})
export class AppComponent {

  activate() {

  }
}
