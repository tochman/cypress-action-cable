/* eslint-disable no-undef */
// Example usage of reliability helper commands
// Save this as cypress/e2e/reliable-action-cable.cy.js

describe('Reliable Action Cable Testing Patterns', () => {
  beforeEach(() => {
    // One-command setup with sensible defaults for reliability
    cy.setupReliableActionCable('ws://localhost:3000/cable', {
      debug: false, // Set to true for debugging
      messageHistory: true
    });
    cy.visit('/'); // Visit your application
  });

  afterEach(() => {
    // Thorough cleanup for test isolation
    cy.cleanActionCableState();
    cy.disconnectActionCable();
  });

  it('is expected to connect immediately without waiting', () => {
    // Force connection to be ready immediately (no flaky waiting)
    cy.forceActionCableConnection().then((consumer) => {
      expect(consumer.connected).to.be.true;
      // Connection is guaranteed to be ready - no cy.waitForActionCableConnection needed
    });
  });

  it('is expected to subscribe immediately and send messages', () => {
    // Immediate subscription without waiting
    cy.subscribeImmediately('ChatChannel', {
      received: (data) => {
        console.log('Received:', data);
      }
    }).then((subscription) => {
      // Subscription is guaranteed to be ready
      expect(subscription.connected).to.be.true;
      
      // Send message immediately without connection checks
      cy.sendActionCableMessageImmediately('ChatChannel', {
        action: 'send_message',
        content: 'Hello World!'
      });
      
      // Reliable assertion with retry capability
      cy.shouldHaveActionCableMessageReliably({
        action: 'send_message',
        content: 'Hello World!'
      });
    });
  });

  it('is expected to handle incoming messages with minimal delay', () => {
    let receivedMessages = [];
    
    cy.subscribeImmediately('ChatChannel', {
      received: (data) => {
        receivedMessages.push(data);
      }
    }).then(() => {
      // Receive message immediately (no delay for faster tests)
      cy.receiveMessageImmediately('ChatChannel', {
        type: 'message',
        user: 'TestUser',
        content: 'Hello from server!'
      });
      
      // Small wait to allow message processing
      cy.wait(50).then(() => {
        expect(receivedMessages).to.have.length(1);
        expect(receivedMessages[0].content).to.equal('Hello from server!');
      });
    });
  });

  it('is expected to handle complex scenarios reliably', () => {
    cy.subscribeImmediately({ channel: 'ChatChannel', room_id: 123 }, {
      received: (data) => {
        console.log('Chat message:', data);
      }
    });
    
    cy.subscribeImmediately('NotificationsChannel', {
      received: (data) => {
        console.log('Notification:', data);
      }
    });
    
    // Send multiple messages without waiting
    cy.sendActionCableMessageImmediately({ channel: 'ChatChannel', room_id: 123 }, {
      action: 'join_room'
    });
    
    cy.sendActionCableMessageImmediately('NotificationsChannel', {
      action: 'mark_read',
      notification_id: 42
    });
    
    // Receive responses immediately
    cy.receiveMessageImmediately({ channel: 'ChatChannel', room_id: 123 }, {
      type: 'user_joined',
      user: 'TestUser'
    });
    
    cy.receiveMessageImmediately('NotificationsChannel', {
      type: 'notification_read',
      notification_id: 42
    });
    
    // Reliable assertions with retry
    cy.shouldHaveActionCableMessageReliably({ action: 'join_room' });
    cy.shouldHaveActionCableMessageReliably({ action: 'mark_read' });
  });

  it('is expected to provide clean state isolation between tests', () => {
    // Send some messages
    cy.subscribeImmediately('TestChannel');
    cy.sendActionCableMessageImmediately('TestChannel', { test: 'message1' });
    cy.sendActionCableMessageImmediately('TestChannel', { test: 'message2' });
    
    // Verify messages exist
    cy.getActionCableMessages().then((messages) => {
      expect(messages.length).to.be.greaterThan(0);
    });
    
    // Clean state thoroughly
    cy.cleanActionCableState();
    
    // Verify clean slate
    cy.getActionCableMessages().then((messages) => {
      expect(messages.length).to.equal(0);
    });
  });

  it('is expected to work with existing patterns for compatibility', () => {
    // Mix new reliability helpers with existing commands
    cy.forceActionCableConnection().then((consumer) => {
      
      // Use existing command patterns
      cy.subscribeToChannel(consumer, 'LegacyChannel', {
        received: (data) => console.log('Legacy:', data)
      }).then((subscription) => {
        
        // No need to wait - connection is guaranteed
        cy.performChannelAction(subscription, 'legacy_action', { data: 'test' });
        
        // Use reliable assertion
        cy.shouldHaveActionCableMessageReliably({ action: 'legacy_action' });
      });
    });
  });

  it('is expected to demonstrate debugging capabilities', () => {
    // Setup with debug enabled
    cy.setupReliableActionCable('ws://localhost:3000/cable', { debug: true });
    
    cy.subscribeImmediately('DebugChannel');
    cy.sendActionCableMessageImmediately('DebugChannel', { debug: 'test message' });
    
    // Get detailed message history for debugging
    cy.getMessageHistory().then((history) => {
      console.log('Message history:', history);
      expect(history).to.have.length.greaterThan(0);
      expect(history[0]).to.have.property('timestamp');
      expect(history[0]).to.have.property('type');
    });
  });
});

// Advanced example: Testing with network simulation
describe('Network Resilience with Reliability Helpers', () => {
  beforeEach(() => {
    cy.setupReliableActionCable('ws://localhost:3000/cable', {
      networkSimulation: {
        enabled: true,
        latency: 10, // Low latency for faster tests
        packetLoss: 0.01 // 1% packet loss
      }
    });
    cy.visit('/chat');
  });

  afterEach(() => {
    cy.cleanActionCableState();
    cy.disconnectActionCable();
  });

  it('is expected to handle network issues gracefully', () => {
    cy.subscribeImmediately('ChatChannel');
    
    // Send message before interruption
    cy.sendActionCableMessageImmediately('ChatChannel', { before: 'interruption' });
    
    // Simulate network interruption
    cy.simulateNetworkInterruption({ duration: 1000, reconnect: true });
    
    // Force reconnection for reliability
    cy.forceActionCableConnection();
    
    // Send message after recovery
    cy.sendActionCableMessageImmediately('ChatChannel', { after: 'recovery' });
    
    // Verify both messages with reliable assertion
    cy.shouldHaveActionCableMessageReliably({ before: 'interruption' });
    cy.shouldHaveActionCableMessageReliably({ after: 'recovery' });
  });
});
