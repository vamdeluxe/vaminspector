const SceneUtil = require('./sceneutil');
const Store = require('electron-store');
const store = new Store();

if( store.get('mixerPath') !== undefined ){
  finish();
}

document.querySelector('#locateSceneButton').addEventListener('change', function( e ){
  const filePath = e.target.files[0].path;
  const vamPaths = SceneUtil.getVAMSavePaths( filePath );
  if( vamPaths.fileName !== 'mixer' ){
    alert('Please select mixer.json');
    e.target.value = '';
    return;
  }
  console.log(filePath);


  document.querySelector('#workspace').innerHTML = `
   Loaded ${filePath}
  `;

  store.set( 'mixerPath', filePath );
  finish();
});


function finish(){
  document.querySelector('#form').style = 'display:none';

  document.querySelector('#workspace').innerHTML = `
    Open VAM and load AppearanceMixer/mixer.json scene
 `;
}