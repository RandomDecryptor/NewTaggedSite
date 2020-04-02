import {Component, OnInit} from '@angular/core';
import {MainContractStore} from "../../tags/state/main-contract.store";
import {TagMainContractService} from "../../tagmaincontract";

@Component({
    selector: 'app-admin-control-panel',
    templateUrl: './control-panel.component.html',
    styleUrls: ['./control-panel.component.scss']
})
export class ControlPanelComponent implements OnInit {

    private _account1 = '0x873EDFe9E0D0FFE7F8629fA9C19944B7d0F75d3E'; //Account 11 Ganache
    private _account2 = '0xd3110506461f2Ae3b9645179FdD457C0dF0E49aA'; //Account 12 Ganache

    private _targetAccount;

    private _newTags = 4;

    tagSelected: string;

    constructor(
        private mainContractStore: MainContractStore,
        private tagMainContractService: TagMainContractService,
    ) {
        this._targetAccount = this._account1;
    }

    ngOnInit() {
    }

    sendTagEventFromAcc11() {
        console.debug('sendTagEventFromAcc11!');
        this.mainContractStore.update({
            eventTaggedAddress: { tagId: this.tagSelected, tagger: this._account1, tagged: this._targetAccount }
        });
    }

    sendTagEventFromAcc12() {
        console.debug('sendTagEventFromAcc12!');
        this.mainContractStore.update({
            eventTaggedAddress: { tagId: this.tagSelected, tagger: this._account2, tagged: this._targetAccount }
        });
    }

    sendTagEventFromBoth() {
        console.debug('sendTagEventFromBoth!');
        this.sendTagEventFromAcc11();
        this.sendTagEventFromAcc12();
    }

    sendRemoveTagEventFromAcc11() {
        console.debug('sendRemoveTagEventFromAcc11!');
        this.mainContractStore.update({
            eventRemovedTaggingAddress: { tagId: this.tagSelected, tagger: this._account1, tagged: this._targetAccount }
        });
    }

    sendRemoveTagEventFromAcc12() {
        console.debug('sendRemoveTagEventFromAcc12!');
        this.mainContractStore.update({
            eventRemovedTaggingAddress: { tagId: this.tagSelected, tagger: this._account2, tagged: this._targetAccount }
        });
    }

    sendRealTaggingEventToContract() {
        this.tagMainContractService.taggingAddress(parseInt(this.tagSelected), this._targetAccount, '5000000000000000').subscribe();
    }

    sendRealRemoveTagEventToContract() {
        this.tagMainContractService.removeTagging(parseInt(this.tagSelected), this._targetAccount).subscribe();
    }

    sendTaggingForNewTag() {
        console.debug('sendTaggingForNewTag!');
        this.mainContractStore.update({
            eventTaggedAddress: { tagId: "" + this._newTags, tagger: this._account1, tagged: this._targetAccount }
        });
        this._newTags++;
    }

    sendRemoveTaggingForNewTag() {
        console.debug('sendRemoveTaggingForNewTag!');
        this.mainContractStore.update({
            eventRemovedTaggingAddress: { tagId: "" + (--this._newTags), tagger: this._account1, tagged: this._targetAccount }
        });
    }

}
