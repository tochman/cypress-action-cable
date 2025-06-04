/* eslint-disable no-undef */
// Example usage of the Cypress Action Cable plugin
// Save this as cypress/e2e/action-cable.cy.js or similar

describe('Action Cable Tests', () => {
  beforeEach(() => {
    // Mock Action Cable with debug and message history enabled
    cy.mockActionCable('ws://localhost:3000/cable', {
      debug: true,
      messageHistory: true,
      networkSimulation: { enabled: false }
    });
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
          
          // Use the new simulateIncomingMessage command
          cy.simulateIncomingMessage(consumer, 'ChatChannel', { 
            type: 'message', 
            content: 'Hello from server!',
            user: 'System'
          });
          
          // Wait a bit for the message to be processed
          cy.wait(100).then(() => {
            expect(receivedMessages).to.have.length(1);
            expect(receivedMessages[0].content).to.equal('Hello from server!');
          });
        });
      });
  });

  it('should handle channel communication with sendToChannel helper', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        cy.subscribeToChannel(consumer, { channel: 'ChatChannel', room_id: 123 })
          .then((subscription) => {
            cy.waitForChannelSubscription(subscription);
            
            // Use the new sendToChannel helper
            cy.sendToChannel(consumer, { channel: 'ChatChannel', room_id: 123 }, {
              content: 'Hello World!',
              user_id: 1
            });
            
            // Check message history
            cy.getMessageHistory(consumer).then((history) => {
              expect(history).to.have.length.greaterThan(0);
              const lastMessage = history[history.length - 1];
              expect(lastMessage.type).to.equal('outgoing');
            });
          });
      });
  });

  it('should simulate network interruptions', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        // Simulate network interruption
        cy.simulateNetworkInterruption(consumer, {
          duration: 500,
          reconnect: true
        });
        
        // Verify connection is lost then restored
        cy.wrap(null).should(() => {
          expect(consumer.connected).to.be.false;
        });
        
        cy.wait(600).then(() => {
          expect(consumer.connected).to.be.true;
        });
      });
  });

  it('should simulate conversations', () => {
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
          
          // Simulate a conversation
          cy.simulateConversation(consumer, [
            {
              direction: 'outgoing',
              channel: 'ChatChannel',
              data: { message: 'Hello!' },
              delay: 100
            },
            {
              direction: 'incoming',
              channel: 'ChatChannel',
              data: { message: 'Hi there!' },
              delay: 200
            },
            {
              direction: 'outgoing',
              channel: 'ChatChannel',
              data: { message: 'How are you?' },
              delay: 150
            }
          ]);
          
          // Wait for conversation to complete
          cy.wait(500).then(() => {
            expect(receivedMessages).to.have.length(1); // Only incoming message
            expect(receivedMessages[0].message).to.equal('Hi there!');
            
            // Check message history includes all messages
            cy.getMessageHistory(consumer).then((history) => {
              const outgoingMessages = history.filter(m => m.type === 'outgoing');
              expect(outgoingMessages).to.have.length(2);
            });
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
        
        // Check message history
        cy.getMessageHistory(consumer).then((history) => {
          expect(history.length).to.be.greaterThan(0);
        });
      });
  });

  it('should track and clear message history', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        cy.subscribeToChannel(consumer, 'TestChannel')
          .then((subscription) => {
            cy.waitForChannelSubscription(subscription);
            
            // Send some messages
            cy.performChannelAction(subscription, 'test_action_1');
            cy.performChannelAction(subscription, 'test_action_2');
            
            // Verify message history exists
            cy.getMessageHistory(consumer).then((history) => {
              expect(history).to.have.length.greaterThan(0);
            });
            
            // Clear message history
            cy.clearMessageHistory(consumer);
            
            // Verify history is cleared
            cy.getMessageHistory(consumer).then((history) => {
              expect(history).to.have.length(0);
            });
          });
      });
  });

  it('should work with network simulation enabled', () => {
    // Create consumer with network simulation
    cy.createActionCableConsumer('ws://localhost:3000/cable', {
      networkSimulation: {
        enabled: true,
        latency: 50,
        packetLoss: 0.1 // 10% packet loss
      }
    }).then((consumer) => {
      cy.waitForActionCableConnection(consumer);
      
      cy.subscribeToChannel(consumer, 'TestChannel')
        .then((subscription) => {
          cy.waitForChannelSubscription(subscription);
          
          // Send multiple messages - some may be lost due to packet loss simulation
          for (let i = 0; i < 10; i++) {
            cy.performChannelAction(subscription, 'test_action', { message: `Message ${i}` });
          }
          
          // Check that some messages were sent (accounting for packet loss)
          cy.getMessageHistory(consumer).then((history) => {
            expect(history.length).to.be.greaterThan(0);
          });
        });
    });
  });
});
