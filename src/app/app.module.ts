import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {
  MdButtonModule,
  MdCardModule,
  MdDialogModule,
  MdInputModule,
  MdMenuModule,
  MdToolbarModule,
  MdIconModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'hammerjs';

import { AuthService } from './auth/auth.service';
import { C2cDataService } from './c2c-data.service';
import { AppComponent } from './app.component';
import { ElevationChartComponent } from './elevation-chart/elevation-chart.component';
import { AreasChartComponent } from './areas-chart/areas-chart.component';
import { LoginDialogComponent } from './login-dialog/login-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    ElevationChartComponent,
    AreasChartComponent,
    LoginDialogComponent
  ],
  entryComponents: [
    LoginDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    MdButtonModule,
    MdCardModule,
    MdDialogModule,
    MdInputModule,
    MdMenuModule,
    MdToolbarModule,
    MdIconModule
  ],
  providers: [
    C2cDataService,
    AuthService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
