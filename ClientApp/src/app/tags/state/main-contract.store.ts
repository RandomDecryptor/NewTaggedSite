import {Injectable} from '@angular/core';
import {Store, StoreConfig} from '@datorama/akita';

import {TagRemoveTaggingData} from "../../remove-tagging/tag-remove-tagging-data";

export interface MainContractState {
    removeTaggingAddress: { data: TagRemoveTaggingData, result: any };
}

export function createInitialState(): MainContractState {
    return {
        removeTaggingAddress: null,
    };
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'main-contract'})
export class MainContractStore extends Store<MainContractState> {

    constructor() {
        super(createInitialState());
    }

}

