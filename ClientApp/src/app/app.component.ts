/*
	@2019-2020 FC. All rights reserved.
*/
import {Component, NgZone} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatDialog, MatOptionSelectionChange} from "@angular/material";
import {combineLatest, Observable, of, ReplaySubject, Subject} from 'rxjs';
import {
    catchError,
    debounceTime,
    filter,
    first,
    map,
    startWith,
    switchMap,
    takeUntil,
    tap
} from 'rxjs/operators';
import {select, Store} from "@ngrx/store";
import * as fromEth from './ethereum';
import * as fromTagMainContract from './tagmaincontract';
import {UserNotif} from './tagmaincontract';
import {Tag} from "./tags/tags.model";
import {TagCreationDialogComponent} from "./creation/dialog/tag-creation-dialog.component";
import {TagCreationData} from "./creation/tag-creation-data";
import * as fromActionEth from "./ethereum/eth.actions";
import * as fromAction from "./tagmaincontract/tag-main-contract.actions"; /* Gives error in IDE, but works fine! */
import {Actions} from "@ngrx/effects";

import {ToastrService} from 'ngx-toastr';
import {TagContractService} from "./tagmaincontract/tagcontract/tag-contract.services";
import {TagTaggingData} from "./tagging/tag-tagging-data";

import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {ConnectionStatusComponent} from "./connection-status/connection-status.component";
import {MainContractListenerManagementService} from "./services/main-contract-listener-management.service";
import {AllTagsService} from "./tags/state/all-tags.service";
import {AllTagsQuery} from "./tags/state/all-tags.query";
import {TagRemoveTaggingData} from "./remove-tagging/tag-remove-tagging-data";
import {MainContractService} from "./tags/state/main-contract.service";
import {MainContractQuery} from "./tags/state/main-contract.query";
import {NotificationType} from "./notifications/notifications";
import {NotificationQuery} from "./notifications/state/notification.query";
import {NotificationService} from "./notifications/state/notification.service";
import {createNotification, UsrNotification} from "./notifications/state/notification.model";

import { filterNil } from '@datorama/akita';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  myControl = new FormControl();
  tagOptions: ReplaySubject<Tag[]>;
  filteredOptions: Observable<Tag[]>;
    private _terminateNameRetrieval: Subject<void>;

  constructor(private ethStore: Store<fromEth.AppState>,
              private taggedContractStore: Store<fromTagMainContract.AppState>,
              private _dialogService: MatDialog,
              private ethActions$: Actions<fromActionEth.EthActionsUnion>,
              //private _snackBar: MatSnackBar,
              private tagContractService: TagContractService,
              private mainContractEventManagementService: MainContractListenerManagementService,
              private allTagsService: AllTagsService,
              private allTagsQuery: AllTagsQuery,
              private mainContractService: MainContractService,
              private mainContractQuery: MainContractQuery,
              private notificationService: NotificationService,
              private notificationQuery: NotificationQuery,
              private _toastrService: ToastrService,
              private _ngZone: NgZone,
              private overlayService: Overlay) {
      this.tagOptions = new ReplaySubject(1);
      this._terminateNameRetrieval = new Subject();
  }

    static readonly debounceTimeCreationTagButton = 1000;

    private taggingCost$: Observable<string>;

    private taggingByCreatorCost$: Observable<string>;

    private tagCreationCost$: Observable<string>;

    private tagTransferCost$: Observable<string>;

    private tags: Tag[]; //Not Observable here, because we want the tags available at the moment, and not await for them or subscribe to them!

    private tags$: Observable<Tag[]>;

    private ownTags$: Observable<Tag[]>;

    private userNotifications$: Observable<UserNotif[]>;

    private notifications$: Observable<UsrNotification[]>;

    private _creationAvailable = false;

    private _taggingAvailable = false;

    private _removeTaggingAvailable = false;

    private _currentTagName: string = ""; //Used for Creation (not existing Tag yet!)

    private _currentTag: Tag = null; //Used for current selected already existing Tag

    private _userAddress = null;

    private _currentTaggingData: TagTaggingData = { addressToTag: null, taggingCost: null, tag: null, estimated: false };

    private _currentRemoveTaggingData: TagRemoveTaggingData = { currentUserAddress: null, addressToRemoveTag: null, tag: null };

    private _overlayConnectionStatusRef: OverlayRef = null;

    private _tagOrRemoveTagToggle: boolean;

    private _removeTagToggleAvailable: boolean;

    get tagOrRemoveTagToggle(): boolean {
        return this._tagOrRemoveTagToggle;
    }

    set tagOrRemoveTagToggle(value: boolean) {
        this._tagOrRemoveTagToggle = value;
    }

    get removeTagToggleAvailable(): boolean {
        return this._removeTagToggleAvailable;
    }

    set removeTagToggleAvailable(value: boolean) {
        this._removeTagToggleAvailable = value;
    }

    get creationAvailable() {
        return this._creationAvailable;
    }

    get taggingAvailable() {
        return this._taggingAvailable;
    }

    get removeTaggingAvailable() {
        return this._removeTaggingAvailable;
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

    get currentRemoveTaggingData() {
        return this._currentRemoveTaggingData;
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
                this.allTagsService.set(clonedTags);
                this.fillInTagName(clonedTags);
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
                    this.allTagsService.checkNewTag((parseInt(result.logs[0].args.tagId))/*createTag({})*/);
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
            .subscribe((userNotif: UserNotif) => {
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
                    if(userNotif.type === NotificationType.ERR) {
                        this._toastrService.error(userNotif.msg, undefined, defaultNotifConfig);
                    }
                    else if(userNotif.type === NotificationType.WARN) {
                        this._toastrService.warning(userNotif.msg, undefined, defaultNotifConfig);
                    }
                    else {
                        this._toastrService.info(userNotif.msg, undefined, defaultNotifConfig);
                    }
                }
            });

        //Try to get information from contract from Web3 provider it if exists:
        this.ethStore.dispatch(new fromEth.InitEthConsult());

        this.ethStore.dispatch(new fromEth.CheckStatusEth());

        this.ethStore
            .pipe(
                select(fromEth.getDefaultAccount)
            )
            .subscribe(activeAccount => {
                console.log('Active Account: ' + activeAccount);
                this._userAddress = activeAccount;
            });

        //Any change to all tags store:
        this.allTagsQuery.selectAll().subscribe(allTags => {
            console.debug('AllTags changed: ' + (allTags ? allTags.length : 0));
            this.tags = allTags;
        });

        //Keep track of own tags (in which the selected account at the moment is the creator address of the tags):
        this.ownTags$ = combineLatest(this.ethStore
            .pipe(
                select(fromEth.getDefaultAccount)
            ),
            this.allTagsQuery.selectAll()
        ).pipe(
            switchMap(([userAccount, allTags]) => {
                return this.allTagsQuery.getCreatorTags(userAccount);
            }),
            tap(allTags => console.log('********** OwnTags Changed: ' + (allTags ? allTags.length : allTags))),
            catchError(error => {
                console.error('Error detected in tracking own tags: ' + error);
                return of([]);
            })
        );

        //Keep observable
        this.tags$ = this.allTagsQuery.selectAll();

        //Active 200 ms after a change to the allTags store:
        this.allTagsQuery.selectAll().pipe(
            debounceTime(200) //Wait 200ms of no activity to update listeners
        ).subscribe(allTags => {
            console.debug('AllTags changed 200ms: ' + (allTags ? allTags.length : 0));
            this.trackGenericEventsOnTags();
        });

        //Update values related to name retrieval of Tags:
        this.allTagsQuery.selectAll().pipe(
            takeUntil(
                this._terminateNameRetrieval
            ),
            debounceTime(1000) //Wait one second of no activity to update options in Tag combo field
        ).subscribe(allTags => {
            console.debug('AllTags changed for Name Retrieval: ' + (allTags ? allTags.length : 0));
            //We gotten an updated tag name, update also the tagOptions, so observers can render new tag name value:
            this.tagOptions.next(allTags);
        });

        this.mainContractQuery.select("removeTaggingAddress").pipe(
            filterNil //Value must have something: Ignore Null/Undefined values
        ).subscribe(removeTaggingAddress => {
                const { data, result } = removeTaggingAddress;
                this.notificationService.add( createNotification({
                    type: NotificationType.INFO,
                    msg: `Removed tagging from address '${data.addressToRemoveTag}' with tag '${data.tag.name}'`
                }));

            });

        this.mainContractQuery.select("transferTagOwnership").pipe(
            filterNil //Value must have something: Ignore Null/Undefined values
        ).subscribe(transferTagOwnership => {
            const { data, result } = transferTagOwnership;
            this.notificationService.add( createNotification({
                type: NotificationType.INFO,
                msg: `Tag '${data.tag.name}' ownership transferred to address '${data.newOwnerAddress}'`
            }));

        });

        this.mainContractQuery.select("eventTagTransferOwnership").pipe(
            filterNil, //Value must have something: Ignore Null/Undefined values,
            filter(eventTagTransfer => fromEth.EthUtils.isEqualAddress(eventTagTransfer.newOwner, this._userAddress)),
        ).subscribe(eventTagTransfer => {
            const tag = this.allTagsQuery.getEntity(eventTagTransfer.tagId);
            //Notifications need to be added in the ngZone as they were received asynchronous from the Ethereum network:
            this._ngZone.run(() => {
                this.notificationService.add(createNotification({
                    type: NotificationType.INFO,
                    msg: `Tag '${tag ? tag.name : eventTagTransfer.tagId}' ownership transferred to you (Account '${eventTagTransfer.newOwner}')`
                }));
            });

        });

        //Check for any notifications (using Akita instead of NgRx):
        this.notificationQuery.selectLast()
            .subscribe(lastNotification => {
                if(lastNotification) {
                    const defaultNotifConfig = {
                        timeOut: 100000,
                        tapToDismiss: false,
                        positionClass: 'toast-bottom-full-width',
                        extendedTimeOut: 5000, //If the user hovers the notification, wait for more 5 seconds!
                        closeButton: true,
                    };
                    if(lastNotification.type === NotificationType.ERR) {
                        this._toastrService.error(lastNotification.msg, undefined, defaultNotifConfig);
                    }
                    else if(lastNotification.type === NotificationType.WARN) {
                        this._toastrService.warning(lastNotification.msg, undefined, defaultNotifConfig);
                    }
                    else {
                        console.debug('New notification INFO: ' + lastNotification.msg);
                        this._toastrService.info(lastNotification.msg, undefined, defaultNotifConfig);
                    }
                }
            });

        this.notifications$ = this.notificationQuery.selectAll();

        setTimeout(() => { //Wait for next rendering tick!
            this._showConnectionStatus()
        });
    }

    trackGenericEventsOnTags() {
        this.mainContractEventManagementService.trackEventsOnTags(this.tags);
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
        this._tagOrRemoveTagToggle = false; //Reset to show tagging first!
        this._removeTagToggleAvailable = false; //Reset to know if later we display this or not
        this.prepareTagging();
        this.prepareRemoveTagging();
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
        let counter = tagsMissingName.length;
        tagsMissingName.forEach(tag => {
            //Get name for each tag:
            this.tagContractService.getName(tag.contractAddress).subscribe(name => {
                console.log('Gotten tag name: ' + name);
                this.allTagsService.update(tag.tagId, {name: name});
                if(counter-- <= 0) {
                    console.debug('Gotten all tag names: Name retrieval terminated.');
                    if(!this._terminateNameRetrieval.closed) {
                        this._terminateNameRetrieval.complete();
                    }
                }
            });
        });
    }

    prepareTagging() {
        let estimation = false;
        if(this._currentTag) {
            let cost = this.taggingCost$;
            if(this._userAddress == null) {
                estimation = true;
            }
            else if(fromEth.EthUtils.isEqualAddress(this._currentTag.creatorAddress, this._userAddress)) {
                if(this._currentTag.ownerBalance > 0) {
                    //The owner still has balance, so it won't cost anything:
                    cost = of("0");
                }
                else {
                    cost = this.taggingByCreatorCost$;
                }
            }
            this.processValue(cost, (value) => this.gotoTagging(value, estimation)); //Had to create Fat Arrow here to create an extra function, just to keep the correct "this"!
        }
    }

    prepareRemoveTagging() {
        let estimation = false;
        if(this._currentTag && this._userAddress) {
            console.log(`Preparing removing of tagging of Tag "${this._currentTag.name}" for "0" Wei`);
            //Change reference so it triggers change detection:
            this._currentRemoveTaggingData = {
                tag: this._currentTag,
                addressToRemoveTag: '',
                currentUserAddress: this._userAddress
            };
            /*
            this._currentRemoveTaggingData.tag = this._currentTag;
            this._currentRemoveTaggingData.addressToRemoveTag = ''; //Clean address to tag field
            this._currentRemoveTaggingData.currentUserAddress = this._userAddress;
             */
            this._removeTaggingAvailable = true;
        }
    }

    gotoTagging(value: any, estimation: boolean) {
        if(this._currentTag) {
            console.log(`Preparing tagging of Tag "${this._currentTag.name}" for "${value}" Wei`);
            this._currentTaggingData.tag = this._currentTag;
            this._currentTaggingData.taggingCost = value;
            this._currentTaggingData.addressToTag = ''; //Clean address to tag field
            this._currentTaggingData.estimated = estimation;
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
            //Reclone Tag, so it doesn't become read-only!:
            let clonedTag = { ...this._currentTaggingData.tag };
            taggingData.tag = clonedTag;
            this.ethStore.dispatch(new fromAction.TaggingAddress(taggingData));

            //Hide button for tagging, as one tagging is already in progress:
            this._taggingAvailable = false;

            //Reset current tagging data:
            //this._currentTaggingData = { addressToTag: null, taggingCost: null, tag: null };

        }
    }

    private _showConnectionStatus() {
        if(this._overlayConnectionStatusRef && this._overlayConnectionStatusRef.hasAttached()) {
            this._overlayConnectionStatusRef.detach();
        }
        this._overlayConnectionStatusRef = this.overlayService.create({
            positionStrategy: this.overlayService.position().global().top().left(),
            hasBackdrop: false
        });
        this._overlayConnectionStatusRef.attach(new ComponentPortal(ConnectionStatusComponent));
    }

    onTaggingConnectWallet() {
        this.ethStore
            .pipe(
                select(fromEth.getDefaultAccount),
                filter(value => !!value), //Filter by only return with value
                first()
            )
            .subscribe(activeAccount => {
                //We have gotten information about the active account:
                console.log("onTaggingConnectWallet: " + activeAccount);
                //Reload information from current Tag:
                this.prepareTagging()
            });
        this.ethStore.dispatch(new fromEth.InitEth());
    }

    public trackTaggingInTag2() {
        this.mainContractEventManagementService.testListenerTagggingAddress();
        /*
        this.tagMainContractService.getSmartContract().subscribe(smartContract => {
            //const eventListener = smartContract.TaggedAddress({tagId: ["3"]});
            const eventListener = smartContract.TaggedAddress();
            eventListener
                .on('data', event => {
                    console.log("Have Data!");
                    console.log("This Data: " + event);
                    if(!event.blockNumber) {
                        console.log("Invalid BlockNumber -> Still pending on blockchain and not confirmed!");
                        return;
                    }
                    else {
                        //Do the code that needs to be done to process the event:
                        console.log(`Taggings must be updated for ${event.returnValues.tagId}.`);
                    }
                })
                .on('changed', event => {
                    console.log("Event was removed from blockchain: " + event);
                })
                .on('error', error => {
                    console.log("Error: " + error);
                });
            console.log('Put EventListener for Tag3: ' + eventListener);
        });
         */
    }

    onRemoveTagging() {
        console.log('onRemoveTagging!');
        if(this._currentRemoveTaggingData) {
            console.log(`Tag name to use for tagging: ${this._currentRemoveTaggingData.tag.name}`);
            console.log(`Address to remove tag: ${this._currentRemoveTaggingData.addressToRemoveTag}`);
            let removeTaggingData = { ...this._currentRemoveTaggingData }; //Clone current tagging data!
            //Reclone Tag, so it doesn't become read-only!:
            let clonedTag = { ...this._currentRemoveTaggingData.tag };
            removeTaggingData.tag = clonedTag;

            //Using Akita instead of NgRx:
            //this.ethStore.dispatch(new fromAction.RemoveTaggingAddress(removeTaggingData));
            this.mainContractService.removeTagging(removeTaggingData);

            //Hide button for tagging, as one tagging is already in progress:
            this._removeTaggingAvailable = false;

            //Reset current remove tagging data:
            //this._currentRemoveTaggingData = { addressToRemoveTag: null, tag: null };
        }

    }

    hasRemovableAddressesEvent(hasAddresses: boolean) {
        this._removeTagToggleAvailable = hasAddresses;
    }
}
