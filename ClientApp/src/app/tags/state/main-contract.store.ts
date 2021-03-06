import {Injectable} from '@angular/core';
import {Store, StoreConfig} from '@datorama/akita';

import {TagRemoveTaggingData} from "../../remove-tagging/tag-remove-tagging-data";
import {TagTransferDataReq} from "../../transfer/tag-transfer-data";

export interface MainContractState {
    removeTaggingAddress: { data: TagRemoveTaggingData, result: any };
    transferTagOwnership: { data: TagTransferDataReq, result: any };
    retrieveGains: { userAddress: string, weiReceived: any, result: any };
    eventTaggedAddress: { tagId: string, tagger: string, tagged: string };
    eventRemovedTaggingAddress: { tagId: string, tagger: string, tagged: string };
    eventTagTransferOwnership: { tagId: number, oldOwner: string, newOwner: string };
    eventGainsGotten: { userAddress: string, weiToReceive: string, totalWeiToReceive: string};
}

export function createInitialState(): MainContractState {
    return {
        removeTaggingAddress: null,
        transferTagOwnership: null,
        retrieveGains: null,
        eventTaggedAddress: null,
        eventRemovedTaggingAddress: null,
        eventTagTransferOwnership: null,
        eventGainsGotten: null
    };
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'main-contract'})
export class MainContractStore extends Store<MainContractState> {

    constructor() {
        super(createInitialState());
    }

}

