// Action Cable Types
export interface ActionCableConnection {
  url: string;
  connected: boolean;
  consumer?: ActionCableConsumer;
  subscriptions: Map<string, ActionCableSubscription>;
}

export interface ActionCableConsumer {
  url: string;
  connected: boolean;
  connect(): void;
  disconnect(): void;
  send(data: any): void;
  subscriptions: ActionCableSubscriptions;
}

export interface ActionCableSubscriptions {
  create(channelName: string | ChannelNameWithParams, callbacks?: SubscriptionCallbacks): ActionCableSubscription;
  remove(subscription: ActionCableSubscription): void;
  findAll(identifier: string): ActionCableSubscription[];
}

export interface ActionCableSubscription {
  identifier: string;
  consumer: ActionCableConsumer;
  connected: boolean;
  perform(action: string, data?: any): void;
  send(data: any): void;
  unsubscribe(): void;
}

export interface ChannelNameWithParams {
  channel: string;
  [key: string]: any;
}

export interface SubscriptionCallbacks {
  connected?(): void;
  disconnected?(): void;
  received?(data: any): void;
  rejected?(): void;
}

export interface MockActionCableOptions {
  url?: string;
  autoConnect?: boolean;
  protocols?: string[];
  connectionDelay?: number;
  subscriptionDelay?: number;
}

export interface MockSubscriptionOptions {
  autoConnect?: boolean;
  connectionDelay?: number;
  initialData?: any[];
}

export interface WebSocketMockOptions {
  url: string;
  protocols?: string | string[];
  binaryType?: 'blob' | 'arraybuffer';
  autoOpen?: boolean;
  openDelay?: number;
}

// Mock WebSocket Events
export interface MockWebSocketEvent {
  type: 'open' | 'close' | 'error' | 'message';
  data?: any;
  code?: number;
  reason?: string;
  wasClean?: boolean;
}

// Cypress Command Options
export interface CypressActionCableOptions {
  timeout?: number;
  log?: boolean;
}

export interface ActionCableTestData {
  channel: string;
  action?: string;
  data?: any;
  timestamp?: number;
}
