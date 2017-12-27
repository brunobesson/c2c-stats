import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import { AuthService } from './auth/auth.service';
import { C2cDataService } from './c2c-data.service';
import { Outing } from './outing';
import { LoginDialogComponent } from './login-dialog/login-dialog.component';
import { Status } from './status';
import { User } from './user';
import { activities as acts } from './shared/activities';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [C2cDataService],
})
export class AppComponent {
  user: User;
  data: Outing[] = [];
  dataStatus: Status = 'initial';
  showCharts = false;

  activities = acts;

  constructor(
    public dialog: MatDialog,
    public auth: AuthService,
    private c2cDataService: C2cDataService
  ) {}

  logout(): void {
    this.auth.logout();
  }

  openLoginDialog(): void {
    const dialogRef = this.dialog.open(LoginDialogComponent);
    dialogRef
      .afterClosed()
      .subscribe(credentials => {
          if (credentials) {
            this.auth.login(credentials, this.handleLoginError);
          }
        }
      );
  }

  onUserSelect(user: User) {
    this.getC2cData(user);
  }

  private handleLoginError(error: any) {
    console.log(error); // FIXME
  }

  private getC2cData(user: User): void {
    this.dataStatus = 'pending';
    this.showCharts = false;
    this.c2cDataService.getData(user.document_id).subscribe(data => {
      if (data.status === 'fulfilled') {
        this.user = user;
        this.data = data.outings;
        this.showCharts = this.data.length > 0;
      }
      this.dataStatus = data.status;
    });
  }
}
