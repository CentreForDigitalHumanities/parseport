import { TestBed } from "@angular/core/testing";

import { MGParserAPIService } from "./mg-parser-api.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("MGParserAPIService", () => {
    let service: MGParserAPIService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(MGParserAPIService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
