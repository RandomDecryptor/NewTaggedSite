import {Injectable} from '@angular/core';
import {Query} from '@datorama/akita';
import {MainContractStore, MainContractState} from './main-contract.store';

@Injectable({providedIn: 'root'})
export class MainContractQuery extends Query<MainContractState> {

    constructor(protected store: MainContractStore) {
        super(store);
    }

}
