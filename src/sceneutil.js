const dialog = require('electron').remote.dialog;
const path = require('path');
const fs = require('fs');

function findById( id ){
  return function( entry ){
    return entry.id === id;
  };
}

function findByType( type ){
  return function( entry ){
    return entry.type === type;
  };
}

function findByName( name ){
  return function( entry ){
    return entry.name === name;
  };
}

function saveJSONDialog( fn ){
  dialog.showSaveDialog({
    title: 'Save',
    buttonLabel: 'Save As',
    filters: [
      { name: 'VAM JSON', extensions: ['json'] }
    ]
  }, fn );
}

function saveAtom( atom ){
  saveJSONDialog( function( filename ){
    if( filename ){
      console.log('writing to', filename);
      fs.writeFile(filename, JSON.stringify( {
        atoms: [atom]
      },null,2), function(){} );
    }
  });
}

function sortAtomsBy( priority ){
  return function( a, b ){

    let idComparison = a.id.localeCompare( b.id )
    let typeComparison = a.type.localeCompare( b.type );

    if( priority === 'id' ){
      idComparison *= 2;
    }

    if( priority === 'type' ){
      typeComparison *= 2;
    }

    return idComparison + typeComparison;
  }
}

function saveScene( scene, callback ){
  scene.atoms = scene.atoms.sort( sortAtomsBy('type') );
  saveJSONDialog( function( filename ){
    if( filename ){
      console.log('writing to', filename);
      fs.writeFile(filename, JSON.stringify( scene,null,2), function(){} );

      if( callback ){
        callback( filename );
      }
    }
  })
}

function openFiles( options = {} ){
  const { multiSelection = true, extensions = ['json','jpg'] } = options;
  return new Promise(function( resolve, reject ){
    dialog.showOpenDialog({
      properties: ['openFile', multiSelection ? 'multiSelections' : ''],
      title: 'Open',
      filters: [
        { name: 'VAM JSON', extensions }
      ]
    }, function( files ){
      if( files === undefined || files.length === 0 ){
        reject();
      }
      else{
        resolve( files );
      }
    });
  });
}

function getVAMSavePaths( filePath ){
  const fileName = path.basename(filePath,path.extname(filePath));

  let namePath = filePath.split('.');
  const extension = namePath.pop();
  namePath = namePath.join('.');

  const dataPath = extension.toLocaleLowerCase() === 'json' ? filePath : namePath + '.json';
  const imagePath = namePath + '.jpg';

  return {
    fileName,
    dataPath,
    imagePath
  };
}

function loadSceneFile( filePath ){
  return JSON.parse( fs.readFileSync( filePath, 'utf-8' ) );
}

function loadFirstAtom( filePath ){
  return JSON.parse( fs.readFileSync( filePath, 'utf-8' ) ).atoms[0];
}

function deepClone( obj ){
  return JSON.parse( JSON.stringify( obj ) );
}

function replaceStorable( atom, storable ){
  const storeIndex = atom.storables.findIndex( findById( storable.id ) );
  if( storeIndex >= 0 ){
    atom.storables[ storeIndex ] = storable;
  }
  else{
    atom.storables.push( storable );
  }
}

function replaceMorph( morphList, morph ){
  const morphIndex = morphList.findIndex( (m)=>m.name === morph.name );
  if( morphIndex >= 0 ){
    morphList[ morphIndex ] = morph;
  }
  else{
    morphList.push( morph );
  }
}

function setAtomPosition( atom, x, y, z=0 ){

  atom.position.x = x.toString();
  atom.position.y = y.toString();
  atom.position.z = z.toString();
  atom.containerPosition = SceneUtil.deepClone( atom.position );
  const control = atom.storables.find( SceneUtil.findById('control') );
  if( control ){
    control.position = SceneUtil.deepClone( atom.position );
  }

}

function replaceAtomsById( scene, incoming ){
  incoming.forEach( function( atom ){
    scene.atoms = scene.atoms.filter( function( other ){
      if( other.id === atom.id ){
        return false;
      }
      return true;
    });
  });

  scene.atoms.push( ...incoming );
}

function removeAtomsById( scene, incoming ){
  incoming.forEach( function( atom ){
    scene.atoms = scene.atoms.filter( function( other ){
      if( other.id === atom.id ){
        return false;
      }
      return true;
    });
  });
}


function getFileName( filePath ){
  return path.basename(filePath,path.extname(filePath));
}

function makeAtomEditOnly( atom ){
  const control = atom.storables.find( SceneUtil.findById('control') );
  if( control === undefined ){
    return;
  }

  control.positionState = 'Off';
  control.rotationState = 'Off';
  control.interactableInPlayMode = 'false';
  control.canGrabPosition = 'false';
  control.canGrabRotation = 'false';
}

function makeParentLink( atom, parentAtom ){
  const control = atom.storables.find( SceneUtil.findById('control') );
  if( control === undefined ){
    return;
  }

  control.positionState = 'ParentLink';
  control.rotationState = 'ParentLink';
  control.linkTo = parentAtom.id +':object';
}

function copyFile( source, destination ){
  fs.createReadStream(source).pipe(fs.createWriteStream(destination));
}


module.exports = {
  findById,
  findByName,
  findByType,
  saveAtom,
  saveScene,
  openFiles,
  getVAMSavePaths,
  loadSceneFile,
  loadFirstAtom,
  deepClone,
  replaceStorable,
  replaceMorph,
  setAtomPosition,
  getFileName,
  replaceAtomsById,
  removeAtomsById,
  makeAtomEditOnly,
  copyFile,
  makeParentLink,
  sortAtomsBy
};