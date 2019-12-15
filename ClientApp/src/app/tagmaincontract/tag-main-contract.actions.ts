import { Action } from '@ngrx/store';

export enum ActionTypes {
  SET_ATTACK = '[Tag Main Contract] Set Attack',
  SET_ATTACK_SUCCESS = '[Tag Main Contract] Set Attack Success',
  GET_TAGGING_COST = '[Tag Main Contract] Get Tagging Cost',
  GET_TAGGING_COST_SUCCESS = '[Tag Main Contract] Get Tagging Cost Success',
  ETH_ERROR = '[Tag Main Contract] Error',

}

/**
 * ACTIONS
 */
export class SetAttack implements Action {
  readonly type = ActionTypes.SET_ATTACK;
  constructor(public payload: string) {}
}

export class SetAttackSuccess implements Action {
  readonly type = ActionTypes.SET_ATTACK_SUCCESS;
  constructor(public payload: string) {}
}


export class GetTaggingCost implements Action {
  readonly type = ActionTypes.GET_TAGGING_COST;
}

export class GetTaggingCostSuccess implements Action {
  readonly type = ActionTypes.GET_TAGGING_COST_SUCCESS;
  constructor(public payload: string) {}
}


export class EthError implements Action {
    readonly type = ActionTypes.ETH_ERROR;
    constructor(public payload: any) {}
}

export type TagMainContractUnion =
    | SetAttack
    | SetAttackSuccess
    | GetTaggingCost
    | GetTaggingCostSuccess
    | EthError;
