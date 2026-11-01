/**
 * Three.js Scene Manager & 3D WebGL Pipeline
 * Manages camera, render loops, lighting, Orbit controls, raycasting component inspection and explode view
 */

class HydraSceneManager {
  constructor(canvasContainerId = 'canvas-container') {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container || typeof THREE === 'undefined') {
      console.error('Three.js or Canvas container not found');
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Mode Flags
    this.viewMode = 'DEFAULT'; // 'DEFAULT', 'EXPLODED', 'CUTAWAY'
    this.explodeFactor = 0; // 0 to 1
    this.targetExplode = 0;
    this.cutawayFactor = 0;
    this.targetCutaway = 0;

    // Raycasting for Component Inspection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.onComponentClickCallback = null;

    this.initScene();
    this.initLights();
    this.initControls();
    this.initRaycasting();
    this.setupResizeListener();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070B14);

    const width = this.container.clientWidth || 720;
    const height = this.container.clientHeight || 450;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(2.8, 1.8, 3.4);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.renderer.domElement.id = 'canvas-3d';
    this.container.appendChild(this.renderer.domElement);
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.75);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00E5FF, 0.85);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xE2E8F0, 0.45);
    fillLight.position.set(-4, 3, -2);
    this.scene.add(fillLight);

    const accentLight = new THREE.PointLight(0x00E5FF, 0.45, 10);
    accentLight.position.set(0, -1, 3);
    this.scene.add(accentLight);

    const shadowPlaneGeo = new THREE.PlaneGeometry(12, 12);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.25;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  initControls() {
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = 1.8;
      this.controls.maxDistance = 7.5;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
      this.controls.target.set(0, 0.1, 0);
    }
  }

  initRaycasting() {
    if (!this.renderer || !this.renderer.domElement) return;

    const findInspectableData = (intersects) => {
      for (let hit of intersects) {
        const obj = hit.object;
        if (!obj) continue;
        if (obj.userData && (obj.userData.isInspectable || obj.userData.isHotspot)) {
          return obj.userData;
        }
        if (obj.parent && obj.parent.userData && (obj.parent.userData.isInspectable || obj.parent.userData.isHotspot)) {
          return obj.parent.userData;
        }
      }
      return null;
    };

    this.renderer.domElement.addEventListener('click', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      const data = findInspectableData(intersects);
      if (data && this.onComponentClickCallback) {
        this.onComponentClickCallback(data);
      }
    });

    this.renderer.domElement.addEventListener('mousemove', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      const data = findInspectableData(intersects);
      this.renderer.domElement.style.cursor = data ? 'pointer' : 'default';
    });
  }

  setComponentClickListener(cb) {
    this.onComponentClickCallback = cb;
  }

  setContainer(newContainer) {
    if (!newContainer || !this.renderer) return;
    this.container = typeof newContainer === 'string' ? document.getElementById(newContainer) : newContainer;
    if (this.container && this.renderer.domElement) {
      this.container.appendChild(this.renderer.domElement);
      this.resize();
    }
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  resize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth || 720;
    const height = this.container.clientHeight || 450;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setViewMode(mode) {
    this.viewMode = mode;
    if (mode === 'EXPLODED') {
      this.targetExplode = 1.0;
      this.targetCutaway = 0.0;
    } else if (mode === 'CUTAWAY') {
      this.targetCutaway = 1.0;
      this.targetExplode = 0.0;
    } else {
      this.targetExplode = 0.0;
      this.targetCutaway = 0.0;
    }
  }

  resetCamera() {
    if (!this.camera || !this.controls) return;
    this.camera.position.set(2.8, 1.8, 3.4);
    this.controls.target.set(0, 0.1, 0);
    this.setViewMode('DEFAULT');
  }

  updateExplodeInterpolation(delta) {
    this.explodeFactor += (this.targetExplode - this.explodeFactor) * (delta * 4);
    this.cutawayFactor += (this.targetCutaway - this.cutawayFactor) * (delta * 4);
  }
}

window.HydraSceneManager = HydraSceneManager;
