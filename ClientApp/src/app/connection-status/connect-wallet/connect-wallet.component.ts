import {Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
    selector: 'app-connect-wallet',
    templateUrl: './connect-wallet.component.html',
    styleUrls: ['./connect-wallet.component.scss']
})
export class ConnectWalletComponent implements OnInit {
    @Output() response: EventEmitter<boolean>;

    constructor() {
        this.response = new EventEmitter();
    }

    ngOnInit() {
    }

    onConnectMetamask() {
        this.response.emit(true);
    }

    onCancel() {
        this.response.emit(false);
    }
}
