import {Injectable, Inject} from '@angular/core';

import {SmartContract} from '../services/tokens';
import {TruffleContract} from 'truffle-contract';

import {Observable, of, from} from 'rxjs';
import {map, tap, catchError, switchMap} from 'rxjs/operators';

// Web3
import {WEB3} from '../services/tokens';
import Web3 from 'web3';
import {Tag} from "../tags/tags.model";

@Injectable()
export class TagMainContractService {

    //private _contractAddress = "0x0abd22a6c3f56d1ed0ad441db9be08291fa7cafe"; //Test Net Ropsten Contract Address
    //private _contractAddress = "0xf2c3E188317aecD6AA8378e80ab72196954c03BA"; //Ganache Local Network Test new-tagged
    private _contractAddress = "0x0824a71C5F61DC213Eb7c5830192a311F079Da09"; //Ganache Local Network Test new-tagged (New Value: Complete Contract Redeployed!)

    constructor(@Inject(WEB3) private web3: Web3,
                @Inject(SmartContract) private smartContract: TruffleContract) {
    }

    private _smartContract$: Observable<any> = null;
    private _smartContractResolved: any = null;

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

    public getTaggingCost(): Observable<string> {
        // !!! here we are using the from operator to convert Promise to Observable
        // see https://www.learnrxjs.io/operators/creation/from.html
        // !!phenomenal
        //return from(this.smartContract.deployed()).pipe(
        return this.getSmartContract().pipe(
            switchMap((instance: any) => from<string>(instance.getTaggingPrice())),
            tap(cost => console.log("Tagging Cost Gotten: " + cost)),
            map(cost => this.web3.utils.fromWei(cost, 'ether')),
            tap(cost => console.log("Tagging Cost Gotten 2!: " + cost))
        );

    }


    public getTaggingByCreatorCost(): Observable<string> {
        //TODO: Remove .at from here! and store the retrieve contract somewhere! Only access it the first time! Maybe keep it here inside the service, but only retrieve it the first time, then
        //keep it somewhere for storage!
        return this.getSmartContract().pipe(
            switchMap((instance: any) => from<string>(instance.getTaggingByCreatorPrice())),
            tap(cost => console.log("Tagging By Creator Cost Gotten: " + cost)),
            map(cost => this.web3.utils.fromWei(cost, 'ether')),
            tap(cost => console.log("Tagging By Creator Cost Gotten 2!: " + cost))
        );

    }


    public getTagCreationCost(): Observable<string> {
        return this.getSmartContract().pipe(
            switchMap((instance: any) => from<string>(instance.getRegisterTagCreationPrice())),
            tap(cost => console.log("Tag Creation Cost Gotten: " + cost)),
            map(cost => this.web3.utils.fromWei(cost, 'ether')),
            tap(cost => console.log("Tag Creation Cost Gotten 2!: " + cost))
        );

    }


    public getTagTransferCost(): Observable<string> {
        return this.getSmartContract().pipe(
            switchMap((instance: any) => from<string>(instance.getTagTransferPrice())),
            tap(cost => console.log("Tag Transfer Cost Gotten: " + cost)),
            map(cost => this.web3.utils.fromWei(cost, 'ether')),
            tap(cost => console.log("Tag Transfer Cost Gotten 2!: " + cost))
        );

    }


    public getAllTags(): Observable<Tag[]> {
        return this.getSmartContract().pipe(
            switchMap((instance: any) => from<any>(instance.getTagsCreatedComplete(1, 0  /* Index End Tag (All in this case) */))),
            tap(tags => {
                console.log("All Tags Gotten: " + tags);
            }),
            map(tags => this.convertToTagsArray(tags, 0))
        );

    }

    private convertToTagsArray(tags: any, baseIndex: number): Tag[] {
        //TODO: Maybe can be improved in the future:
        if(tags && tags[0].length > 0) {
            const res: Tag[] = new Array(tags[0].length) as Tag[];
            for(let i = 0; i < tags[0].length; i++) {
                res[i] = {
                    contractAddress: tags[0][i],
                    creatorAddress: tags[1][i],
                    ownerBalance: tags[2][i],
                    totalTaggings: tags[3][i],
                    tagIndex: baseIndex + i, //For example first tag ("TAG1"), will have index 0 (this index will be the position in the global tags index, not the index on the ethereum contract)
                    tagId: baseIndex + i + 1 //TagId: Tag Index used on the ethereum contract side
                };
            }
            return res;
        }
        else {
            console.log("No Tags to load for now or Error in Tags");
            return [] as Tag[];
        }

    }

    //TODO: TO DELETE THIS METHOD!:
    private convertToTagsJs(tags, baseIndex) {
        if(!baseIndex)
            baseIndex = 0; //Value by default, in case no baseIndex parameter is passed!
        var res = new Array(tags[0].length);
        for(var i = 0; i < tags[0].length; i++) {
            res[i] = {
                contractAddress: tags[0][i],
                creatorAddress: tags[1][i],
                ownerBalance: tags[2][i],
                totalTaggings: tags[3][i],
                tagIndex: baseIndex + i, //For example first tag ("TAG1"), will have index 0 (this index will be the position in the global tags index, not the index on the ethereum contract)
                tagId: baseIndex + i + 1 //TagId: Tag Index used on the ethereum contract side
            };

        }
        return res;
    };



    public setAttack(name: string): Observable<any> {

        return from(this.smartContract.deployed()).pipe(
            switchMap((instance: any) =>
                from(instance.changeAttack(name, {from: this.web3.eth.defaultAccount}))
            ));

    }


}
