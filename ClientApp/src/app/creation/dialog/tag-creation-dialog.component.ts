import {Component, Inject, OnInit} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface TagCreationDialogData {
    tagCreationCost: number;
    tagName: string;
    symbolName: string;
}

@Component({
    selector: 'app-tag-creation-dialog',
    templateUrl: './tag-creation-dialog.component.html',
    styleUrls: ['./tag-creation-dialog.component.scss']
})
export class TagCreationDialogComponent {

    constructor(public dialogRef: MatDialogRef<TagCreationDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: TagCreationDialogData) {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
