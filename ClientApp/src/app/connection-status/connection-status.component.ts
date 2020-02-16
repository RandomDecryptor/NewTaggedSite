import {Component, ElementRef, Injector, OnInit, ViewChild} from '@angular/core';
import {Observable, of, Subject} from "rxjs";
import {select, Store} from "@ngrx/store";
import * as fromTagMainContract from "../tagmaincontract";
import * as fromEth from "../ethereum";
import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {ComponentPortal, PortalInjector} from "@angular/cdk/portal";
import {InfoData, SmallInfoOverlayComponent} from "./small-info-overlay/small-info-overlay.component";
import {OneConnectionStatusComponentComponent} from "./one-connection-status-component/one-connection-status-component.component";
import {first, takeUntil} from "rxjs/operators";
import {ConnectWalletComponent} from "./connect-wallet/connect-wallet.component";
import {ConnectEthereumNetworkComponent} from "./connect-ethereum-network/connect-ethereum-network.component";

@Component({
    selector: 'app-connection-status',
    templateUrl: './connection-status.component.html',
    styleUrls: ['./connection-status.component.scss']
})
export class ConnectionStatusComponent implements OnInit {

    private _connectionStatusEthNetwork$ : Observable<boolean>;

    private _connectionStatusUserWallet$ : Observable<boolean>;

    private _allAccounts$ : Observable<string[]>;

    private _overlayRef: OverlayRef = null;

    @ViewChild('ethConnStatus', {read: ElementRef}) _ethConnStatus: ElementRef;

    @ViewChild('userWalletStatus', {read: ElementRef}) _userWalletStatus: ElementRef;

    constructor(private ethStore: Store<fromEth.AppState>,
                private overlayService: Overlay,
                private parentInjector: Injector) {
        this._connectionStatusEthNetwork$ = of(false);
        this._connectionStatusUserWallet$ = of(false);
    }

    ngOnInit() {
        this._connectionStatusEthNetwork$ = this.ethStore.pipe(select(fromEth.getConConsultStatus));
        this._connectionStatusUserWallet$ = this.ethStore.pipe(select(fromEth.getConStatus));
        this._allAccounts$ = this.ethStore.pipe(select(fromEth.getAllAccounts));
    }

    get connectionStatusEthNetwork(): Observable<boolean> {
        return this._connectionStatusEthNetwork$;
    }

    get connectionStatusUserWallet(): Observable<boolean> {
        return this._connectionStatusUserWallet$;
    }

    private _createOverLay(parentElementRef: ElementRef): OverlayRef {
        return this.overlayService.create({
            positionStrategy: this.overlayService.position().flexibleConnectedTo(parentElementRef)
                .withPositions([{
                    originX: 'start',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'top',
                }, {
                    originX: 'start',
                    originY: 'top',
                    overlayX: 'start',
                    overlayY: 'bottom',
                }]),
            hasBackdrop: false
        });
    }

    private _handlerClickForOverlays(overlayRef: OverlayRef, event) {
        //console.log('event: ' + event.target);
        if(!event.target || event.target.tagName !== 'A') {
            overlayRef.detach();
        }
        else {
            overlayRef.hostElement.addEventListener('click', (event) => this._handlerClickForOverlays(overlayRef, event), {once: true});
        }
    }

    private _interceptEventsOverlay(overlayRef: OverlayRef) {
        const terminate = new Subject();
        //Remove info overlay if any key is pressed, or overlay is clicked!
        overlayRef.keydownEvents().pipe(
            takeUntil(terminate)
        ).subscribe(event => {
            //console.log('Event: ' + event.key + ' Ctrl: ' + event.ctrlKey);
            var exclude = /Control|Alt/;

            //Ignore just Control+C (for copy):
            if ((!exclude.test(event.key))
                && !(event.ctrlKey && (event.key === 'c' || event.key === 'C'))) {
                terminate.complete(); //End observer for key down events!
                //Real key pressed: Hide overlay!
                overlayRef.detach();
            }
        });
        overlayRef.hostElement.addEventListener('click', (event) => this._handlerClickForOverlays(overlayRef, event), {once: true});
    }

    private _clearCurrentOverlay() {
        if (this._overlayRef && this._overlayRef.hasAttached()) {
            this._overlayRef.detach();
        }
    }

    private showInfoOverlay(msg: string, klass: string, elementRef: ElementRef) {
        this._clearCurrentOverlay();
        this._overlayRef = this._createOverLay(elementRef);

        this._interceptEventsOverlay(this._overlayRef);

        const injector = this._getInjector({msg: msg, klass: klass}, this.parentInjector);
        const smallInfoPortal = new ComponentPortal(
            SmallInfoOverlayComponent,
            null,
            injector
        );

        const componentRef = this._overlayRef.attach(smallInfoPortal);

        //console.log('Test: ' + componentRef.instance);

        //Remove overlay after 5 seconds:
        /*
        const thisOverlayRef = this._overlayRef;
        setTimeout(() => {
            thisOverlayRef.detach();
        }, 5000); // 5 seconds
        */
    }

    private showConnectUserWallet() {
        const elementRef: ElementRef = this._userWalletStatus;
        this._clearCurrentOverlay();
        this._overlayRef = this._createOverLay(elementRef);

        //this._interceptEventsOverlay(this._overlayRef);

        const connectWalletPortal = new ComponentPortal(ConnectWalletComponent);

        const componentRef = this._overlayRef.attach(connectWalletPortal);

        //console.log('Test: ' + componentRef.instance);

        componentRef.instance.response.pipe(
            first()
        ).subscribe(value => this._processConnectUserWalletResponse(value));

    }

    private showConnectEthereumNetwork() {
        const elementRef: ElementRef = this._ethConnStatus;
        this._clearCurrentOverlay();
        this._overlayRef = this._createOverLay(elementRef);

        this._interceptEventsOverlay(this._overlayRef);

        const connectEthereumNetworkPortal = new ComponentPortal(ConnectEthereumNetworkComponent);

        const componentRef = this._overlayRef.attach(connectEthereumNetworkPortal);

    }

    _getInjector(data: InfoData, parentInjector: Injector): PortalInjector {
        const tokens = new WeakMap();

        tokens.set(InfoData, data);

        return new PortalInjector(parentInjector, tokens);
    }

    onClickStatusEthNetwork(event) {
        //Get latest value:
        this._connectionStatusEthNetwork$.pipe(
            first()
        ).subscribe(value => {
            console.log('onClickStatusEthNetwork: ConnectionStatusComponent: ' + value);
            if(!value) {
                //Not connected to Ethereum network! Missing Web3 provider: Recomend MetaMask!
                this.showConnectEthereumNetwork();
            }
            else {
                //Just show mini overlay, mentioning it is connected to Ethereum network:
                this.showInfoOverlay("Connected to Ethereum network.", "positive", this._ethConnStatus);
            }
        });
    }


    onClickStatusUserWallet(event) {
        this._connectionStatusUserWallet$.pipe(
            first()
        ).subscribe(value => {
            console.log('onClickStatusUserWallet: ConnectionStatusComponent: ' + value);
            if(!value) {
                //User Wallet not connected: Warn user and allow him to force to connect to wallet!
                this.showConnectUserWallet();
            }
            else {
                //Just mentioned it is connect to User Waller 0xXXXXXXXXX...XXXXXX:
                this._allAccounts$.pipe(
                    first()
                ).subscribe(accounts => {
                    this.showInfoOverlay("Connected to user wallet: " + accounts[0], "positive", this._userWalletStatus);
                });
            }
        });
    }

    private _processConnectUserWalletResponse(response: boolean) {
        console.log('_processConnectUserWalletResponse: ' + response);
        if(!response) {
            //Cancel:
            this._overlayRef.detach();
        }
        else {
            //Connect wallet:
            this.ethStore.dispatch(new fromEth.InitEth());
            this._overlayRef.detach();
        }
    }
}
