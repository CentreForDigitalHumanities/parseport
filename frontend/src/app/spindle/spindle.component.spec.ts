import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SpindleComponent } from "./spindle.component";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { ExportButtonComponent } from "../shared/components/export-button/export-button.component";
import { RouterModule } from "@angular/router";
import { SpindleApiService } from "../shared/services/spindle-api.service";
import { SpindleReturn } from "../shared/types";

describe("SpindleComponent", () => {
    let component: SpindleComponent;
    let fixture: ComponentFixture<SpindleComponent>;
    let apiService: SpindleApiService;
    let httpTestingController: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                ReactiveFormsModule,
                RouterModule.forRoot([]),
            ],
            declarations: [SpindleComponent, ExportButtonComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SpindleComponent);
        component = fixture.componentInstance;
        apiService = TestBed.inject(SpindleApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
        fixture.detectChanges();
    });

    afterEach(() => {
        // After every test, assert that there are no more pending requests.
        httpTestingController.verify();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should pass text + mode to the API service when parse is clicked", () => {
        component.spindleInput.setValue("test sentence");
        apiService.input$.subscribe((input) => {
            expect(input.mode).toEqual("term-table");
            expect(input.sentence).toEqual("test sentence");
        });
        component.parse();
        const request = httpTestingController.expectOne(
            "/api/spindle/term-table",
        );
        request.flush({});
    });

    it("should pass text + mode to the API service when export is clicked", () => {
        component.spindleInput.setValue("test sentence 2");
        apiService.input$.subscribe((input) => {
            expect(input.mode).toEqual("pdf");
            expect(input.sentence).toEqual("test sentence 2");
        });
        component.exportResult("pdf");
        const request = httpTestingController.expectOne("/api/spindle/pdf");
        request.flush({});
    });

    it("should start a download when export to PDF is clicked", () => {
        // Private method, so any is required.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const downloadSpy = spyOn<any>(component, "downloadFile");

        const fakeReturn: SpindleReturn = {
            error: null,
            latex: "mock-tex",
            pdf: "fake-pdf-string",
            redirect: null,
            term: null,
            lexical_phrases: [],
            proof: null,
        };

        component.spindleInput.setValue("test sentence 3");
        component.exportResult("pdf");

        const request = httpTestingController.expectOne("/api/spindle/pdf");
        expect(request.request.method).toEqual("POST");
        request.flush(fakeReturn);

        expect(downloadSpy).toHaveBeenCalledWith(
            "spindleParseResult.pdf",
            "data:application/pdf;base64,fake-pdf-string",
        );
    });

    it("should return a proof when Export to Proof is clicked", () => {
        const fakeReturn: SpindleReturn = {
            error: null,
            latex: null,
            pdf: null,
            redirect: null,
            term: null,
            lexical_phrases: [],
            proof: { a: 1, b: 2 },
        };

        component.spindleInput.setValue("test sentence 4");
        component.exportResult("proof");

        const request = httpTestingController.expectOne("/api/spindle/proof");
        expect(request.request.method).toEqual("POST");
        request.flush(fakeReturn);

        expect(component.textOutput?.extension).toBe("json");

        const expected = {
            a: 1,
            b: 2,
        };
        const parsedText = JSON.parse(component.textOutput?.text ?? "");
        expect(parsedText).toEqual(expected);
    });
});
