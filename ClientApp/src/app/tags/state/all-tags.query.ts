import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AllTagsStore, AllTagsState } from './all-tags.store';
import {Tag} from "../tags.model";
import {EthUtils} from "../../ethereum";

@Injectable({ providedIn: 'root' })
export class AllTagsQuery extends QueryEntity<AllTagsState> {

  constructor(protected store: AllTagsStore) {
    super(store);
  }

  //TODELETE: Maybe not needed, could handle all on "main-contract-listener-management.service.ts"! no need for this maybe! But, maybe can be recycled for another thing?
  getCreatorTags(creatorAddress: string) {
      return this.selectAll({filterBy: (entity: Tag, index?: number) => EthUtils.isEqualAddress(entity.creatorAddress, creatorAddress) });
  }

}
