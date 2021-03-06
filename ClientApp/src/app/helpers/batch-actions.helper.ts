/**
 * Copyright (C) 2017-2019 Linagora
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * From: https://gitlab.com/linagora/petals-cockpit/blob/master/frontend/src/app/shared/helpers/batch-actions.helper.ts#L34-42
 */

import { Inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Action, ActionReducer, ScannedActionsSubject } from '@ngrx/store';
import { from, Observable, of } from 'rxjs';
import { MergeMapOperator } from 'rxjs/internal/operators/mergeMap';

export const BatchType = 'BATCHING_REDUCER.BATCH';
export class Batch implements Action {
    readonly type = BatchType;
    constructor(public readonly payload: Action[]) {}
}

export function batchActions(actions: Action[]): Batch {
    return new Batch(actions);
}

export function enableBatching<S>(reduce: ActionReducer<S>): ActionReducer<S> {
    return function batchingReducer(state: S, action: Action): S {
        if (action.type === BatchType) {
            return (action as Batch).payload.reduce(batchingReducer, state);
        } else {
            return reduce(state, action);
        }
    };
}

export function explodeBatchActionsOperator(keepBatchAction = true) {
    return new ExplodeBatchActionsOperator(keepBatchAction);
}

export class ExplodeBatchActionsOperator extends MergeMapOperator<
    Action,
    Action
    > {
    constructor(keepBatchAction: boolean) {
        super(action => {
            if (action.type === BatchType) {
                const batch = action as Batch;
                return from(
                    keepBatchAction ? [batch, ...batch.payload] : batch.payload
                );
            } else {
                return of(action);
            }
        });
    }
}

@Injectable()
export class ActionsWithBatched extends Actions<Action> {
    constructor(@Inject(ScannedActionsSubject) source?: Observable<Action>) {
        super(source);
        // TODO replace deprecated operator attribute. See https://github.com/ngrx/platform/issues/468
        // @deprecated — This is an internal implementation detail, do not use.
        // tslint:disable-next-line:deprecation
        this.operator = explodeBatchActionsOperator();
    }
}
