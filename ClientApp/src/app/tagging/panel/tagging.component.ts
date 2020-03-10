import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TagTaggingData} from "../tag-tagging-data";
import {MatSlideToggleChange} from "@angular/material";

@Component({
    selector: 'app-tagging-panel',
    templateUrl: './tagging.component.html',
    styleUrls: ['./tagging.component.scss']
})
export class TaggingComponent {

    @Input() data: TagTaggingData;

    private _tagToggleCheckValue: boolean;

    @Output() toTag: EventEmitter<TagTaggingData> = new EventEmitter();

    @Output() toConnectWallet: EventEmitter<void> = new EventEmitter();

    @Output() tagToggleCheckValueChange: EventEmitter<boolean> = new EventEmitter();

    @Input() hasRemoveTagToggleAvailable: boolean;

    constructor() {
        this._tagToggleCheckValue = false;
        this.hasRemoveTagToggleAvailable = false;
    }

    onTagging(): void {
        this.toTag.next(this.data);
    }

    connectWallet() {
        this.toConnectWallet.emit();
    }

    get tagToggleCheckValue(): boolean {
        return this._tagToggleCheckValue;
    }

    @Input()
    set tagToggleCheckValue(value : boolean) {
        this._tagToggleCheckValue = value;
        this.tagToggleCheckValueChange.emit(value);
    }

    changeRemoveTagToggle(event: MatSlideToggleChange) {
        this.tagToggleCheckValue = !this.tagToggleCheckValue;
    }

}
