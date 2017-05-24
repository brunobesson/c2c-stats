import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MdDialog } from '@angular/material';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import { AuthService } from './auth/auth.service';
import { C2cDataService } from './c2c-data.service';
import { Outing } from './outing';
import { LoginDialogComponent } from 'app/login-dialog/login-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ],
  providers: [ C2cDataService ]
})
export class AppComponent implements OnInit {
  userId: number;
  userIdControl = new FormControl();
  data: Outing[] = [];
  dataStatus = 'invalid';
  showCharts = false;

  constructor(public dialog: MdDialog, private auth: AuthService, private c2cDataService: C2cDataService) { }

  ngOnInit(): void {
    this.userIdControl.valueChanges
      .debounceTime(500)
      .distinctUntilChanged()
      .subscribe(newValue => {
        this.getC2cData(newValue);
      });
  }

  logout(): void {
    this.auth.logout();
  }

  openLoginDialog(): void {
    const dialogRef = this.dialog.open(LoginDialogComponent);
    dialogRef.afterClosed().subscribe(credentials => this.auth.login(credentials, this.handleLoginError));
  }

  private handleLoginError(error: any) {
    console.log(error); // FIXME
  }

  private getC2cData(userId: number): void {
    this.dataStatus = 'loading';
    this.c2cDataService.getData(userId).subscribe(data => {
      if (data.status === 'completed') {
        this.userId = userId;
        this.data = data.outings;
        this.showCharts = true;
      }
      this.dataStatus = data.status;
    });
  }
}
