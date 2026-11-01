/**
 * Three.js 3D Procedural Chassis, Internal Manifold & Fluidics Simulation
 * Atomberg Intellon 2.0 Mechanical Model with Component Metadata
 */

class AtombergChassisModel {
  constructor(sceneManager) {
    this.sm = sceneManager;
    this.scene = sceneManager.scene;

    // Component Groups for Explode View
    this.rootGroup = new THREE.Group();
    this.frontShellGroup = new THREE.Group();
    this.internalManifoldGroup = new THREE.Group();
    this.electronicsGroup = new THREE.Group();
    this.particleGroup = new THREE.Group();

    // Material References
    this.materials = {};
    this.parts = {};
    this.particleSystems = [];

    // Animation & State
    this.dispensing = false;
    this.tapHaloColor = new THREE.Color(0x059669);
    this.uvActive = true;
    this.pumpSpinSpeed = 0;

    this.initMaterials();
    this.buildChassisEnclosure();
    this.buildInternalFilters();
    this.buildHydraulicManifold();
    this.buildFluidicsParticles();
    this.buildDispenserSpout();

    this.rootGroup.add(this.frontShellGroup);
    this.rootGroup.add(this.internalManifoldGroup);
    this.rootGroup.add(this.electronicsGroup);
    this.rootGroup.add(this.particleGroup);

    this.scene.add(this.rootGroup);
  }

  initMaterials() {
    this.materials.shellWhite = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.25,
      metalness: 0.05
    });

    this.materials.fascia = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.2,
      metalness: 0.05,
      transmission: 0.0,
      transparent: true,
      opacity: 1.0,
      depthWrite: true
    });

    this.materials.atmbYellow = new THREE.MeshStandardMaterial({
      color: 0xFFB800,
      roughness: 0.3,
      metalness: 0.1
    });

    this.materials.skeleton = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.6,
      metalness: 0.3
    });

    this.materials.filterPolymer = new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      roughness: 0.35,
      metalness: 0.05
    });

    this.materials.roHousing = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.2
    });

    this.materials.bldcMotor = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.4,
      metalness: 0.6
    });
    this.materials.copperWinding = new THREE.MeshStandardMaterial({
      color: 0xB45309,
      roughness: 0.3,
      metalness: 0.8
    });

    this.materials.translucentMineral = new THREE.MeshPhysicalMaterial({
      color: 0xE0F2FE,
      transmission: 0.75,
      roughness: 0.15,
      transparent: true,
      opacity: 0.75
    });

    this.materials.cleanTank = new THREE.MeshPhysicalMaterial({
      color: 0xF0F9FF,
      transmission: 0.65,
      roughness: 0.2,
      transparent: true,
      opacity: 0.75
    });
    this.materials.cleanWater = new THREE.MeshStandardMaterial({
      color: 0x0284C7,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7
    });

    this.materials.reuseTank = new THREE.MeshPhysicalMaterial({
      color: 0xFEF3C7,
      transmission: 0.65,
      roughness: 0.2,
      transparent: true,
      opacity: 0.75
    });
    this.materials.reuseWater = new THREE.MeshStandardMaterial({
      color: 0xD97706,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65
    });

    this.materials.uvChamber = new THREE.MeshStandardMaterial({
      color: 0x7C3AED,
      emissive: 0x6D28D9,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });

    this.materials.tapHalo = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x059669,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
  }

  buildChassisEnclosure() {
    const rearGeo = new THREE.BoxGeometry(1.4, 2.0, 0.45);
    const rearMesh = new THREE.Mesh(rearGeo, this.materials.shellWhite);
    rearMesh.position.set(0, 0, -0.15);
    rearMesh.castShadow = true;
    rearMesh.receiveShadow = true;
    this.rootGroup.add(rearMesh);

    const frontGeo = new THREE.BoxGeometry(1.4, 2.0, 0.25);
    const frontMesh = new THREE.Mesh(frontGeo, this.materials.fascia);
    frontMesh.position.set(0, 0, 0.2);
    frontMesh.castShadow = true;
    this.parts.frontFascia = frontMesh;
    this.frontShellGroup.add(frontMesh);

    const accentGeo = new THREE.BoxGeometry(1.42, 0.08, 0.72);
    const accentMesh = new THREE.Mesh(accentGeo, this.materials.atmbYellow);
    accentMesh.position.set(0, -0.98, 0.02);
    this.rootGroup.add(accentMesh);

    const logoPlateGeo = new THREE.BoxGeometry(0.35, 0.09, 0.02);
    const logoMesh = new THREE.Mesh(logoPlateGeo, this.materials.atmbYellow);
    logoMesh.position.set(0, 0.82, 0.33);
    this.frontShellGroup.add(logoMesh);
  }

  buildInternalFilters() {
    // 1. Sediment Filter Cartridge
    const sedGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.75, 24);
    const sedMesh = new THREE.Mesh(sedGeo, this.materials.filterPolymer);
    sedMesh.position.set(-0.48, 0.45, 0.1);
    sedMesh.userData = {
      isInspectable: true,
      name: "Stage 1: 5-Micron Spun Sediment Pre-Filter",
      sku: "ATMB-FLT-SED-05M",
      poreSize: "5.0 Microns",
      material: "High-density thermal-bonded polypropylene",
      ratedPressure: "15 - 60 PSI",
      function: "Traps coarse rust, sand, silt and suspended macro-turbidity.",
      health: 92
    };
    this.internalManifoldGroup.add(sedMesh);

    // 2. Activated Pre-Carbon Filter
    const carbGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.75, 24);
    const carbMesh = new THREE.Mesh(carbGeo, this.materials.filterPolymer);
    carbMesh.position.set(-0.25, 0.45, 0.1);
    carbMesh.userData = {
      isInspectable: true,
      name: "Stage 2: High-Adsorption Pre-Carbon Block",
      sku: "ATMB-FLT-ACB-G2",
      poreSize: "1.0 Micron",
      material: "Acid-washed coconut shell activated carbon",
      ratedPressure: "15 - 60 PSI",
      function: "Adsorbs free chlorine, trihalomethanes, pesticide residue, and volatile organic odors.",
      health: 88
    };
    this.internalManifoldGroup.add(carbMesh);

    // 3. 75 GPD RO Membrane Housing
    const roGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.9, 24);
    const roMesh = new THREE.Mesh(roGeo, this.materials.roHousing);
    roMesh.rotation.z = Math.PI / 2;
    roMesh.position.set(-0.05, -0.05, 0.12);
    roMesh.userData = {
      isInspectable: true,
      name: "Stage 4: 75 GPD Thin-Film Composite RO Membrane",
      sku: "ATMB-MEM-RO75-P3",
      poreSize: "0.0001 Microns (0.1 nm)",
      material: "Cross-linked aromatic polyamide composite",
      ratedPressure: "60 - 110 PSI",
      function: "Rejects dissolved salts, heavy metals (lead, arsenic), nitrates, and fluoride via reverse osmosis.",
      health: 94
    };
    this.internalManifoldGroup.add(roMesh);

    // 4. Ultrafiltration (UF) Bypass Hollow Fiber
    const ufGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.7, 24);
    const ufMesh = new THREE.Mesh(ufGeo, this.materials.filterPolymer);
    ufMesh.rotation.z = Math.PI / 2;
    ufMesh.position.set(-0.05, 0.22, 0.12);
    ufMesh.userData = {
      isInspectable: true,
      name: "Stage 3: 0.01-Micron Ultrafiltration (UF) Bypass",
      sku: "ATMB-MEM-UF-01M",
      poreSize: "0.01 Microns",
      material: "Hydrophilic polysulfone capillary fibers",
      ratedPressure: "10 - 45 PSI",
      function: "Operates in Municipal Eco-Bypass mode, retaining natural minerals while removing all bacteria and cysts without water waste.",
      health: 96
    };
    this.internalManifoldGroup.add(ufMesh);

    // 5. Mineral Cartridge with Visible Mineral Spheres
    const minGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 20);
    const minMesh = new THREE.Mesh(minGeo, this.materials.translucentMineral);
    minMesh.position.set(0.48, 0.45, 0.1);
    minMesh.userData = {
      isInspectable: true,
      name: "Stage 6: Alkaline Mineral & Electrolyte Balancer",
      sku: "ATMB-CRT-MIN-AL4",
      poreSize: "Macroporous substrate bed",
      material: "Calcite, Magnesite and trace mineral ceramic beads",
      ratedPressure: "15 - 60 PSI",
      function: "Restores bio-available Calcium (Ca2+) and Magnesium (Mg2+) ions while stabilizing pH between 7.4 - 8.2.",
      health: 89
    };
    this.internalManifoldGroup.add(minMesh);

    for (let i = 0; i < 18; i++) {
      const ballGeo = new THREE.SphereGeometry(0.02, 8, 8);
      const ballMat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xE2E8F0 : 0xFBBF24, roughness: 0.4 });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(0.48 + (Math.random() - 0.5) * 0.08, 0.2 + Math.random() * 0.5, 0.1 + (Math.random() - 0.5) * 0.08);
      this.internalManifoldGroup.add(ball);
    }

    // 6. Germicidal UV-C Reactor Chamber
    const uvGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.45, 20);
    const uvMesh = new THREE.Mesh(uvGeo, this.materials.uvChamber);
    uvMesh.position.set(0.25, 0.45, 0.1);
    uvMesh.userData = {
      isInspectable: true,
      name: "Stage 5: Germicidal UV-C Photonic Chamber",
      sku: "ATMB-LED-UVC-254",
      wavelength: "254 nm UV-C",
      material: "High-purity quartz sleeve with 316L stainless reflector",
      irradiance: "32 mJ/cm² nominal dose",
      function: "Photonic disinfection neutralizes viral DNA/RNA and bacterial pathogens instantly without chemical additives.",
      health: 99
    };
    this.parts.uvChamber = uvMesh;
    this.internalManifoldGroup.add(uvMesh);

    // 7. BLDC Booster Pump Assembly
    const pumpBodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.32, 24);
    const pumpMesh = new THREE.Mesh(pumpBodyGeo, this.materials.bldcMotor);
    pumpMesh.rotation.x = Math.PI / 2;
    pumpMesh.position.set(-0.35, -0.42, 0.1);
    pumpMesh.userData = {
      isInspectable: true,
      name: "Atomberg Class-Leading BLDC Booster Pump",
      sku: "ATMB-PMP-BLDC-24V",
      motorType: "Brushless DC 24V Sensorless FOC Control",
      ratedSpeed: "0 - 2400 RPM variable speed",
      powerRating: "4W idle, 42W full load (65% lower energy vs AC pumps)",
      function: "Provides osmotic pressure driving the RO membrane while automatically throttled down during Eco Bypass mode.",
      health: 97
    };
    this.internalManifoldGroup.add(pumpMesh);

    const rotorGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16);
    const rotorMesh = new THREE.Mesh(rotorGeo, this.materials.copperWinding);
    rotorMesh.rotation.x = Math.PI / 2;
    rotorMesh.position.set(-0.35, -0.42, 0.28);
    this.parts.pumpRotor = rotorMesh;
    this.internalManifoldGroup.add(rotorMesh);
  }

  buildHydraulicManifold() {
    // Primary 8L Clean Tank
    const cleanTankGeo = new THREE.BoxGeometry(0.55, 0.75, 0.32);
    const cleanTankMesh = new THREE.Mesh(cleanTankGeo, this.materials.cleanTank);
    cleanTankMesh.position.set(0.35, -0.42, 0.05);
    cleanTankMesh.userData = {
      isInspectable: true,
      name: "Primary Potable Storage Reservoir (8 Litres)",
      sku: "ATMB-TNK-CLN-08L",
      capacity: "8.0 Litres",
      material: "Antimicrobial food-grade virgin ABS plastic",
      function: "Stores purified, mineralized drinking water with digital twin level tracking and leak detection.",
      health: 100
    };
    this.internalManifoldGroup.add(cleanTankMesh);

    const cleanWaterGeo = new THREE.BoxGeometry(0.51, 0.65, 0.28);
    const cleanWaterMesh = new THREE.Mesh(cleanWaterGeo, this.materials.cleanWater);
    cleanWaterMesh.position.set(0.35, -0.47, 0.05);
    this.parts.cleanWaterLevel = cleanWaterMesh;
    this.internalManifoldGroup.add(cleanWaterMesh);

    // Secondary 6L Zero-Reject Tank
    const reuseTankGeo = new THREE.BoxGeometry(0.42, 0.38, 0.28);
    const reuseTankMesh = new THREE.Mesh(reuseTankGeo, this.materials.reuseTank);
    reuseTankMesh.position.set(-0.38, -0.72, 0.05);
    reuseTankMesh.userData = {
      isInspectable: true,
      name: "Zero-Reject Utility Storage Tank (6 Litres)",
      sku: "ATMB-TNK-REU-06L",
      capacity: "6.0 Litres",
      material: "Chemical-resistant secondary recovery chamber",
      function: "Captures RO reject water for floor mopping, plants, and toilet cistern flushing, cutting domestic wastage to under 10%.",
      health: 100
    };
    this.internalManifoldGroup.add(reuseTankMesh);

    const reuseWaterGeo = new THREE.BoxGeometry(0.38, 0.25, 0.24);
    const reuseWaterMesh = new THREE.Mesh(reuseWaterGeo, this.materials.reuseWater);
    reuseWaterMesh.position.set(-0.38, -0.78, 0.05);
    this.parts.reuseWaterLevel = reuseWaterMesh;
    this.internalManifoldGroup.add(reuseWaterMesh);
  }

  buildDispenserSpout() {
    const spoutArmGeo = new THREE.BoxGeometry(0.14, 0.06, 0.32);
    const spoutArmMesh = new THREE.Mesh(spoutArmGeo, this.materials.shellWhite);
    spoutArmMesh.position.set(0.18, -0.15, 0.44);
    this.frontShellGroup.add(spoutArmMesh);

    const nozzleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.1, 16);
    const nozzleMesh = new THREE.Mesh(nozzleGeo, this.materials.skeleton);
    nozzleMesh.position.set(0.18, -0.21, 0.56);
    this.frontShellGroup.add(nozzleMesh);

    const haloGeo = new THREE.TorusGeometry(0.045, 0.012, 16, 32);
    const haloMesh = new THREE.Mesh(haloGeo, this.materials.tapHalo);
    haloMesh.rotation.x = Math.PI / 2;
    haloMesh.position.set(0.18, -0.18, 0.56);
    haloMesh.userData = {
      isInspectable: true,
      name: "High-Speed Solenoid 2 & WS2812B Status Halo Ring",
      sku: "ATMB-ACT-SLN-TAP",
      responseTime: "< 400 Milliseconds",
      function: "Directly physically locks dispensing when output water fails safety thresholds, glowing crimson to protect family members.",
      health: 100
    };
    this.parts.tapHalo = haloMesh;
    this.frontShellGroup.add(haloMesh);

    const streamGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.45, 12);
    const streamMat = new THREE.MeshBasicMaterial({ color: 0x0284C7, transparent: true, opacity: 0.85 });
    const streamMesh = new THREE.Mesh(streamGeo, streamMat);
    streamMesh.position.set(0.18, -0.48, 0.56);
    streamMesh.visible = false;
    this.parts.dispenseStream = streamMesh;
    this.frontShellGroup.add(streamMesh);

    const glassGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.32, 20);
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, transmission: 0.9, roughness: 0.1, transparent: true });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(0.18, -0.82, 0.56);
    this.frontShellGroup.add(glassMesh);
  }

  buildFluidicsParticles() {
    this.particleCount = 90;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 0] = -0.5 + Math.random() * 1.0;
      positions[i * 3 + 1] = 0.45 + (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = 0.15;

      colors[i * 3 + 0] = 0.01;
      colors[i * 3 + 1] = 0.52;
      colors[i * 3 + 2] = 0.78;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.particlePoints = new THREE.Points(pGeo, pMat);
    this.particleGroup.add(this.particlePoints);
  }

  update(delta, simState) {
    const explodeDist = this.sm.explodeFactor * 0.75;
    this.frontShellGroup.position.z = explodeDist;

    if (this.materials.fascia) {
      if (this.sm.cutawayFactor > 0.05) {
        this.materials.fascia.transmission = this.sm.cutawayFactor * 0.88;
        this.materials.fascia.opacity = 1.0 - (this.sm.cutawayFactor * 0.65);
      } else {
        this.materials.fascia.transmission = 0.0;
        this.materials.fascia.opacity = 1.0;
      }
    }

    if (simState.actuators.bldcPump && this.parts.pumpRotor) {
      this.parts.pumpRotor.rotation.z += delta * 18;
    }

    if (this.materials.tapHalo) {
      if (!simState.actuators.solenoidInterlock) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
        this.materials.tapHalo.color.setHex(0xDC2626);
        this.materials.tapHalo.emissive.setHex(0xDC2626);
        this.materials.tapHalo.emissiveIntensity = 0.8 + 0.8 * pulse;
      } else if (simState.currentMode === 'MUNICIPAL_ECO') {
        this.materials.tapHalo.color.setHex(0x0284C7);
        this.materials.tapHalo.emissive.setHex(0x0284C7);
        this.materials.tapHalo.emissiveIntensity = 0.9;
      } else {
        this.materials.tapHalo.color.setHex(0x059669);
        this.materials.tapHalo.emissive.setHex(0x059669);
        this.materials.tapHalo.emissiveIntensity = 0.9;
      }
    }

    if (this.particlePoints && this.particlePoints.geometry) {
      const pos = this.particlePoints.geometry.attributes.position.array;
      const col = this.particlePoints.geometry.attributes.color.array;

      const flowSpeed = simState.actuators.solenoidInterlock ? (simState.sensors.flowRate * 0.3) : 0.0;
      const isEco = simState.currentMode === 'MUNICIPAL_ECO';

      for (let i = 0; i < this.particleCount; i++) {
        if (flowSpeed > 0) {
          pos[i * 3 + 0] += delta * flowSpeed;
          if (pos[i * 3 + 0] > 0.55) {
            pos[i * 3 + 0] = -0.55;
          }
        }

        pos[i * 3 + 1] = isEco ? 0.22 : -0.05;

        if (!simState.actuators.solenoidInterlock) {
          col[i * 3 + 0] = 0.86; col[i * 3 + 1] = 0.15; col[i * 3 + 2] = 0.15;
        } else if (isEco) {
          col[i * 3 + 0] = 0.01; col[i * 3 + 1] = 0.52; col[i * 3 + 2] = 0.78;
        } else {
          col[i * 3 + 0] = 0.95; col[i * 3 + 1] = 0.95; col[i * 3 + 2] = 0.95;
        }
      }

      this.particlePoints.geometry.attributes.position.needsUpdate = true;
      this.particlePoints.geometry.attributes.color.needsUpdate = true;
    }

    if (this.parts.cleanWaterLevel) {
      const cleanScale = Math.max(0.1, simState.waterTwin.cleanTankCurrent / 8.0);
      this.parts.cleanWaterLevel.scale.y = cleanScale;
    }
    if (this.parts.reuseWaterLevel) {
      const reuseScale = Math.max(0.1, simState.waterTwin.reuseTankCurrent / 6.0);
      this.parts.reuseWaterLevel.scale.y = reuseScale;
    }
  }

  triggerDispenseVisual(durationSec = 2) {
    if (this.parts.dispenseStream) {
      this.parts.dispenseStream.visible = true;
      setTimeout(() => {
        if (this.parts.dispenseStream) this.parts.dispenseStream.visible = false;
      }, durationSec * 1000);
    }
  }
}

window.AtombergChassisModel = AtombergChassisModel;
