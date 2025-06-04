// Export types
export * from './types';

// Export mocks
export { MockWebSocket } from './mocks/MockWebSocket';
export { 
  MockActionCableConsumer, 
  MockActionCableSubscription,
  MockActionCableSubscriptions,
  createMockActionCable,
  createMockActionCableServer
} from './mocks/MockActionCable';

// Note: Helper utilities are available through Cypress commands
// See src/commands/commands.js for reliability helper commands

// Helper functions for easier setup
export const setupActionCableMocking = (url: string = 'ws://localhost:3000/cable', options: any = {}) => {
  if (typeof window !== 'undefined') {
    const { MockWebSocket } = require('./mocks/MockWebSocket');
    const { createMockActionCable } = require('./mocks/MockActionCable');
    
    // This is for direct usage, not through Cypress commands
    (window as any).WebSocket = MockWebSocket;
    
    if ((window as any).ActionCable) {
      (window as any)._originalActionCable = (window as any).ActionCable;
    }

    (window as any).ActionCable = {
      createConsumer: (consumerUrl?: string) => {
        return createMockActionCable(consumerUrl || url, options);
      }
    };
  }
};

export const teardownActionCableMocking = () => {
  if (typeof window !== 'undefined') {
    // Disconnect any existing consumers
    if ((window as any)._actionCableConsumer) {
      (window as any)._actionCableConsumer.disconnect();
      delete (window as any)._actionCableConsumer;
    }
    
    if ((window as any)._originalActionCable) {
      (window as any).ActionCable = (window as any)._originalActionCable;
      delete (window as any)._originalActionCable;
    }
    
    try {
      (window as any).WebSocket = WebSocket;
    } catch {
      // WebSocket might not be available in all environments
    }
  }
};
