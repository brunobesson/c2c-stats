import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Outing } from './outing';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/from';
import { C2cData } from './c2c-data';
import { User } from './user';
import { Status } from './status';

@Injectable()
export class C2cDataService {
  constructor(private http: HttpClient) {}

  findUser(term: string): Observable<User[]> {
    return this.http
      .get<FindUserResponse>(`https://api.camptocamp.org/search?q=${term}&limit=7&t=u`)
      .map(response => response.users.documents);
  }

  getData(userId: number): Observable<C2cData> {
    if (!userId) {
      return Observable.of({
        user_id: -1,
        status: 'initial' as Status,
        outings: [],
      } as C2cData);
    }
    const c2cdata = new BehaviorSubject({
      user_id: userId,
      status: 'pending',
      outings: [],
    } as C2cData);
    const subscriptions: Subscription[] = [];
    this.http.get<OutingsResponse>(`https://api.camptocamp.org/outings?u=${userId}`).subscribe(
      resp => {
        c2cdata.next(this.initData(resp.documents, resp.total, userId));
        const total = c2cdata.getValue().total;
        if (total > c2cdata.getValue().outings.length) {
          const offsets = Array<number>(Math.floor(total / 30))
            .fill(0)
            .map((value, index) => 30 * (index + 1));
          offsets.forEach(offset => {
            const subscription = this.http
              .get<OutingsResponse>(`https://api.camptocamp.org/outings?u=${userId}&offset=${offset}`)
              .subscribe(
                resp2 => {
                  c2cdata.next(this.updateData(c2cdata.getValue(), resp2.documents, resp2.total));
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

  private handleError(subscriptions: Subscription[], userId: number) {
    subscriptions.forEach(subscription => {
      if (!subscription.closed) {
        subscription.unsubscribe();
      }
    });
    return {
      user_id: userId,
      status: 'failed',
      outings: [],
    } as C2cData;
  }

  private initData(newOutings: Outing[], total: number, userId: number) {
    if (total === newOutings.length) {
      return {
        user_id: userId,
        status: 'fulfilled',
        outings: newOutings,
      } as C2cData;
    } else {
      return {
        user_id: userId,
        status: 'pending',
        total,
        outings: newOutings,
      } as C2cData;
    }
  }

  private updateData(data: C2cData, newOutings: Outing[], total: number): C2cData {
    const updatedOutings = data.outings
      .concat(...newOutings)
      .sort((o1, o2) => Date.parse(o1.date_start) - Date.parse(o2.date_start));

    let updatedData = Object.assign({}, data, {
      outings: updatedOutings,
    }) as C2cData;
    if (total === updatedOutings.length) {
      updatedData = Object.assign({}, updatedData, { status: 'fulfilled'});
    }
    return updatedData;
  }
}

interface OutingsResponse {
  total: number;
  documents: Outing[];
}

interface FindUserResponse {
  users: UserDocuments;
}

interface UserDocuments {
  documents: User[];
}
