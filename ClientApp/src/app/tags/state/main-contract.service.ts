import {Injectable} from '@angular/core';
import {MainContractStore} from './main-contract.store';
import {TagRemoveTaggingData} from "../../remove-tagging/tag-remove-tagging-data";
import {catchError, first, map} from "rxjs/operators";
import {Observable, of} from "rxjs";
import {NotificationService} from "../../notifications/state/notification.service";
import {createNotification} from "../../notifications/state/notification.model";
import {NotificationType} from "../../notifications/notifications";
import {EthereumMainContractService} from "../ethereum/ethereum.main-contract.service";
import {Tag} from "../tags.model";

@Injectable({
    providedIn: 'root'
})
export class MainContractService {

    constructor(private mainContractStore: MainContractStore,
                private ethereumMainContractService: EthereumMainContractService,
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
        var addresses = [],
            taggingsMap = {},
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

    retrieveFullInfoTag(tag: Tag) {
        if(!tag.name) {
            //Missing name: retrieve it:
            this.ethereumMainContractService.retrieveTagName(tag.contractAddress, tag.tagId).pipe(
                first()
            ).subscribe(name => {
                tag.name = name;
            });
        }
        if(!tag.symbol) {
            //Missing symbol: retrieve it:
            this.ethereumMainContractService.retrieveTagSymbol(tag.contractAddress, tag.tagId).pipe(
                first()
            ).subscribe(symbol => {
                tag.symbol = symbol;
            });
        }
    }
}
