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
import {TagTransferDialogComponent} from "../../transfer/dialog/tag-transfer-dialog.component";
import {TagTransferDataReq} from "../../transfer/tag-transfer-data";
import {MainContractService} from "../../tags/state/main-contract.service";

@Component({
    selector: 'app-your-tags',
    templateUrl: './your-tags.component.html',
    styleUrls: ['./your-tags.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourTagsComponent implements OnInit, OnDestroy {

    columnsToDisplay = ['tagName', 'ownerBalance', 'totalTaggings', 'actions'];

    static readonly DEBOUNCE_TIME_TAGGING_EVENT = 500;

    private _dataSource = new MatTableDataSource();

    @ViewChild(MatTable) table: MatTable<Tag>;

    private tagTransferCost: string;

    private _terminate: Subject<void>;

    constructor(private taggedContractStore: Store<fromTagMainContract.AppState>, //NgRx
                private mainContractService: MainContractService, //Akita
                private _dialogService: MatDialog,
                private cd: ChangeDetectorRef) {
        this._tags = of([]);
        this.tagTransferCost = null;
        this._terminate = new Subject();
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
        this.taggedContractStore
            .pipe(
                select(fromTagMainContract.getTagTransferCost),
                takeUntil(this._terminate),
                filter(tagTransferCost => !!tagTransferCost), //Must have value to be interesting (as it has not been initialized yet)
            )
            .subscribe(tagTransferCost => {
                this.tagTransferCost = tagTransferCost;
            });
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
                debounceTime(YourTagsComponent.DEBOUNCE_TIME_TAGGING_EVENT), //Wait 0.5 seconds to signal change in value
                takeUntil(this._terminate),
            ).subscribe(tags => {
                if(!this._terminate.isStopped) {
                    console.debug('Tags Set for Your Tags: ' + (tags ? tags.length: tags));
                    this._dataSource.data = tags;
                    //To force refresh of data source
                    this.cd.detectChanges();
                }
                else {
                    console.debug('Set Tags: Your Tags already Terminated!');
                }
            });
        }
    }

    get tags() {
        return this._tags;
    }

    get dataSource() {
        return this._dataSource;
    }

    transferTag(event: any, tag: Tag) {
        console.log('Transfer Tag: ' + tag);

        let transferCost = this.tagTransferCost;
        let dialogRef = this._dialogService.open(TagTransferDialogComponent, {
            width: '440px',
            data: {
                tag: tag,
                tagTransferCost: transferCost
            }
        });
        dialogRef.afterClosed().pipe(
            takeUntil(this._terminate)
        ).subscribe((result: TagTransferDataReq) => {
            if (result) {
                //The dialog was closed as a OK!
                //Continue processing as expected:
                console.log(`Tag Id to transfer: ${result.tag.tagId}`);
                console.log(`Cost to transfer: ${result.tagTransferCost}`);
                console.log(`New owner address: ${result.newOwnerAddress}`);
                //Send request to transfer tag in the ethereum network:
                //let transferTagData = { ...result } as TagTransferDataReq; //Clone current transfer data!

                //Using Akita instead of NgRx:
                this.mainContractService.transferTagOwnership(result);

                //Hide button for tagging, as one tagging is already in progress:
                //this._removeTaggingAvailable = false;

            }
        });
    }

    ngOnDestroy(): void {
        console.debug('Terminate Your-Tags-Component');
        this._terminate.next();
        this._terminate.complete();
    }
}
