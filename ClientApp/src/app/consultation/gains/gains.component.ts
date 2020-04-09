import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from "rxjs";
import {GainEvent, MainContractService} from "../../tags/state/main-contract.service";
import {MainContractQuery} from "../../tags/state/main-contract.query";
import {select, Store} from "@ngrx/store";
import * as fromEth from "../../ethereum";
import {filter, takeUntil} from "rxjs/operators";
import {EthUtils} from "../../ethereum";

@Component({
    selector: 'app-gains',
    templateUrl: './gains.component.html',
    styleUrls: ['./gains.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GainsComponent implements OnInit, OnDestroy {
    totalGains: string;
    gainsToCollect: string;

    private _currentUserAccount: string;

    private _terminate: Subject<void>;

    constructor(
        private ethStore: Store<fromEth.AppState>, //NgRx
        private mainContractService: MainContractService, //Akita
        private mainContractQuery: MainContractQuery,
        private cd: ChangeDetectorRef
    ) {
        this._currentUserAccount = null;
        this._terminate = new Subject<void>();
    }

    ngOnInit() {
        this.ethStore
            .pipe(
                select(fromEth.getDefaultAccount),
                filter(account => !!account //Account not null!
                    && (
                        !this._currentUserAccount
                        || !EthUtils.isEqualAddress(this._currentUserAccount, account) //Must check if the current user account has really changed, or just some triggering of the default account
                    )
                )
            ).subscribe(activeAccount => {
                this._currentUserAccount = activeAccount;
                this.mainContractService.retrieveAllGainsForUserAddress(activeAccount).pipe(
                    takeUntil(this._terminate)
                ).subscribe((gains: GainEvent[]) => {
                    let total = this.mainContractService.createBigNumber(0);
                    gains.forEach(gainEvent => {
                        total = total.add(this.mainContractService.createBigNumber(gainEvent.weiToReceive));
                    });

                    if(gains.length > 0) {
                        //Get the totalWeiToReceive of the last event: That will be the current Wei to Receive for the user account:
                        //TODO: Probably better to go directly to the contract!
                        //this.gainsToCollect = gains[gains.length - 1].totalWeiToReceive;
                    }
                    this.totalGains = total.toString();
                    this.cd.markForCheck();
                });
                this.mainContractService.retrieveGainsToRetrieveForUserAddress(activeAccount).pipe(
                    takeUntil(this._terminate)
                ).subscribe((gains: any/*BN*/) => {
                    this.gainsToCollect = gains ? gains.toString() : '0';
                    this.cd.markForCheck();
                });
            });

        //TODO:
        //...
        /*
        //Gains Gotten events:
        this.mainContractQuery.select(state => state.eventGainsGotten).pipe(
            takeUntil(this._terminate),
        ).subscribe(gainsGottenEvent => {
            if( gainsGottenEvent
                && fromEth.EthUtils.isEqualAddress(gainsGottenEvent.tagged, this._currentUserAccount) //We only want the Tagging events for which the "tagged" was the user itself.
            ) {
                console.log('Will need to add tagging \'' + gainsGottenEvent.tagId + '\' by: ' + gainsGottenEvent.tagger);
                this._updateTaggings(parseInt(gainsGottenEvent.tagId), TaggingType.TAGGING);

                //this.cd.markForCheck(); //TODO: Maybe will need detectChanges and not just markForCheck!
            }
        });
         */
    }

    ngOnDestroy() {
        console.debug('Terminate Gains-Component');
        this._terminate.next();
        this._terminate.complete();
    }

    collectGains() {
        console.log('Collect Gains Link pressed!');
    }
}
