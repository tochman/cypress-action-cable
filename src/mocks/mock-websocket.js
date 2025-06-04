// WebSocket Mock with ActionCable Integration for Testing
// 
// RESPONSIBILITIES:
// 1. WebSocket Transport Layer: Manages WebSocket connections and message passing
// 2. ActionCable Protocol Integration: Handles ActionCable-specific message formats
// 3. Test Environment Setup: Provides unified interface for Cypress tests
//
// SEPARATION OF CONCERNS:
// - WebSocket Server: Uses mock-socket library for transport simulation
// - ActionCable Mock: Uses action-cable-mock.js for protocol behavior
// - Integration: This file connects the two layers for seamless testing
//
import { Server } from 'mock-socket';
import { ActionCableMock } from './action-cable-mock';

// Default WebSocket URL - we'll use this for the mock server
const DEFAULT_WS_URL = 'ws://localhost:3000/cable';
const WS_URL = DEFAULT_WS_URL;

// Store mock instances for re-use
let mockServer = null;
let actionCableMock = null;

// Set up the mock server and ActionCable
export const setupMockActionCable = () => {
  // Create a new mock WebSocket server
  mockServer = new Server(WS_URL);
  
  // Create a new ActionCable mock with proper initialization
  actionCableMock = new ActionCableMock();
  
  console.log('Mock ActionCable initialized:', actionCableMock);
  
  // Handle connections
  mockServer.on('connection', socket => {
    console.log('Mock WebSocket connection established');
    
    // Handle messages from the client
    socket.on('message', data => {
      try {
        const message = JSON.parse(data);
        console.log('Received WebSocket message:', message);
        
        // Handle subscription requests
        if (message.command === 'subscribe') {
          const identifier = JSON.parse(message.identifier);
          // Subscribe to the channel
          actionCableMock.subscribe(identifier);
          
          // Send confirmation
          socket.send(JSON.stringify({
            type: 'confirm_subscription',
            identifier: message.identifier
          }));
          
          console.log('Subscription confirmed:', identifier);
        }
        
        // Handle actions
        else if (message.command === 'message') {
          const identifier = JSON.parse(message.identifier);
          const data = JSON.parse(message.data);
          console.log('Handling action:', data.action, 'for channel:', identifier);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    // Send welcome message (this is what ActionCable does)
    socket.send(JSON.stringify({
      type: 'welcome'
    }));
  });
  
  // Replace window.App.cable with our mock for testing
  window.App = window.App || {};
  window.App.cable = actionCableMock;
  
  // Also expose the mock for direct access if needed
  window.mockActionCable = actionCableMock;
  
  console.log('Mock WebSocket server running on:', WS_URL);
  
  return { mockServer, actionCableMock };
};

// Teardown function
export const teardownMockActionCable = () => {
  if (mockServer) {
    mockServer.stop();
    mockServer = null;
  }
  
  if (actionCableMock) {
    actionCableMock.disconnect();
    actionCableMock = null;
  }
  
  // Clear the mocked cable
  if (window.App && window.App.cable) {
    delete window.App.cable;
  }
  
  if (window.mockActionCable) {
    delete window.mockActionCable;
  }
  
  console.log('Mock ActionCable torn down');
};
