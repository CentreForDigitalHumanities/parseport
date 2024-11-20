import { TestBed } from "@angular/core/testing";

import { MpApiService } from "./mp-api.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("MpApiService", () => {
    let service: MpApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(MpApiService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
