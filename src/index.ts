// Export types
export * from './types';

// Export mocks
export { MockWebSocket } from './mocks/MockWebSocket';
export { 
  MockActionCable, 
  MockActionCableConsumer, 
  MockActionCableSubscription,
  MockActionCableSubscriptions 
} from './mocks/MockActionCable';

// Helper functions for easier setup
export const setupActionCableMocking = (url: string = 'ws://localhost:3000/cable', options: any = {}) => {
  if (typeof window !== 'undefined') {
    const { MockWebSocket } = require('./mocks/MockWebSocket');
    const { MockActionCable } = require('./mocks/MockActionCable');
    
    // This is for direct usage, not through Cypress commands
    (window as any).WebSocket = MockWebSocket;
    
    if ((window as any).ActionCable) {
      (window as any)._originalActionCable = (window as any).ActionCable;
    }

    (window as any).ActionCable = {
      createConsumer: (consumerUrl?: string) => {
        return MockActionCable.createConsumer(consumerUrl || url, options);
      }
    };
  }
};

export const teardownActionCableMocking = () => {
  if (typeof window !== 'undefined') {
    const { MockActionCable } = require('./mocks/MockActionCable');
    MockActionCable.disconnectAll();
    
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
