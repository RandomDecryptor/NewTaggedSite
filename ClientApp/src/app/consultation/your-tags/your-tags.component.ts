import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {Tag} from "../../tags/tags.model";
import {MatDialog, MatTable, MatTableDataSource} from "@angular/material";
import {select, Store} from "@ngrx/store";
import * as fromTagMainContract from "../../tagmaincontract";
import {debounceTime, filter} from "rxjs/operators";
import {Observable, of} from "rxjs";
import {TagTransferDialogComponent} from "../../transfer/dialog/tag-transfer-dialog.component";
import {TagTransferDataReq} from "../../transfer/tag-transfer-data";

@Component({
    selector: 'app-your-tags',
    templateUrl: './your-tags.component.html',
    styleUrls: ['./your-tags.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourTagsComponent implements OnInit {

    columnsToDisplay = ['tagName', 'ownerBalance', 'totalTaggings', 'actions'];

    static readonly DEBOUNCE_TIME_TAGGING_EVENT = 500;

    private _dataSource = new MatTableDataSource();

    @ViewChild(MatTable) table: MatTable<Tag>;

    private tagTransferCost: string;

    constructor(private taggedContractStore: Store<fromTagMainContract.AppState>,
                private _dialogService: MatDialog,
                private cd: ChangeDetectorRef) {
        this._tags = of([]);
        this.tagTransferCost = null;
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
        dialogRef.afterClosed().subscribe((result: TagTransferDataReq) => {
            if (result) {
                //The dialog was closed as a OK!
                //Continue processing as expected:
                console.log(`Tag Id to transfer: ${result.tagId}`);
                console.log(`Cost to transfer: ${result.tagTransferCost}`);
                console.log(`New owner address: ${result.newOwnerAddress}`);
                //Launch event to create tag in ethereum network:
                //We will have to initialize also athe Ethereum network if not enabled yet:
                //this.ethStore.dispatch(new fromTagMainContract.CreateTag(result));
                //this.ethStore.dispatch(batchActions([new fromActionEth.InitEth(), new fromAction.CreateTagInt(result)]));
                //!! Humm not interesting! Don't just want to reduce! Need to really call an action and another that depends on the success of that one!
                /*
                const initEthereum$ = createEffect(() => this.ethActions$.pipe(
                    ofType(fromActionEth.ActionTypes.INIT_ETH_SUCCESS),
                    //take(1),
                    tap(() => {
                        console.log('SPECIAL EFFECT DIALOG: DETECTED INIT_ETH_SUCCESS');
                        this.ethStore.dispatch(new fromAction.CreateTagInt(result));
                    })
                    )
                , { dispatch: false});

                this.ethStore.dispatch(new fromActionEth.InitEth());
                 */
                //this.ethStore.dispatch(batchActions([new fromAction.StoreActionUntilEthInited(new fromAction.CreateTagInt(result)), new fromActionEth.InitEth()]));
                //this.ethStore.dispatch(new fromAction.StoreActionUntilEthInited(new fromAction.CreateTagInt(result)));
                //this.ethStore.dispatch(new fromActionEth.InitEth());
                //this.ethStore.dispatch(new fromAction.CreateTag(result));

                //Hide button for creation, as one creation is already in progress:
                //this._creationAvailable = false;
            }
        });
    }
}
