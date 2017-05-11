import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'hammerjs';

import { AppComponent } from './app.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { RangesChartComponent } from './ranges-chart/ranges-chart.component';
import { ElevationChartComponent } from './elevation-chart/elevation-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    PieChartComponent,
    RangesChartComponent,
    ElevationChartComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    MaterialModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
