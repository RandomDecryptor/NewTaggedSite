
/*
    Model for the Tag, that will keep the information for each tag (contract info and other stuff)
 */
export interface Tag {
    contractAddress: string;
    creatorAddress: string;
    ownerBalance: any; //TODO: Maybe change to BigNumber later
    totalTaggings: any; //TODO: Maybe change to BigNumber later
    tagIndex: number;
    tagId: number;
    name?: string;
    symbol?: string
}
