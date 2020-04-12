import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, EventEmitter,
    Input,
    OnDestroy,
    OnInit, Output,
    ViewChild
} from '@angular/core';
import {Tag} from "../../tags/tags.model";
import {MatTable, MatTableDataSource} from "@angular/material";
import {select, Store} from "@ngrx/store";
import * as fromTagMainContract from "../../tagmaincontract";
import {debounceTime, filter, takeUntil} from "rxjs/operators";
import {Observable, of, Subject} from "rxjs";
import {MainContractService} from "../../tags/state/main-contract.service";
import {TagContractService} from "../../tagmaincontract/tagcontract/tag-contract.services";

export interface TopTag extends Tag {
    paidTaggings: number;
}

@Component({
  selector: 'app-top-tags',
  templateUrl: './top-tags.component.html',
  styleUrls: ['./top-tags.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopTagsComponent implements OnInit, OnDestroy {

    columnsToDisplay = ['tagName', 'totalTaggings', 'ownTaggings'];

    static readonly DEBOUNCE_TIME_TAGGING_EVENT = 500;

    private _dataSource = new MatTableDataSource();

    @ViewChild(MatTable) table: MatTable<Tag>;

    private tagTransferCost: string;

    @Output() toSelectTag: EventEmitter<Tag> = new EventEmitter();

    private _numLinesTop: number;

    private _terminate: Subject<void>;

    private _tags: Observable<Tag[]>;

    private _freeCreatorTaggingsBN;

    constructor(private taggedContractStore: Store<fromTagMainContract.AppState>, //NgRx
                private mainContractService: MainContractService, //Akita
                private cd: ChangeDetectorRef) {
        this._numLinesTop = 10; //Start with top 10, by default!
        this._tags = of([]);
        this.tagTransferCost = null;
        this._terminate = new Subject();
        this._freeCreatorTaggingsBN = mainContractService.createBigNumber(TagContractService.FREE_CREATOR_TAGGINGS);
    }

    ngOnInit() {
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

    get numLinesTop(): number {
        return this._numLinesTop;
    }

    @Input()
    set numLinesTop(numLines: number) {
        this._numLinesTop = numLines;
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
                debounceTime(TopTagsComponent.DEBOUNCE_TIME_TAGGING_EVENT), //Wait 0.5 seconds to signal change in value
                takeUntil(this._terminate),
            ).subscribe(tags => {
                if(!this._terminate.isStopped) {
                    console.debug('Tags Set for Top Tags: ' + (tags ? tags.length: tags));
                    this._setTopTags(tags);
                }
                else {
                    console.debug('Set Tags: Top Tags already Terminated!');
                }
            });
        }
    }

    private _setTopTags(tags) {
        //We have to filter and order the top tags:
        this._dataSource.data = this._filterAndOrderTags(tags, this._numLinesTop);
        //To force refresh of data source
        this.cd.detectChanges();
    }

    calculateOwnTaggings(tag: Tag) {
        return this._freeCreatorTaggingsBN.sub(tag.ownerBalance);
    }

    private _calculatePaidTaggings(tag: Tag): number {
        return tag.totalTaggings.sub(this.calculateOwnTaggings(tag));
    }

    private _findPositionOrder(paidTaggings: number, topTags: TopTag[]): number {
        let res = -1;
        //Find the first record that has a lower value than the paidTagging of the current tag:
        res = topTags.map(value => value.paidTaggings)
            .findIndex(valuePaidTaggings => valuePaidTaggings < paidTaggings);
        return res;
    }

    private _filterAndOrderTags(tags: Tag[], numLinesTop: number): TopTag[] {
        const res: TopTag[] = [];
        //Insert each tag in the correct ordered position:
        tags.forEach((tag: Tag) => {
            let paidTaggings = this._calculatePaidTaggings(tag);
            const insertionPosition = this._findPositionOrder(paidTaggings, res);
            //Find any insertion position where a tag as a lower value of paid taggings:
            if(insertionPosition >= 0) {
                //Valid position to insert: Insert in the correct ordered position:
                const topTag: TopTag =  { ...tag, paidTaggings: paidTaggings };
                res.splice(insertionPosition, 0, topTag);
            }
            //No position found: But check if we still have space to put one more tag:
            else if(res.length < numLinesTop) {
                const topTag: TopTag =  { ...tag, paidTaggings: paidTaggings };
                res.push(topTag);
            }
        });
        //return res.slice(0, numLinesTop);
        return res;
    }

    get tags() {
        return this._tags;
    }

    get dataSource() {
        return this._dataSource;
    }

    ngOnDestroy(): void {
        console.debug('Terminate Top-Tags-Component');
        this._terminate.next();
        this._terminate.complete();
    }

    selectTag(tag: Tag) {
        console.debug('selectTag: ' + tag.tagId);
        this.toSelectTag.next(tag);
    }

}
