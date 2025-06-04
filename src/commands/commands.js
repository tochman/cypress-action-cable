// Import the WebSocket mock setup and helpers
import { setupMockActionCable, teardownMockActionCable } from '../mocks/mock-websocket.js';
import { 
  sendWebSocketMessage, 
  waitForWebSocketConnection,
  clickWithRetry,
  waitForImageToLoad,
  simulateNetworkInterruption,
  waitForActionCableEvent,
  verifySubscription,
  getActiveSubscriptions,
  clearAllSubscriptions,
  waitForElementWithRetry
} from '../helpers/websocket-helpers.js';

// Register the WebSocket helper functions as Cypress commands
Cypress.Commands.add('sendWebSocketMessage', sendWebSocketMessage);
Cypress.Commands.add('waitForWebSocketConnection', waitForWebSocketConnection);
Cypress.Commands.add('clickWithRetry', clickWithRetry);
Cypress.Commands.add('waitForImageToLoad', waitForImageToLoad);
Cypress.Commands.add('simulateNetworkInterruption', simulateNetworkInterruption);
Cypress.Commands.add('waitForActionCableEvent', waitForActionCableEvent);
Cypress.Commands.add('verifySubscription', verifySubscription);
Cypress.Commands.add('getActiveSubscriptions', getActiveSubscriptions);
Cypress.Commands.add('clearAllSubscriptions', clearAllSubscriptions);
Cypress.Commands.add('waitForElementWithRetry', waitForElementWithRetry);

/**
 * Initialize ActionCable mock system with WebSocket server
 * Sets up the complete mock infrastructure for testing
 */
Cypress.Commands.add('mockActionCable', () => {
  return cy.window().then(win => {
    // Clear any previous mock instances
    if (win.mockActionCable) {
      teardownMockActionCable();
    }
    
    // Setup mock ActionCable with WebSocket server
    const { mockServer, actionCableMock } = setupMockActionCable();
    
    // Make sure it's accessible globally
    win.mockActionCable = actionCableMock;
    
    // Set up App.cable for compatibility with Rails applications
    win.App = win.App || {};
    win.App.cable = win.mockActionCable;
    
    // Clean up when the test is done
    cy.on('test:after:run', () => {
      teardownMockActionCable();
    });
    
    cy.log('ActionCable mock with WebSocket server initialized');
    return cy.wrap(win.mockActionCable);
  });
});

/**
 * Subscribe to a channel
 * @param {string} channelName - Name of the channel to subscribe to
 * @param {object} params - Additional channel parameters
 */
Cypress.Commands.add('acSubscribe', (channelName, params = {}) => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      throw new Error('mockActionCable is not initialized. Make sure to call cy.mockActionCable() first');
    }
    
    const channelIdentifier = { channel: channelName, ...params };
    const subscription = win.mockActionCable.subscribe(channelIdentifier);
    
    // Simulate successful connection
    if (subscription && subscription.callbacks && subscription.callbacks.connected) {
      subscription.callbacks.connected.forEach(callback => callback());
    }
    
    cy.log('Subscribed to channel:', channelIdentifier);
    return cy.wrap(subscription);
  });
});

/**
 * Simulate receiving a message on a channel
 * @param {string} channelName - Name of the channel
 * @param {object} params - Channel parameters
 * @param {object} data - Message data to receive
 */
Cypress.Commands.add('acReceiveMessage', (channelName, params = {}, data = {}) => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      throw new Error('mockActionCable is not initialized. Make sure to call cy.mockActionCable() first');
    }
    
    const channelIdentifier = { channel: channelName, ...params };
    
    cy.log('Sending ActionCable message:', { channelIdentifier, data });
    
    // Format data for ActionCable protocol
    const actionCableData = data;
    
    // Use the mock ActionCable method to simulate receiving a message
    if (win.mockActionCable.simulateReceive) {
      cy.log('Using mockActionCable.simulateReceive with direct data format:', { channelIdentifier, actionCableData });
      win.mockActionCable.simulateReceive(channelIdentifier, actionCableData);
    } else {
      cy.log('Error: mockActionCable.simulateReceive method not available');
      throw new Error('mockActionCable.simulateReceive method not available');
    }
    
    return cy.wrap(data);
  });
});

/**
 * Check subscription status for a channel
 * @param {string} channelName - Name of the channel
 * @param {object} params - Channel parameters
 */
Cypress.Commands.add('acSubscription', (channelName, params = {}) => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      cy.log('mockActionCable not found, initializing it now');
      return cy.mockActionCable().then(mock => {
        return checkSubscription(win, channelName, params);
      });
    } else {
      return checkSubscription(win, channelName, params);
    }
  });
});

// Helper function for subscription checking
function checkSubscription(win, channelName, params) {
  const channelIdentifier = { channel: channelName, ...params };
  const identifier = JSON.stringify(channelIdentifier);
  
  const subscriptions = win.mockActionCable.getSubscriptions();
  const subscription = subscriptions.find(sub => sub.identifier === identifier);
  
  cy.log('Checking subscription for:', channelIdentifier, 'Found:', !!subscription);
  return cy.wrap(subscription || null);
}

/**
 * Simulate a conversation with multiple messages sent in sequence
 * @param {string} channelName - Name of the channel
 * @param {object} params - Channel parameters  
 * @param {array} messages - Array of messages to send in sequence
 */
Cypress.Commands.add('acSimulateConversation', (channelName, params = {}, messages = []) => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      cy.log('mockActionCable not found, initializing it now');
      return cy.mockActionCable().then(() => {
        return cy.acSimulateConversation(channelName, params, messages);
      });
    }
    
    const channelIdentifier = { channel: channelName, ...params };
    
    // Send each message in sequence with a delay between them
    const sendMessages = (index) => {
      if (index >= messages.length) return;
      
      const message = messages[index];
      cy.log(`Sending conversation message ${index + 1}/${messages.length}:`, message);
      
      win.mockActionCable.simulateReceive(channelIdentifier, message);
      
      // Add a delay before sending the next message
      cy.wait(300).then(() => sendMessages(index + 1));
    };
    
    // Start sending the messages
    sendMessages(0);
  });
});

/**
 * Get all messages sent/received during the test session
 */
Cypress.Commands.add('acGetMessages', () => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      return cy.wrap([]);
    }
    return cy.wrap(win.mockActionCable.getMessages());
  });
});

/**
 * Clear all tracked messages
 */
Cypress.Commands.add('acClearMessages', () => {
  return cy.window().then(win => {
    if (win.mockActionCable) {
      win.mockActionCable.clearMessages();
    }
  });
});

/**
 * Assert that a specific message was sent
 */
Cypress.Commands.add('acAssertMessageSent', (expectedData, options = {}) => {
  return cy.acGetMessages().then(messages => {
    const outgoingMessages = messages.filter(m => m.type === 'outgoing');
    
    if (options.partial) {
      const found = outgoingMessages.some(msg => 
        Object.keys(expectedData).every(key => 
          JSON.stringify(msg.data[key]) === JSON.stringify(expectedData[key])
        )
      );
      expect(found, `Message containing ${JSON.stringify(expectedData)} was sent`).to.be.true;
    } else {
      const found = outgoingMessages.some(msg => 
        JSON.stringify(msg.data) === JSON.stringify(expectedData)
      );
      expect(found, `Exact message ${JSON.stringify(expectedData)} was sent`).to.be.true;
    }
  });
});

/**
 * Disconnect ActionCable and clean up all mocks
 */
Cypress.Commands.add('acDisconnect', () => {
  return cy.window().then(win => {
    if (win.mockActionCable) {
      win.mockActionCable.disconnect();
      teardownMockActionCable();
      delete win.mockActionCable;
      delete win.App;
    }
  });
});

/**
 * Simulate network interruption for testing reconnection
 */
Cypress.Commands.add('acSimulateNetworkInterruption', (duration = 3000) => {
  return cy.window().then(win => {
    if (win.mockActionCable) {
      simulateNetworkInterruption(duration);
    }
  });
});

/**
 * Wait for ActionCable connection to be established
 */
Cypress.Commands.add('acWaitForConnection', (timeout = 5000) => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      throw new Error('mockActionCable not initialized');
    }
    
    return new Cypress.Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (win.mockActionCable.isConnected()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Connection timeout after ${timeout}ms`));
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      
      checkConnection();
    });
  });
});

/**
 * Wait for subscription to be confirmed
 */
Cypress.Commands.add('acWaitForSubscription', (channelName, params = {}, timeout = 5000) => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      throw new Error('mockActionCable not initialized');
    }
    
    const channelIdentifier = { channel: channelName, ...params };
    const identifier = JSON.stringify(channelIdentifier);
    
    return new Cypress.Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkSubscription = () => {
        const subscriptions = win.mockActionCable.getSubscriptions();
        const subscription = subscriptions.find(sub => sub.identifier === identifier);
        
        if (subscription && subscription.confirmed) {
          resolve(subscription);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Subscription timeout after ${timeout}ms for ${identifier}`));
        } else {
          setTimeout(checkSubscription, 100);
        }
      };
      
      checkSubscription();
    });
  });
});
