import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SampleDataComponent } from "./sample-data.component";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import { AethelListResult, AethelSampleDataReturn } from "src/app/shared/types";
import { environment } from "src/environments/environment";

describe("SampleDataComponent", () => {
    let component: SampleDataComponent;
    let fixture: ComponentFixture<SampleDataComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SampleDataComponent],
            imports: [HttpClientTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(SampleDataComponent);
        component = fixture.componentInstance;
        httpMock = TestBed.inject(HttpTestingController);
        fixture.detectChanges();
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should not set loading to true if there is no aethelResult", () => {
        component.aethelResult = null;
        component.ngOnInit();
        expect(component.loading).toBeFalse();
    });

    it("should make HTTP call and set samples on success", () => {
        const mockAethelResult: AethelListResult = {
            phrase: {
                items: [],
            },
            sampleCount: 0,
            type: "test",
        };
        const mockResponse: AethelSampleDataReturn = {
            results: [],
            error: "",
        };

        component.aethelResult = mockAethelResult;
        component.ngOnInit();

        const req = httpMock.expectOne(
            `${environment.apiUrl}aethel/sample-data?word=%5B%5D&type=test`,
        );
        expect(req.request.method).toBe("GET");
        req.flush(mockResponse);

        expect(component.samples).toEqual(mockResponse.results);
        expect(component.loading).toBeFalse();
    });

    it("should return correct sample URL", () => {
        const sampleName = "example.xml";
        const expectedURL = ["sample", "example"];
        expect(component.getSampleURL(sampleName)).toEqual(expectedURL);
    });
});
