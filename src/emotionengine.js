const fs = require('fs');
const path = require('path');
const SceneUtil = require('./sceneutil');
const PageUtil = require('./pageutil');

const defaultButton = require('./data/storable_button.json');
const defaultCollisionTrigger = require('./data/storable_collisiontrigger.json');
const defaultAnimationPattern = require('./data/storable_animationpattern.json');
const defaultAnimationStep = require('./data/storable_animationstep.json');
const defaultGrabPoint = require('./data/storable_grabpoint.json');
const defaultTrigger = require('./data/storable_trigger.json');

const emotionEngineMorphs = require('./data/emotionengine_morphs.json');
const emotionEngineAnimations = require('./data/emotionengine_animations.json')


const UIWorkspace = document.querySelector('#workspace');
const UIScene = document.querySelector('#scenePreview');

let scene = {};
let people = [];
let audioFiles = [];
let audioClips = [];

function reset(){
  scene = {};
  people = [];
  audioFiles = [];
  audioClips = [];
  UIWorkspace.innerHTML = '';
  UIScene.innerHTML = '';
}

function getEmotionEngineDataPath( filePath ){
  const sceneFileName = SceneUtil.getFileName( filePath );
  const sceneDirectory = path.dirname( filePath ) + '\\';
  return sceneDirectory + sceneFileName + '.emotionengine';
}

PageUtil.UIButtonClicked('#loadSceneButton', function(){
  SceneUtil.openFiles({ multiSelection: false })
  .then( function( files ){
    reset();
    const filePath = files[0];

    const paths = SceneUtil.getVAMSavePaths( filePath );
    scene = SceneUtil.loadSceneFile( paths.dataPath );
    people = scene.atoms.filter( SceneUtil.findByType('Person') );
    console.log(JSON.stringify(scene,null,2));
    console.log(scene);
    console.log(people);

    UIScene.innerHTML = `
    <div class="personDetails">
      <img class="personImage" src="${paths.imagePath}" width="300px">
      <span class="personName">${paths.fileName}</span>
    </div>
    `;


    const emotionEngineDataFilePath = getEmotionEngineDataPath( filePath );
    if( fs.existsSync( emotionEngineDataFilePath ) ){
      const emotionEngineData = JSON.parse( fs.readFileSync( emotionEngineDataFilePath, 'utf-8' ) );
      console.log('existing emotion engine data found');
      console.log(emotionEngineData);
      emotionEngineData.clips.forEach( function( {path, settings} ){
        audioFiles.push( path );
        generateUIFromAudio( path, settings );
      });
    }
  });
});

PageUtil.UIButtonClicked('#loadAudioButton', function(){
  SceneUtil.openFiles({ multiSelection: true, extensions: ['wav', 'mp3', 'ogg']} )
  .then( loadAllAudioUI );
});

const generateAnimtionOptionsUI = function( animationSet, selected='Neutral' ){
  return animationSet.map( function( animation ){
    return `<option value="${ animation.name }" ${animation.name==selected?'selected' : ''}> ${ animation.name } </option>`
  }).join('\n');
}

function generateUIFromAudio( file, settings = {
  animationUpper: 'Neutral',
  animationLower: 'Neutral',
  animBegin: 0,
  animEnd: 2.3,
  transitionTime: 0.3
} ){
  const fileName = SceneUtil.getFileName(file);
  const UIAudio = `
    <form id="settings_${fileName}" class="audioClipForm">
      <div class="assetIdentifier">${fileName}</div>
      <div class="assetContainer">
        <audio controls>
          <source src="${file}">
        </audio>
        <div class="settingBlock">
          <label for="animationUpper">Upper Face Animation</label>
          <select name="animationUpper">
            ${generateAnimtionOptionsUI(emotionEngineAnimations.upperFace, settings.animationUpper)}
          </select>
        </div>
        <div class="settingBlock">
          <label for="animationLower">Lower Face Animation</label>
          <select name="animationLower">
            ${generateAnimtionOptionsUI(emotionEngineAnimations.lowerFace, settings.animationLower)}
          </select>
        </div>
        <div class="settingBlock">
          <label for="animBegin">Animation Begin</label>
          <input name="animBegin" type="range" min="0" max="10" value="${settings.animBegin}" step="0.01" class="slider" oninput="animBeginNumber.value = animBegin.value + 's'">
          <output name="animBeginNumber">${settings.animBegin}s</output>
        </div>
        <div class="settingBlock">
          <label for="animEnd">Animation End</label>
          <input name="animEnd" type="range" min="0" max="10" value="${settings.animEnd}" step="0.01" class="slider" oninput="animEndNumber.value = animEnd.value + 's'">
          <output name="animEndNumber">${settings.animEnd}s</output>
        </div>
        <div class="settingBlock">
          <label for="transitionTime">Transition</label>
          <input name="transitionTime" type="range" min="0" max="2" value="${settings.transitionTime}" step="0.01" class="slider" oninput="transitionNumber.value = transitionTime.value + 's'">
          <output name="transitionNumber">${settings.transitionTime}s</output>
        </div>
      </div>
    </form>
  `;

  const UIDiv = document.createElement('div');
  UIDiv.innerHTML = UIAudio;

  UIWorkspace.appendChild( UIDiv );
}

function loadAllAudioUI( files ){
  audioFiles = files;
  files.forEach( function( file ){
    //  need to do this because default value for second argument is settings
    generateUIFromAudio(file);
  });
}

PageUtil.UIButtonClicked('#saveSceneButton', function(){
  if( scene.atoms === undefined ){
    alert('Load a scene first.');
    return;
  }

  if( people.length === 0 ){
    alert('Add some people in the scene first.');
    return;
  }
  enableMorphs( people[0] );
  generateAudioClips();
  generateEmotions();

  const emotionEngineData = {
    clips: audioFiles.map(function( filePath ){
      const fileName = SceneUtil.getFileName( filePath );
      return {
        path: filePath,
        settings: PageUtil.settingsFromForm( document.querySelector('#settings_' + CSS.escape(fileName)))
      };
    })
  };

  //scene.emotionEngine = emotionEngineData;

  console.log(scene);
  SceneUtil.saveScene( scene, function( filePath ){
    const emotionEngineDataFilePath = getEmotionEngineDataPath( filePath );
    fs.writeFile(emotionEngineDataFilePath, JSON.stringify( emotionEngineData,null,2), function(){} );

    if( document.querySelector('#copyAudio').checked ){
      audioFiles.forEach( function( audioPath ){
        const audioFileName = path.basename( audioPath );
        const saveDir = path.dirname( filePath ) + '\\';
        const copyPath = saveDir + audioFileName;
        if( audioPath === copyPath ){
          return;
        }
        SceneUtil.copyFile( audioPath, copyPath );
      });
    }

    alert('Successfully generated scene at: \n' + filePath);
  });

  //  write emotion engine data
});

function enableMorphs( person ){
  const geometry = person.storables.find( SceneUtil.findById( 'geometry' ) );
  emotionEngineMorphs.eyes.forEach( function( morph ){
    SceneUtil.replaceMorph( geometry.morphs, morph );
  });
}

function generateAudioClips(){
  audioClips = audioFiles.map( function( filePath ){
    return {
      displayName: SceneUtil.getFileName( filePath ),
      url: path.basename(filePath)
    };
  });

  const coreControl = scene.atoms.find( SceneUtil.findByType( 'CoreControl' ) );
  const audioClipStore = {
    id: 'URLAudioClipManager',
    clips: audioClips
  };

  SceneUtil.replaceStorable( coreControl, audioClipStore );
}

const xStart = 0;
const yStart = 2.0;
const xSpace = 0.3;
const ySpace = 0.07;
const columns = 3;

function generateEmotions(){

  SceneUtil.replaceAtomsById( scene, [generateGrabPoint()]);

  const buttons = audioFiles.map( generateButton );
  if( document.querySelector('#generateButtons').checked ){
    SceneUtil.replaceAtomsById( scene, buttons );
  }
  else{
    SceneUtil.removeAtomsById( scene, buttons );
  }

  const colliders = audioFiles.map( generateCollisionTriggers );
  if( document.querySelector('#generateColliders').checked ){
    SceneUtil.replaceAtomsById( scene, colliders );
  }
  else{
    SceneUtil.removeAtomsById( scene, colliders );
  }
  SceneUtil.replaceAtomsById( scene, audioFiles.reduce( generateAnimationPattern, [] ) );
}

let mainGrabPoint;

function generateGrabPoint(){
  const grabPoint = SceneUtil.deepClone(defaultGrabPoint);
  grabPoint.id = 'EmotionEngine';
  mainGrabPoint = grabPoint;
  const x = -1.0 *xSpace + xStart;
  const y = 0.1 + yStart;
  SceneUtil.setAtomPosition( grabPoint, x, y );
  return mainGrabPoint;
}

function getXY( index ){
  const x = index % columns;
  const y = (index - x) / columns;
  return {x,y};
}

function getPlacementXY( index ){
  const { x, y } = getXY(index);
  return {
    x: (-x*xSpace + xStart),
    y: (-y*ySpace + yStart)
  };
}

function generateAudioAction( clipFileName ){
  return {
    audioClip: clipFileName,
    audioClipCategory: "web",
    audioClipType: "URL",
    receiver: "HeadAudioSource",
    receiverAtom: "Person",
    receiverTargetName: "PlayNow"
  };
}

function generateAnimationActions( fileName ){
  return [{
    receiver: 'AnimationPattern',
    receiverAtom: 'Anim_' + fileName,
    receiverTargetName: 'ResetAnimation'
  },{
    receiver: 'AnimationPattern',
    receiverAtom: 'Anim_' + fileName,
    receiverTargetName: 'Play'
  }]
}

function emotionEngineAnimationToTriggers( animation, start, end, transition ){
  const triggerIn = SceneUtil.deepClone( defaultTrigger );
  triggerIn.displayName = animation.name + ' IN';
  triggerIn.transitionActions = Object.entries( animation.morphs ).map( function( [morphName, value ]){
    return generateMorphTransition( morphName, value );
  });
  triggerIn.startTime = start.toString();
  triggerIn.endTime = (start+transition).toString();

  const triggerOut = SceneUtil.deepClone( defaultTrigger );
  triggerOut.displayName = animation.name + ' OUT';
  triggerOut.transitionActions = Object.entries( animation.morphs ).map( function( [morphName, value ]){
    return generateMorphTransition( morphName, 0 );
  });
  triggerOut.startTime = (end-transition).toString();
  triggerOut.endTime = end.toString();

  return [triggerIn, triggerOut];
}

function generateAnimationTriggers( animationSettings ){

  const triggers = [];

  const upperAnimation = emotionEngineAnimations.upperFace.find(SceneUtil.findByName( animationSettings.animationUpper ));
  const lowerAnimation = emotionEngineAnimations.lowerFace.find(SceneUtil.findByName( animationSettings.animationLower ));
  const {animBegin, animEnd, transitionTime} = animationSettings;

  triggers.push( ...emotionEngineAnimationToTriggers( upperAnimation, animBegin, animEnd, transitionTime ) );
  triggers.push( ...emotionEngineAnimationToTriggers( lowerAnimation, animBegin, animEnd, transitionTime ) );


  return triggers;
}

function generateMorphTransition( morphName, endValue ){
  return {
    receiverAtom: "Person",
    receiver: "geometry",
    receiverTargetName: morphName,
    startValue: "0",
    endValue: endValue.toString(),
    startWithCurrentVal: "true"
  }
}

function generateButton( audioFilePath, index ){
  const {x,y} = getPlacementXY(index);

  const fileName = SceneUtil.getFileName( audioFilePath );
  const button = SceneUtil.deepClone( defaultButton );

  button.id = 'Test' + fileName;

  const storableText = button.storables.find( SceneUtil.findById('Text') );
  storableText.text = fileName;
  storableText.fontSize = (40).toString();

  const storableCanvas = button.storables.find( SceneUtil.findById('Canvas') );
  storableCanvas.xSize = (500).toString();
  storableCanvas.ySize = (120).toString();

  SceneUtil.setAtomPosition( button, x, y );



  const trigger = button.storables.find( SceneUtil.findById('Trigger') ).trigger;
  trigger.startActions.push( ...generateAnimationActions(fileName) );

  // button.parentAtom = mainGrabPoint.id;
  SceneUtil.makeAtomEditOnly( button );
  SceneUtil.makeParentLink( button, mainGrabPoint );
  return button;
}

function generateCollisionTriggers( audioFilePath, index ){
  const {x,y} = getPlacementXY(index);

  const fileName = SceneUtil.getFileName( audioFilePath );
  const collider = SceneUtil.deepClone( defaultCollisionTrigger );
  collider.id = 'Collider' + fileName;

  SceneUtil.setAtomPosition( collider, x, y, 0.2 );

  const trigger = collider.storables.find( SceneUtil.findById('Trigger') ).trigger;
  trigger.startActions.push( ...generateAnimationActions(fileName) );

  // collider.parentAtom = mainGrabPoint.id;
  SceneUtil.makeAtomEditOnly( collider );
  SceneUtil.makeParentLink( collider, mainGrabPoint );
  return collider;
}

function generateAnimationPattern( atoms, audioFilePath, index ){
  const {x,y} = getPlacementXY(index);


  const fileName = SceneUtil.getFileName(audioFilePath);

  const animationSettings = PageUtil.settingsFromForm( document.querySelector('#settings_'+CSS.escape(fileName) ) );
  console.log(animationSettings);

  const animPattern = SceneUtil.deepClone( defaultAnimationPattern );
  animPattern.id = 'Anim_' + fileName;

  // animPattern.parentAtom = mainGrabPoint.id;

  const animStepA = SceneUtil.deepClone( defaultAnimationStep );
  animStepA.id = 'AStep_' + fileName + '_Start';
  animStepA.parentAtom = animPattern.id;

  const animStepB = SceneUtil.deepClone( defaultAnimationStep );
  animStepB.id = 'AStep_' + fileName +'_End';
  animStepB.parentAtom = animPattern.id;
  animStepB.storables.find( SceneUtil.findById('Step') ).transitionToTime = (animationSettings.animEnd + 1).toString();

  const audioTrigger = SceneUtil.deepClone( defaultTrigger );
  audioTrigger.displayName = 'Play Audio';
  audioTrigger.startActions.push( generateAudioAction(path.basename(audioFilePath)) );

  const storableAnimationPattern = animPattern.storables.find( SceneUtil.findById('AnimationPattern') );
  storableAnimationPattern.steps = [ animStepA.id, animStepB.id ];

  storableAnimationPattern.triggers.push(audioTrigger, ...generateAnimationTriggers( animationSettings ));

  console.log(animPattern);
  atoms.push( animPattern, animStepA, animStepB );

  const animAtoms = [ animPattern, animStepA, animStepB ];
  animAtoms.forEach( function( atom, atomIndex ){
    SceneUtil.setAtomPosition( atom, x, y + atomIndex * 0.01 );
    SceneUtil.makeAtomEditOnly( atom );
    SceneUtil.makeParentLink( atom, mainGrabPoint );
  });


  return atoms;
}
