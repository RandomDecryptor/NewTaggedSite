import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AllTagsStore} from './all-tags.store';
import {Tag} from "../tags.model";

@Injectable({providedIn: 'root'})
export class AllTagsService {

    constructor(private allTagsStore: AllTagsStore) {
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
}
