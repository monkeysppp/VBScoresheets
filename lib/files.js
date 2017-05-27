
'use strict';

const fs = require('fs');
const path = require('path');
const debug = require('debug')('vbs:files');

/**
 * saveTeamFile - Promise to save the team data in the user's home directory
 *
 * @param  {string} filename the file name to save as.  If this is undefined, the function will pick a name and return it.
 * @param  {object} data     The team data to save - this is an object obeying the JSON schema defined in /schemas/team.json
 * @return {Promise}         Promise to the name of the saved file.
 */
function saveTeamFile(filename, data) {
  let dataDir = getDataDir();

  debug('#saveTeamFile datadir is ' + dataDir);

  if (typeof data !== 'object') {
    debug('#saveTeamFile bad data object, type is ' + typeof data);
    return Promise.reject(new Error('data field must be an object'));
  }

  return new Promise((resolve, reject) => {
    let writeFilename = filename;
    if (!writeFilename) {
      writeFilename = data.name.replace(/[^a-zA-Z0-9-_\.\ ]/g, '').toLowerCase() + '.json';
      debug('#saveTeamFile no filename, calculated as ' + writeFilename);
    }

    fs.mkdir(dataDir, (err) => {
      if (err) {
        debug('#saveTeamFile mkdir returned error ' + err.toString());
        return reject(err);
      }
      fs.writeFile(path.join(dataDir, writeFilename), JSON.stringify(data), (err) => {
        if (err) {
          debug('#saveTeamFile writefile returned error ' + err.toString());
          return reject(err);
        }
        debug('#saveTeamFile writefile wrote file ' + writeFilename);
        resolve(writeFilename);
      });
    });
  });
}


/**
 * listTeamFiles - Return a promise to a list of all available files and their team names.
 *
 * @return {Promise}  Prmoise to an array of objects of the form {filename:x, teamname: x}
 */
function listTeamFiles() {
  let dataDir = getDataDir();

  debug('#listTeamFiles datadir is ' + dataDir);

  return new Promise((resolve, reject) => {
    fs.readdir(dataDir, (err, files) => {
      if (err) {
        debug('#listTeamFiles readdir returned with an error ' + err.toString());
        if (err.code === 'ENOENT') {
          debug('#listTeamFiles readdir resolving with []');
          return resolve([]);
        } else {
          debug('#listTeamFiles readdir rejecting');
          return reject(err);
        }
      }
      resolve(files);
    });
  }).then((files) => {
    if (files.length === 0) {
      debug('#listTeamFiles readdir found no files');
      return Promise.resolve([]);
    }

    let fileAndTeamList = [];

    files.forEach((file) => {
      debug('#listTeamFiles processing file ' + file);
      fileAndTeamList.push(new Promise((resolve, reject) => {
        fs.readFile(path.join(dataDir, file), (err, data) => {
          if (err) {
            debug('#listTeamFiles readFile returned with an error ' + err.toString());
            return reject(err);
          }
          let dataObj = JSON.parse(data);
          debug('#listTeamFiles readFile resolving with file ' + file + ' and team name ' + dataObj.name);
          resolve({filename:file, teamname:dataObj.name});
        });
      }));
    });

    return Promise.all(fileAndTeamList);
  });
}

/**
 * loadTeamFile - Load the team data from the given file.
 *
 * @param  {type} filename The file to load
 * @return {Promise}       A promise to the team datd to load
 */
function loadTeamFile(filename) {
  let dataDir = getDataDir();

  debug('#loadTeamFile datadir is ' + dataDir);
  debug('#loadTeamFile filename is of type ' + typeof filename + ' and value ' + filename);

  return new Promise((resolve, reject) => {

    if (typeof filename !== 'string' || filename.length === 0) {
      return reject('invalid filename specified');
    }

    fs.readFile(path.join(dataDir, filename), (err, data) => {
      if (err) {
        return reject(err);
      }

      try {
        return resolve(JSON.parse(data));
      } catch (err) {
        return reject('file contents is invalid');
      }
    });
  });
}


/**
 * getDataDir - Helper function to get the user's home directory
 *
 * @return {string}  The name of the user's home directory
 */
function getDataDir() {
  return path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], '.vbscoresheets');
}

module.exports = {
  internal: {
    getDataDir: getDataDir
  },
  saveTeamFile: saveTeamFile,
  listTeamFiles: listTeamFiles,
  loadTeamFile: loadTeamFile
};
