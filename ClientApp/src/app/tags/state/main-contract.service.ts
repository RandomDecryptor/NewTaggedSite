import {Injectable} from '@angular/core';
import {MainContractStore} from './main-contract.store';
import {TagMainContractService} from "../../tagmaincontract";
import {TagRemoveTaggingData} from "../../remove-tagging/tag-remove-tagging-data";
import {catchError} from "rxjs/operators";
import {of} from "rxjs";
import * as fromAction from "../../tagmaincontract/tag-main-contract.actions.internal";
import {NotificationService} from "../../notifications/state/notification.service";
import {createNotification} from "../../notifications/state/notification.model";
import {NotificationType} from "../../notifications/notifications";
import {EthereumMainContractService} from "../ethereum/ethereum.main-contract.service";

@Injectable({
    providedIn: 'root'
})
export class MainContractService {

    constructor(private mainContractStore: MainContractStore,
                private ethereumMainContractService: EthereumMainContractService,
                private notificationService: NotificationService) {
    }

    removeTagging(removeTaggingData: TagRemoveTaggingData) {
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

}
