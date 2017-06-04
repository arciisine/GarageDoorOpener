"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var AppComponent = (function () {
    function AppComponent() {
    }
    AppComponent.prototype.open = function () {
    };
    AppComponent.prototype.close = function () {
    };
    return AppComponent;
}());
AppComponent = __decorate([
    core_1.Component({
        selector: "my-app",
        template: "\n    <ActionBar class=\"main\" title=\"Garage Door Opener\"></ActionBar>\n    <FlexboxLayout flexDirection=\"column\">\n      <WebView  flexGrow=\"1\" src=\"~/resources/image.html\"></WebView>     \n      <Button class=\"action\" text=\"Activate\" (click)=\"open()\"></Button>\n    </FlexboxLayout>\n  ",
        styles: ["\n\n    .main {\n      color: darkgreen;\n      background-color: #ccc;  \n    }\n\n    .action {\n      font-size: 20pt;\n      height: 100;\n    }\n  "]
    })
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFwcC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMEM7QUEwQjFDLElBQWEsWUFBWTtJQUF6QjtJQVVBLENBQUM7SUFSQywyQkFBSSxHQUFKO0lBRUEsQ0FBQztJQUVELDRCQUFLLEdBQUw7SUFFQSxDQUFDO0lBRUgsbUJBQUM7QUFBRCxDQUFDLEFBVkQsSUFVQztBQVZZLFlBQVk7SUF0QnhCLGdCQUFTLENBQUM7UUFDVCxRQUFRLEVBQUUsUUFBUTtRQUNsQixRQUFRLEVBQUUsaVRBTVQ7UUFDRCxNQUFNLEVBQUUsQ0FBQywwSkFXUixDQUFDO0tBQ0gsQ0FBQztHQUNXLFlBQVksQ0FVeEI7QUFWWSxvQ0FBWSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgKiBhcyBwbGF0Zm9ybU1vZHVsZSBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9wbGF0Zm9ybVwiO1xuXG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJteS1hcHBcIixcbiAgdGVtcGxhdGU6IGBcbiAgICA8QWN0aW9uQmFyIGNsYXNzPVwibWFpblwiIHRpdGxlPVwiR2FyYWdlIERvb3IgT3BlbmVyXCI+PC9BY3Rpb25CYXI+XG4gICAgPEZsZXhib3hMYXlvdXQgZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPFdlYlZpZXcgIGZsZXhHcm93PVwiMVwiIHNyYz1cIn4vcmVzb3VyY2VzL2ltYWdlLmh0bWxcIj48L1dlYlZpZXc+ICAgICBcbiAgICAgIDxCdXR0b24gY2xhc3M9XCJhY3Rpb25cIiB0ZXh0PVwiQWN0aXZhdGVcIiAoY2xpY2spPVwib3BlbigpXCI+PC9CdXR0b24+XG4gICAgPC9GbGV4Ym94TGF5b3V0PlxuICBgLFxuICBzdHlsZXM6IFtgXG5cbiAgICAubWFpbiB7XG4gICAgICBjb2xvcjogZGFya2dyZWVuO1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2NjYzsgIFxuICAgIH1cblxuICAgIC5hY3Rpb24ge1xuICAgICAgZm9udC1zaXplOiAyMHB0O1xuICAgICAgaGVpZ2h0OiAxMDA7XG4gICAgfVxuICBgXVxufSlcbmV4cG9ydCBjbGFzcyBBcHBDb21wb25lbnQge1xuXG4gIG9wZW4oKSB7XG5cbiAgfVxuXG4gIGNsb3NlKCkge1xuXG4gIH1cblxufVxuIl19