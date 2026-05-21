import { contextBridge, ipcRenderer, shell } from "electron";

contextBridge.exposeInMainWorld("electron", {
  getVersion: (): Promise<string> => ipcRenderer.invoke("get-version"),

  openExternal: (url: string): Promise<void> =>
    new Promise((resolve) => {
      ipcRenderer.send("open-external", url);
      resolve();
    }),

  send: (channel: string, ...args: unknown[]): void => {
    ipcRenderer.send(channel, ...args);
  },

  on: (channel: string, callback: (...args: unknown[]) => void): void => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, handler);
  },
});
