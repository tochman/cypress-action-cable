// Type definitions for Cypress Action Cable commands
/// <reference types="cypress" />

// Enhanced configuration interfaces
interface EnhancedMockActionCableOptions {
  url?: string;
  protocols?: string[];
  connectionDelay?: number;
  autoWelcome?: boolean;
  debug?: boolean;
  simulateLatency?: boolean;
  latencyRange?: [number, number];
}

interface NetworkInterruptionOptions {
  duration?: number;
  type?: 'disconnect' | 'freeze';
  reconnectDelay?: number;
}

interface ConversationMessage {
  type: 'send' | 'receive';
  data: any;
  delay?: number;
  channelIdentifier?: string;
}

interface ActionCableMessage {
  command?: string;
  identifier?: string;
  data?: any;
  type?: string;
}

declare namespace Cypress {
  interface Chainable {
    /**
     * Mock Action Cable WebSocket connections (Basic)
     * @param url - The WebSocket URL to mock (default: 'ws://localhost:3000/cable')
     * @param options - Configuration options for the mock
     */
    mockActionCable(url?: string, options?: any): Chainable;

    /**
     * Mock Action Cable WebSocket connections (Enhanced)
     * @param options - Enhanced configuration options
     */
    mockEnhancedActionCable(options?: EnhancedMockActionCableOptions): Chainable;

    /**
     * Create an Action Cable consumer for testing
     * @param url - The WebSocket URL
     * @param options - Consumer options
     */
    createActionCableConsumer(url: string, options?: any): Chainable;

    /**
     * Subscribe to an Action Cable channel
     * @param consumer - The Action Cable consumer
     * @param channel - Channel name or channel with params
     * @param callbacks - Channel callbacks (connected, disconnected, received, rejected)
     */
    subscribeToChannel(consumer: any, channel: string | object, callbacks?: any): Chainable;

    /**
     * Perform an action on an Action Cable subscription
     * @param subscription - The subscription object
     * @param action - Action name
     * @param data - Action data
     */
    performChannelAction(subscription: any, action: string, data?: any): Chainable;

    /**
     * Send a message to a specific channel (Enhanced)
     * @param channelIdentifier - Channel identifier
     * @param message - Message to send
     * @param options - Send options
     */
    sendToChannel(channelIdentifier: string, message: any, options?: any): Chainable;

    /**
     * Wait for Action Cable connection to be established
     * @param consumer - The Action Cable consumer
     * @param options - Wait options (timeout, etc.)
     */
    waitForActionCableConnection(consumer: any, options?: any): Chainable;

    /**
     * Wait for Action Cable subscription to be established
     * @param subscription - The subscription object
     * @param options - Wait options (timeout, etc.)
     */
    waitForChannelSubscription(subscription: any, options?: any): Chainable;

    /**
     * Wait for a specific Action Cable message
     * @param expectedMessage - Expected message or matcher function
     * @param options - Wait options
     */
    waitForActionCableMessage(expectedMessage: any, options?: any): Chainable;

    /**
     * Simulate network interruption
     * @param options - Interruption configuration
     */
    simulateNetworkInterruption(options?: NetworkInterruptionOptions): Chainable;

    /**
     * Simulate a conversation (sequence of messages)
     * @param messages - Array of conversation messages
     * @param options - Conversation options
     */
    simulateConversation(messages: ConversationMessage[], options?: any): Chainable;

    /**
     * Simulate a server message to an Action Cable channel
     * @param url - WebSocket URL
     * @param channelIdentifier - Channel identifier (JSON string)
     * @param message - Message data to send
     */
    simulateChannelMessage(url: string, channelIdentifier: string, message: any): Chainable;

    /**
     * Assert that a specific Action Cable message was sent
     * @param expectedData - Expected message data (string or object)
     * @param options - Assertion options
     */
    shouldHaveSentActionCableMessage(expectedData: any, options?: any): Chainable;

    /**
     * Assert Action Cable message with enhanced patterns
     * @param pattern - Message pattern to match
     * @param options - Assertion options
     */
    shouldHaveActionCableMessage(pattern: any, options?: any): Chainable;

    /**
     * Assert Action Cable subscription state
     * @param identifier - Channel identifier
     * @param expectedState - Expected subscription state
     */
    shouldHaveSubscription(identifier: string, expectedState?: string): Chainable;

    /**
     * Get all Action Cable messages sent during the test
     * @param url - Optional URL filter
     */
    getActionCableMessages(url?: string): Chainable;

    /**
     * Get Action Cable connection state
     */
    getActionCableState(): Chainable;

    /**
     * Debug Action Cable state and messages
     * @param options - Debug options
     */
    debugActionCable(options?: any): Chainable;

    /**
     * Clear the Action Cable message history
     */
    clearActionCableMessages(): Chainable;

    /**
     * Disconnect all Action Cable consumers and restore original implementations
     */
    disconnectActionCable(): Chainable;
  }
}
