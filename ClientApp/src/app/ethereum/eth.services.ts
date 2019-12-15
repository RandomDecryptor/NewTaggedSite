import { Injectable, Inject } from '@angular/core';
// Web3
import { WEB3 } from '../services/tokens';
import Web3 from 'web3';

import { Observable, of, from } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

@Injectable()
export class EthService {

    constructor(@Inject(WEB3) private web3: Web3) {
     }

     /*
     Notice  that you have to set the default account
    It is not populated automatically (see test method below)

     based on https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethdefaultaccount
     The default address is used for the following method, for example :

        web3.eth.sendTransaction()
        (optionally you can overwrite it by specifying the from property):
     */
    get defaultAccount(): string { return this.web3.eth.defaultAccount; }
    set defaultAccount(account: string) { this.web3.eth.defaultAccount = account; }

    /** TReturns a list of accounts string[] the node controls.
     * based on https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethaccounts
     * // async
        web3.eth.getAccounts(callback(error, result){ ... })
     *
    */
   /* here is also note about why we will get only one account in the list. See the discussion bellow:
based on https://stackoverflow.com/questions/52976890/get-all-ethereum-accounts-from-metamask
Q: According to web3.js documentation, web3.eth.getAccounts()
 should return all accounts that this node controls.
 However, I am getting an array with just the currently selected one.
 Needless to say, I have multiple accounts created in Metamask.

 A:
   based on https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#raising_hand-account-list-reflects-user-preference
   When a user selects an account in MetaMask, that account silently becomes
   the web3.eth.accounts[0] in your JS context, the only member of the web3.eth.accounts array.

   */
    public getAccounts(): Observable<string[]> {
       // !!! here we are using the from operator to convert Promise to Observable
        // see https://www.learnrxjs.io/operators/creation/from.html
        return from(this.web3.eth.getAccounts()).pipe(
          map(result => <string[]>result)
        );
    }


    public getAccountBalance(): Observable<string> {

       return from(this.web3.eth.getBalance(this.defaultAccount)).pipe(
         tap(wei_balance => console.log('wei balance', wei_balance)),
         // based on https://web3js.readthedocs.io/en/1.0/web3-utils.html
         // web3.utils.fromWei always returns a string number.
         map(wei_balance => this.web3.utils.fromWei(wei_balance, 'ether')),
         tap(eth_balance => console.log('eth balance', eth_balance)),

       );
   }

    /*
    Here i use this test function to show that you have to set the default account
    It is not populated automatically
    public currentAccount(): Observable<string> {

          return of(this.web3.eth.defaultAccount);

    }
    */



}
