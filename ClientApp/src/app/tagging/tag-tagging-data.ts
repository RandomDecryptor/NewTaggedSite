import {Tag} from "../tags/tags.model";

import Web3 from 'web3';

export interface TagTaggingData {
    tag: Tag;
    taggingCost: string;
    addressToTag: string;
    estimated?: boolean;
}

export interface TaggingEventData {
    tagId: string;
    ownerBalance: Web3.BigNumber;
    totalTaggings: Web3.BigNumber;
}

