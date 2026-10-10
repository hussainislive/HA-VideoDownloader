export const IPC_CHANNELS = {
  clipboard: { readUrl: 'clipboard:read-url' },
  dialog: { chooseFolder: 'dialog:choose-folder' },
  downloads: {
    cancel: 'downloads:cancel',
    clearCompleted: 'downloads:clear-completed',
    enqueue: 'downloads:enqueue',
    list: 'downloads:list',
    pause: 'downloads:pause',
    remove: 'downloads:remove',
    resume: 'downloads:resume',
    retry: 'downloads:retry',
    updated: 'downloads:updated',
  },
  engine: {
    checkUpdate: 'engine:check-update',
    getStatus: 'engine:get-status',
    statusChanged: 'engine:status-changed',
  },
  library: {
    delete: 'library:delete',
    list: 'library:list',
    search: 'library:search',
    updated: 'library:updated',
  },
  media: { probe: 'media:probe' },
  settings: {
    get: 'settings:get',
    update: 'settings:update',
    updated: 'settings:updated',
  },
  shell: {
    openFile: 'shell:open-file',
    showInFolder: 'shell:show-in-folder',
  },
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
