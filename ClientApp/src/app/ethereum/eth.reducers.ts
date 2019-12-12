
import * as ethActions from './eth.actions';
import { ActionReducerMap, createSelector, createFeatureSelector } from '@ngrx/store';
import * as root from '../reducers';

// based on https://ngrx.io/guide/store/selectors
export interface State {
    connectionStatus: boolean;
    defaultAccount: string;
    balance: string;
    accounts: string[];
}

const initialState: State  = {
  connectionStatus: false,
  defaultAccount: null,
  balance: null,
  accounts: []
};


export const reducer = (state = initialState, action: ethActions.EthActionsUnion): State  => {
    switch (action.type) {

      case (ethActions.ActionTypes.INIT_ETH_SUCCESS): {
        return {...state, connectionStatus: true};
      }
      case (ethActions.ActionTypes.GET_ACCOUNTS_SUCCESS): {
            return {...state, accounts: action.payload };
        }
        case (ethActions.ActionTypes.SET_DEFAULT_ACCOUNT_SUCCESS): {
            return {...state, defaultAccount: action.payload };
        }
        case (ethActions.ActionTypes.GET_CURRENT_BALANCE_SUCCESS): {
          return {...state, balance: action.payload };
      }
        case (ethActions.ActionTypes.ETH_ERROR): {
            console.error('Got error:', action.payload);
            return state;
        }
        default: {
            return state;
        }
    }
};

// add new state slice
export interface EthState {
  eth: State ;
}

/**
 * Ethereum Global State
 */
export interface AppState extends root.AppState {
    ethState: EthState;
}

export const reducers: ActionReducerMap<EthState> = {
    eth: reducer
};


export const selectEthState = createFeatureSelector<AppState, EthState>('ethState');
export const getEthState = createSelector(selectEthState, (state: EthState) => state.eth);

export const getConStatus = createSelector(getEthState, (state: State) => state.connectionStatus);
export const getAllAccounts = createSelector(getEthState, (state: State) => state.accounts);
export const getDefaultAccount = createSelector(getEthState, (state: State) => state.defaultAccount);
export const getAccountBalance = createSelector(getEthState, (state: State) => state.balance);
