import { TestBed } from "@angular/core/testing";

import { MpApiService } from "./mp-api.service";

describe("MpApiService", () => {
    let service: MpApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MpApiService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
