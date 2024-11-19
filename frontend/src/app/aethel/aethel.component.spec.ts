import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AethelComponent } from "./aethel.component";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { routes } from "../routes";
import { of } from "rxjs";
import { AethelApiService } from "../shared/services/aethel-api.service";

describe("AethelComponent", () => {
    let component: AethelComponent;
    let fixture: ComponentFixture<AethelComponent>;
    let apiService: AethelApiService;
    let httpController: HttpTestingController;
    let route: ActivatedRoute;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AethelComponent],
            imports: [
                HttpClientTestingModule,
                ReactiveFormsModule,
                CommonModule,
                RouterModule.forRoot(routes),
            ],
        }).compileComponents();
        httpController = TestBed.inject(HttpTestingController);
        route = TestBed.inject(ActivatedRoute);
        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(AethelComponent);
        apiService = TestBed.inject(AethelApiService);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should not request data if there is no query parameter", () => {
        route.queryParams = of({});
        component.ngOnInit();
        expect(component.form.controls.word.value).toBe("");
        httpController.expectNone("/api/aethel");
    });

    it("should insert data into the form when there are query parameters", () => {
        route.queryParams = of({ word: "test", skip: 420, limit: 666 });
        component.ngOnInit();
        expect(component.form.controls.word.value).toBe("test");
        expect(component.form.controls.skip.value).toBe(420);
        expect(component.form.controls.limit.value).toBe(666);
    });

    it("should pass query param data to the API service", () => {
        apiService.input$.subscribe((input) => {
            expect(input.word).toBe("test3");
        });
        route.queryParams = of({ word: "test3" });
        component.ngOnInit();
    });

    it("should react to form submissions", () => {
        const navigatorSpy = spyOn(router, "navigateByUrl");
        component.form.controls.word.setValue("test-two");
        component.submitWord();
        expect(navigatorSpy).toHaveBeenCalledWith("/?word=test-two&limit=10&skip=0");
    });
});
