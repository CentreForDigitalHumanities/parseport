import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from './config.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ConfigService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: [],
        providers: [
            provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()
        ]
    }));

    it('should be created', () => {
        const service = TestBed.inject(ConfigService);
        expect(service).toBeTruthy();
    });
});
