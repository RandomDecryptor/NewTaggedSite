import {ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {Subject} from "rxjs";
import {GainEvent, MainContractService} from "../../tags/state/main-contract.service";
import {MainContractQuery} from "../../tags/state/main-contract.query";
import {select, Store} from "@ngrx/store";
import * as fromEth from "../../ethereum";
import {filter, takeUntil} from "rxjs/operators";
import {EthUtils} from "../../ethereum";
import {filterNil} from "@datorama/akita";
import {createNotification} from "../../notifications/state/notification.model";
import {NotificationType} from "../../notifications/notifications";
import {NotificationService} from "../../notifications/state/notification.service";
import {WeiToEtherPipe} from "../../pipes/wei-to-ether.pipe";
import {GainsSoundService} from "./services/gains-sound.service";

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
        private notificationService: NotificationService,
        private weiToEtherPipe: WeiToEtherPipe,
        private gainsSoundService: GainsSoundService,
        private cd: ChangeDetectorRef,
        private ngZone: NgZone
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

        //Gains Gotten events:
        this.mainContractQuery.select(state => state.eventGainsGotten).pipe(
            takeUntil(this._terminate),
        ).subscribe(gainsGottenEvent => {
            if( gainsGottenEvent
                && fromEth.EthUtils.isEqualAddress(gainsGottenEvent.userAddress, this._currentUserAccount) //We only want the GainsGotten events for which the "userAddress" was the user itself.
            ) {
                console.log('Will need to add gains ' + gainsGottenEvent.weiToReceive + ' Wei / Total : ' + gainsGottenEvent.totalWeiToReceive + ' Wei.');
                this._updateGains(gainsGottenEvent.weiToReceive, gainsGottenEvent.totalWeiToReceive);
                const valueToReceiveEth = this.weiToEtherPipe.transform(gainsGottenEvent.weiToReceive);
                this.ngZone.run(() => {
                    this.notificationService.add(createNotification({
                        type: NotificationType.INFO_GAINS,
                        msg: `${valueToReceiveEth} Eth were added to your gains.`
                    }));
                });
                //Play gains sound:
                this.gainsSoundService.playGainsSound();

                //Refresh screen as this event will not be triggered by Angular side, but by other services:
                this.cd.detectChanges();
            }
        });

        //Retrieve Gains event:
        this.mainContractQuery.select("retrieveGains").pipe(
            filterNil //Value must have something: Ignore Null/Undefined values
        ).subscribe(retrieveGains => {
            const { userAddress, weiReceived, result } = retrieveGains;
            const valueReceivedEth = this.weiToEtherPipe.transform(weiReceived);
            this.notificationService.add( createNotification({
                type: NotificationType.INFO,
                msg: `You have collected your gains: ${valueReceivedEth} Eth.`
            }));
            this.gainsToCollect = '0';
            this.cd.markForCheck();
        });

    }

    ngOnDestroy() {
        console.debug('Terminate Gains-Component');
        this._terminate.next();
        this._terminate.complete();
    }

    collectGains() {
        console.log('Collect Gains Link pressed!');
        this.mainContractService.retrieveGainsGotten();
    }

    private _updateGains(weiToReceive: any, totalWeiToReceive: any) {
        if(weiToReceive) {
            let baseValueBN;
            if(!this.totalGains) {
                baseValueBN = this.mainContractService.createBigNumber('0');
            }
            else {
                baseValueBN = this.mainContractService.createBigNumber(this.totalGains);
            }
            //Increase the total gains forever until now the user account has gotten:
            this.totalGains = baseValueBN.add(this.mainContractService.createBigNumber(weiToReceive));
        }
        //Update the gains the user can collect at the moment:
        this.gainsToCollect = totalWeiToReceive;
    }
}
