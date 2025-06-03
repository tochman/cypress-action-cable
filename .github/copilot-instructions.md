<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Cypress Action Cable Plugin Development Guidelines

This is a TypeScript-based Cypress plugin for testing Action Cable WebSocket connections. When working on this project, please follow these guidelines:

## Project Structure
- `src/types/` - TypeScript type definitions
- `src/mocks/` - Mock implementations for WebSocket and Action Cable
- `src/commands/` - Cypress custom commands
- `src/index.ts` - Main entry point

## Code Style
- Use TypeScript with strict type checking
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Export types and interfaces for library consumers

## Testing Guidelines
- All mock classes should implement the real interfaces
- WebSocket mocks should behave like real WebSocket connections
- Action Cable mocks should follow Rails Action Cable behavior
- Commands should be chainable and follow Cypress patterns
- Include proper error handling and timeouts

## Action Cable Specifics
- Action Cable uses JSON messages with `command`, `identifier`, and `data` fields
- Subscriptions are identified by JSON strings containing channel info
- Handle ping/pong messages for connection keepalive
- Support both simple channel names and channel objects with parameters

## Dependencies
- Cypress is a peer dependency
- TypeScript for development
- No runtime dependencies to keep the plugin lightweight

## Documentation
- Update README.md for any new features
- Include code examples for complex functionality
- Document all public methods and their parameters
- Maintain changelog for version updates
