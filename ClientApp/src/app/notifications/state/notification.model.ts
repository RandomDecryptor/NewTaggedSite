import {NotificationType} from "../notifications";

export interface UsrNotification {
    id: number;
    type: NotificationType;
    msg: string;
}

let notificationId = 0;

export function createNotification(params: Partial<UsrNotification>) {
    return {
        id: params.id || ++notificationId,
        type: params.type,
        msg: params.msg
    } as UsrNotification;
}
