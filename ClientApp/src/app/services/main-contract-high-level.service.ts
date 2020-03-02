import { Injectable } from '@angular/core';
import {Tag} from "../tags/tags.model";
import * as fromTagMainContract from '../tagmaincontract';
import {select, Store} from "@ngrx/store";
import {catchError, first, map, switchMap, tap} from "rxjs/operators";

import * as fromEth from "../ethereum";
import {AllTagsStore} from "../tags/state/all-tags.store";

import Web3 from 'web3';
import {AllTagsQuery} from "../tags/state/all-tags.query";
import {from, Observable, of} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MainContractHighLevelService {

    constructor(private ethStore: Store<fromEth.AppState>,
                private taggedContractStore: Store<fromTagMainContract.AppState>,
                private mainContractService: fromTagMainContract.TagMainContractService,
                private allTagsStore: AllTagsStore
    ) {
    }

    /**
     *
     * Main Contract High Level Helper Methods that can get information from various events and services at the same time.
     *
     */
    public selectAllRemovedAddressesFromTag(userAddress: string, tagId: number): Observable<string[]> {
        return this.mainContractService.getSmartContract().pipe(
            first(),
            switchMap(contract => this._selectAllRemovedAddressesFromTag(contract, userAddress, tagId))
        );
    }

    private _selectAllRemovedAddressesFromTag(contract, userAddress: string, tagId: number): Observable<string[]> {
        //const eventTaggedAddress = this._smartContractResolved.TaggedAddress({filter: { tagger: userAddress, tagId: tagId}});
        const eventsTaggedAddress = contract.getPastEvents('TaggedAddress', { filter: { tagger: userAddress, tagId: tagId }, fromBlock: 0, toBlock: 'latest' }/*({filter: { tagger: userAddress, tagId: tagId}}*/);
        console.log('eventsTaggedAddress :' + eventsTaggedAddress);
        //Working but takes a long time!!! Try to apply filter to getPastEvents! Not just the name of the past event!: tagger and tagId!
        return from(eventsTaggedAddress).pipe(
            first(),
            tap(events => {
                console.log('eventsTaggedAddress.value :' + events);
            }),
            map((events: any) => {
                return events.map(event => event.args.tagged);
            }),
            catchError(error => {
                console.log('ERROR _selectAllRemovedAddressesFromTag: ' + error);
                return of([]);
            })
        );
        /*
        eventsTaggedAddress.then(value => {
            console.log('eventsTaggedAddress.value :' + value);
        });
        */
        //TODO:
        //... Continue here!!!
        //return of([]);
    }

}
