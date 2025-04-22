import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineHoursComponent } from './machine-hours.component';

describe('MachineHoursComponent', () => {
  let component: MachineHoursComponent;
  let fixture: ComponentFixture<MachineHoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineHoursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineHoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
