# Cypress Action Cable Plugin

A comprehensive Cypress plugin for testing Action Cable WebSocket connections with powerful mocking capabilities.

## Features

- **WebSocket Mocking**: Complete WebSocket mock implementation
- **Action Cable Support**: Full Action Cable consumer and subscription mocking
- **Cypress Integration**: Custom commands for easy testing
- **Message Tracking**: Track and assert on sent/received messages
- **Easy Setup**: Simple installation and configuration
- **Type Safe**: Full TypeScript support
- **Zero Dependencies**: Completely self-contained with no external requirements

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
// Import the plugin commands
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

## API Reference

### Commands

#### `cy.mockActionCable(url?, options?)`

Replaces WebSocket and ActionCable with mocked versions.

```javascript
cy.mockActionCable('ws://localhost:3000/cable', {
  autoConnect: true,
  connectionDelay: 100
});
```

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

#### `cy.disconnectActionCable()`

Disconnect all Action Cable consumers and restore original implementations.

```javascript
cy.disconnectActionCable();
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
  url?: string;                // WebSocket URL
  autoConnect?: boolean;       // Auto-connect on creation (default: true)
  protocols?: string[];        // WebSocket protocols
  connectionDelay?: number;    // Delay before connection (ms)
  subscriptionDelay?: number;  // Delay before subscription (ms)
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

### [1.0.0] - 2025-06-03

#### Added
- Initial release of Cypress Action Cable plugin
- Complete WebSocket mocking functionality with `MockWebSocket` class
- Full Action Cable consumer and subscription mocking with `MockActionCable` classes
- Comprehensive set of Cypress custom commands:
  - `mockActionCable()` - Initialize mocking
  - `createActionCableConsumer()` - Create consumers
  - `subscribeToChannel()` - Subscribe to channels
  - `performChannelAction()` - Perform channel actions
  - `waitForActionCableConnection()` - Wait for connections
  - `waitForChannelSubscription()` - Wait for subscriptions
  - `simulateChannelMessage()` - Simulate server messages
  - `shouldHaveSentActionCableMessage()` - Assert sent messages
  - `getActionCableMessages()` - Get message history
  - `clearActionCableMessages()` - Clear message history
  - `disconnectActionCable()` - Cleanup and restore
- TypeScript support with complete type definitions
- Message tracking and assertion capabilities
- Support for multiple consumers and subscriptions
- Action Cable ping/pong message handling
- Comprehensive documentation and examples
