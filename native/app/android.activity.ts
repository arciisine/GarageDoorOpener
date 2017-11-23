import { ReplaySubject } from 'rxjs/ReplaySubject';
import { setActivityCallbacks, AndroidActivityCallbacks } from 'ui/frame';
import * as globals from 'globals';
import * as app from 'application';

export let AndroidOnRouteToURL = new ReplaySubject<string>();

export const SETTINGS = { voice: false };

if ((<any>global).__snapshot || (<any>global).__snapshotEnabled) {
  globals.install();
}

@JavaProxy('org.arcsine.MainActivity')
export class Activity extends android.app.Activity {

  private _callbacks: AndroidActivityCallbacks;

  public isNativeScriptActivity;
  constructor() {
    super();
    return global.__native(this);
  }

  protected onCreate(savedInstanceState: android.os.Bundle): void {
    app.android.init(this.getApplication());

    this.isNativeScriptActivity = true;
    if (!this._callbacks) {
      setActivityCallbacks(this);
    }

    this._callbacks.onCreate(this, savedInstanceState, super.onCreate);
    const creationIntent = this.getIntent();
    this.handleIntent(creationIntent);
  }

  protected onSaveInstanceState(outState: android.os.Bundle): void {
    this._callbacks.onSaveInstanceState(this, outState, super.onSaveInstanceState);
  }

  protected onStart(): void {
    this._callbacks.onStart(this, super.onStart);
  }

  protected onStop(): void {
    this._callbacks.onStop(this, super.onStop);
  }

  protected onDestroy(): void {
    this._callbacks.onDestroy(this, super.onDestroy);
  }

  public onBackPressed(): void {
    this._callbacks.onBackPressed(this, super.onBackPressed);
  }

  public onRequestPermissionsResult(requestCode: number, permissions: Array<String>, grantResults: Array<number>): void {
    this._callbacks.onRequestPermissionsResult(this, requestCode, permissions, grantResults, undefined /*TODO: Enable if needed*/);
  }

  protected onActivityResult(requestCode: number, resultCode: number, data: android.content.Intent): void {
    this._callbacks.onActivityResult(this, requestCode, resultCode, data, super.onActivityResult);
  }

  protected onNewIntent(intent: android.content.Intent): void {
    super.onNewIntent(intent);
    this.handleIntent(intent);
  }

  private handleIntent(intent: android.content.Intent) {
    const action = intent.getAction();
    const dataStr = intent.getDataString();

    let flags = intent.getFlags();
    let pkg = intent.getPackage();
    let categories = intent.getCategories();

    if (pkg != null && (flags & android.content.Intent.FLAG_ACTIVITY_NEW_TASK) > 0) {
      console.info(`MainActivity.handleIntent: [Voice] [${action}] ${dataStr}`);
      SETTINGS.voice = true;
    } else {
      console.info(`MainActivity.handleIntent: [${action}] ${dataStr}`);
      SETTINGS.voice = false;
    }
  }
}