import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import {Tag} from "../tags.model";

export interface AllTagsState extends EntityState<Tag, number> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'all-tags', idKey: 'tagId' })
export class AllTagsStore extends EntityStore<AllTagsState> {

  constructor() {
    super();
  }

}

