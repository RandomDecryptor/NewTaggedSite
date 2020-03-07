import {Inject, Injectable} from '@angular/core';

import {SmartContract, WEB3} from "../../services/tokens";
import Web3 from 'web3';
import {TruffleContract} from 'truffle-contract';

import {from, Observable, of} from "rxjs";
import {catchError, map, switchMap, tap} from "rxjs/operators";
import {EthereumMainContractException} from "./exceptions";

@Injectable({
    providedIn: 'root'
})
export class EthereumMainContractService {

    static readonly ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    private _contractAddress = "0xdBaF944889A03715a9BC26590899109cb6dA134b"; //ganache-cli Local Network Test newtagged4 (New Value: Complete Contract Redeployed!)

    private _smartContract$: Observable<any> = null;
    private _smartContractResolved: any = null;

    private _defaultAccount = null;

    constructor(@Inject(WEB3) private web3: Web3,
                @Inject(SmartContract) private smartContract: TruffleContract) {
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
     * Remove a tagging from an address specified by the user.s
     * When removing a tagging is because for sure the user has already logged in with his wallet (Needed to know which addresses are possible to remove taggings from!)
     */
    public removeTagging(tagId: number, addressToRemoveTaggging: string): Observable<boolean> {
        const gasLimit = 6000000; //TODO: Decrease gas limit ! Doesn't need to be so high!
        return this.getSmartContractConnected().pipe(
            switchMap((instance: any) => {
                //Can't use this.web3.eth.defaultAccount the first time! Not working for Remove Tagging, have no idea why! in the TaggingAddress worked without problems!
                return from<boolean>(instance.removeTagById(tagId, addressToRemoveTaggging, {from: this._defaultAccount, gas: gasLimit }));
            }),
            //On next methods, it's the result of final creation, with the block and event results of a successful creation:
            tap(value => console.log("Remove Tagging address return: " + value)), //Should be True / False! Or Any??? Result of Transaction! TODO: Check and update accordingly!
        );
    }

}
