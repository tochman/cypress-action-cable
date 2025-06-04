/* eslint-disable no-undef */
// Real-time Collaboration Testing
// Demonstrates complex real-time features like document editing, live updates, and conflict resolution
// Uses advanced ActionCable patterns for collaborative applications

describe('Real-time Collaboration Features', () => {
  beforeEach(() => {
    cy.mockActionCable();
    cy.visit('/documents/123/edit'); // Visit collaborative document editor
  });

  afterEach(() => {
    cy.acDisconnect();
  });

  it('is expected to sync document changes in real-time', () => {
    // Subscribe to document collaboration channel
    cy.acSubscribe('DocumentChannel', { 
      document_id: '123',
      user_id: 'current_user' 
    });
    cy.acWaitForSubscription('DocumentChannel');
    
    // Make a change to the document
    cy.get('[data-testid="document-editor"]')
      .clear()
      .type('This is a collaborative document');
    
    // Verify change was sent via ActionCable
    cy.acAssertMessageSent('DocumentChannel', {
      action: 'content_changed',
      content: 'This is a collaborative document',
      cursor_position: 32
    });
    
    // Simulate another user making changes
    cy.acReceiveMessage('DocumentChannel', {
      action: 'content_changed',
      user_id: 'other_user',
      user_name: 'Alice',
      content: 'This is a collaborative document edited by Alice',
      cursor_position: 48,
      change_id: 'change_001'
    });
    
    // Verify other user's changes appear
    cy.get('[data-testid="document-editor"]')
      .should('contain.value', 'edited by Alice');
    
    // Verify user indicator appears
    cy.get('[data-testid="active-users"]')
      .should('contain', 'Alice');
  });

  it('is expected to handle conflict resolution', () => {
    cy.acSubscribe('DocumentChannel', { document_id: '123' });
    cy.acWaitForSubscription('DocumentChannel');
    
    // Simulate conflicting changes
    cy.get('[data-testid="document-editor"]').type('User A changes');
    
    // Simulate another user making conflicting changes
    cy.acReceiveMessage('DocumentChannel', {
      action: 'content_changed',
      user_id: 'user_b',
      content: 'User B conflicting changes',
      conflict: true,
      resolution_required: true
    });
    
    // Verify conflict resolution UI appears
    cy.get('[data-testid="conflict-resolver"]').should('be.visible');
    cy.get('[data-testid="conflict-options"]')
      .should('contain', 'User A changes')
      .and('contain', 'User B conflicting changes');
    
    // Resolve conflict by choosing User B's version
    cy.get('[data-testid="choose-version-b"]').click();
    
    // Verify resolution was sent
    cy.acAssertMessageSent('DocumentChannel', {
      action: 'conflict_resolved',
      chosen_version: 'user_b',
      resolved_content: 'User B conflicting changes'
    });
  });

  it('is expected to show live cursor positions', () => {
    cy.acSubscribe('DocumentChannel', { document_id: '123' });
    cy.acWaitForSubscription('DocumentChannel');
    
    // Simulate other users' cursor movements
    cy.acReceiveMessage('DocumentChannel', {
      action: 'cursor_moved',
      user_id: 'alice',
      user_name: 'Alice',
      cursor_position: 15,
      selection: { start: 10, end: 20 }
    });
    
    cy.acReceiveMessage('DocumentChannel', {
      action: 'cursor_moved',
      user_id: 'bob',
      user_name: 'Bob',
      cursor_position: 45,
      selection: null
    });
    
    // Verify cursor indicators appear
    cy.get('[data-testid="cursor-alice"]').should('be.visible');
    cy.get('[data-testid="cursor-bob"]').should('be.visible');
    cy.get('[data-testid="selection-alice"]').should('be.visible');
  });

  it('is expected to handle user presence (join/leave)', () => {
    cy.acSubscribe('DocumentChannel', { document_id: '123' });
    cy.acWaitForSubscription('DocumentChannel');
    
    // Simulate users joining
    cy.acReceiveMessage('DocumentChannel', {
      action: 'user_joined',
      user_id: 'alice',
      user_name: 'Alice',
      user_avatar: '/avatars/alice.jpg'
    });
    
    cy.acReceiveMessage('DocumentChannel', {
      action: 'user_joined',
      user_id: 'bob', 
      user_name: 'Bob',
      user_avatar: '/avatars/bob.jpg'
    });
    
    // Verify users appear in active users list
    cy.get('[data-testid="active-users"]')
      .should('contain', 'Alice')
      .and('contain', 'Bob');
    
    cy.get('[data-testid="user-count"]').should('contain', '3'); // Including current user
    
    // Simulate user leaving
    cy.acReceiveMessage('DocumentChannel', {
      action: 'user_left',
      user_id: 'alice',
      user_name: 'Alice'
    });
    
    // Verify user removed from active list
    cy.get('[data-testid="active-users"]').should('not.contain', 'Alice');
    cy.get('[data-testid="user-count"]').should('contain', '2');
  });

  it('is expected to handle document auto-save with network interruption', () => {
    cy.acSubscribe('DocumentChannel', { document_id: '123' });
    cy.acWaitForSubscription('DocumentChannel');
    
    // Make changes to trigger auto-save
    cy.get('[data-testid="document-editor"]').type('Auto-save test content');
    
    // Simulate network interruption during save
    cy.acSimulateNetworkInterruption(2000);
    
    // Verify save status shows offline
    cy.get('[data-testid="save-status"]')
      .should('contain', 'Offline')
      .or('contain', 'Saving pending...');
    
    // Wait for reconnection
    cy.acWaitForConnection();
    
    // Verify save resumes after reconnection
    cy.acReceiveMessage('DocumentChannel', {
      action: 'save_complete',
      document_id: '123',
      saved_at: new Date().toISOString()
    });
    
    cy.get('[data-testid="save-status"]').should('contain', 'Saved');
  });

  it('is expected to handle high-frequency live updates', () => {
    cy.acSubscribe('LiveDataChannel', { dashboard_id: 'metrics_001' });
    cy.acWaitForSubscription('LiveDataChannel');
    
    // Simulate high-frequency data updates (like live metrics)
    const updates = [];
    for (let i = 0; i < 10; i++) {
      updates.push({
        action: 'data_update',
        metric: 'active_users',
        value: 100 + i,
        timestamp: Date.now() + i * 100
      });
    }
    
    // Send updates rapidly
    cy.acSimulateConversation('LiveDataChannel', updates);
    
    // Verify final value is displayed (testing throttling/debouncing)
    cy.get('[data-testid="active-users-metric"]')
      .should('contain', '109'); // Last value
    
    // Verify not all intermediate values were rendered (due to throttling)
    cy.acGetMessages('LiveDataChannel').should('have.length', 10);
  });
});
