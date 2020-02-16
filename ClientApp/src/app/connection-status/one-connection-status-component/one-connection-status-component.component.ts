import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Observable, of} from "rxjs";

@Component({
  selector: 'app-one-connection-status-component',
  templateUrl: './one-connection-status-component.component.html',
  styleUrls: ['./one-connection-status-component.component.scss']
})
export class OneConnectionStatusComponentComponent implements OnInit {

    private _connectionStatus : Observable<boolean>;

    private _letter: string;

    private _baseStatusReportTxt: string;

    constructor() {
        this._connectionStatus = of(false);
        this._letter = "";
    }

    ngOnInit() {
    }

    get connectionStatus(): Observable<boolean> {
        return this._connectionStatus;
    }

    @Input()
    set connectionStatus(status: Observable<boolean>) {
        this._connectionStatus = status;
    }

    get letter(): string {
        return this._letter;
    }

    @Input()
    set letter(letter: string) {
        this._letter = letter;
    }

    get baseStatusReportTxt(): string {
        return this._baseStatusReportTxt;
    }

    @Input()
    set baseStatusReportTxt(value: string) {
        this._baseStatusReportTxt = value;
    }

}
