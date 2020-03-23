import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import {Tag} from "../../tags/tags.model";
import {MatDialog, MatTable, MatTableDataSource} from "@angular/material";
import {select, Store} from "@ngrx/store";
import * as fromTagMainContract from "../../tagmaincontract";
import {debounceTime, filter, takeUntil} from "rxjs/operators";
import {Observable, of, Subject} from "rxjs";
import {MainContractService} from "../../tags/state/main-contract.service";

export interface Tagging {
    tagId: number;
    tagName: string;
    balance: string;
}

@Component({
    selector: 'app-account-taggings',
    templateUrl: './account-taggings.component.html',
    styleUrls: ['./account-taggings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountTaggingsComponent implements OnInit, OnDestroy {

    columnsToDisplay = ['tagName', 'balance', 'actions'];

    static readonly DEBOUNCE_TIME_TAGGING_EVENT = 500;

    private _dataSource = new MatTableDataSource();

    @ViewChild(MatTable) table: MatTable<Tagging>;

    private _terminate: Subject<void>;

    constructor(private taggedContractStore: Store<fromTagMainContract.AppState>, //NgRx
                private mainContractService: MainContractService, //Akita
                private _dialogService: MatDialog,
                private cd: ChangeDetectorRef) {
        //this._taggings = of([]);
        //TODO: JUST TESTING:
        this._taggings = of([{tagId: 0, tagName: 'test tag', balance: '100'}]);
        this._taggings.subscribe(value => { //TODO: JUST TESTING: MOVE IT FROM HERE!
            this._dataSource.data = value;
        });
        this._terminate = new Subject();
    }

    private _taggings: Observable<Tagging[]>;

    ngOnInit() {
    }

    get taggings(): Observable<Tagging[]> {
        return this._taggings;
    }

    get dataSource() {
        return this._dataSource;
    }

    ngOnDestroy(): void {
        console.debug('Terminate Account-Taggings-Component');
        this._terminate.next();
        this._terminate.complete();
    }

    checkTagging($event: MouseEvent, tag: Tagging) {
        
    }
}
