/**
 * Mock implementation of ActionCable for testing
 * This class focuses purely on ActionCable protocol and consumer behavior.
 * It's independent of the WebSocket transport layer.
 *
 * @class ActionCableMock
 * @example
 * const mock = new ActionCableMock();
 * const subscription = mock.subscribe('ChatChannel');
 * subscription.perform('speak', { message: 'Hello' });
 */
export class ActionCableMock {
  /**
   * Creates a new ActionCable mock instance
   * Automatically connects and sets up subscription tracking
   */
  constructor() {
    // Internal array of subscriptions
    this._subscriptionsList = [];

    // Track sent messages for test verification
    this.sentMessages = [];

    // Connection status
    this.connected = false;

    // Server ID for debugging
    this.server_id = Math.random().toString(36).substring(2, 15);

    console.log(`[ActionCableMock ${this.server_id}] Initialized`);

    // Connect immediately without delay
    this.connect();
  }

  /**
   * Subscribe to a channel
   * Creates a new subscription or returns existing one if already subscribed
   *
   * @param {string|object} channelIdentifier - The channel identifier (e.g., 'ChatChannel' or { channel: 'ChatChannel', room: 'general' })
   * @returns {object} The subscription object with perform, unsubscribe, connected, disconnected, and received methods
   * @example
   * const subscription = mock.subscribe('ChatChannel');
   * subscription.perform('speak', { message: 'Hello' });
   *
   * @example
   * const subscription = mock.subscribe({ channel: 'ChatChannel', room: 'general' });
   */
  subscribe(channelIdentifier) {
    // Convert to string if object
    const identifier =
      typeof channelIdentifier === 'string' ? channelIdentifier : JSON.stringify(channelIdentifier);

    console.log(`[ActionCableMock ${this.server_id}] Subscribing to:`, identifier);

    // Check if already subscribed
    const existingSub = this._subscriptionsList.find(sub => sub.identifier === identifier);
    if (existingSub) {
      console.log(`[ActionCableMock ${this.server_id}] Already subscribed to:`, identifier);
      return existingSub;
    }

    // Create a new subscription object that mimics the real ActionCable subscription
    const subscription = {
      identifier,
      callbacks: {
        connected: [],
        disconnected: [],
        received: [],
      },

      // Perform an action (e.g., 'speak')
      perform: (action, data) => {
        console.log(`[ActionCableMock ${this.server_id}] Perform:`, action, data);

        // Ensure sentMessages array exists
        if (!this.sentMessages) {
          this.sentMessages = [];
        }

        // Record the sent message for test verification
        const messageData = {
          identifier,
          data: JSON.stringify({ action, ...data }),
        };
        this.sentMessages.push(messageData);
      },

      // Unsubscribe from the channel
      unsubscribe: () => {
        console.log(`[ActionCableMock ${this.server_id}] Unsubscribing from:`, identifier);
        const index = this._subscriptionsList.findIndex(sub => sub.identifier === identifier);
        if (index !== -1) {
          this._subscriptionsList.splice(index, 1);
        }
      },

      // Add connected callback
      connected: callback => {
        console.log(
          `[ActionCableMock ${this.server_id}] Adding connected callback for:`,
          identifier
        );
        if (typeof callback === 'function') {
          subscription.callbacks.connected.push(callback);
          // If already connected, call the callback immediately
          if (this.connected) {
            callback.call(subscription);
          }
        }
        return subscription;
      },

      // Add disconnected callback
      disconnected: callback => {
        console.log(
          `[ActionCableMock ${this.server_id}] Adding disconnected callback for:`,
          identifier
        );
        if (typeof callback === 'function') {
          subscription.callbacks.disconnected.push(callback);
          // If already disconnected, call the callback immediately
          if (!this.connected) {
            callback.call(subscription);
          }
        }
        return subscription;
      },

      // Add received callback
      received: callback => {
        console.log(
          `[ActionCableMock ${this.server_id}] Adding received callback for:`,
          identifier
        );
        if (typeof callback === 'function') {
          subscription.callbacks.received.push(callback);
        }
        return subscription;
      },
    };

    // Add to subscriptions list
    this._subscriptionsList.push(subscription);
    return subscription;
  }

  /**
   * Get the subscriptions property to match ActionCable API
   * This getter returns an object that mimics the ActionCable subscriptions interface
   *
   * @returns {object} Subscriptions interface with create method
   * @example
   * const subscription = mock.subscriptions.create('ChatChannel', {
   *   connected: () => console.log('Connected'),
   *   received: (data) => console.log('Received:', data)
   * });
   */
  get subscriptions() {
    return {
      // Main method that creates a subscription - matches ActionCable's API
      create: (channelIdentifier, callbacks = {}) => {
        console.log(
          `[ActionCableMock ${this.server_id}] Creating subscription for:`,
          channelIdentifier
        );

        // Create the subscription
        const subscription = this.subscribe(channelIdentifier);

        // Add callbacks if provided
        if (callbacks.connected && typeof callbacks.connected === 'function') {
          subscription.connected(callbacks.connected);
        }

        if (callbacks.disconnected && typeof callbacks.disconnected === 'function') {
          subscription.disconnected(callbacks.disconnected);
        }

        if (callbacks.received && typeof callbacks.received === 'function') {
          subscription.received(callbacks.received);
        }

        return subscription;
      },
    };
  }

  /**
   * Get all active subscriptions for testing and debugging
   *
   * @returns {Array<object>} Array of subscription objects
   * @example
   * const subscriptions = mock.getSubscriptions();
   * console.log(`Active subscriptions: ${subscriptions.length}`);
   */
  getSubscriptions() {
    return this._subscriptionsList || [];
  }

  /**
   * Simulate receiving a message on a specific channel
   * This method mimics the server sending a message to the client
   *
   * @param {string|object} channelIdentifier - Channel identifier (must match subscription identifier)
   * @param {object} data - Message data to deliver to subscription callbacks
   * @returns {boolean} True if any callbacks were successfully called, false otherwise
   * @throws {Error} If subscriptions list is not properly initialized
   * @example
   * mock.simulateReceive('ChatChannel', { message: 'Hello', user: 'Alice' });
   *
   * @example
   * mock.simulateReceive({ channel: 'ChatChannel', room: 'general' }, { message: 'Hello' });
   */
  simulateReceive(channelIdentifier, data) {
    // Convert to string if object
    const identifier =
      typeof channelIdentifier === 'string' ? channelIdentifier : JSON.stringify(channelIdentifier);

    console.log(`[ActionCableMock ${this.server_id}] Simulating message on:`, identifier);
    console.log(`[ActionCableMock ${this.server_id}] Message data:`, data);

    // Check if the subscriptions list exists
    if (!this._subscriptionsList || !Array.isArray(this._subscriptionsList)) {
      console.error(`[ActionCableMock ${this.server_id}] No valid subscriptions list`);
      return false;
    }

    // Find all matching subscriptions
    const subscriptions = this._subscriptionsList.filter(sub => sub.identifier === identifier);

    // Handle case where no subscriptions are found
    if (subscriptions.length === 0) {
      console.warn(`[ActionCableMock ${this.server_id}] No subscriptions found for:`, identifier);

      // Emit an event that tests can listen for
      const event = new CustomEvent('actioncable:message:unhandled', {
        detail: { channelIdentifier, data },
      });
      document.dispatchEvent(event);
      return false;
    }

    // Process all matching subscriptions
    console.log(
      `[ActionCableMock ${this.server_id}] Found ${subscriptions.length} subscription(s)`
    );
    let handledCount = 0;

    subscriptions.forEach(subscription => {
      // Make sure the subscription has callbacks
      if (subscription.callbacks && Array.isArray(subscription.callbacks.received)) {
        // Call each callback with the message data
        subscription.callbacks.received.forEach(callback => {
          try {
            // Use .call to set the "this" context to the subscription
            callback.call(subscription, data);
            handledCount++;
          } catch (error) {
            console.error(`[ActionCableMock ${this.server_id}] Error in callback:`, error);
          }
        });
      } else {
        console.warn(`[ActionCableMock ${this.server_id}] Subscription has no received callbacks`);
      }
    });

    return handledCount > 0;
  }

  /**
   * Simulate disconnection from Action Cable server
   * Calls all disconnected callbacks and dispatches a custom event
   *
   * @returns {boolean} Always returns true
   * @fires actioncable:disconnected
   * @example
   * mock.disconnect();
   * // All subscription disconnected callbacks will be called
   */
  disconnect() {
    this.connected = false;
    console.log(`[ActionCableMock ${this.server_id}] Disconnecting...`);

    // Call disconnected callbacks for all subscriptions
    if (this._subscriptionsList && Array.isArray(this._subscriptionsList)) {
      this._subscriptionsList.forEach(subscription => {
        if (
          subscription &&
          subscription.callbacks &&
          Array.isArray(subscription.callbacks.disconnected)
        ) {
          subscription.callbacks.disconnected.forEach(callback => {
            try {
              callback.call(subscription);
            } catch (error) {
              console.error(
                `[ActionCableMock ${this.server_id}] Error in disconnect callback:`,
                error
              );
            }
          });
        }
      });
    }

    // Emit event for testing
    const event = new CustomEvent('actioncable:disconnected');
    document.dispatchEvent(event);

    return true;
  }

  /**
   * Simulate connection or reconnection to Action Cable server
   * Calls all connected callbacks for existing subscriptions and dispatches a custom event
   *
   * @returns {boolean} Always returns true
   * @fires actioncable:connected
   * @example
   * mock.connect();
   * // All subscription connected callbacks will be called
   */
  connect() {
    this.connected = true;
    console.log(`[ActionCableMock ${this.server_id}] Connecting...`);

    // Call connected callbacks for all subscriptions
    if (this._subscriptionsList && Array.isArray(this._subscriptionsList)) {
      this._subscriptionsList.forEach(subscription => {
        if (
          subscription &&
          subscription.callbacks &&
          Array.isArray(subscription.callbacks.connected)
        ) {
          subscription.callbacks.connected.forEach(callback => {
            try {
              callback.call(subscription);
            } catch (error) {
              console.error(
                `[ActionCableMock ${this.server_id}] Error in connect callback:`,
                error
              );
            }
          });
        }
      });
    }

    // Emit event for testing
    const event = new CustomEvent('actioncable:connected');
    document.dispatchEvent(event);

    return true;
  }

  /**
   * Simulate temporary network interruption
   * Disconnects, waits for specified duration, then reconnects
   *
   * @param {number} [duration=3000] - How long to stay disconnected in milliseconds
   * @returns {Promise<boolean>} Resolves to true when reconnected
   * @example
   * await mock.simulateNetworkInterruption(5000); // 5 second interruption
   * console.log('Connection restored');
   */
  simulateNetworkInterruption(duration = 3000) {
    console.log(
      `[ActionCableMock ${this.server_id}] Simulating network interruption for ${duration}ms`
    );
    this.disconnect();

    return new Promise(resolve => {
      setTimeout(() => {
        this.connect();
        resolve(true);
      }, duration);
    });
  }

  /**
   * Helper method for testing that converts a simple channel name to proper format
   * Simplifies sending messages by accepting separate channel name and params
   *
   * @param {string} channelName - Simple channel name like "ChatChannel"
   * @param {object} [params={}] - Channel parameters like { room: 'general', user_id: 123 }
   * @param {object} [data={}] - Message data to send to the channel
   * @returns {boolean} True if message was delivered successfully, false otherwise
   * @throws {Error} If channelName is not a string
   * @example
   * mock.sendToChannel('ChatChannel', { room: 'general' }, { message: 'Hello' });
   *
   * @example
   * mock.sendToChannel('BankIdChannel', { user_id: 123 }, { status: 'complete' });
   */
  sendToChannel(channelName, params = {}, data = {}) {
    if (typeof channelName !== 'string') {
      console.error(`[ActionCableMock ${this.server_id}] Channel name must be a string`);
      return false;
    }

    // Create proper channel identifier
    const channelIdentifier = { channel: channelName, ...params };

    // Send the message using the standard method
    return this.simulateReceive(channelIdentifier, data);
  }

  /**
   * Check if the Action Cable connection is currently active
   *
   * @returns {boolean} - True if connected, false otherwise
   */
  isConnected() {
    return this.connected === true;
  }

  /**
   * Get all tracked messages for test verification
   *
   * @returns {Array} - Array of sent messages
   */
  getMessages() {
    return this.sentMessages || [];
  }

  /**
   * Clear all tracked messages
   * Useful for resetting state between test assertions
   */
  clearMessages() {
    this.sentMessages = [];
  }
}
