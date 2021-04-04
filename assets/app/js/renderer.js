/*
 #
 # Copyright (c) 2019 nexB Inc. and others. All rights reserved.
 # https://nexb.com and https://github.com/nexB/scancode-workbench/
 # The ScanCode Workbench software is licensed under the Apache License version 2.0.
 # ScanCode is a trademark of nexB Inc.
 #
 # You may not use this software except in compliance with the License.
 # You may obtain a copy of the License at: http://apache.org/licenses/LICENSE-2.0
 # Unless required by applicable law or agreed to in writing, software distributed
 # under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 # CONDITIONS OF ANY KIND, either express or implied. See the License for the
 # specific language governing permissions and limitations under the License.
 #
 */

const WorkbenchDB = require('./workbenchDB');
const Splitter = require('./helpers/splitter');
const Progress = require('./helpers/progress');

const ConclusionDialog = require('./controllers/conclusionDialog');
const FileDashboard = require('./controllers/fileDashboard');
const LicenseDashboard = require('./controllers/licenseDashboard');
const PackageDashboard = require('./controllers/packageDashboard');
const BarChart = require('./controllers/barChart');
const JsTree = require('./controllers/jsTree');
const ScanDataTable = require('./controllers/scanDataTable');
const ConclusionDataTable = require('./controllers/conclusionDataTable');

const dialog = require('electron').remote.dialog;
const fs = require('fs');
const os = require('os');
const path = require('path');
const shell = require('electron').shell;

// The Electron module used to communicate asynchronously from a renderer process to the main process.
const ipcRenderer = require('electron').ipcRenderer;
const workbenchVersion = require('../../../package.json').version;
const { webFrame } = require('electron');

/**
 * This is the UI Controller for the application. It's responsible for
 * initializing and updating all of the views and handling user interaction
 */
$(document).ready(() => {
  // Create default values for all of the data and ui classes
  let workbenchDB = new WorkbenchDB();

  const fileDashboard = new FileDashboard('#tab-file-dashboard', workbenchDB);
  const licenseDashboard = new LicenseDashboard('#tab-license-dashboard', workbenchDB);
  const packageDashboard = new PackageDashboard('#tab-package-dashboard', workbenchDB);

  const barChart = new BarChart('#tab-barchart', workbenchDB)
    .on('bar-clicked', (attribute, value) => {
      // Show files that contain attribute value selected by user in bar chart
      scanDataTable.clearColumnFilters();
      if (value !== 'No Value Detected') {
        scanDataTable.setColumnFilter(attribute, value);
      } else {
        scanDataTable.setColumnFilter(attribute, 'workbench_data_table_no_value_detected');
      }

      updateViewsByPath(scanDataTable._selectedPath);

      // This needs to be done only when the column is visible.
      // So we do it last to try our best
      showScanDataButton.trigger('click');
    });

  const scanDataTable = new ScanDataTable('#tab-scandata', workbenchDB);

  const conclusionsTable = new ConclusionDataTable('#tab-conclusion', workbenchDB)
    .on('export-json', exportJsonConclusions);

  const conclusionDialog = new ConclusionDialog('#conclusionDialog', workbenchDB)
    .on('save', () => {
      conclusionsTable.needsReload(true);
      redrawCurrentView();
    })
    .on('delete', () => {
      conclusionsTable.needsReload(true);
      redrawCurrentView();
    });

  const jstree = new JsTree('#jstree', workbenchDB)
    .on('node-edit', (node) => conclusionDialog.show(node.id))
    .on('node-selected', (node) => {
      updateViewsByPath(node.id);
    });

  $(document).on('click', '.activate-filters-button', () => {
    scanDataTable.genFilters();
    updateViewsByPath(scanDataTable._selectedPath);
  });

  $(document).on('click', '.reset-filters-button', () => {
    scanDataTable.resetColumnFilters();
    updateViewsByPath(scanDataTable._selectedPath);
  });

  $(document).on('click', '.clear-filters-button', () => {
    scanDataTable.clearColumnFilters();
    updateViewsByPath(scanDataTable._selectedPath);
  });

  $(document).on('click', '.checked-inline', () => {
    scanDataTable.getSearchPreference();
  });
  
  $(document).on('click', '#showApiKeyButton', () => {
    // Toggle API key visibilty (See issue: #391)
    const apiKeyInput = document.getElementById('apiKey');
    apiKeyInput.type = (apiKeyInput.type === 'password') ? 'text' : 'password';
  });

  const splitter = new Splitter('#leftCol', '#rightCol')
    .on('drag-end', () => redrawCurrentView());

  // The id of the currently selected nav bar button.
  const currentNavButtonId = '#sidebar-wrapper .sidebar-nav .active button';

  // Defines DOM element constants for sidebar buttons.
  const importJsonButton = $('#import-json');
  const saveSQLiteFileButton = $('#save-file');
  const openSQLiteFileButton = $('#open-file');
  const showScanDataButton = $('#show-tab-scandata');
  const showConclusionButton = $('#show-tab-conclusion');
  const showBarChartButton = $('#show-tab-barchart');
  const showFileDashboardButton = $('#show-tab-file-dashboard');
  const showLicenseDashboardButton = $('#show-tab-license-dashboard');
  const showPackageDashboardButton = $('#show-tab-package-dashboard');
  const showWelcomePageButton = $('#show-tab-welcomepage');

  // Import a ScanCode JSON resutls file
  importJsonButton.click(importJson);

  // Open a SQLite Database File
  openSQLiteFileButton.click(openSQLite);

  // Save a SQLite Database file
  saveSQLiteFileButton.click(saveSQLite);

  // Show ScanData DataTable. Hide node view and conclusion summary table
  showScanDataButton.click(() => {
    splitter.show();
    scanDataTable.redraw();
  });

  // Show conclusion summary table. Hide DataTable and node view
  showConclusionButton.click(() => {
    splitter.show();
    conclusionsTable.redraw();
  });

  showBarChartButton.click(() => {
    splitter.show();
    barChart.redraw();
  });

  showFileDashboardButton.click(() => {
    splitter.show();
    fileDashboard.redraw();
  });
  
  showLicenseDashboardButton.click(() => {
    splitter.show();
    licenseDashboard.redraw();
  });
  
  showPackageDashboardButton.click(() => {
    splitter.show();
    packageDashboard.redraw();
  });

  showWelcomePageButton.click(() => {
    splitter.hide();
  });
  

  // Open links in default browser
  $('.open-in-default').click((evt) => {
    evt.preventDefault();
    shell.openExternal(evt.target.href);
  });

  ipcRenderer.on('table-view', () => showScanDataButton.trigger('click'));
  ipcRenderer.on('conclusion-summary-view', () => showConclusionButton.trigger('click'));
  ipcRenderer.on('open-SQLite', () => openSQLiteFileButton.trigger('click'));
  ipcRenderer.on('chart-summary-view', () => showBarChartButton.trigger('click'));
  ipcRenderer.on('save-SQLite', () => saveSQLiteFileButton.trigger('click'));
  ipcRenderer.on('import-JSON', importJson);
  ipcRenderer.on('export-JSON', exportJson);
  ipcRenderer.on('export-JSON-conclusions-only', exportJsonConclusions);
  ipcRenderer.on('get-ScanHeader', getScanHeader);
  ipcRenderer.on('zoom-reset', zoomReset);
  ipcRenderer.on('zoom-in', zoomIn);
  ipcRenderer.on('zoom-out', zoomOut);

  // Opens the Welcome Page view when the app is first opened
  showWelcomePageButton.trigger('click');

  function updateViewsByPath(path) {
    // Update all the views with the given path string
    $('#file-dashboard-title-text').text('File Info Dashboard - ' + path);
    $('#license-dashboard-title-text').text('License Info Dashboard - ' + path);
    $('#package-dashboard-title-text').text('Package Info Dashboard - ' + path);
    scanDataTable.columns(0).search(path);

    conclusionDialog.selectedPath(path);
    jstree.selectedPath(path);
    scanDataTable.selectedPath(path);
    conclusionsTable.selectedPath(path);
    fileDashboard.selectedPath(path);
    licenseDashboard.selectedPath(path);
    packageDashboard.selectedPath(path);
    barChart.selectedPath(path);

    redrawCurrentView();
  }

  function schemaChange(dbVersion, workbenchVersion) {
    dbVersion = dbVersion.split('.');
    workbenchVersion = workbenchVersion.split('.');

    if (dbVersion[1] != workbenchVersion[1]) {
      return true;
    } else {
      return false;
    }
  }

  /** Creates the database and all View objects from a SQLite file */
  function loadDatabase(fileName) {
    // Create a new database when importing a json file
    workbenchDB = new WorkbenchDB({
      dbName: 'workbench_db',
      dbStorage: fileName
    });
    
    // Check that that the database schema matches current schema.
    workbenchDB.sync
      .then((db) => db.Header.findById(1)
        .then((header) => {
          const dbVersion = header.workbench_version;
          if (schemaChange(dbVersion, workbenchVersion)) { 
            dialog.showErrorBox(
              'Old SQLite schema found at file: ' + fileName,
              'The SQLite schema has been updated since the last time you loaded this ' +
              'file.\n\n' + 
              'Some features may not work correctly until you re-import the original' +
              'ScanCode JSON file to create an updated SQLite database.');
          }
        }));
    // Check that the database has the correct header information.
    workbenchDB.sync
      .then((db) => db.Header.findAll())
      .then((headers) => {
        if (headers.length === 0) {
          dialog.showErrorBox(
            'Invalid SQLite file: ' + fileName,
            'The SQLite file is invalid. Try re-importing the ScanCode JSON ' +
            'file and creating a new SQLite file.');
        }
      });

    return updateViews();
  }

  // Get the ScanCode header data from the DB and populate and open the modal
  function getScanHeader() {
    return workbenchDB.sync
      .then((db) => db.Header.findById(1)
        .then((header) => {
          const scancode_label = $('#scancode-info').find('#scancode-label');
          const scancode_display = $('#scancode-info').find('#scancode-display');
          if (header === null || header.scancode_version === null || header.scancode_options === null) {
            scancode_label.text('Please import a ScanCode results file or an ScanCode Workbench sqlite file to see the scan options.');
            scancode_display.css('display', 'none');
          } else {
            scancode_label.text('This information has been extracted from your imported ScanCode JSON file:');
            scancode_display.text(header.header_content);
            scancode_display.css('display', 'block');
          }
        }))
      .then($('#myModal').modal('show'));
  }

  /** Loads data for all views based on the current data */
  function updateViews() {
    return workbenchDB.sync
      .then(() => {
        const currFile = workbenchDB.sequelize.options.storage;
        document.title = 'ScanCode Workbench - ' + path.basename(currFile);

        scanDataTable.clearColumnFilters();

        // update all views with the new database.
        conclusionDialog.db(workbenchDB);
        jstree.db(workbenchDB);
        scanDataTable.db(workbenchDB);
        conclusionsTable.db(workbenchDB);
        fileDashboard.db(workbenchDB);
        licenseDashboard.db(workbenchDB);
        packageDashboard.db(workbenchDB);
        barChart.db(workbenchDB);

        // Reload the jstree, then trigger the current view to reload.
        jstree.redraw();
      })
      .catch((reason) => { throw reason; });
  }

  function redrawCurrentView() {
    $(currentNavButtonId).trigger('click');
  }

  /** Open a SQLite Database File */
  function openSQLite() {
    dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Open a SQLite File',
      filters: [{
        name: 'SQLite File',
        extensions: ['sqlite']
      }]
    }, (fileNames) => {
      if (fileNames && fileNames[0]) {
        loadDatabase(fileNames[0]);
        showScanDataButton.trigger('click');
      }
    });
  }

  /** Save a SQLite Database File */
  function saveSQLite() {
    dialog.showSaveDialog({
      title: 'Save as a Database File',
      filters: [
        { name: 'SQLite File', extensions: ['sqlite'] }
      ]
    }, (newFileName) => {
      if (newFileName) {
        const oldFileName = workbenchDB.sequelize.options.storage;
        const reader = fs.createReadStream(oldFileName);
        const writer = fs.createWriteStream(newFileName);
        reader.pipe(writer);
        reader.on('end', () => loadDatabase(newFileName));
      }
    });
  }

  /** Import a ScanCode JSON file and create a SQLite database */
  function importJson() {
    dialog.showOpenDialog({
      title: 'Open a JSON File',
      filters: [{
        name: 'JSON File',
        extensions: ['json']
      }]
    }, (fileNames) => {
      if (fileNames === undefined) {
        return;
      }

      const jsonFilePath = fileNames[0];
      let defaultPath;

      if (os.platform() === 'linux') {
        // remove the .json (or other) extention of the path.
        defaultPath = jsonFilePath.substring(0, jsonFilePath.lastIndexOf('.')) + '.sqlite';
      } else {
        // FIXME: this is some ugly regex used to get filename with no extension.
        // see: https://stackoverflow.com/questions/4250364/how-to-trim-a-file-extension-from-a-string-in-javascript
        defaultPath = jsonFilePath.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, '');
      }
      

      // Immediately ask for a SQLite to save and create the database
      dialog.showSaveDialog({
        title: 'Save a SQLite Database File',
        defaultPath: defaultPath,
        filters: [{
          name: 'SQLite File',
          extensions: ['sqlite']
        }]
      }, (sqliteFileName) => {
        if (sqliteFileName === undefined) {
          return;
        }

        // Overwrite existing sqlite file
        if (fs.existsSync(sqliteFileName)) {
          fs.unlink(sqliteFileName, (err) => {
            if (err) {
              throw err;
            }
            console.info(`Deleted ${sqliteFileName}`);
          });
        }

        // Create a new database when importing a json file
        workbenchDB = new WorkbenchDB({
          dbName: 'demo_schema',
          dbStorage: sqliteFileName,
        });

        const progressbar = new Progress('#content', {
          title: 'Creating Database...',
          size: 100,
        });

        workbenchDB.sync
          .then(() => progressbar.showDeterminate())
          .then(() => workbenchDB.addFromJson(
            jsonFilePath,
            workbenchVersion,
            (progress) => progressbar.update(progress / 100)))
          .then(() => progressbar.hide())
          .then(updateViews)
          .then(showScanDataButton.trigger('click'))
          .catch((err) => {
            progressbar.hide();
            if (err instanceof WorkbenchDB.MissingFileInfoError) {
              dialog.showErrorBox(
                'Missing File Type Information',
                'Missing file \'type\' information in the scanned data. ' +
                '\n\nThis probably means you ran the scan without the -i ' +
                'option in ScanCode. The app requires file information from ' +
                'a ScanCode scan. Rerun the scan using \n./scancode ' +
                '-clipeu options.'
              );
            } else {
              // Show error for problem with the JSON file
              dialog.showErrorBox(
                'JSON Error',
                'There is a problem with your JSON file. It may be malformed ' +
                '(e.g., the addition of a trailing comma), ' +
                'or there could be some other problem with the file. ' +
                '\n\nPlease check your file and try again. ' +
                '\n\nThe error thrown by the system is: \n\n' + err
              );
            }
            console.error(err);
          });
      });
    });
  }

  /** Export JSON file with original ScanCode data and conclusions that have been created */
  function exportJson() {
    dialog.showSaveDialog({
      properties: ['openFile'],
      title: 'Save as JSON file',
      filters: [{
        name: 'JSON File Type',
        extensions: ['json']
      }]
    }, (fileName) => {
      if (fileName === undefined) {
        return;
      }

      const scanCodeInfoPromise = workbenchDB.getScanCodeInfo({
        attributes: {
          exclude: ['id', 'createdAt', 'updatedAt']
        }
      });

      const workbenchInfoPromise = workbenchDB.getWorkbenchInfo({
        attributes: {
          exclude: ['id', 'createdAt', 'updatedAt']
        }
      });

      const scanDataFilesPromise = workbenchDB.findAll({
        attributes: {
          exclude: ['id', 'createdAt', 'updatedAt']
        }
      });

      const conclusionsPromise = workbenchDB.findAllConclusions({
        attributes: {
          exclude: ['id', 'createdAt', 'updatedAt']
        }
      });

      const filesCountPromise = workbenchDB.getFileCount({
        attributes: {
          exclude: ['id', 'createdAt', 'updatedAt']
        }
      });

      Promise.all([scanCodeInfoPromise, workbenchInfoPromise,
        filesCountPromise, scanDataFilesPromise, conclusionsPromise])
        .then(([scanCodeInfo, workbenchInfo, filesCount, scanDataFiles, conclusions]) => {
          const json = {
            workbench_notice: workbenchInfo.workbench_notice,
            workbench_version: workbenchInfo.workbench_version,
            scancode_version: scanCodeInfo.scancode_version,
            scancode_options: scanCodeInfo.scancode_options,
            files_count: filesCount,
            files: scanDataFiles,
            conclusions: conclusions
          };

          fs.writeFile(fileName, JSON.stringify(json), (err) => {
            if (err) {
              throw err;
            }
          });
        });
    });
  }

  /** Export JSON file with only conclusions that have been created */
  function exportJsonConclusions() {
    dialog.showSaveDialog({
      properties: ['openFile'],
      title: 'Save as JSON file',
      filters: [{
        name: 'JSON File Type',
        extensions: ['json']
      }]
    }, (fileName) => {
      if (fileName === undefined) {
        return;
      }

      const workbenchInfoPromise = workbenchDB.getWorkbenchInfo({
        attributes: {
          exclude: ['id', 'createdAt', 'updatedAt']
        }
      });

      const conclusionsPromise = workbenchDB.findAllConclusions({
        attributes: {
          exclude: ['id', 'createdAt', 'updatedAt']
        }
      });

      Promise.all([workbenchInfoPromise, conclusionsPromise])
        .then(([workbenchInfo, conclusions]) => {
          const json = {
            workbench_notice: workbenchInfo.workbench_notice,
            workbench_version: workbenchInfo.workbench_version,
            conclusions: conclusions
          };

          fs.writeFile(fileName, JSON.stringify(json), (err) => {
            if (err) {
              throw err;
            }
          });
        });
    });
  }
});

function zoomReset() {
  webFrame.setZoomLevel(0);
}

function zoomIn() {
  webFrame.setZoomLevel(webFrame.getZoomLevel() + 1);
}

function zoomOut() {
  webFrame.setZoomLevel(webFrame.getZoomLevel() - 1);
}

module.exports = workbenchVersion;
