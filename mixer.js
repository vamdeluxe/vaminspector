const SceneUtil = require('./src/sceneutil');
const morphList = require('./src/data/morphlist.json');


function generateMix( scene, mixValue ){
  const people = scene.atoms
    .filter( SceneUtil.findByType('Person') )
    .sort( function( a,b ){
      return parseFloat( a.containerPosition.x ) - parseFloat( b.containerPosition.x );
    });

  if(people.length < 3 ){
    return scene;
  }

  const personA = people[0];
  const personB = people[2];
  const personMix = people[1];

  let totalWeight = 0;
  const sourcePeople = [personA, personB].map(function( atom, index ){
    const morphs = atom.storables.find( SceneUtil.findById('geometry') ).morphs;
    const weight = (index === 0) ? mixValue : (1-mixValue);
    totalWeight += weight;
    // console.log(weight, totalWeight);
    return {
      atom,
      morphs,
      weight
    }
  });

  const allMorphs = morphList.slice().map( function( morph ){
    return {
      name: morph.name,
      value: 0,
      group: morph.group
    };
  });

  const weightedMorphs = allMorphs
  .map( function( morph ){

    sourcePeople.forEach( function( person ){
      const sourceMorph = person.morphs.find( SceneUtil.findByName( morph.name ) );
      if( sourceMorph !== undefined && sourceMorph.value !== undefined ){
        const sourceValue = parseFloat( sourceMorph.value );
        morph.value = morph.value + ( sourceValue - morph.value ) * person.weight * 1/totalWeight;
        // console.log(morph.name, morph.value, sourceValue, person.weight, 1/totalWeight );
        // morph.value = 0.01;
      }
    });

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

  personMix.storables.find( SceneUtil.findById('geometry') ).morphs = weightedMorphs;

  return scene;
}

module.exports = generateMix;