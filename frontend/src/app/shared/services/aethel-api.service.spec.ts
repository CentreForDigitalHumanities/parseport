import { TestBed } from "@angular/core/testing";

import { AethelApiService } from "./aethel-api.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

describe("AethelApiService", () => {
    let service: AethelApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
        });
        service = TestBed.inject(AethelApiService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
