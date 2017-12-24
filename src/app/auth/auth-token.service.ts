import { Injectable } from '@angular/core';
import { tokenNotExpired } from 'angular2-jwt';

@Injectable()
export class AuthTokenService {
  constructor() {}

  public getToken(): string {
    return localStorage.getItem('token');
  }

  get authenticated() {
    return tokenNotExpired(null, this.getToken());
  }
}
