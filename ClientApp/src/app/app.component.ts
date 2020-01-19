/*
	@2019 FC. All rights reserved.
*/
import { Component } from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatDialog, MatOptionSelectionChange} from "@angular/material";
import {Observable, of} from 'rxjs';
import {debounceTime, filter, first, map, shareReplay, startWith, switchMap, take, tap} from 'rxjs/operators';
import {Store, select} from "@ngrx/store";
import * as fromEth from '../app/ethereum';
import * as fromTagMainContract from './tagmaincontract';
import {Tag} from "./tags/tags.model";
import {TagCreationDialogComponent} from "./creation/dialog/tag-creation-dialog.component";
import {TagCreationData} from "./creation/tag-creation-data";
import {batchActions} from "./helpers/batch-actions.helper";
import * as fromActionEth from "./ethereum/eth.actions";
import * as fromAction from "./tagmaincontract/tag-main-contract.actions"; /* Gives error in IDE, but works fine! */
import {Actions, createEffect, ofType} from "@ngrx/effects";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  myControl = new FormControl();
  options: Observable<string[][]> = of([['One', '1'], ['Two', '2'], ['Three', '3']
    ,['Four', '4'], ['Five', '5'], ['Six', '6']
    ,['Seven', '7'], ['Eight', '8'], ['Nine', '9']
    ,['Ten', '10'], ['Eleven', '11'], ['Twelve', '12']
  ]);
  filteredOptions: Observable<string[][]>;

  constructor(private ethStore: Store<fromEth.AppState>, private taggedContractStore: Store<fromTagMainContract.AppState>, private _dialogService: MatDialog, private ethActions$: Actions<fromActionEth.EthActionsUnion>) {
  }

    static readonly debounceTimeCreationTagButton = 1000;

    private taggingCost$: Observable<string>;

    private taggingByCreatorCost$: Observable<string>;

    private tagCreationCost$: Observable<string>;

    private tagTransferCost$: Observable<string>;

    private tags: Tag[]; //Not Observable here, because we want the tags available at the moment, and not await for them or subscribe to them!

    private _creationAvailable = false;

    private _currentTagName: string = "";

    get creationAvailable() {
        return this._creationAvailable;
    }

    get currentTagName() {
        return this._currentTagName;
    }

    ngOnInit() {
        this.filteredOptions = this.myControl.valueChanges
            .pipe(
                startWith(''),
                map(value => typeof value === 'string' ? value : value[0]), //When we set the value as an object/array and not a string it was also coming through here, and in that case we have to filter by the name/value[0] and not the all value.
                //map(value => this._filter(value))
                switchMap(value => this._filter(value))
            );

        this.myControl.valueChanges
            .pipe(
                startWith(''),
                //TODO: Try filter by just string!
                map(value => typeof value === 'string' ? value : value[0]), //When we set the value as an object/array and not a string it was also coming through here, and in that case we have to filter by the name/value[0] and not the all value.
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
                this.tags = tags;
            });

        //Try to get information from contract from Web3 provider it if exists:
        this.ethStore.dispatch(new fromEth.InitEthConsult());
    }

  private _filter(value: string): Observable<string[][]> {
    console.log('Value Filter: "' + value + '"');
    //Get Value:
    //this.myControl.value
    const filterValue: string = value.toLowerCase();

    //return this.options.filter(option => option[0].toLowerCase().includes(filterValue));
    return this.options.pipe(
      map(
          options => options.filter(option => option[0].toLowerCase().includes(filterValue))
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
            console.log(`NO TAG Found: ${tagFound}. Prepare creation!`);
            if(value && value.length > 0) {
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
        let dialogRef = this._dialogService.open(TagCreationDialogComponent, {
            data: {
                tagName: this._currentTagName,
                symbolName: this._currentTagName,
                tagCreationCost: value
            }
        });
        dialogRef.afterClosed().subscribe((result: TagCreationData)  => {
            if(result) {
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

  displayFn(option?: string[]): string | undefined {
    return option ? option[0] : undefined;
  }

  selectionChanged($event: MatOptionSelectionChange, optionSelectedId: string) {
    if($event.source.selected)
      console.log('Options Selected: ' + optionSelectedId);
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
}
