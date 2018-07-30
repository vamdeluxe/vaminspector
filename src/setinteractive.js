const SceneUtil = require('./sceneutil');
const PageUtil = require('./pageutil');

let scene;

PageUtil.UIButtonClicked('#loadScene', function(){
  SceneUtil.openFiles({ multiSelection: false })
  .then( function( files ){
    const file = files[0];
    const vamPaths = SceneUtil.getVAMSavePaths(file);
    scene = SceneUtil.loadSceneFile(vamPaths.dataPath);
  });
});

PageUtil.UIButtonClicked('#saveScene', function(){

  if(scene === undefined){
    alert('Load a scene first.');
    return;
  }

  scene.atoms.forEach( function( atom ){
    atom.storables.filter( function( storable ){
      return storable.id.toLowerCase().includes('control');
    }).forEach( function( control ){
      control.interactableInPlayMode = "false";
    });
  });

  SceneUtil.saveScene( scene );
});
