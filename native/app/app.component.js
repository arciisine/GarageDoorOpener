"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var http_1 = require("@angular/http");
var AppComponent = (function () {
    function AppComponent(http) {
        this.http = http;
    }
    AppComponent.prototype.activate = function () {
        this.http.post('http://raspberrypi.local/activate', {}).subscribe();
    };
    return AppComponent;
}());
AppComponent = __decorate([
    core_1.Component({
        selector: "my-app",
        template: "\n    <FlexboxLayout flexDirection=\"column\">\n      <WebView  flexGrow=\"1\" src=\"~/resources/image.html\"></WebView>     \n      <Button class=\"action\" text=\"Activate\" (tap)=\"activate()\"></Button>\n    </FlexboxLayout>\n  ",
        styles: ["\n\n    .main {\n      color: darkgreen;\n      background-color: #ddd;  \n    }\n\n    .action {\n      font-size: 20pt;\n      height: 100;\n    }\n  "]
    }),
    __metadata("design:paramtypes", [http_1.Http])
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFwcC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMEM7QUFDMUMsc0NBQXFDO0FBeUJyQyxJQUFhLFlBQVk7SUFFdkIsc0JBQW9CLElBQVU7UUFBVixTQUFJLEdBQUosSUFBSSxDQUFNO0lBRTlCLENBQUM7SUFFRCwrQkFBUSxHQUFSO1FBQ0UsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsbUNBQW1DLEVBQUUsRUFBRSxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDdEUsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQVRELElBU0M7QUFUWSxZQUFZO0lBckJ4QixnQkFBUyxDQUFDO1FBQ1QsUUFBUSxFQUFFLFFBQVE7UUFDbEIsUUFBUSxFQUFFLDBPQUtUO1FBQ0QsTUFBTSxFQUFFLENBQUMsMEpBV1IsQ0FBQztLQUNILENBQUM7cUNBRzBCLFdBQUk7R0FGbkIsWUFBWSxDQVN4QjtBQVRZLG9DQUFZIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IEh0dHAgfSBmcm9tICdAYW5ndWxhci9odHRwJztcbmltcG9ydCAqIGFzIHBsYXRmb3JtTW9kdWxlIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3BsYXRmb3JtXCI7XG5cblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcIm15LWFwcFwiLFxuICB0ZW1wbGF0ZTogYFxuICAgIDxGbGV4Ym94TGF5b3V0IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgIDxXZWJWaWV3ICBmbGV4R3Jvdz1cIjFcIiBzcmM9XCJ+L3Jlc291cmNlcy9pbWFnZS5odG1sXCI+PC9XZWJWaWV3PiAgICAgXG4gICAgICA8QnV0dG9uIGNsYXNzPVwiYWN0aW9uXCIgdGV4dD1cIkFjdGl2YXRlXCIgKHRhcCk9XCJhY3RpdmF0ZSgpXCI+PC9CdXR0b24+XG4gICAgPC9GbGV4Ym94TGF5b3V0PlxuICBgLFxuICBzdHlsZXM6IFtgXG5cbiAgICAubWFpbiB7XG4gICAgICBjb2xvcjogZGFya2dyZWVuO1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2RkZDsgIFxuICAgIH1cblxuICAgIC5hY3Rpb24ge1xuICAgICAgZm9udC1zaXplOiAyMHB0O1xuICAgICAgaGVpZ2h0OiAxMDA7XG4gICAgfVxuICBgXVxufSlcbmV4cG9ydCBjbGFzcyBBcHBDb21wb25lbnQge1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaHR0cDogSHR0cCkge1xuXG4gIH1cblxuICBhY3RpdmF0ZSgpIHtcbiAgICB0aGlzLmh0dHAucG9zdCgnaHR0cDovL3Jhc3BiZXJyeXBpLmxvY2FsL2FjdGl2YXRlJywge30pLnN1YnNjcmliZSgpO1xuICB9XG59XG4iXX0=