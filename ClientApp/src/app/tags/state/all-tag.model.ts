import {Tag} from "../tags.model";

export function createTag(params: Partial<Tag>) {
    return {
        tagId: params.tagId,
        name: params.name,
        tagIndex: params.tagIndex,
        ownerBalance: params.ownerBalance,
        creatorAddress: params.creatorAddress,
        totalTaggings: params.totalTaggings,
        contractAddress: params.contractAddress,
        symbol: params.symbol,
    } as Tag;
}
