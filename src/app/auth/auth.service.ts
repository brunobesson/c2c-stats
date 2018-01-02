import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Credentials } from './credentials';
import { HttpErrorResponse } from '@angular/common/http/src/response';
import { AuthTokenService } from './auth-token.service';
import { User } from '../user';

@Injectable()
export class AuthService {
  constructor(private http: HttpClient, private authToken: AuthTokenService) {}

  login(credentials: Credentials) {
    return this.http
      .post<LoginResponse>('https://api.camptocamp.org/users/login', credentials)
      .map(
        resp => {
          localStorage.setItem('c2c-auth-token', resp.token);

          localStorage.setItem('authenticated-user', JSON.stringify({
            document_id: resp.id,
            name: resp.username,
            forum_username: resp.forum_username
          }));
          return resp;
        }
      );
  }

  logout() {
    localStorage.removeItem('c2c-auth-token');
    localStorage.removeItem('authenticated-user');
  }

  get authenticated() {
    return this.authToken.authenticated;
  }

  get user() {
    return this.authenticated ? JSON.parse(localStorage.getItem('authenticated-user')) as User : null;
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
  roles: string[];
}
