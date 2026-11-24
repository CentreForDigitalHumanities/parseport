import { Component, NgZone } from "@angular/core";

@Component({
    selector: "pp-menu",
    templateUrl: "./menu.component.html",
    styleUrls: ["./menu.component.scss"],
    standalone: false,
})
export class MenuComponent {
    public burgerShow: "show" | "hide" = "hide";
    public burgerActive = false;

    constructor(private ngZone: NgZone) {}

    public toggleBurger(): void {
        if (!this.burgerActive) {
            // make it active to make it visible (add a class to
            // override it being hidden for smaller screens)
            this.burgerActive = true;
            // immediately hide it
            this.burgerShow = "hide";
            setTimeout(() => {
                this.ngZone.run(() => {
                    // trigger the transition
                    this.burgerShow = "show";
                });
            });
            return;
        }

        this.burgerShow = this.burgerShow === "show" ? "hide" : "show";
    }
}
