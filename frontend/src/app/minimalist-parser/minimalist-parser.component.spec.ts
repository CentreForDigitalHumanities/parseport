import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinimalistParserComponent } from './minimalist-parser.component';

describe('MinimalistParserComponent', () => {
  let component: MinimalistParserComponent;
  let fixture: ComponentFixture<MinimalistParserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinimalistParserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MinimalistParserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
