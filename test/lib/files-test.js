
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(chaiAsPromised);
chai.use(sinonChai);

const files = require('../../lib/files.js');
const fs = require('fs');
const path = require('path');

describe('files-test', () => {
  describe('getDataDir', () => {
    let originalHome = process.env.HOME;
    let originalUserprofile = process.env.USERPROFILE;
    let originalPlatform = process.platform;

    beforeEach(() => {
      process.env.HOME = 'thisIsHome';
      process.env.USERPROFILE = 'thisIsUserProfile';
    });

    afterEach(() => {
      if (originalHome) {
        process.env.HOME = originalHome;
      }
      if (originalUserprofile) {
        process.env.USERPROFILE = originalUserprofile;
      }
      Object.defineProperty(process, 'platform', {value: originalPlatform});
    });

    context('on win32', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {value: 'win32'});
      });

      it('returns USERPROFILE', () => {
        expect(files.internal.getDataDir()).to.equal(path.join('thisIsUserProfile', '.vbscoresheets'));
      });
    });

    context('on all other platforms', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {value: 'linux'});
      });

      it('returns HOME', () => {
        expect(files.internal.getDataDir()).to.equal(path.join('thisIsHome', '.vbscoresheets'));
      });
    });
  });

  describe('saveTeamFile', () => {
    let dataDir = files.internal.getDataDir();
    let fsWriteFileStub;
    let fsMkdirStub;
    let teamname = 'my Team! All *s';
    let expectedFilename = 'my team all s.json';

    let dataObj = {name: teamname, key:'value'};
    let dataString = JSON.stringify(dataObj);

    beforeEach(() => {
      fsWriteFileStub = sinon.stub(fs, 'writeFile');
      fsMkdirStub = sinon.stub(fs, 'mkdir').yields();
    });

    afterEach(() => {
      fsWriteFileStub.restore();
      fsMkdirStub.restore();
    });

    context('with a given file name', () => {

      context('when called with a string for data', () => {
        it('rejects with an error', () => {
          return expect(files.saveTeamFile('file1', 'data')).to.be.rejectedWith('data field must be an object')
            .then(() => {
              expect(fsWriteFileStub).to.not.be.called;
            });
        });
      });

      context('when called with undefined for data', () => {
        it('rejects with an error', () => {
          return expect(files.saveTeamFile('file1', 'data')).to.be.rejectedWith('data field must be an object')
            .then(() => {
              expect(fsWriteFileStub).to.not.be.called;
            });
        });
      });

      context('when the file write succeeds', () => {
        beforeEach(() => {
          fsWriteFileStub.yields(undefined);
        });

        it('saves the file and returns the file name', () => {
          return expect(files.saveTeamFile('file1', dataObj)).to.not.be.rejected
            .then((name) => {
              expect(fsWriteFileStub).to.be.calledOnce;
              expect(fsWriteFileStub).to.be.calledWith(path.join(dataDir, 'file1'), dataString);
              expect(name).to.equal('file1');
            });
        });
      });

      context('when the file write fails', () => {
        beforeEach(() => {
          fsWriteFileStub.yields(new Error('Bang!'));
        });

        it('rejects with the error', () => {
          return expect(files.saveTeamFile('file1', dataObj)).to.be.rejectedWith('Bang!')
            .then(() => {
              expect(fsWriteFileStub).to.be.calledOnce;
              expect(fsWriteFileStub).to.be.calledWith(path.join(dataDir, 'file1'), dataString);
            });
        });
      });

    });

    context('with no file name', () => {
      context('when called with a string for data', () => {
        it('rejects with an error', () => {
          return expect(files.saveTeamFile(undefined, 'data')).to.be.rejectedWith('data field must be an object')
            .then(() => {
              expect(fsWriteFileStub).to.not.be.called;
            });
        });
      });

      context('when called with undefined for data', () => {
        it('rejects with an error', () => {
          return expect(files.saveTeamFile(undefined, 'data')).to.be.rejectedWith('data field must be an object')
            .then(() => {
              expect(fsWriteFileStub).to.not.be.called;
            });
        });
      });

      context('when the file write succeeds', () => {
        beforeEach(() => {
          fsWriteFileStub.yields(undefined);
        });

        it('saves the file and returns a file name from the team name', () => {
          return expect(files.saveTeamFile(undefined, dataObj)).to.not.be.rejected
            .then((name) => {
              expect(fsWriteFileStub).to.be.calledOnce;
              expect(fsWriteFileStub).to.be.calledWith(path.join(dataDir, expectedFilename), dataString);
              expect(name).to.equal(expectedFilename);
            });
        });
      });

      context('when the file write fails', () => {
        beforeEach(() => {
          fsWriteFileStub.yields(new Error('Bang!'));
        });

        it('rejects with the error', () => {
          return expect(files.saveTeamFile(undefined, dataObj)).to.be.rejectedWith('Bang!')
            .then(() => {
              expect(fsWriteFileStub).to.be.calledOnce;
              expect(fsWriteFileStub).to.be.calledWith(path.join(dataDir, expectedFilename), dataString);
            });
        });
      });
    });

    context('when the mkdir fails', () => {
      context('because the dir exists', () => {
        beforeEach(() => {
          let err = new Error('file or directory already exists');
          err.code = 'EEXIST';
          fsMkdirStub.yields(err);
          fsWriteFileStub.yields(undefined);
        });

        it('rejects with the error', () => {
          return expect(files.saveTeamFile(undefined, dataObj)).to.not.be.rejected
            .then((name) => {
              expect(fsWriteFileStub).to.be.calledOnce;
              expect(fsWriteFileStub).to.be.calledWith(path.join(dataDir, expectedFilename), dataString);
              expect(name).to.equal(expectedFilename);
            });
        });
      });

      context('because of a general error', () => {
        beforeEach(() => {
          fsMkdirStub.yields(new Error('Bang!'));
        });

        it('rejects with the error', () => {
          return expect(files.saveTeamFile(undefined, dataObj)).to.be.rejectedWith('Bang!')
            .then(() => {
              expect(fsWriteFileStub).to.not.be.called;
            });
        });
      });
    });

  });

  describe('listTeamFiles', () => {
    let dataDir = files.internal.getDataDir();
    let fsReaddirStub;
    let fsReadFileStub;

    beforeEach(() => {
      fsReaddirStub = sinon.stub(fs, 'readdir');
      fsReadFileStub = sinon.stub(fs, 'readFile');
    });

    afterEach(() => {
      fsReaddirStub.restore();
      fsReadFileStub.restore();
    });

    context('with a dir read error', () => {
      beforeEach(() => {
        fsReaddirStub.yields(new Error('Bang!'));
      });

      it('rejects with an error', () => {
        return expect(files.listTeamFiles()).to.be.rejectedWith('Bang!')
          .then(() => {
            expect(fsReadFileStub).to.not.be.called;
          });
      });
    });

    context('with a file read error', () => {
      beforeEach(() => {
        fsReaddirStub.yields(undefined, ['file1']);
        fsReadFileStub.onCall(0).yields(new Error('Bang!'));
      });

      it('rejects with an error', () => {
        return expect(files.listTeamFiles()).to.be.rejectedWith('Bang!')
          .then(() => {
            expect(fsReaddirStub).to.be.calledOnce;
            expect(fsReaddirStub).to.be.calledWith(dataDir);
            expect(fsReadFileStub).to.be.calledOnce;
            expect(fsReadFileStub).to.be.calledWith(path.join(dataDir, 'file1'));
          });
      });
    });

    context('with no data directory', () => {
      beforeEach(() => {
        let err = new Error('no such file or directory');
        err.code = 'ENOENT';
        fsReaddirStub.yields(err);
      });

      it('returns an empty array', () => {
        return expect(files.listTeamFiles()).to.not.be.rejected
          .then((filelist) => {
            expect(fsReaddirStub).to.be.calledOnce;
            expect(fsReaddirStub).to.be.calledWith(dataDir);
            expect(filelist).to.deep.equal([]);
          });
      });
    });

    context('with an empty data directory', () => {
      beforeEach(() => {
        fsReaddirStub.yields(undefined, []);
      });

      it('returns an empty array', () => {
        return expect(files.listTeamFiles()).to.not.be.rejected
          .then((filelist) => {
            expect(fsReaddirStub).to.be.calledOnce;
            expect(fsReaddirStub).to.be.calledWith(dataDir);
            expect(filelist).to.deep.equal([]);
          });
      });
    });

    context('with one team file', () => {
      beforeEach(() => {
        fsReaddirStub.yields(undefined, ['file1']);
        fsReadFileStub.onCall(0).yields(undefined, '{"name": "team1","seasons": []}');
      });

      it('returns details on that file', () => {
        return expect(files.listTeamFiles()).to.not.be.rejected
          .then((filelist) => {
            expect(fsReaddirStub).to.be.calledOnce;
            expect(fsReaddirStub).to.be.calledWith(dataDir);
            expect(fsReadFileStub).to.be.calledOnce;
            expect(fsReadFileStub).to.be.calledWith(path.join(dataDir, 'file1'));
            expect(filelist).to.deep.equal([{filename: 'file1', teamname: 'team1'}]);
          });
      });
    });

    context('with 3 team files', () => {
      beforeEach(() => {
        fsReaddirStub.yields(undefined, ['file1','file2','file3']);
        fsReadFileStub.onCall(0).yields(undefined, '{"name": "team1","seasons": []}');
        fsReadFileStub.onCall(1).yields(undefined, '{"name": "team2","seasons": []}');
        fsReadFileStub.onCall(2).yields(undefined, '{"name": "team3","seasons": []}');
      });

      it('returns details on all 3 files', () => {
        return expect(files.listTeamFiles()).to.not.be.rejected
          .then((filelist) => {
            expect(fsReaddirStub).to.be.calledOnce;
            expect(fsReaddirStub).to.be.calledWith(dataDir);
            expect(fsReadFileStub).to.be.calledThrice;
            expect(fsReadFileStub).to.be.calledWith(path.join(dataDir, 'file1'));
            expect(fsReadFileStub).to.be.calledWith(path.join(dataDir, 'file2'));
            expect(fsReadFileStub).to.be.calledWith(path.join(dataDir, 'file3'));
            expect(filelist).to.deep.equal([{filename: 'file1', teamname: 'team1'}, {filename: 'file2', teamname: 'team2'}, {filename: 'file3', teamname: 'team3'}]);
          });
      });
    });

    // TODO
    context('with an invalid file', () => {

    });
  });

  describe('loadTeamFile', () => {
    let dataDir = files.internal.getDataDir();
    let fsReadFileStub;
    let expectedDataObj = {
      name: 'my team name',
      seasons: [
        {
          name: '2016/2017'
        }
      ]
    };
    let expectedDataJSON = JSON.stringify(expectedDataObj);

    beforeEach(() => {
      fsReadFileStub = sinon.stub(fs, 'readFile');
    });

    afterEach(() => {
      fsReadFileStub.restore();
    });


    context('when no filename is given', () => {
      it('rejects with an error', () => {
        return expect(files.loadTeamFile()).to.be.rejectedWith('invalid filename specified')
          .then(() => {
            expect(fsReadFileStub).to.not.be.called;
          });
      });
    });

    context('when a zero-length filename is given', () => {
      it('rejects with an error', () => {
        return expect(files.loadTeamFile('')).to.be.rejectedWith('invalid filename specified')
          .then(() => {
            expect(fsReadFileStub).to.not.be.called;
          });
      });
    });

    context('when the filename does not exist', () => {
      beforeEach(() => {
        let err = new Error('no such file or directory');
        err.code = 'ENOENT';
        fsReadFileStub.yields(err);
      });

      it('rejects with an error', () => {
        return expect(files.loadTeamFile('file1')).to.be.rejectedWith('no such file or directory')
          .then(() => {
            expect(fsReadFileStub).to.be.calledWith(path.join(dataDir, 'file1'));
          });
      });
    });

    context('when the fileread fails', () => {
      beforeEach(() => {
        fsReadFileStub.yields(new Error('Bang!'));
      });

      it('rejects with an error', () => {
        return expect(files.loadTeamFile('file1')).to.be.rejectedWith('Bang!')
          .then(() => {
            expect(fsReadFileStub).to.be.calledWith(path.join(dataDir, 'file1'));
          });
      });
    });

    context('when the file content is not JSON', () => {
      beforeEach(() => {
        fsReadFileStub.yields(undefined, 'this is not JSON');
      });

      it('rejects with an error', () => {
        return expect(files.loadTeamFile('file1')).to.be.rejectedWith('file contents is invalid')
          .then(() => {
            expect(fsReadFileStub).to.be.calledWith(path.join(dataDir, 'file1'));
          });
      });
    });

    context('when the file loads successfully', () => {
      beforeEach(() => {
        fsReadFileStub.yields(undefined, expectedDataJSON);
      });

      it('resolves with the file data', () => {
        return expect(files.loadTeamFile('file1')).to.not.be.rejected
          .then((dataObj) => {
            expect(fsReadFileStub).to.be.calledWith(path.join(dataDir, 'file1'));
            expect(dataObj).to.deep.equal(expectedDataObj);
          });

      });
    });

  });
});
