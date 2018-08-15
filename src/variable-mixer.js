const dialog = require('electron').remote.dialog;
const fs = require('fs');
const path = require('path');
const varTrigger = require('./data/variable_trigger.json');
const { saveScene: userSaveScene, deepClone } = require('./sceneutil');

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
  let scene = deepClone(model.scene);
  let startMorphs = getMorphs(findPerson(scene));
  const endMorphs = getMorphs(findPerson(model.look));

  let morphNames = new Set();
  startMorphs.forEach(m => morphNames.add(m.name));
  endMorphs.forEach(m => morphNames.add(m.name));

  let pairs = [];
  for (const name of morphNames) {
    pairs.push({
      start: startMorphs.find(m => m.name === name),
      end: endMorphs.find(m => m.name === name)
    });
  }

  const val = m => m && m.value || '0';
  const name = (m1, m2) => (m1 || m2).name;
  let transitions = pairs.map(p => createTransition(name(p.start, p.end), val(p.start), val(p.end)));
  scene.atoms.push(variableTrigger('VariableMixer', transitions));

  transitions.forEach(t => {
    let morph = startMorphs.find(m => m.name === t.receiverTargetName);
    if (morph)
      morph.animatable = 'true';
    else
      startMorphs.push({ name: t.receiverTargetName, animatable: 'true' });
  });

  userSaveScene(scene);
}

// ### Utilities ###

function vamFile(file) {
  let parsedPath = path.parse(file);
  parsedPath.base = undefined;
  return {
    data: path.format({ ...parsedPath, ext: '.json' }),
    image: path.format({ ...parsedPath, ext: '.jpg' })
  };
}

function findPerson(scene) {
  return scene.atoms.find(a => a.id === 'Person');
}

function getMorphs(person) {
  return person.storables.find(s => s.id === 'geometry').morphs;
}

function variableTrigger(id, transitions) {
  let vt = Object.assign(deepClone(varTrigger), { id });
  vt.storables[0].trigger.transitionActions = transitions;
  return vt;
}

function createTransition(target, start, end) {
  return {
    receiverAtom: 'Person',
    receiver: 'geometry',
    receiverTargetName: target,
    startValue: start,
    endValue: end,
    startWithCurrentVal: 'true'
  };
}

function userOpenJsonFile(handler) {
  dialog.showOpenDialog({
    title: 'Open Scene',
    properties: ['openFile'],
    filters: [
      { name: 'VAM Scene JSON', extensions: ['jpg', 'json'] }
    ]
  }, function (files) {
    const file = vamFile(files[0]);
    fs.readFile(file.data, 'utf-8', (_, data) => handler(JSON.parse(data)));
  });
}

// ###^#########^###
