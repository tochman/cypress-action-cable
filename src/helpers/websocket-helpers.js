/**
 * WebSocket Helper Functions for Testing
 *
 * RESPONSIBILITIES:
 * 1. Utility Functions: Common testing patterns and convenience methods
 * 2. Network Simulation: Helper methods for connection state testing
 * 3. Wait Conditions: Robust waiting strategies for async operations
 * 4. UI Interactions: Reliable element interaction patterns
 *
 * These helpers complement the main ActionCable testing commands
 * with utility functions proven effective in complex real-world scenarios.
 *
 * @module websocket-helpers
 */

/**
 * Send a WebSocket message to the mock server
 * Useful for testing client-to-server communication patterns
 *
 * @param {object} message - The message to send (will be JSON stringified)
 * @returns {Cypress.Chainable} Cypress chainable for test flow
 * @throws {Error} If WebSocket is not connected
 * @example
 * cy.sendWebSocketMessage({ command: 'subscribe', identifier: '{"channel":"ChatChannel"}' });
 */
export const sendWebSocketMessage = message => {
  return cy.window().then(win => {
    if (win.mockSocket && win.mockSocket.readyState === WebSocket.OPEN) {
      win.mockSocket.send(JSON.stringify(message));
      cy.log('Sent WebSocket message:', message);
    } else {
      throw new Error('WebSocket is not connected');
    }
  });
};

/**
 * Wait for WebSocket connection to be established
 * Essential for ensuring connection state before testing
 *
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Cypress.Chainable} Cypress chainable for test flow
 * @example
 * cy.waitForWebSocketConnection(10000); // Wait up to 10 seconds
 */
export const waitForWebSocketConnection = (timeout = 5000) => {
  return cy.window({ timeout }).should(win => {
    expect(win.mockActionCable).to.exist;
    expect(win.mockActionCable.connected).to.be.true;
  });
};

/**
 * Click element with retry logic for flaky UI interactions
 * Handles cases where elements may be temporarily blocked or loading
 *
 * @param {string} selector - CSS selector for the element
 * @param {object} [options={}] - Click options and retry configuration
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
 * @param {number} [options.retryDelay=500] - Delay between retries in milliseconds
 * @returns {Cypress.Chainable} Cypress chainable for test flow
 * @throws {Error} If element cannot be clicked after all retries
 * @example
 * cy.clickWithRetry('[data-cy=submit-button]', { maxRetries: 5, retryDelay: 1000 });
 */
export const clickWithRetry = (selector, options = {}) => {
  const { maxRetries = 3, retryDelay = 500, ...clickOptions } = options;

  const attemptClick = (attempt = 1) => {
    return cy.get(selector, { timeout: 5000 }).then($el => {
      try {
        $el.click(clickOptions);
        return cy.wrap($el);
      } catch (error) {
        if (attempt < maxRetries) {
          cy.wait(retryDelay);
          return attemptClick(attempt + 1);
        }
        throw error;
      }
    });
  };

  return attemptClick();
};

/**
 * Wait for image to load completely
 * Critical for QR code testing and other image-dependent scenarios
 *
 * @param {string} selector - CSS selector for the image element
 * @param {number} [timeout=10000] - Timeout in milliseconds
 * @returns {Cypress.Chainable} Cypress chainable for test flow
 * @example
 * cy.waitForImageToLoad('[data-cy=qr-code]');
 */
export const waitForImageToLoad = (selector, timeout = 10000) => {
  return cy
    .get(selector, { timeout })
    .should('be.visible')
    .and($img => {
      // Check if image has loaded
      expect($img[0].complete).to.be.true;
      expect($img[0].naturalWidth).to.be.greaterThan(0);
    });
};

/**
 * Simulate network interruption for testing resilience
 * Tests how the application handles connection drops and reconnections
 *
 * @param {number} [duration=3000] - Duration of interruption in milliseconds
 * @returns {Cypress.Chainable} Cypress chainable for test flow
 * @throws {Error} If mockActionCable is not initialized
 * @example
 * cy.simulateNetworkInterruption(5000); // Simulate 5-second outage
 */
export const simulateNetworkInterruption = (duration = 3000) => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      throw new Error('mockActionCable is not initialized');
    }

    cy.log(`Simulating network interruption for ${duration}ms`);
    return win.mockActionCable.simulateNetworkInterruption(duration);
  });
};

/**
 * Wait for a specific WebSocket event with custom condition
 * Generic event waiter that can be customized for different scenarios
 *
 * @param {string} eventType - The type of event to wait for
 * @param {Function|null} [condition=null] - Optional condition function to check event data
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Cypress.Chainable} Cypress chainable for test flow
 * @example
 * cy.waitForWebSocketEvent('message', (data) => data.type === 'welcome');
 */
export const waitForWebSocketEvent = (eventType, condition = null, timeout = 5000) => {
  return cy.window({ timeout }).should(win => {
    // Check if the event occurred
    const events = win.mockActionCable?.events || [];
    const matchingEvents = events.filter(event => {
      if (event.type !== eventType) return false;
      if (condition && !condition(event.data)) return false;
      return true;
    });

    expect(matchingEvents.length).to.be.greaterThan(0);
  });
};

/**
 * Wait for specific ActionCable events
 * Useful for synchronizing test steps with connection state changes
 *
 * @param {string} eventType - Type of event to wait for ('connected', 'disconnected', etc.)
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Cypress.Chainable} Cypress chainable for test flow
 * @throws {Error} If event is not received within timeout
 * @example
 * cy.waitForActionCableEvent('connected', 10000);
 */
export const waitForActionCableEvent = (eventType, timeout = 5000) => {
  return cy.window({ timeout }).then(win => {
    return new Cypress.Promise(resolve => {
      const eventName = `actioncable:${eventType}`;

      const handleEvent = () => {
        document.removeEventListener(eventName, handleEvent);
        resolve(true);
      };

      document.addEventListener(eventName, handleEvent);

      // Set timeout
      setTimeout(() => {
        document.removeEventListener(eventName, handleEvent);
        throw new Error(`Timeout waiting for ActionCable event: ${eventType}`);
      }, timeout);
    });
  });
};

/**
 * Verify subscription exists and is active
 * Essential for debugging subscription-related issues
 *
 * @param {string} channelName - Name of the channel
 * @param {object} [params={}] - Channel parameters
 * @returns {Cypress.Chainable} Cypress chainable with subscription object
 * @throws {Error} If mockActionCable is not initialized or subscription not found
 * @example
 * cy.verifySubscription('ChatChannel', { room: 'general' });
 */
export const verifySubscription = (channelName, params = {}) => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      throw new Error('mockActionCable is not initialized');
    }

    const channelIdentifier = { channel: channelName, ...params };
    const identifier = JSON.stringify(channelIdentifier);

    const subscriptions = win.mockActionCable.getSubscriptions();
    const subscription = subscriptions.find(sub => sub.identifier === identifier);

    if (!subscription) {
      throw new Error(`No subscription found for channel: ${channelName}`);
    }

    cy.log('Verified subscription exists:', channelIdentifier);
    return cy.wrap(subscription);
  });
};

/**
 * Get all active subscriptions for debugging
 * Helpful for understanding current subscription state during test development
 *
 * @returns {Cypress.Chainable} Cypress chainable with subscriptions array
 * @example
 * cy.getActiveSubscriptions().then((subs) => {
 *   console.log('Active subscriptions:', subs.length);
 * });
 */
export const getActiveSubscriptions = () => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      return [];
    }

    const subscriptions = win.mockActionCable.getSubscriptions();
    cy.log('Active subscriptions:', subscriptions.length);
    return cy.wrap(subscriptions);
  });
};

/**
 * Clear all subscriptions for test cleanup
 * Ensures clean state between test runs by unsubscribing from all channels
 *
 * @returns {Cypress.Chainable} Cypress chainable for test flow
 * @example
 * afterEach(() => {
 *   cy.clearAllSubscriptions();
 * });
 */
export const clearAllSubscriptions = () => {
  return cy.window().then(win => {
    if (!win.mockActionCable) {
      return cy.wrap(true);
    }

    const subscriptions = win.mockActionCable.getSubscriptions();
    subscriptions.forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });

    cy.log('Cleared all subscriptions');
    return cy.wrap(true);
  });
};

/**
 * Wait for element with retry logic
 * Handles elements that may appear/disappear during async operations
 *
 * @param {string} selector - CSS selector for the element
 * @param {object} [options={}] - Waiting options and conditions
 * @param {number} [options.timeout=10000] - Total timeout in milliseconds
 * @param {number} [options.retryInterval=500] - Time between retries in milliseconds
 * @param {string} [options.condition='be.visible'] - Cypress should condition to check
 * @param {number} [options.maxRetries=20] - Maximum number of retry attempts
 * @returns {Cypress.Chainable} Cypress chainable for test flow
 * @throws {Error} If element is not found after maximum retries
 * @example
 * cy.waitForElementWithRetry('[data-cy=dynamic-content]', {
 *   timeout: 15000,
 *   condition: 'be.visible'
 * });
 */
export const waitForElementWithRetry = (selector, options = {}) => {
  const {
    timeout = 10000,
    retryInterval = 500,
    condition = 'be.visible',
    maxRetries = 20,
  } = options;

  const attemptWait = (attempt = 1) => {
    return cy.get('body').then(() => {
      if (Cypress.$(selector).length > 0) {
        return cy.get(selector).should(condition);
      } else if (attempt < maxRetries) {
        cy.wait(retryInterval);
        return attemptWait(attempt + 1);
      } else {
        throw new Error(`Element not found after ${maxRetries} attempts: ${selector}`);
      }
    });
  };

  return attemptWait();
};
