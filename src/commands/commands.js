/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// Simple JavaScript commands for Cypress Action Cable plugin

// Check if we're in a Cypress environment
if (typeof window !== 'undefined' && window.Cypress) {
  const { createMockActionCable, createMockActionCableServer } = require('../mocks/MockActionCable');

  // Mock Action Cable with improved options
  Cypress.Commands.add('mockActionCable', (url = 'ws://localhost:3000/cable', options = {}) => {
    cy.window().then((win) => {
      // Store original ActionCable if it exists
      if (win.ActionCable) {
        win._originalActionCable = win.ActionCable;
      }

      // Create consumer with improved options
      const consumer = createMockActionCable(url, {
        debug: options.debug || false,
        messageHistory: options.messageHistory || true,
        networkSimulation: options.networkSimulation || { enabled: false },
        ...options
      });

      // Replace ActionCable with our mock
      win.ActionCable = {
        createConsumer: (consumerUrl) => {
          return consumerUrl ? createMockActionCable(consumerUrl, options) : consumer;
        }
      };

      // Store consumer reference for easy access
      win._actionCableConsumer = consumer;

      // Initialize message storage
      if (!win.cy) {
        win.cy = {};
      }
      win.cy.actionCableMessages = [];
    });
  });

  // Create mock server for more advanced testing
  Cypress.Commands.add('createActionCableServer', (url, options = {}) => {
    cy.window().then((win) => {
      const server = createMockActionCableServer(url, options);
      if (!win._actionCableServers) {
        win._actionCableServers = [];
      }
      win._actionCableServers.push(server);
      return cy.wrap(server);
    });
  });

  // Other commands...
  Cypress.Commands.add('createActionCableConsumer', (url, options = {}) => {
    return cy.window().then((win) => {
      const consumer = createMockActionCable(url, options);
      return cy.wrap(consumer);
    });
  });

  Cypress.Commands.add('subscribeToChannel', (consumer, channel, callbacks = {}) => {
    return cy.wrap(null).then(() => {
      const subscription = consumer.subscriptions.create(channel, callbacks);
      return cy.wrap(subscription);
    });
  });

  // Send message directly to a channel (simplified helper)
  Cypress.Commands.add('sendToChannel', (consumer, channel, data) => {
    cy.wrap(null).then(() => {
      consumer.sendToChannel(channel, data);
    });
  });

  // Simulate incoming message to a channel
  Cypress.Commands.add('simulateIncomingMessage', (consumer, channel, data) => {
    cy.wrap(null).then(() => {
      consumer.simulateIncomingMessage(channel, data);
    });
  });

  // Simulate network interruption
  Cypress.Commands.add('simulateNetworkInterruption', (consumer, options = {}) => {
    cy.wrap(null).then(() => {
      consumer.simulateNetworkInterruption({
        duration: 1000,
        reconnect: true,
        ...options
      });
    });
  });

  // Simulate conversation (series of messages)
  Cypress.Commands.add('simulateConversation', (consumer, messages) => {
    return cy.wrap(null).then(() => {
      return consumer.simulateConversation(messages);
    });
  });

  // Get message history
  Cypress.Commands.add('getMessageHistory', (consumer) => {
    return cy.wrap(null).then(() => {
      return consumer.getMessageHistory();
    });
  });

  // Clear message history
  Cypress.Commands.add('clearMessageHistory', (consumer) => {
    cy.wrap(null).then(() => {
      consumer.clearMessageHistory();
    });
  });

  Cypress.Commands.add('performChannelAction', (subscription, action, data = {}) => {
    cy.wrap(null).then(() => {
      subscription.perform(action, data);
    });
  });

  Cypress.Commands.add('waitForActionCableConnection', (consumer, options = {}) => {
    cy.wrap(null).should(() => {
      expect(consumer.connected).to.be.true;
    });
  });

  Cypress.Commands.add('waitForChannelSubscription', (subscription, options = {}) => {
    cy.wrap(null).should(() => {
      expect(subscription.connected).to.be.true;
    });
  });

  Cypress.Commands.add('simulateChannelMessage', (url, channelIdentifier, message) => {
    cy.window().then((win) => {
      // Use the stored consumer reference or find it
      const consumer = win._actionCableConsumer;
      if (consumer) {
        consumer.simulateIncomingMessage(JSON.parse(channelIdentifier), message);
      }
    });
  });

  Cypress.Commands.add('shouldHaveSentActionCableMessage', (expectedData, options = {}) => {
    cy.window().then((win) => {
      const messages = win.cy?.actionCableMessages || [];
      
      if (typeof expectedData === 'string') {
        const found = messages.some((msg) => 
          typeof msg.data === 'string' && msg.data.includes(expectedData)
        );
        expect(found, `Expected to find message containing: ${expectedData}`).to.be.true;
      } else if (typeof expectedData === 'object') {
        const found = messages.some((msg) => {
          try {
            const parsedData = JSON.parse(msg.data);
            return JSON.stringify(parsedData).includes(JSON.stringify(expectedData));
          } catch {
            return false;
          }
        });
        expect(found, `Expected to find message containing: ${JSON.stringify(expectedData)}`).to.be.true;
      }
    });
  });

  Cypress.Commands.add('getActionCableMessages', (url) => {
    return cy.window().then((win) => {
      const messages = win.cy?.actionCableMessages || [];
      
      if (url) {
        return messages.filter((msg) => msg.url === url);
      }
      
      return messages;
    });
  });

  Cypress.Commands.add('clearActionCableMessages', () => {
    cy.window().then((win) => {
      if (win.cy) {
        win.cy.actionCableMessages = [];
      }
    });
  });

  // Convenience commands inspired by reliable testing patterns
  
  // Force connection helper - ensures connection is always ready
  Cypress.Commands.add('forceActionCableConnection', (url = 'ws://localhost:3000/cable', options = {}) => {
    return cy.window().then((win) => {
      // Ensure consumer exists and is connected
      if (!win._actionCableConsumer) {
        const consumer = createMockActionCable(url, {
          connectionDelay: 0,
          debug: options.debug || false,
          ...options
        });
        win._actionCableConsumer = consumer;
      }
      
      const consumer = win._actionCableConsumer;
      consumer.connected = true;
      consumer.isConnected = true;
      
      return cy.wrap(consumer);
    });
  });

  // Immediate subscription helper - no waiting required
  Cypress.Commands.add('subscribeImmediately', (channel, callbacks = {}, options = {}) => {
    return cy.forceActionCableConnection().then(consumer => {
      return cy.subscribeToChannel(consumer, channel, callbacks).then(subscription => {
        // Force subscription to be connected immediately
        subscription.connected = true;
        subscription.isSubscribed = true;
        
        // Trigger connected callback if provided
        if (callbacks.connected) {
          setTimeout(callbacks.connected, 0);
        }
        
        return cy.wrap(subscription);
      });
    });
  });

  // Send message without waiting for connection
  Cypress.Commands.add('sendActionCableMessageImmediately', (channel, data, options = {}) => {
    return cy.window().then(win => {
      if (!win._actionCableConsumer) {
        throw new Error('Action Cable consumer not found. Call cy.forceActionCableConnection() first.');
      }
      
      const consumer = win._actionCableConsumer;
      consumer.connected = true; // Force connection state
      
      return cy.sendToChannel(consumer, channel, data);
    });
  });

  // Receive message with minimal delay for faster tests
  Cypress.Commands.add('receiveMessageImmediately', (channel, data, delay = 0) => {
    return cy.window().then(win => {
      const consumer = win._actionCableConsumer;
      if (!consumer) {
        throw new Error('Action Cable consumer not found. Call cy.forceActionCableConnection() first.');
      }
      
      if (delay > 0) {
        cy.wait(delay);
      }
      
      return cy.simulateIncomingMessage(consumer, channel, data);
    });
  });

  // Reliable message assertion with retry capability
  Cypress.Commands.add('shouldHaveActionCableMessageReliably', (expectedData, options = {}) => {
    const { timeout = 5000, retries = 3 } = options;
    
    let attempt = 0;
    const checkMessage = () => {
      attempt++;
      
      return cy.getActionCableMessages().then(messages => {
        const found = messages.some(msg => {
          if (typeof expectedData === 'string') {
            return typeof msg.data === 'string' && msg.data.includes(expectedData);
          } else if (typeof expectedData === 'object') {
            try {
              const parsedData = JSON.parse(msg.data);
              return JSON.stringify(parsedData).includes(JSON.stringify(expectedData));
            } catch {
              return false;
            }
          }
          return false;
        });
        
        if (!found && attempt < retries) {
          cy.wait(100); // Brief wait before retry
          return checkMessage();
        }
        
        expect(found, `Expected to find message: ${JSON.stringify(expectedData)} (attempt ${attempt}/${retries})`).to.be.true;
      });
    };
    
    return checkMessage();
  });

  // Clean Action Cable state thoroughly
  Cypress.Commands.add('cleanActionCableState', () => {
    return cy.window().then(win => {
      // Clear message history
      if (win._actionCableConsumer && typeof win._actionCableConsumer.clearMessageHistory === 'function') {
        win._actionCableConsumer.clearMessageHistory();
      }
      
      // Clear Cypress message storage
      if (win.cy && win.cy.actionCableMessages) {
        win.cy.actionCableMessages = [];
      }
      
      // Reset connection state
      if (win._actionCableConsumer) {
        win._actionCableConsumer.connected = false;
        win._actionCableConsumer.isConnected = false;
      }
    });
  });

  // One-command reliable setup
  Cypress.Commands.add('setupReliableActionCable', (url = 'ws://localhost:3000/cable', options = {}) => {
    const defaultOptions = {
      debug: false,
      messageHistory: true,
      networkSimulation: { enabled: false },
      connectionDelay: 0, // No delays for faster tests
      subscriptionDelay: 0,
      ...options
    };
    
    cy.mockActionCable(url, defaultOptions);
    return cy.forceActionCableConnection(url, defaultOptions);
  });

  Cypress.Commands.add('disconnectActionCable', () => {
    cy.window().then((win) => {
      // Disconnect consumer if it exists
      if (win._actionCableConsumer) {
        win._actionCableConsumer.disconnect();
        delete win._actionCableConsumer;
      }

      // Close any mock servers
      if (win._actionCableServers) {
        win._actionCableServers.forEach(server => server.close());
        delete win._actionCableServers;
      }
      
      // Restore original ActionCable if it existed
      if (win._originalActionCable) {
        win.ActionCable = win._originalActionCable;
        delete win._originalActionCable;
      }
    });
  });
}

module.exports = {};
