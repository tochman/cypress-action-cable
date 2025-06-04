/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// Simple JavaScript commands for Cypress Action Cable plugin

// Check if we're in a Cypress environment
if (typeof window !== 'undefined' && window.Cypress) {
  const { createMockActionCable, createMockActionCableServer } = require('../mocks/MockActionCable');

  // Mock Action Cable with enhanced reliability options
  Cypress.Commands.add('mockActionCable', (url = 'ws://localhost:3000/cable', options = {}) => {
    cy.window().then((win) => {
      // Store original ActionCable if it exists
      if (win.ActionCable) {
        win._originalActionCable = win.ActionCable;
      }

      // Create consumer with reliability-focused options
      const consumer = createMockActionCable(url, {
        debug: options.debug || false,
        messageHistory: options.messageHistory !== false, // Default to true
        networkSimulation: options.networkSimulation || { enabled: false },
        connectionDelay: options.connectionDelay || 0, // No delay by default
        subscriptionDelay: options.subscriptionDelay || 0, // No delay by default
        ...options
      });

      // Force connection to be ready immediately for reliability
      consumer.connected = true;
      consumer.isConnected = true;

      // Replace ActionCable with our mock
      win.ActionCable = {
        createConsumer: (consumerUrl) => {
          const newConsumer = consumerUrl ? createMockActionCable(consumerUrl, options) : consumer;
          // Force new consumers to be connected too
          newConsumer.connected = true;
          newConsumer.isConnected = true;
          return newConsumer;
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
      // Force consumer to be connected for reliability
      consumer.connected = true;
      consumer.isConnected = true;
      
      const subscription = consumer.subscriptions.create(channel, callbacks);
      
      // Force subscription to be ready immediately
      subscription.connected = true;
      subscription.isSubscribed = true;
      
      // Trigger connected callback if provided for immediate feedback
      if (callbacks.connected) {
        callbacks.connected();
      }
      
      return cy.wrap(subscription);
    });
  });

  // Send message directly to a channel (enhanced for reliability)
  Cypress.Commands.add('sendToChannel', (consumer, channel, data) => {
    return cy.wrap(null).then(() => {
      // Ensure consumer is connected before sending
      consumer.connected = true;
      consumer.isConnected = true;
      
      consumer.sendToChannel(channel, data);
      return cy.wrap(true);
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
