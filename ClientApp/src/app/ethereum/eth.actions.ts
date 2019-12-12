import { Action } from '@ngrx/store';

export enum ActionTypes {
 
  INIT_ETH = '[Eth] Init Ethereum',
  INIT_ETH_SUCCESS = '[Eth] Init Ethereum Success',
  GET_ACCOUNTS = '[Eth] Get All Accounts',
  GET_ACCOUNTS_SUCCESS = '[Eth] Get All Accounts Success',
  SET_DEFAULT_ACCOUNT = '[Eth] Set Default Account',
  SET_DEFAULT_ACCOUNT_SUCCESS = '[Eth] Set Default Account Success',
  GET_CURRENT_BALANCE = '[Eth] Get Current Account Balance',
  GET_CURRENT_BALANCE_SUCCESS = '[Eth] Get Current Account Balance Success',
  ETH_ERROR = '[Eth] Error',

}

/**
 * ACTIONS
 */
export class InitEth implements Action {
  readonly type = ActionTypes.INIT_ETH;
}


export class InitEthSuccess implements Action {
  readonly type = ActionTypes.INIT_ETH_SUCCESS;
}


export class GetAccounts implements Action {
    readonly type = ActionTypes.GET_ACCOUNTS;
}

export class GetAccountsSuccess implements Action {
    readonly type = ActionTypes.GET_ACCOUNTS_SUCCESS;
    constructor(public payload: string[]) {}
}

export class SetDefaultAccount implements Action {
    readonly type = ActionTypes.SET_DEFAULT_ACCOUNT;
    constructor(public payload: string) {}
}


export class SetDefaultAccountSuccess implements Action {
  readonly type = ActionTypes.SET_DEFAULT_ACCOUNT_SUCCESS;
  constructor(public payload: string) {}
}

export class GetAccountBalance implements Action {
  readonly type = ActionTypes.GET_CURRENT_BALANCE;
}

export class GetAccountBalanceSuccess implements Action {
  readonly type = ActionTypes.GET_CURRENT_BALANCE_SUCCESS;
  constructor(public payload: string) {}
}

export class EthError implements Action {
    readonly type = ActionTypes.ETH_ERROR;
    constructor(public payload: any) {}
 }

export type EthActionsUnion =
    | InitEth
    | InitEthSuccess
    | GetAccounts
    | GetAccountsSuccess
    | SetDefaultAccount
    | SetDefaultAccountSuccess
    | GetAccountBalance
    | GetAccountBalanceSuccess
    | EthError;
