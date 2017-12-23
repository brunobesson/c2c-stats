import { Injectable } from '@angular/core';
import { tokenNotExpired } from 'angular2-jwt';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Credentials } from './credentials';

@Injectable()
export class AuthService {
  constructor(private http: Http) {}

  login(credentials: Credentials, handleError: (error: any) => void) {
    this.http
      .post('https://api.camptocamp.org/users/login', credentials)
      .map(res => res.json()) // FIXME type
      .subscribe(
        data => localStorage.setItem('token', data.token),
        handleError
      );
  }

  logout() {
    localStorage.removeItem('token');
  }

  get authenticated() {
    return tokenNotExpired('token');
  }
}
