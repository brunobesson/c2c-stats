import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { Outing } from './outing';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/from';
import { C2cData } from './c2c-data';
import { User } from './user';

const c2curl = 'https://api.camptocamp.org/outings?u=';

@Injectable()
export class C2cDataService {
  constructor(private http: Http, private authHttp: AuthHttp) {}

  findUser(term: string): Observable<User[]> {
    return this.authHttp
      .get(`https://api.camptocamp.org/search?q=${term}&limit=7&t=u`)
      .map(response => response.json().users.documents as User[]);
  }

  getData(userId: number): Observable<C2cData> {
    if (!userId) {
      return Observable.of({
        status: 'invalid',
        outings: [],
      });
    }
    const c2cdata = <BehaviorSubject<C2cData>>new BehaviorSubject({
      status: 'loading',
      outings: [],
    });
    const subscriptions: Subscription[] = [];
    this.http.get(c2curl + userId).subscribe(
      response => {
        c2cdata.next(this.initData(response, userId));
        const total = c2cdata.getValue().total;
        if (total > c2cdata.getValue().outings.length) {
          const offsets = Array<number>(Math.floor(total / 30))
            .fill(0)
            .map((value, index) => 30 * (index + 1));
          offsets.forEach(offset => {
            const subscription = this.http
              .get(c2curl + userId + '&offset=' + offset)
              .subscribe(
                response2 => {
                  c2cdata.next(this.updateData(c2cdata.getValue(), response2));
                },
                error => c2cdata.next(this.handleError(subscriptions, userId))
              );
            subscriptions.push(subscription);
          });
        }
      },
      error => c2cdata.next(this.handleError(subscriptions, userId))
    );
    return c2cdata.asObservable();
  }

  private handleError(subscriptions: Subscription[], userId: number): C2cData {
    subscriptions.forEach(subscription => {
      if (!subscription.closed) {
        subscription.unsubscribe();
      }
    });
    return {
      user_id: userId,
      status: 'failed',
      outings: [],
    };
  }

  private initData(response: Response, userId: number): C2cData {
    const newOutings = response.json().documents as Outing[];
    const total = response.json().total as number;
    if (total === newOutings.length) {
      return {
        user_id: userId,
        status: 'fulfilled',
        outings: newOutings,
      };
    } else {
      return {
        user_id: userId,
        status: 'pending',
        total,
        outings: newOutings,
      };
    }
  }

  private updateData(data: C2cData, response: Response): C2cData {
    const newOutings = response.json().documents as Outing[];
    const total = response.json().total as number;

    const updatedOutings = data.outings
      .concat(...newOutings)
      .sort((o1, o2) => Date.parse(o1.date_start) - Date.parse(o2.date_start));

    let updatedData = Object.assign({}, data, {
      outings: updatedOutings,
    });
    if (total === updatedOutings.length) {
      updatedData = Object.assign({}, data, {
        status: 'completed',
      });
    }
    return updatedData;
  }
}
