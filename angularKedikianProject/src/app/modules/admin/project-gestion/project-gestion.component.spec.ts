import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectGestionComponent } from './project-gestion.component';

describe('ProjectGestionComponent', () => {
  let component: ProjectGestionComponent;
  let fixture: ComponentFixture<ProjectGestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectGestionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectGestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
