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
  debug?: boolean;
  messageHistory?: boolean;
  networkSimulation?: {
    enabled: boolean;
    latency?: number;
    packetLoss?: number;
  };
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

// Message tracking for test verification
export interface ActionCableMessage {
  type: 'incoming' | 'outgoing';
  data: any;
  timestamp: number;
}

// Network interruption simulation
export interface NetworkInterruptionOptions {
  duration: number;
  reconnect?: boolean;
  reconnectAutomatically?: boolean;
  reconnectDelay?: number;
}

// Conversation simulation for testing
export interface ConversationMessage {
  direction: 'incoming' | 'outgoing';
  channel: string | ChannelNameWithParams;
  data: any;
  delay?: number;
  from?: string;
}

// Enhanced subscription callbacks with more detailed events
export interface EnhancedSubscriptionCallbacks extends SubscriptionCallbacks {
  initialized?(): void;
  confirmed?(): void;
  rejected?(reason?: any): void;
}

// Server simulation interface
export interface MockServerOptions {
  url?: string;
  autoStart?: boolean;
  autoHandlePing?: boolean;
  messageHistory?: boolean;
  debug?: boolean;
}
