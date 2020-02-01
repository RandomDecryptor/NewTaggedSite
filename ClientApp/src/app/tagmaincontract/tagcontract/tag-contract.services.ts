import {Injectable, Inject} from '@angular/core';

import {SimpleTagSmartContract} from '../../services/tokens';
import {TruffleContract} from 'truffle-contract';

import {Observable, from} from 'rxjs';
import {tap, map, switchMap} from 'rxjs/operators';

// Web3
import {WEB3} from '../../services/tokens';
import Web3 from 'web3';

@Injectable()
export class TagContractService {

    static readonly ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    static readonly TAG_SUFFIX_SIZE = 13;

    private readonly _invalidCharsTagNameRegExp = /[\x00-\x19]|[\u0000-\u0019]|[\x7f\xff]|[\u007f\u00ff]/; /* Used for checking invalid characters in the tag names retrieved from the Ethereum network */

    private _escapeDomOperator: HTMLParagraphElement;

    constructor(@Inject(WEB3) private web3: Web3,
                @Inject(SimpleTagSmartContract) private simpleTagSmartContract: TruffleContract) {
    }

    public getSmartContract(tagContractAddress: string) {
        if(!this.simpleTagSmartContract.currentProvider) {
            //We set the provider already here, so we can access the smart contract GET methods (not possible the SET methods):
            //At this moment, we have already to have the currentProvider available! (And it should be when this services are called!)
            this.simpleTagSmartContract.setProvider(this.web3.currentProvider);
        }
        return from(this.simpleTagSmartContract.at(tagContractAddress));
    }

    private validateTagNameChars(tagName: string): boolean {
        return  tagName && //TagName exists
            tagName.trim() === tagName && //TagName has no extra spaces in the start or end!
            !this._invalidCharsTagNameRegExp.test(tagName); //TagName has no strange characters
    }

    /**
     * Clean up special characters from a text, creating a text node inside a <p> tag, to avoid HTML/Javascript exploits!
     */
    private getEscapedHtml(html): string {
        var textNode = document.createTextNode(html);
        if(!this._escapeDomOperator) {
            this._escapeDomOperator = document.createElement('p');
        }
        else {
            //Already exists operator: Clean it up!
            this._escapeDomOperator.innerHTML = '';
        }

        this._escapeDomOperator.appendChild(textNode);
        return this._escapeDomOperator.innerHTML;
    }

    private cleanUpTagName(tagName: string, tagContractAddress: string): string {
        //Proccessing tagName:
        let ret = tagName;
        if(!tagName || !this.validateTagNameChars(tagName)) {
            ret = tagContractAddress;
        }
        else {
            //Remove the Suffix (as it always repeated on all tags):
            if(tagName.length > TagContractService.TAG_SUFFIX_SIZE) {
                ret =  tagName.substring(0, tagName.length - TagContractService.TAG_SUFFIX_SIZE);
            }

            //Clean up strange characters (if they exist):
            ret = this.getEscapedHtml(ret);
        }
        return ret;
    }

    public getName(tagContractAddress: string): Observable<string> {
        return this.getSmartContract(tagContractAddress).pipe(
            switchMap((instance: any) => from<string>(instance.name())),
            map((tagName: string) => this.cleanUpTagName(tagName, tagContractAddress)),
            tap(tagName => console.log("Tag name: " + tagName))
        );
    }

}
