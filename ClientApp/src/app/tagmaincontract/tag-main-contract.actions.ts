import { Action } from '@ngrx/store';
import {Tag} from "../tags/tags.model";

export enum ActionTypes {
  GET_TAGGING_COST = '[Tag Main Contract] Get Tagging Cost',
  GET_TAGGING_COST_SUCCESS = '[Tag Main Contract] Get Tagging Cost Success',
  GET_TAGGING_BY_CREATOR_COST = '[Tag Main Contract] Get Tagging By Creator Cost',
  GET_TAGGING_BY_CREATOR_COST_SUCCESS = '[Tag Main Contract] Get Tagging By Creator Cost Success',
  GET_TAG_CREATION_COST = '[Tag Main Contract] Get Tag Creation Cost',
  GET_TAG_CREATION_COST_SUCCESS = '[Tag Main Contract] Get Tag Creation Cost Success',
  GET_TAG_TRANSFER_COST = '[Tag Main Contract] Get Tag Transfer Cost',
  GET_TAG_TRANSFER_COST_SUCCESS = '[Tag Main Contract] Get Tag Transfer Cost Success',
  GET_ALL_TAGS = '[Tag Main Contract] Get All Tags',
  GET_ALL_TAGS_SUCCESS = '[Tag Main Contract] Get All Tags Success',
  ETH_ERROR = '[Tag Main Contract] Error',

}

/**
 * ACTIONS
 */
export class GetTaggingCost implements Action {
  readonly type = ActionTypes.GET_TAGGING_COST;
}

export class GetTaggingCostSuccess implements Action {
  readonly type = ActionTypes.GET_TAGGING_COST_SUCCESS;
  constructor(public payload: string) {}
}


export class GetTaggingByCreatorCost implements Action {
    readonly type = ActionTypes.GET_TAGGING_BY_CREATOR_COST;
}

export class GetTaggingByCreatorCostSuccess implements Action {
    readonly type = ActionTypes.GET_TAGGING_BY_CREATOR_COST_SUCCESS;
    constructor(public payload: string) {}
}


export class GetTagCreationCost implements Action {
    readonly type = ActionTypes.GET_TAG_CREATION_COST;
}

export class GetTagCreationCostSuccess implements Action {
    readonly type = ActionTypes.GET_TAG_CREATION_COST_SUCCESS;
    constructor(public payload: string) {}
}


export class GetTagTransferCost implements Action {
    readonly type = ActionTypes.GET_TAG_TRANSFER_COST;
}

export class GetTagTransferCostSuccess implements Action {
    readonly type = ActionTypes.GET_TAG_TRANSFER_COST_SUCCESS;
    constructor(public payload: string) {}
}

export class GetAllTags implements Action {
    readonly type = ActionTypes.GET_ALL_TAGS;
}

export class GetAllTagsSuccess implements Action {
    readonly type = ActionTypes.GET_ALL_TAGS_SUCCESS;
    constructor(public payload: Tag[]) {}
}


export class EthError implements Action {
    readonly type = ActionTypes.ETH_ERROR;
    constructor(public payload: any) {}
}

export type TagMainContractUnion =
    | GetTaggingCost
    | GetTaggingCostSuccess
    | GetTaggingByCreatorCost
    | GetTaggingByCreatorCostSuccess
    | GetTagCreationCost
    | GetTagCreationCostSuccess
    | GetTagTransferCost
    | GetTagTransferCostSuccess
    | GetAllTags
    | GetAllTagsSuccess
    | EthError;
