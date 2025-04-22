import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterAridosComponent } from './register-aridos.component';

describe('RegisterAridosComponent', () => {
  let component: RegisterAridosComponent;
  let fixture: ComponentFixture<RegisterAridosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterAridosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterAridosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
