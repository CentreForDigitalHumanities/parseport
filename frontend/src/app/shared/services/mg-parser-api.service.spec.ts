import { TestBed } from "@angular/core/testing";

import { MGParserAPIService } from "./mg-parser-api.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

describe("MGParserAPIService", () => {
    let service: MGParserAPIService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(MGParserAPIService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
