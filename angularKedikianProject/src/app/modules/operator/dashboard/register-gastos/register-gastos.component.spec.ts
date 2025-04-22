import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterGastosComponent } from './register-gastos.component';

describe('RegisterGastosComponent', () => {
  let component: RegisterGastosComponent;
  let fixture: ComponentFixture<RegisterGastosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterGastosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterGastosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
