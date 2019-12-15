import * as tagMainContractActions from './tag-main-contract.actions';
import {ActionReducerMap, createSelector, createFeatureSelector} from '@ngrx/store';
import * as root from '../reducers';

// based on https://ngrx.io/guide/store/selectors
export interface State {
    taggingCost: string;
}

const initialState: State = {
    taggingCost: null,
};


export const reducer = (state = initialState, action: tagMainContractActions.TagMainContractUnion): State => {
    switch (action.type) {

        case (tagMainContractActions.ActionTypes.GET_TAGGING_COST_SUCCESS): {
            return {...state, taggingCost: action.payload};
        }

        case (tagMainContractActions.ActionTypes.SET_ATTACK_SUCCESS): {
            return {...state, taggingCost: action.payload};
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

