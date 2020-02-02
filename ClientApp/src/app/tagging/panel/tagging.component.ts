import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TagTaggingData} from "../tag-tagging-data";

@Component({
    selector: 'app-tagging-panel',
    templateUrl: './tagging.component.html',
    styleUrls: ['./tagging.component.scss']
})
export class TaggingComponent {

    @Input() data: TagTaggingData;

    @Output() toTag: EventEmitter<TagTaggingData> = new EventEmitter();

    constructor() {
    }

    onTagging(): void {
        this.toTag.next(this.data);
    }
}
