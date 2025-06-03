import { MockWebSocket } from './MockWebSocket';
import { 
  ActionCableConsumer, 
  ActionCableSubscription, 
  ActionCableSubscriptions,
  ChannelNameWithParams,
  SubscriptionCallbacks,
  MockActionCableOptions,
  MockSubscriptionOptions
} from '../types';

export class MockActionCableConsumer implements ActionCableConsumer {
  public url: string;
  public websocket: MockWebSocket | null = null;
  public subscriptions: MockActionCableSubscriptions;
  private options: MockActionCableOptions;
  private isConnected: boolean = false;

  constructor(url: string, options: MockActionCableOptions = {}) {
    this.url = url;
    this.options = {
      autoConnect: true,
      protocols: ['actioncable-v1-json'],
      connectionDelay: 0,
      subscriptionDelay: 0,
      ...options
    };
    this.subscriptions = new MockActionCableSubscriptions(this);

    if (this.options.autoConnect) {
      setTimeout(() => this.connect(), this.options.connectionDelay);
    }
  }

  public connect(): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.websocket = new MockWebSocket(this.url, this.options.protocols);
    
    this.websocket.onopen = () => {
      this.isConnected = true;
      this.send({ command: 'subscribe', identifier: '{"channel":"ConnectionChannel"}' });
    };

    this.websocket.onclose = () => {
      this.isConnected = false;
    };

    this.websocket.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
      this.isConnected = false;
    }
  }

  public send(data: any): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(data));
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === 'ping') {
        // Respond to ping with pong
        this.send({ type: 'pong', message: message.message });
        return;
      }

      if (message.identifier) {
        const subscription = this.subscriptions.findByIdentifier(message.identifier);
        if (subscription && message.message) {
          subscription.handleMessage(message.message);
        }
      }
    } catch (error) {
      console.error('Error parsing Action Cable message:', error);
    }
  }

  public get connected(): boolean {
    return this.isConnected;
  }
}

export class MockActionCableSubscriptions implements ActionCableSubscriptions {
  private subscriptions: MockActionCableSubscription[] = [];
  private consumer: MockActionCableConsumer;

  constructor(consumer: MockActionCableConsumer) {
    this.consumer = consumer;
  }

  public create(
    channelName: string | ChannelNameWithParams, 
    callbacks?: SubscriptionCallbacks
  ): ActionCableSubscription {
    const identifier = typeof channelName === 'string' 
      ? JSON.stringify({ channel: channelName })
      : JSON.stringify(channelName);

    const subscription = new MockActionCableSubscription(
      identifier,
      this.consumer,
      callbacks
    );

    this.subscriptions.push(subscription);
    return subscription;
  }

  public remove(subscription: ActionCableSubscription): void {
    const index = this.subscriptions.indexOf(subscription as MockActionCableSubscription);
    if (index > -1) {
      subscription.unsubscribe();
      this.subscriptions.splice(index, 1);
    }
  }

  public findAll(identifier: string): ActionCableSubscription[] {
    return this.subscriptions.filter(sub => sub.identifier === identifier);
  }

  public findByIdentifier(identifier: string): MockActionCableSubscription | undefined {
    return this.subscriptions.find(sub => sub.identifier === identifier);
  }
}

export class MockActionCableSubscription implements ActionCableSubscription {
  public identifier: string;
  public consumer: ActionCableConsumer;
  public connected: boolean = false;
  private callbacks: SubscriptionCallbacks;
  private options: MockSubscriptionOptions;

  constructor(
    identifier: string, 
    consumer: ActionCableConsumer, 
    callbacks: SubscriptionCallbacks = {},
    options: MockSubscriptionOptions = {}
  ) {
    this.identifier = identifier;
    this.consumer = consumer;
    this.callbacks = callbacks;
    this.options = {
      autoConnect: true,
      connectionDelay: 0,
      ...options
    };

    // Auto-subscribe if consumer is connected
    if (this.options.autoConnect && this.consumer.connected) {
      setTimeout(() => this.subscribe(), this.options.connectionDelay);
    }
  }

  public perform(action: string, data: any = {}): void {
    if (this.connected) {
      this.consumer.send({
        command: 'message',
        identifier: this.identifier,
        data: JSON.stringify({ action, ...data })
      });
    }
  }

  public send(data: any): void {
    if (this.connected) {
      this.consumer.send({
        command: 'message',
        identifier: this.identifier,
        data: JSON.stringify(data)
      });
    }
  }

  public unsubscribe(): void {
    if (this.connected) {
      this.consumer.send({
        command: 'unsubscribe',
        identifier: this.identifier
      });
    }
    this.connected = false;
  }

  private subscribe(): void {
    this.consumer.send({
      command: 'subscribe',
      identifier: this.identifier
    });
    
    // Simulate successful subscription
    setTimeout(() => {
      this.connected = true;
      if (this.callbacks.connected) {
        this.callbacks.connected();
      }
      
      // Send initial data if provided
      if (this.options.initialData) {
        this.options.initialData.forEach(data => {
          setTimeout(() => this.handleMessage(data), 100);
        });
      }
    }, 50);
  }

  public handleMessage(message: any): void {
    if (this.callbacks.received) {
      this.callbacks.received(message);
    }
  }

  public simulateDisconnection(): void {
    this.connected = false;
    if (this.callbacks.disconnected) {
      this.callbacks.disconnected();
    }
  }

  public simulateRejection(): void {
    this.connected = false;
    if (this.callbacks.rejected) {
      this.callbacks.rejected();
    }
  }
}

// Main Action Cable Mock
export class MockActionCable {
  private static consumers: Map<string, MockActionCableConsumer> = new Map();

  public static createConsumer(url: string, options?: MockActionCableOptions): ActionCableConsumer {
    const consumer = new MockActionCableConsumer(url, options);
    this.consumers.set(url, consumer);
    return consumer;
  }

  public static getConsumer(url: string): MockActionCableConsumer | undefined {
    return this.consumers.get(url);
  }

  public static disconnectAll(): void {
    this.consumers.forEach(consumer => consumer.disconnect());
    this.consumers.clear();
  }

  public static simulateServerMessage(url: string, channelIdentifier: string, message: any): void {
    const consumer = this.consumers.get(url);
    if (consumer && consumer.websocket) {
      consumer.websocket.simulateMessage(JSON.stringify({
        identifier: channelIdentifier,
        message: message
      }));
    }
  }
}
