import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportButtonsComponent } from './export-buttons.component';

describe('ExportButtonsComponent', () => {
  let component: ExportButtonsComponent;
  let fixture: ComponentFixture<ExportButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportButtonsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExportButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
