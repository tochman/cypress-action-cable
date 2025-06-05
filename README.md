# Cypress Action Cable Plugin

A Cypress plugin for testing Action Cable WebSocket connections. Built using proven patterns from production applications handling complex real-time scenarios like BankID authentication flows.

## Features

- **Production-Proven Architecture**: Based on patterns tested in complex applications
- **3-Layer Architecture**: Separated WebSocket transport, Action Cable protocol, and Cypress integration
- **Mock WebSocket Support**: Uses mock-socket library for reliable, deterministic testing
- **Full Action Cable Protocol**: Complete Rails Action Cable implementation with subscriptions, commands, and message handling
- **Network Simulation**: Test reconnection, interruptions, and offline scenarios
- **Message Tracking**: Comprehensive tracking and assertion capabilities for sent/received messages
- **TypeScript Support**: Full type definitions for enhanced development experience
- **Real-World Testing**: Handles complex scenarios like authentication flows, real-time updates, and error conditions

## Architecture Overview

This plugin implements a sophisticated 3-layer architecture proven in production:

### Layer 1: WebSocket Transport (`mock-websocket.js`)
- Mock WebSocket implementation using mock-socket library
- Handles connection lifecycle, message routing, and network simulation
- Provides reliable, deterministic WebSocket behavior for testing

### Layer 2: Action Cable Protocol (`action-cable-mock.js`)
- Complete Action Cable protocol implementation
- Subscription management with proper identifier handling
- Message formatting following Rails Action Cable specifications
- Connection state management and error handling

### Layer 3: Cypress Integration (`commands.js`)
- Intuitive `cy.ac*` commands for common testing patterns
- Chainable command structure following Cypress conventions
- Helper utilities for complex testing scenarios

## Installation

### From GitHub

```bash
npm install --save-dev https://github.com/tochman/cypress-action-cable.git
```

### From npm (when published)

```bash
npm install --save-dev cypress-action-cable
```

## Quick Start

1. **Install the plugin**:
   ```bash
   npm install --save-dev https://github.com/tochman/cypress-action-cable.git
   ```

2. **Add to your Cypress commands** (`cypress/support/commands.js`):
   ```javascript
   import 'cypress-action-cable'
   ```

3. **Start testing complex real-time scenarios**:
   ```javascript
   describe('BankID Authentication Flow', () => {
     beforeEach(() => {
       cy.mockActionCable('wss://app.example.com/cable')
       cy.visit('/auth/bankid')
     })

     it('handles authentication flow with status updates', () => {
       // Subscribe to authentication channel
       cy.acSubscribe('AuthenticationChannel', { 
         user_id: 123, 
         session_token: 'abc123' 
       })

       // Wait for subscription confirmation
       cy.acWaitForSubscription('AuthenticationChannel', { user_id: 123 })

       // Simulate authentication status updates
       cy.acSimulateConversation('AuthenticationChannel', [
         { type: 'incoming', data: { status: 'pending', message: 'Waiting for BankID...' } },
         { type: 'incoming', data: { status: 'processing', message: 'Verifying identity...' }, delay: 2000 },
         { type: 'incoming', data: { status: 'success', redirect_url: '/dashboard' }, delay: 3000 }
       ], { user_id: 123 })

       // Verify UI updates
       cy.contains('Waiting for BankID...').should('be.visible')
       cy.contains('Verifying identity...').should('be.visible')
       cy.url().should('include', '/dashboard')
     })

     it('handles network interruptions gracefully', () => {
       cy.acSubscribe('NotificationChannel')
       
       // Simulate network interruption
       cy.acSimulateNetworkInterruption(5000)
       
       // Verify reconnection behavior
       cy.acWaitForConnection(10000)
       cy.acGetMessages().should('contain', { type: 'system', status: 'reconnected' })
     })

     afterEach(() => {
       cy.acDisconnect()
     })
   })
   ```

## Setup

### 1. Add to Cypress Commands

In `cypress/support/e2e.js` or `cypress/support/commands.js`:

```javascript
import 'cypress-action-cable'
```

### 2. TypeScript Support (Optional)

In `cypress/tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["cypress", "cypress-action-cable"]
  }
}
```

## API Reference

### Core Commands

#### `cy.mockActionCable(url?, options?)`
Initialize Action Cable mocking with the 3-layer architecture. Call this in your `beforeEach` hook.

```javascript
cy.mockActionCable() // Uses default ws://localhost:3000/cable
cy.mockActionCable('wss://app.example.com/cable')
cy.mockActionCable('ws://localhost:4000/cable', { 
  debug: true,
  reconnectInterval: 1000 
})
```

**Parameters:**
- `url` (string, optional): WebSocket URL to mock. Default: 'ws://localhost:3000/cable'
- `options` (object, optional): Configuration options for the mock

#### `cy.acSubscribe(channelName, params?)`
Subscribe to an Action Cable channel with proper subscription management.

```javascript
// Simple channel subscription
cy.acSubscribe('NotificationChannel')

// Channel with parameters
cy.acSubscribe('ChatChannel', { room: 'general' })

// Object-style channel definition
cy.acSubscribe({ channel: 'UserChannel', user_id: 123 })
```

**Parameters:**
- `channelName` (string | object): Channel name or channel object
- `params` (object, optional): Channel parameters

#### `cy.acReceiveMessage(channelName, data, params?)`
Simulate receiving a message on a subscribed channel.

```javascript
// Simple message
cy.acReceiveMessage('ChatChannel', { message: 'Hello!' })

// Message with channel parameters
cy.acReceiveMessage('ChatChannel', { message: 'Hello!' }, { room: 'general' })

// Complex message data
cy.acReceiveMessage('AuthenticationChannel', {
  status: 'success',
  user: { id: 123, name: 'John Doe' },
  redirect_url: '/dashboard'
}, { session_id: 'abc123' })
```

**Parameters:**
- `channelName` (string | object): Target channel
- `data` (any): Message data to receive
- `params` (object, optional): Channel parameters if needed

### Advanced Commands

#### `cy.acSimulateConversation(channelName, messages, params?)`
Simulate a complex conversation with multiple messages and timing. Perfect for testing authentication flows, real-time updates, and user interactions.

```javascript
// BankID authentication flow
cy.acSimulateConversation('AuthenticationChannel', [
  { 
    type: 'incoming', 
    data: { status: 'pending', message: 'Please open your BankID app' } 
  },
  { 
    type: 'incoming', 
    data: { status: 'processing', message: 'Verifying your identity...' }, 
    delay: 2000 
  },
  { 
    type: 'incoming', 
    data: { status: 'success', redirect: '/dashboard' }, 
    delay: 3000 
  }
], { user_id: 123 })

// Chat conversation
cy.acSimulateConversation('ChatChannel', [
  { type: 'outgoing', action: 'send_message', data: { message: 'Hello' } },
  { type: 'incoming', data: { user: 'Bot', message: 'Hi there!' }, delay: 500 },
  { type: 'incoming', data: { user: 'Bot', message: 'How can I help?' }, delay: 1000 }
], { room: 'support' })
```

**Parameters:**
- `channelName` (string | object): Target channel
- `messages` (array): Array of conversation messages
- `params` (object, optional): Channel parameters

**Message Format:**
- `type`: 'incoming' | 'outgoing'
- `data`: Message data
- `action` (optional): Action name for outgoing messages
- `delay` (optional): Delay in milliseconds before sending

#### `cy.acSimulateNetworkInterruption(duration?)`
Simulate network interruption to test reconnection behavior.

```javascript
// Simulate 5-second network outage
cy.acSimulateNetworkInterruption(5000)

// Default 3-second interruption
cy.acSimulateNetworkInterruption()
```

**Parameters:**
- `duration` (number, optional): Interruption duration in milliseconds. Default: 3000

#### `cy.acWaitForConnection(timeout?)`
Wait for Action Cable connection to be established.

```javascript
// Wait for connection with default timeout
cy.acWaitForConnection()

// Wait up to 10 seconds for connection
cy.acWaitForConnection(10000)
```

**Parameters:**
- `timeout` (number, optional): Timeout in milliseconds. Default: 5000

#### `cy.acWaitForSubscription(channelName, params?, timeout?)`
Wait for subscription to be confirmed.

```javascript
// Wait for simple subscription
cy.acWaitForSubscription('NotificationChannel')

// Wait for subscription with parameters
cy.acWaitForSubscription('ChatChannel', { room: 'general' })

// Wait with custom timeout
cy.acWaitForSubscription('ChatChannel', { room: 'general' }, 10000)
```

**Parameters:**
- `channelName` (string | object): Channel to wait for
- `params` (object, optional): Channel parameters
- `timeout` (number, optional): Timeout in milliseconds. Default: 5000

### Utility Commands

#### `cy.acSubscription(channelName, params?)`
Get a subscription object for a channel.

```javascript
cy.acSubscription('ChatChannel', { room: 'general' })
  .should('have.property', 'connected', true)
```

#### `cy.acGetMessages()`
Get all tracked Action Cable messages.

```javascript
cy.acGetMessages()
  .should('have.length', 3)
  .should('contain', { type: 'incoming', data: { message: 'Hello' } })
```

#### `cy.acClearMessages()`
Clear all tracked messages.

```javascript
cy.acClearMessages()
cy.acGetMessages().should('have.length', 0)
```

#### `cy.acAssertMessageSent(expectedData, options?)`
Assert that a specific message was sent.

```javascript
// Assert exact message match
cy.acAssertMessageSent({ action: 'send_message', data: { message: 'Hello' } })

// Assert partial match
cy.acAssertMessageSent({ message: 'Hello' }, { partial: true })
```

#### `cy.acDisconnect()`
Disconnect Action Cable and clean up all mocks.

```javascript
cy.acDisconnect()
```

## Real-World Examples

### BankID Authentication Flow

This example demonstrates testing a complex authentication flow with multiple status updates, similar to those used in production applications.

```javascript
describe('BankID Authentication', () => {
  beforeEach(() => {
    cy.visit('/auth/bankid')
    cy.mockActionCable('wss://api.example.com/cable')
  })

  it('completes authentication flow with real-time updates', () => {
    // Start authentication process
    cy.get('[data-cy=bankid-login]').click()
    
    // Subscribe to authentication channel
    cy.acSubscribe('AuthenticationChannel', { 
      session_id: 'auth_123',
      user_id: 456 
    })
    
    // Wait for subscription to be confirmed
    cy.acWaitForSubscription('AuthenticationChannel', { session_id: 'auth_123' })
    
    // Simulate the complete BankID flow
    cy.acSimulateConversation('AuthenticationChannel', [
      {
        type: 'incoming',
        data: { 
          status: 'pending', 
          message: 'Please open your BankID app',
          qr_code: 'data:image/png;base64,iVBOR...' 
        }
      },
      {
        type: 'incoming',
        data: { 
          status: 'user_sign', 
          message: 'Please confirm your identity in the BankID app' 
        },
        delay: 3000
      },
      {
        type: 'incoming',
        data: { 
          status: 'processing', 
          message: 'Verifying your identity...' 
        },
        delay: 2000
      },
      {
        type: 'incoming',
        data: { 
          status: 'success', 
          message: 'Authentication successful!',
          user: { id: 456, name: 'John Doe', email: 'john@example.com' },
          redirect_url: '/dashboard' 
        },
        delay: 2000
      }
    ], { session_id: 'auth_123' })
    
    // Verify UI updates at each step
    cy.contains('Please open your BankID app').should('be.visible')
    cy.get('[data-cy=qr-code]').should('be.visible')
    
    cy.contains('Please confirm your identity').should('be.visible')
    cy.contains('Verifying your identity').should('be.visible')
    cy.contains('Authentication successful').should('be.visible')
    
    // Verify final redirect
    cy.url().should('include', '/dashboard')
    cy.contains('Welcome, John Doe').should('be.visible')
  })

  it('handles authentication timeout gracefully', () => {
    cy.acSubscribe('AuthenticationChannel', { session_id: 'auth_timeout' })
    
    cy.acReceiveMessage('AuthenticationChannel', {
      status: 'timeout',
      message: 'Authentication timed out. Please try again.',
      error_code: 'AUTH_TIMEOUT'
    }, { session_id: 'auth_timeout' })
    
    cy.contains('Authentication timed out').should('be.visible')
    cy.get('[data-cy=retry-button]').should('be.visible')
  })

  it('recovers from network interruptions', () => {
    cy.acSubscribe('AuthenticationChannel', { session_id: 'auth_network' })
    
    // Simulate network interruption during authentication
    cy.acReceiveMessage('AuthenticationChannel', { 
      status: 'pending', 
      message: 'Starting authentication...' 
    })
    
    // Interrupt network for 5 seconds
    cy.acSimulateNetworkInterruption(5000)
    
    // Verify reconnection and status recovery
    cy.acWaitForConnection(10000)
    cy.acReceiveMessage('AuthenticationChannel', { 
      status: 'reconnected', 
      message: 'Connection restored. Please continue.' 
    })
    
    cy.contains('Connection restored').should('be.visible')
  })

  afterEach(() => {
    cy.acDisconnect()
  })
})
```

### Real-Time Collaboration

```javascript
describe('Collaborative Document Editing', () => {
  beforeEach(() => {
    cy.visit('/documents/123')
    cy.mockActionCable()
  })

  it('handles multiple users editing simultaneously', () => {
    // Subscribe to document collaboration channel
    cy.acSubscribe('DocumentChannel', { 
      document_id: 123, 
      user_id: 456 
    })

    // Simulate other users joining and making edits
    cy.acSimulateConversation('DocumentChannel', [
      {
        type: 'incoming',
        data: { 
          type: 'user_joined', 
          user: { id: 789, name: 'Alice', cursor_color: '#ff0000' } 
        }
      },
      {
        type: 'incoming',
        data: { 
          type: 'text_insert', 
          position: 45, 
          text: 'Hello world!', 
          user_id: 789 
        },
        delay: 1000
      },
      {
        type: 'incoming',
        data: { 
          type: 'cursor_move', 
          position: 57, 
          user_id: 789 
        },
        delay: 500
      }
    ], { document_id: 123 })

    // Verify collaborative indicators
    cy.get('[data-cy=active-users]').should('contain', 'Alice')
    cy.get('[data-cy=user-cursor-789]').should('be.visible')
    cy.get('[data-cy=document-content]').should('contain', 'Hello world!')
  })

  it('preserves changes during network interruptions', () => {
    cy.acSubscribe('DocumentChannel', { document_id: 123 })
    
    // Make local changes
    cy.get('[data-cy=editor]').type('Important content')
    
    // Simulate network interruption
    cy.acSimulateNetworkInterruption(3000)
    
    // Continue editing while offline
    cy.get('[data-cy=editor]').type(' - offline edit')
    
    // Verify offline indicator
    cy.get('[data-cy=connection-status]').should('contain', 'Offline')
    
    // Wait for reconnection
    cy.acWaitForConnection()
    
    // Simulate sync after reconnection
    cy.acReceiveMessage('DocumentChannel', {
      type: 'sync_complete',
      document_state: 'Important content - offline edit',
      conflicts_resolved: 0
    })
    
    cy.get('[data-cy=connection-status]').should('contain', 'Online')
  })

  afterEach(() => {
    cy.acDisconnect()
  })
})
```

### Live Data Updates

```javascript
describe('Dashboard Live Updates', () => {
  beforeEach(() => {
    cy.visit('/dashboard')
    cy.mockActionCable()
  })

  it('updates metrics in real-time', () => {
    // Subscribe to dashboard metrics
    cy.acSubscribe('MetricsChannel')
    
    // Simulate periodic metric updates
    cy.acSimulateConversation('MetricsChannel', [
      {
        type: 'incoming',
        data: { 
          type: 'metrics_update',
          metrics: { 
            active_users: 1250, 
            revenue: 45000, 
            conversion_rate: 3.2 
          }
        }
      },
      {
        type: 'incoming',
        data: { 
          type: 'metrics_update',
          metrics: { 
            active_users: 1267, 
            revenue: 45240, 
            conversion_rate: 3.3 
          }
        },
        delay: 5000
      }
    ])

    // Verify metrics display and updates
    cy.get('[data-cy=active-users]').should('contain', '1,250')
    cy.get('[data-cy=revenue]').should('contain', '$45,000')
    
    // Wait for second update
    cy.get('[data-cy=active-users]').should('contain', '1,267')
    cy.get('[data-cy=revenue]').should('contain', '$45,240')
  })

  it('handles high-frequency updates without overwhelming UI', () => {
    cy.acSubscribe('TickerChannel')
    
    // Simulate rapid price updates
    const priceUpdates = Array.from({ length: 10 }, (_, i) => ({
      type: 'incoming',
      data: { 
        symbol: 'AAPL', 
        price: 150 + (i * 0.5), 
        change: i * 0.5 
      },
      delay: 100 * i
    }))
    
    cy.acSimulateConversation('TickerChannel', priceUpdates)
    
    // Verify final price is displayed (UI should throttle updates)
    cy.get('[data-cy=aapl-price]').should('contain', '154.50')
  })

  afterEach(() => {
    cy.acDisconnect()
  })
})
```

```javascript
## Testing Network Resilience

```javascript
describe('Network Resilience', () => {
  beforeEach(() => {
    cy.mockActionCable('ws://localhost:3000/cable', {
      debug: true,
      networkSimulation: {
        latency: [10, 50]
      }
    });
    cy.visit('/chat');
  });

  it('is expected to handle connection drops gracefully', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        // Subscribe to channel
        cy.subscribeToChannel(consumer, 'ChatChannel');
        
        // Simulate network outage
        cy.simulateNetworkInterruption({
          duration: 3000,
          reconnect: true
        });
        
        // Verify UI shows disconnected state
        cy.get('[data-testid=connection-status]')
          .should('contain', 'Disconnected');
        
        // Wait for reconnection
        cy.waitForActionCableConnection(consumer, { timeout: 10000 });
        
        // Verify UI shows connected state
        cy.get('[data-testid=connection-status]')
          .should('contain', 'Connected');
      });
  });

  it('is expected to queue messages during network freeze', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        // Start network freeze
        cy.simulateNetworkInterruption({
          duration: 2000,
          type: 'freeze'
        });
        
        // Send messages during freeze (should be queued)
        cy.sendToChannel('ChatChannel', { message: 'Message 1' });
        cy.sendToChannel('ChatChannel', { message: 'Message 2' });
        
        // Wait for network to unfreeze
        cy.wait(2500);
        
        // Verify both messages were sent after unfreeze
        cy.shouldHaveActionCableMessage({ message: 'Message 1' });
        cy.shouldHaveActionCableMessage({ message: 'Message 2' });
      });
  });
});
```

```javascript
describe('Chat Conversations', () => {
  beforeEach(() => {
    cy.mockActionCable('ws://localhost:3000/cable');
    cy.visit('/chat/room/1');
  });

  it('is expected to simulate realistic chat flow', () => {
    const chatFlow = [
      // User joins
      { 
        direction: 'outgoing', 
        channel: 'ChatChannel',
        data: { action: 'join', room_id: 1 },
        delay: 100
      },
      // Server confirms join
      { 
        direction: 'incoming', 
        channel: 'ChatChannel',
        data: { type: 'user_joined', user: 'TestUser' },
        delay: 150
      },
      // Send first message
      { 
        direction: 'outgoing', 
        channel: 'ChatChannel',
        data: { action: 'send_message', content: 'Hello everyone!' },
        delay: 1000
      },
      // Receive response
      { 
        direction: 'incoming', 
        channel: 'ChatChannel',
        data: { 
          type: 'message', 
          user: 'OtherUser', 
          content: 'Welcome TestUser!' 
        },
        delay: 800
      },
      // Send reply
      { 
        direction: 'outgoing', 
        channel: 'ChatChannel',
        data: { action: 'send_message', content: 'Thanks!' },
        delay: 500
      }
    ];

    cy.simulateConversation(chatFlow);
    
    // Verify final state
    cy.contains('Hello everyone!').should('be.visible');
    cy.contains('Welcome TestUser!').should('be.visible');
    cy.contains('Thanks!').should('be.visible');
    
    // Verify message count
    cy.getMessageHistory().then((history) => {
      const outgoingMessages = history.filter(msg => msg.direction === 'outgoing');
      expect(outgoingMessages).to.have.length(2);
    });
  });
});
```

```javascript
it('handles a complete conversation', () => {
  cy.acSubscribe('ChatChannel', { room: 'general' })
  
  // Simulate a conversation flow
  cy.acSimulateConversation('ChatChannel', { room: 'general' }, [
    { 
      type: 'incoming', 
      data: { message: 'Welcome to the chat!', user: 'System' },
      delay: 100 
    },
    { 
      type: 'outgoing', 
      action: 'speak', 
      data: { message: 'Thanks!' },
      delay: 200 
    },
    { 
      type: 'incoming', 
      data: { message: 'How can I help?', user: 'Support' },
      delay: 150 
    }
  ])
  
  // Assert all messages were processed
  cy.acGetMessages().should('have.length', 3)
  cy.contains('Welcome to the chat!').should('be.visible')
  cy.contains('How can I help?').should('be.visible')
})
```

```javascript
it('asserts on message content and patterns', () => {
  cy.acSubscribe('NotificationChannel')
  
  // Send a message via the UI
  cy.get('[data-cy=notification-button]').click()
  
  // Assert the message was sent
  cy.acAssertMessageSent({ type: 'notification', action: 'create' })
  cy.acAssertMessageSent('notification') // Partial match
  
  // Get all messages for detailed assertions
  cy.acGetMessages().then(messages => {
    const outgoing = messages.filter(m => m.type === 'outgoing')
    expect(outgoing).to.have.length(1)
    expect(outgoing[0].data).to.deep.include({ action: 'create' })
  })
})
```

## Best Practices

1. **Always clean up**: Use `cy.acDisconnect()` in `afterEach` hooks
2. **Initialize first**: Call `cy.mockActionCable()` before visiting pages
3. **Test user flows**: Use `cy.acSimulateConversation()` for realistic scenarios  
4. **Assert messages**: Use `cy.acAssertMessageSent()` to verify app behavior
5. **Keep it simple**: Focus on the user experience, not internal WebSocket details

## Contributing


1. Keep commands simple and focused
2. Prioritize reliability over comprehensive mocking
3. Update both commands and TypeScript definitions
4. Test with real Cypress applications

## License

MIT License - see LICENSE file for details.

## Changelog

### [1.0.0] - 2025-06-04

#### Added
- **Complete Action Cable Testing Solution**: Comprehensive Cypress plugin for testing Action Cable WebSocket connections
- **Robust WebSocket Mocking**: Complete WebSocket mock implementation with transport simulation using mock-socket
- **Action Cable Support**: Full Action Cable consumer and subscription mocking with protocol fidelity
- **Network Simulation**: Network interruption simulation, conversation testing, and debugging tools
- **Message Tracking**: Track and assert on sent/received messages with pattern matching and history
- **TypeScript Support**: Full TypeScript support with comprehensive interfaces
- **Debugging Tools**: Built-in debugging, state inspection, and message history capabilities

#### Core Commands
- `mockActionCable()` - Initialize Action Cable mocking with advanced options
- `createActionCableConsumer()` - Create consumers with network simulation
- `subscribeToChannel()` - Subscribe to channels with callbacks
- `performChannelAction()` - Perform actions on subscribed channels
- `waitForActionCableConnection()` - Wait for connections with timeout
- `waitForChannelSubscription()` - Wait for subscriptions to be established
- `simulateChannelMessage()` - Simulate server messages to channels
- `shouldHaveSentActionCableMessage()` - Assert sent messages with pattern matching
- `getActionCableMessages()` - Get complete message history
- `clearActionCableMessages()` - Clear message tracking
- `disconnectActionCable()` - Cleanup and restore original implementations

#### Advanced Commands
- `sendToChannel()` - Direct channel messaging with simplified API
- `simulateIncomingMessage()` - Simulate server messages to specific channels
- `simulateNetworkInterruption()` - Network resilience testing with configurable options
- `simulateConversation()` - Multi-message scenario testing with timing control
- `getMessageHistory()` - Access complete message history with metadata
- `clearMessageHistory()` - Reset message tracking for clean test states

#### Features
- Factory pattern for creating mock instances (`createMockActionCable`, `createMockActionCableServer`)
- Mock-socket integration for robust WebSocket transport simulation
- Network simulation capabilities (latency, packet loss, interruptions)
- Message history tracking with timestamps and metadata
- Comprehensive debugging with optional logging
- BDD-style test patterns with "is expected to" syntax
- Support for multiple consumers and subscriptions
- Action Cable ping/pong message handling
- Enhanced subscription management with state tracking
