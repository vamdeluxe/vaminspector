const {shell} = require('electron');
const SceneUtil = require('./sceneutil');
const PageUtil = require('./pageutil');

const JSZip = require("jszip");
const fs = require('fs-extra');
const path = require('path');


let zip = new JSZip();
let VACBaseName = '';

//  is there only one in VAC?
let sceneJSON = {};



const UILoadedSave = document.querySelector('#loadedSave');

const UIMorphsList = document.querySelector('#morphsList');
const UITexturesList = document.querySelector('#texturesList');
//const UIScriptsList = document.querySelector('#scriptsList');
const UIAppearanceList = document.querySelector('#appearanceList');
const UIImportOptionsForm = document.querySelector('#importOptions');
const UIMorphSubfolder = document.querySelector('#morphSubfolder');
const UITextureSubfolder = document.querySelector('#textureSubfolder');
const UIAppearanceSet = document.querySelector('#appearanceSet');
const UITextureSet = document.querySelector('#textureSet');
const UIMorphSet = document.querySelector('#morphSet');
const UILog = document.querySelector('#log');
const UILogMenu = document.querySelector('#logMenu');

UIMorphSet.style.display = UITextureSet.style.display = UIAppearanceSet.style.display = 'none';

document.querySelectorAll('input[value="Select All"]').forEach(function(element){
  const UIUL = element.parentNode.parentNode.querySelector('ul');
  element.onclick = function(){
    UIUL.childNodes.forEach(function(child){
      child.querySelector('input').checked = true;
    });
  };
});

document.querySelectorAll('input[value="Select None"]').forEach(function(element){
  const UIUL = element.parentNode.parentNode.querySelector('ul');
  element.onclick = function(){
    UIUL.childNodes.forEach(function(child){
      child.querySelector('input').checked = false;
    });
  };
});

const UIImportButton = document.querySelector('#import');

let importFiles = {};

const formatToList = {
  '.dsf': UIMorphsList,
  '.png': UITexturesList,
  '.jpg': UITexturesList,
  '.jpeg': UITexturesList,
  // '.cs': UIScriptsList,
  // '.cslist': UIScriptsList,
  '.json': UIAppearanceList
};

const formatToOption = {
  '.dsf': 'importMorphs',
  '.png': 'importTextures',
  '.jpg': 'importTextures',
  '.jpeg': 'importTextures',
  // '.cs': 'importScripts',
  // '.cslist': 'importScripts',
  '.json': 'importJSON'
};

const pathPrefixes = [
  'Import/morphs/female\\',
  'Import/morphs/female_genitalia\\',
  'Import/morphs/male\\',
  'Import/morphs/male_genitalia\\'
];


let importPath;
let texturePath;
let savePath;
let appearancePath;

let existingMorphs = [];

if(localStorage.VAMPath!==undefined){
  SetPaths(localStorage.VAMPath);
}

function RecursivelyGetFiles(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(RecursivelyGetFiles(file));
    } else {
      /* Is a file */
      results.push(path.basename(file));
    }
  });
  return results;
}

function SetPaths(VAMPath){
  importPath = VAMPath + '\\Import';
  texturePath = VAMPath + '\\Textures';
  savePath = VAMPath + '\\Saves';
  appearancePath = VAMPath + '\\Saves/Person/appearance';
}

function AddFile(fileName){
  const UIListItem = document.createElement('li');
  UIListItem.innerHTML = `
    <label class="smallLabel"><input type="checkbox" name="${fileName}" checked>${fileName}</label>
  `;
  return UIListItem;
}

function AddPerson(person){
  const UIListItem = document.createElement('li');
  UIListItem.innerHTML = `
    <label class="smallLabel"><input type="checkbox" name="${person.id}" checked>${person.id} <input type="text" name="rename_${person.id}" value="${VACBaseName}"> </label>
  `;
  return UIListItem;
}

function ClearLists(){
  Object.values(formatToList).forEach(function(list){
    list.innerHTML = '';
  });
}

//console.log(importPath, texturePath, savePath);

PageUtil.UIButtonClicked('#setPath', function(){
  SceneUtil.openFiles({ multiSelection: false, openDirectory: true })
  .then( function( files ){
    localStorage.VAMPath = files[0];
    SetPaths(localStorage.VAMPath);
  });
});


PageUtil.UIButtonClicked('#loadScene', function(){
  SceneUtil.openFiles({ multiSelection: false, extensions: ['vac'] })
  .then( function( files ){

    if(localStorage.VAMPath === undefined){
      alert('Set VAM path first');
      return;
    }

    if(files.length===0){
      return;
    }

    const file = files[0];
    //const vamPaths = SceneUtil.getVAMSavePaths(file);
    //scene = SceneUtil.loadSceneFile(vamPaths.dataPath);
    //console.log(scene);

    ClearLists();
    importFiles = {};

    UILoadedSave.textContent = file;

    VACBaseName = path.basename(file,path.extname(file));
    UIMorphSubfolder.value = VACBaseName;
    UITextureSubfolder.value = VACBaseName;

    UIMorphSet.style.display = UITextureSet.style.display = UIAppearanceSet.style.display = 'none';

    new JSZip.external.Promise(function (resolve, reject) {
      fs.readFile(file, function(err, data) {
        if (err) {
          reject(e);
        } else {
          resolve(data);
        }
      });
    })
    .then(function (data) {
      zip = new JSZip();
      return zip.loadAsync(data);
    })
    .then(function(data){

      UIImportButton.disabled = false;

      Object.values(data.files).forEach(function(zipObj){

        const extension = path.extname(zipObj.name);
        const list = formatToList[ extension ];

        if(list!==undefined){
          if(extension==='.json'){
              zip.file(zipObj.name)
                .async('nodebuffer')
                .then(function(content){
                  sceneJSON = JSON.parse(content.toString('utf8'));
                  const people = sceneJSON.atoms.filter(SceneUtil.findByType('Person'));
                  people.forEach(function(person){
                    list.appendChild( AddPerson(person) );
                  });
                });
          }
          else{
            list.appendChild( AddFile(zipObj.name) );
          }

          importFiles[ zipObj.name ] = zipObj;
        }

      });

      console.log(UIAppearanceList.children.length);
      UIAppearanceSet.style.display = 'block';
      if(UIMorphsList.children.length>0){
        UIMorphSet.style.display = 'block';
      }
      if(UITexturesList.children.length>0){
        UITextureSet.style.display = 'block';
      }
    });

  });
});

function GetMorphWithSubPath(path,subfolder=''){
  if(subfolder.length===0){
    return path;
  }

  pathPrefixes.forEach((prefix)=>{
    if(path.indexOf(prefix)>=0){
      const shortened = path.replace(prefix,'');
      if(shortened.indexOf('\\')<0){
        path = prefix + subfolder + '/' + shortened;
      }
    }
  });
  return path;
}

UIImportButton.onclick = function(){
  UILog.innerHTML = '';
  UILogMenu.style.display = 'block';

  existingMorphs = RecursivelyGetFiles(importPath);
  // console.log(existingMorphs);

  const options = PageUtil.settingsFromForm(UIImportOptionsForm);
  // console.log(options);

  Object.entries(options).forEach(function([key,value]){
    const extension = path.extname(key);
    const option = formatToOption[extension];

    //  a bit hacky to get imported people but...
    if(key.indexOf('rename_')>=0){
      const person = sceneJSON.atoms.find(SceneUtil.findById('Person'));
      const newName = options[key];
      const path = appearancePath + '/' + newName + '/' + newName + '.json';

      if(ShouldWrite(path,options)){

        const personCopy = SceneUtil.deepClone(person);
        //  fix person object
        personCopy.id = newName;

        const textures = personCopy.storables.find(SceneUtil.findById('textures'));
        if(textures){
          Object.entries(textures).forEach(function([key,value]){
            if(key==='id'){
              return;
            }
            let texturePath = 'Textures/';
            if(options.textureSubfolder.length>0){
              texturePath += options.textureSubfolder + '/';
            }
            texturePath += value;
            textures[key] = texturePath;
          });
        }

        fs.ensureFileSync(path);
        fs.writeFileSync(path, JSON.stringify( {
          atoms: [personCopy]
        }, null, 4));

        WriteToLog('imported appearance ' + person.id + ' as ' + newName + ' to ' + path, path);
      }

      return;
    }

    if(option===undefined){
      return;
    }

    const zipObj = importFiles[key];
    if(zipObj===undefined){
      return;
    }

    switch(option){
      case 'importMorphs':
        let localMorphPath = GetMorphWithSubPath(key, options.morphSubfolder);
        let morphPath = localStorage.VAMPath + '/' + localMorphPath;

        if(options.importDuplicateMorphs===undefined){
          const baseMorphName = path.basename(key);
          if(existingMorphs.includes(baseMorphName) === false){
            TryExtract(key, morphPath, options);
          }
          else{
            WriteToLog('skipping morph ' + morphPath + ' because it already exists', morphPath);
          }
        }
        else{
          TryExtract(key, morphPath, options);
        }

      break;
      case 'importTextures':
        let filename = key;
        let imagePath = texturePath + '/';
        if(options.textureSubfolder.length>0){
          imagePath += options.textureSubfolder + '/';
        }
        imagePath += filename;

        TryExtract(key, imagePath, options);

      break;
      case 'importJSON':

      break;
    }
  });

  //console.log(importFiles);
};

function ShouldWrite(path, options){
  let doCopy = false;
  if(options.allowOverwrite){
    doCopy = true;
  }
  else{
    if(fs.existsSync(path)){
      WriteToLog('skipping ' + path + ' because it exists', path);
    }
    else{
      doCopy = true;
    }
  }
  return doCopy;
}

function TryExtract(key, path, options){
  zip.file(key)
  .async('nodebuffer')
  .then(function(content){
    if(ShouldWrite(path, options)){
      fs.ensureFileSync(path);
      fs.writeFileSync(path, content);
      WriteToLog('imported ' + path, path);
    }
  });
}

function WriteToLog(string, path){
  const UIListItem = document.createElement('li');
  UIListItem.textContent = string;
  UIListItem.onclick = function(){
    shell.showItemInFolder(path);
  };

  UILog.appendChild(UIListItem);
  return UIListItem;
}