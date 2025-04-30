import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AridosComponent } from './aridos.component';

describe('AridosComponent', () => {
  let component: AridosComponent;
  let fixture: ComponentFixture<AridosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AridosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AridosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
