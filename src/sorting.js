const SceneUtil = require('./sceneutil');
const PageUtil = require('./pageutil');

const UITable = document.querySelector('#atomTable');

let scene;

function addHead(){
  const UIHeaderRow = document.createElement('tr');
  UIHeaderRow.innerHTML = `
    <tr>
      <th class="clickable" onclick="sortTable('id')">Sort by ID</th>
      <th class="clickable" onclick="sortTable('type')">Sort by Type</th>
    </tr>
  `;
  UITable.appendChild(UIHeaderRow);
}

function renderTable( atoms ){
  UITable.innerHTML = '';

  addHead();
  atoms.forEach( function( {id,type} ){
    const UIRow = document.createElement('tr');

    UIRow.innerHTML = `
      <td>${ id }</td>
      <td>${ type }</td>
    `;

    UITable.appendChild(UIRow);
  });
}

// document.querySelector('#loadScene').addEventListener('change', function(){
//   console.log( e.target );
// });

PageUtil.UIButtonClicked('#loadScene', function(){
  SceneUtil.openFiles({ multiSelection: false })
  .then( function( files ){
    const file = files[0];
    const vamPaths = SceneUtil.getVAMSavePaths(file);
    scene = SceneUtil.loadSceneFile(vamPaths.dataPath);
    renderTable( scene.atoms );
  });
});

PageUtil.UIButtonClicked('#saveScene', function(){
  if(scene === undefined){
    alert('Load a scene first.');
    return;
  }
  SceneUtil.saveScene( scene );
});

function sortTable( priority ){
  scene.atoms = scene.atoms.sort( SceneUtil.sortAtomsBy(priority) );
  renderTable(scene.atoms);
}

