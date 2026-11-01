import fs from 'fs';

let code = fs.readFileSync('js/app.js', 'utf8');

const marker1 = '// Dashboard 3D Viewport Controls';
const marker2 = '    if (btnDashAutorotate) {';
const idx1 = code.indexOf(marker1);
const idx2 = code.indexOf(marker2);

if (idx1 === -1 || idx2 === -1) {
  console.error('Markers not found in js/app.js');
  process.exit(1);
}

const newControlsBlock = `// Dashboard 3D Viewport Controls
    const btnDashViewAssembled = document.getElementById('btn-dash-view-assembled');
    const btnDashViewXray = document.getElementById('btn-dash-view-xray');
    const btnDashViewExplode = document.getElementById('btn-dash-view-explode');
    const btnDashAutorotate = document.getElementById('btn-dash-autorotate');
    const btnDashResetCam = document.getElementById('btn-dash-resetcam');
    const btn3dDispense = document.getElementById('btn-3d-dispense');
    const selectPartIsolate = document.getElementById('select-part-isolate');
    const partInspectHint = document.getElementById('part-inspect-hint');

    function updateViewButtons(active) {
      const allBtns = [
        { el: btnDashViewAssembled, key: 'assembled' },
        { el: btnDashViewXray, key: 'xray' },
        { el: btnDashViewExplode, key: 'explode' }
      ];
      allBtns.forEach(b => {
        if (!b.el) return;
        if (b.key === active) {
          b.el.classList.remove('btn-outline');
          b.el.classList.add('btn-primary');
        } else {
          b.el.classList.remove('btn-primary');
          b.el.classList.add('btn-outline');
        }
      });
    }

    if (btnDashViewAssembled) {
      btnDashViewAssembled.addEventListener('click', () => {
        if (chassisModel) chassisModel.setAssembledView();
        if (sceneManager) sceneManager.setViewMode('DEFAULT');
        if (selectPartIsolate) selectPartIsolate.value = 'all';
        if (partInspectHint) {
          partInspectHint.innerHTML = '💡 <em>Full assembled view active. Select any part below to isolate in 3D.</em>';
        }
        updateViewButtons('assembled');
        if (audio) audio.playSolenoidClick(true);
      });
    }

    if (btnDashViewXray) {
      btnDashViewXray.addEventListener('click', () => {
        if (!chassisModel) return;
        chassisModel.setExplodedView(false);
        chassisModel.isolatePart('all');
        const isX = chassisModel.toggleXRayMode();
        if (isX) {
          updateViewButtons('xray');
          if (partInspectHint) {
            partInspectHint.innerHTML = '💎 <span style="color:#00e5ff; font-weight:700;">X-Ray Cutaway Active:</span> Translucent casing reveals illuminated 7-stage filter cores &amp; spiral RO membrane.';
          }
        } else {
          updateViewButtons('assembled');
        }
        if (audio) audio.playSolenoidClick(true);
      });
    }

    if (btnDashViewExplode) {
      btnDashViewExplode.addEventListener('click', () => {
        if (!chassisModel) return;
        chassisModel.setXRayMode(false);
        chassisModel.isolatePart('all');
        const isExp = chassisModel.toggleExplodedView();
        if (isExp) {
          if (sceneManager) sceneManager.setViewMode('EXPLODED');
          updateViewButtons('explode');
          if (partInspectHint) {
            partInspectHint.innerHTML = '🔧 <span style="color:#00e5ff; font-weight:700;">Exploded Disassembly Active:</span> All components separated in 3D space with PURITECH-style callout labels.';
          }
        } else {
          if (sceneManager) sceneManager.setViewMode('DEFAULT');
          updateViewButtons('assembled');
        }
        if (audio) audio.playSolenoidClick(true);
      });
    }

    if (selectPartIsolate) {
      selectPartIsolate.addEventListener('change', (e) => {
        const partKey = e.target.value;
        if (!chassisModel) return;
        chassisModel.isolatePart(partKey);
        if (partKey === 'all') {
          updateViewButtons('assembled');
          if (partInspectHint) {
            partInspectHint.innerHTML = '📦 <em>All components visible in standard assembly.</em>';
          }
        } else {
          const selectedLabel = e.target.options[e.target.selectedIndex].text;
          if (partInspectHint) {
            partInspectHint.innerHTML = '🔍 <span style="color:#00e5ff; font-weight:700;">Isolated:</span> ' + selectedLabel + ' (other chassis parts ghosted at 10% opacity)';
          }
        }
        if (audio) audio.playSolenoidClick(true);
      });
    }
`;

code = code.substring(0, idx1) + newControlsBlock + '\n' + code.substring(idx2);

// Also update btnDashResetCam to reset select dropdown
const resetCamOld = `    if (btnDashResetCam) {
      btnDashResetCam.addEventListener('click', () => {
        sceneManager.resetCamera();
        if (chassisModel) chassisModel.setExplodedView(false);
        if (btnDashViewAssembled) {
          btnDashViewAssembled.classList.remove('btn-outline');
          btnDashViewAssembled.classList.add('btn-primary');
        }
        if (btnDashViewExplode) {
          btnDashViewExplode.classList.remove('btn-primary');
          btnDashViewExplode.classList.add('btn-outline');
        }
      });
    }`;

const resetCamNew = `    if (btnDashResetCam) {
      btnDashResetCam.addEventListener('click', () => {
        sceneManager.resetCamera();
        if (chassisModel) chassisModel.setAssembledView();
        if (selectPartIsolate) selectPartIsolate.value = 'all';
        updateViewButtons('assembled');
        if (partInspectHint) {
          partInspectHint.innerHTML = '💡 <em>Camera reset. Select any separate part above or click in 3D to zoom in.</em>';
        }
      });
    }`;

if (code.includes(resetCamOld)) {
  code = code.replace(resetCamOld, resetCamNew);
}

// Also wire Engineering Lab btn-view-xray
const hudOld = `  const btnViewDefault = document.getElementById('btn-view-default');
  const btnViewCutaway = document.getElementById('btn-view-cutaway');
  const btnViewExplode = document.getElementById('btn-view-explode');
  const btnResetCam = document.getElementById('btn-reset-cam');

  const hudBtns = [btnViewDefault, btnViewCutaway, btnViewExplode];`;

const hudNew = `  const btnViewDefault = document.getElementById('btn-view-default');
  const btnViewCutaway = document.getElementById('btn-view-cutaway');
  const btnViewXray = document.getElementById('btn-view-xray');
  const btnViewExplode = document.getElementById('btn-view-explode');
  const btnResetCam = document.getElementById('btn-reset-cam');

  const hudBtns = [btnViewDefault, btnViewCutaway, btnViewXray, btnViewExplode];`;

if (code.includes(hudOld)) {
  code = code.replace(hudOld, hudNew);
}

const hudListenersOld = `  if (btnViewCutaway) {
    btnViewCutaway.addEventListener('click', () => {
      if (sceneManager) sceneManager.setViewMode('CUTAWAY');
      setHudBtnActive(btnViewCutaway);
      if (audio) audio.playSolenoidClick(true);
    });
  }`;

const hudListenersNew = `  if (btnViewCutaway) {
    btnViewCutaway.addEventListener('click', () => {
      if (sceneManager) sceneManager.setViewMode('CUTAWAY');
      if (chassisModel) chassisModel.setXRayMode(true);
      setHudBtnActive(btnViewCutaway);
      if (audio) audio.playSolenoidClick(true);
    });
  }
  if (btnViewXray) {
    btnViewXray.addEventListener('click', () => {
      if (chassisModel) {
        chassisModel.setExplodedView(false);
        chassisModel.setXRayMode(true);
      }
      setHudBtnActive(btnViewXray);
      if (audio) audio.playSolenoidClick(true);
    });
  }`;

if (code.includes(hudListenersOld)) {
  code = code.replace(hudListenersOld, hudListenersNew);
}

fs.writeFileSync('js/app.js', code, 'utf8');
console.log('Successfully updated js/app.js with 3D separate part controls!');

