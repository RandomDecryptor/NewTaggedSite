import { Injectable } from '@angular/core';
import {Tag} from "../tags/tags.model";
import * as fromTagMainContract from '../tagmaincontract';
import {select, Store} from "@ngrx/store";
import {first} from "rxjs/operators";

import Web3 from 'web3';
import * as fromEth from "../ethereum";

interface EventListener {
    listener: any;
    tagEventType: 'TaggedAddress' | 'TagRemovedFromAddress';
    tagIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class MainContractListenerManagementService {

    private _eventListeners: EventListener[];

    private _smartContractResolved: any = null;

    private _tracking = false;

    constructor(private ethStore: Store<fromEth.AppState>,
                private taggedContractStore: Store<fromTagMainContract.AppState>,
                private mainContractService: fromTagMainContract.TagMainContractService) {
        this._eventListeners = [];

        const me = this;
        this.ethStore
            .pipe(
                select(fromEth.getDefaultAccount)
            )
            .subscribe(activeAccount => {
                if(activeAccount && me._tracking) {
                    console.log(`Active Account changed to '${activeAccount}' while tracking.`);
                    this.clearEventListener();
                }
            });


    }

    private async _initializeSmartContract(fn) {
        //Store the resolved main Tag smart contract:
        if(!this._smartContractResolved)
            this._smartContractResolved = await this.mainContractService.getSmartContract().pipe(first()).toPromise();
        fn();
    }

    /**
     *
     * Contract Event LISTENERS MANAGEMENT
     *
     */
    public trackEventsBaseUserAddress(userAddress: string, allTags: Tag[], resetListeners: boolean = true) {
        //Initialize smart contract variable and execute task to do:
        this._initializeSmartContract(() => this._trackEventsBaseUserAddress(userAddress, allTags, resetListeners));
    }

    private _trackEventsBaseUserAddress(userAddress: string, allTags: Tag[], resetListeners: boolean) {
        //TODO:
        //... See main.js from old project!

        const tagsFromUser = allTags.filter((elem, index) => {
            return elem.creatorAddress == userAddress;
        });

        if(resetListeners) {
            this.clearEventListener();
        }

        const tagIds = tagsFromUser.map(elem => {
            return elem.tagId;
        });

        /*
            Catch Taggings of user owned tags
         */
        const eventTaggedAddress = this._createListenerTagggingAddress(tagIds);

        this._eventListeners.push(eventTaggedAddress);

        this._tracking = true;
    }

    private clearEventListener() {
        console.log('Clearing old listeners:');
        this._eventListeners.forEach(listener => {
            listener.listener.removeAllListeners();
            console.debug('Stopped watching : \tEventType: ' + listener.tagEventType);
        });
        //Empty array:
        this._eventListeners.length = 0;
    }

    private _createListenerTagggingAddress(tagIds: number[]): EventListener {
        if(tagIds) {
            console.debug(`Creating tagging event listener for ${tagIds.length} tags.`);
        }
        const eventListener = this._smartContractResolved.TaggedAddress({tagId: tagIds}/*, {} NEEDS CALLBACK HERE???!! */);
        eventListener
            .on('data', event => {
                console.log("Have Data!");
                console.log("This Data: " + event);
                if(!event.blockNumber) {
                    console.log("Invalid BlockNumber -> Still pending on blockchain and not confirmed!");
                    return;
                }
                else {
                    //Do the code that needs to be done to process the event:
                    console.log(`Taggings must be updated for ${event.returnValues.tagId}.`);
                    this._refreshTaggings(event.returnValues.tagId);
                }
            })
            .on('changed', event => {
                console.log("Event was removed from blockchain: " + event);
            })
            .on('error', error => {
                console.log("Error: " + error);
            });

        const eventTaggedAddress = {
            listener: eventListener,
            tagEventType: 'TaggedAddress',
            tagIds: tagIds.slice() //Clone array
        } as EventListener;
        return eventTaggedAddress;
        /*
        from(eventListener).pipe(
            map(res => {
                console.log("_createListenerTagggingAddress: REFRESH TAG WITH TAGGINGS: " + res);
                return res;
            })
        ).subscribe(res => {
            console.log("_createListenerTagggingAddress: REFRESH TAG WITH TAGGINGS: " + res);
        });
         */
        /*
        const eventTaggedAddress = {
            listener: eventListener,
            tagEventType: 'TaggedAddress',
            tagIds: tagIds.slice() //Clone array
        } as EventListener;
        this._eventListeners.push(eventTaggedAddress);
         */
        /*
        var eventTaggedAddress = App.taggedContractInstance.TaggedAddress({tagId: tagIds}, {});
        eventTaggedAddress.watch(function (err1, result) {
            if (err1) {
                unexpectedEvent('Unexpected Error Occurred retrieving taggings of a user owned tag: ' + err1);
            }
            else {
                if (!result) {
                    unexpectedEvent('Unexpected result for taggings of a user owned tag: \t\t' + result);
                }
                else {
                    console.log('Tagging of a user owned tag : \t\t' + result.args.tagId.toString());
                    //Do a deferred update for this tagId:
                    refreshTaggings(result.args.tagId);
                }
            }
        });
        eventTaggedAddress.tagEventType = 'TaggedAddress';
        eventTaggedAddress.tagIds = cloneArray(tagIds);
        return eventTaggedAddress;
         */
    }

    private _refreshTaggings(tagId: string) {
        this._smartContractResolved.tagsCreated(tagId)
            .then(result => {
                console.log("Will refresh tag: " + tagId);
                console.log("ownerBalance: " + result.ownerBalance.toString()); //BigNumber
                console.log("totalTaggings: " + result.totalTaggings.toString()); ///BigNumber
                this.taggedContractStore.dispatch( new fromTagMainContract.EventTaggingAddress({tagId: tagId, ownerBalance: result.ownerBalance, totalTaggings: result.totalTaggings} ));
            });
    }

}
