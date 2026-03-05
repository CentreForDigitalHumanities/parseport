import { TestBed } from "@angular/core/testing";

import { SpindleApiService } from "./spindle-api.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

describe("SpindleApiService", () => {
    let service: SpindleApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(SpindleApiService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
