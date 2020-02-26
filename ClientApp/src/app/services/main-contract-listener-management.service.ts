import { Injectable } from '@angular/core';
import {Tag} from "../tags/tags.model";
import * as fromTagMainContract from '../tagmaincontract';
import {select, Store} from "@ngrx/store";
import {first} from "rxjs/operators";

import * as fromEth from "../ethereum";
import {AllTagsStore} from "../tags/state/all-tags.store";

import Web3 from 'web3';
import {AllTagsQuery} from "../tags/state/all-tags.query";

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

    private _trackingUserAddress: string = null;

    private _trackingAllTags: Tag[] = null;

    private _trackingOwnTagIds: string[];

    constructor(private ethStore: Store<fromEth.AppState>,
                private taggedContractStore: Store<fromTagMainContract.AppState>,
                private mainContractService: fromTagMainContract.TagMainContractService,
                private allTagsStore: AllTagsStore,
                private allTagsQuery: AllTagsQuery,
    ) {
        this._eventListeners = [];
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
    public trackEventsOnTags(allTags: Tag[], resetListeners: boolean = true) {
        //Initialize smart contract variable and execute task to do:
        this._initializeSmartContract(() => this._trackEventsOnTags(allTags, resetListeners));
    }

    private _trackEventsBaseUserAddress(userAddress: string, allTags: Tag[], resetListeners: boolean) {
        const tagsFromUser = allTags.filter((elem, index) => {
            return fromEth.EthUtils.isEqualAddress(elem.creatorAddress, userAddress);
        });

        if(resetListeners) {
            //FIXME: Check later if problems here!: Should be commented or not?
            //this.clearEventListener();
        }

        const tagIds = tagsFromUser.map(elem => {
            return elem.tagId;
        });

        /*
            Catch Taggings of user owned tags
         */
        const eventTaggedAddress = this._createListenerTagggingAddress(tagIds);

        this._eventListeners.push(eventTaggedAddress);

    }

    private _trackEventsOnTags(allTags: Tag[], resetListeners: boolean) {
        //TODO:
        //... See main.js from old project!
        var me = this;

        this.ethStore
            .pipe(
                select(fromEth.getDefaultAccount)
            )
            .subscribe(activeAccount => {
                if(activeAccount) {
                    if(allTags && allTags.length > 0) {
                        if (
                            !fromEth.EthUtils.isEqualAddress(me._trackingUserAddress, activeAccount)
                            || me._trackingAllTags == null
                            || allTags.length > me._trackingAllTags.length
                        ) {
                            console.log(`_trackEventsOnTags: Active Account changed to '${activeAccount}' while tracking or Tags changed.`);
                            me.clearEventListener();
                            me._trackingUserAddress = activeAccount;
                            me._trackingAllTags = allTags;

                            me._trackingOwnTagIds = allTags.filter(tag => fromEth.EthUtils.isEqualAddress(tag.creatorAddress, activeAccount))
                                                    .map(tag => "" + tag.tagId); //Convert also to String, as return values gotten from the Events came also in String format!

                            me._trackEventsBaseUserAddress(activeAccount, allTags, resetListeners);
                        }
                        else {
                            console.log('_trackEventsOnTags: Already Tracking Events (related to these user address and tags)');
                        }
                    }
                    else {
                        console.debug('_trackEventsOnTags: No Tags to Track!!');
                    }
                }
                else {
                    console.debug('_trackEventsOnTags: No valid Active Account');
                }
            });
    }

    private clearEventListener() {
        //FIXME: Disabled cleaning of listeners:
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
        //Test fix a value for tagIds!
        //let eventListener = this._smartContractResolved.TaggedAddress({filter: { tagId: tagIds}}/*, {} NEEDS CALLBACK HERE???!! */);
        let eventListener = this._smartContractResolved.TaggedAddress({});
        let returnedListener = eventListener
            .on('data', event => {
                console.log("Have Data! Size tagIds: " + (tagIds ? tagIds.length : tagIds));
                console.log("This Data: " + event);
                if(this._trackingOwnTagIds.findIndex(value => value === event.returnValues.tagId) >= 0) {
                    console.log(" ***************************** Interesting EVent TaggedAddress: " + event.returnValues.tagId);
                }
                else {
                    return;
                }
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

        console.debug('** How many Event Awaiting: ' + returnedListener.eventNames() + ' for tags: ' + tagIds.length);

        /* NOT POSSIBLE to remove listeners and apply again in Truffle! Still tries to check the old listener and when goes to the new one considers the event has already been processed (in the dedupe function)
        //TEsting removing and applying on the same eventListener:
        //FIXME: But not enought as we need to be able to change the tagIds!!
        eventListener.removeAllListeners();

        eventListener = this._smartContractResolved.TaggedAddress({filter: { tagId: tagIds}});
        returnedListener = eventListener
            .on('data', event => {
                console.log("Have Data! Size tagIds: " + (tagIds ? tagIds.length : tagIds));
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
            });

        console.debug('** How many Event Awaiting2: ' + returnedListener.eventNames() + ' for tags: ' + tagIds.length);
        */

        /*
        eventListener = this._smartContractResolved.TaggedAddress({tagId: { tagId: []}});
        returnedListener = eventListener
            .on('data', event => {
                console.log("Have Data! Size tagIds2: " + (tagIds ? tagIds.length : tagIds));
                console.log("This Data2: " + event);
                if(!event.blockNumber) {
                    console.log("Invalid BlockNumber2 -> Still pending on blockchain and not confirmed!");
                    return;
                }
                else {
                    //Do the code that needs to be done to process the event:
                    console.log(`Taggings must be updated2 for ${event.returnValues.tagId}.`);
                    this._refreshTaggings(event.returnValues.tagId);
                }
            })
            .on('changed', event => {
                console.log("Event was removed from blockchain2: " + event);
            })
            .on('error', error => {
                console.log("Error2: " + error);
            });
         */

        const eventTaggedAddress = {
            listener: eventListener,
            returnedListener: returnedListener,
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

    private _refreshTaggings(tagIdStr: string) {
        const tagId = Number(tagIdStr); //Convert string to number
        this._smartContractResolved.tagsCreated(tagId)
            .then(result => {
                console.log("Will refresh tag: " + tagId);
                console.log("ownerBalance: " + result.ownerBalance.toString()); //BigNumber
                console.log("totalTaggings: " + result.totalTaggings.toString()); ///BigNumber
                //this.allTagsManagerHelper.updateByTagging(tagId, result.ownerBalance, result.totalTaggings);
                //Update in the store the ownerBalance and totalTaggings of the tag:
                this.allTagsStore.update(tagId, { ownerBalance: result.ownerBalance, totalTaggings: result.totalTaggings });
                //Fire EventTaggingAddress: Visually on the grid signal the updating of the values:
                this.taggedContractStore.dispatch( new fromTagMainContract.EventTaggingAddress({tagId: tagId, ownerBalance: result.ownerBalance, totalTaggings: result.totalTaggings} ));
            });
    }


    public testListenerTagggingAddress() {
        console.debug(`testListenerTagggingAddress:`);
        const eventListener = this._smartContractResolved.TaggedAddress({}, (event) => {
            console.log("testListenerTagggingAddress: Have Data!");
            console.log("This Data: " + event);
        });
    }


}
