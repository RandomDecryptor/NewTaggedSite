import {Component, ElementRef, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import {TagTransferData, TagTransferDataReq} from "../tag-transfer-data";
import {Tag} from "../../tags/tags.model";
import {ExtraTagInfoComponent} from "./extra-tag-info/extra-tag-info.component";
import {MainContractService} from "../../tags/state/main-contract.service";
import {Observable} from "rxjs";
import {AllTagsQuery} from "../../tags/state/all-tags.query";
import {first} from "rxjs/operators";

@Component({
    selector: 'app-tag-transfer-dialog',
    templateUrl: './tag-transfer-dialog.component.html',
    styleUrls: ['./tag-transfer-dialog.component.scss']
})
export class TagTransferDialogComponent {

    public _dataReq: TagTransferDataReq;

    public tag: Observable<Tag>;

    private _extraInfoDialog: MatDialogRef<ExtraTagInfoComponent, any>;

    constructor(public dialogRef: MatDialogRef<TagTransferDialogComponent>,
                private mainContractService: MainContractService,
                private allTagsQuery: AllTagsQuery,
                private _dialogService: MatDialog,
                private _elementRef: ElementRef,
                @Inject(MAT_DIALOG_DATA) public data: TagTransferData,
    ) {
        this._dataReq = {
            tagId : this.data.tag.tagId,
            tagTransferCost: data.tagTransferCost,
            newOwnerAddress: null
        };
        this.tag = allTagsQuery.selectEntity(this.data.tag.tagId);
        /*
        this.tag.subscribe(value => {
            console.debug('TAG VALUE: Name: ' + value.name + ' / Symbol: ' + value.symbol + ' / Contract Address: ' + value.contractAddress);
        });
         */
        this._extraInfoDialog = null;
        this.dialogRef.beforeClosed().subscribe(() => {
            if(this._extraInfoDialog) {
                this._extraInfoDialog.close();
                this._extraInfoDialog = null;
            }
        });
    }

    get dataReq(): TagTransferDataReq {
        return this._dataReq;
    }

    onNoClick(): void {
        if(this._extraInfoDialog) {
            this._extraInfoDialog.close();
            this._extraInfoDialog = null;
        }
        this.dialogRef.close();
    }

    onClickMoreInfo() {
        console.log('onClickMoreInfo');

        const rect = this._elementRef.nativeElement.getBoundingClientRect();
        //Call service to obtain extra information for tag if needed:
        this.mainContractService.retrieveFullInfoTag(this.data.tag.tagId);
        //Open dialog with extra information:
        // close old dialog if opened already:
        if(this._extraInfoDialog) {
            this._extraInfoDialog.close();
            this._extraInfoDialog = null;
        }
        else {
            this._extraInfoDialog = this._dialogService.open(ExtraTagInfoComponent, {
                hasBackdrop: false,

                position: { top: `${rect.top + 50}px`, left: `${rect.right + 5}px` },
                width: '440px',
                data: this.tag
            });
            this._extraInfoDialog.afterClosed().subscribe(() => {
                console.debug('TagTransferDialogComponent: MoreInfoDialog Closed!');
            });

            this._extraInfoDialog.backdropClick().subscribe(() => {
                this._extraInfoDialog.close();
                this._extraInfoDialog = null;
            });
        }
    }
}
