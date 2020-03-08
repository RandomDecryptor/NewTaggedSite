import {Injectable} from '@angular/core';
import {Store, StoreConfig} from '@datorama/akita';

import {TagRemoveTaggingData} from "../../remove-tagging/tag-remove-tagging-data";

export interface MainContractState {
    removeTaggingAddress: { data: TagRemoveTaggingData, result: any };
    eventTaggedAddress: { tagId: number, tagger: string, tagged: string };
    eventRemovedTaggingAddress: { tagId: number, tagger: string, tagged: string };
}

export function createInitialState(): MainContractState {
    return {
        removeTaggingAddress: null,
        eventTaggedAddress: null,
        eventRemovedTaggingAddress: null,
    };
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'main-contract'})
export class MainContractStore extends Store<MainContractState> {

    constructor() {
        super(createInitialState());
    }

}

