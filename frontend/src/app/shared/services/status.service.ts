import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

interface Status {
    aethel: boolean;
    spindle: boolean;
    mp: boolean;
    vulcan: boolean;
}

@Injectable({
    providedIn: "root",
})
export class StatusService {
    constructor(private http: HttpClient) {}

    public getStatus$(): Observable<Status> {
        return this.http.get<Status>(`${environment.apiUrl}status/`);
    }
}
