const SceneUtil = require('./sceneutil');
const PageUtil = require('./pageutil');
const morphList = require('./data/morphlist.json');

const UICenterFlowBox = document.querySelector('#centerFlowBox');

Array.from( new Set( morphList.map( (morph)=>morph.group ) ) )
.forEach( function( name ){

  const UICheckbox = `
    <div>
      <input type="checkbox" id="copy${name}" name="${name}" ${name!='face'?'checked':''}>
      <label class="biggerLabel" for="copy${name}">${name}</label>
    </div>
  `;

  UICenterFlowBox.innerHTML += UICheckbox;
});


let people = [];

function loadPersonAtIndex( index, event ){
  return function makePersonUI( files ){
    const vamPaths = SceneUtil.getVAMSavePaths( files[0] );
    people[ index ] = SceneUtil.loadFirstAtom(vamPaths.dataPath);

    const UIPerson = event.target.parentNode.querySelector('#person');
    UIPerson.innerHTML = `
    <div class="personDetails">
      <img class="personImage" src="${vamPaths.imagePath}" width="250px">
      <span class="personName">${vamPaths.fileName}</span>
    </div>
    `;
  }
}


PageUtil.UIButtonClicked('#loadPersonA', function( event ){
  SceneUtil.openFiles({ multiSelection: false })
  .then( loadPersonAtIndex(0, event) );
});

PageUtil.UIButtonClicked('#loadPersonB', function( event ){
  SceneUtil.openFiles({ multiSelection: false })
  .then( loadPersonAtIndex(1, event) );
});


PageUtil.UIButtonClicked('#savePerson', function(){
  if(people[0] === undefined || people[1] === undefined ){
    alert('Load two appearances first.');
    return;
  }

  const clonedDestination = SceneUtil.deepClone( people[1] );

  const sourceMorphs = people[0].storables.find( SceneUtil.findById('geometry') ).morphs;
  const destinationMorphs = clonedDestination.storables.find( SceneUtil.findById('geometry') ).morphs;

  console.log(people);
  const settings = PageUtil.settingsFromForm( document.querySelector('#options'));
  Object.keys( settings ).forEach( function( group ){
    morphList
      .filter( (morph)=>morph.group == group )
      .forEach( function( {name} ){

        const sourceMorph = sourceMorphs.find( SceneUtil.findByName( name ) );
        if( sourceMorph ){
          SceneUtil.replaceMorph( destinationMorphs, sourceMorph );
        }
      });
  });

  SceneUtil.saveAtom( clonedDestination );
});