import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { AlertType } from "../components/alert/alert.component";

export interface AlertInfo {
    type: AlertType;
    message: string;
    duration?: number;
}

@Injectable({
    providedIn: "root",
})
export class AlertService {
    alert$ = new Subject<AlertInfo>();
}
