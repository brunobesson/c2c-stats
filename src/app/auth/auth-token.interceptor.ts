import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { AuthTokenService } from './auth-token.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(public token: AuthTokenService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.token.getToken();
    if (token != null) {
      request = request.clone({
        setHeaders: {
          Authorization: `JWT token="${token}"`
        }
      });
    }

    return next.handle(request);
  }
}
