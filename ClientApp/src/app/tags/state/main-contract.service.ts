import {Injectable} from '@angular/core';
import {MainContractStore} from './main-contract.store';
import {TagRemoveTaggingData} from "../../remove-tagging/tag-remove-tagging-data";
import {catchError, first, map} from "rxjs/operators";
import {Observable, of} from "rxjs";
import {NotificationService} from "../../notifications/state/notification.service";
import {createNotification} from "../../notifications/state/notification.model";
import {NotificationType} from "../../notifications/notifications";
import {EthereumMainContractService, TaggingBalance} from "../ethereum/ethereum.main-contract.service";
import {Tag} from "../tags.model";
import {AllTagsService} from "./all-tags.service";
import {AllTagsQuery} from "./all-tags.query";
import {TagTransferDataReq} from "../../transfer/tag-transfer-data";

@Injectable({
    providedIn: 'root'
})
export class MainContractService {

    constructor(private mainContractStore: MainContractStore,
                private ethereumMainContractService: EthereumMainContractService,
                private allTagsQuery: AllTagsQuery,
                private allTagsService: AllTagsService,
                private notificationService: NotificationService) {
    }

    public removeTagging(removeTaggingData: TagRemoveTaggingData) {
        this.ethereumMainContractService.removeTagging(removeTaggingData.tag.tagId, removeTaggingData.addressToRemoveTag).pipe(
            catchError(err => {
                const msgExtracted = err['message'] ? err['message'] : err;
                this.notificationService.add(createNotification({ type: NotificationType.ERR, msg : `Error removing taggged address '${removeTaggingData.addressToRemoveTag}' of tag '${removeTaggingData.tag.name}': ${msgExtracted}` } ));
                return of(null);
            })
        ).subscribe(removedTagging => {
            if(removedTagging) {
                console.log(`MainContractService: RemoveTagging result: ${removedTagging}`);
                this.mainContractStore.update({ removeTaggingAddress : { data: removeTaggingData, result: removedTagging} } );
            }
        });
    }

    /**
     *
     * Main Contract High Level Helper Methods that can get information from various events and services at the same time.
     *
     */
    public selectAllRemovedAddressesFromTag(userAddress: string, tagId: number): Observable<string[]> {
        return this.ethereumMainContractService.selectHistoricAllTaggingRemovalRelatedEventsFromTag(userAddress, tagId).pipe(
            map(([eventsTagged, eventsRemoved]) => {
                return this._processTaggingsForRemovalPrep(eventsTagged, eventsRemoved);
            }),
            catchError(error => {
                console.log('ERROR selectAllRemovedAddressesFromTag: ' + error);
                return of([]);
            })
        );
    }

    private _processTaggingsForRemovalPrep(taggings, taggingRemovals): string[] {
        const ret = [];
        if(taggings == null || taggingRemovals == null) {
            console.error('_processTaggingsForRemovalPrep: One of taggings or tagging removals are null!');
            return [];
        }
        var taggingsMap = {},
            unTaggingsMap = {};
        //Filter the addresses that are finally tagged (the ones that were untagged remove):
        taggings.forEach((elem, index) => {
            if (!elem.removed && elem.blockNumber) {
                taggingsMap[elem.args.tagged] = elem.blockNumber; //Will keep here the last block number in which this address was tagged
            }
        });
        if(taggingRemovals.length > 0) {
            taggingRemovals.forEach((elem, index) => {
                if (!elem.removed && elem.blockNumber) {
                    unTaggingsMap[elem.args.tagged] = elem.blockNumber; //Will keep here the last block number in which this address was tagged
                }
            });
        }

        var alreadyListed = {};
        taggings.forEach((elem, index) => {
            //Will allow untagging of those addresses, that have no untaggings until now, or which have been tagged again (having previously been untagged):
            //And of course, we will not count those that have been already added to the combobox ("alreadyListed"):
            if (!alreadyListed[elem.args.tagged] && (!unTaggingsMap[elem.args.tagged] || (taggingsMap[elem.args.tagged] > unTaggingsMap[elem.args.tagged])) ) {
                //Add address to the list of addresses to be removed:
                ret.push(elem.args.tagged);
                alreadyListed[elem.args.tagged] = true;
            }
        });

        return ret;
    };

    /**
     * Gets all taggings user address receive (taggings and removal of taggings).
     * Note: Very different from selectAllRemovedAddressesFromTag(), as that one is for taggings the user does, and not taggings the user has received.
     * @param userAddress
     */
    public retrieveAllTaggingsToUserAddress(userAddress: string): Observable<TaggingBalance> {
        return this.ethereumMainContractService.retrieveHistoricAllTaggingRemovalRelatedEventsToUserAddress(userAddress).pipe(
            map(([eventsTagged, eventsRemoved]) => {
                return this._processTaggingsForRemovalPrepToTaggingsDoneToUser(eventsTagged, eventsRemoved);
            }),
            catchError(error => {
                console.log('ERROR retrieveAllTaggingsToUserAddress: ' + error);
                return of([]);
            })
        );
    }

    private _processTaggingsForRemovalPrepToTaggingsDoneToUser(taggings, taggingRemovals): /*{ tagId: number, balance: number }*/TaggingBalance {
        if(taggings == null || taggingRemovals == null) {
            console.error('_processTaggingsForRemovalPrepToTaggingsDoneToUser: One of taggings or tagging removals are null!');
            return {};
        }
        var taggingsMap: TaggingBalance = {};
        //Just count the number of taggings minus the number of removal taggings for each tag, to get its balance.
        //Filter the addresses that are finally tagged (the ones that were untagged remove):
        taggings.forEach((elem, index) => {
            if (!elem.removed && elem.blockNumber) {
                //Increase number of taggings of user account for that Tag:
                if(taggingsMap[elem.args.tagId]) {
                    taggingsMap[elem.args.tagId]++;
                }
                else {
                    taggingsMap[elem.args.tagId] = 1;
                }
            }
        });
        if(taggingRemovals.length > 0) {
            taggingRemovals.forEach((elem, index) => {
                if (!elem.removed && elem.blockNumber) {
                    //Decrease number of taggings of user account for that Tag:
                    taggingsMap[elem.args.tagId]--;
                }
            });
        }

        return this._filterZeroTaggingValues(taggingsMap);

    };

    retrieveFullInfoTag(tagId: number) {
        const tag: Tag = this.allTagsQuery.getEntity(tagId);
        if(!tag.name) {
            //Missing name: retrieve it:
            this.ethereumMainContractService.retrieveTagName(tag.contractAddress, tag.tagId).pipe(
                first()
            ).subscribe(name => {
                //tag.name = name;
                this.allTagsService.update(tag.tagId, {name: name});
            });
        }
        if(!tag.symbol) {
            //Missing symbol: retrieve it:
            this.ethereumMainContractService.retrieveTagSymbol(tag.contractAddress, tag.tagId).pipe(
                first()
            ).subscribe(symbol => {
                //tag.symbol = symbol;
                this.allTagsService.update(tag.tagId, {symbol: symbol});
            });
        }
    }

    retrieveNameTag(tagId: number) {
        const tag: Tag = this.allTagsQuery.getEntity(tagId);
        if(!tag.name) {
            //Missing name: retrieve it:
            this.ethereumMainContractService.retrieveTagName(tag.contractAddress, tag.tagId).pipe(
                first()
            ).subscribe(name => {
                //tag.name = name;
                this.allTagsService.update(tag.tagId, {name: name});
            });
        }
    }

    retrieveSymbolTag(tagId: number) {
        const tag: Tag = this.allTagsQuery.getEntity(tagId);
        if(!tag.symbol) {
            //Missing symbol: retrieve it:
            this.ethereumMainContractService.retrieveTagSymbol(tag.contractAddress, tag.tagId).pipe(
                first()
            ).subscribe(symbol => {
                //tag.symbol = symbol;
                this.allTagsService.update(tag.tagId, {symbol: symbol});
            });
        }
    }

    transferTagOwnership(transferTagDataReq: TagTransferDataReq) {
        this.ethereumMainContractService.transferTagOwnership(transferTagDataReq.tag.tagId, transferTagDataReq.newOwnerAddress, transferTagDataReq.tagTransferCost).pipe(
            catchError(err => {
                const msgExtracted = err['message'] ? err['message'] : err;
                this.notificationService.add(createNotification({ type: NotificationType.ERR, msg : `Error transferring tag '${transferTagDataReq.tag.name}' to address '${transferTagDataReq.newOwnerAddress}': ${msgExtracted}` } ));
                return of(null);
            })
        ).subscribe(transferTagOwnershipResult => {
            if(transferTagOwnershipResult) {
                console.log(`MainContractService: Transfer Tag Ownership result: ${transferTagOwnershipResult}`);
                this.mainContractStore.update({ transferTagOwnership : { data: transferTagDataReq, result: transferTagOwnershipResult} } );
            }
        });
    }

    /**
     * Remove taggings with zero balance.
     *
     * @param taggingsMap
     * @private
     */
    private _filterZeroTaggingValues(taggingsMap: TaggingBalance): TaggingBalance {
        const res: TaggingBalance = {};
        Object.entries(taggingsMap).forEach(([key, value]) => {
            if(value && value > 0) {
                res[key] = value;
            }
        });
        return res;
    }
}
