// Type definitions for Cypress Action Cable commands
/// <reference types="cypress" />

// Action Cable interfaces based on AgileVentures patterns
interface ActionCableSubscription {
  channel: string | object;
  params: any;
  connected: boolean;
  perform: (action: string, data?: any) => void;
  received?: (data: any) => void;
}

interface ActionCableMessage {
  type: 'incoming' | 'outgoing';
  data: any;
  timestamp: string;
}

interface ConversationMessage {
  type: 'incoming' | 'outgoing';
  action?: string;
  data: any;
  delay?: number;
}

declare namespace Cypress {
  interface Chainable {
    /**
     * Initialize Action Cable mocking with WebSocket support
     * @param url - The WebSocket URL to mock (default: 'ws://localhost:3000/cable')
     * @param options - Configuration options for the mock
     */
    mockActionCable(url?: string, options?: any): Chainable;

    /**
     * Subscribe to an Action Cable channel
     * @param channelName - Name of the channel or channel object
     * @param params - Channel parameters
     */
    acSubscribe(channelName: string | object, params?: any): Chainable;

    /**
     * Simulate receiving a message on a channel  
     * @param channelName - Name of the channel
     * @param data - Message data to receive
     * @param params - Optional channel parameters
     */
    acReceiveMessage(channelName: string | object, data: any, params?: any): Chainable;

    /**
     * Simulate a conversation with multiple messages
     * @param channelName - Name of the channel
     * @param messages - Array of conversation messages
     * @param params - Optional channel parameters
     */
    acSimulateConversation(channelName: string | object, messages: ConversationMessage[], params?: any): Chainable;

    /**
     * Get a subscription for a channel
     * @param channelName - Name of the channel
     * @param params - Channel parameters
     */
    acSubscription(channelName: string | object, params?: any): Chainable;

    /**
     * Get all Action Cable messages
     */
    acGetMessages(): Chainable;

    /**
     * Clear all Action Cable messages
     */
    acClearMessages(): Chainable;

    /**
     * Assert that a message was sent
     * @param expectedData - Expected message data
     * @param options - Assertion options
     */
    acAssertMessageSent(expectedData: any, options?: any): Chainable;

    /**
     * Disconnect Action Cable and clean up
     */
    acDisconnect(): Chainable;

    /**
     * Simulate network interruption for testing reconnection
     * @param duration - Duration of interruption in milliseconds
     */
    acSimulateNetworkInterruption(duration?: number): Chainable;

    /**
     * Wait for Action Cable connection to be established
     * @param timeout - Timeout in milliseconds
     */
    acWaitForConnection(timeout?: number): Chainable;

    /**
     * Wait for subscription to be confirmed
     * @param channelName - Name of the channel
     * @param params - Channel parameters
     * @param timeout - Timeout in milliseconds
     */
    acWaitForSubscription(channelName: string | object, params?: any, timeout?: number): Chainable;
  }
}
