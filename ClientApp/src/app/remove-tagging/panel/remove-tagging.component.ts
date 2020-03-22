import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {TagRemoveTaggingData} from "../tag-remove-tagging-data";
import {FormControl} from "@angular/forms";
import {debounceTime, filter, map, startWith, switchMap, takeUntil, tap, withLatestFrom} from "rxjs/operators";
import {BehaviorSubject, Observable, Subject, Subscription} from "rxjs";
import {MatOptionSelectionChange, MatSlideToggleChange} from "@angular/material";
import {MainContractService} from "../../tags/state/main-contract.service";
import {MainContractQuery} from "../../tags/state/main-contract.query";
import * as fromEth from "../../ethereum";
import {select, Store} from "@ngrx/store";

@Component({
    selector: 'app-remove-tagging-panel',
    templateUrl: './remove-tagging.component.html',
    styleUrls: ['./remove-tagging.component.scss']
})
export class RemoveTaggingComponent implements OnInit, OnDestroy {
    myControl = new FormControl();
    addressOptions: BehaviorSubject<string[]>;
    filteredAddresses: Observable<string[]>;

    private _data: TagRemoveTaggingData;

    private _tagToggleCheckValue: boolean;

    private _currentAddressToRemove: string;

    private _currentUserAccount: string;

    private _oldTagId: number;

    private _taggingEventsSubscriptions: Subscription;

    @Output() toRemoveTag: EventEmitter<TagRemoveTaggingData> = new EventEmitter();

    @Output() tagToggleCheckValueChange: EventEmitter<boolean> = new EventEmitter();

    @Output() hasRemovableAddresses: EventEmitter<boolean> = new EventEmitter();

    private _terminateComp: Subject<void>;

    static readonly debounceTimeRemoveTaggingButton = 500;

    constructor(
        private ethStore: Store<fromEth.AppState>,
        private newMainContractService: MainContractService,
        private mainContractQuery: MainContractQuery) {

        this.addressOptions = new BehaviorSubject([]);
        this._oldTagId = null;
        this._taggingEventsSubscriptions = null;
        this.tagToggleCheckValue = true;
        this._terminateComp = new Subject();
        this._currentUserAccount = null;
    }

    get currentAddressToRemove(): string {
        return this._currentAddressToRemove;
    }

    get data(): TagRemoveTaggingData {
        return this._data;
    }

    @Input()
    set data(value: TagRemoveTaggingData) {
        this._data = value;
        if(this._data) {
            if(this._taggingEventsSubscriptions && this._data.tag.tagId !== this._oldTagId) {
                //Release previous subscribed
                this._taggingEventsSubscriptions.unsubscribe();
                this._oldTagId = this._data.tag.tagId;
                //Clean old values, while we retrieve the new values later:
                this.addressOptions.next([]);
            }
            this._taggingEventsSubscriptions = this.newMainContractService.selectAllRemovedAddressesFromTag(this._data.currentUserAddress, this._data.tag.tagId).subscribe(removableAddresses => {
                this.addressOptions.next(removableAddresses);
            });
        }
    }

    ngOnInit(): void {
        this.filteredAddresses = this.myControl.valueChanges
            .pipe(
                takeUntil(this._terminateComp),
                startWith(''),
                map(value => typeof value === 'string' ? value : value.name), //When we set the value as an object/array and not a string it was also coming through here, and in that case we have to filter by the name/value[0] and not the all value.
                //map(value => this._filter(value))
                switchMap(value => this._filter(value))
            );

        this.myControl.valueChanges
            .pipe(
                takeUntil(this._terminateComp),
                startWith(''),
                tap(value => {
                    if(typeof value === 'string') {
                        //Manual change to the value of tag name, disable tagging, user must select Tag in combobox to enable it:
                        //this._taggingAvailable = false;
                    }
                }),
                map(value => typeof value === 'string' ? value : value[0]), //When we set the value as an object/array and not a string it was also coming through here, and in that case we have to filter by the name/value[0] and not the all value.
                tap(value => {
                    if(value !== this._currentAddressToRemove) {
                        //Value was changed: Reset current address to remove:
                        this._currentAddressToRemove = null;
                    }
                } ), //Disable creation button again until the debounce time passes and we have finally a new value to use!
                debounceTime(RemoveTaggingComponent.debounceTimeRemoveTaggingButton) //Wait 0.5 seconds to signal change in value
            ).subscribe(value => 1/*this._tagNameChanged(value)*/);

        this.ethStore
            .pipe(
                select(fromEth.getDefaultAccount),
                filter(account => !!account) //Account not null!
            ).subscribe(activeAccount => {
                this._currentUserAccount = activeAccount;
            });


        //Control Taggings and Removal of Taggings:
        //Taggings events:
        this.mainContractQuery.select(state => state.eventTaggedAddress).pipe(
            takeUntil(this._terminateComp),
            withLatestFrom(this.addressOptions)
        ).subscribe(([taggingEvent, currentAddressOptions]) => {
            if( taggingEvent && currentAddressOptions
                && fromEth.EthUtils.isEqualAddress(taggingEvent.tagger, this._currentUserAccount) //We only want the Tagging events for which the "tagger" was the user itself.
            ) {
                console.log('Will need to add tagging of: ' + taggingEvent.tagged);
                currentAddressOptions.push(taggingEvent.tagged);
                this.addressOptions.next(currentAddressOptions);
            }
        });
        //Removal of tagging events:
        this.mainContractQuery.select(state => state.eventRemovedTaggingAddress).pipe(
            takeUntil(this._terminateComp),
            withLatestFrom(this.addressOptions)
        ).subscribe(([removeTaggingEvent, currentAddressOptions]) => {
            if(removeTaggingEvent && currentAddressOptions) {
                console.log('Will need to add removal of tagging: ' + removeTaggingEvent.tagged);
                this.addressOptions.next(currentAddressOptions.filter(value => value !== removeTaggingEvent.tagged));
            }
        });

        this.addressOptions.pipe(
            takeUntil(this._terminateComp),
            filter(value => !!value) //Filter null values
        ).subscribe(addresses => {
            let hasValues = false;
            if(addresses.length > 0) {
                hasValues = true;
            }
            this.hasRemovableAddresses.emit(hasValues);
        })
    }

    ngOnDestroy(): void {
        this._terminateComp.next();
        this._terminateComp.unsubscribe();
    }

    onRemoveTagging(): void {
        //Update address to remove tag:
        this.data.addressToRemoveTag = this._currentAddressToRemove;
        //signal a new address to remove a tag from:
        this.toRemoveTag.next(this.data);
    }

    displayFn(option?: string): string {
        return option ? option : "";
    }

    private _filter(value: string): Observable<string[]> {
        console.log('RemoveTaggingComponent: Value Filter: "' + value + '"');
        //Get Value:
        const filterValue: string = value.toLowerCase();

        return this.addressOptions.pipe(
            map(
                options => options.filter(address => (!address && filterValue.length === 0) || (address && address.toLowerCase().includes(filterValue)))
            )
        );
    }

    selectionChanged($event: MatOptionSelectionChange, option: string) {
        console.log('RemoveTagging: selectionChanged: TODO');
        if($event.source.selected) {
            console.log('Options Selected: ' + option);
            //Address to remove:
            this._currentAddressToRemove = option;
            //this.prepareRemoveTagging();
        }
        else {
            console.log('Options Deselected: ' + option);
            //this._currentAddressToRemove = null;
        }

    }

    get tagToggleCheckValue(): boolean {
        return this._tagToggleCheckValue;
    }

    @Input()
    set tagToggleCheckValue(value : boolean) {
        this._tagToggleCheckValue = value;
        this.tagToggleCheckValueChange.emit(value);
    }

    changeTagToggle(event: MatSlideToggleChange) {
        this.tagToggleCheckValue = !this.tagToggleCheckValue;
    }

}
