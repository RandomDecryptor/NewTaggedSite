import * as tagMainContractActions from './tag-main-contract.actions.internal';
import {ActionReducerMap, createSelector, createFeatureSelector, Action} from '@ngrx/store';
import * as root from '../reducers';
import {Tag} from "../tags/tags.model";

// based on https://ngrx.io/guide/store/selectors
export interface State {
    taggingCost: string;
    taggingByCreatorCost: string;
    tagCreationCost: string;
    tagTransferCost: string;
    tags: Tag[];
    actionsWaitingForEthInit: Action[];
}


const initialState: State = {
    taggingCost: null,
    taggingByCreatorCost: null,
    tagCreationCost: null,
    tagTransferCost: null,
    tags: [],
    actionsWaitingForEthInit: [],
};


export const reducer = (state = initialState, action: tagMainContractActions.TagMainContractUnion): State => {
    switch (action.type) {

        case (tagMainContractActions.ActionTypes.GET_TAGGING_COST_SUCCESS): {
            return {...state, taggingCost: action.payload};
        }

        case (tagMainContractActions.ActionTypes.GET_TAGGING_BY_CREATOR_COST_SUCCESS): {
            return {...state, taggingByCreatorCost: action.payload};
        }

        case (tagMainContractActions.ActionTypes.GET_TAG_CREATION_COST_SUCCESS): {
            return {...state, tagCreationCost: action.payload};
        }

        case (tagMainContractActions.ActionTypes.GET_TAG_TRANSFER_COST_SUCCESS): {
            return {...state, tagTransferCost: action.payload};
        }

        case (tagMainContractActions.ActionTypes.GET_ALL_TAGS_SUCCESS): {
            return {...state, tags: action.payload};
        }

        //TODO: Maybe this management of the storing of the action and waiting for the Eth Init, should be handled by a service?
        //the service would use selector "getConStatus" and subscribe to changes to it and when network is up launch new action?
        case (tagMainContractActions.ActionTypes.STORE_ACTION_UNTIL_ETH_INITIALIZED): {
            return {...state, actionsWaitingForEthInit: [...state.actionsWaitingForEthInit, action.payload]};
        }

        case (tagMainContractActions.ActionTypes.CLEAR_STORE_ACTION_UNTIL_ETH_INITIALIZED): {
            return {...state, actionsWaitingForEthInit: []};
        }

        case (tagMainContractActions.ActionTypes.ETH_ERROR): {
            console.error('Got error:', action.payload);
            return state;
        }
        default: {
            return state;
        }
    }
};

// add new state slice
export interface TagMainContractState {
  mainContract: State ;
}

/**
 * Ethereum Global State
 */
export interface AppState extends root.AppState {
    tagMainContractState: TagMainContractState;
}

export const reducers: ActionReducerMap<TagMainContractState> = {
    mainContract: reducer
};


export const selectTagMainContractState = createFeatureSelector<AppState, TagMainContractState>('tagMainContractState');
export const getTagMainContractState = createSelector(selectTagMainContractState, (state: TagMainContractState) => state.mainContract);

export const getTaggingCost = createSelector(getTagMainContractState, (state: State) => state.taggingCost);
export const getTaggingByCreatorCost = createSelector(getTagMainContractState, (state: State) => state.taggingByCreatorCost);
export const getTagCreationCost = createSelector(getTagMainContractState, (state: State) => state.tagCreationCost);
export const getTagTransferCost = createSelector(getTagMainContractState, (state: State) => state.tagTransferCost);
export const getAllTags = createSelector(getTagMainContractState, (state: State) => state.tags);
export const getActionsWaitingForEthInit = createSelector(getTagMainContractState, (state: State) => state.actionsWaitingForEthInit);

