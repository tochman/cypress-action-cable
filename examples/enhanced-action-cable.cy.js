/* eslint-disable no-undef */
// Example usage of enhanced Action Cable commands
// Save this as cypress/e2e/enhanced-action-cable.cy.js

describe('Enhanced Action Cable Testing Patterns', () => {
  beforeEach(() => {
    // Enhanced mockActionCable with reliability defaults
    cy.mockActionCable('ws://localhost:3000/cable', {
      debug: false,
      messageHistory: true,
      connectionDelay: 0,    // No delay for immediate connection
      subscriptionDelay: 0   // No delay for immediate subscription
    });
    cy.visit('/'); // Visit your application
  });

  afterEach(() => {
    cy.disconnectActionCable();
  });

  it('connects and subscribes immediately without waiting', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        // Consumer is automatically connected (enhanced behavior)
        expect(consumer.connected).to.be.true;
        
        // Subscribe with enhanced immediate connection
        cy.subscribeToChannel(consumer, 'ChatChannel', {
          received: (data) => {
            console.log('Received:', data);
          }
        }).then((subscription) => {
          // Subscription is automatically ready (enhanced behavior)
          expect(subscription.connected).to.be.true;
          
          // Send message with enhanced connection guarantee
          cy.sendToChannel(consumer, 'ChatChannel', {
            action: 'send_message',
            content: 'Hello World!'
          });
          
          // Standard message assertion
          cy.shouldHaveSentActionCableMessage({
            action: 'send_message',
            content: 'Hello World!'
          });
        });
      });
  });

  it('handles multiple channels efficiently', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        // Subscribe to multiple channels - all immediate
        cy.subscribeToChannel(consumer, 'ChatChannel')
          .then((chatSubscription) => {
            expect(chatSubscription.connected).to.be.true;
            
            cy.subscribeToChannel(consumer, 'NotificationChannel')
              .then((notificationSubscription) => {
                expect(notificationSubscription.connected).to.be.true;
                
                // Send to both channels
                cy.sendToChannel(consumer, 'ChatChannel', { message: 'Chat message' });
                cy.sendToChannel(consumer, 'NotificationChannel', { alert: 'New notification' });
                
                // Verify both messages
                cy.shouldHaveSentActionCableMessage({ message: 'Chat message' });
                cy.shouldHaveSentActionCableMessage({ alert: 'New notification' });
              });
          });
      });
  });

  it('simulates incoming messages efficiently', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.subscribeToChannel(consumer, 'ChatChannel', {
          received: (data) => {
            // This will be called when we simulate incoming messages
            console.log('Received:', data);
          }
        }).then((subscription) => {
          // Simulate incoming message
          cy.simulateIncomingMessage(consumer, 'ChatChannel', {
            type: 'message',
            content: 'Hello from server!',
            user: 'Server Bot'
          });
          
          // You can add UI assertions here to verify the message was handled
          // cy.get('[data-testid=chat-messages]').should('contain', 'Hello from server!');
        });
      });
  });

  it('works with parameterized channels', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        const roomChannel = { channel: 'ChatChannel', room_id: 123 };
        
        cy.subscribeToChannel(consumer, roomChannel, {
          received: (data) => console.log('Room message:', data)
        }).then((subscription) => {
          expect(subscription.connected).to.be.true;
          
          cy.sendToChannel(consumer, roomChannel, {
            action: 'send_message',
            content: 'Hello room 123!'
          });
          
          cy.shouldHaveSentActionCableMessage({
            action: 'send_message',
            content: 'Hello room 123!'
          });
        });
      });
  });

  it('demonstrates enhanced network simulation', () => {
    // You can still use network simulation for testing edge cases
    cy.mockActionCable('ws://localhost:3000/cable', {
      networkSimulation: {
        latency: [10, 50],
        packetLoss: 0.01
      }
    });
    
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        // Even with network simulation, connection is immediate
        expect(consumer.connected).to.be.true;
        
        cy.subscribeToChannel(consumer, 'ChatChannel')
          .then((subscription) => {
            // Simulate network interruption
            cy.simulateNetworkInterruption(consumer, {
              duration: 1000,
              reconnect: true
            });
            
            // Connection is restored automatically
            cy.waitForActionCableConnection(consumer, { timeout: 5000 }); // Enhanced with reduced timeout
          });
      });
  });
});
