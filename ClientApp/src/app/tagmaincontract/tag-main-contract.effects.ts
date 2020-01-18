import {Injectable, Inject} from '@angular/core';
import {TagMainContractService} from './tag-main-contract.services';

// NGRX
import {Effect, Actions, ofType, createEffect} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {Observable, of, from} from 'rxjs';

import * as fromAction from './tag-main-contract.actions';
import * as fromActionEth from '../ethereum/eth.actions';

// RXJS
import {tap, switchMap, exhaustMap, map, catchError, concatMap, withLatestFrom} from 'rxjs/operators';
import {TagMainContractUnion} from "./tag-main-contract.actions";
import {TagCreationData} from "../creation/tag-creation-data";
import {Batch} from "../helpers/batch-actions.helper";
import * as fromTagMainContract from "./index";

@Injectable()
export class TagMainContractEffects {

    constructor(
        private actions$: Actions<fromAction.TagMainContractUnion>,
        private ethActions$: Actions<fromActionEth.EthActionsUnion>,
        private tagMainContractService: TagMainContractService,
        private taggedContractStore: Store<fromTagMainContract.AppState>
    ) { }

    /*
        Intercepting Init of Eth Consult success, and initialize contract base values.
     */
    InitEthConsultSuccess$: Observable<Action> = createEffect( () => this.ethActions$.pipe(
        ofType(fromActionEth.ActionTypes.INIT_ETH_CONSULT_SUCCESS),
        switchMap(() => [
            new fromAction.GetTaggingCost(),
            new fromAction.GetTaggingByCreatorCost(),
            new fromAction.GetTagCreationCost(),
            new fromAction.GetTagTransferCost(),
            new fromAction.GetAllTags()
        ] ),
        catchError(err => of(new fromAction.EthError(err)))
    ));

    GetTaggingCost$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.GET_TAGGING_COST),
        switchMap(() => this.tagMainContractService.getTaggingCost().pipe(
            map((cost: string) => new fromAction.GetTaggingCostSuccess(cost)),
            catchError(err => of(new fromAction.EthError(err)))
        ))
    ));


    GetTaggingByCreatorCost$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.GET_TAGGING_BY_CREATOR_COST),
        switchMap(() => this.tagMainContractService.getTaggingByCreatorCost().pipe(
            map((cost: string) => new fromAction.GetTaggingByCreatorCostSuccess(cost)),
            catchError(err => of(new fromAction.EthError(err)))
        ))
    ));


    GetTagCreationCost$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.GET_TAG_CREATION_COST),
        switchMap(() => this.tagMainContractService.getTagCreationCost().pipe(
            tap((cost: string) => console.log("Accessing Tag Creation!")),
            map((cost: string) => new fromAction.GetTagCreationCostSuccess(cost)),
            catchError(err => of(new fromAction.EthError(err)))
        ))
    ));


    GetTagTransferCost$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.GET_TAG_TRANSFER_COST),
        switchMap(() => this.tagMainContractService.getTagTransferCost().pipe(
            map((cost: string) => new fromAction.GetTagTransferCostSuccess(cost)),
            catchError(err => of(new fromAction.EthError(err)))
        ))
    ));

    GetAllTags$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.GET_ALL_TAGS),
        switchMap(() => this.tagMainContractService.getAllTags().pipe(
            map((tags: any) => new fromAction.GetAllTagsSuccess(tags)),
            catchError(err => of(new fromAction.EthError(err)))
        ))
    ));
/*
    CreateTagPre$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.CREATE_TAG_PRE),
        map((action: fromAction.CreateTagPre) => action.payload),
        //ONGOING: SEE BATCHING OF ACTIONS!!
        //https://gitlab.com/linagora/petals-cockpit/blob/master/frontend/src/app/shared/helpers/batch-actions.helper.ts#L34-42
        //How to use: https://github.com/xipheCom/ngrx-batch-action-reducer
        //exhaustMap((payload: TagCreationData) => [new fromActionEth.InitEth(), new fromAction.CreateTag(payload)]),
        //map((payload: TagCreationData) => new fromActionEth.InitEth()),
        //ofType(fromActionEth.ActionTypes.INIT_ETH_SUCCESS),
        //switchMap((payload: TagCreationData) => [new fromAction.CreateTag(payload)]),
        map((payload: TagCreationData) => new Batch([new fromAction.CreateTag(payload)])),
        /*
        switchMap((payload: TagCreationData) => [
            new fromActionEth.InitEth(),
            new fromAction.CreateTag(payload),
        ] ),
         */
/*
        catchError(err => of(new fromAction.EthError(err)))
    ));
*/
    InitEthSuccessActionsAwaiting$: Observable<Action> = createEffect( () => this.ethActions$.pipe(
        ofType(fromActionEth.ActionTypes.INIT_ETH_SUCCESS),
        concatMap(action => of(action).pipe(
            withLatestFrom(this.taggedContractStore.pipe(select(fromTagMainContract.getActionsWaitingForEthInit)))
        )),
        switchMap(([action, actionsWaitingForEthInit]) => {
            console.log("User Wallet correctly connected.");
            console.log(`Actions Waiting: ${actionsWaitingForEthInit.length}`);
            let ret: Action[] = [new fromAction.ClearStoredActionsWaitingForEthInit()];
            for (let i = 0; i < actionsWaitingForEthInit.length; i++) {
                ret.push(actionsWaitingForEthInit[i]);
            }
            return ret;
        }),
        catchError(err => of(new fromAction.EthError(err)))
    ));


    CreateTag$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.CREATE_TAG),
        map((action: fromAction.CreateTag) => action.payload),
        switchMap((payload: TagCreationData ) => this.tagMainContractService.createTag(payload.tagName, payload.symbolName, payload.tagCreationCost).pipe(
            map((result: any) => new fromAction.CreateTagSuccess(result)),
            catchError(err => of(new fromAction.EthError(err)))
        ))
    ));

    /*
        @Effect()
        SetAttack$: Observable<Action> = this.actions$.pipe(
            ofType(fromAction.ActionTypes.SET_ATTACK),
            map((action: fromAction.SetAttack) => action.payload),
            exhaustMap((name: string) => this.tagMainContractService.setAttack(name).pipe(
                tap(result => console.log('result', result)),
                // retrieve the log information that will contain the event data.
                map(result => result.logs[0].args[0]),
                map((newName: string) => new fromAction.SetAttackSuccess(newName)),
                catchError(err => of(new fromAction.EthError(err)))
            )),
        );
    */

}
