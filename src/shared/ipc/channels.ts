export const IPC_CHANNELS = {
  system: {
    getVersion: 'system:get-version',
    openExternal: 'system:open-external',
  },
  window: {
    close: 'window:close',
    isMaximized: 'window:is-maximized',
    maximizeChanged: 'window:maximize-changed',
    minimize: 'window:minimize',
    toggleMaximize: 'window:toggle-maximize',
  },
} as const
