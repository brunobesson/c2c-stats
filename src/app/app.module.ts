import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatDialogModule,
  MatInputModule,
  MatMenuModule,
  MatOptionModule,
  MatProgressSpinnerModule,
  MatToolbarModule,
  MatIconModule,
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'hammerjs';

import { AuthTokenInterceptor } from './auth/auth-token.interceptor';
import { AuthService } from './auth/auth.service';
import { AuthTokenService } from './auth/auth-token.service';
import { C2cDataService } from './c2c-data.service';
import { AppComponent } from './app.component';
import { ElevationChartComponent } from './elevation-chart/elevation-chart.component';
import { AreasChartComponent } from './areas-chart/areas-chart.component';
import { LoginDialogComponent } from './login-dialog/login-dialog.component';
import { SearchComponent } from './search/search.component';
import { ActivitiesLineChartComponent } from './activities-line-chart/activities-line-chart.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    ElevationChartComponent,
    AreasChartComponent,
    LoginDialogComponent,
    SearchComponent,
    ActivitiesLineChartComponent,
    BarChartComponent,
  ],
  entryComponents: [LoginDialogComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatInputModule,
    MatMenuModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatIconModule,
  ],
  providers: [
    C2cDataService,
    AuthService,
    AuthTokenService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthTokenInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
