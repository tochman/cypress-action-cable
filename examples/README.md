# Cypress Action Cable Examples

This directory contains comprehensive examples demonstrating the ActionCable testing patterns. Each example showcases different real-world scenarios and complexity levels.

## Example Files

### 1. `basic-chat.cy.js` - Chat Application Fundamentals
**Complexity Level:** Beginner  
**Demonstrates:**
- Basic ActionCable connection and subscription
- Simple message sending/receiving
- Message history management
- Clean test setup and teardown

**Key Commands Used:**
- `cy.mockActionCable()` - Initialize mock system
- `cy.acSubscribe()` - Subscribe to channels
- `cy.acReceiveMessage()` - Simulate incoming messages
- `cy.acAssertMessageSent()` - Verify outgoing messages
- `cy.acGetMessages()` / `cy.acClearMessages()` - Message management

### 2. `bankid-auth.cy.js` - Authentication Flow Testing
**Complexity Level:** Intermediate  
**Demonstrates:**
- Multi-step authentication processes
- QR code handling and image loading
- Error handling and timeout scenarios
- Network interruption during authentication
- Status updates via ActionCable

**Key Commands Used:**
- `cy.acSimulateNetworkInterruption()` - Test network resilience
- `cy.acWaitForConnection()` - Wait for reconnection
- `cy.waitForImageToLoad()` - QR code testing
- Complex message sequencing for auth flows

**Real-world Application:**
This pattern is proven in production for Swedish BankID integration, handling the complete authentication lifecycle from QR code display through final user verification.

### 3. `real-time-collaboration.cy.js` - Advanced Collaboration Features
**Complexity Level:** Advanced  
**Demonstrates:**
- Document collaboration and conflict resolution
- Live cursor tracking and user presence
- High-frequency data updates with throttling
- Auto-save with network interruption handling
- Complex multi-user scenarios

**Key Commands Used:**
- `cy.acSimulateConversation()` - Multi-message scenarios
- Advanced subscription management
- Conflict resolution testing
- Performance testing with high-frequency updates

**Real-world Application:**
These patterns support Google Docs-style collaborative editing, live dashboards, and real-time team collaboration tools.

## Running the Examples

### Prerequisites
1. Install the plugin in your Cypress project:
   ```bash
   npm install --save-dev cypress-action-cable
   ```

2. Import the plugin in `cypress/support/commands.js`:
   ```javascript
   import "cypress-action-cable"
   ```

### Usage
Copy any example file to your `cypress/e2e/` directory and run:

```bash
# Run specific example
npx cypress run --spec "cypress/e2e/basic-chat.cy.js"

# Run all examples
npx cypress run --spec "cypress/e2e/*action-cable*.cy.js"

# Open Cypress UI to run interactively
npx cypress open
```

## Customizing for Your Application

### 1. Update Selectors
Replace `data-testid` selectors with your application's actual selectors:
```javascript
// Example template
cy.get('[data-testid="message-input"]')

// Customize for your app
cy.get('#message-input')
cy.get('.chat-input')
cy.get('[name="message"]')
```

### 2. Modify Channel Names and Parameters
Update channel subscriptions to match your ActionCable channels:
```javascript
// Template
cy.acSubscribe('ChatChannel', { room: 'general' })

// Your application
cy.acSubscribe('ConversationChannel', { 
  conversation_id: 123,
  user_id: 'current_user'
})
```

### 3. Adjust Message Formats
Customize message structures to match your ActionCable message formats:
```javascript
// Template format
cy.acReceiveMessage('ChatChannel', {
  action: 'message_received',
  user: 'Alice',
  message: 'Hello!'
})

// Your format
cy.acReceiveMessage('ChatChannel', {
  type: 'new_message',
  data: {
    author: { name: 'Alice', id: 123 },
    content: 'Hello!',
    created_at: '2024-01-01T12:00:00Z'
  }
})
```

## Best Practices Demonstrated

### 1. **BDD Style Test Descriptions**
Using proper "is expected to" format for behavior-driven development:
```javascript
// Good BDD style
it('is expected to connect and subscribe to chat channel', () => {
  // Test implementation
});

// Avoid imperative style
it('should connect and subscribe to chat channel', () => {
  // Test implementation  
});
```

### 2. **Test Isolation**
Each test starts with fresh ActionCable state:
```javascript
beforeEach(() => {
  cy.mockActionCable();
})

afterEach(() => {
  cy.acDisconnect();
})
```

### 3. **Subscription Management**
Always wait for subscriptions before testing:
```javascript
cy.acSubscribe('MyChannel', { id: 123 });
cy.acWaitForSubscription('MyChannel', { id: 123 });
```

### 4. **Network Resilience Testing**
Test real-world network conditions:
```javascript
cy.acSimulateNetworkInterruption(3000);
cy.acWaitForConnection();
```

### 5. **Message Verification**
Verify both incoming and outgoing messages:
```javascript
// Verify outgoing
cy.acAssertMessageSent('ChatChannel', { action: 'send_message' });

// Verify incoming
cy.acReceiveMessage('ChatChannel', { action: 'message_received' });
```

## Error Handling Patterns

### Authentication Timeout
```javascript
cy.acReceiveMessage('AuthChannel', {
  action: 'auth_failed',
  status: 'timeout',
  error: 'Authentication timed out'
});
```

### Network Disconnection
```javascript
cy.acSimulateNetworkInterruption(5000);
cy.get('[data-testid="connection-status"]')
  .should('contain', 'Disconnected');
```

### Conflict Resolution
```javascript
cy.acReceiveMessage('DocumentChannel', {
  action: 'conflict_detected',
  conflict: true,
  resolution_required: true
});
```

## Performance Testing

Test high-frequency updates:
```javascript
const rapidUpdates = Array.from({ length: 100 }, (_, i) => ({
  action: 'data_update',
  value: i,
  timestamp: Date.now() + i
}));

cy.acSimulateConversation('MetricsChannel', rapidUpdates);
```

## Debugging Tips

1. **Enable Debug Mode:**
   ```javascript
   cy.mockActionCable({ debug: true });
   ```

2. **Check Message History:**
   ```javascript
   cy.acGetMessages('MyChannel').then(messages => {
     console.log('All messages:', messages);
   });
   ```

3. **Verify Active Subscriptions:**
   ```javascript
   cy.getActiveSubscriptions().then(subs => {
     console.log('Active subscriptions:', subs);
   });
   ```

## Integration with CI/CD

These examples work seamlessly in headless CI environments:
```yaml
# GitHub Actions example
- name: Run ActionCable Tests
  run: |
    npx cypress run --spec "cypress/e2e/*action-cable*.cy.js"
    --browser chrome
    --headless
```

---

