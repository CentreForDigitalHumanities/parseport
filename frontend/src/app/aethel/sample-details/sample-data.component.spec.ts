import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SampleDataComponent } from "./sample-data.component";

describe("SampleDataComponent", () => {
    let component: SampleDataComponent;
    let fixture: ComponentFixture<SampleDataComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SampleDataComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SampleDataComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
