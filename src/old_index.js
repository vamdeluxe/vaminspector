const UIAtomList = document.querySelector('#atoms');

const {ipcRenderer} = require('electron');

const TemplateAtom = (atom)=>`
  <div class="atomContainer" id="atom-${ atom.id }">
    <div class="atomName" id="atomId">
      ${atom.id}
    </div>
    <div class="atomType">
      ${atom.type}
    </div>
  </div>
`;

const TemplateRename = (atom)=>`
  <form>
    <input type="text" name="id" value="${atom.id}">
  </form>
`;

ipcRenderer.on('scene', (event, message) => {
  UIAtomList.innerHTML = '<div class="instructions">Click on any atom name to rename it.</div>';
  const sceneData = JSON.parse(message);
  sceneData.atoms.forEach( function( atom ){
    const atomHTML = document.createElement('div');
    atomHTML.innerHTML = TemplateAtom( atom );

    UIAtomList.appendChild( atomHTML );

    const UIAtomID = atomHTML.querySelector('#atomId');
    UIAtomID.addEventListener('click', function(){
      UIAtomID.removeEventListener('click', this);
      UIAtomID.innerHTML = TemplateRename( atom );
      const input = UIAtomID.querySelector('input');
      input.focus();
      input.select();

      function exitInput(){
        atomHTML.innerHTML = TemplateAtom( atom );
        UIAtomID.addEventListener('click', outer);
      }

      const outer = this;
      UIAtomID.addEventListener('keydown', function(e){
        if( e.key === 'Escape' ){
          exitInput();
        }
        if( e.key === 'Enter' ){
          atom.id = input.value;
          ipcRenderer.send('sceneUpdated',JSON.stringify(sceneData, null, 2));
          exitInput();
          e.preventDefault();
        }
      });
    });
  });
});