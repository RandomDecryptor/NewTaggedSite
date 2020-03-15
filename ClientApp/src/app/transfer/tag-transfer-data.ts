import {Tag} from "../tags/tags.model";

export interface TagTransferData {
    tagTransferCost: string;
    tag: Tag;
    newOwnerAddress?: string;
}

export interface TagTransferDataReq {
    tagId: number;
    tagTransferCost: string;
    newOwnerAddress: string;
}

