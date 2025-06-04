/**
 * Cypress Action Cable Helper Utilities
 * 
 * These helper functions provide simplified, reliable patterns for Action Cable testing
 * inspired by real-world usage patterns.
 */

/**
 * Send a message to Action Cable channel with simplified, reliable API
 * Ensures connection is ready and sends message immediately without waiting
 * 
 * @param channel - The channel name or channel object
 * @param data - The message data to send
 * @param options - Optional configuration
 */
export const sendActionCableMessage = (
  channel: string | object, 
  data: any, 
  options: { timeout?: number } = {}
) => {
  return cy.window().then(win => {
    // Ensure consumer is always available and connected
    if (!(win as any)._actionCableConsumer) {
      throw new Error('Action Cable consumer not found. Make sure to call cy.mockActionCable() first.');
    }
    
    const consumer = (win as any)._actionCableConsumer;
    consumer.connected = true; // Force connection state for reliability
    
    // Send message directly without waiting
    return (cy as any).sendToChannel(consumer, channel, data);
  });
};

/**
 * Force Action Cable connection to be ready immediately
 * Eliminates flaky connection waiting in tests
 * 
 * @param url - Optional WebSocket URL
 * @param options - Optional consumer options
 */
export const forceActionCableConnection = (
  url: string = 'ws://localhost:3000/cable',
  options: any = {}
) => {
  return cy.window().then(win => {
    // Ensure consumer exists and is connected
    if (!(win as any)._actionCableConsumer) {
      const { createMockActionCable } = require('../mocks/MockActionCable');
      (win as any)._actionCableConsumer = createMockActionCable(url, options);
    }
    
    const consumer = (win as any)._actionCableConsumer;
    consumer.connected = true;
    consumer.isConnected = true;
    
    return cy.wrap(consumer);
  });
};

/**
 * Subscribe to channel with immediate connection guarantee
 * No waiting - subscription is ready immediately
 * 
 * @param channel - Channel name or channel object
 * @param callbacks - Channel callbacks
 * @param options - Subscription options
 */
export const subscribeImmediately = (
  channel: string | object,
  callbacks: any = {},
  options: { timeout?: number } = {}
) => {
  return forceActionCableConnection().then(consumer => {
    return (cy as any).subscribeToChannel(consumer, channel, callbacks).then((subscription: any) => {
      // Force subscription to be connected immediately
      subscription.connected = true;
      subscription.isSubscribed = true;
      
      // Trigger connected callback if provided
      if (callbacks.connected) {
        callbacks.connected();
      }
      
      return cy.wrap(subscription);
    });
  });
};

/**
 * Simulate incoming message with reduced latency for faster tests
 * 
 * @param channel - Channel name or channel object
 * @param data - Message data
 * @param delay - Optional delay (default: 0 for immediate)
 */
export const receiveMessageImmediately = (
  channel: string | object,
  data: any,
  delay: number = 0
) => {
  return cy.window().then(win => {
    const consumer = (win as any)._actionCableConsumer;
    if (!consumer) {
      throw new Error('Action Cable consumer not found. Call forceActionCableConnection() first.');
    }
    
    if (delay > 0) {
      cy.wait(delay);
    }
    
    return (cy as any).simulateIncomingMessage(consumer, channel, data);
  });
};

/**
 * Assert Action Cable message was sent with retry capability
 * Enhanced assertion that automatically retries for better stability
 * 
 * @param expectedData - Expected message data
 * @param options - Assertion options
 */
export const assertMessageSent = (
  expectedData: any,
  options: { timeout?: number; retries?: number } = {}
) => {
  const { timeout = 5000, retries = 3 } = options;
  
  let attempt = 0;
  const checkMessage = (): any => {
    attempt++;
    
    return (cy as any).getActionCableMessages().then((messages: any[]) => {
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
      
      // Use Cypress expect
      cy.wrap({ found }).should('have.property', 'found', true);
    });
  };
  
  return checkMessage();
};

/**
 * Clear all Action Cable state for clean test isolation
 * More thorough than individual cleanup commands
 */
export const cleanActionCableState = () => {
  return cy.window().then(win => {
    // Clear message history
    if ((win as any)._actionCableConsumer) {
      if (typeof (win as any)._actionCableConsumer.clearMessageHistory === 'function') {
        (win as any)._actionCableConsumer.clearMessageHistory();
      }
    }
    
    // Clear Cypress message storage
    if ((win as any).cy && (win as any).cy.actionCableMessages) {
      (win as any).cy.actionCableMessages = [];
    }
    
    // Reset connection state
    if ((win as any)._actionCableConsumer) {
      (win as any)._actionCableConsumer.connected = false;
      (win as any)._actionCableConsumer.isConnected = false;
    }
  });
};

/**
 * Setup Action Cable for testing with enhanced defaults
 * One-command setup for most test scenarios with optimized settings
 * 
 * @param url - WebSocket URL
 * @param options - Configuration options
 */
export const setupActionCable = (
  url: string = 'ws://localhost:3000/cable',
  options: any = {}
) => {
  const defaultOptions = {
    debug: false,
    messageHistory: true,
    networkSimulation: { enabled: false },
    connectionDelay: 0, // No delays for faster tests
    subscriptionDelay: 0,
    ...options
  };
  
  (cy as any).mockActionCable(url, defaultOptions);
  return forceActionCableConnection(url, defaultOptions);
};

/**
 * Complete Action Cable test teardown
 * Ensures clean state for next test
 */
export const teardownActionCable = () => {
  cleanActionCableState();
  (cy as any).disconnectActionCable();
};
