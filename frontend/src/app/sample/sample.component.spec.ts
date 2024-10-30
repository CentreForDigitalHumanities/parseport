import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SampleComponent } from "./sample.component";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { routes } from "../routes";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import {
    AethelDetail,
    AethelDetailError,
    AethelDetailPhrase,
} from "../shared/types";
import { By } from "@angular/platform-browser";
import { SharedModule } from "../shared/shared.module";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

const fakePhrase: AethelDetailPhrase = {
    type: "cheese->tosti",
    displayType: "cheese -> tosti",
    items: [
        {
            word: "cheeses",
            lemma: "tostis",
            pos: "TOSTI",
            pt: "CHEESE",
        },
    ],
};

describe("SampleComponent", () => {
    let component: SampleComponent;
    let fixture: ComponentFixture<SampleComponent>;
    let router: Router;
    let controller: HttpTestingController;

    const table = () => fixture.debugElement.query(By.css(".table"));

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SampleComponent],
            imports: [
                HttpClientTestingModule,
                SharedModule,
                FontAwesomeModule,
                CommonModule,
                RouterModule.forRoot(routes),
            ],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            params: {
                                sampleName: "cheese-tosti",
                            },
                        },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SampleComponent);
        router = TestBed.inject(Router);
        controller = TestBed.inject(HttpTestingController);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should construct a valid route for word search", () => {
        const spy = spyOn(router, "navigate");
        component.searchAethel(fakePhrase, "word");
        expect(spy).toHaveBeenCalledOnceWith(["/aethel"], {
            queryParams: { word: "cheeses" },
        });
    });

    it("should construct a valid route for type search", () => {
        const spy = spyOn(router, "navigate");
        component.searchAethel(fakePhrase, "type");
        expect(spy).toHaveBeenCalledOnceWith(["/aethel"], {
            queryParams: { type: "cheese->tosti" },
        });
    });

    it("should construct a valid route for word and type search", () => {
        const spy = spyOn(router, "navigate");
        component.searchAethel(fakePhrase, "word-and-type");
        expect(spy).toHaveBeenCalledOnceWith(["/aethel"], {
            queryParams: { word: "cheeses", type: "cheese->tosti" },
        });
    });

    it("should handle a valid query param", () => {
        const validResult: AethelDetail = {
            error: null,
            result: {
                name: "name",
                phrases: [],
                sentence: "sentence",
                subset: "testing",
                term: "term",
            },
        };

        const req = controller.expectOne(
            "/api/aethel/sample?sample-name=cheese-tosti",
        );

        req.flush(validResult);
        fixture.detectChanges();

        expect(table()).toBeTruthy();
        controller.verify();
    });

    it("should handle an invalid query param", () => {
        const errorResult: AethelDetail = {
            error: AethelDetailError.SAMPLE_NOT_FOUND,
            result: null,
        };

        const req = controller.expectOne(
            "/api/aethel/sample?sample-name=cheese-tosti",
        );
        req.flush(errorResult);
        fixture.detectChanges();

        expect(table()).toBeFalsy();
        controller.verify();
    });
});
