
const electron = require('electron');
const ipc = electron.ipcRenderer;

module.exports = (str) => {
  // Don't send the debug event if debug is turned off
  if (process.env.DEBUG && process.env.DEBUG.indexOf('vbs:') !== -1) {
    ipc.send('ui-debug', str);
  }
};
