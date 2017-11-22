import { platformNativeScriptDynamic } from "nativescript-angular/platform";
import { AppModule } from "./app.module";
import "./async-support";


platformNativeScriptDynamic().bootstrapModule(AppModule);
