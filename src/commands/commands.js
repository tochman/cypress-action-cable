/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// Simple JavaScript commands for Cypress Action Cable plugin

// Check if we're in a Cypress environment
if (typeof window !== 'undefined' && window.Cypress) {
  const { MockWebSocket } = require('../mocks/MockWebSocket');
  const { MockActionCable } = require('../mocks/MockActionCable');

  // Mock Action Cable
  Cypress.Commands.add('mockActionCable', (url = 'ws://localhost:3000/cable', options = {}) => {
    cy.window().then((win) => {
      // Replace WebSocket with our mock
      win.WebSocket = MockWebSocket;
      
      // Store original ActionCable if it exists
      if (win.ActionCable) {
        win._originalActionCable = win.ActionCable;
      }

      // Replace ActionCable with our mock
      win.ActionCable = {
        createConsumer: (consumerUrl) => {
          return MockActionCable.createConsumer(consumerUrl || url, options);
        }
      };

      // Initialize message storage
      if (!win.cy) {
        win.cy = {};
      }
      win.cy.actionCableMessages = [];
    });
  });

  // Other commands...
  Cypress.Commands.add('createActionCableConsumer', (url, options = {}) => {
    return cy.window().then((win) => {
      const consumer = MockActionCable.createConsumer(url, options);
      return cy.wrap(consumer);
    });
  });

  Cypress.Commands.add('subscribeToChannel', (consumer, channel, callbacks = {}) => {
    return cy.wrap(null).then(() => {
      const subscription = consumer.subscriptions.create(channel, callbacks);
      return cy.wrap(subscription);
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
    cy.wrap(null).then(() => {
      MockActionCable.simulateServerMessage(url, channelIdentifier, message);
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
      MockActionCable.disconnectAll();
      
      // Restore original ActionCable if it existed
      if (win._originalActionCable) {
        win.ActionCable = win._originalActionCable;
        delete win._originalActionCable;
      }
      
      // Restore original WebSocket
      if (win.WebSocket !== WebSocket) {
        try {
          win.WebSocket = WebSocket;
        } catch {
          // In some test environments, WebSocket might not be available
        }
      }
    });
  });
}

module.exports = {};
