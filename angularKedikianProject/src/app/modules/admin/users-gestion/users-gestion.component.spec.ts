import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersGestionComponent } from './users-gestion.component';

describe('UsersGestionComponent', () => {
  let component: UsersGestionComponent;
  let fixture: ComponentFixture<UsersGestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersGestionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersGestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
