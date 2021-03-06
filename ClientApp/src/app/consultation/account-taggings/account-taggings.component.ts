import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, Inject, Input,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import {MatDialog, MatPaginator, MatTable, MatTableDataSource} from "@angular/material";
import {select, Store} from "@ngrx/store";
import * as fromTagMainContract from "../../tagmaincontract";
import {debounceTime, filter, takeUntil, withLatestFrom} from "rxjs/operators";
import {Observable, of, Subject} from "rxjs";
import {MainContractService} from "../../tags/state/main-contract.service";
import {MainContractQuery} from "../../tags/state/main-contract.query";
import * as fromEth from "../../ethereum";
import {filterNil} from "@datorama/akita";
import {AllTagsQuery} from "../../tags/state/all-tags.query";
import {Tag} from "../../tags/tags.model";
import {TaggingBalance} from "../../tags/ethereum/ethereum.main-contract.service";
import {StringUtils} from "../../helpers/string.utils";
import {ExternalUrlFilterByTokenAndTagged} from "../../services/tokens";
import {EthUtils} from "../../ethereum";

export interface Tagging {
    tagId: number;
    contractAddress: string;
    tagName: string;
    symbol: string;
    balance: number;
}

enum TaggingType {
    TAGGING,
    REMOVAL
}

@Component({
    selector: 'app-account-taggings',
    templateUrl: './account-taggings.component.html',
    styleUrls: ['./account-taggings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountTaggingsComponent implements OnInit, OnDestroy {

    columnsToDisplay = ['tagName', 'balance', 'symbol', 'actions'];

    static readonly DEBOUNCE_TIME_TAGGING_EVENT = 500;

    private _currentUserAccount: string;

    private _dataSource = new MatTableDataSource();

    @ViewChild(MatTable) table: MatTable<Tagging>;

    @ViewChild(MatPaginator) paginator: MatPaginator;

    private _taggings: Tagging[];

    private _terminate: Subject<void>;

    @Input() pageSize = 10;

    constructor(private taggedContractStore: Store<fromTagMainContract.AppState>, //NgRx
                private ethStore: Store<fromEth.AppState>,
                private mainContractService: MainContractService, //Akita
                private mainContractQuery: MainContractQuery,
                private allTagsQuery: AllTagsQuery,
                private _dialogService: MatDialog,
                @Inject(ExternalUrlFilterByTokenAndTagged) private urlFilterByTokenAndTagged: string,
                private cd: ChangeDetectorRef) {
        //this._taggings = [{ tagId: 0, tagName: 'test tag', balance: 100, contractAddress: '', symbol: 'TEST' }];
        this._taggings = [];
        this._dataSource.data = this._taggings;
        this._terminate = new Subject();

        this._currentUserAccount = null;
    }

    private _refreshTaggingsOnScreen() {
        console.debug('_refreshTaggingsOnScreen');
        this._dataSource.data = this._taggings;
        this._dataSource.paginator = this.paginator;
        this.cd.detectChanges();
    }

    ngOnInit() {

        this._dataSource.paginator = this.paginator;

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
                this.mainContractService.retrieveAllTaggingsToUserAddress(activeAccount).pipe(
                    takeUntil(this._terminate)
                ).subscribe((taggings: TaggingBalance) => {
                    Object.entries(taggings).forEach(([key, value]) => {
                        this._updateTaggings(parseInt(key), TaggingType.TAGGING, value);
                    });

                    this._refreshTaggingsOnScreen();
                });
            });

        //Taggings events:
        this.mainContractQuery.select(state => state.eventTaggedAddress).pipe(
            takeUntil(this._terminate),
        ).subscribe(taggingEvent => {
            if( taggingEvent
                && fromEth.EthUtils.isEqualAddress(taggingEvent.tagged, this._currentUserAccount) //We only want the Tagging events for which the "tagged" was the user itself.
            ) {
                console.log('Will need to add tagging \'' + taggingEvent.tagId + '\' by: ' + taggingEvent.tagger);
                this._updateTaggings(parseInt(taggingEvent.tagId), TaggingType.TAGGING);

                //this.cd.markForCheck(); //TODO: Maybe will need detectChanges and not just markForCheck!
            }
        });
        //Removal of tagging events:
        this.mainContractQuery.select(state => state.eventRemovedTaggingAddress).pipe(
            takeUntil(this._terminate),
        ).subscribe(removeTaggingEvent => {
            if(removeTaggingEvent
                && fromEth.EthUtils.isEqualAddress(removeTaggingEvent.tagged, this._currentUserAccount) //We only want the Tagging events for which the "tagged" was the user itself.
            ) {
                console.log('Will need to add removal of tagging \'' + removeTaggingEvent.tagId + '\' by: ' + removeTaggingEvent.tagger);
                this._updateTaggings(parseInt(removeTaggingEvent.tagId), TaggingType.REMOVAL);
            }
        });

    }

    get taggings(): Tagging[] {
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

    checkTagging($event: MouseEvent, tagging: Tagging) {
        console.log('Check Taggings in Ethereum network!');
        //let urlFilterByTokenAndTagger = 'https://ropsten.etherscan.io/token/{0}?a={1}';
        window.open(StringUtils.format(this.urlFilterByTokenAndTagged, tagging.contractAddress, this._currentUserAccount), '_blank', 'noopener');
    }

    private _updateTaggings(tagId: number, type: TaggingType, initialBalance: number = 1) {
        const index = this._taggings.findIndex(value => value.tagId === tagId);
        if(index < 0 && type === TaggingType.TAGGING) {
            //New tagging, that doesn't exists yet:
            const tag: Tag = this.allTagsQuery.getEntity(tagId);
            if(tag
                && tag.name && tag.symbol //Check for tag name and symbol too! If not present already delay adding until their retrieval
            ) {
                //We already have tag information:
                this._taggings.push({tagId: tagId, balance: initialBalance, tagName: tag.name, symbol: tag.symbol, contractAddress: tag.contractAddress });
                console.debug('>>>> Added taggings for ' + tagId);
                this._refreshTaggingsOnScreen();
            }
            else {
                console.debug('>>>> Will delay show taggings for ' + tagId);
                //Delay showing tagging while we wait for all the tags:
                const localObserver = new Subject();
                this.allTagsQuery.selectEntity(tagId).pipe(
                    takeUntil(this._terminate),
                    takeUntil(localObserver),
                    filter(tag => !!tag)
                ).subscribe(tag => {
                    console.debug('>>>> Waited for Tag to exist: ' + tag);
                    if(!tag.name) {
                        //No Tag Name: Start process to retrieve tag name:
                        this.mainContractService.retrieveNameTag(tagId);
                    }
                    if(!tag.symbol) {
                        //No Tag Name: Start process to retrieve tag symbol name:
                        this.mainContractService.retrieveSymbolTag(tagId);
                    }
                    else if(tag.name && tag.symbol) {
                        //We have the complete information, we can stop listening to changes to the tag:
                        localObserver.next();
                        localObserver.complete();
                        //Have complete info: Show information:
                        this._updateTaggings(tagId, TaggingType.TAGGING, initialBalance);
                        //this._taggings.push({tagId: tagId, balance: initialBalance, tagName: tag.name, symbol: tag.symbol, contractAddress: tag.contractAddress });
                        //this.cd.markForCheck();
                    }
                });
            }
        }
        else if(index >= 0) {
            //Already existed:
            if(type === TaggingType.TAGGING) {
                this._taggings[index].balance++;
            }
            else {
                //Decrease balance of the taggings of that tag:
                this._taggings[index].balance--;
                //Removal of tag, if balance reaches zero:
                if(this._taggings[index].balance <= 0) {
                    this._taggings.splice(index, 1);
                }
            }
            this._refreshTaggingsOnScreen();
        }
        else {
            console.error('>>>> ERROR: REMOVAL OF A TAG THAT WAS NOT FOUND!');
        }
    }
}
