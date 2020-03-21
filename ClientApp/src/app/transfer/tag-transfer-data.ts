import {Tag} from "../tags/tags.model";

export interface TagTransferData {
    tagTransferCost: string;
    tag: Tag;
    newOwnerAddress?: string;
}

export interface TagTransferDataReq {
    tag: Tag;
    tagTransferCost: string;
    newOwnerAddress: string;
}

