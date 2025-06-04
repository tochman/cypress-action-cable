# Cypress Action Cable Plugin

A comprehensive Cypress plugin for testing Action Cable WebSocket connections with powerful mocking capabilities and advanced testing features.

## Features

- **Robust WebSocket Mocking**: Complete WebSocket mock implementation with transport simulation using mock-socket
- **Action Cable Support**: Full Action Cable consumer and subscription mocking with protocol fidelity  
- **Reliability Helpers**: Fast, force-connected patterns for reduced test flakiness (5s timeouts, immediate connections)
- **Network Simulation**: Network interruption simulation, conversation testing, and debugging tools
- **Cypress Integration**: Custom commands for easy testing with BDD-style assertions
- **Message Tracking**: Track and assert on sent/received messages with pattern matching and history
- **Easy Setup**: Simple installation and configuration
- **Type Safe**: Full TypeScript support with comprehensive interfaces
- **Debugging Tools**: Built-in debugging, state inspection, and message history capabilities

## Installation

### From GitHub (Recommended)

```bash
# Using npm
npm install --save-dev https://github.com/tochman/cypress-action-cable.git

# Using yarn
yarn add --dev https://github.com/tochman/cypress-action-cable.git
```

### From Local Path (For Development)

```bash
# Using npm
npm install --save-dev file:../path/to/cypress-action-cable

# Using yarn
yarn add --dev file:../path/to/cypress-action-cable
```

### Using Specific Version/Tag

```bash
# Using npm
npm install --save-dev https://github.com/tochman/cypress-action-cable.git#v1.0.0

# Using yarn
yarn add --dev https://github.com/tochman/cypress-action-cable.git#v1.0.0
```

## GitHub Installation Details

### Installation Options

#### Public Repository

```bash
# Standard installation - npm
npm install --save-dev https://github.com/tochman/cypress-action-cable.git
# Standard installation - yarn
yarn add --dev https://github.com/tochman/cypress-action-cable.git

# With specific branch - npm
npm install --save-dev https://github.com/tochman/cypress-action-cable.git#feature-branch
# With specific branch - yarn
yarn add --dev https://github.com/tochman/cypress-action-cable.git#feature-branch

# With specific tag - npm
npm install --save-dev https://github.com/tochman/cypress-action-cable.git#v1.0.0
# With specific tag - yarn
yarn add --dev https://github.com/tochman/cypress-action-cable.git#v1.0.0
```

#### Private Repository

```bash
# Using SSH (requires SSH key setup) - npm
npm install --save-dev git+ssh://git@github.com/tochman/cypress-action-cable.git
# Using SSH (requires SSH key setup) - yarn
yarn add --dev git+ssh://git@github.com/tochman/cypress-action-cable.git

# Using HTTPS with token - npm
npm install --save-dev https://YOUR_TOKEN@github.com/tochman/cypress-action-cable.git
# Using HTTPS with token - yarn
yarn add --dev https://YOUR_TOKEN@github.com/tochman/cypress-action-cable.git
```

### Package.json Format

After installation, your project's `package.json` will show:

```json
{
  "devDependencies": {
    "cypress-action-cable": "github:tochman/cypress-action-cable#v1.0.0"
  }
}
```

### Updating The Plugin

```bash
# For minor updates - npm
npm update cypress-action-cable
# For minor updates - yarn
yarn upgrade cypress-action-cable

# For major version changes - npm
npm uninstall cypress-action-cable
npm install --save-dev https://github.com/tochman/cypress-action-cable.git#v2.0.0

# For major version changes - yarn
yarn remove cypress-action-cable
yarn add --dev https://github.com/tochman/cypress-action-cable.git#v2.0.0
```

## Quick Start

### 1. Setup in Cypress Support File

Add to your `cypress/support/e2e.js` or `cypress/support/commands.js`:

```javascript
// Import plugin commands
import 'cypress-action-cable/dist/commands/commands';

// Or if using CommonJS
require('cypress-action-cable/dist/commands/commands');
```

### 2. TypeScript Support (Optional)

If using TypeScript, add to your `cypress/tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["cypress", "cypress-action-cable"]
  },
  "include": [
    "**/*.ts",
    "../node_modules/cypress-action-cable/cypress-action-cable.d.ts"
  ]
}
```

### 3. Basic Usage in Tests

```javascript
describe('Action Cable Tests', () => {
  beforeEach(() => {
    // Mock Action Cable before visiting your app
    cy.mockActionCable('ws://localhost:3000/cable');
    cy.visit('/');
  });

  afterEach(() => {
    // Clean up after each test
    cy.disconnectActionCable();
  });

  it('is expected to connect to Action Cable', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
      });
  });

  it('is expected to subscribe to a channel', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        cy.subscribeToChannel(consumer, 'ChatChannel', {
          received: (data) => {
            console.log('Received:', data);
          }
        }).then((subscription) => {
          cy.waitForChannelSubscription(subscription);
        });
      });
  });
});
```

### 4. Reliability Helpers for Faster, More Stable Tests

The plugin includes reliability helper commands inspired by real-world usage patterns that eliminate flaky waiting and provide immediate state guarantees:

```javascript
describe('Reliable Action Cable Tests', () => {
  beforeEach(() => {
    // One-command setup with sensible defaults
    cy.setupReliableActionCable('ws://localhost:3000/cable');
    cy.visit('/chat');
  });

  afterEach(() => {
    // Thorough cleanup for test isolation
    cy.cleanActionCableState();
    cy.disconnectActionCable();
  });

  it('is expected to work immediately without waiting', () => {
    // Force connection - guaranteed to be ready immediately
    cy.forceActionCableConnection().then((consumer) => {
      expect(consumer.connected).to.be.true; // Always true
    });
    
    // Subscribe immediately - no waiting required
    cy.subscribeImmediately('ChatChannel', {
      received: (data) => console.log('Received:', data)
    }).then((subscription) => {
      expect(subscription.connected).to.be.true; // Always true
      
      // Send message immediately - no connection checks
      cy.sendActionCableMessageImmediately('ChatChannel', {
        message: 'Hello World!'
      });
      
      // Reliable assertion with retry capability
      cy.shouldHaveActionCableMessageReliably({ message: 'Hello World!' });
    });
  });
});
```

## API Reference

### Commands

#### `cy.mockActionCable(url?, options?)`

Replaces WebSocket and ActionCable with mocked versions with advanced capabilities.

```javascript
cy.mockActionCable('ws://localhost:3000/cable', {
  debug: true,
  messageHistory: true,
  networkSimulation: {
    latency: [10, 50],
    packetLoss: 0.01
  }
});
```

**Options:**
- `debug`: Enable debug logging (default: false)
- `messageHistory`: Track message history (default: false)
- `networkSimulation`: Network simulation settings
  - `latency`: Range for random latency [min, max] in ms
  - `packetLoss`: Packet loss rate (0-1)
- `autoConnect`: Auto-connect on creation (default: true)
- `connectionDelay`: Delay before connection (ms)

#### `cy.createActionCableConsumer(url, options?)`

Creates a mocked Action Cable consumer.

```javascript
cy.createActionCableConsumer('ws://localhost:3000/cable')
  .then((consumer) => {
    // Use consumer
  });
```

#### `cy.subscribeToChannel(consumer, channel, callbacks?)`

Subscribe to an Action Cable channel.

```javascript
cy.subscribeToChannel(consumer, 'ChatChannel', {
  connected: () => console.log('Connected!'),
  received: (data) => console.log('Received:', data)
});

// With parameters
cy.subscribeToChannel(consumer, 
  { channel: 'ChatChannel', room_id: 123 },
  { received: (data) => console.log(data) }
);
```

#### `cy.performChannelAction(subscription, action, data?)`

Perform an action on a subscribed channel.

```javascript
cy.performChannelAction(subscription, 'send_message', {
  message: 'Hello World!',
  user_id: 1
});
```

#### `cy.waitForActionCableConnection(consumer, options?)`

Wait for Action Cable consumer to connect.

```javascript
cy.waitForActionCableConnection(consumer, { timeout: 5000 });
```

#### `cy.waitForChannelSubscription(subscription, options?)`

Wait for channel subscription to be established.

```javascript
cy.waitForChannelSubscription(subscription, { timeout: 3000 });
```

#### `cy.simulateChannelMessage(url, channelIdentifier, message)`

Simulate a server message to a specific channel.

```javascript
cy.simulateChannelMessage(
  'ws://localhost:3000/cable',
  '{"channel":"ChatChannel","room_id":123}',
  { type: 'message', content: 'Hello from server!' }
);
```

#### `cy.shouldHaveSentActionCableMessage(expectedData, options?)`

Assert that a specific message was sent.

```javascript
cy.shouldHaveSentActionCableMessage('send_message');
cy.shouldHaveSentActionCableMessage({ action: 'send_message', message: 'Hello' });
```

#### `cy.getActionCableMessages(url?)`

Get all Action Cable messages sent during the test.

```javascript
cy.getActionCableMessages().then((messages) => {
  expect(messages).to.have.length(2);
});
```

#### `cy.clearActionCableMessages()`

Clear the message history.

```javascript
cy.clearActionCableMessages();
```

#### `cy.sendToChannel(channelIdentifier, message, options?)`

Send a message directly to a specific channel.

```javascript
cy.sendToChannel('ChatChannel', { 
  type: 'message', 
  content: 'Hello World!' 
});

// With options
cy.sendToChannel('ChatChannel', message, {
  delay: 100
});
```

#### `cy.simulateIncomingMessage(channelIdentifier, message, options?)`

Simulate an incoming message from the server to a specific channel.

```javascript
cy.simulateIncomingMessage('ChatChannel', {
  type: 'message',
  user: 'Alice',
  content: 'Hello from server!'
});
```

#### `cy.simulateNetworkInterruption(options?)`

Simulate network connectivity issues.

```javascript
// Temporary disconnection
cy.simulateNetworkInterruption({
  duration: 2000,
  reconnect: true,
  reconnectDelay: 500
});
```

#### `cy.simulateConversation(messages, options?)`

Simulate a complex sequence of messages between client and server.

```javascript
const conversation = [
  { 
    direction: 'outgoing', 
    channel: 'ChatChannel',
    data: { action: 'join_room', room_id: 1 }, 
    delay: 100 
  },
  { 
    direction: 'incoming', 
    channel: 'ChatChannel',
    data: { type: 'user_joined', user: 'Alice' },
    delay: 200 
  }
];

cy.simulateConversation(conversation);
```

#### `cy.getMessageHistory()`

Get the complete message history with timestamps and metadata.

```javascript
cy.getMessageHistory().then((history) => {
  expect(history).to.have.length.greaterThan(0);
  expect(history[0]).to.have.property('timestamp');
});
```

#### `cy.disconnectActionCable()`

Disconnect all Action Cable consumers and restore original implementations.

```javascript
cy.disconnectActionCable();
```

### Reliability Helper Commands

These commands provide simplified, reliable patterns inspired by real-world usage that eliminate flaky waiting and provide immediate state guarantees:

#### `cy.setupReliableActionCable(url?, options?)`

One-command setup for reliable Action Cable testing with sensible defaults.

```javascript
cy.setupReliableActionCable('ws://localhost:3000/cable', {
  debug: false,
  messageHistory: true,
  connectionDelay: 0 // No delays for faster tests
});
```

#### `cy.forceActionCableConnection(url?, options?)`

Force Action Cable connection to be ready immediately without waiting.

```javascript
cy.forceActionCableConnection().then((consumer) => {
  expect(consumer.connected).to.be.true; // Always true
});
```

#### `cy.subscribeImmediately(channel, callbacks?, options?)`

Subscribe to channel with immediate connection guarantee (no waiting required).

```javascript
cy.subscribeImmediately('ChatChannel', {
  received: (data) => console.log('Received:', data)
}).then((subscription) => {
  expect(subscription.connected).to.be.true; // Always true
});
```

#### `cy.sendActionCableMessageImmediately(channel, data, options?)`

Send Action Cable message immediately without waiting for connection.

```javascript
cy.sendActionCableMessageImmediately('ChatChannel', {
  action: 'send_message',
  content: 'Hello World!'
});
```

#### `cy.receiveMessageImmediately(channel, data, delay?)`

Receive message with minimal delay for faster tests.

```javascript
cy.receiveMessageImmediately('ChatChannel', {
  type: 'message',
  content: 'Hello from server!'
}, 0); // 0 delay for immediate delivery
```

#### `cy.shouldHaveActionCableMessageReliably(expectedData, options?)`

Assert Action Cable message was sent with retry capability for more reliable tests.

```javascript
cy.shouldHaveActionCableMessageReliably(
  { action: 'send_message' },
  { retries: 3, timeout: 5000 }
);
```

#### `cy.cleanActionCableState()`

Clean all Action Cable state for reliable test isolation.

```javascript
cy.cleanActionCableState(); // Thorough cleanup between tests
```

## Advanced Usage Examples

### Testing Network Resilience

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

### Testing Complex Conversations

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

### Debugging and Inspection

```javascript
describe('Debug Features', () => {
  beforeEach(() => {
    cy.mockActionCable('ws://localhost:3000/cable', { debug: true });
    cy.visit('/');
  });

  it('is expected to provide debugging capabilities', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        cy.waitForActionCableConnection(consumer);
        
        // Subscribe and send some messages
        cy.subscribeToChannel(consumer, 'TestChannel');
        cy.sendToChannel('TestChannel', { test: 'message1' });
        cy.sendToChannel('TestChannel', { test: 'message2' });
        
        // Get message history for inspection
        cy.getMessageHistory().then((history) => {
          expect(history).to.have.length.greaterThan(0);
          expect(history[0]).to.have.property('timestamp');
        });
        
        // Verify specific message patterns
        cy.getActionCableMessages().then((messages) => {
          const testMessages = messages.filter(msg => 
            msg.data && msg.data.test && msg.data.test.includes('message')
          );
          expect(testMessages).to.have.length(2);
        });
          (msg) => msg.data && msg.data.test && msg.data.test.includes('message'),
          { count: 2 }
        );
      });
  });
});
```

## Verification After Installation

Create a simple test to verify the installation:

```javascript
describe('Action Cable Plugin Test', () => {
  beforeEach(() => {
    cy.mockActionCable('ws://localhost:3000/cable');
    cy.visit('https://example.com'); // Any URL for testing
  });

  afterEach(() => {
    cy.disconnectActionCable();
  });

  it('is expected to load plugin successfully', () => {
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((consumer) => {
        expect(consumer).to.exist;
        cy.waitForActionCableConnection(consumer);
      });
  });
});
```

Run the test: `npx cypress run --spec "cypress/e2e/test-action-cable.cy.js"`

## Advanced Usage

### Testing Real-time Features

```javascript
describe('Chat Application', () => {
  let consumer;
  let chatSubscription;

  beforeEach(() => {
    cy.mockActionCable();
    cy.visit('/chat');
    
    cy.createActionCableConsumer('ws://localhost:3000/cable')
      .then((c) => {
        consumer = c;
        cy.waitForActionCableConnection(consumer);
      });
  });

  it('is expected to receive and display messages', () => {
    // Subscribe to chat channel
    cy.subscribeToChannel(consumer, { channel: 'ChatChannel', room_id: 1 })
      .then((subscription) => {
        chatSubscription = subscription;
        cy.waitForChannelSubscription(subscription);
        
        // Simulate server sending a message
        cy.simulateChannelMessage(
          'ws://localhost:3000/cable',
          '{"channel":"ChatChannel","room_id":1}',
          {
            type: 'message',
            user: 'John Doe',
            content: 'Hello everyone!',
            timestamp: new Date().toISOString()
          }
        );
        
        // Verify message appears in UI
        cy.contains('Hello everyone!').should('be.visible');
        cy.contains('John Doe').should('be.visible');
      });
  });

  it('is expected to send messages to server', () => {
    cy.subscribeToChannel(consumer, { channel: 'ChatChannel', room_id: 1 })
      .then((subscription) => {
        cy.waitForChannelSubscription(subscription);
        
        // Type and send message
        cy.get('[data-cy=message-input]').type('My test message');
        cy.get('[data-cy=send-button]').click();
        
        // Verify message was sent to Action Cable
        cy.shouldHaveSentActionCableMessage({
          action: 'send_message',
          content: 'My test message'
        });
      });
  });

  afterEach(() => {
    cy.disconnectActionCable();
  });
});
```

### Testing Connection States

```javascript
it('is expected to handle connection failures', () => {
  cy.createActionCableConsumer('ws://localhost:3000/cable')
    .then((consumer) => {
      // Simulate connection failure
      consumer.websocket.simulateError();
      
      // Test error handling in your app
      cy.contains('Connection failed').should('be.visible');
    });
});

it('is expected to reconnect automatically', () => {
  cy.createActionCableConsumer('ws://localhost:3000/cable')
    .then((consumer) => {
      cy.waitForActionCableConnection(consumer);
      
      // Simulate disconnect
      consumer.disconnect();
      expect(consumer.connected).to.be.false;
      
      // Reconnect
      consumer.connect();
      cy.waitForActionCableConnection(consumer);
    });
});
```

### Custom Channel Testing

```javascript
it('is expected to handle custom channel with authentication', () => {
  cy.subscribeToChannel(
    consumer, 
    { 
      channel: 'UserChannel', 
      user_id: 123,
      auth_token: 'abc123'
    },
    {
      connected: () => {
        console.log('Authenticated and connected');
      },
      rejected: () => {
        console.log('Authentication failed');
      },
      received: (data) => {
        if (data.type === 'notification') {
          // Handle notification
        }
      }
    }
  ).then((subscription) => {
    cy.waitForChannelSubscription(subscription);
    
    // Test notification
    cy.simulateChannelMessage(
      'ws://localhost:3000/cable',
      '{"channel":"UserChannel","user_id":123,"auth_token":"abc123"}',
      { type: 'notification', message: 'You have a new message!' }
    );
    
    cy.get('[data-cy=notification]').should('contain', 'You have a new message!');
  });
});
```

## Configuration Options

### MockActionCableOptions

```typescript
interface MockActionCableOptions {
  url?: string;                    // WebSocket URL (default: 'ws://localhost:3000/cable')
  protocols?: string[];            // WebSocket protocols
  connectionDelay?: number;        // Delay before connection (ms, default: 0)
  debug?: boolean;                // Enable debug logging (default: false)
  messageHistory?: boolean;       // Enable message history tracking (default: false)
  networkSimulation?: {           // Network simulation settings
    latency?: [number, number];   // Latency range [min, max] ms (default: [10, 50])
    packetLoss?: number;          // Packet loss rate 0-1 (default: 0)
  };
}
```

### NetworkInterruptionOptions

```typescript
interface NetworkInterruptionOptions {
  duration?: number;              // Interruption duration in ms (default: 1000)
  reconnect?: boolean;            // Whether to reconnect automatically (default: true)
  reconnectAutomatically?: boolean; // Auto-reconnect flag (default: true)
  reconnectDelay?: number;        // Delay before reconnection in ms (default: 100)
}
```

### ConversationMessage

```typescript
interface ConversationMessage {
  direction: 'incoming' | 'outgoing';  // Message direction
  channel: string;                     // Target channel
  data: any;                          // Message data
  delay?: number;                     // Delay before this message (ms)
  from?: string;                      // Message source identifier
}
```

### CypressActionCableOptions

```typescript
interface CypressActionCableOptions {
  timeout?: number;  // Command timeout (default: 5000ms)
  log?: boolean;     // Enable/disable logging (default: true)
}
```

## TypeScript Support

The plugin includes full TypeScript definitions. For custom types:

```typescript
import { ActionCableConsumer, ActionCableSubscription } from 'cypress-action-cable';

// Your custom types
interface ChatMessage {
  id: number;
  user: string;
  content: string;
  timestamp: string;
}

// Type-safe usage
cy.subscribeToChannel(consumer, 'ChatChannel', {
  received: (data: ChatMessage) => {
    // data is properly typed
    console.log(data.content);
  }
});
```

## Troubleshooting

### Common Issues

1. **WebSocket not mocked**: Make sure to call `cy.mockActionCable()` before visiting your page.

2. **Commands not found**: Ensure you've imported the plugin in your support file.

3. **TypeScript errors**: Make sure your `tsconfig.json` includes the plugin's types.

### Debug Mode

Enable debug logging:

```javascript
cy.mockActionCable('ws://localhost:3000/cable', { debug: true });
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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
