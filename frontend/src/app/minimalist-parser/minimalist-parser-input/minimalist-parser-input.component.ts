import { Component, DestroyRef, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { map } from "rxjs";
import { MpApiService } from "src/app/shared/services/mp-api.service";
import { StatusService } from "src/app/shared/services/status.service";

@Component({
    selector: "pp-minimalist-parser-input",
    templateUrl: "./minimalist-parser-input.component.html",
    styleUrl: "./minimalist-parser-input.component.scss",
})
export class MinimalistParserInputComponent implements OnInit {
    public form = new FormGroup({
        mpInput: new FormControl<string>("", {
            validators: [Validators.required],
        }),
    });

    public loading$ = this.apiService.loading$;

    public statusOk$ = this.statusService
        .getStatus$()
        .pipe(map((status) => status.mp && status.vulcan));

    constructor(
        private destroyRef: DestroyRef,
        private apiService: MpApiService,
        private statusService: StatusService,
    ) {}

    ngOnInit(): void {
        this.apiService.output$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (!response) {
                    return;
                }
                // Do something with the response.
            });
    }

    public parse(): void {
        this.form.controls.mpInput.markAsTouched();
        this.form.controls.mpInput.updateValueAndValidity();
        const input = this.form.controls.mpInput.value;
        if (this.form.invalid || !input) {
            return;
        }
        this.apiService.input$.next(input);
    }
}
