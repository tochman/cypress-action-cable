// Main entry point for the Cypress Action Cable Plugin
// 
// This plugin provides a sophisticated 3-layer architecture:
// 1. WebSocket Mock Layer: Handles WebSocket transport simulation
// 2. ActionCable Mock Layer: Implements ActionCable protocol behavior  
// 3. Cypress Commands Layer: Provides convenient testing interface
//
// The architecture has been proven in production with complex scenarios
// like BankID authentication flows requiring robust WebSocket testing.

// Import the commands to register them with Cypress
import './commands/commands.js';

// Re-export types for TypeScript users
export * from './types/index.js';

// Re-export mocks for advanced users who need direct access
export { ActionCableMock } from './mocks/action-cable-mock.js';
export { setupMockActionCable, teardownMockActionCable } from './mocks/mock-websocket.js';

// Re-export helpers for users who want to extend functionality
export * from './helpers/websocket-helpers.js';

// Note: The main functionality is provided through Cypress commands:
// - cy.mockActionCable() - Initialize complete mock infrastructure
// - cy.acSubscribe(channelName, params) - Subscribe to channel
// - cy.acReceiveMessage(channelName, params, data) - Simulate server messages
// - cy.acSimulateConversation(channelName, params, messages) - Multiple messages sequence
// - cy.acSubscription(channelName, params) - Check subscription status
// - cy.simulateNetworkInterruption(duration) - Test connection resilience
// - cy.waitForActionCableEvent(eventType) - Wait for connection events
// - cy.verifySubscription(channelName, params) - Verify subscription exists
// - cy.getActiveSubscriptions() - Debug subscription state
// - cy.clearAllSubscriptions() - Clean up between tests
