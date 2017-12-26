import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivitiesLineChartComponent } from './activities-line-chart.component';

describe('ActivitiesLineChartComponent', () => {
  let component: ActivitiesLineChartComponent;
  let fixture: ComponentFixture<ActivitiesLineChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivitiesLineChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivitiesLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
