import { StatusRequest, StatusResponse, StatusError } from '../types/status';

// Declare chrome namespace for browser extension
declare global {
  interface Window {
    chrome: {
      runtime: {
        id: string | undefined;
        sendMessage: (message: any) => Promise<any>;
      };
    };
  };
}

export class StatusService {
  private static instance: StatusService;
  private statusListeners: Map<string, (status: StatusResponse) => void> = new Map();

  private constructor() {}

  public static getInstance(): StatusService {
    if (!StatusService.instance) {
      StatusService.instance = new StatusService();
    }
    return StatusService.instance;
  }

  public async getStatus(service: StatusRequest['service']): Promise<StatusResponse | StatusError> {
    try {
      // Initialize extension connection if not already done
      if (!window.chrome?.runtime?.id) {
        throw new Error('Extension not loaded');
      }

      const response = await window.chrome.runtime.sendMessage({
        type: 'GET_STATUS',
        payload: { service }
      });

      if (!response) {
        throw new Error('No response from extension');
      }

      return response;
    } catch (error) {
      console.error('Error getting status:', error);
      return {
        error: 'extension_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public addStatusListener(service: StatusRequest['service'], callback: (status: StatusResponse) => void): string {
    const listenerId = `${service}_${Date.now()}`;
    this.statusListeners.set(listenerId, callback);
    return listenerId;
  }

  public removeStatusListener(listenerId: string): void {
    this.statusListeners.delete(listenerId);
  }

  public handleStatusUpdate(status: StatusResponse): void {
    // Notify all listeners
    this.statusListeners.forEach((callback) => {
      callback(status);
    });
  }
}
