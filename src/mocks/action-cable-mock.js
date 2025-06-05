/**
 * Mock implementation of ActionCable for testing
 * This class focuses purely on ActionCable protocol and consumer behavior
 * It's independent of WebSocket transport layer
 *
 */
export class ActionCableMock {
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
   * 
   * @param {string|object} channelIdentifier - The channel identifier
   * @returns {object} - The subscription object
   */
  subscribe(channelIdentifier) {
    // Convert to string if object
    const identifier = typeof channelIdentifier === 'string' 
      ? channelIdentifier 
      : JSON.stringify(channelIdentifier);
    
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
      connected: (callback) => {
        console.log(`[ActionCableMock ${this.server_id}] Adding connected callback for:`, identifier);
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
      disconnected: (callback) => {
        console.log(`[ActionCableMock ${this.server_id}] Adding disconnected callback for:`, identifier);
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
      received: (callback) => {
        console.log(`[ActionCableMock ${this.server_id}] Adding received callback for:`, identifier);
        if (typeof callback === 'function') {
          subscription.callbacks.received.push(callback);
        }
        return subscription;
      }
    };

    // Add to subscriptions list
    this._subscriptionsList.push(subscription);
    return subscription;
  }

  /**
   * Create subscriptions property to match ActionCable API
   * This getter returns an object that mimics the ActionCable subscriptions interface
   */
  get subscriptions() {
    return {
      // Main method that creates a subscription - matches ActionCable's API
      create: (channelIdentifier, callbacks = {}) => {
        console.log(`[ActionCableMock ${this.server_id}] Creating subscription for:`, channelIdentifier);
        
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
      }
    };
  }
  
  /**
   * Get all active subscriptions for testing and debugging
   */
  getSubscriptions() {
    return this._subscriptionsList || [];
  }

  /**
   * Simulate receiving a message on a specific channel
   * This method mimics the server sending a message to the client
   * 
   * @param {string|object} channelIdentifier - Channel identifier
   * @param {object} data - Message data
   * @returns {boolean} - Whether any callbacks were successfully called
   */
  simulateReceive(channelIdentifier, data) {
    // Convert to string if object
    const identifier = typeof channelIdentifier === 'string' 
      ? channelIdentifier 
      : JSON.stringify(channelIdentifier);
      
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
        detail: { channelIdentifier, data }
      });
      document.dispatchEvent(event);
      return false;
    }
    
    // Process all matching subscriptions
    console.log(`[ActionCableMock ${this.server_id}] Found ${subscriptions.length} subscription(s)`);
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

  // Simulate disconnection
  disconnect() {
    this.connected = false;
    console.log(`[ActionCableMock ${this.server_id}] Disconnecting...`);
    
    // Call disconnected callbacks for all subscriptions
    if (this._subscriptionsList && Array.isArray(this._subscriptionsList)) {
      this._subscriptionsList.forEach(subscription => {
        if (subscription && subscription.callbacks && Array.isArray(subscription.callbacks.disconnected)) {
          subscription.callbacks.disconnected.forEach(callback => {
            try {
              callback.call(subscription);
            } catch (error) {
              console.error(`[ActionCableMock ${this.server_id}] Error in disconnect callback:`, error);
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

  // Simulate reconnection
  connect() {
    this.connected = true;
    console.log(`[ActionCableMock ${this.server_id}] Connecting...`);
    
    // Call connected callbacks for all subscriptions
    if (this._subscriptionsList && Array.isArray(this._subscriptionsList)) {
      this._subscriptionsList.forEach(subscription => {
        if (subscription && subscription.callbacks && Array.isArray(subscription.callbacks.connected)) {
          subscription.callbacks.connected.forEach(callback => {
            try {
              callback.call(subscription);
            } catch (error) {
              console.error(`[ActionCableMock ${this.server_id}] Error in connect callback:`, error);
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
   * Simulate temporary connection interruption
   * 
   * @param {number} duration - How long to stay disconnected (ms)
   * @returns {Promise} - Resolves when reconnected
   */
  simulateNetworkInterruption(duration = 3000) {
    console.log(`[ActionCableMock ${this.server_id}] Simulating network interruption for ${duration}ms`);
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
   * Example: sendToChannel("BankIdChannel", { user_id: 123 }, { status: "complete" })
   * 
   * @param {string} channelName - Simple channel name like "BankIdChannel"
   * @param {object} params - Channel parameters like { user_id: 123 }
   * @param {object} data - Message data to send
   * @returns {boolean} - Success status
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
}
