// TypeScript type definitions for the Cypress Action Cable Plugin
// Based on proven patterns from AgileVentures/ejra-frontend

/**
 * Channel identifier - can be a simple string or object with parameters
 */
export type ChannelIdentifier = string | { 
  channel: string; 
  [key: string]: any; 
};

/**
 * Channel parameters for subscription
 */
export interface ChannelParams {
  [key: string]: any;
}

/**
 * ActionCable message data
 */
export interface ActionCableMessage {
  [key: string]: any;
}

/**
 * ActionCable subscription interface
 */
export interface ACSubscription {
  identifier: string;
  perform: (action: string, data?: any) => void;
  unsubscribe: () => void;
}

/**
 * ActionCable mock interface
 */
export interface ACMock {
  connected: boolean;
  subscribe: (channelIdentifier: ChannelIdentifier) => ACSubscription;
  getSubscriptions: () => ACSubscription[];
  simulateReceive: (channelIdentifier: ChannelIdentifier, data: ActionCableMessage) => boolean;
  connect: () => boolean;
  disconnect: () => boolean;
  simulateNetworkInterruption: (duration?: number) => Promise<boolean>;
}

/**
 * Wait options for UI elements
 */
export interface WaitOptions {
  timeout?: number;
  retryInterval?: number;
  maxRetries?: number;
}

/**
 * Click retry options
 */
export interface ClickRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  [key: string]: any;
}
