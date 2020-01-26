import {Injectable} from '@angular/core';
import {TagMainContractService} from './tag-main-contract.services';
// NGRX
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {merge, Observable, of} from 'rxjs';

import * as fromAction from './tag-main-contract.actions.internal';
import {EventType, NotificationType} from './tag-main-contract.actions.internal';
import * as fromActionEth from '../ethereum/eth.actions';
// RXJS
import {catchError, concatMap, map, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {TagCreationData} from "../creation/tag-creation-data";
import {AppState, getActionsWaitingForEthInit} from './tag-main-contract.reducers';

@Injectable()
export class TagMainContractEffects {

    constructor(
        private actions$: Actions<fromAction.TagMainContractUnion>,
        private ethActions$: Actions<fromActionEth.EthActionsUnion>,
        private tagMainContractService: TagMainContractService,
        private taggedContractStore: Store<AppState>
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
    CreateTag$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.CREATE_TAG),
        map((action: fromAction.CreateTag) => action.payload),
        //ONGOING: SEE BATCHING OF ACTIONS!!
        //https://gitlab.com/linagora/petals-cockpit/blob/master/frontend/src/app/shared/helpers/batch-actions.helper.ts#L34-42
        //How to use: https://github.com/xipheCom/ngrx-batch-action-reducer
        //exhaustMap((payload: TagCreationData) => [new fromActionEth.InitEth(), new fromAction.CreateTagInt(payload)]),
        //map((payload: TagCreationData) => new fromActionEth.InitEth()),
        //ofType(fromActionEth.ActionTypes.INIT_ETH_SUCCESS),
        //switchMap((payload: TagCreationData) => [new fromAction.CreateTagInt(payload)]),
        map((payload: TagCreationData) => new Batch([new fromAction.CreateTagInt(payload)])),
        /*
        switchMap((payload: TagCreationData) => [
            new fromActionEth.InitEth(),
            new fromAction.CreateTagInt(payload),
        ] ),
         */
/*
        catchError(err => of(new fromAction.EthError(err)))
    ));
*/
    CreateTag$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.CREATE_TAG),
        map((action: fromAction.CreateTag) => action.payload),
        //switchMap((payload: TagCreationData) => [new fromAction.CreateTagInt(payload)])),
        switchMap((payload: TagCreationData) => [new fromAction.StoreActionUntilEthInited(new fromAction.CreateTagInt(payload)), new fromActionEth.InitEth()])),

        catchError(err => of(new fromAction.EthError(err)))
    );

    CreateTagIntSuccess$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.CREATE_TAG_INTERNAL_SUCCESS),
        map((action: fromAction.CreateTagIntSuccess) => action.payload),
        //Handle the Internal CreationTag event success, and convert it into the public event CreateTagSuccess
        switchMap((payload: TagCreationData) => [new fromAction.CreateTagSuccess(payload)])),
        catchError(err => of(new fromAction.EthError(err)))
    );

    InitEthSuccessActionsAwaiting$: Observable<Action> = createEffect( () => this.ethActions$.pipe(
        ofType(fromActionEth.ActionTypes.INIT_ETH_SUCCESS),
        concatMap(action => of(action).pipe(
            withLatestFrom(this.taggedContractStore.pipe(select(getActionsWaitingForEthInit)))
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


    CreateTagInt$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.CREATE_TAG_INTERNAL),
        map((action: fromAction.CreateTagInt) => action.payload),
        switchMap((payload: TagCreationData ) =>
            merge(
                this.tagMainContractService.createTag(payload.tagName, payload.symbolName, payload.tagCreationCost).pipe(
                    map((result: any) => new fromAction.CreateTagIntSuccess(result)),
                    catchError(err => {
                        const msgExtracted = err['message'] ? err['message'] : err;
                        return of(new fromAction.EthError(`Error creating tag '${payload.tagName}': ${msgExtracted}`));
                    })
                )
                /*,
                this.tagMainContractService.watchForEvent(
                    EventType.CREATION,
                    payload.tagName,
                    new fromAction.NotifyUser({type: NotificationType.INFO, msg: `New Transaction to create new tag ${payload.tagName} sent to Ethereum network.`})
                )
                 */
                //of(new fromAction.NotifyUser({type: NotificationType.INFO, msg: `New Transaction to create new tag ${payload.tagName} sent to Ethereum network.`})) //Send also notification that new transaction was sent to Ethereum network!
                //TODO: Doesn't appear to be working as expected!! Log message appears even if the user doesn't allow the transaction in metamask! but at least it only shows after the user has connected the wallet!
            )
        )
    ));

    NotifyUserAction$: Observable<Action> = createEffect(() => this.actions$.pipe(
                    ofType(fromAction.ActionTypes.NOTIFY_USER),
                    tap((action) => console.log("NOTIFY: Inform user of message: " + action.payload.msg))
                    //TODO: To do on reduce: Add message to variable on store! Variable would keep all messages currently showing on screen, that the user has not cleared yet!
                ),
        {
                    dispatch: false
               }
    );

    EthErrorDetectedAction$: Observable<Action> = createEffect(() => this.actions$.pipe(
        ofType(fromAction.ActionTypes.ETH_ERROR),
        map((action) => new fromAction.NotifyUser({type: NotificationType.ERR, msg: `${action.payload}`}))
        //TODO: To do on reduce: Add message to variable on store! Variable would keep all messages currently showing on screen, that the user has not cleared yet!
        )
    );

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
