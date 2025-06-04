/* eslint-disable no-undef */
// Helper functions for reliable Action Cable testing

/**
 * Send an Action Cable message with simplified retry capability
 * 
 * @param {string|object} channel - The channel name or channel object
 * @param {object|any} data - The message data to send
 * @returns {Cypress.Chainable} - A chainable Cypress promise
 */
export const sendActionCableMessage = (channel, data) => {
  return cy.window().then(win => {
    // Ensure connection is always available without waiting
    win.mockActionCable = win.mockActionCable || {};
    win.mockActionCable.connected = true;
    
    // Send message directly with minimal overhead
    return cy.acSendMessage(channel, data);
  });
};

/**
 * Force Action Cable connection for immediate availability
 * 
 * @returns {Cypress.Chainable<boolean>} - A chainable promise always resolving to true
 */
export const forceActionCableConnection = () => {
  return cy.window().then(win => {
    win.mockActionCable = win.mockActionCable || {};
    win.mockActionCable.connected = true;
    return cy.wrap(true);
  });
};

/**
 * Subscribe to Action Cable channel immediately without waiting
 * 
 * @param {string|object} channel - The channel name or channel object
 * @returns {Cypress.Chainable} - A chainable Cypress promise
 */
export const subscribeImmediately = (channel) => {
  return cy.window().then(win => {
    // Ensure mock is ready
    win.mockActionCable = win.mockActionCable || {};
    win.mockActionCable.connected = true;
    
    return cy.acSubscribe(channel);
  });
};

/**
 * Receive Action Cable message with reduced timeout for faster tests
 * 
 * @param {string|object} channel - The channel name or channel object
 * @param {object|any} data - Expected message data
 * @param {number} timeout - Maximum time to wait in ms
 * @returns {Cypress.Chainable} - A chainable Cypress promise
 */
export const receiveMessageFast = (channel, data, timeout = 5000) => {  // Reduced from 10000
  return cy.acReceiveMessage(channel, data, { timeout });
};

/**
 * Clean Action Cable state for reliable test isolation
 * 
 * @returns {Cypress.Chainable<boolean>} - A chainable promise resolving to true
 */
export const cleanActionCableState = () => {
  return cy.window().then(win => {
    if (win.mockActionCable) {
      win.mockActionCable.subscriptions = {};
      win.mockActionCable.messages = [];
      win.mockActionCable.connected = false;
    }
    return cy.wrap(true);
  });
};

/**
 * Setup reliable Action Cable environment for test
 * 
 * @returns {Cypress.Chainable} - A chainable Cypress promise
 */
export const setupReliableActionCable = () => {
  return cy.window().then(win => {
    // Initialize mock if needed
    win.mockActionCable = win.mockActionCable || {
      subscriptions: {},
      messages: [],
      connected: false
    };
    
    // Force connected state
    win.mockActionCable.connected = true;
    
    return cy.acMockActionCable();
  });
};

/**
 * Optimized Action Cable UI click handler - simpler and faster
 * 
 * @param {string} selector - The element selector to click
 * @param {object} options - Click options to pass to Cypress click command
 * @returns {Cypress.Chainable} - A chainable Cypress promise
 */
export const reliableActionCableClick = (selector, options = {}) => {
  return cy.get(selector, { timeout: 5000 })  // Reduced from 10000
    .should('be.visible')
    .click({ force: true, ...options });  // Always use force click for reliability
};
