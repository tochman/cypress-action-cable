# Cypress Action Cable - Example Index

Quick reference for all available examples in this directory.

## 🚀 Quick Start

1. **New to ActionCable testing?** → Start with `basic-chat.cy.js`
2. **Complex authentication flows?** → See `bankid-auth.cy.js` 
3. **Real-time collaboration features?** → Check `real-time-collaboration.cy.js`

## 📋 Example Files

| File | Complexity | Use Cases | Key Features |
|------|------------|-----------|--------------|
| [`basic-chat.cy.js`](./basic-chat.cy.js) | 🟢 Beginner | Chat apps, messaging | Basic pub/sub, message verification |
| [`bankid-auth.cy.js`](./bankid-auth.cy.js) | 🟡 Intermediate | Authentication flows | Multi-step processes, error handling |
| [`real-time-collaboration.cy.js`](./real-time-collaboration.cy.js) | 🔴 Advanced | Collaborative editing | Conflict resolution, presence tracking |

## 🎯 Command Usage Matrix

| Command | Basic Chat | BankID Auth | Collaboration |
|---------|------------|-------------|---------------|
| `cy.mockActionCable()` | ✅ | ✅ | ✅ |
| `cy.acSubscribe()` | ✅ | ✅ | ✅ |
| `cy.acReceiveMessage()` | ✅ | ✅ | ✅ |
| `cy.acAssertMessageSent()` | ✅ | ❌ | ✅ |
| `cy.acSimulateConversation()` | ✅ | ❌ | ✅ |
| `cy.acSimulateNetworkInterruption()` | ❌ | ✅ | ✅ |
| `cy.acWaitForConnection()` | ❌ | ✅ | ✅ |
| `cy.waitForImageToLoad()` | ❌ | ✅ | ❌ |

## 🏃‍♂️ Running Examples

```bash
# Run a specific example
npx cypress run --spec "cypress/e2e/basic-chat.cy.js"

# Run all ActionCable examples
npx cypress run --spec "cypress/e2e/*action-cable*.cy.js"

# Open Cypress UI
npx cypress open
```

## 📝 Customization Checklist

Before using these examples in your project:

- [ ] Update `data-testid` selectors to match your application
- [ ] Modify channel names (`ChatChannel`, `AuthStatusChannel`, etc.)
- [ ] Adjust message formats to match your ActionCable setup
- [ ] Update visit URLs (`/chat`, `/auth/bankid`, etc.)
- [ ] Customize user data and parameters

## 🛠 Development Workflow

1. **Copy** an example that matches your use case
2. **Customize** selectors and channel names  
3. **Run** the test to verify basic functionality
4. **Extend** with your specific business logic
5. **Refactor** common patterns into custom commands

## 📝 BDD Style Guidelines

All examples follow proper BDD (Behavior-Driven Development) style:
- Use `it('is expected to...')` format for test descriptions
- Focus on behavior rather than implementation
- Write tests that read like specifications

```javascript
// Good BDD style ✅
it('is expected to receive messages from other users', () => {
  // Test implementation
});

// Avoid imperative style ❌  
it('should receive messages from other users', () => {
  // Test implementation
});
```

## 📚 Further Reading

- [Main README](../README.md) - Complete plugin documentation
- [Cypress ActionCable Commands](../README.md#api-reference) - Full command reference

---

**💡 Tip:** Start with the basic example and gradually add complexity as needed. Each example builds upon concepts from the previous ones.
