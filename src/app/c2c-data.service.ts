import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Outing } from './outing';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/from';

@Injectable()
export class C2cDataService {

  c2curl = 'https://api.camptocamp.org/outings?u=';

  constructor(private http: Http) { }

  getObservableData(userId: number): Observable<Outing[]> {
    if (userId === null) {
      return Observable.from<Outing[]>([]);
    }
    let emitter: Observer<Outing[]>;
    const observable = Observable.create((obs: Observer<Outing[]>) => emitter = obs);
    this.http.get(this.c2curl + userId)
             .subscribe(response => {
               emitter.next(response.json().documents as Outing[]);
               const total = response.json().total as number;
               const offsets = Array<number>(Math.floor(total / 30)).fill(0).map((value, index) => 30 * (index + 1));
               offsets.forEach(offset => {
                 this.http.get(this.c2curl + userId + '&offset=' + offset)
                          .subscribe(response2 => emitter.next(response2.json().documents as Outing[]));
               });
//                emitter.complete();
             });
    return observable;
  }

  // FIXME remove below
  getData(userId: number): Promise<Outing[]> {
    return Promise.resolve(this.http.get(`${this.c2curl}${userId}`)
                                    .toPromise()
                                    .then(response => response.json().documents as Outing[])
                                    .catch(this.handleError));
  }

  handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // FIXME
    return Promise.reject(error.message || error);
  }
}
