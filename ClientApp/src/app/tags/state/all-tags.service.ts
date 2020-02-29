import {Injectable} from '@angular/core';
import {AllTagsStore} from './all-tags.store';
import {Tag} from "../tags.model";
import {TagMainContractService} from "../../tagmaincontract";
import {map, switchMap} from "rxjs/operators";
import {TagContractService} from "../../tagmaincontract/tagcontract/tag-contract.services";

@Injectable({providedIn: 'root'})
export class AllTagsService {

    constructor(private allTagsStore: AllTagsStore, private tagMainContractService: TagMainContractService, private tagContractService: TagContractService) {
    }

    set(allTags: Tag[]) {
        this.allTagsStore.set(allTags);
    }

    add(tag: Tag) {
        this.allTagsStore.add(tag);
    }

    update(id: number, tag: Partial<Tag>) {
        this.allTagsStore.update(id, tag);
    }

    remove(id: number) {
        this.allTagsStore.remove(id);
    }

    checkNewTag(id: number) {
        this.tagMainContractService.getTagFullInfo(id).pipe(
            switchMap((tagInfo) => {
                return this.tagContractService.getName(tagInfo.contractAddress).pipe(
                    map(tagName => ({...tagInfo, name: tagName} as Tag))
                );
            })
        ).subscribe(newTag => {
            this.allTagsStore.upsert(id, newTag);
        });
    }

}
