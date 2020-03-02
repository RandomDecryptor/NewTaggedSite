import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TagRemoveTaggingData} from "../tag-remove-tagging-data";
import {FormControl} from "@angular/forms";
import {debounceTime, map, startWith, switchMap, tap} from "rxjs/operators";
import {Observable, ReplaySubject} from "rxjs";
import {Tag} from "../../tags/tags.model";
import {MainContractHighLevelService} from "../../services/main-contract-high-level.service";
import {MatOptionSelectionChange} from "@angular/material";

@Component({
    selector: 'app-remove-tagging-panel',
    templateUrl: './remove-tagging.component.html',
    styleUrls: ['./remove-tagging.component.scss']
})
export class RemoveTaggingComponent implements OnInit {
    myControl = new FormControl();
    addressOptions: ReplaySubject<string[]>;
    filteredAddresses: Observable<string[]>;

    private _data: TagRemoveTaggingData;

    @Output() toRemoveTag: EventEmitter<TagRemoveTaggingData> = new EventEmitter();

    static readonly debounceTimeRemoveTaggingButton = 1000;

    constructor(private contractHLService: MainContractHighLevelService) {
        this.addressOptions = new ReplaySubject(1);
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
            this.contractHLService.selectAllRemovedAddressesFromTag(this._data.currentUserAddress, this._data.tag.tagId).subscribe(removableAddresses => {
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
                tap(() => {
                    //this._creationAvailable = false;
                } ), //Disable creation button again until the debounce time passes and we have finally a new value to use!
                debounceTime(RemoveTaggingComponent.debounceTimeRemoveTaggingButton) //Wait 1 seconds to signal change in value
            ).subscribe(value => 1/*this._tagNameChanged(value)*/);

    }

    onRemoveTagging(): void {
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
    }
}
