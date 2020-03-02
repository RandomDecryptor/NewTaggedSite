import {Tag} from "../tags/tags.model";

export interface TagRemoveTaggingData {
    tag: Tag;
    currentUserAddress: string;
    addressToRemoveTag: string;
}

export interface RemoveTaggingEventData {
    tagger: string;
    tagged: string;
    tagId: number;
}

