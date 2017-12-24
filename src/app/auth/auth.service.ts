import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Credentials } from './credentials';
import { HttpErrorResponse } from '@angular/common/http/src/response';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class AuthService {
  constructor(private http: HttpClient, private authToken: AuthTokenService) {}

  login(credentials: Credentials, handleError: (error: HttpErrorResponse) => void) {
    this.http
      .post<LoginResponse>('https://api.camptocamp.org/users/login', credentials)
      .subscribe(
        resp => localStorage.setItem('token', resp.token),
        handleError
      );
  }

  logout() {
    localStorage.removeItem('token');
  }

  get authenticated() {
    return this.authToken.authenticated;
  }
}

interface LoginResponse {
  forum_username: string;
  lang: string;
  username: string;
  token: string;
  id: number;
  name: string;
  expire: number;
  roles: Array<string>;
}
