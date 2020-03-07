import {Injectable, Inject} from '@angular/core';

import {SmartContract, TaggedContractAddress} from '../services/tokens';
import {TruffleContract} from 'truffle-contract';

import {Observable, of, from, EMPTY} from 'rxjs';
import {map, tap, switchMap} from 'rxjs/operators';

// Web3
import {WEB3} from '../services/tokens';
import Web3 from 'web3';
import {Tag} from "../tags/tags.model";
import {EventType} from "./tag-main-contract.actions.internal";
import {Action} from "@ngrx/store";

@Injectable()
export class TagMainContractService {

    static readonly ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    //private _contractAddress = "0x0abd22a6c3f56d1ed0ad441db9be08291fa7cafe"; //Test Net Ropsten Contract Address
    //private _contractAddress = "0xf2c3E188317aecD6AA8378e80ab72196954c03BA"; //Ganache Local Network Test new-tagged
    //private _contractAddress = "0x0824a71C5F61DC213Eb7c5830192a311F079Da09"; //Ganache Local Network Test new-tagged (New Value: Complete Contract Redeployed!)
    //private _contractAddress = "0x32ab2d2549bDF1674B617FD6cdb6a070193d2428"; //ganache-cli Local Network Test newtagged3 (New Value: Complete Contract Redeployed!)
    private _contractAddress = null; //"0xdBaF944889A03715a9BC26590899109cb6dA134b"; //ganache-cli Local Network Test newtagged4 (New Value: Complete Contract Redeployed!)


    constructor(@Inject(WEB3) private web3: Web3,
                @Inject(SmartContract) private smartContract: TruffleContract,
                @Inject(TaggedContractAddress) private smartContractAddress: string) {
        this._contractAddress = smartContractAddress;
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
            //map(cost => this.web3.utils.fromWei(cost, 'ether')),
            tap(cost => console.log("Tagging Cost Gotten 2!: " + cost))
        );

    }


    public getTaggingByCreatorCost(): Observable<string> {
        return this.getSmartContract().pipe(
            switchMap((instance: any) => from<string>(instance.getTaggingByCreatorPrice())),
            tap(cost => console.log("Tagging By Creator Cost Gotten: " + cost)),
            //map(cost => this.web3.utils.fromWei(cost, 'ether')),
            tap(cost => console.log("Tagging By Creator Cost Gotten 2!: " + cost))
        );

    }


    public getTagCreationCost(): Observable<string> {
        return this.getSmartContract().pipe(
            switchMap((instance: any) => from<string>(instance.getRegisterTagCreationPrice())),
            tap(cost => {
                //// @ts-ignore
                //debugger;
                console.log("Tag Creation Cost Gotten: " + cost)}),
            //map(cost => this.web3.utils.fromWei(cost, 'ether')),
            tap(cost => console.log("Tag Creation Cost Gotten 2!: " + cost))
        );

    }


    public getTagTransferCost(): Observable<string> {
        return this.getSmartContract().pipe(
            switchMap((instance: any) => from<string>(instance.getTagTransferPrice())),
            tap(cost => console.log("Tag Transfer Cost Gotten: " + cost)),
            //map(cost => this.web3.utils.fromWei(cost, 'ether')),
            tap(cost => console.log("Tag Transfer Cost Gotten 2!: " + cost))
        );

    }

    /**
     * Create a new tag registered on Tagged main contract.
     * NOTE: Needs to have access to use users wallet!
     */
    public createTag(tagName: string, symbolName: string, tagCreationCost: string): Observable<string> {
        const gasLimit = 6000000;
        //To get immediatly the Transaction Id without waiting for its approval, would have to do the following (from "https://ethereum.stackexchange.com/a/26314"):
        //let txId = instance.registerTag.sendTransaction(PArams!!);
        //Or using "PromiEvent", like .on('transactionHash' ... // .on('confirmation', directly in web3.eth.sendTransaction
        return this.getSmartContract().pipe(
            switchMap((instance: any) => from<string>(instance.registerTag(tagName, symbolName, TagMainContractService.ZERO_ADDRESS /* 0x0 Address */,  {from: this.web3.eth.defaultAccount, gas: gasLimit, value: tagCreationCost}))),
            //On next methods, it's the result of final creation, with the block and event results of a successful creation:
            tap(value => console.log("Tag Creation Return: " + value)),
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

    public getTagFullInfo(tagId: number): Observable<Tag> {
        return this.getSmartContract().pipe(
            switchMap((instance: any) => from<any>(instance.tagsCreated(tagId))),
            map(tagInfo => ({
                tagId: tagId,
                name: null,
                symbol: null,
                ownerBalance: tagInfo.ownerBalance,
                totalTaggings: tagInfo.totalTaggings,
                creatorAddress: tagInfo.creator,
                contractAddress: tagInfo.tagContract,
                tagIndex: -1
            }))
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


    public setAttack(name: string): Observable<any> {

        return from(this.smartContract.deployed()).pipe(
            switchMap((instance: any) =>
                from(instance.changeAttack(name, {from: this.web3.eth.defaultAccount}))
            ));

    }


    watchForEvent(eventType: EventType, extra: any, action: Action): Observable<any> {
        //Code based on: https://medium.com/pixelpoint/track-blockchain-transactions-like-a-boss-with-web3-js-c149045ca9bf
        // Instantiate subscription object
        const subscription = this.web3.eth.subscribe('pendingTransactions'); //TODO: Only can be done later on testnet or mainnet: https://github.com/MetaMask/metamask-extension/issues/6925

        // Subscribe to pending transactions
        subscription.subscribe((error, result) => {
            if (error) console.log(error);
            //TODO: ERROR: SubscriptionManager - unsupported subscription type \"newPendingTransactions\"
        })
        .on('data', async (txHash) => {
            try {

                // Get transaction details
                const trx = await this.web3.eth.getTransaction(txHash);

                // Check if transaction is the one we are awaiting or not:
                const valid = this.validateExpectedTransaction(trx, eventType, this.web3.eth.defaultAccount, this._contractAddress, extra);
                //If not the transaction we are awaiting return immediately:
                if (!valid) return undefined;

                console.log('Transaction hash is: ' + txHash + '\n');

                // As we already have the transaction we wanted, unsubscribe from more transactions:
                subscription.unsubscribe();

                return action;
            }
            catch (error) {
                console.log("Error watching pending transactions: " + error);
            }
        });

        return EMPTY;
    }

    private validateExpectedTransaction(trx: any, eventType: EventType, from: string, to: string, extra: any): boolean {
        debugger;
        return false;
    }

    /**
     * Tagging an address specified by the user with a certain tag.
     * NOTE: Needs to have access to use users wallet!
     */
    public taggingAddress(tagId: number, addressToTag: string, taggingCost: string): Observable<string> {
        const gasLimit = 6000000;
        //To get immediatly the Transaction Id without waiting for its approval, would have to do the following (from "https://ethereum.stackexchange.com/a/26314"):
        //let txId = instance.registerTag.sendTransaction(PArams!!);
        //Or using "PromiEvent", like .on('transactionHash' ... // .on('confirmation', directly in web3.eth.sendTransaction
        return this.getSmartContract().pipe(
            switchMap((instance: any) => {
                return from<string>(instance.tagItById(tagId, addressToTag, TagMainContractService.ZERO_ADDRESS /* 0x0 Address */,  {from: this.web3.eth.defaultAccount, gas: gasLimit, value: taggingCost}));
            }),
            //On next methods, it's the result of final creation, with the block and event results of a successful creation:
            tap(value => console.log("Tagging address return: " + value)),
        );

    }

    /**
     * Remove a tagging from an address specified by the user.s
     * When removing a tagging is because for sure the user has already logged in with his wallet (Needed to know which addresses are possible to remove taggings from!)
     */
    public removeTagging(tagId: number, addressToRemoveTaggging: string): Observable<boolean> {
        const gasLimit = 6000000; //TODO: Decrease gas limit ! Doesn't need to be so high!
        return this.getSmartContract().pipe(
            switchMap((instance: any) => {
                //Can't use this.web3.eth.defaultAccount the first time! Not working for Remove Tagging, have no idea why! in the TaggingAddress worked without problems!
                return from<boolean>(instance.removeTagById(tagId, addressToRemoveTaggging, {from: this.web3.eth.defaultAccount, gas: gasLimit }));
            }),
            //On next methods, it's the result of final creation, with the block and event results of a successful creation:
            tap(value => console.log("Remove Tagging address return: " + value)), //Should be True / False! Or Any??? Result of Transaction! TODO: Check and update accordingly!
        );

    }

}
