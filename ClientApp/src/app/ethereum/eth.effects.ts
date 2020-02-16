import {Injectable, Inject} from '@angular/core';

import {Actions, ofType, createEffect} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {Observable, of, from} from 'rxjs';
import {exhaustMap, switchMap, map, tap, catchError, first, filter} from 'rxjs/operators';

import {WEB3, SmartContract} from '../services/tokens';
import Web3 from 'web3';
import {TruffleContract} from 'truffle-contract';
//const TruffleContract = require('@truffle/contract');

import {EthService} from './eth.services';
import * as fromAction from './eth.actions';
import {EthError} from "./eth.actions";


@Injectable()
export class EthEffects {
    constructor(
        private actions$: Actions<fromAction.EthActionsUnion>,
        @Inject(WEB3) private web3: Web3,
        @Inject(SmartContract) private smartContract: TruffleContract,
        private ethService: EthService
    ) {
    }


    /*
    based on https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  and
    based on https://medium.com/b2expand/inject-web3-in-angular-6-0-a03ca345892
  This code use the new way to connect to the MetaMask.
  !!!The first time you use this token in your code you should call the enable method of window.ethereum :

    */

    /*
            based on https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
            Dapps must now request access to user accounts by calling a new method on the provider: ethereum.enable().
            This method returns a Promise that’s either resolved with user accounts after user approval,
            or rejected with an Error after user rejection.

            Important to remember that when we call ethereum.enable(), it will pop up the MetaMask windows in browser to confirm.

            From a UX point of view I think you should only enable it when you need it,
            else the user will face a popup message when the app start, which is never good UX.
            Let’s say you use 3box for a distributed profile for example.
            You would only call enable of window.ethereum when you try to login into you profile.
         */
    InitEther$ = createEffect(() => this.actions$.pipe(
        ofType(fromAction.ActionTypes.INIT_ETH),
        tap(value => console.log("PAssed thtough here: " + value)),
        //FIXME: Remove exhaustMap for switchMap if we want to allow clicking multiple times and allow the Popup to connect to MetaMask to show up multiple times!
        //Changed already to switchMap!!
        //exhaustMap((action: fromAction.InitEth) => {
        switchMap((action: fromAction.InitEth) => {

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
                    tap((ethAccounts: string[]) =>
                        console.log('User granted access Ethereum provider to user accounts', ethAccounts)
                    ),

                    switchMap((ethAccounts: string[], index: number) => {

                        if (ethAccounts.length === 0) {
                            return [new fromAction.EthError(new Error('Can not get any user accounts'))] as fromAction.EthActionsUnion[];
                        }

                        // set default account
                        this.ethService.defaultAccount = ethAccounts[0];

                        //// set the provider for the smart contract
                        //this.smartContract.setProvider(this.web3.currentProvider);

                        // dispatch multiple actions at ones
                        return [
                            new fromAction.InitEthSuccess(),
                            new fromAction.GetAccountsSuccess(ethAccounts),
                            new fromAction.SetDefaultAccountSuccess(ethAccounts[0])
                        ];

                    }),

                    // User denied account access
                    catchError((err: any) => of(new fromAction.EthError(err)))
                );
            }
            else {
                //TODO: Needs to launch an alert (or add an action) to install MetaMask plugin or something similar (web3 support)
                console.log("Eth Init: Needs MetaMask plugin!");
            }
        })
    ));

    InitEtherConsult$ = createEffect(() => this.actions$.pipe(
        ofType(fromAction.ActionTypes.INIT_ETH_CONSULT),
        tap(value => console.log("Eth consultation init: " + value)),
        switchMap((action: fromAction.InitEthConsult) => {

            if (this.web3 && this.web3.currentProvider && 'enable' in this.web3.currentProvider) { //web3.currentProvider === ethereum

                //We set the provider already here, so we can access the smart contract GET methods (not possible the SET methods):
                this.smartContract.setProvider(this.web3.currentProvider);

                return [
                    new fromAction.InitEthConsultSuccess(),
                ];
            }
            else {
                //TODO: Needs to launch an alert (or add an action) to install MetaMask plugin or something similar (web3 support)
                console.log("Eth Consult Init: Needs MetaMask plugin!");
                return [new fromAction.EthError(new Error('ERROR: No WEB3 Provider detected!'))] as fromAction.EthActionsUnion[];
            }
        })
    ));

    CheckStatusEther$ = createEffect(() => this.actions$.pipe(
        ofType(fromAction.ActionTypes.CHECK_ETH),
        switchMap((action: fromAction.CheckStatusEth) => {

            if(this.web3 && this.web3.currentProvider && ('enable' in this.web3.currentProvider)) {
                return from(this.web3.eth.getAccounts()).pipe(
                    first(), //Take just one value!
                    switchMap((accounts: any[]) => {
                        let connStatus = false;
                        if (accounts && accounts.length > 0) {
                            connStatus = true;
                        }
                        const ret: fromAction.EthActionsUnion[] = [
                            new fromAction.CheckStatusEthSuccess(connStatus)
                        ];
                        if(connStatus) {
                            ret.push(new fromAction.GetAccountsSuccess(accounts))
                        }
                        return ret;
                    })
                );
            }
            else {
                return [new fromAction.CheckStatusEthSuccess(false)];
            }

            /*
            return from(this.web3.eth.on('accountsChanged'))
                .pipe(
                    map(value => {
                        let connStatus = false;
                        if(value) {
                            connStatus = true;
                        }
                        return new fromAction.CheckStatusEthSuccess(connStatus);
                    })
                );
             */
            /*
            if(this.web3 && this.web3.currentProvider && ('enable' in this.web3.currentProvider) ) {
                this.web3.currentProvider.enable();
                connStatus = true;
            }
            return new fromAction.CheckStatusEthSuccess(connStatus);
             */
        })
    ));

    GetAccounts$: Observable<Action> = createEffect(() => this.actions$.pipe(
        ofType(fromAction.ActionTypes.GET_ACCOUNTS),
        switchMap(() => this.ethService.getAccounts().pipe(
            map((accounts: string[]) => new fromAction.GetAccountsSuccess(accounts)),
            catchError(err => of(new fromAction.EthError(err)))
        )),
    ));


    SetDefaultAccount$ = createEffect(() => this.actions$.pipe(
        ofType(fromAction.ActionTypes.SET_DEFAULT_ACCOUNT),
        map((action: fromAction.SetDefaultAccount) => {

            this.ethService.defaultAccount = action.payload;

            return new fromAction.SetDefaultAccountSuccess(action.payload);
        })
    ));


    GetAccountBalance$: Observable<Action> = createEffect(() => this.actions$.pipe(
        ofType(fromAction.ActionTypes.GET_CURRENT_BALANCE),
        switchMap(() => this.ethService.getAccountBalance().pipe(
            map((balance: string) => new fromAction.GetAccountBalanceSuccess(balance)),
            catchError(err => of(new fromAction.EthError(err)))
        )),
    ));

}
