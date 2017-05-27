
'use strict';

const state = document.querySelector('.pick-a-team');
const teamList = document.getElementById('pick-a-team_list');

// var thisStateManager;

const teamFilesListener = (event, teamFileData) => {
  teamFileData.forEach((elem) => {
    var p = document.createElement('p');
    p.innerHTML = elem.filename + ' ==&gt; ' + elem.teamname;
    teamList.appendChild(p);
  });
};

function init(/*stateManager*/) {
  // thisStateManager = stateManager;

}

function attach() {
  ipc.on('return-team-files', teamFilesListener);
  ipc.send('get-team-files');
}

function detach() {
  ipc.removeListener('return-team-files', teamFilesListener);
}

module.exports = {
  name: 'pick-a-team',
  state: state,
  init: init,
  attach: attach,
  detach: detach
};
