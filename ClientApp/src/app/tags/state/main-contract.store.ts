import {Injectable} from '@angular/core';
import {Store, StoreConfig} from '@datorama/akita';

import {TagRemoveTaggingData} from "../../remove-tagging/tag-remove-tagging-data";
import {TagTransferDataReq} from "../../transfer/tag-transfer-data";

export interface MainContractState {
    removeTaggingAddress: { data: TagRemoveTaggingData, result: any };
    transferTagOwnership: { data: TagTransferDataReq, result: any };
    eventTaggedAddress: { tagId: number, tagger: string, tagged: string };
    eventRemovedTaggingAddress: { tagId: number, tagger: string, tagged: string };
    eventTagTransferOwnership: { tagId: number, oldOwner: string, newOwner: string };
}

export function createInitialState(): MainContractState {
    return {
        removeTaggingAddress: null,
        transferTagOwnership: null,
        eventTaggedAddress: null,
        eventRemovedTaggingAddress: null,
        eventTagTransferOwnership: null,
    };
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'main-contract'})
export class MainContractStore extends Store<MainContractState> {

    constructor() {
        super(createInitialState());
    }

}

