import {Injectable, Inject} from '@angular/core';


import {SmartContract} from '../services/tokens';
import {TruffleContract} from 'truffle-contract';

import {Observable, of, from} from 'rxjs';
import {map, tap, catchError, switchMap} from 'rxjs/operators';

// Web3
import {WEB3} from '../services/tokens';
import Web3 from 'web3';

@Injectable()
export class TagMainContractService {

    //private _contractAddress = "0x0abd22a6c3f56d1ed0ad441db9be08291fa7cafe"; //Test Net Ropsten Contract Address
    private _contractAddress = "0xf2c3E188317aecD6AA8378e80ab72196954c03BA"; //Ganache Local Network Test new-tagged

    constructor(@Inject(WEB3) private web3: Web3,
                @Inject(SmartContract) private smartContract: TruffleContract) {
    }


    public getTaggingCost(): Observable<string> {
        // !!! here we are using the from operator to convert Promise to Observable
        // see https://www.learnrxjs.io/operators/creation/from.html
        // !!phenomenal
        //return from(this.smartContract.deployed()).pipe(
        return from(this.smartContract.at(this._contractAddress)).pipe(
            switchMap((instance: any) => from<string>(instance.getTaggingPrice())),
            tap(cost => console.log("Tagging Cost Gotten: " + cost)),
            map(cost => this.web3.utils.fromWei(cost, 'ether')),
            tap(cost => console.log("Tagging Cost Gotten 2!: " + cost))
        );

    }


    public setAttack(name: string): Observable<any> {

        return from(this.smartContract.deployed()).pipe(
            switchMap((instance: any) =>
                from(instance.changeAttack(name, {from: this.web3.eth.defaultAccount}))
            ));

    }


}
