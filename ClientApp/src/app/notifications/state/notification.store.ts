import {Injectable} from '@angular/core';
import {UsrNotification} from './notification.model';
import {EntityState, EntityStore, StoreConfig} from '@datorama/akita';

export interface NotificationState extends EntityState<UsrNotification> {
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'notification'})
export class NotificationStore extends EntityStore<NotificationState> {

    constructor() {
        super();
    }

}

