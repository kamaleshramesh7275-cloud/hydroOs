/**
 * HydroOS 2.0 - Authentic Household Smart RO Purifier 3D Controller
 * Comprehensive Multi-View & Part Inspection System
 * Inspired by DREO (X-Ray Cutaway Glow) and PURITECH (Exploded Parts Assembly)
 * 
 * Features:
 * 1. Assembled Showroom View: Solid commercial white & piano-black appliance.
 * 2. X-Ray Cutaway View: Translucent crystal acrylic casing revealing glowing cyan filters & internal piping (DREO style).
 * 3. Exploded Assembly View: Complete smooth part separation matrix with 3D leader callout labels (PURITECH style).
 * 4. Separate Part Isolation: Interactive dropdown/click to zoom into and isolate any individual part with non-selected parts ghosted.
 * 5. Dynamic Digital Display: Real-time telemetry (Inlet 450 ppm, Purified 45 ppm, Quality 96%, RO Active, Tank 85%).
 * 6. Interactive Tap & Tumbler: Dispenses water stream into the clear glass tumbler on the slotted drip tray.
 */

class AtombergChassisModel {
  constructor(sceneManager) {
    this.sm = sceneManager;
    this.scene = sceneManager.scene;
    this.camera = sceneManager.camera;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'Chassis_Root_Assembly';

    // Model & Mesh References
    this.modelLoaded = false;
    this.purifierModel = null;
    this.partsMap = {}; // Maps key to THREE.Object3D

    // Enclosure & Component Pointers
    this.frontFasciaGroup = null;
    this.mainBodyMesh = null;
    this.topCanopyMesh = null;
    this.internalFiltrationGroup = null;
    this.displayMesh = null;
    this.displayCanvas = null;
    this.displayCtx = null;
    this.displayTexture = null;
    this.statusLedBar = null;
    this.ledPower = null;
    this.ledPurify = null;
    this.ledUV = null;
    this.ledTankFull = null;
    this.faucetHalo = null;
    this.faucetNozzle = null;
    this.dispenseStream = null;
    this.pumpMotorPart = null;
    this.glassTumbler = null;

    // View States
    this.viewMode = 'DEFAULT'; // 'DEFAULT', 'XRAY', 'EXPLODED', 'ISOLATE'
    this.isExploded = false;
    this.explodeProgress = 0; // 0 (assembled) to 1 (maintenance exploded)
    this.targetExplode = 0;
    this.isXRay = false;
    this.isolatedPartKey = null;

    // Auto-Rotate State
    this.autoRotate = false;
    this.rotationSpeed = 0.40; // rad/sec

    // Hotspots & Labels
    this.hotspots = [];
    this.explodedLabels = [];
    this.explodedLabelsGroup = null;

    // Materials Storage
    this.originalMaterials = new Map();
    this.xrayMaterial = new THREE.MeshStandardMaterial({
      name: 'Frosted_Crystal_XRay_Glass',
      color: 0xC7EBFC,
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });

    this.ghostMaterial = new THREE.MeshStandardMaterial({
      name: 'Ghosted_Part_Material',
      color: 0x334155,
      transparent: true,
      opacity: 0.10,
      roughness: 0.8,
      depthWrite: false
    });

    // Initialize Canvas for Dynamic Display
    this.initDisplayCanvas();

    // Load the 3D Model
    this.loadGLBModel();

    this.scene.add(this.rootGroup);
  }

  initDisplayCanvas() {
    this.displayCanvas = document.createElement('canvas');
    this.displayCanvas.width = 1024;
    this.displayCanvas.height = 512;
    this.displayCtx = this.displayCanvas.getContext('2d');
    this.displayTexture = new THREE.CanvasTexture(this.displayCanvas);
    this.displayTexture.generateMipmaps = true;
    this.displayTexture.minFilter = THREE.LinearMipmapLinearFilter;
  }

  loadGLBModel() {
    const loader = new THREE.GLTFLoader();
    const primaryUrl = 'assets/models/smart_ro_purifier.glb';
    const fallbackUrl = 'assets/models/advanced_smart_ro_purifier.glb';

    const handleSuccess = (gltf) => {
      this.purifierModel = gltf.scene;
      this.modelLoaded = true;

      // Real-world household appliance proportions
      const scale = 5.2;
      this.purifierModel.scale.set(scale, scale, scale);
      this.purifierModel.position.set(0, 0.05, 0);

      this.processHierarchy(this.purifierModel);
      this.buildWaterDispenseStream();
      this.buildClickableHotspots();
      this.buildExplodedLabels();

      // Initial Dynamic Display Render
      this.updateDynamicDisplay({
        sensors: { inletTDS: 450, outletTDS: 45, turbidity: 0.35 },
        currentMode: 'BOREWELL_RO',
        waterScore: 96,
        waterTwin: { cleanTankCurrent: 6.8, cleanTankCapacity: 8.0, membraneHealth: 92 },
        actuators: { solenoidInterlock: true, bldcPump: true }
      });

      this.rootGroup.add(this.purifierModel);
      console.log('✓ Commercial Smart RO Purifier 3D Model Loaded & Initialized');
    };

    loader.load(
      primaryUrl,
      handleSuccess,
      undefined,
      (err) => {
        console.warn('Primary model load failed, attempting fallback:', err);
        loader.load(fallbackUrl, handleSuccess, undefined, (e) => {
          console.error('All GLB model paths failed to load:', e);
        });
      }
    );
  }

  processHierarchy(root) {
    root.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        // Cache original material
        this.originalMaterials.set(node, node.material);

        const name = node.name || '';
        node.userData.initialPosition = node.position.clone();
        node.userData.initialRotation = node.rotation.clone();

        // 1. Identify Front Gloss Fascia Door
        if (name === 'Front_Fascia_DoorAssembly' || name === 'Front_GlossPanel' || name.includes('Front_Fascia')) {
          this.frontFasciaGroup = node.isGroup ? node : (node.parent?.name.includes('Front_Fascia') ? node.parent : node);
          this.partsMap['front-fascia'] = this.frontFasciaGroup;
        }

        // 2. Main Appliance Housing & Top Canopy
        if (name === 'Body_MainEnclosure' || name === 'Enclosure_MainBody') {
          this.mainBodyMesh = node;
          this.partsMap['casing'] = node;
        }
        if (name === 'Body_TopCanopy') {
          this.topCanopyMesh = node;
          this.partsMap['top-canopy'] = node;
        }

        // 3. Internal Filtration System
        if (name === 'Internal_Filtration_System') {
          this.internalFiltrationGroup = node;
        }

        // 4. Digital Touchscreen Display Badge
        if (name === 'Display_TouchscreenScreen') {
          this.displayMesh = node;
          node.material = new THREE.MeshStandardMaterial({
            map: this.displayTexture,
            roughness: 0.08,
            metalness: 0.15,
            emissive: 0xFFFFFF,
            emissiveMap: this.displayTexture,
            emissiveIntensity: 0.90
          });
          node.userData.isInspectable = true;
          node.userData.featureId = 'display';
          node.userData.name = 'Smart Domestic Digital Display HMI';
          node.userData.sku = 'ATMB-DSP-HOME-02';
          node.userData.function = 'Real-time telemetry showing Input Water TDS (450 ppm), Purified Water TDS (45 ppm), Filter Health (92%), Tank Reserve (85%) & Operating Mode.';
        }

        // 5. LED Status Elements
        if (name === 'LED_CyanStatusLightBar') this.statusLedBar = node;
        if (name === 'LED_Power') this.ledPower = node;
        if (name === 'LED_Purify') this.ledPurify = node;
        if (name === 'LED_UV') this.ledUV = node;
        if (name === 'LED_TankFull') this.ledTankFull = node;

        // 6. Water Dispenser Tap
        if (name === 'Faucet_HaloLED') this.faucetHalo = node;
        if (name.includes('Faucet_') || name.includes('Tap_')) {
          this.faucetNozzle = node;
          node.userData.isInspectable = true;
          node.userData.featureId = 'outlet';
          node.userData.name = 'Smart Domestic Push/Pull Dispenser Tap';
          node.userData.sku = 'ATMB-TAP-HOME-02';
          node.userData.function = 'Ergonomic domestic push/pull lever dispenser tap with aerated flow (1.8 L/min), halo LED purity feedback & sub-second solenoid shutoff.';
        }

        // 7. Glass Drinking Tumbler
        if (name.includes('Glass_DrinkingTumbler') || name.includes('Glass_')) {
          this.glassTumbler = node.parent?.name.includes('Glass') ? node.parent : node;
          this.partsMap['tumbler'] = this.glassTumbler;
        }

        // 8. Drip Tray Assembly
        if (name.includes('DripTray_')) {
          this.partsMap['drip-tray'] = node.parent?.name.includes('DripTray') ? node.parent : node;
        }
      }

      // Group Level Mapping for Parts Isolation & Exploded Matrix
      const gName = node.name || '';
      node.userData.initialPosition = node.position.clone();

      if (gName === 'Filter_Stage1_Sediment') this.partsMap['sediment'] = node;
      if (gName === 'Filter_Stage2_PreCarbon') this.partsMap['pre-carbon'] = node;
      if (gName === 'Filter_Stage3_ROMembrane') this.partsMap['ro-membrane'] = node;
      if (gName === 'Filter_Stage4_UFFilter') this.partsMap['uf-filter'] = node;
      if (gName === 'Filter_Stage5_MineralCartridge') this.partsMap['mineralizer'] = node;
      if (gName === 'Filter_Stage6_UVChamber') this.partsMap['uv-chamber'] = node;
      if (gName === 'Internal_BLDCBoosterPump') {
        this.partsMap['pump'] = node;
        this.pumpMotorPart = node;
      }
      if (gName === 'Internal_CleanStorageTank') this.partsMap['tank'] = node;
      if (gName === 'Faucet_Assembly') this.partsMap['tap'] = node;
      if (gName === 'DripTray_Assembly') this.partsMap['drip-tray'] = node;
      if (gName === 'Glass_DrinkingTumbler') this.partsMap['tumbler'] = node;
      if (gName === 'Internal_Tubing_Network') this.partsMap['tubing'] = node;
    });
  }

  // Build Interactive 3D Glowing Hotspot Pills on the Purifier
  buildClickableHotspots() {
    this.hotspotsGroup = new THREE.Group();
    this.hotspotsGroup.name = 'Interactive_Feature_Hotspots';

    const hotspotDefs = [
      {
        id: 'hotspot-display',
        feature: 'display',
        label: 'TDS & Purity HMI',
        position: new THREE.Vector3(0, 0.90, 0.62),
        info: 'Click to inspect real-time TDS telemetry (Inlet 450 ppm, Purified 45 ppm) and water quality index.'
      },
      {
        id: 'hotspot-filter',
        feature: 'filter',
        label: '7-Stage Filter Core',
        position: new THREE.Vector3(-0.58, 0.65, 0.15),
        info: 'Click to inspect 7-stage filter health breakdown (92% remaining) and AI replacement predictions.'
      },
      {
        id: 'hotspot-outlet',
        feature: 'outlet',
        label: 'Dispenser Tap & Flow',
        position: new THREE.Vector3(0, -0.48, 0.58),
        info: 'Click to inspect purification mode (RO Active) and trigger water aliquot dispensing.'
      }
    ];

    const hotspotGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const ringGeo = new THREE.RingGeometry(0.055, 0.08, 24);

    hotspotDefs.forEach((def) => {
      const hGroup = new THREE.Group();
      hGroup.position.copy(def.position);

      const matDot = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
      const dot = new THREE.Mesh(hotspotGeo, matDot);
      dot.userData = {
        isHotspot: true,
        isInspectable: true,
        featureId: def.feature,
        label: def.label,
        info: def.info
      };
      hGroup.add(dot);

      const matRing = new THREE.MeshBasicMaterial({ color: 0x00E5FF, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
      const ring = new THREE.Mesh(ringGeo, matRing);
      ring.userData = {
        isHotspot: true,
        isInspectable: true,
        featureId: def.feature,
        label: def.label,
        info: def.info
      };
      hGroup.add(ring);

      hGroup.userData = {
        isHotspot: true,
        isInspectable: true,
        featureId: def.feature,
        label: def.label,
        info: def.info
      };

      this.hotspots.push(hGroup);
      this.hotspotsGroup.add(hGroup);
    });

    this.rootGroup.add(this.hotspotsGroup);
  }

  // Build 3D Leader Callout Labels for the Separated Exploded Parts (PURITECH Diagram Style)
  buildExplodedLabels() {
    this.explodedLabelsGroup = new THREE.Group();
    this.explodedLabelsGroup.name = 'Exploded_Part_Callout_Labels';
    this.explodedLabelsGroup.visible = false;

    const labelDefs = [
      { id: 'lbl-sed', text: '1. SEDIMENT PRE-FILTER (5µm)', pos: new THREE.Vector3(-1.3, 0.70, 0.70), partKey: 'sediment' },
      { id: 'lbl-carb', text: '2. ACTIVATED CARBON BLOCK', pos: new THREE.Vector3(-0.7, 1.25, 0.80), partKey: 'pre-carbon' },
      { id: 'lbl-ro', text: '3. 75 GPD RO MEMBRANE', pos: new THREE.Vector3(0.0, 1.45, 0.85), partKey: 'ro-membrane' },
      { id: 'lbl-uf', text: '4. HOLLOW-FIBER UF FILTER', pos: new THREE.Vector3(0.7, 1.25, 0.80), partKey: 'uf-filter' },
      { id: 'lbl-min', text: '5. ALKALINE MINERALIZER', pos: new THREE.Vector3(-1.1, -0.25, 0.75), partKey: 'mineralizer' },
      { id: 'lbl-uv', text: '6. 254nm QUARTZ UV CHAMBER', pos: new THREE.Vector3(1.3, 0.65, 0.70), partKey: 'uv-chamber' },
      { id: 'lbl-pmp', text: '7. BLDC BOOSTER PUMP', pos: new THREE.Vector3(1.1, -0.35, 0.75), partKey: 'pump' },
      { id: 'lbl-tnk', text: '8. 8L CLEAN STORAGE TANK', pos: new THREE.Vector3(0.0, -1.25, 0.60), partKey: 'tank' },
      { id: 'lbl-tap', text: '9. DISPENSER LEVER TAP', pos: new THREE.Vector3(0.0, -0.30, 1.35), partKey: 'tap' },
      { id: 'lbl-top', text: '10. TOP CANOPY HOOD', pos: new THREE.Vector3(0.0, 1.85, 0.20), partKey: 'top-canopy' }
    ];

    labelDefs.forEach(def => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 128;
      const ctx = c.getContext('2d');

      // Rounded banner background
      ctx.fillStyle = 'rgba(7, 11, 20, 0.85)';
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, 496, 112, 20);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = '#00E5FF';
      ctx.font = 'bold 32px "JetBrains Mono", Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(def.text, 256, 72);

      const tex = new THREE.CanvasTexture(c);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95 });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(def.pos);
      sprite.scale.set(0.75, 0.19, 1);
      sprite.userData = {
        isInspectable: true,
        featureId: def.partKey === 'tap' ? 'outlet' : def.partKey === 'display' ? 'display' : 'filter',
        partKey: def.partKey,
        name: def.text
      };

      this.explodedLabels.push(sprite);
      this.explodedLabelsGroup.add(sprite);
    });

    this.rootGroup.add(this.explodedLabelsGroup);
  }

  buildWaterDispenseStream() {
    // Water stream poured into drip tray and glass when dispensing
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(0, -0.46, 0.55),
      new THREE.Vector3(0, -0.75, 0.55) // fills into glass
    );
    const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.022, 12, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
      emissive: 0x0284C7,
      emissiveIntensity: 0.55
    });

    this.dispenseStream = new THREE.Mesh(tubeGeo, tubeMat);
    this.dispenseStream.name = 'Water_Dispense_Fluid_Stream';
    this.dispenseStream.visible = false;
    this.rootGroup.add(this.dispenseStream);
  }

  // Renders the High-Contrast Compact Digital Display Badge
  updateDynamicDisplay(state) {
    if (!this.displayCtx) return;
    const ctx = this.displayCtx;
    const w = 1024;
    const h = 512;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#040711');
    bgGrad.addColorStop(0.5, '#070F22');
    bgGrad.addColorStop(1, '#050915');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 24px "JetBrains Mono", Inter, sans-serif';
    ctx.fillText('HYDRO-OS SMART RO+UV+UF', 36, 48);

    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('📶 WI-FI ONLINE • BIS 10500 POTABLE', w - 36, 48);

    const inTDS = state.sensors ? state.sensors.inletTDS : 450;
    const outTDS = state.sensors ? state.sensors.outletTDS : 45;
    const isSafe = !state.actuators || state.actuators.solenoidInterlock;
    const isRO = state.currentMode !== 'MUNICIPAL_ECO';

    // Left Meter: Input TDS (Amber)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(40, 75, 450, 190, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('RAW INPUT WATER TDS', 65, 115);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 64px "JetBrains Mono", monospace';
    ctx.fillText(`${inTDS}`, 65, 195);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('PPM (FEED)', 240, 190);

    // Right Meter: Purified TDS (Cyan)
    ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(534, 75, 450, 190, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('PURIFIED DRINKING TDS', 560, 115);

    ctx.fillStyle = '#00E5FF';
    ctx.font = '900 64px "JetBrains Mono", monospace';
    ctx.fillText(`${outTDS}`, 560, 195);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('PPM (POTABLE)', 700, 190);

    // Middle Quality & Mode Badge
    ctx.fillStyle = isSafe ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.2)';
    ctx.strokeStyle = isSafe ? '#10B981' : '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(40, 285, 944, 75, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = isSafe ? '#10B981' : '#EF4444';
    ctx.font = '900 32px Inter, sans-serif';
    ctx.fillText(
      isSafe
        ? `WATER QUALITY: EXCELLENT (96%) • MODE: ${isRO ? 'FULL RO ACTIVE' : 'ECO BYPASS ACTIVE'}`
        : 'SAFETY LOCKOUT: HAZARD CONTAMINANT DETECTED',
      w / 2,
      333
    );

    // Bottom Telemetry Summary Strip
    const tankLiters = state.waterTwin ? state.waterTwin.cleanTankCurrent : 6.8;
    const filterPct = state.waterTwin ? Math.round(state.waterTwin.membraneHealth) : 92;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(`FILTER HEALTH: ${filterPct}%`, 45, 405);
    ctx.fillText(`TANK RESERVE: 85% (${tankLiters.toFixed(1)} / 8.0 L)`, 540, 405);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(45, 420, 440, 18, 8);
    ctx.fill();

    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.roundRect(45, 420, (filterPct / 100) * 440, 18, 8);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(540, 420, 440, 18, 8);
    ctx.fill();

    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.roundRect(540, 420, 0.85 * 440, 18, 8);
    ctx.fill();

    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM STATUS: ● RUNNING • MINERAL FORTIFIED (Ca, Mg, pH 7.4)', w / 2, 485);

    this.displayTexture.needsUpdate = true;
  }

  // =========================================================================
  // VIEW MODE CONTROLLERS (Showroom, X-Ray Cutaway, Exploded Assembly, Isolate)
  // =========================================================================

  // Mode 1: Default Assembled View
  setAssembledView() {
    this.viewMode = 'DEFAULT';
    this.setExplodedView(false);
    this.setXRayMode(false);
    this.isolatePart('all');
  }

  // Mode 2: X-Ray Translucent Cutaway (DREO Style: Left image in reference)
  setXRayMode(enable) {
    this.isXRay = Boolean(enable);
    if (!this.purifierModel) return;

    if (this.isXRay) {
      this.viewMode = 'XRAY';
      // Make outer shell, front door and top canopy translucent frosted crystal
      if (this.mainBodyMesh) this.mainBodyMesh.material = this.xrayMaterial;
      if (this.topCanopyMesh) this.topCanopyMesh.material = this.xrayMaterial;
      if (this.frontFasciaGroup) {
        this.frontFasciaGroup.traverse(m => {
          if (m.isMesh && m.name.includes('GlossPanel')) m.material = this.xrayMaterial;
        });
      }

      // Boost internal filter cores to glow through the translucent body
      if (this.internalFiltrationGroup) {
        this.internalFiltrationGroup.traverse(m => {
          if (m.isMesh && m.material && m.material.emissive) {
            m.material.emissiveIntensity = 1.4;
          }
        });
      }
    } else {
      // Restore original opaque materials
      if (this.mainBodyMesh && this.originalMaterials.has(this.mainBodyMesh)) {
        this.mainBodyMesh.material = this.originalMaterials.get(this.mainBodyMesh);
      }
      if (this.topCanopyMesh && this.originalMaterials.has(this.topCanopyMesh)) {
        this.topCanopyMesh.material = this.originalMaterials.get(this.topCanopyMesh);
      }
      if (this.frontFasciaGroup) {
        this.frontFasciaGroup.traverse(m => {
          if (m.isMesh && this.originalMaterials.has(m)) {
            m.material = this.originalMaterials.get(m);
          }
        });
      }
    }
  }

  toggleXRayMode() {
    this.setXRayMode(!this.isXRay);
    return this.isXRay;
  }

  // Mode 3: Exploded View (PURITECH Diagram Style: Bottom-right image in reference)
  setExplodedView(exploded) {
    this.isExploded = Boolean(exploded);
    this.targetExplode = this.isExploded ? 1.0 : 0.0;
    if (this.isExploded) {
      this.viewMode = 'EXPLODED';
      if (this.explodedLabelsGroup) this.explodedLabelsGroup.visible = true;
    } else {
      if (this.explodedLabelsGroup) this.explodedLabelsGroup.visible = false;
      if (this.viewMode === 'EXPLODED') this.viewMode = 'DEFAULT';
    }
  }

  toggleExplodedView() {
    this.setExplodedView(!this.isExploded);
    return this.isExploded;
  }

  // Mode 4: Isolate Single Part (with Ghosting & Camera Zoom)
  isolatePart(partKey) {
    this.isolatedPartKey = partKey;

    if (!partKey || partKey === 'all') {
      // Restore all meshes to original materials & opacities
      if (this.purifierModel) {
        this.purifierModel.traverse(m => {
          if (m.isMesh && this.originalMaterials.has(m)) {
            m.material = this.originalMaterials.get(m);
          }
        });
      }
      this.resetCamera();
      return;
    }

    const targetObj = this.partsMap[partKey];
    if (!targetObj || !this.purifierModel) return;

    // Ghost all other meshes
    this.purifierModel.traverse(m => {
      if (m.isMesh) {
        let isChildOfTarget = false;
        m.traverseAncestors(a => { if (a === targetObj) isChildOfTarget = true; });

        if (m === targetObj || isChildOfTarget) {
          // Keep selected part full opacity & original material
          if (this.originalMaterials.has(m)) m.material = this.originalMaterials.get(m);
        } else {
          // Ghost unselected parts
          m.material = this.ghostMaterial;
        }
      }
    });

    // Smoothly focus camera onto isolated part
    const box = new THREE.Box3().setFromObject(targetObj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (this.sm && this.sm.controls && this.sm.camera) {
      this.sm.controls.target.copy(center);
      this.sm.camera.position.set(center.x + maxDim * 1.5, center.y + maxDim * 0.8, center.z + maxDim * 2.2);
    }
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  resetCamera() {
    if (this.sm) this.sm.resetCamera();
    this.isolatePart('all');
  }

  triggerDispenseVisual(durationSec = 2.5) {
    if (this.dispenseStream) {
      this.dispenseStream.visible = true;
      setTimeout(() => {
        if (this.dispenseStream) this.dispenseStream.visible = false;
      }, durationSec * 1000);
    }
  }

  // =========================================================================
  // ANIMATION LOOP UPDATE (Exploded Matrix, Auto-Rotate, LED Feedback)
  // =========================================================================
  update(delta, simState) {
    if (!this.modelLoaded) return;

    // 1. Smooth Interpolation of Exploded Parts Separation
    this.explodeProgress += (this.targetExplode - this.explodeProgress) * (delta * 4.5);
    const p = this.explodeProgress;

    // Top Canopy: Lifts UP (+0.28m)
    if (this.partsMap['top-canopy']) {
      const init = this.partsMap['top-canopy'].userData.initialPosition;
      if (init) this.partsMap['top-canopy'].position.y = init.y + (p * 0.28);
    }

    // Front Fascia Door: Floats FORWARD (+0.40m) & UP (+0.05m)
    if (this.partsMap['front-fascia']) {
      const init = this.partsMap['front-fascia'].userData.initialPosition;
      if (init) {
        this.partsMap['front-fascia'].position.z = init.z + (p * 0.40);
        this.partsMap['front-fascia'].position.y = init.y + (p * 0.05);
      }
    }

    // Main Housing: Shifts BACK (-0.10m)
    if (this.partsMap['casing']) {
      const init = this.partsMap['casing'].userData.initialPosition;
      if (init) this.partsMap['casing'].position.z = init.z - (p * 0.10);
    }

    // Stage 1 Sediment Filter: Separates LEFT & FORWARD
    if (this.partsMap['sediment']) {
      const init = this.partsMap['sediment'].userData.initialPosition;
      if (init) {
        this.partsMap['sediment'].position.x = init.x - (p * 0.14);
        this.partsMap['sediment'].position.z = init.z + (p * 0.16);
      }
    }

    // Stage 2 Pre-Carbon Filter: Separates LEFT-CENTER & FORWARD
    if (this.partsMap['pre-carbon']) {
      const init = this.partsMap['pre-carbon'].userData.initialPosition;
      if (init) {
        this.partsMap['pre-carbon'].position.x = init.x - (p * 0.05);
        this.partsMap['pre-carbon'].position.z = init.z + (p * 0.20);
      }
    }

    // Stage 3 RO Membrane: Lifts UP & FORWARD with spiral core revealed
    if (this.partsMap['ro-membrane']) {
      const init = this.partsMap['ro-membrane'].userData.initialPosition;
      if (init) {
        this.partsMap['ro-membrane'].position.y = init.y + (p * 0.15);
        this.partsMap['ro-membrane'].position.z = init.z + (p * 0.22);
      }
    }

    // Stage 4 UF Filter: Separates RIGHT-CENTER & FORWARD
    if (this.partsMap['uf-filter']) {
      const init = this.partsMap['uf-filter'].userData.initialPosition;
      if (init) {
        this.partsMap['uf-filter'].position.x = init.x + (p * 0.06);
        this.partsMap['uf-filter'].position.z = init.z + (p * 0.20);
      }
    }

    // Stage 5 Mineralizer: Separates LEFT-DOWN & FORWARD
    if (this.partsMap['mineralizer']) {
      const init = this.partsMap['mineralizer'].userData.initialPosition;
      if (init) {
        this.partsMap['mineralizer'].position.x = init.x - (p * 0.12);
        this.partsMap['mineralizer'].position.y = init.y - (p * 0.06);
        this.partsMap['mineralizer'].position.z = init.z + (p * 0.18);
      }
    }

    // Stage 6 UV Chamber: Separates RIGHT & UP
    if (this.partsMap['uv-chamber']) {
      const init = this.partsMap['uv-chamber'].userData.initialPosition;
      if (init) {
        this.partsMap['uv-chamber'].position.x = init.x + (p * 0.16);
        this.partsMap['uv-chamber'].position.y = init.y + (p * 0.08);
        this.partsMap['uv-chamber'].position.z = init.z + (p * 0.16);
      }
    }

    // Booster Pump: Shifts DOWN & RIGHT
    if (this.partsMap['pump']) {
      const init = this.partsMap['pump'].userData.initialPosition;
      if (init) {
        this.partsMap['pump'].position.x = init.x + (p * 0.12);
        this.partsMap['pump'].position.y = init.y - (p * 0.10);
        this.partsMap['pump'].position.z = init.z + (p * 0.18);
      }
    }

    // Storage Tank: Drops DOWN & FORWARD
    if (this.partsMap['tank']) {
      const init = this.partsMap['tank'].userData.initialPosition;
      if (init) {
        this.partsMap['tank'].position.y = init.y - (p * 0.14);
        this.partsMap['tank'].position.z = init.z + (p * 0.12);
      }
    }

    // Dispenser Tap: Floats FORWARD
    if (this.partsMap['tap']) {
      const init = this.partsMap['tap'].userData.initialPosition;
      if (init) this.partsMap['tap'].position.z = init.z + (p * 0.32);
    }

    // Drip Tray & Glass Tumbler: Shift DOWN & FORWARD
    if (this.partsMap['drip-tray']) {
      const init = this.partsMap['drip-tray'].userData.initialPosition;
      if (init) {
        this.partsMap['drip-tray'].position.y = init.y - (p * 0.14);
        this.partsMap['drip-tray'].position.z = init.z + (p * 0.10);
      }
    }

    // Exploded Leader Labels Visibility
    if (this.explodedLabelsGroup) {
      this.explodedLabelsGroup.visible = p > 0.35;
      if (this.explodedLabelsGroup.visible && this.camera) {
        this.explodedLabels.forEach(lbl => {
          lbl.quaternion.copy(this.camera.quaternion);
        });
      }
    }

    // 2. Turntable Auto-Rotation
    if (this.autoRotate) {
      this.rootGroup.rotation.y += delta * this.rotationSpeed;
    }

    // 3. Hotspot Pulse Animation
    if (this.hotspotsGroup) {
      const pulse = 1.0 + 0.18 * Math.sin(Date.now() * 0.005);
      this.hotspots.forEach(h => {
        h.scale.set(pulse, pulse, pulse);
        if (this.camera) h.quaternion.copy(this.camera.quaternion);
      });
    }

    // 4. Discrete Status LED Glow
    if (this.statusLedBar && simState) {
      if (!simState.actuators.solenoidInterlock) {
        const flash = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
        this.statusLedBar.material.color.setHex(0xEF4444);
        this.statusLedBar.material.emissive.setHex(0xEF4444);
        this.statusLedBar.material.emissiveIntensity = 0.8 + 0.8 * flash;
      } else if (simState.currentMode === 'MUNICIPAL_ECO') {
        this.statusLedBar.material.color.setHex(0x00E5FF);
        this.statusLedBar.material.emissive.setHex(0x00E5FF);
        this.statusLedBar.material.emissiveIntensity = 1.0;
      } else {
        this.statusLedBar.material.color.setHex(0x0284C7);
        this.statusLedBar.material.emissive.setHex(0x0284C7);
        this.statusLedBar.material.emissiveIntensity = 0.9;
      }
    }

    if (this.ledPower) this.ledPower.material.emissiveIntensity = 1.4;
    if (this.ledPurify && simState) {
      this.ledPurify.material.emissiveIntensity = simState.actuators?.bldcPump ? 1.6 : 0.2;
    }
    if (this.ledUV && simState) {
      this.ledUV.material.emissiveIntensity = simState.actuators?.uvLamp ? 1.6 : 0.2;
    }
    if (this.ledTankFull) this.ledTankFull.material.emissiveIntensity = 1.2;

    // 5. Update Dynamic Canvas Screen
    if (simState) {
      this.updateDynamicDisplay(simState);
    }

    // 6. BLDC Pump Motor Vibration/Rotation
    if (simState && simState.actuators?.bldcPump && this.pumpMotorPart) {
      this.pumpMotorPart.rotation.y += delta * 15;
    }
  }
}

window.AtombergChassisModel = AtombergChassisModel;
