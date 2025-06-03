/* eslint-disable no-undef */
// Example usage of the Cypress Action Cable plugin
// Save this as cypress/e2e/action-cable.cy.js or similar

describe('Action Cable Tests', () => {
  beforeEach(() => {
    // Mock Action Cable before visiting your app
    cy.mockActionCable('ws://localhost:3000/cable');
    cy.visit('/'); // Visit your application
  });

  afterEach(() => {
    // Clean up after each test
    cy.disconnectActionCable();
  });

  it('should connect to Action Cable', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
      });
  });

  it('should subscribe to a channel and receive messages', () => {
    let receivedMessages = [];
    
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        cy.subscribeToChannel(consumer, 'ChatChannel', {
          received: (data) => {
            receivedMessages.push(data);
          }
        }).then((subscription) => {
          cy.waitForChannelSubscription(subscription);
          
          // Simulate server sending a message
          cy.simulateChannelMessage(
            'ws://localhost:3000/cable',
            '{"channel":"ChatChannel"}',
            { 
              type: 'message', 
              content: 'Hello from server!',
              user: 'System'
            }
          );
          
          // Wait a bit for the message to be processed
          cy.wait(100).then(() => {
            expect(receivedMessages).to.have.length(1);
            expect(receivedMessages[0].content).to.equal('Hello from server!');
          });
        });
      });
  });

  it('should send messages through Action Cable', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        cy.subscribeToChannel(consumer, { channel: 'ChatChannel', room_id: 123 })
          .then((subscription) => {
            cy.waitForChannelSubscription(subscription);
            
            // Perform an action (send a message)
            cy.performChannelAction(subscription, 'send_message', {
              content: 'Hello World!',
              user_id: 1
            });
            
            // Verify message was sent
            cy.shouldHaveSentActionCableMessage({
              action: 'send_message',
              content: 'Hello World!'
            });
          });
      });
  });

  it('should handle multiple subscriptions', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        // Subscribe to chat channel
        cy.subscribeToChannel(consumer, 'ChatChannel').as('chatSub');
        
        // Subscribe to notifications channel
        cy.subscribeToChannel(consumer, 'NotificationsChannel').as('notificationsSub');
        
        cy.get('@chatSub').then((chatSub) => {
          cy.waitForChannelSubscription(chatSub);
        });
        
        cy.get('@notificationsSub').then((notificationsSub) => {
          cy.waitForChannelSubscription(notificationsSub);
        });
        
        // Test that both subscriptions work
        cy.get('@chatSub').then((chatSub) => {
          cy.performChannelAction(chatSub, 'send_message', { content: 'Chat message' });
        });
        
        cy.get('@notificationsSub').then((notificationsSub) => {
          cy.performChannelAction(notificationsSub, 'mark_read', { notification_id: 42 });
        });
        
        // Verify both messages were sent
        cy.shouldHaveSentActionCableMessage({ action: 'send_message' });
        cy.shouldHaveSentActionCableMessage({ action: 'mark_read' });
      });
  });

  it('should clear message history', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        cy.subscribeToChannel(consumer, 'TestChannel')
          .then((subscription) => {
            cy.waitForChannelSubscription(subscription);
            
            // Send some messages
            cy.performChannelAction(subscription, 'test_action_1');
            cy.performChannelAction(subscription, 'test_action_2');
            
            // Verify messages exist
            cy.getActionCableMessages().then((messages) => {
              expect(messages).to.have.length.greaterThan(0);
            });
            
            // Clear messages
            cy.clearActionCableMessages();
            
            // Verify messages are cleared
            cy.getActionCableMessages().then((messages) => {
              expect(messages).to.have.length(0);
            });
          });
      });
  });
});
