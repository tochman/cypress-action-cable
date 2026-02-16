// Type definitions for Cypress Action Cable commands
/// <reference types="cypress" />

// Action Cable interfaces 
interface ActionCableSubscription {
  channel: string | Record<string, unknown>;
  params: Record<string, unknown>;
  connected: boolean;
  perform: (action: string, data?: Record<string, unknown>) => void;
  received?: (data: Record<string, unknown>) => void;
}

interface ActionCableMessage {
  type: 'incoming' | 'outgoing';
  data: Record<string, unknown>;
  timestamp: string;
}

interface ConversationMessage {
  type: 'incoming' | 'outgoing';
  action?: string;
  data: Record<string, unknown>;
  delay?: number;
}

interface ActionCableOptions {
  debug?: boolean;
  reconnectInterval?: number;
  [key: string]: unknown;
}

interface AssertMessageOptions {
  partial?: boolean;
  timeout?: number;
  [key: string]: unknown;
}

declare namespace Cypress {
  interface Chainable {
    /**
     * Initialize Action Cable mocking with WebSocket support
     * @param url - The WebSocket URL to mock (default: 'ws://localhost:3000/cable')
     * @param options - Configuration options for the mock
     */
    mockActionCable(url?: string, options?: ActionCableOptions): Chainable;

    /**
     * Subscribe to an Action Cable channel
     * @param channelName - Name of the channel or channel object
     * @param params - Channel parameters
     */
    acSubscribe(channelName: string | Record<string, unknown>, params?: Record<string, unknown>): Chainable;

    /**
     * Simulate receiving a message on a channel  
     * @param channelName - Name of the channel
     * @param data - Message data to receive
     * @param params - Optional channel parameters
     */
    acReceiveMessage(channelName: string | Record<string, unknown>, data: Record<string, unknown>, params?: Record<string, unknown>): Chainable;

    /**
     * Simulate a conversation with multiple messages
     * @param channelName - Name of the channel
     * @param messages - Array of conversation messages
     * @param params - Optional channel parameters
     */
    acSimulateConversation(channelName: string | Record<string, unknown>, messages: ConversationMessage[], params?: Record<string, unknown>): Chainable;

    /**
     * Get a subscription for a channel
     * @param channelName - Name of the channel
     * @param params - Channel parameters
     */
    acSubscription(channelName: string | Record<string, unknown>, params?: Record<string, unknown>): Chainable;

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
     * @param options - Assertion options (partial: boolean for partial matching)
     */
    acAssertMessageSent(expectedData: Record<string, unknown>, options?: AssertMessageOptions): Chainable;

    /**
     * Disconnect Action Cable and clean up
     */
    acDisconnect(): Chainable;

    /**
     * Simulate network interruption for testing reconnection
     * @param duration - Duration of interruption in milliseconds (default: 3000)
     */
    acSimulateNetworkInterruption(duration?: number): Chainable;

    /**
     * Wait for Action Cable connection to be established
     * @param timeout - Timeout in milliseconds (default: 5000)
     */
    acWaitForConnection(timeout?: number): Chainable;

    /**
     * Wait for subscription to be confirmed
     * @param channelName - Name of the channel
     * @param params - Channel parameters
     * @param timeout - Timeout in milliseconds (default: 5000)
     */
    acWaitForSubscription(channelName: string | Record<string, unknown>, params?: Record<string, unknown>, timeout?: number): Chainable;
  }
}
