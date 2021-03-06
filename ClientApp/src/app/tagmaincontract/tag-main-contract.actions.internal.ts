import {Action} from '@ngrx/store';
import {Tag} from "../tags/tags.model";
import {TagCreationData} from "../creation/tag-creation-data";
import {TaggingEventData, TagTaggingData} from "../tagging/tag-tagging-data";
import {NotificationType} from "../notifications/notifications";

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
  CREATE_TAG_INTERNAL = '[Tag Main Contract] Create Tag Internal',
  CREATE_TAG_INTERNAL_SUCCESS = '[Tag Main Contract] Create Tag Internal Success',
  CREATE_TAG = '[Tag Main Contract] Create Tag Pre',
  CREATE_TAG_SUCCESS = '[Tag Main Contract] Create Tag Pre Success',
  TAGGING_ADDRESS_INTERNAL = '[Tag Main Contract] Tagging Address Internal',
  TAGGING_ADDRESS_INTERNAL_SUCCESS = '[Tag Main Contract] Tagging Address Internal Success',
  TAGGING_ADDRESS = '[Tag Main Contract] Tagging Address',
  TAGGING_ADDRESS_SUCCESS = '[Tag Main Contract] Tagging Address Success',
  TAGGING_ADDRESS_EVENT = '[Tag Main Contract] Tagging Address Event',
  STORE_ACTION_UNTIL_ETH_INITIALIZED = '[Tag Main Contract] Store Action Until Connection to User Ethereum Wallet Allowed',
  CLEAR_STORE_ACTION_UNTIL_ETH_INITIALIZED = '[Tag Main Contract] CLEAR Store Action Until Connection to User Ethereum Wallet Allowed',
  NOTIFY_USER = '[Tag Main Contract] Notify User Action',
  WATCH_FOR_EVENT = '[Tag Main Contract] Watch For Ethereum Network Event Action',
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

export interface UserNotif {
    uid: number;
    type: NotificationType;
    msg: string;
}

export class NotifyUser implements Action {
    readonly type = ActionTypes.NOTIFY_USER;
    constructor(public payload: { type: NotificationType, msg: string}) {}
}


export enum EventType {
    CREATION,
    TRANSFER,
    TAGGING,
    REMOVAL
}

export class WatchForEvent implements Action {
    readonly type = ActionTypes.WATCH_FOR_EVENT;
    constructor(public payload: { type: EventType, from: string, to: string, extra: any, action: Action}) {}
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

export class CreateTag implements Action {
    readonly type = ActionTypes.CREATE_TAG;
    constructor(public payload: TagCreationData) {}
}

export class CreateTagSuccess implements Action {
    readonly type = ActionTypes.CREATE_TAG_SUCCESS;
    constructor(public payload: { data: TagCreationData, result: any }) {}
}

export class CreateTagInt implements Action {
    readonly type = ActionTypes.CREATE_TAG_INTERNAL;
    constructor(public payload: TagCreationData) {}
}

export class CreateTagIntSuccess implements Action {
    readonly type = ActionTypes.CREATE_TAG_INTERNAL_SUCCESS;
    constructor(public payload: { data: TagCreationData, result: any } ) {}
}

export class TaggingAddress implements Action {
    readonly type = ActionTypes.TAGGING_ADDRESS;
    constructor(public payload: TagTaggingData) {}
}

export class TaggingAddressSuccess implements Action {
    readonly type = ActionTypes.TAGGING_ADDRESS_SUCCESS;
    constructor(public payload: { data: TagTaggingData, result: any }) {}
}

export class TaggingAddressInt implements Action {
    readonly type = ActionTypes.TAGGING_ADDRESS_INTERNAL;
    constructor(public payload: TagTaggingData) {}
}

export class TaggingAddressIntSuccess implements Action {
    readonly type = ActionTypes.TAGGING_ADDRESS_INTERNAL_SUCCESS;
    constructor(public payload: { data: TagTaggingData, result: any }) {}
}

export class StoreActionUntilEthInited implements Action {
    readonly type = ActionTypes.STORE_ACTION_UNTIL_ETH_INITIALIZED;
    constructor(public payload: Action) {}
}

export class ClearStoredActionsWaitingForEthInit implements Action {
    readonly type = ActionTypes.CLEAR_STORE_ACTION_UNTIL_ETH_INITIALIZED;
}

export class EthError implements Action {
    readonly type = ActionTypes.ETH_ERROR;
    constructor(public payload: any) {}
}

export class EventTaggingAddress implements Action {
    readonly type = ActionTypes.TAGGING_ADDRESS_EVENT;
    constructor(public payload: TaggingEventData) {}
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
    | CreateTagInt
    | CreateTagIntSuccess
    | CreateTag
    | CreateTagSuccess
    | TaggingAddressInt
    | TaggingAddressIntSuccess
    | TaggingAddress
    | TaggingAddressSuccess
    | EventTaggingAddress
    | StoreActionUntilEthInited
    | ClearStoredActionsWaitingForEthInit
    | NotifyUser
    | EthError;

