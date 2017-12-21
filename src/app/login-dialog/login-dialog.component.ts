import { Component, OnInit } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { Credentials } from 'app/login-dialog/credentials';

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
  constructor(public dialogRef: MdDialogRef<LoginDialogComponent>) {}

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
