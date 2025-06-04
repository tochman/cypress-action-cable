#!/usr/bin/env node
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
// Simple verification script to test the plugin loads correctly

const path = require('path');

console.log('🔍 Verifying Cypress Action Cable plugin...\n');

try {
  // Test loading the main module
  const pluginMain = require('./dist/index.js');
  console.log('✅ Main module loads successfully');
  
  // Test that exports are available
  if (pluginMain.MockWebSocket) {
    console.log('✅ MockWebSocket export available');
  } else {
    console.log('❌ MockWebSocket export missing');
  }
  
  if (pluginMain.createMockActionCable) {
    console.log('✅ createMockActionCable factory function available');
  } else {
    console.log('❌ createMockActionCable factory function missing');
  }

  if (pluginMain.createMockActionCableServer) {
    console.log('✅ createMockActionCableServer factory function available');
  } else {
    console.log('❌ createMockActionCableServer factory function missing');
  }
  
  if (pluginMain.setupActionCableMocking) {
    console.log('✅ setupActionCableMocking helper available');
  } else {
    console.log('❌ setupActionCableMocking helper missing');
  }
  
  // Test loading commands
  const fs = require('fs');
  const commandsPath = './dist/commands/commands.js';
  if (fs.existsSync(commandsPath)) {
    console.log('✅ Commands file exists');
    
    // Check if commands contain the expected Cypress.Commands.add calls
    const commandsContent = fs.readFileSync(commandsPath, 'utf8');
    const expectedCommands = [
      'mockActionCable',
      'createActionCableConsumer', 
      'subscribeToChannel',
      'performChannelAction',
      'waitForActionCableConnection',
      'disconnectActionCable',
      'sendToChannel',
      'simulateIncomingMessage',
      'simulateNetworkInterruption',
      'simulateConversation',
      'getMessageHistory',
      'clearMessageHistory',
      // Reliability helper commands
      'forceActionCableConnection',
      'subscribeImmediately',
      'sendActionCableMessageImmediately',
      'receiveMessageImmediately',
      'shouldHaveActionCableMessageReliably',
      'cleanActionCableState',
      'setupReliableActionCable'
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
      console.log('\n🎉 All verification checks passed!');
      console.log('\n📦 Plugin is ready for use. To install in a project:');
      console.log('   npm install --save-dev ./path/to/this/plugin');
      console.log('\n📚 See README.md for usage instructions.');
    } else {
      console.log(`\n⚠️  ${missingCommands.length} command(s) missing: ${missingCommands.join(', ')}`);
    }
    
  } else {
    console.log('❌ Commands file missing');
  }
  
  // Test TypeScript declarations
  const typesPath = './cypress-action-cable.d.ts';
  if (fs.existsSync(typesPath)) {
    console.log('✅ TypeScript declarations available');
  } else {
    console.log('❌ TypeScript declarations missing');
  }
  
} catch (error) {
  console.log('❌ Error loading plugin:', error.message);
  process.exit(1);
}
