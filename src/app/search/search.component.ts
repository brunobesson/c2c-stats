import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { C2cDataService } from '../c2c-data.service';
import { User } from '../user';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit {
  users: Observable<User[]>;
  @Output() onUserSelect = new EventEmitter<User>();
  private searchTerms = new Subject<string>();

  constructor(private c2cDataService: C2cDataService) {}

  ngOnInit() {
    this.users = this.searchTerms
      .debounceTime(300)
      .distinctUntilChanged()
      .filter(term => term.length > 2)
      .switchMap(
        term =>
          term ? this.c2cDataService.findUser(term) : Observable.of<User[]>([])
      )
      .catch(error => {
        console.log(error); // FIXME
        return Observable.of<User[]>([]);
      });
  }

  search(term: string): void {
    return this.searchTerms.next(term);
  }

  showUser(user: User) {
    this.searchTerms.next();
    this.onUserSelect.emit(user);
  }
}
