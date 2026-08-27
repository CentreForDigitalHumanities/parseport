import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpindleNotationComponent } from './spindle-notation.component';

describe('SpindleNotationComponent', () => {
  let component: SpindleNotationComponent;
  let fixture: ComponentFixture<SpindleNotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpindleNotationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpindleNotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
