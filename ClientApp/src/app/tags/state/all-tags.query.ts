import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AllTagsStore, AllTagsState } from './all-tags.store';

@Injectable({ providedIn: 'root' })
export class AllTagsQuery extends QueryEntity<AllTagsState> {

  constructor(protected store: AllTagsStore) {
    super(store);
  }

}
