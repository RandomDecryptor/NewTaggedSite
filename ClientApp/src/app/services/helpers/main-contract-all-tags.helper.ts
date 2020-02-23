import {Injectable} from '@angular/core';
import {Tag} from "../../tags/tags.model";

import Web3 from 'web3'

export class MainContractAllTagsHelper {

    constructor(private allTags: Tag[]) {
        console.log('allTags' + allTags);
    }

    public updateByTagging(tagId: string, ownerBalance: Web3.BigNumber, totalTaggings: Web3.BigNumber) {
        //const tagIndex = this.getTagIndexById(tagId);
        for(let i = 0; i < this.allTags.length; i++) {
            if(tagId === this.allTags[i].tagId.toString()) {
                this.allTags[i].ownerBalance = ownerBalance;
                this.allTags[i].totalTaggings = totalTaggings;
                break;
            }
        }

    }

    private getTagIndexById(tagId: string): number {
        return this.allTags.findIndex(tag => tag.tagId.toString() == tagId);
    }
}
