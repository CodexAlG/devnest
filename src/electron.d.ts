interface ElectronAPI {
  getVersion: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
}

interface Window {
  electron: ElectronAPI;
}
