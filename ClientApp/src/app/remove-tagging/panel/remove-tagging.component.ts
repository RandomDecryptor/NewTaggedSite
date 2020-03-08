import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TagRemoveTaggingData} from "../tag-remove-tagging-data";
import {FormControl} from "@angular/forms";
import {debounceTime, map, startWith, switchMap, tap} from "rxjs/operators";
import {BehaviorSubject, Observable, ReplaySubject} from "rxjs";
import {MatOptionSelectionChange} from "@angular/material";
import {MainContractService} from "../../tags/state/main-contract.service";

@Component({
    selector: 'app-remove-tagging-panel',
    templateUrl: './remove-tagging.component.html',
    styleUrls: ['./remove-tagging.component.scss']
})
export class RemoveTaggingComponent implements OnInit {
    myControl = new FormControl();
    addressOptions: BehaviorSubject<string[]>;
    filteredAddresses: Observable<string[]>;

    private _data: TagRemoveTaggingData;

    private _currentAddressToRemove: string;

    @Output() toRemoveTag: EventEmitter<TagRemoveTaggingData> = new EventEmitter();

    static readonly debounceTimeRemoveTaggingButton = 500;

    constructor(private newMainContractService: MainContractService) {
        this.addressOptions = new BehaviorSubject([]);
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
            //TODO:
            //...
            this.newMainContractService.selectAllRemovedAddressesFromTag(this._data.currentUserAddress, this._data.tag.tagId).subscribe(removableAddresses => {
                this.addressOptions.next(removableAddresses);
            });
        }
    }

    ngOnInit(): void {
        this.filteredAddresses = this.myControl.valueChanges
            .pipe(
                startWith(''),
                map(value => typeof value === 'string' ? value : value.name), //When we set the value as an object/array and not a string it was also coming through here, and in that case we have to filter by the name/value[0] and not the all value.
                //map(value => this._filter(value))
                switchMap(value => this._filter(value))
            );

        this.myControl.valueChanges
            .pipe(
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

}
