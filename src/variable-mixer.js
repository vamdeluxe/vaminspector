const dialog = require('electron').remote.dialog;
const fs = require('fs');
const path = require('path');
const morphList = require('./data/morphlist.json');

const gel = s => document.getElementById(s);
const UIScene = gel('loadScene');
const UILook = gel('loadLook');
const UISave = gel('saveScene');

const onClick = (el, listener) => el.addEventListener('click', listener);
onClick(UIScene, loadScene);
onClick(UILook, loadLook);
onClick(UISave, saveScene);

let model = {
  scene: undefined,
  look: undefined
};

function loadScene() {
  userOpenJsonFile(json => model.scene = json);
}

function loadLook() {
  userOpenJsonFile(json => model.look = json);
}

function saveScene() {
}

// ### Utilities ###

function vamFile(file) {
  const parsedPath = path.parse(file);
  return {
    data: path.format({ ...parsedPath, ext: '.json' }),
    image: path.format({ ...parsedPath, ext: '.jpg' })
  };
}

/**
 * Opens a file dialog and once a file is selected reads the content as json
 * and calls the handler with it.
 * @param {objectHandler} handler - Handles the json object
 */
function userOpenJsonFile(handler) {
  dialog.showOpenDialog({
    title: 'Open Scene',
    properties: ['openFile'],
    filters: [
      { name: 'VAM Scene JSON', extensions: ['jpg', 'json'] }
    ]
  }, function (files) {
    const file = vamFile(files[0]);
    fs.readFile(file.data, 'utf-8', (err, data) => handler(JSON.parse(data)));
  });
}

/**
 * Object handler
 * @callback objectHandler
 * @param {Object} obj - Object to handle
 */

// ###^#########^###
