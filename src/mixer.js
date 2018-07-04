const dialog = require('electron').remote.dialog;
const fs = require('fs');
const path = require('path');
const morphList = require('./morphlist.json');

const UIWorkSpace = document.querySelectorAll('#workspace')[0];
const UILoadPersonButton = document.querySelectorAll('#loadPersonButton')[0];
const UIClearPeopleButton = document.querySelectorAll('#clearPeopleButton')[0];
const UIMixPeopleButton = document.querySelectorAll('#mixPeopleButton')[0];
const UIRandomWeightsButton = document.querySelectorAll('#randomizeWeightsButton')[0];

UIClearPeopleButton.addEventListener( 'click', reset );
UILoadPersonButton.addEventListener( 'click', openDialog );
UIMixPeopleButton.addEventListener( 'click', generateMix );
UIRandomWeightsButton.addEventListener( 'click', randomizeWeights );




function reset(){
  personAtoms = {};
  workspace.innerHTML = '';
}

function TemplatePerson( fileName, imagePath ){
  const div = document.createElement('div');
  div.innerHTML = `
    <form id="${fileName}" class="personForm">
      <div class="personDetails">
        <img class="personImage" src="${imagePath}" width="300px">
        <span class="personName">${fileName}</span>
      </div>
      <div class="personControls">
        <fieldset>
          <legend>Person Settings</legend>

          <label for="blendWeightInput">Blend Weight</label>
          <input
            type="range"
            id="blendWeightSlider"
            name="blendWeightInput"
            min="0"
            max="1"
            step="0.01"
            defaultValue="0.5"
            oninput="blendWeightOutput.value = (blendWeightInput.value * 100).toFixed(0) + '%'"
          />
          <output name="blendWeightOutput">50%</output>
          <div style="block">
            <button type="button" id="startingPoint">Use hair + clothes</button>
            <button type="button" id="removePerson">Remove</button>
          </div>

        </fieldset>
      </div>
    </form>
  `;
  return div;
}

let personAtoms = {};
let startingPerson;

function openDialog(e){

  console.log('clicked',e);
  dialog.showOpenDialog({
    properties: ['openFile','multiSelections'],
    title: 'Open Appearance',
    filters: [
      { name: 'VAM Person Appearance JSON', extensions: ['jpg','json'] }
    ]
  }, function( files ){
    if( files === undefined || files.length === 0 ){
      return;
    }

    files.reduce( function(collection, filePath){
      const toCheck = path.basename(filePath,path.extname(filePath));
      if( collection.some(function(colPath){
        const against = path.basename(colPath,path.extname(colPath));
        return (against === toCheck);
      }) ){
        return collection;
      }

      collection.push( filePath );
      return collection;
    },[])
    .forEach( function( filePath ){

      const fileName = path.basename(filePath,path.extname(filePath));

      let namePath = filePath.split('.');
      const extension = namePath.pop();
      namePath = namePath.join('.');

      const dataPath = extension.toLocaleLowerCase() === 'json' ? filePath : namePath + '.json';
      const imagePath = namePath + '.jpg';

      console.log('data path', dataPath);
      console.log('image path', imagePath);

      const sceneFile = JSON.parse( fs.readFileSync( dataPath, 'utf-8' ) );
      const UIForm = TemplatePerson( fileName, imagePath);
      UIWorkSpace.appendChild( UIForm );

      const UIRemoveButton = UIForm.querySelector('#removePerson');
      UIRemoveButton.addEventListener('click', function(){
        delete personAtoms[fileName];
        UIWorkSpace.removeChild(UIForm);
      });

      const UIStartingPointButton = UIForm.querySelector('#startingPoint');
      UIStartingPointButton.disabled = Object.keys(personAtoms).length === 0;
      UIStartingPointButton.addEventListener('click', function(){
        startingPerson = atomClone;
        document.querySelectorAll('#startingPoint').forEach( function( element ){
          element.disabled = false;
        });
        UIStartingPointButton.disabled = true;
      });

      const atomClone = JSON.parse(JSON.stringify(sceneFile.atoms[0]));
      if( Object.keys(personAtoms).length === 0 ){
        startingPerson = atomClone;
      }
      personAtoms[fileName] = atomClone;
    });
  });
}

function generateMix(){

  let totalWeight = 0;
  const people = Array.from(document.querySelectorAll('.personForm')).map(function(UIForm){
    const entries = Array.from(new FormData(UIForm).entries());
    const settings = {};
    entries.forEach( function( [key,value] ){
      settings[ key ] = value;
    });

    const id = UIForm.id;
    const atom = personAtoms[ id ];
    const morphs = atom.storables.find( findById('geometry') ).morphs;
    const weight = parseFloat(settings['blendWeightInput']);
    totalWeight += weight;
    return {
      id,
      atom,
      morphs,
      settings,
      weight
    }
  });

  console.log('blending between people', people );

  const allMorphs = morphList.slice().map( function( morph ){
    return {
      name: morph.name,
      value: 0,
      group: morph.group
    };
  });

  const weightedMorphs = allMorphs
  .map( function( morph ){

    let weightedTotal = 0;

    people.forEach( function( person ){
      const sourceMorph = person.morphs.find( findByName( morph.name ) );
      if( sourceMorph !== undefined && sourceMorph.value !== undefined ){
        const sourceValue = parseFloat( sourceMorph.value );
        morph.value = morph.value + ( sourceValue - morph.value ) * person.weight * 1/totalWeight;
        // morph.value += parseFloat(sourceMorph.value) * person.weight;
        // weightedTotal += person.weight;
      }
    });

    // if( weightedTotal > 0 ){
    //   console.log(morph.value, weightedTotal);
    //   morph.value /= weightedTotal;
    // }
    return morph;
  })
  .filter( function( morph ){
    const value = parseFloat( morph.value );
    return morph.value !== undefined && value !== 0;
  })
  .map( function( morph ){
    morph.value = morph.value.toString();
    return morph;
  });

  const newPerson = JSON.parse(JSON.stringify(startingPerson));
  newPerson.storables.find( findById('geometry') ).morphs = weightedMorphs;

  console.log('generated new person', newPerson);
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
        atoms: [newPerson]
      },null,2), function(){} );
    }
  });
}

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

function randomizeWeights(){
  document.querySelectorAll('#blendWeightSlider').forEach( function( element ){
    element.value = Math.random();
  });
}