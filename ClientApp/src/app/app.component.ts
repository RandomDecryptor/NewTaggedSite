/*
	@2019 FC. All rights reserved.
*/
import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatDialog, MatOptionSelectionChange} from "@angular/material";
import {Observable, of, ReplaySubject} from 'rxjs';
import {debounceTime, first, map, startWith, switchMap, tap} from 'rxjs/operators';
import {select, Store} from "@ngrx/store";
import * as fromEth from './ethereum';
import * as fromTagMainContract from './tagmaincontract';
import {Tag} from "./tags/tags.model";
import {TagCreationDialogComponent} from "./creation/dialog/tag-creation-dialog.component";
import {TagCreationData} from "./creation/tag-creation-data";
import * as fromActionEth from "./ethereum/eth.actions";
import * as fromAction from "./tagmaincontract/tag-main-contract.actions"; /* Gives error in IDE, but works fine! */
import {Actions} from "@ngrx/effects";

import {ToastrService} from 'ngx-toastr';
import {TagContractService} from "./tagmaincontract/tagcontract/tag-contract.services";
import {TagTaggingData} from "./tagging/tag-tagging-data";
import {NotificationType} from "./tagmaincontract";
import {create} from "domain";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  myControl = new FormControl();
  tagOptions: ReplaySubject<Tag[]>;
  filteredOptions: Observable<Tag[]>;

  constructor(private ethStore: Store<fromEth.AppState>,
              private taggedContractStore: Store<fromTagMainContract.AppState>,
              private _dialogService: MatDialog,
              private ethActions$: Actions<fromActionEth.EthActionsUnion>,
              //private _snackBar: MatSnackBar,
              private tagContractService: TagContractService,
              private _toastrService: ToastrService) {
      this.tagOptions = new ReplaySubject(1);
  }

    static readonly debounceTimeCreationTagButton = 1000;

    private taggingCost$: Observable<string>;

    private taggingByCreatorCost$: Observable<string>;

    private tagCreationCost$: Observable<string>;

    private tagTransferCost$: Observable<string>;

    private tags: Tag[]; //Not Observable here, because we want the tags available at the moment, and not await for them or subscribe to them!

    private userNotifications$: Observable<fromTagMainContract.UserNotif[]>;

    private _creationAvailable = false;

    private _taggingAvailable = false;

    private _currentTagName: string = ""; //Used for Creation (not existing Tag yet!)

    private _currentTag: Tag = null; //Used for current selected already existing Tag

    private _userAddress = null;

    private _currentTaggingData: TagTaggingData = { addressToTag: null, taggingCost: null, tag: null };

    get creationAvailable() {
        return this._creationAvailable;
    }

    get taggingAvailable() {
        return this._taggingAvailable;
    }

    get currentTagName() {
        return this._currentTagName;
    }

    get currentTag() {
        return this._currentTag;
    }

    get currentTaggingData() {
        return this._currentTaggingData;
    }

    ngOnInit() {
        this.filteredOptions = this.myControl.valueChanges
            .pipe(
                startWith(''),
                map(value => typeof value === 'string' ? value : value.name), //When we set the value as an object/array and not a string it was also coming through here, and in that case we have to filter by the name/value[0] and not the all value.
                //map(value => this._filter(value))
                switchMap(value => this._filter(value))
            );

        this.myControl.valueChanges
            .pipe(
                startWith(''),
                //TODO: Try filter by just string!
                tap(value => {
                    if(typeof value === 'string') {
                        //Manual change to the value of tag name, disable tagging, user must select Tag in combobox to enable it:
                        this._taggingAvailable = false;
                    }
                }),
                map(value => typeof value === 'string' ? value : value[0]), //When we set the value as an object/array and not a string it was also coming through here, and in that case we have to filter by the name/value[0] and not the all value.
                tap(() => {
                    this._creationAvailable = false;
                } ), //Disable creation button again until the debounce time passes and we have finally a new value to use!
                debounceTime(AppComponent.debounceTimeCreationTagButton) //Wait 1 seconds to signal change in value
            ).subscribe(value => this._tagNameChanged(value));

        //Init getting selectors from store:
        this.taggingCost$ = this.taggedContractStore.pipe(select(fromTagMainContract.getTaggingCost));
        this.taggingByCreatorCost$ = this.taggedContractStore.pipe(select(fromTagMainContract.getTaggingByCreatorCost));
        this.tagCreationCost$ = this.taggedContractStore.pipe(
                                    select(fromTagMainContract.getTagCreationCost),
                                    //shareReplay(1) //Not needed for now! The select() keeps the value (probably does a shareReplay until the value is changed!)
                                    );
        this.tagTransferCost$ = this.taggedContractStore.pipe(select(fromTagMainContract.getTagTransferCost));

        this.userNotifications$ = this.taggedContractStore.pipe(select(fromTagMainContract.getUserNotifications));

        this.taggedContractStore
            .pipe(
                select(fromTagMainContract.getTaggingCost)
            )
            .subscribe(taggingCost => {
                console.log('Tagging Cost: ' + taggingCost)
            });

        this.taggedContractStore
            .pipe(
                select(fromTagMainContract.getAllTags)
            )
            .subscribe(tags => {
                console.log('Tags: ' + tags);
                //Will keep field tags always updated with the latest version of the already created tags:
                const clonedTags: Tag[] = tags.map((tag: Tag) => {
                    return {    contractAddress: tag.contractAddress, creatorAddress: tag.creatorAddress, ownerBalance: tag.ownerBalance,
                                totalTaggings: tag.totalTaggings, tagIndex: tag.tagIndex, tagId: tag.tagId, name: null, symbol: null };
                });
                this.tags = clonedTags;
                this.fillInTagName(this.tags);
            });

        /**
         * Waiting for Responses from Contract Interaction
         */

        this.taggedContractStore
            .pipe(
                select(fromTagMainContract.getCreatedTag)
            )
            .subscribe(createdTagPayload => {
                if(createdTagPayload) {
                    const {creationAddressData, result } = { creationAddressData: createdTagPayload.data, result: createdTagPayload.result};
                    console.log(`Created Tag '${creationAddressData.tagName}' in transaction '${result.tx}'` );
                    this.taggedContractStore.dispatch(new fromAction.NotifyUser({
                        type: NotificationType.INFO,
                        msg: `Created Tag: ${creationAddressData.tagName}`
                    }));
                }
            });

        this.taggedContractStore
            .pipe(
                select(fromTagMainContract.getTaggedAddress)
            )
            .subscribe(taggedAddressPayload => {
                if(taggedAddressPayload) {
                    const {taggedAddressData, result } = { taggedAddressData: taggedAddressPayload.data, result: taggedAddressPayload.result};
                    console.log(`Tagged Address '${taggedAddressData.addressToTag}' in transaction '${result.tx}'`);
                    this.taggedContractStore.dispatch(new fromAction.NotifyUser({
                        type: NotificationType.INFO,
                        msg: `Tagged address '${taggedAddressData.addressToTag}' with tag '${taggedAddressData.tag.name}'`
                    }));
                    //ALTERATIVE: Could also have caught the events sent by the Ethereum network like method createListenerTagggingAddress() in old "Main.js"
                }
            });

        this.taggedContractStore
            .pipe(
                select(fromTagMainContract.getLastUserNotification)
            )
            .subscribe((userNotif: fromTagMainContract.UserNotif) => {
                if(userNotif) { //Check if we have any notification to show!
                    //console.log(`Last User Notif: ${userNotif.uid} - ${userNotif.type} - ${userNotif.msg}`);
                    //Will keep field tags always updated with the latest version of the already created tags:
                    /*
                    this._snackBar.open(userNotif.msg, "Dismiss", {
                        duration: 10000 , // 10 seconds
                        panelClass: this._retrievePanelClassSnackBar(userNotif.type)
                    });
                    */
                    const defaultNotifConfig = {
                        timeOut: 100000,
                        tapToDismiss: false,
                        positionClass: 'toast-bottom-full-width',
                        extendedTimeOut: 5000, //If the user hovers the notification, wait for more 5 seconds!
                        closeButton: true,
                    };
                    if(userNotif.type === fromTagMainContract.NotificationType.ERR) {
                        this._toastrService.error(userNotif.msg, undefined, defaultNotifConfig);
                    }
                    else if(userNotif.type === fromTagMainContract.NotificationType.WARN) {
                        this._toastrService.warning(userNotif.msg, undefined, defaultNotifConfig);
                    }
                    else {
                        this._toastrService.info(userNotif.msg, undefined, defaultNotifConfig);
                    }
                }
            });

        //Try to get information from contract from Web3 provider it if exists:
        this.ethStore.dispatch(new fromEth.InitEthConsult());

        this.ethStore
            .pipe(
                select(fromEth.getDefaultAccount)
            )
            .subscribe(activeAccount => {
                console.log('Active Account: ' + activeAccount);
                this._userAddress = activeAccount;
            });
    }

  private _filter(value: string): Observable<Tag[]> {
    console.log('Value Filter: "' + value + '"');
    //Get Value:
    const filterValue: string = value.toLowerCase();

    return this.tagOptions.pipe(
      map(
          options => options.filter(tag => (!tag.name && filterValue.length === 0) || (tag.name && tag.name.toLowerCase().includes(filterValue)))
      )
    );
  }

  private _tagNameChanged(value: string) {
        //TODO: Remove or don't allow special characters for the tag Name! The Best is block them right at the start! Maybe not allow writing of these characters at the keyup/keydown!
        console.log('_Tag Name Changed: ' + value);

        //TODO: WAS HERE!!!!!!!!!!!!!***************
      //... Detect change in tag, and check if it is an existing one or a new one!
      //New tag, prepare for Creation
      //Existing one, prepare for tagging (or removal currentTagNameif from the user address)
        let tagFound = this.tags.find(tag => tag.name == value);
        if(tagFound) {
            //Tag Found, prepare for tagging or removal:
            console.log(`Tag Found: ${tagFound}`);
            this._creationAvailable = false;
            //TODO
            //...
        }
        else {
            //Tag not found: prepare for creation of new Tag:
            console.log(`NO TAG Found in known tags: ${tagFound}. Prepare creation!`);
            if(value && value.length > 0 && value.trim().length > 0) {
                console.log('Has New Value. Really Prepare creation!');
                this._creationAvailable = true;
            }
            else {
                console.log('No New Value. No creation!');
                this._creationAvailable = false;
            }
        }
      this._currentTagName = value;
  }

    /**
     * Method to apply function to first element of observable (from a Select operator on a Store).
     * As this Observable is returned from the Select operator on a NgRx Store, the value there is frozen, so we just want to get the value
     * there, should be the first and only value, and call the function to do our processing on that value (current value on the store).
     */
    processValue(obs: Observable<any>, funcValueProc: (value: any) => void) {
        return obs.pipe(
            first() //Will only the see the value that is currently there! Don't want to subscribe forever!
        ).subscribe(value => funcValueProc(value));
    }

    onCreateNewTag() {
        //this.processValue(this.tagCreationCost$, this.openPopupCreation); //Was losing the "this" as expected!
        this.processValue(this.tagCreationCost$, (value) => this.openPopupCreation(value)); //Had to create Fat Arrow here to create an extra function, just to keep the correct "this"!
    }

    openPopupCreation(value: any) {
        if(this._currentTagName) {
            if(this._currentTagName.length > 51) {
                this._currentTagName = this._currentTagName.substr(0, 51);
            }
            this._currentTagName = this._currentTagName.trim();
            let symbolName = this._currentTagName;
            if(symbolName && symbolName.length > 16) {
                symbolName = symbolName.substr(0, 16);
            }
            symbolName = symbolName.trim();

            let dialogRef = this._dialogService.open(TagCreationDialogComponent, {
                data: {
                    tagName: this._currentTagName,
                    symbolName: symbolName,
                    tagCreationCost: value
                }
            });
            dialogRef.afterClosed().subscribe((result: TagCreationData) => {
                if (result) {
                    //The dialog was closed as a OK!
                    //Continue processing as expected:
                    console.log(`Tag name to create: ${result.tagName}`);
                    console.log(`Symbol name to create: ${result.symbolName}`);
                    console.log(`Cost to create: ${result.tagCreationCost}`);
                    //Launch event to create tag in ethereum network:
                    //We will have to initialize also athe Ethereum network if not enabled yet:
                    //this.ethStore.dispatch(new fromTagMainContract.CreateTag(result));
                    //this.ethStore.dispatch(batchActions([new fromActionEth.InitEth(), new fromAction.CreateTagInt(result)]));
                    //!! Humm not interesting! Don't just want to reduce! Need to really call an action and another that depends on the success of that one!
                    /*
                    const initEthereum$ = createEffect(() => this.ethActions$.pipe(
                        ofType(fromActionEth.ActionTypes.INIT_ETH_SUCCESS),
                        //take(1),
                        tap(() => {
                            console.log('SPECIAL EFFECT DIALOG: DETECTED INIT_ETH_SUCCESS');
                            this.ethStore.dispatch(new fromAction.CreateTagInt(result));
                        })
                        )
                    , { dispatch: false});

                    this.ethStore.dispatch(new fromActionEth.InitEth());
                     */
                    //this.ethStore.dispatch(batchActions([new fromAction.StoreActionUntilEthInited(new fromAction.CreateTagInt(result)), new fromActionEth.InitEth()]));
                    //this.ethStore.dispatch(new fromAction.StoreActionUntilEthInited(new fromAction.CreateTagInt(result)));
                    //this.ethStore.dispatch(new fromActionEth.InitEth());
                    this.ethStore.dispatch(new fromAction.CreateTag(result));

                    //Hide button for creation, as one creation is already in progress:
                    this._creationAvailable = false;
                }
            });
        }
    }

    testObservers() {
        /*
        of(2).pipe(
            startWith(1)
        ).subscribe((value) => console.log('Value: ' + value));
         */
        //merge(of(1), of(2)).subscribe((value) => console.log('Value: ' + value));

    }

  connectEthereum() {
    console.log('Button pressed');
    //FIXME: Force Initialization of Ethereum Connector (Try to do it with router or something else, or even by the user clicking a button like in HEX token web site):
    this.ethStore.dispatch(new fromEth.InitEth());
  }

    connectEthereumConsult() {
        console.log('Button pressed Ethereum Consult');
        //FIXME: Force Initialization of Ethereum Connector (Try to do it with router or something else, or even by the user clicking a button like in HEX token web site):
        this.ethStore.dispatch(new fromEth.InitEthConsult());
    }

    connectTagMainContract() {
        console.log('Button pressed Tag Main Contract');
        this.ethStore.dispatch(new fromTagMainContract.GetTaggingCost());
    }

  displayFn(option?: Tag): string | undefined {
    return option ? option.name : undefined;
  }

  selectionChanged($event: MatOptionSelectionChange, optionSelected: Tag) {
    if($event.source.selected) {
        console.log('Options Selected: ' + optionSelected.name);
        //An already existing tag was selected:
        this._currentTag = optionSelected;
        this.prepareTagging();
    }
    else {
        console.log('Options Deselected: ' + optionSelected ? optionSelected.name : 'No Name');
        //this._taggingAvailable = false;
        //this._currentTag = null;
    }
  }

  fieldCleared() {
    console.log('Field was cleared no option selected now!!');
  }

  autocompletedEventDetected($event) {
    console.log('Field was AutoCompleted!!');
  }

  changeDetected($event) {
    console.log('Field was Changed!!');
  }

    private fillInTagName(tags: Tag[]) {
        const tagsMissingName = tags.filter(value => !value.name);
        tagsMissingName.forEach(tag => {
            //Get name for each tag:
            this.tagContractService.getName(tag.contractAddress).subscribe(name => {
                console.log('Gotten tag name: ' + name);
                tag.name = name;
                //We gotten an updated tag name, update also the tagOptions, so observers can render new tag name value:
                this.tagOptions.next(this.tags);
            });
        });
    }

    prepareTagging() {
        if(this._currentTag) {
            let cost = this.taggingCost$;
            if(this._currentTag.creatorAddress === this._userAddress) {
                cost = this.taggingByCreatorCost$;
            }
            this.processValue(cost, (value) => this.gotoTagging(value)); //Had to create Fat Arrow here to create an extra function, just to keep the correct "this"!

        }
    }

    gotoTagging(value: any) {
        if(this._currentTag) {
            console.log(`Preparing tagging of Tag "${this._currentTag.name}" for "${value}" Wei`);
            this._currentTaggingData.tag = this._currentTag;
            this._currentTaggingData.taggingCost = value;
            this._currentTaggingData.addressToTag = ''; //Clean address to tag field
            this._taggingAvailable = true;
        }
    }

    onTagging() {
        if(this._currentTaggingData) {
            console.log(`Tag name to use for tagging: ${this._currentTaggingData.tag.name}`);
            console.log(`Address to tag: ${this._currentTaggingData.addressToTag}`);
            //TODO: Recheck tagging cost according to user, and check if he is logged on to his wallet or not! If yes, we can lower the amount if user is indeed the creator of the tag!
            console.log(`Cost for tagging: ${this._currentTaggingData.taggingCost}`);
            let taggingData = { ...this._currentTaggingData }; //Clone current tagging data!
            this.ethStore.dispatch(new fromAction.TaggingAddress(taggingData));

            //Hide button for creation, as one creation is already in progress:
            this._taggingAvailable = false;

            //Reset current tagging data:
            //this._currentTaggingData = { addressToTag: null, taggingCost: null, tag: null };

        }
    }

}
