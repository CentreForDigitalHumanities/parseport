import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpindleAboutComponent } from './spindle-about.component';

describe('SpindleAboutComponent', () => {
  let component: SpindleAboutComponent;
  let fixture: ComponentFixture<SpindleAboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpindleAboutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpindleAboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
