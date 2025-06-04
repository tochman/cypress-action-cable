import { Server as MockSocketServer, WebSocket as MockSocketWebSocket } from 'mock-socket';
import { 
  ActionCableConsumer, 
  ActionCableSubscription, 
  ActionCableSubscriptions,
  ChannelNameWithParams,
  SubscriptionCallbacks,
  MockActionCableOptions,
  MockSubscriptionOptions,
  ActionCableMessage,
  NetworkInterruptionOptions,
  ConversationMessage,
  MockServerOptions
} from '../types';

export class MockActionCableConsumer implements ActionCableConsumer {
  public url: string;
  public websocket: MockSocketWebSocket | null = null;
  public subscriptions: MockActionCableSubscriptions;
  private options: MockActionCableOptions;
  private isConnected: boolean = false;
  private messageHistory: ActionCableMessage[] = [];
  private mockServer: MockSocketServer | null = null;
  private interruptionTimeout: NodeJS.Timeout | null = null;

  constructor(url: string, options: MockActionCableOptions = {}) {
    this.url = url;
    this.options = {
      autoConnect: true,
      protocols: ['actioncable-v1-json'],
      connectionDelay: 0,
      subscriptionDelay: 0,
      debug: false,
      messageHistory: false,
      networkSimulation: {
        enabled: false,
        latency: 0,
        packetLoss: 0
      },
      ...options
    };
    this.subscriptions = new MockActionCableSubscriptions(this);

    // Setup mock server if needed
    this.setupMockServer();

    if (this.options.autoConnect) {
      setTimeout(() => this.connect(), this.options.connectionDelay);
    }
  }

  private setupMockServer(): void {
    if (this.options.networkSimulation?.enabled) {
      this.mockServer = new MockSocketServer(this.url);
      this.mockServer.on('connection', (socket: any) => {
        this.log('Server: New connection established');
        
        // Handle ping/pong automatically
        socket.on('message', (data: string) => {
          try {
            const message = JSON.parse(data);
            if (message.type === 'ping') {
              socket.send(JSON.stringify({ type: 'pong', message: message.message }));
            }
          } catch (e) {
            // Not a ping message, ignore
          }
        });
      });
    }
  }

  public connect(): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.websocket = new MockSocketWebSocket(this.url, this.options.protocols);
    
    this.websocket.onopen = () => {
      this.isConnected = true;
      this.log('WebSocket connected');
      this.send({ command: 'subscribe', identifier: '{"channel":"ConnectionChannel"}' });
    };

    this.websocket.onclose = () => {
      this.isConnected = false;
      this.log('WebSocket disconnected');
    };

    this.websocket.onerror = (error) => {
      this.log('WebSocket error:', error);
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
    if (this.mockServer) {
      this.mockServer.close();
      this.mockServer = null;
    }
  }

  public send(data: any): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(data);
      this.websocket.send(messageStr);
      this.log('Sent:', data);
      
      if (this.options.messageHistory) {
        this.messageHistory.push({
          type: 'outgoing',
          data,
          timestamp: Date.now()
        });
      }
    }
  }

  public simulateNetworkInterruption(options: NetworkInterruptionOptions): void {
    if (!this.websocket) return;

    this.log('Simulating network interruption:', options);
    
    if (this.interruptionTimeout) {
      clearTimeout(this.interruptionTimeout);
    }

    // Close connection immediately
    this.websocket.close();
    this.isConnected = false;

    // Reconnect after duration
    this.interruptionTimeout = setTimeout(() => {
      if (options.reconnect !== false) {
        this.connect();
      }
    }, options.duration);
  }

  public simulateConversation(messages: ConversationMessage[]): Promise<void> {
    return new Promise((resolve) => {
      let messageIndex = 0;

      const sendNextMessage = () => {
        if (messageIndex >= messages.length) {
          resolve();
          return;
        }

        const message = messages[messageIndex++];
        
        setTimeout(() => {
          if (message.direction === 'incoming') {
            this.simulateIncomingMessage(message.channel, message.data);
          } else {
            this.sendToChannel(message.channel, message.data);
          }
          sendNextMessage();
        }, message.delay || 100);
      };

      sendNextMessage();
    });
  }

  public sendToChannel(channel: string | ChannelNameWithParams, data: any): void {
    const identifier = typeof channel === 'string' 
      ? JSON.stringify({ channel })
      : JSON.stringify(channel);
    
    this.send({
      command: 'message',
      identifier,
      data: JSON.stringify(data)
    });
  }

  public simulateIncomingMessage(channel: string | ChannelNameWithParams, data: any): void {
    const identifier = typeof channel === 'string' 
      ? JSON.stringify({ channel })
      : JSON.stringify(channel);

    const message = {
      identifier,
      message: data
    };

    // Simulate network latency if configured
    const latency = this.options.networkSimulation?.latency || 0;
    
    setTimeout(() => {
      // Simulate packet loss
      const packetLoss = this.options.networkSimulation?.packetLoss || 0;
      if (Math.random() < packetLoss) {
        this.log('Simulated packet loss for message:', message);
        return;
      }

      this.handleIncomingMessage(message);
    }, latency);
  }

  private handleIncomingMessage(message: any): void {
    if (this.options.messageHistory) {
      this.messageHistory.push({
        type: 'incoming',
        data: message,
        timestamp: Date.now()
      });
    }

    const subscription = this.subscriptions.findByIdentifier(message.identifier);
    if (subscription && message.message) {
      subscription.handleMessage(message.message);
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.log('Received:', message);
      
      if (message.type === 'ping') {
        // Respond to ping with pong
        this.send({ type: 'pong', message: message.message });
        return;
      }

      if (message.identifier) {
        this.handleIncomingMessage(message);
      }
    } catch (error) {
      console.error('Error parsing Action Cable message:', error);
    }
  }

  public getMessageHistory(): ActionCableMessage[] {
    return [...this.messageHistory];
  }

  public clearMessageHistory(): void {
    this.messageHistory = [];
  }

  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[ActionCable]', ...args);
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
    channel: string | ChannelNameWithParams,
    callbacks?: SubscriptionCallbacks,
    options?: MockSubscriptionOptions
  ): ActionCableSubscription {
    const identifier = typeof channel === 'string' 
      ? JSON.stringify({ channel })
      : JSON.stringify(channel);

    const subscription = new MockActionCableSubscription(
      identifier,
      this.consumer,
      callbacks || {},
      options || {}
    );

    this.subscriptions.push(subscription);

    // Auto-subscribe after delay
    const delay = this.consumer['options'].subscriptionDelay || 0;
    setTimeout(() => {
      subscription.subscribe();
    }, delay);

    return subscription;
  }

  public remove(subscription: ActionCableSubscription): void {
    const index = this.subscriptions.indexOf(subscription as MockActionCableSubscription);
    if (index !== -1) {
      this.subscriptions.splice(index, 1);
      subscription.unsubscribe();
    }
  }

  public findByIdentifier(identifier: string): MockActionCableSubscription | undefined {
    return this.subscriptions.find(sub => sub.identifier === identifier);
  }

  public findAll(identifier?: string): ActionCableSubscription[] {
    if (!identifier) {
      return [...this.subscriptions];
    }
    return this.subscriptions.filter(sub => sub.identifier === identifier);
  }
}

export class MockActionCableSubscription implements ActionCableSubscription {
  public identifier: string;
  public consumer: ActionCableConsumer;
  private callbacks: SubscriptionCallbacks;
  private options: MockSubscriptionOptions;
  private isSubscribed: boolean = false;

  constructor(
    identifier: string,
    consumer: MockActionCableConsumer,
    callbacks: SubscriptionCallbacks,
    options: MockSubscriptionOptions
  ) {
    this.identifier = identifier;
    this.consumer = consumer;
    this.callbacks = callbacks;
    this.options = options;
  }

  public subscribe(): void {
    if (this.isSubscribed) return;

    this.consumer.send({
      command: 'subscribe',
      identifier: this.identifier
    });

    this.isSubscribed = true;

    // Simulate successful subscription
    setTimeout(() => {
      if (this.callbacks.connected) {
        this.callbacks.connected();
      }
    }, 10);
  }

  public unsubscribe(): void {
    if (!this.isSubscribed) return;

    this.consumer.send({
      command: 'unsubscribe',
      identifier: this.identifier
    });

    this.isSubscribed = false;

    if (this.callbacks.disconnected) {
      this.callbacks.disconnected();
    }
  }

  public perform(action: string, data?: any): void {
    if (!this.isSubscribed) {
      throw new Error('Cannot perform action on unsubscribed channel');
    }

    this.consumer.send({
      command: 'message',
      identifier: this.identifier,
      data: JSON.stringify({ action, ...data })
    });
  }

  public send(data: any): void {
    this.consumer.send({
      command: 'message',
      identifier: this.identifier,
      data: JSON.stringify(data)
    });
  }

  public handleMessage(message: any): void {
    if (this.callbacks.received) {
      this.callbacks.received(message);
    }
  }

  public simulateMessage(data: any): void {
    setTimeout(() => this.handleMessage(data), 100);
  }

  public get connected(): boolean {
    return this.isSubscribed;
  }
}

// Export a factory function for easier testing
export function createMockActionCable(url: string, options?: MockActionCableOptions): MockActionCableConsumer {
  return new MockActionCableConsumer(url, options);
}

// Export mock server factory
export function createMockActionCableServer(url: string, options?: MockServerOptions): MockSocketServer {
  const server = new MockSocketServer(url);
  
  if (options?.autoHandlePing !== false) {
    server.on('connection', (socket: any) => {
      socket.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'ping') {
            socket.send(JSON.stringify({ type: 'pong', message: message.message }));
          }
        } catch (e) {
          // Not a ping message, ignore
        }
      });
    });
  }

  return server;
}
