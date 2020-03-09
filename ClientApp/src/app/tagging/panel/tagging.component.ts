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

    @Input() tagToggleCheckValue: boolean;

    @Output() toTag: EventEmitter<TagTaggingData> = new EventEmitter();

    @Output() toConnectWallet: EventEmitter<void> = new EventEmitter();

    @Output() taggingToggleFired: EventEmitter<boolean> = new EventEmitter();

    @Input() hasRemoveTagToggleAvailable: boolean;

    constructor() {
        this.tagToggleCheckValue = false;
        this.hasRemoveTagToggleAvailable = false;
    }

    onTagging(): void {
        this.toTag.next(this.data);
    }

    connectWallet() {
        this.toConnectWallet.emit();
    }

    changeRemoveTagToggle(event: MatSlideToggleChange) {
        this.tagToggleCheckValue = !this.tagToggleCheckValue;
        this.taggingToggleFired.emit(this.tagToggleCheckValue);
    }

}
