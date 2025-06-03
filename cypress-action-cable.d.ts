// Type definitions for Cypress Action Cable commands
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Mock Action Cable WebSocket connections
     * @param url - The WebSocket URL to mock (default: 'ws://localhost:3000/cable')
     * @param options - Configuration options for the mock
     */
    mockActionCable(url?: string, options?: any): Chainable;

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
     * Get all Action Cable messages sent during the test
     * @param url - Optional URL filter
     */
    getActionCableMessages(url?: string): Chainable;

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
