import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {Tag} from "../../tags/tags.model";
import {MatTable, MatTableDataSource} from "@angular/material";
import {select, Store} from "@ngrx/store";
import * as fromTagMainContract from "../../tagmaincontract";
import {debounceTime, filter, tap} from "rxjs/operators";
import {Observable, of} from "rxjs";

@Component({
    selector: 'app-your-tags',
    templateUrl: './your-tags.component.html',
    styleUrls: ['./your-tags.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourTagsComponent implements OnInit {

    columnsToDisplay = ['tagName', 'ownerBalance', 'totalTaggings'];

    static readonly DEBOUNCE_TIME_TAGGING_EVENT = 500;

    private _dataSource = new MatTableDataSource();

    @ViewChild(MatTable) table: MatTable<Tag>;

    constructor(private taggedContractStore: Store<fromTagMainContract.AppState>,
                private cd: ChangeDetectorRef) {
        this._tags = of([]);
    }

    private _tags: Observable<Tag[]>;

    ngOnInit() {
        /*
        this.taggedContractStore
            .pipe(
                select(fromTagMainContract.getTaggingEvent),
                filter(taggingEvent => !!taggingEvent), //Must have value to be interesting (as it has not been initialized yet)
                tap(taggingEvent => {
                    console.log(`Tagging EVENT detected from contact: ${taggingEvent.tagId} / ${taggingEvent.ownerBalance} / ${taggingEvent.totalTaggings}`);
                }),
                debounceTime(YourTagsComponent.DEBOUNCE_TIME_TAGGING_EVENT) //Wait 0.5 seconds to signal change in value
            )
            .subscribe(taggingEvent => {
                //this.updateRows();
                //To force refresh of data source (We hope!)
                this.cd.detectChanges();
            });
        */
    }

/*
    public updateRows() {
        this.table.renderRows();
    }
*/
    @Input() set tags(value: Observable<Tag[]>) {
        this._tags = value;
        if(this._tags) {
            this._tags.pipe(
                debounceTime(YourTagsComponent.DEBOUNCE_TIME_TAGGING_EVENT) //Wait 0.5 seconds to signal change in value
            ).subscribe(tags => {
                this._dataSource.data = tags;
                //To force refresh of data source
                this.cd.detectChanges();
            });
        }
    }

    get tags() {
        return this._tags;
    }

    get dataSource() {
        return this._dataSource;
    }
}
