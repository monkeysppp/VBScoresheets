'use strict';

var remote = require('remote');
var Menu = remote.require('menu');
var path = require('path');
var ipc = require('ipc');

var closeEl = document.querySelector('.close');
closeEl.addEventListener('click', function () {
    ipc.send('close-main-window');
});
