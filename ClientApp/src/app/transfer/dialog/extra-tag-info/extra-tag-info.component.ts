import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {Tag} from "../../../tags/tags.model";
import {Observable} from "rxjs";

@Component({
  selector: 'app-extra-tag-info',
  templateUrl: './extra-tag-info.component.html',
  styleUrls: ['./extra-tag-info.component.scss']
})
export class ExtraTagInfoComponent {

    constructor(public dialogRef: MatDialogRef<ExtraTagInfoComponent>,
                @Inject(MAT_DIALOG_DATA) public data: Observable<Tag>) {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
