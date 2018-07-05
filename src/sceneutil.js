function findById( id ){
  return function( entry ){
    return entry.id === id;
  };
}

function findByName( name ){
  return function( entry ){
    return entry.name === name;
  };
}

const dialog = require('electron').remote.dialog;

function saveAtom( atom ){
  dialog.showSaveDialog({
    title: 'Save Person',
    buttonLabel: 'Save As',
    filters: [
      { name: 'VAM Person Appearance JSON', extensions: ['json'] }
    ]
  }, function( filename ){
    if( filename ){
      console.log('writing to', filename);
      fs.writeFile(filename, JSON.stringify( {
        atoms: [atom]
      },null,2), function(){} );
    }
  });
}

module.exports = {
  findById,
  findByName,
  saveAtom
};