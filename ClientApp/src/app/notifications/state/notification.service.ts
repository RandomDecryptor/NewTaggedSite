import {Injectable} from '@angular/core';
import {ID} from '@datorama/akita';
import {NotificationStore} from './notification.store';
import {UsrNotification} from './notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(private notificationStore: NotificationStore) {
    }

    /* NO get(): Starts always empty of notifications!
    get() {
      return this.http.get<Notification[]>('https://api.com').pipe(tap(entities => {
        this.notificationStore.set(entities);
      }));
    }
    */

    add(notification: UsrNotification) {
        console.log(`Notification Added: Type ${notification.type}\nMsg:\n[\n${notification.msg}\n]`);
        this.notificationStore.add(notification);
    }

    /* NO update(): Notifications are always added or removed only!
    update(id, notification: Partial<Notification>) {
        this.notificationStore.update(id, notification);
    }
     */

    remove(id: ID) {
        this.notificationStore.remove(id);
    }
}
