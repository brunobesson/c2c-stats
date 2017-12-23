import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Credentials } from './credentials';

@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.css'],
})
export class LoginDialogComponent implements OnInit {
  model: Credentials = {
    username: '',
    password: '',
  };
  constructor(public dialogRef: MatDialogRef<LoginDialogComponent>) {}

  ngOnInit() {}

  onSubmit() {
    this.dialogRef.close(this.model);
  }

  get username() {
    return this.model.username;
  }

  get password() {
    return this.model.password;
  }
}
