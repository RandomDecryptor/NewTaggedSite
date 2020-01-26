import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {TagCreationData} from "../tag-creation-data";

@Component({
    selector: 'app-tag-creation-dialog',
    templateUrl: './tag-creation-dialog.component.html',
    styleUrls: ['./tag-creation-dialog.component.scss']
})
export class TagCreationDialogComponent {

    //private _data: TagCreationData;

    constructor(public dialogRef: MatDialogRef<TagCreationDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: TagCreationData) {
        /*
        this._data = data;
        if(this._data.tagName && this._data.tagName.length > 51) {
            this._data.tagName = this._data.tagName.substr(0, 51).trim();
        }
        if(this._data.symbolName && this._data.symbolName.length > 16) {
            this._data.symbolName = this._data.symbolName.substr(0, 16);
        }
        */
    }

    /*
    get data(): TagCreationData {
        return this._data;
    }
     */

    onNoClick(): void {
        this.dialogRef.close();
    }
}
