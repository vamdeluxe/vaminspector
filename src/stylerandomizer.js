const dialog = require('electron').remote.dialog;
const fs = require('fs');
const path = require('path');
const { findById, saveAtom } = require('./sceneutil');


const defaultIris = require('./data/storable_iris.json');
const defaultSkin = require('./data/storable_skin.json');
const makeupManifest = require('./data/makeup_manifest.json');
const hairManifest = require('./data/hair_manifest.json');


document.querySelector('#loadPersonButton').addEventListener( 'click', openDialog );
document.querySelector('#saveAsButton').addEventListener( 'click', function(){
  if( personAtom ){
    saveAtom( personAtom );
  }
});

document.querySelector('#randomSkinAllButton').addEventListener( 'click', function(){
  randomizeSkin();
  randomizeIris();
});

document.querySelector('#randomSkinButton').addEventListener( 'click', randomizeSkin );
document.querySelector('#randomIrisButton').addEventListener( 'click', randomizeIris );
document.querySelector('#randomMakeupButton').addEventListener( 'click', randomizeMakeup );

document.querySelector('#randomizeHairAllButton').addEventListener( 'click', function(){
  randomizeHairStyle();
  randomizeHairTexture();
});

document.querySelector('#randomizeHairStyleButton').addEventListener( 'click', randomizeHairStyle );
document.querySelector('#randomizeHairTextureButton').addEventListener( 'click', randomizeHairTexture );


const UIWorkSpace = document.querySelector('#workspace');

function TemplatePerson( fileName, imagePath ){
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="personCentered">
      <img class="personImage" src="${imagePath}" width="300px">
      <span class="personName">${fileName}</span>
    </div>
  `;
  return div;
}

let personAtom;

function openDialog(e){

  dialog.showOpenDialog({
    properties: ['openFile'],
    title: 'Open Appearance',
    filters: [
      { name: 'VAM Person Appearance JSON', extensions: ['jpg','json'] }
    ]
  }, function( files ){
    if( files === undefined || files.length === 0 ){
      return;
    }

    UIWorkSpace.innerHTML = '';

    const filePath = files[0];

    const fileName = path.basename(filePath,path.extname(filePath));

    let namePath = filePath.split('.');
    const extension = namePath.pop();
    namePath = namePath.join('.');

    const dataPath = extension.toLocaleLowerCase() === 'json' ? filePath : namePath + '.json';
    const imagePath = namePath + '.jpg';

    const sceneFile = JSON.parse( fs.readFileSync( dataPath, 'utf-8' ) );
    const UIForm = TemplatePerson( fileName, imagePath);
    UIWorkSpace.appendChild( UIForm );

    personAtom = JSON.parse(JSON.stringify(sceneFile.atoms[0]));

    console.log(personAtom);
  });
}

function randomizeIris(){
  if( personAtom === undefined ){
    return;
  }

  let irisStore = personAtom.storables.find( findById( 'irises' ) );

  if( irisStore === undefined ){
    irisStore = defaultIris;
    personAtom.storables.push( irisStore );
  }

  let storeIndex = personAtom.storables.findIndex( findById( 'irises') );

  const newIris = Object.assign( defaultIris, irisStore );

  newIris.Irises = 'Color ' + Math.floor( 1 + Math.random() * 30 );
  const eyeColor = newIris['Eye Color'];
  eyeColor.h = (Math.random()).toString();
  eyeColor.s = (Math.random() * 0.3 ).toString();
  eyeColor.v = (Math.random() * 0.4 + 0.6).toString();
  newIris['Iris Specular Intensity'] = (Math.random() * 5).toString();

  console.log(newIris);
  personAtom.storables[ storeIndex ] = newIris;
}

function randomizeMakeup(){
  if( personAtom === undefined ){
    return;
  }

  const skinType = personAtom.storables.find( findById( 'geometry' ) ).character;
  console.log(skinType);
  const manifest = makeupManifest[ skinType ];
  if( manifest === undefined ){
    console.warn('skin not found in manifest', skinType);
    return;
  }

  let skinStore = personAtom.storables.find( findById( 'skin' ) );
  if( skinStore === undefined ){
    skinStore = defaultSkin;
    personAtom.storables.push( skinStore );
  }
  const newSkin = Object.assign( defaultSkin, skinStore );

  newSkin.Face = 'Makeup ' + Math.floor( Math.random() * manifest.Face );

  if( manifest.Lips ){
    newSkin.Lips = 'Color ' + Math.floor( Math.random() * manifest.Lips );
  }

  if( manifest.Nails ){
    newSkin.Nails = 'Color ' + Math.floor( Math.random() * manifest.Nails );
  }

  let skinStoreIndex = personAtom.storables.findIndex( findById( 'skin' ) );
  console.log( newSkin);
  personAtom.storables[ skinStoreIndex ] = newSkin;
}

function randomizeSkin(){
  if( personAtom === undefined ){
    return;
  }

  const skinTypes = Object.keys(makeupManifest);
  const randomSkin = skinTypes[ Math.floor( Math.random() * skinTypes.length ) ];
  personAtom.storables.find( findById( 'geometry' ) ).character = randomSkin;

  randomizeMakeup();
}

function randomizeHairStyle(){
  if( personAtom === undefined ){
    return;
  }

  const hairTypes = Object.keys(hairManifest);
  const randomHair = hairTypes[ Math.floor( Math.random() * hairTypes.length ) ];
  personAtom.storables.find( findById( 'geometry' ) ).hair = randomHair;
}

function randomizeHairTexture(){
  if( personAtom === undefined ){
    return;
  }

  const hairStyle = personAtom.storables.find( findById( 'geometry' ) ).hair;
  if( hairManifest[ hairStyle ] === undefined ){
    return;
  }

  if( hairManifest[ hairStyle ].TextureSet === undefined ){
    return;
  }

  const hairManifestData = hairManifest[ hairStyle ];

  const randomHairTexture = hairManifestData.TextureSet[ Math.floor( Math.random() * hairManifestData.TextureSet.length ) ];

  const storeIds = hairManifestData.id;
  const hairStores = storeIds.map( function( id ){
    let hairStore = personAtom.storables.find( findById( id ) );
    if( hairStore === undefined ){
      hairStore = {
        id,
        'Texture Set': randomHairTexture
      };
      personAtom.storables.push( hairStore );
    }
    hairStore[ 'Texture Set' ] = randomHairTexture;
  });
}