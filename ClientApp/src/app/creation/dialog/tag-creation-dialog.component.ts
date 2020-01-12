import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {TagCreationData} from "../tag-creation-data";

@Component({
    selector: 'app-tag-creation-dialog',
    templateUrl: './tag-creation-dialog.component.html',
    styleUrls: ['./tag-creation-dialog.component.scss']
})
export class TagCreationDialogComponent {

    constructor(public dialogRef: MatDialogRef<TagCreationDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: TagCreationData) {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
