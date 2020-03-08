import { Injectable } from '@angular/core';
import * as fromTagMainContract from '../tagmaincontract';
import {Store} from "@ngrx/store";
import {catchError, first, map, switchMap, tap} from "rxjs/operators";

import * as fromEth from "../ethereum";
import {AllTagsStore} from "../tags/state/all-tags.store";

import {combineLatest, from, Observable, of} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MainContractHighLevelService {

    constructor(private ethStore: Store<fromEth.AppState>,
                private mainContractService: fromTagMainContract.TagMainContractService
    ) {
    }

}
