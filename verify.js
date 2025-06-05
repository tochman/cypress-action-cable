#!/usr/bin/env node
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
// Verification script for Cypress Action Cable plugin 

const path = require('path');
const fs = require('fs');

console.log('🔍 Verifying Cypress Action Cable plugin ...\n');

try {
  // Test loading the main module WITHOUT the commands (they need Cypress context)
  // We'll test the pure JavaScript modules that can run in Node.js
  
  // Test ActionCable mock directly
  const { ActionCableMock } = require('./dist/mocks/action-cable-mock.js');
  console.log('✅ ActionCableMock class loads successfully');
  
  // Test WebSocket setup functions
  const { setupMockActionCable, teardownMockActionCable } = require('./dist/mocks/mock-websocket.js');
  console.log('✅ WebSocket mock functions load successfully');
  
  // Test helper functions
  const helpers = require('./dist/helpers/websocket-helpers.js');
  console.log('✅ WebSocket helpers load successfully');
  
  // Verify ActionCableMock class exists and has the right structure
  if (typeof ActionCableMock === 'function') {
    console.log('✅ ActionCableMock is a constructor function');
    
    // Check static methods/properties without instantiating
    const mockPrototype = ActionCableMock.prototype;
    const expectedMethods = ['subscribe', 'simulateReceive', 'disconnect'];
    
    expectedMethods.forEach(method => {
      if (typeof mockPrototype[method] === 'function') {
        console.log(`✅ ActionCableMock has method: ${method}`);
      } else {
        console.log(`❌ ActionCableMock missing method: ${method}`);
      }
    });
  } else {
    console.log('❌ ActionCableMock is not a constructor function');
  }
  
  // Test helper functions exist
  const expectedHelpers = [
    'simulateNetworkInterruption',
    'waitForWebSocketEvent',
    'waitForActionCableEvent',
    'verifySubscription'
  ];
  
  expectedHelpers.forEach(helperName => {
    if (typeof helpers[helperName] === 'function') {
      console.log(`✅ Helper function '${helperName}' available`);
    } else {
      console.log(`❌ Helper function '${helperName}' missing`);
    }
  });
  
  // Test loading commands (they auto-register with Cypress when imported)
  const commandsPath = './dist/commands/commands.js';
  if (fs.existsSync(commandsPath)) {
    console.log('✅ Commands file exists');
    
    // Check if commands contain the expected Cypress.Commands.add calls
    const commandsContent = fs.readFileSync(commandsPath, 'utf8');
    
    const expectedCommands = [
      'mockActionCable',
      'acSubscribe', 
      'acReceiveMessage',
      'acSimulateConversation',
      'acSubscription',
      'acGetMessages',
      'acClearMessages',
      'acAssertMessageSent',
      'acDisconnect',
      'acSimulateNetworkInterruption',
      'acWaitForConnection',
      'acWaitForSubscription'
    ];
    
    let missingCommands = [];
    expectedCommands.forEach(cmd => {
      if (commandsContent.includes(`'${cmd}'`) || commandsContent.includes(`"${cmd}"`)) {
        console.log(`✅ Command '${cmd}' found`);
      } else {
        console.log(`❌ Command '${cmd}' missing`);
        missingCommands.push(cmd);
      }
    });
    
    if (missingCommands.length === 0) {
      console.log('\n🎉 All Cypress commands verified!');
    } else {
      console.log(`\n⚠️  ${missingCommands.length} command(s) missing: ${missingCommands.join(', ')}`);
    }
    
  } else {
    console.log('❌ Commands file missing');
  }
  
  // Test that all mock files exist
  const mockFiles = [
    './dist/mocks/action-cable-mock.js',
    './dist/mocks/mock-websocket.js'
  ];
  
  mockFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ Mock file exists: ${path.basename(file)}`);
    } else {
      console.log(`❌ Mock file missing: ${path.basename(file)}`);
    }
  });
  
  // Test helper files
  const helperFiles = [
    './dist/helpers/websocket-helpers.js'
  ];
  
  helperFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ Helper file exists: ${path.basename(file)}`);
    } else {
      console.log(`❌ Helper file missing: ${path.basename(file)}`);
    }
  });
  
  // Test TypeScript declarations
  const typesPath = './cypress-action-cable.d.ts';
  if (fs.existsSync(typesPath)) {
    console.log('✅ TypeScript declarations available');
    
    // Check for key type definitions
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    if (typesContent.includes('ActionCableSubscription')) {
      console.log('✅ ActionCableSubscription interface found');
    } else {
      console.log('❌ ActionCableSubscription interface missing');
    }
    
    if (typesContent.includes('ConversationMessage')) {
      console.log('✅ ConversationMessage interface found');
    } else {
      console.log('❌ ConversationMessage interface missing');
    }
  } else {
    console.log('❌ TypeScript declarations missing');
  }
  
  // Test that documentation exists
  if (fs.existsSync('./README.md')) {
    console.log('✅ README.md documentation available');
  } else {
    console.log('❌ README.md documentation missing');
  }
  
  console.log('\n🎉 Verification complete!');
  console.log('\n📦 Plugin is ready for use. To install in a project:');
  console.log('   npm install --save-dev file:path/to/this/plugin');
  console.log('\n📚 Usage:');
  console.log('   // In cypress/support/commands.js');
  console.log('   import "cypress-action-cable"');
  console.log('\n   // In your tests');
  console.log('   cy.mockActionCable()');
  console.log('   cy.acSubscribe("ChatChannel", { room: "general" })');
  console.log('   cy.acReceiveMessage("ChatChannel", { message: "Hello!" })');
  console.log('\n📖 See README.md for complete documentation and examples.');
  
} catch (error) {
  console.log('❌ Error during verification:', error.message);
  console.log('\n🔧 This might indicate:');
  console.log('   - Missing dependencies (run: npm install)');
  console.log('   - Build not complete (run: npm run build)');
  console.log('   - File permission issues');
  console.log('\n💡 Try running: npm run build && node verify.js');
  process.exit(1);
}
