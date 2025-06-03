import { WebSocketMockOptions } from '../types';

export class MockWebSocket implements WebSocket {
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  public url: string;
  public readyState: number = WebSocket.CONNECTING;
  public protocol: string = '';
  public extensions: string = '';
  public binaryType: BinaryType = 'blob';
  public bufferedAmount: number = 0;

  public onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  public onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  public onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  public onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;

  private eventListeners: Map<string, Array<(event: any) => void>> = new Map();
  private mockOptions: WebSocketMockOptions;

  constructor(url: string | URL, protocols?: string | string[]) {
    this.url = url.toString();
    this.mockOptions = {
      url: this.url,
      protocols,
      autoOpen: true,
      openDelay: 0
    };

    // Simulate connection opening
    if (this.mockOptions.autoOpen) {
      setTimeout(() => {
        this.simulateOpen();
      }, this.mockOptions.openDelay || 0);
    }
  }

  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState === WebSocket.OPEN) {
      // Store sent messages for testing
      this.storeSentMessage(data);
    } else {
      throw new Error('WebSocket is not open');
    }
  }

  public close(code?: number, reason?: string): void {
    if (this.readyState === WebSocket.OPEN || this.readyState === WebSocket.CONNECTING) {
      this.readyState = WebSocket.CLOSING;
      setTimeout(() => {
        this.simulateClose(code, reason);
      }, 0);
    }
  }

  public addEventListener(type: string, listener: (event: any) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  public removeEventListener(type: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public dispatchEvent(event: Event): boolean {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }

    // Also call the on* handlers
    switch (event.type) {
      case 'open':
        if (this.onopen) this.onopen.call(this, event);
        break;
      case 'close':
        if (this.onclose) this.onclose.call(this, event as CloseEvent);
        break;
      case 'error':
        if (this.onerror) this.onerror.call(this, event);
        break;
      case 'message':
        if (this.onmessage) this.onmessage.call(this, event as MessageEvent);
        break;
    }

    return true;
  }

  // Mock-specific methods for testing
  public simulateOpen(): void {
    this.readyState = WebSocket.OPEN;
    const event = new Event('open');
    this.dispatchEvent(event);
  }

  public simulateClose(code: number = 1000, reason: string = ''): void {
    this.readyState = WebSocket.CLOSED;
    const event = new CloseEvent('close', {
      code,
      reason,
      wasClean: code === 1000
    });
    this.dispatchEvent(event);
  }

  public simulateError(): void {
    const event = new Event('error');
    this.dispatchEvent(event);
  }

  public simulateMessage(data: any): void {
    if (this.readyState === WebSocket.OPEN) {
      const event = new MessageEvent('message', { data });
      this.dispatchEvent(event);
    }
  }

  private storeSentMessage(data: any): void {
    // Store in Cypress for later verification
    if (typeof window !== 'undefined' && (window as any).cy) {
      const cy = (window as any).cy;
      if (!cy.actionCableMessages) {
        cy.actionCableMessages = [];
      }
      cy.actionCableMessages.push({
        timestamp: Date.now(),
        data: typeof data === 'string' ? data : data.toString(),
        url: this.url
      });
    }
  }
}
