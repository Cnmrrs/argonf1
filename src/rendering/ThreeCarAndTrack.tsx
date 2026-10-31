import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CircuitData,
  HelmetDesign,
  LiveRaceCarState,
  LiveryDesign,
  TireCompound,
  WeatherCondition,
} from '../core/types';

export type CameraPreset =
  | 'broadcast'
  | 'onboard'
  | 'cockpit'
  | 'nose'
  | 'rear'
  | 'side'
  | 'trackside'
  | 'helicopter'
  | 'pitlane'
  | 'free'
  | 'front'
  | 'top'
  | 'helmet';

interface ThreeCarAndTrackProps {
  mode: 'showroom' | 'race';
  livery?: LiveryDesign;
  helmet?: HelmetDesign;
  cameraPreset?: CameraPreset;
  explodedFactor?: number; // 0.0 to 1.0 for engineering inspection
  circuit?: CircuitData;
  cars?: LiveRaceCarState[];
  focusedDriverId?: string;
  weather?: WeatherCondition;
  className?: string;
}

// Pre-allocated math helpers at module scope to prevent GC in animation loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Target = new THREE.Vector3();
const _vec3CamPos = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();

const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

function getTireRingHex(compound: TireCompound): number {
  switch (compound) {
    case 'soft':
      return 0xef4444;
    case 'medium':
      return 0xfacc15;
    case 'hard':
      return 0xf8fafc;
    case 'intermediate':
      return 0x22c55e;
    case 'wet':
      return 0x3b82f6;
  }
}

/**
 * Builds a composite 10-part procedural Formula 1 car THREE.Group
 * following Three.js skill directives (Primary silhouette, Secondary read, Accent details).
 */
function buildProceduralF1Car(
  livery: LiveryDesign,
  helmet?: HelmetDesign,
  tireCompound: TireCompound = 'soft'
): {
  root: THREE.Group;
  wheels: THREE.Object3D[];
  explodableParts: Array<{ mesh: THREE.Object3D; basePos: THREE.Vector3; dir: THREE.Vector3 }>;
  drsFlap: THREE.Object3D;
} {
  const root = new THREE.Group();
  const wheels: THREE.Object3D[] = [];
  const explodableParts: Array<{ mesh: THREE.Object3D; basePos: THREE.Vector3; dir: THREE.Vector3 }> = [];

  const isMatte = livery.finish === 'matte';
  const isMetallic = livery.finish === 'metallic';
  const isCarbon = livery.finish === 'carbon';

  const bodyRoughness = isMatte ? 0.62 : isCarbon ? 0.38 : 0.16;
  const bodyMetalness = isMetallic ? 0.82 : isCarbon ? 0.45 : 0.25;

  const mainMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(livery.mainBodyColor),
    roughness: bodyRoughness,
    metalness: bodyMetalness,
    clearcoat: isMatte ? 0.05 : 0.9,
    clearcoatRoughness: 0.12,
  });

  const secondaryMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(livery.secondaryColor),
    roughness: Math.min(0.9, bodyRoughness + 0.25),
    metalness: Math.max(0.1, bodyMetalness - 0.2),
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(livery.accentColor),
    roughness: 0.22,
    metalness: 0.65,
  });

  const wingMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(livery.frontWingColor || livery.secondaryColor),
    roughness: 0.28,
    metalness: 0.5,
    clearcoat: 0.7,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(livery.floorColor || '#111827'),
    roughness: 0.55,
    metalness: 0.3,
  });

  const registerPart = (mesh: THREE.Object3D, dirX: number, dirY: number, dirZ: number) => {
    mesh.castShadow = !isSoftwareGl;
    mesh.receiveShadow = !isSoftwareGl;
    root.add(mesh);
    explodableParts.push({
      mesh,
      basePos: mesh.position.clone(),
      dir: new THREE.Vector3(dirX, dirY, dirZ),
    });
  };

  // 1. Underfloor & Venturi Diffuser (Primary Silhouette Base)
  const floorGeo = new THREE.BoxGeometry(1.95, 0.07, 4.85);
  const floorMesh = new THREE.Mesh(floorGeo, carbonMat);
  floorMesh.position.set(0, 0.12, 0);
  registerPart(floorMesh, 0, -0.55, 0);

  // 2. Central Monocoque Survival Cell
  const chassisGeo = new THREE.BoxGeometry(0.68, 0.42, 2.55);
  const chassisMesh = new THREE.Mesh(chassisGeo, mainMat);
  chassisMesh.position.set(0, 0.36, -0.15);
  registerPart(chassisMesh, 0, 0.25, 0);

  // 3. Sculpted Tapered Nosecone
  const noseGeo = new THREE.ConeGeometry(0.32, 1.55, 6);
  noseGeo.rotateX(Math.PI / 2);
  const noseMesh = new THREE.Mesh(noseGeo, mainMat);
  noseMesh.position.set(0, 0.26, 1.85);
  registerPart(noseMesh, 0, 0, 0.85);

  // 4. Multi-element Front Wing + Endplates
  const frontWingGroup = new THREE.Group();
  frontWingGroup.position.set(0, 0.14, 2.48);
  const fwMain = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.045, 0.34), wingMat);
  const fwFlap = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.03, 0.18), accentMat);
  fwFlap.position.set(0, 0.05, -0.08);
  const fwEndL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.42), secondaryMat);
  fwEndL.position.set(-0.95, 0.08, 0);
  const fwEndR = fwEndL.clone();
  fwEndR.position.set(0.95, 0.08, 0);
  frontWingGroup.add(fwMain, fwFlap, fwEndL, fwEndR);
  registerPart(frontWingGroup, 0, -0.1, 1.25);

  // 5. Sculpted Sidepods (Left & Right) + Accent Racing Stripe
  const sidepodL = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 1.85), mainMat);
  sidepodL.position.set(-0.56, 0.31, -0.28);
  registerPart(sidepodL, -0.85, 0, 0);

  const sidepodR = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 1.85), mainMat);
  sidepodR.position.set(0.56, 0.31, -0.28);
  registerPart(sidepodR, 0.85, 0, 0);

  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.07, 1.75), accentMat);
  stripeL.position.set(-0.56, 0.36, -0.26);
  registerPart(stripeL, -0.95, 0.1, 0);

  const stripeR = stripeL.clone();
  stripeR.position.set(0.56, 0.36, -0.26);
  registerPart(stripeR, 0.95, 0.1, 0);

  // 6. Engine Cover & Airbox Sharkfin
  const engineCoverGroup = new THREE.Group();
  engineCoverGroup.position.set(0, 0.62, -0.82);
  const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 1.45), secondaryMat);
  const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 1.15), accentMat);
  sharkFin.position.set(0, 0.22, -0.25);
  engineCoverGroup.add(airbox, sharkFin);
  registerPart(engineCoverGroup, 0, 0.85, -0.35);

  // 7. Titanium Halo Protection System
  const haloGroup = new THREE.Group();
  haloGroup.position.set(0, 0.63, 0.32);
  const haloMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(livery.haloColor || '#1e293b'),
    roughness: 0.3,
    metalness: 0.75,
  });
  const haloArch = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.032, 8, 20, Math.PI), haloMat);
  haloArch.rotation.x = Math.PI / 2;
  haloArch.rotation.z = Math.PI;
  const haloPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), haloMat);
  haloPillar.position.set(0, -0.06, 0.3);
  haloGroup.add(haloArch, haloPillar);
  registerPart(haloGroup, 0, 0.65, 0.2);

  // 8. Driver Helmet inside Cockpit
  const helmetGroup = new THREE.Group();
  helmetGroup.position.set(0, 0.6, 0.08);
  const helmetMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(helmet?.baseColor || livery.accentColor),
    roughness: 0.15,
    metalness: 0.4,
    clearcoat: 1.0,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(helmet?.visorTint || '#0ea5e9'),
    roughness: 0.08,
    metalness: 0.9,
  });
  const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 16), helmetMat);
  const visorMesh = new THREE.Mesh(new THREE.SphereGeometry(0.158, 12, 12, 0, Math.PI * 0.65, Math.PI * 0.3, Math.PI * 0.32), visorMat);
  visorMesh.rotation.y = Math.PI * 0.18;
  helmetGroup.add(helmetDome, visorMesh);
  registerPart(helmetGroup, 0, 0.95, 0.05);

  // 9. Rear Wing + Active DRS Flap
  const rearWingGroup = new THREE.Group();
  rearWingGroup.position.set(0, 0.68, -2.18);
  const rwMain = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.05, 0.28), wingMat);
  const drsFlap = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.04, 0.18), accentMat);
  drsFlap.position.set(0, 0.14, -0.05);
  const rwEndL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 0.44), secondaryMat);
  rwEndL.position.set(-0.59, -0.08, 0);
  const rwEndR = rwEndL.clone();
  rwEndR.position.set(0.59, -0.08, 0);
  rearWingGroup.add(rwMain, drsFlap, rwEndL, rwEndR);
  registerPart(rearWingGroup, 0, 0.55, -1.2);

  // 10. Four 18-inch F1 Wheels with Compound Sidewall Rings & Aero Covers
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.82, metalness: 0.08 });
  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(livery.wheelCoverColor || livery.accentColor),
    roughness: 0.25,
    metalness: 0.8,
  });
  const ringMat = new THREE.MeshBasicMaterial({ color: getTireRingHex(tireCompound) });

  const wheelPositions: Array<[number, number, number, number]> = [
    [-0.86, 0.34, 1.55, -1],
    [0.86, 0.34, 1.55, 1],
    [-0.88, 0.35, -1.62, -1],
    [0.88, 0.35, -1.62, 1],
  ];

  wheelPositions.forEach(([wx, wy, wz, side]) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx, wy, wz);
    const tireCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.36, 24), tireMat);
    tireCyl.rotation.z = Math.PI / 2;
    const wheelCover = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.37, 16), rimMat);
    wheelCover.rotation.z = Math.PI / 2;
    const compoundRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.016, 8, 24), ringMat);
    compoundRing.rotation.y = Math.PI / 2;
    compoundRing.position.x = side * 0.182;

    wGroup.add(tireCyl, wheelCover, compoundRing);
    wheels.push(wGroup);
    registerPart(wGroup, side * 0.9, 0, 0);
  });

  return { root, wheels, explodableParts, drsFlap };
}

export const ThreeCarAndTrack: React.FC<ThreeCarAndTrackProps> = ({
  mode,
  livery,
  helmet,
  cameraPreset = 'broadcast',
  explodedFactor = 0,
  circuit,
  cars = [],
  focusedDriverId,
  weather = 'DRY',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Mutable refs so React UI updates never re-create the WebGL context
  const propsRef = useRef({
    mode,
    livery,
    helmet,
    cameraPreset,
    explodedFactor,
    circuit,
    cars,
    focusedDriverId,
    weather,
  });
  propsRef.current = {
    mode,
    livery,
    helmet,
    cameraPreset,
    explodedFactor,
    circuit,
    cars,
    focusedDriverId,
    weather,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const bgHex = 0x090d16;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, mode === 'race' ? 0.0045 : 0.025);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 600);
    camera.position.set(4.2, 2.2, 5.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Balanced 3-Point Studio & Track Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(14, 24, 16);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 120;
      const d = 25;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.15);
    rimLight.position.set(-12, 10, -14);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.minDistance = 1.2;
    controls.maxDistance = mode === 'race' ? 180 : 14;

    let userInteracting = false;
    controls.addEventListener('start', () => {
      userInteracting = true;
    });

    // Build scene objects depending on mode
    const defaultLiv: LiveryDesign = propsRef.current.livery || {
      id: 'default',
      name: 'Argon F1',
      mainBodyColor: '#e11d48',
      secondaryColor: '#0f172a',
      accentColor: '#38bdf8',
      frontWingColor: '#0f172a',
      rearWingColor: '#0f172a',
      sidepodColor: '#e11d48',
      engineCoverColor: '#0f172a',
      noseColor: '#e11d48',
      floorColor: '#111827',
      wheelCoverColor: '#38bdf8',
      haloColor: '#1e293b',
      numberPanelColor: '#ffffff',
      finish: 'metallic',
      pattern: 'aeroFlow',
      showCarbonAreas: true,
      titleSponsorText: 'ARGON F1',
    };

    let showroomCar: ReturnType<typeof buildProceduralF1Car> | null = null;
    let trackCurve: THREE.CatmullRomCurve3 | null = null;
    const raceCarMeshes = new Map<string, ReturnType<typeof buildProceduralF1Car>>();
    let rainSystem: THREE.Points | null = null;

    if (mode === 'showroom') {
      // Showroom Turntable & Garage LED Rings
      const platformGeo = new THREE.CylinderGeometry(3.8, 4.1, 0.12, 48);
      const platformMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.25,
        metalness: 0.6,
      });
      const platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.y = -0.06;
      platform.receiveShadow = !isSoftwareGl;
      scene.add(platform);

      const ledRingGeo = new THREE.RingGeometry(3.55, 3.65, 64);
      ledRingGeo.rotateX(-Math.PI / 2);
      const ledRingMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(defaultLiv.accentColor),
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const ledRing = new THREE.Mesh(ledRingGeo, ledRingMat);
      ledRing.position.y = 0.01;
      scene.add(ledRing);

      showroomCar = buildProceduralF1Car(defaultLiv, propsRef.current.helmet);
      scene.add(showroomCar.root);
    } else {
      // Race Mode: Build 3D Track Ribbon, Kerbs, Grandstands, Trees & 20 Cars
      const wpList = propsRef.current.circuit?.waypoints || [
        { x: -70, z: -35, sector: 1 },
        { x: 20, z: -40, sector: 1 },
        { x: 75, z: -15, sector: 2 },
        { x: 65, z: 35, sector: 2 },
        { x: -15, z: 45, sector: 3 },
        { x: -75, z: 20, sector: 3 },
      ];
      const curvePts = wpList.map((p, idx) => new THREE.Vector3(p.x, Math.sin(idx * 0.7) * 0.6, p.z));
      trackCurve = new THREE.CatmullRomCurve3(curvePts, true, 'catmullrom', 0.5);

      // Ground Terrain Plane
      const groundGeo = new THREE.PlaneGeometry(500, 500);
      groundGeo.rotateX(-Math.PI / 2);
      const groundMat = new THREE.MeshStandardMaterial({ color: 0x0b131e, roughness: 0.92, metalness: 0.05 });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.position.y = -0.4;
      scene.add(ground);

      // Extruded Asphalt Ribbon
      const tubeGeo = new THREE.TubeGeometry(trackCurve, 180, 3.2, 8, true);
      tubeGeo.scale(1, 0.04, 1);
      const asphaltMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.75,
        metalness: 0.12,
      });
      const trackMesh = new THREE.Mesh(tubeGeo, asphaltMat);
      trackMesh.position.y = 0.02;
      trackMesh.receiveShadow = !isSoftwareGl;
      scene.add(trackMesh);

      // Start/Finish Gantry Bridge
      const startPt = trackCurve.getPointAt(0);
      const startTan = trackCurve.getTangentAt(0);
      const gantryGroup = new THREE.Group();
      gantryGroup.position.copy(startPt);
      gantryGroup.lookAt(_vec3A.copy(startPt).add(startTan));
      const pillarL = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 3.8, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      pillarL.position.set(-3.8, 1.9, 0);
      const pillarR = pillarL.clone();
      pillarR.position.set(3.8, 1.9, 0);
      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 0.7, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xe11d48 })
      );
      bridge.position.set(0, 3.6, 0);
      gantryGroup.add(pillarL, pillarR, bridge);
      scene.add(gantryGroup);

      // Trackside Trees via InstancedMesh (following Three.js skill instancing rule)
      const treeCount = 60;
      const treeGeo = new THREE.ConeGeometry(1.4, 4.2, 6);
      const treeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
      const treeInst = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
      for (let i = 0; i < treeCount; i++) {
        const t = i / treeCount;
        const pt = trackCurve.getPointAt(t);
        const tan = trackCurve.getTangentAt(t);
        const sideOffset = (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 2.5);
        _dummyObj.position.set(pt.x - tan.z * sideOffset, 1.7, pt.z + tan.x * sideOffset);
        const s = 0.85 + (i % 4) * 0.1;
        _dummyObj.scale.set(s, s, s);
        _dummyObj.updateMatrix();
        treeInst.setMatrixAt(i, _dummyObj.matrix);
      }
      treeInst.computeBoundingSphere();
      scene.add(treeInst);

      // Rain Particle System
      const rainCount = 600;
      const rainPositions = new Float32Array(rainCount * 3);
      for (let i = 0; i < rainCount; i++) {
        rainPositions[i * 3] = (Math.random() - 0.5) * 180;
        rainPositions[i * 3 + 1] = Math.random() * 35;
        rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 180;
      }
      const rainGeo = new THREE.BufferGeometry();
      rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
      const rainMat = new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.25, transparent: true, opacity: 0.65 });
      rainSystem = new THREE.Points(rainGeo, rainMat);
      scene.add(rainSystem);
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Resize listener
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Software WebGL afterDraw helper
    let frameId = 0;
    let disposed = false;
    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const clock = new THREE.Clock();
    let prevLiveryJson = '';

    function tick() {
      if (disposed) return;
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const p = propsRef.current;

      if (p.mode === 'showroom' && showroomCar) {
        // Check if livery or helmet changed
        const curJson = JSON.stringify({ l: p.livery, h: p.helmet });
        if (curJson !== prevLiveryJson && p.livery) {
          prevLiveryJson = curJson;
          scene.remove(showroomCar.root);
          showroomCar = buildProceduralF1Car(p.livery, p.helmet);
          scene.add(showroomCar.root);
        }

        // Smoothly damp exploded view parts
        const exp = p.explodedFactor || 0;
        showroomCar.explodableParts.forEach((ep) => {
          _vec3A.copy(ep.basePos).addScaledVector(ep.dir, exp * 0.9);
          ep.mesh.position.lerp(_vec3A, 1 - Math.exp(-8 * dt));
        });

        // Spin wheels gently
        showroomCar.wheels.forEach((w) => {
          w.rotation.x += dt * 1.4;
        });

        // Camera preset positioning in showroom when not manually dragging
        if (!userInteracting) {
          if (p.cameraPreset === 'front') {
            _vec3CamPos.set(0, 1.15, 4.6);
            _vec3Target.set(0, 0.35, 0);
          } else if (p.cameraPreset === 'rear') {
            _vec3CamPos.set(0, 1.25, -4.6);
            _vec3Target.set(0, 0.4, 0);
          } else if (p.cameraPreset === 'side') {
            _vec3CamPos.set(4.8, 1.05, 0);
            _vec3Target.set(0, 0.35, 0);
          } else if (p.cameraPreset === 'top') {
            _vec3CamPos.set(0.1, 5.8, 0.1);
            _vec3Target.set(0, 0, 0);
          } else if (p.cameraPreset === 'helmet') {
            _vec3CamPos.set(0.95, 1.05, 0.75);
            _vec3Target.set(0, 0.58, 0.08);
          } else {
            // Default gentle turntable orbit
            const elapsed = clock.elapsedTime * 0.28;
            _vec3CamPos.set(Math.cos(elapsed) * 4.4, 1.65, Math.sin(elapsed) * 4.4);
            _vec3Target.set(0, 0.35, 0);
          }
          camera.position.lerp(_vec3CamPos, 1 - Math.exp(-5 * dt));
          controls.target.lerp(_vec3Target, 1 - Math.exp(-5 * dt));
        }
      } else if (p.mode === 'race' && trackCurve) {
        // Update rain visibility
        if (rainSystem) {
          rainSystem.visible = p.weather === 'LIGHT_RAIN' || p.weather === 'HEAVY_RAIN';
        }

        // Sync 3D cars on track
        p.cars.forEach((carState) => {
          let meshObj = raceCarMeshes.get(carState.driverId);
          if (!meshObj) {
            const carLiv: LiveryDesign = {
              ...defaultLiv,
              mainBodyColor: carState.primaryColor,
              secondaryColor: '#0f172a',
              accentColor: carState.secondaryColor,
              frontWingColor: carState.secondaryColor,
              rearWingColor: carState.secondaryColor,
            };
            meshObj = buildProceduralF1Car(carLiv, undefined, carState.tireCompound);
            meshObj.root.scale.setScalar(0.62);
            scene.add(meshObj.root);
            raceCarMeshes.set(carState.driverId, meshObj);
          }

          const t = ((carState.trackProgress % 1) + 1) % 1;
          trackCurve!.getPointAt(t, _vec3A);
          trackCurve!.getTangentAt(t, _vec3B);

          // Offset laterally slightly when battling closely
          const lateralOffset = (carState.position % 2 === 0 ? 0.65 : -0.65) * (carState.gapToAhead < 0.8 ? 1 : 0.25);
          meshObj.root.position.set(
            _vec3A.x - _vec3B.z * lateralOffset,
            _vec3A.y + 0.08,
            _vec3A.z + _vec3B.x * lateralOffset
          );
          meshObj.root.lookAt(
            meshObj.root.position.x + _vec3B.x,
            meshObj.root.position.y + _vec3B.y,
            meshObj.root.position.z + _vec3B.z
          );

          meshObj.wheels.forEach((w) => {
            w.rotation.x += dt * (carState.speedKmh * 0.08);
          });
          meshObj.drsFlap.rotation.x = carState.drsActive ? -0.35 : 0;
        });

        // Camera follow on focused driver
        const focusedCar =
          p.cars.find((c) => c.driverId === p.focusedDriverId) || p.cars[0];
        const focusedMesh = focusedCar ? raceCarMeshes.get(focusedCar.driverId) : undefined;

        if (focusedCar && focusedMesh && p.cameraPreset !== 'free') {
          userInteracting = false;
          const t = ((focusedCar.trackProgress % 1) + 1) % 1;
          trackCurve.getPointAt(t, _vec3A);
          trackCurve.getTangentAt(t, _vec3B);

          switch (p.cameraPreset) {
            case 'cockpit':
              _vec3CamPos.copy(focusedMesh.root.position).add(new THREE.Vector3(0, 0.55, 0));
              _vec3Target.copy(_vec3CamPos).addScaledVector(_vec3B, 12);
              break;
            case 'onboard':
              _vec3CamPos.copy(focusedMesh.root.position).add(new THREE.Vector3(0, 0.85, 0)).addScaledVector(_vec3B, -0.4);
              _vec3Target.copy(focusedMesh.root.position).addScaledVector(_vec3B, 14);
              break;
            case 'nose':
              _vec3CamPos.copy(focusedMesh.root.position).add(new THREE.Vector3(0, 0.28, 0)).addScaledVector(_vec3B, 1.1);
              _vec3Target.copy(_vec3CamPos).addScaledVector(_vec3B, 16);
              break;
            case 'rear':
              _vec3CamPos.copy(focusedMesh.root.position).add(new THREE.Vector3(0, 0.75, 0)).addScaledVector(_vec3B, 2.2);
              _vec3Target.copy(focusedMesh.root.position).addScaledVector(_vec3B, -12);
              break;
            case 'side':
              _vec3CamPos.set(
                focusedMesh.root.position.x - _vec3B.z * 3.8,
                focusedMesh.root.position.y + 0.9,
                focusedMesh.root.position.z + _vec3B.x * 3.8
              );
              _vec3Target.copy(focusedMesh.root.position);
              break;
            case 'helicopter':
              _vec3CamPos.copy(focusedMesh.root.position).add(new THREE.Vector3(14, 28, 14));
              _vec3Target.copy(focusedMesh.root.position);
              break;
            case 'pitlane':
              trackCurve.getPointAt(0.01, _vec3CamPos);
              _vec3CamPos.y += 2.6;
              _vec3CamPos.x += 5;
              _vec3Target.copy(focusedMesh.root.position);
              break;
            case 'trackside':
              trackCurve.getPointAt(Math.floor(t * 6) / 6, _vec3CamPos);
              _vec3CamPos.y += 2.4;
              _vec3CamPos.x += 7;
              _vec3Target.copy(focusedMesh.root.position);
              break;
            case 'broadcast':
            default:
              _vec3CamPos
                .copy(focusedMesh.root.position)
                .addScaledVector(_vec3B, -6.5)
                .add(new THREE.Vector3(0, 2.6, 0));
              _vec3Target.copy(focusedMesh.root.position).addScaledVector(_vec3B, 4);
              break;
          }
          camera.position.lerp(_vec3CamPos, 1 - Math.exp(-8 * dt));
          controls.target.lerp(_vec3Target, 1 - Math.exp(-10 * dt));
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
    };
  }, [mode]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden bg-slate-950 ${className}`}
    />
  );
};
