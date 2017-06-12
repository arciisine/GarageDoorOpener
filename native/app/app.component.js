"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var http = require("http");
var AppComponent = (function () {
    function AppComponent() {
    }
    AppComponent.prototype.activate = function () {
        http.request({ url: 'http://192.168.2.119/activate', method: 'POST' });
    };
    return AppComponent;
}());
AppComponent = __decorate([
    core_1.Component({
        selector: "my-app",
        template: "\n    <FlexboxLayout flexDirection=\"column\">\n      <WebView  flexGrow=\"1\" src=\"~/resources/image.html\"></WebView>     \n      <Button class=\"action\" text=\"Activate\" (tap)=\"activate()\"></Button>\n    </FlexboxLayout>\n  ",
        styles: ["\n\n    .main {\n      color: darkgreen;\n      background-color: #ddd;  \n    }\n\n    .action {\n      font-size: 20pt;\n      height: 100;\n    }\n  "]
    }),
    __metadata("design:paramtypes", [])
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFwcC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMEM7QUFFMUMsMkJBQTZCO0FBd0I3QixJQUFhLFlBQVk7SUFFdkI7SUFFQSxDQUFDO0lBRUQsK0JBQVEsR0FBUjtRQUNFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsK0JBQStCLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQVRELElBU0M7QUFUWSxZQUFZO0lBckJ4QixnQkFBUyxDQUFDO1FBQ1QsUUFBUSxFQUFFLFFBQVE7UUFDbEIsUUFBUSxFQUFFLDBPQUtUO1FBQ0QsTUFBTSxFQUFFLENBQUMsMEpBV1IsQ0FBQztLQUNILENBQUM7O0dBQ1csWUFBWSxDQVN4QjtBQVRZLG9DQUFZIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCAqIGFzIHBsYXRmb3JtTW9kdWxlIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3BsYXRmb3JtXCI7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuXG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJteS1hcHBcIixcbiAgdGVtcGxhdGU6IGBcbiAgICA8RmxleGJveExheW91dCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8V2ViVmlldyAgZmxleEdyb3c9XCIxXCIgc3JjPVwifi9yZXNvdXJjZXMvaW1hZ2UuaHRtbFwiPjwvV2ViVmlldz4gICAgIFxuICAgICAgPEJ1dHRvbiBjbGFzcz1cImFjdGlvblwiIHRleHQ9XCJBY3RpdmF0ZVwiICh0YXApPVwiYWN0aXZhdGUoKVwiPjwvQnV0dG9uPlxuICAgIDwvRmxleGJveExheW91dD5cbiAgYCxcbiAgc3R5bGVzOiBbYFxuXG4gICAgLm1haW4ge1xuICAgICAgY29sb3I6IGRhcmtncmVlbjtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNkZGQ7ICBcbiAgICB9XG5cbiAgICAuYWN0aW9uIHtcbiAgICAgIGZvbnQtc2l6ZTogMjBwdDtcbiAgICAgIGhlaWdodDogMTAwO1xuICAgIH1cbiAgYF1cbn0pXG5leHBvcnQgY2xhc3MgQXBwQ29tcG9uZW50IHtcblxuICBjb25zdHJ1Y3RvcigpIHtcblxuICB9XG5cbiAgYWN0aXZhdGUoKSB7XG4gICAgaHR0cC5yZXF1ZXN0KHsgdXJsOiAnaHR0cDovLzE5Mi4xNjguMi4xMTkvYWN0aXZhdGUnLCBtZXRob2Q6ICdQT1NUJyB9KTtcbiAgfVxufVxuIl19