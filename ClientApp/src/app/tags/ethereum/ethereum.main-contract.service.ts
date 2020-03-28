import {Inject, Injectable} from '@angular/core';

import {SmartContract, TaggedContractAddress, TaggedContractFirstBlock, WEB3} from "../../services/tokens";
import Web3 from 'web3';
import {TruffleContract} from 'truffle-contract';

import {combineLatest, from, Observable, of} from "rxjs";
import {catchError, first, map, switchMap, tap} from "rxjs/operators";
import {EthereumMainContractException} from "./exceptions";
import {TagContractService} from "../../tagmaincontract/tagcontract/tag-contract.services";

export interface TransactionResult {
    tx: string;
    receipt: any;
    logs: any[];
}

export interface TaggingBalance {
    [key: number]: number;
}


@Injectable({
    providedIn: 'root'
})
export class EthereumMainContractService {

    static readonly ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    private _contractAddress = null; //"0xdBaF944889A03715a9BC26590899109cb6dA134b"; //ganache-cli Local Network Test newtagged4 (New Value: Complete Contract Redeployed!)
    private _contractFirstBlock = 0; //0 - Should be a much later value in production (real Ethereum network)

    private _smartContract$: Observable<any> = null;
    private _smartContractResolved: any = null;

    private _defaultAccount = null;

    constructor(@Inject(WEB3) private web3: Web3,
                @Inject(SmartContract) private smartContract: TruffleContract,
                private tagContractService: TagContractService,
                @Inject(TaggedContractAddress) smartContractAddress: string,
                @Inject(TaggedContractFirstBlock) smartContractFirstBlock: number) {
        this._contractAddress = smartContractAddress;
        this._contractFirstBlock = smartContractFirstBlock;
    }

    public getSmartContract() {
        if(this._smartContractResolved)
            return of(this._smartContractResolved);
        if(!this._smartContract$) {
            this._smartContract$ = from(this.smartContract.at(this._contractAddress)).pipe(
                tap(value => this._smartContractResolved = value) /* Don't change this stream, just tap into it and if value is resolved store it in some variable!! */
            );
        }
        return this._smartContract$;
    }

    public getSmartContractConnected() {
        return this.getSmartContract().pipe(
            switchMap(smartContract => {
                if ('enable' in this.web3.currentProvider) {

                    /*
                    based on https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
                    This method returns a Promise that’s either resolved with user accounts after user approval,
                     or rejected with an Error after user rejection.
                    */
                    // !!! here we are using the from operator to convert Promise to Observable
                    // see https://www.learnrxjs.io/operators/creation/from.html
                    // basically at this place MetaMask will popup the message asking permission to access
                    // the user accounts.
                    return from(this.web3.currentProvider.enable()).pipe(
                        map((ethAccounts: string[], index: number) => {
                            console.log('User granted access Ethereum provider to user accounts', ethAccounts)
                            if (ethAccounts.length === 0) {
                                throw new EthereumMainContractException('Can not get any user accounts');
                            }

                            // set default account
                            this._defaultAccount = ethAccounts[0];
                            return smartContract;
                        }),
                        // User denied account access
                        catchError((err: any) => {
                            console.log('Error in Ethereum Main Contract: ' + err);
                            throw new EthereumMainContractException('Error in Ethereum Main Contract: ' + err);
                        })
                    );
                }
                else {
                    //TODO: Needs to launch an alert (or add an action) to install MetaMask plugin or something similar (web3 support)
                    console.log("Eth Init: Needs MetaMask plugin!");
                    throw new EthereumMainContractException('Eth Init: Needs MetaMask plugin!');
                }
            })
        );
    }

    /**
     * Remove a tagging from an address specified by the user.
     * When removing a tagging is because for sure the user has already logged in with his wallet (Needed to know which addresses are possible to remove taggings from!)
     */
    public removeTagging(tagId: number, addressToRemoveTaggging: string): Observable<TransactionResult> {
        const gasLimit = 6000000; //TODO: Decrease gas limit ! Doesn't need to be so high!
        return this.getSmartContractConnected().pipe(
            switchMap((instance: any) => {
                //Can't use this.web3.eth.defaultAccount the first time! Not working for Remove Tagging, have no idea why! in the TaggingAddress worked without problems!
                return from<TransactionResult>(instance.removeTagById(tagId, addressToRemoveTaggging, {from: this._defaultAccount, gas: gasLimit }));
            }),
            //On next methods, it's the result of final creation, with the block and event results of a successful creation:
            tap(value => console.log("Remove Tagging address return: " + value)), //Result of Transaction!
        );
    }

    /**
     *
     * Main Contract High Level Helper Methods that can get information from various events and services at the same time.
     *
     */
    public selectHistoricAllTaggingRemovalRelatedEventsFromTag(userAddress: string, tagId: number): Observable<any[][]> {
        return this.getSmartContract().pipe(
            first(),
            switchMap(contract => this._selectHistoricAllRemovedAddressesFromTag(contract, userAddress, tagId))
        );
    }

    private _selectHistoricAllRemovedAddressesFromTag(contract, userAddress: string, tagId: number): Observable<any[][]> {
        //const eventTaggedAddress = this._smartContractResolved.TaggedAddress({filter: { tagger: userAddress, tagId: tagId}});
        const eventsTaggedAddress = contract.getPastEvents('TaggedAddress', { filter: { tagger: userAddress, tagId: tagId }, fromBlock: this._contractFirstBlock, toBlock: 'latest' }/*({filter: { tagger: userAddress, tagId: tagId}}*/);
        console.log('eventsTaggedAddress :' + eventsTaggedAddress);
        const eventsRemovedTaggingAddress = contract.getPastEvents('TagRemovedFromAddress', { filter: { tagger: userAddress, tagId: tagId }, fromBlock: this._contractFirstBlock, toBlock: 'latest' }/*({filter: { tagger: userAddress, tagId: tagId}}*/);
        console.log('eventsRemovedTaggingAddress :' + eventsRemovedTaggingAddress);
        return combineLatest(
            from(eventsTaggedAddress),
            from(eventsRemovedTaggingAddress)
        ).pipe(
            first(), //Only the first combination of Tagged addresses and Removed Addresses matter! (As it is a getPastEvents, should not matter much, as only one value from each would be available!)
            map(([eventsTagged, eventsRemoved]) => {
                console.log('eventsTaggedAddress.value :' + eventsTagged);
                console.log('eventsRemoved.value :' + eventsRemoved);
                return [eventsTagged as any[], eventsRemoved as any[]];
            })
        );
    }

    retrieveTagName(tagContractAddress: string, tagId: number): Observable<string> {
        return this.tagContractService.getName(tagContractAddress);
    }

    retrieveTagSymbol(tagContractAddress: string, tagId: number): Observable<string> {
        return this.tagContractService.getSymbol(tagContractAddress);
    }

    transferTagOwnership(tagId: number, newOwnerAddress: string, tagTransferCost: string): Observable<TransactionResult> {
        const gasLimit = 60000; //Executed: 41196 gas
        return this.getSmartContractConnected().pipe(
            switchMap((instance: any) => {
                //Can't use this.web3.eth.defaultAccount the first time! Not working for Remove Tagging, have no idea why! in the TaggingAddress worked without problems!
                return from<TransactionResult>(instance.transferTagRegistrationByTagId(tagId, newOwnerAddress, EthereumMainContractService.ZERO_ADDRESS, {from: this._defaultAccount, value: tagTransferCost,  gas: gasLimit }));
            }),
            //On next methods, it's the result of final creation, with the block and event results of a successful creation:
            tap(value => console.log("Transfer Tag Ownership return: " + value)), //Result of Transaction! TODO: Check and update accordingly!
        );
    }

    retrieveHistoricAllTaggingRemovalRelatedEventsToUserAddress(userAddress: string): Observable<any[][]> {
        return this.getSmartContract().pipe(
            first(),
            switchMap(contract => this._retrieveHistoricAllTaggingRemovalRelatedEventsToUserAddress(contract, userAddress))
        );
    }

    private _retrieveHistoricAllTaggingRemovalRelatedEventsToUserAddress(contract: any, userAddress: string): Observable<any[][]>  {
        const eventsTaggedAddress = contract.getPastEvents('TaggedAddress', { filter: { tagged: userAddress }, fromBlock: this._contractFirstBlock, toBlock: 'latest' });
        console.log('eventsTaggedAddress Taggings to user address: ' + eventsTaggedAddress);
        const eventsRemovedTaggingAddress = contract.getPastEvents('TagRemovedFromAddress', { filter: { tagged: userAddress }, fromBlock: this._contractFirstBlock, toBlock: 'latest' });
        console.log('eventsRemovedTaggingAddress Taggings to user address: ' + eventsRemovedTaggingAddress);
        return combineLatest(
            from(eventsTaggedAddress),
            from(eventsRemovedTaggingAddress)
        ).pipe(
            first(), //Only the first combination of Tagged addresses and Removed Addresses matter! (As it is a getPastEvents, should not matter much, as only one value from each would be available!)
            map(([eventsTagged, eventsRemoved]) => {
                console.log('eventsTaggedAddress.value Taggings to user address: ' + eventsTagged);
                console.log('eventsRemoved.value Taggings to user address: ' + eventsRemoved);
                return [eventsTagged as any[], eventsRemoved as any[]];
            })
        );
    }

}
