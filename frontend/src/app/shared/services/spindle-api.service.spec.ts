import { TestBed } from "@angular/core/testing";

import { SpindleApiService } from "./spindle-api.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("SpindleApiService", () => {
    let service: SpindleApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule]
        });
        service = TestBed.inject(SpindleApiService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
