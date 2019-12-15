import {Injectable, Inject} from '@angular/core';
import {TagMainContractService} from './tag-main-contract.services';

// NGRX
import {Effect, Actions, ofType, createEffect} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {Observable, of, from} from 'rxjs';

import * as fromAction from './tag-main-contract.actions';

// RXJS
import {tap, switchMap, exhaustMap, map, catchError} from 'rxjs/operators';
import {TagMainContractUnion} from "./tag-main-contract.actions";

@Injectable()
export class TagMainContractEffects {

    constructor(
        private actions$: Actions<fromAction.TagMainContractUnion>,
        private ethService: TagMainContractService
    ) { }

    GetTaggingCost$: Observable<Action> = createEffect( () => this.actions$.pipe(
        ofType(fromAction.ActionTypes.GET_TAGGING_COST),
        switchMap(() => this.ethService.getTaggingCost().pipe(
            map((cost: string) => new fromAction.GetTaggingCostSuccess(cost)),
            catchError(err => of(new fromAction.EthError(err)))
        ))
    ));


    @Effect()
    SetAttack$: Observable<Action> = this.actions$.pipe(
        ofType(fromAction.ActionTypes.SET_ATTACK),
        map((action: fromAction.SetAttack) => action.payload),
        exhaustMap((name: string) => this.ethService.setAttack(name).pipe(
            tap(result => console.log('result', result)),
            // retrieve the log information that will contain the event data.
            map(result => result.logs[0].args[0]),
            map((newName: string) => new fromAction.SetAttackSuccess(newName)),
            catchError(err => of(new fromAction.EthError(err)))
        )),
    );


}
