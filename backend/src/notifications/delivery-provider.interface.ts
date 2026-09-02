export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface DeliveryProvider {
  channel: 'IN_APP' | 'WEB_PUSH' | 'EMAIL';
  send(payload: NotificationPayload): Promise<boolean>;
}

export class InAppDeliveryProvider implements DeliveryProvider {
  channel = 'IN_APP' as const;
  async send(payload: NotificationPayload): Promise<boolean> {
    // In-app notifications are persisted to database
    return true;
  }
}

export class WebPushDeliveryProvider implements DeliveryProvider {
  channel = 'WEB_PUSH' as const;
  async send(payload: NotificationPayload): Promise<boolean> {
    // Web push sender via VAPID
    return true;
  }
}
