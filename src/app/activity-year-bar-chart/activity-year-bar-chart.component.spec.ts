import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityYearBarChartComponent } from './activity-year-bar-chart.component';

describe('ActivityYearBarChartComponent', () => {
  let component: ActivityYearBarChartComponent;
  let fixture: ComponentFixture<ActivityYearBarChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivityYearBarChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityYearBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
