/* eslint-disable no-undef */
/**
 * Cypress Action Cable Plugin Verification Tests
 * 
 * These tests verify that the plugin functions correctly by testing:
 * - Mock initialization
 * - Channel subscriptions
 * - Message sending and receiving
 * - Connection management
 * - Helper commands
 */

describe('Cypress Action Cable Plugin', () => {
  beforeEach(() => {
    // Visit a simple HTML page (we can use a fixture or data URL)
    cy.visit('cypress/fixtures/test-page.html');
  });

  describe('Mock Initialization', () => {
    it('should initialize the Action Cable mock', () => {
      cy.mockActionCable();
      
      cy.window().should((win) => {
        expect(win.mockActionCable).to.exist;
        expect(win.mockActionCable.connected).to.be.true;
        expect(win.App).to.exist;
        expect(win.App.cable).to.exist;
      });
    });
  });

  describe('Channel Subscriptions', () => {
    beforeEach(() => {
      cy.mockActionCable();
    });

    it('should subscribe to a simple channel', () => {
      cy.acSubscribe('TestChannel');
      
      cy.window().then((win) => {
        const subscriptions = win.mockActionCable.getSubscriptions();
        expect(subscriptions).to.have.length(1);
        expect(subscriptions[0].identifier).to.include('TestChannel');
      });
    });

    it('should subscribe to a channel with parameters', () => {
      cy.acSubscribe('ChatChannel', { room: 'general', user_id: 123 });
      
      cy.window().then((win) => {
        const subscriptions = win.mockActionCable.getSubscriptions();
        expect(subscriptions).to.have.length(1);
        
        const identifier = JSON.parse(subscriptions[0].identifier);
        expect(identifier.channel).to.equal('ChatChannel');
        expect(identifier.room).to.equal('general');
        expect(identifier.user_id).to.equal(123);
      });
    });

    it('should wait for subscription confirmation', () => {
      cy.acSubscribe('NotificationChannel');
      cy.acWaitForSubscription('NotificationChannel');
      
      cy.window().then((win) => {
        const subscriptions = win.mockActionCable.getSubscriptions();
        expect(subscriptions).to.have.length(1);
      });
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      cy.mockActionCable();
      cy.acSubscribe('MessageChannel', { room: 'test' });
    });

    it('should receive messages on a subscribed channel', () => {
      const testMessage = { text: 'Hello World', timestamp: Date.now() };
      
      cy.acReceiveMessage('MessageChannel', { room: 'test' }, testMessage);
      
      // The message should have been received by the subscription callbacks
      cy.window().then((win) => {
        expect(win.mockActionCable).to.exist;
      });
    });

    it('should get all tracked messages', () => {
      cy.acGetMessages().should('exist');
    });

    it('should clear tracked messages', () => {
      cy.acClearMessages();
      
      cy.window().then((win) => {
        const messages = win.mockActionCable.getMessages();
        expect(messages).to.have.length(0);
      });
    });
  });

  describe('Connection Management', () => {
    beforeEach(() => {
      cy.mockActionCable();
    });

    it('should check connection status', () => {
      cy.window().then((win) => {
        expect(win.mockActionCable.isConnected()).to.be.true;
      });
    });

    it('should wait for connection', () => {
      cy.acWaitForConnection(5000);
      
      cy.window().then((win) => {
        expect(win.mockActionCable.connected).to.be.true;
      });
    });

    it('should simulate network interruption', () => {
      cy.acSimulateNetworkInterruption(1000);
      
      // After interruption, connection should be restored
      cy.wait(1500);
      
      cy.window().then((win) => {
        expect(win.mockActionCable.connected).to.be.true;
      });
    });

    it('should disconnect Action Cable', () => {
      cy.acDisconnect();
      
      cy.window().then((win) => {
        expect(win.mockActionCable.connected).to.be.false;
      });
    });
  });

  describe('Advanced Features', () => {
    beforeEach(() => {
      cy.mockActionCable();
      cy.acSubscribe('AdvancedChannel', { feature: 'test' });
    });

    it('should simulate a conversation with multiple messages', () => {
      const conversation = [
        { type: 'incoming', data: { message: 'Hello' }, delay: 100 },
        { type: 'incoming', data: { message: 'How are you?' }, delay: 200 },
        { type: 'incoming', data: { message: 'Goodbye' }, delay: 300 }
      ];
      
      cy.acSimulateConversation('AdvancedChannel', conversation, { feature: 'test' });
      
      // Wait for all messages to be sent
      cy.wait(700);
      
      cy.window().then((win) => {
        expect(win.mockActionCable).to.exist;
      });
    });

    it('should get subscription for a channel', () => {
      cy.acSubscription('AdvancedChannel', { feature: 'test' }).should('exist');
    });
  });

  describe('Helper Commands', () => {
    beforeEach(() => {
      cy.mockActionCable();
    });

    it('should get active subscriptions', () => {
      cy.acSubscribe('Helper1Channel');
      cy.acSubscribe('Helper2Channel');
      
      cy.getActiveSubscriptions().then((subs) => {
        expect(subs).to.have.length(2);
      });
    });

    it('should verify a subscription exists', () => {
      cy.acSubscribe('VerifyChannel', { id: 99 });
      cy.verifySubscription('VerifyChannel', { id: 99 });
    });

    it('should clear all subscriptions', () => {
      cy.acSubscribe('ClearTest1');
      cy.acSubscribe('ClearTest2');
      
      cy.clearAllSubscriptions();
      
      cy.getActiveSubscriptions().then((subs) => {
        expect(subs).to.have.length(0);
      });
    });
  });

  describe('New Methods Added', () => {
    beforeEach(() => {
      cy.mockActionCable();
    });

    it('should use isConnected() method', () => {
      cy.window().then((win) => {
        expect(win.mockActionCable.isConnected()).to.be.true;
        
        win.mockActionCable.disconnect();
        expect(win.mockActionCable.isConnected()).to.be.false;
        
        win.mockActionCable.connect();
        expect(win.mockActionCable.isConnected()).to.be.true;
      });
    });

    it('should use getMessages() method', () => {
      cy.acSubscribe('TestChannel');
      
      cy.window().then((win) => {
        const messages = win.mockActionCable.getMessages();
        expect(messages).to.be.an('array');
      });
    });

    it('should use clearMessages() method', () => {
      cy.acSubscribe('TestChannel');
      
      cy.window().then((win) => {
        // Add some test tracking
        win.mockActionCable.sentMessages = [{ test: 'message' }];
        expect(win.mockActionCable.getMessages()).to.have.length(1);
        
        win.mockActionCable.clearMessages();
        expect(win.mockActionCable.getMessages()).to.have.length(0);
      });
    });
  });
});
