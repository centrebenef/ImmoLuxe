import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('immoluxeDesktop', {
  isDesktop: true,
  platform: process.platform,
});
