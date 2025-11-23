
"use client";

import { useEffect, useRef, useCallback, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LoadedAssets } from '@/hooks/use-scene-loader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSRPass } from '../lib/Custom_SSRPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { QualityLevel } from './SettingsMenu';
import { Midi } from '@tonejs/midi';
import { PlaybackState } from '@/app/page';

export interface Note {
  midi: number;
  time: number;
  duration: number;
  velocity: number;
  name: string;
  userData?: any;
}

const midiNoteToKeyName: { [key: number]: string } = {
  // White keys
  48: 'C3', 50: 'D3', 52: 'E3', 53: 'F3', 55: 'G3', 57: 'A3', 59: 'B3',
  60: 'C4', 62: 'D4', 64: 'E4', 65: 'F4', 67: 'G4', 69: 'A4', 71: 'B4',
  72: 'C5', 74: 'D5', 76: 'E5', 77: 'F5', 79: 'G5', 81: 'A5', 83: 'B5',
  84: 'C6', 86: 'D6', 88: 'E6', 89: 'F6', 91: 'G6', 93: 'A6', 95: 'B6',
  96: 'C7',
  // Black keys
  49: 'C_Sharp3', 51: 'D_Sharp3', 54: 'F_Sharp3', 56: 'G_Sharp3', 58: 'A_Sharp3',
  61: 'C_Sharp4', 63: 'D_Sharp4', 66: 'F_Sharp4', 68: 'G_Sharp4', 70: 'A_Sharp4',
  73: 'C_Sharp5', 75: 'D_Sharp5', 78: 'F_Sharp5', 80: 'G_Sharp5', 82: 'A_Sharp5',
  85: 'C_Sharp6', 87: 'D_Sharp6', 90: 'F_Sharp6', 92: 'G_Sharp6', 94: 'A_Sharp6',
};

const keyNameToMidiNote: { [key: string]: number } = Object.entries(
  midiNoteToKeyName
).reduce((acc, [key, value]) => ({ ...acc, [value]: parseInt(key) }), {});


interface SceneContainerProps {
  assets: LoadedAssets;
  qualityLevel: QualityLevel;
  onSceneInit: (args: {
    keyMaterials: Record<string, THREE.MeshStandardMaterial>;
    mixer: THREE.AnimationMixer | null;
  }) => void;
  onKeyClick: (note: number) => void;
  midi: Midi | null;
  playbackState: PlaybackState;
  playbackSpeed: number;
}

const PIXELS_PER_SECOND = 50;
const KEY_SURFACE_Y = -0.05;
const SYNC_OFFSET = 0.25; // Synchronization offset in seconds

export interface SceneContainerRef {
  triggerParticlesForNotes: (notes: number[]) => void;
}

export const SceneContainer = forwardRef<SceneContainerRef, SceneContainerProps>(({
  assets,
  qualityLevel,
  onSceneInit,
  onKeyClick,
  midi,
  playbackState,
  playbackSpeed,
}, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pianoModelRef = useRef<THREE.Group>();
  const ssrPassRef = useRef<SSRPass>();
  const bloomPassRef = useRef<UnrealBloomPass>();
  const keyObjectsRef = useRef<{ [keyName: string]: THREE.Mesh }>({});
  const keyMaterialsRef = useRef<{ [keyName: string]: THREE.MeshStandardMaterial }>({});
  const ghostNotesRef = useRef<THREE.Group>(new THREE.Group());
  const activeGhostNotes = useRef<THREE.Mesh[]>([]);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const activeParticlesRef = useRef<Array<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    color: THREE.Color;
    size: number;
  }>>([]);
  const colliderMeshRef = useRef<THREE.Mesh | null>(null);

  // Refs for managing animation state without causing re-renders
  const playbackStateRef = useRef(playbackState);
  const playbackSpeedRef = useRef(playbackSpeed);
  const midiRef = useRef(midi);
  const playbackTimeRef = useRef({ startTime: 0, pausedTime: 0, lastFrameTime: 0 });

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    midiRef.current = midi;
  }, [midi]);

  useEffect(() => {
    playbackStateRef.current = playbackState;
    if (playbackState === 'playing') {
      const now = performance.now();
      if (playbackTimeRef.current.startTime === 0) { // Starting from beginning
        playbackTimeRef.current.startTime = now;
        playbackTimeRef.current.pausedTime = 0;
      } else { // Resuming from pause
        playbackTimeRef.current.startTime = now - playbackTimeRef.current.pausedTime;
      }
      playbackTimeRef.current.lastFrameTime = now;
    } else if (playbackState === 'paused') {
      playbackTimeRef.current.pausedTime = performance.now() - playbackTimeRef.current.startTime;
    } else if (playbackState === 'stopped') {
      playbackTimeRef.current = { startTime: 0, pausedTime: 0, lastFrameTime: 0 };
      if (ghostNotesRef.current) {
        ghostNotesRef.current.position.y = 0;
      }
    }
  }, [playbackState]);

  const spawnSparks = useCallback((position: THREE.Vector3, isCorrect: boolean) => {
    const sparkCount = isCorrect ? 25 : 15;
    const color = isCorrect ? new THREE.Color(0x00ff00) : new THREE.Color(0xff0000);
    const intensity = isCorrect ? 100 : 50; // MUCH HIGHER: Dramatically increased for extreme brightness

    for (let i = 0; i < sparkCount; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 2
      );

      activeParticlesRef.current.push({
        position: position.clone(),
        velocity,
        life: 1.0,
        maxLife: 1.0,
        color: color.clone().multiplyScalar(intensity),
        size: isCorrect ? 0.15 : 0.1,
      });
    }
  }, []);

  useImperativeHandle(ref, () => ({
    triggerParticlesForNotes: (notes: number[]) => {
      notes.forEach(note => {
        const keyName = midiNoteToKeyName[note];
        if (keyName && keyObjectsRef.current[keyName]) {
          const keyMesh = keyObjectsRef.current[keyName];
          const position = new THREE.Vector3();
          keyMesh.getWorldPosition(position);
          position.y += 0.1;
          position.z += 0.8;
          spawnSparks(position, true);
        }
      });
    }
  }));

  const handleCorrectNoteHit = useCallback((noteMesh: THREE.Mesh) => {
    if (noteMesh.material instanceof THREE.MeshStandardMaterial) {
      gsap.to(noteMesh.material, {
        emissiveIntensity: 4.0,
        duration: 0.1,
        onComplete: () => {
          gsap.to(noteMesh.material, {
            opacity: 0,
            duration: 0.2,
            onComplete: () => {
              noteMesh.visible = false; // Hide instead of remove for performance
            }
          });
        }
      });
    }
  }, []);

  const internalOnKeyClick = useCallback((note: number) => {
    onKeyClick(note);
    if (playbackStateRef.current !== 'playing') return;

    const hitWindow = 0.15; // ±0.15 seconds
    const notesToRemove: THREE.Mesh[] = [];

    const currentTime = (performance.now() - playbackTimeRef.current.startTime) / 1000;

    activeGhostNotes.current.forEach(noteMesh => {
      const noteData = noteMesh.userData as Note;
      if (noteData.midi === note) {
        const noteStartTime = noteData.time;
        if (Math.abs(currentTime - noteStartTime) <= hitWindow) {
          handleCorrectNoteHit(noteMesh);
          // Don't remove from activeGhostNotes yet, just handle hit
        }
      }
    });

  }, [onKeyClick, handleCorrectNoteHit]);

  const internalOnKeyClickRef = useRef(internalOnKeyClick);
  useEffect(() => {
    internalOnKeyClickRef.current = internalOnKeyClick;
  }, [internalOnKeyClick]);


  useEffect(() => {
    if (!ssrPassRef.current || !bloomPassRef.current) return;

    const ssrPass = ssrPassRef.current;
    const bloomPass = bloomPassRef.current;

    switch (qualityLevel) {
      case 'Low':
        bloomPass.enabled = false;
        ssrPass.enabled = false;
        break;
      case 'Medium':
        bloomPass.enabled = true;
        bloomPass.strength = 0.1;
        ssrPass.blur = true;
        ssrPass.opacity = 0.1;
        ssrPass.thickness = 0.8;
        if ((ssrPass as any).material?.uniforms?.uIor) (ssrPass as any).material.uniforms.uIor.value = 1.45;
        ssrPass.maxDistance = 8;
        (ssrPass as any).maxRoughness = 0.1;
        if ((ssrPass as any).material?.uniforms?.uJitter) (ssrPass as any).material.uniforms.uJitter.value = 0.3;

        break;
      case 'High':
        bloomPass.enabled = true;
        bloomPass.strength = 0.2;

        ssrPass.opacity = 0.2;
        ssrPass.thickness = 1.5;
        if ((ssrPass as any).material?.uniforms?.uIor) (ssrPass as any).material.uniforms.uIor.value = 1.25;
        ssrPass.maxDistance = 35;
        (ssrPass as any).maxRoughness = 0.2;
        if ((ssrPass as any).material?.uniforms?.uJitter) (ssrPass as any).material.uniforms.uJitter.value = 0.5;

        break;
    }

  }, [qualityLevel]);

  const [isSceneReady, setIsSceneReady] = useState(false);

  // --- NEW GHOST NOTES IMPLEMENTATION (Shader-Driven) ---
  useEffect(() => {
    // Cleanup
    if (ghostNotesRef.current) {
      ghostNotesRef.current.clear();
    }
    activeGhostNotes.current = [];

    if (!midi || !isSceneReady || Object.keys(keyObjectsRef.current).length === 0) return;

    const notes = midi.tracks.flatMap(track => track.notes);
    const pianoKeys = keyObjectsRef.current;
    const count = notes.length;

    // Geometry: A simple unit box. We will scale it in the shader or via instance matrix.
    // Actually, scaling via matrix is easier for width/depth, but length (Y) depends on duration.
    // Let's use a base geometry of 1x1x1.
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Custom Attributes for the Shader
    // We need to pass: Note Start Time, Note Duration.
    const noteTimes = new Float32Array(count);
    const noteDurations = new Float32Array(count);

    // We also need to set the static transforms (X position, Width, Z position)
    const dummy = new THREE.Object3D();
    const keyPosition = new THREE.Vector3();

    // Determine Surface Y (Hit Point) and Reference Z (Plane)
    let surfaceY = KEY_SURFACE_Y;
    let referenceZ = 0;

    // Use C3 (White Key) as the reference for the Z plane so all notes fall flatly aligned
    const refKey = pianoKeys['C3'] || pianoKeys[Object.keys(pianoKeys)[0]];

    if (refKey) {
      const vec = new THREE.Vector3();
      refKey.getWorldPosition(vec);
      surfaceY = vec.y;
      referenceZ = vec.z;
    }

    const instancedMesh = new THREE.InstancedMesh(geometry, undefined, count);

    notes.forEach((note, i) => {
      const keyName = midiNoteToKeyName[note.midi];
      const keyObject = pianoKeys[keyName];
      if (!keyObject) return;

      keyObject.getWorldPosition(keyPosition);

      const isBlackKey = keyName.includes('_Sharp');
      const keyWidth = isBlackKey ? 0.6 : 0.9;
      const keyDepth = 0.2;

      // We set the initial position at the HIT POINT (Surface Y).
      // The shader will offset this Y position based on time.
      // Z Position:
      // White keys: referenceZ + 0.7 (Closer to camera)
      // Black keys: referenceZ + 0.5 (Slightly back, mimicking physical layout)
      const zOffset = isBlackKey ? 0.5 : 0.7;
      dummy.position.set(keyPosition.x, surfaceY, referenceZ + zOffset);
      dummy.rotation.y = Math.PI / 2;
      dummy.scale.set(keyWidth, 1, keyDepth); // Y scale is 1 initially, controlled by shader/duration
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(i, dummy.matrix);

      noteTimes[i] = note.time;
      noteDurations[i] = note.duration;
    });

    geometry.setAttribute('aNoteTime', new THREE.InstancedBufferAttribute(noteTimes, 1));
    geometry.setAttribute('aNoteDuration', new THREE.InstancedBufferAttribute(noteDurations, 1));

    // Custom Shader Material with Collider-based Clipping
    const material = new THREE.MeshStandardMaterial({
      color: '#9D4EDD',        // Purple/Magenta instead of sky blue
      emissive: '#9D4EDD',     // Match emissive to color
      emissiveIntensity: 0.3,  // Reduced from 0.8 for subtlety
      transparent: true,
      opacity: 0.35,           // Reduced from 0.6 for more transparency
    });

    // If collider is loaded, use it to create clipping planes
    if (colliderMeshRef.current) {
      const collider = colliderMeshRef.current;
      collider.geometry.computeBoundingBox();
      const bbox = collider.geometry.boundingBox!;

      // Get world position of collider
      const worldPos = new THREE.Vector3();
      collider.getWorldPosition(worldPos);

      // Create a clipping plane at the top of the collider (where notes should disappear)
      const clipY = worldPos.y + bbox.max.y;
      const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -clipY);

      material.clippingPlanes = [clippingPlane];
      material.clipShadows = true;

      console.log('Clipping plane set at Y:', clipY);
    } else {
      console.warn('GhostNotesCollider not loaded yet');
    }

    const UNITS_PER_SECOND = 8; // Speed

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uSpeed = { value: UNITS_PER_SECOND };
      shader.uniforms.uSurfaceY = { value: surfaceY };

      // Pass uniforms reference to the mesh so we can update them
      instancedMesh.userData.shaderUniforms = shader.uniforms;

      // Add varyings and attributes at the very beginning
      shader.vertexShader = `
            attribute float aNoteTime;
            attribute float aNoteDuration;
            uniform float uTime;
            uniform float uSpeed;
            uniform float uSurfaceY;
            
            varying float vWorldY;
            varying float vNoteHeight;
      ` + shader.vertexShader;

      shader.fragmentShader = `
            varying float vWorldY;
            varying float vNoteHeight;
            uniform float uSurfaceY;
      ` + shader.fragmentShader;

      // Inject logic to modify vertex position
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
            #include <begin_vertex>

            // Calculate height based on duration and speed
            float noteHeight = aNoteDuration * uSpeed;
            vNoteHeight = noteHeight;
            
            // Apply scaling to Y axis (since base geometry is 1 unit high)
            transformed.y *= noteHeight;
            
            // Shift so the bottom of the mesh is at (0,0,0) local, instead of center
            transformed.y += noteHeight * 0.5;

            // Calculate vertical offset based on time
            // Distance to fall = (NoteTime - CurrentTime) * Speed
            float fallDistance = (aNoteTime - uTime) * uSpeed;
            
            transformed.y += fallDistance;
            `
      );

      // Pass world Y position to fragment shader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
            #include <worldpos_vertex>
            // worldPosition is already calculated by the include above
            vWorldY = worldPosition.y;
            `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opacitytest_fragment>',
        `
            #include <opacitytest_fragment>
            
            // DEBUG: Visualize vWorldY values with color
            float debugRange = 2.0;
            float normalizedY = (vWorldY - uSurfaceY) / debugRange;
            
            if (normalizedY < 0.0) {
                diffuseColor.rgb = vec3(0.0, 0.0, 1.0); // Blue - below surface
            } else if (normalizedY < 0.1) {
                diffuseColor.rgb = vec3(0.0, 1.0, 0.0); // Green - at surface
            } else {
                diffuseColor.rgb = vec3(1.0, 0.0, 0.0) * min(normalizedY, 1.0); // Red - above
            }
            `
      );

      // Debug: Log surface Y value
      console.log('GhostNotes Surface Y:', surfaceY);
    };

    instancedMesh.material = material; // Assign the material after onBeforeCompile
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.userData.excludeFromSSR = true;
    instancedMesh.castShadow = false;
    instancedMesh.receiveShadow = false;
    instancedMesh.frustumCulled = false; // Disable culling to avoid issues for now

    ghostNotesRef.current.add(instancedMesh);

  }, [midi, isSceneReady]);


  useEffect(() => {
    if (!mountRef.current || !assets || !assets.models) return;

    let renderer: WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let composer: EffectComposer | null = null;
    let animationFrameId: number;
    let mixer: THREE.AnimationMixer | null = null;
    const clock = new THREE.Clock();

    const initScene = async () => {
      const currentMount = mountRef.current!;

      const scene = new THREE.Scene();
      if (assets.envMap) {
        scene.environment = assets.envMap;
        scene.background = assets.envMap;
      }

      scene.add(ghostNotesRef.current);

      // Initialize Particle System for collision sparks
      const maxParticles = 500;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(maxParticles * 3);
      const colors = new Float32Array(maxParticles * 3);
      const sizes = new Float32Array(maxParticles);

      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      // Create circular particle texture
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      // Draw a radial gradient circle
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);

      const particleTexture = new THREE.CanvasTexture(canvas);

      const particleMaterial = new THREE.PointsMaterial({
        size: 0.03,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: particleTexture, // Apply circular texture
      });

      const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
      particleSystemRef.current = particleSystem;
      scene.add(particleSystem);

      const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      camera.position.set(0, 2, 8);

      renderer = new WebGLRenderer({ antialias: false, alpha: true });

      let pixelRatio;
      switch (qualityLevel) {
        case 'Low':
          pixelRatio = 0.65;
          break;
        case 'Medium':
          pixelRatio = 0.85;
          break;
        case 'High':
          pixelRatio = 1.2;
          break;
        default:
          pixelRatio = 1;
          break;
      }
      renderer.setPixelRatio(pixelRatio);

      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.localClippingEnabled = true; // Enable clipping planes
      currentMount.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 10;
      controls.maxPolarAngle = Math.PI / 2;
      controls.minAzimuthAngle = -Math.PI * (4 / 9);
      controls.maxAzimuthAngle = Math.PI * (4 / 9);


      const directionalLight = new THREE.DirectionalLight(0xE7D06E, 0.5);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      const ambientLight = new THREE.AmbientLight(0xE7D06E, 0.2);
      scene.add(ambientLight);

      const keyMaterials: Record<string, THREE.MeshStandardMaterial> = {};


      Object.entries(assets.models!).forEach(([key, gltf]) => {
        const model = gltf.scene;

        model.position.set(0, -1, 0);
        scene.add(model);

        if (key === 'PIANO') {
          pianoModelRef.current = model;
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              if (keyNameToMidiNote[child.name]) {
                const newMaterial = child.material.clone() as THREE.MeshStandardMaterial;
                newMaterial.emissive = new THREE.Color(0x000000);
                newMaterial.emissiveIntensity = 0;
                child.material = newMaterial;
                keyMaterials[child.name] = newMaterial;
                keyObjectsRef.current[child.name] = child;
              }
            }
          });
          model.userData.keyMaterials = keyMaterials;
        }
        if (key === 'Domain') {
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              if (child.material.name === 'Curtain' || child.material.name === 'Domain_1') {
                child.userData.excludeFromSSR = true;
              }
            }
          });
        }

        if (key === 'GhostNotesCollider') {
          // Make collider invisible but keep it in the scene for clipping
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.visible = false; // Invisible
              child.userData.isGhostNotesCollider = true;

              // Store reference for clipping plane calculation
              colliderMeshRef.current = child;
            }
          });
        }
      });

      if (assets.animations && assets.animations.length > 0 && pianoModelRef.current) {
        mixer = new THREE.AnimationMixer(pianoModelRef.current);
      }

      onSceneInit({ keyMaterials, mixer });
      keyMaterialsRef.current = keyMaterials; // Store for collision detection
      setIsSceneReady(true);

      if (pianoModelRef.current) {
        const box = new THREE.Box3().setFromObject(pianoModelRef.current);
        const center = box.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        camera.lookAt(center);
      }

      gsap.to(camera.position, {
        x: 0.0,
        y: 6,
        z: 2,
        duration: 4,
        onUpdate: () => {
          controls?.update();
        },
        onComplete: () => {
          if (qualityLevel === 'Low' || !ssrPassRef.current) return;

          const ssrPass = ssrPassRef.current;
          const targetOpacity = qualityLevel === 'Medium' ? 0.1 : 0.2;

          ssrPass.enabled = true;
          if (ssrPass) {
            gsap.to(ssrPass, {
              opacity: targetOpacity,
              duration: 0.01, // 2-second fade-in
              ease: 'power1.inOut'
            });
          }
        }
      });

      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));

      const meshesToReflect: THREE.Mesh[] = [];
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh && !obj.userData.excludeFromSSR) {
          meshesToReflect.push(obj);
        }
      });

      const ssrPass = new SSRPass({
        renderer,
        scene,
        camera,
        width: currentMount.clientWidth,
        height: currentMount.clientHeight,
        groundReflector: null,
        selects: meshesToReflect,
      });
      ssrPass.enabled = false;
      ssrPassRef.current = ssrPass;

      composer.addPass(ssrPass);

      const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.3, 0.65);
      bloomPassRef.current = bloomPass;
      composer.addPass(bloomPass);

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const now = performance.now();

        if (mixer) {
          mixer.update(delta);
        }

        if (playbackStateRef.current === 'playing') {
          const currentTime = (now - playbackTimeRef.current.startTime) / 1000;

          // Update Shader Uniforms
          // We need to access the instanced mesh's material uniforms
          if (ghostNotesRef.current.children.length > 0) {
            const instancedMesh = ghostNotesRef.current.children[0] as THREE.InstancedMesh;
            if (instancedMesh.userData.shaderUniforms) {
              // Apply SYNC_OFFSET here directly to the time sent to shader
              // This shifts the entire timeline "forward" so notes appear earlier
              const SYNC_OFFSET = 0.2;

              instancedMesh.userData.shaderUniforms.uTime.value = currentTime + SYNC_OFFSET;
              instancedMesh.userData.shaderUniforms.uSpeed.value = 8 * playbackSpeedRef.current; // Base speed 8 * multiplier
            }
          }

          // Collision Detection & Spark Generation
          if (ghostNotesRef.current.children.length > 0 && midiRef.current) {
            const instancedMesh = ghostNotesRef.current.children[0] as THREE.InstancedMesh;
            const notes = midiRef.current.tracks.flatMap(track => track.notes);
            const surfaceY = instancedMesh.userData.shaderUniforms?.uSurfaceY?.value || KEY_SURFACE_Y;
            const speed = instancedMesh.userData.shaderUniforms?.uSpeed?.value || 8;

            notes.forEach((note, i) => {
              const noteBottomY = surfaceY + ((note.time - currentTime - SYNC_OFFSET) * speed);
              const noteTopY = noteBottomY + (note.duration * speed);

              // Check if note is currently crossing the surface
              if (noteBottomY <= surfaceY && noteTopY >= surfaceY) {
                // Note is colliding with surface
                const keyName = midiNoteToKeyName[note.midi];
                const keyObject = keyObjectsRef.current[keyName];

                if (keyObject) {
                  // Throttle spark generation to avoid overwhelming the system
                  // Spawn sparks every ~100ms (10 times per second)
                  const lastSpawnTime = (note as any).lastSparkTime || 0;
                  const timeSinceLastSpark = now - lastSpawnTime;

                  if (timeSinceLastSpark >= 100) { // 100ms throttle
                    const keyPos = new THREE.Vector3();
                    keyObject.getWorldPosition(keyPos);

                    // Move particles closer to camera (positive Z)
                    keyPos.z += 0.8;

                    // Check if key is being pressed (emissive intensity > 0)
                    const material = keyMaterialsRef.current[keyName];
                    const isPressed = material && material.emissiveIntensity > 0.5;

                    spawnSparks(keyPos, isPressed);
                    (note as any).lastSparkTime = now;
                  }
                }
              } else {
                // Reset spark timer when not colliding
                (note as any).lastSparkTime = 0;
              }
            });
          }
        }

        // Update Particles (Optimized)
        if (particleSystemRef.current && activeParticlesRef.current.length > 0) {
          const geometry = particleSystemRef.current.geometry;
          const posAttr = geometry.attributes.position;
          const colorAttr = geometry.attributes.color;
          const sizeAttr = geometry.attributes.size;

          const positions = posAttr.array as Float32Array;
          const colors = colorAttr.array as Float32Array;
          const sizes = sizeAttr.array as Float32Array;

          let activeCount = 0;
          const deltaDecay = delta * 2;
          const gravity = delta * 9.8;

          // Filter and update in single pass
          for (let i = activeParticlesRef.current.length - 1; i >= 0; i--) {
            const particle = activeParticlesRef.current[i];
            particle.life -= deltaDecay;

            if (particle.life <= 0) {
              // Remove dead particle
              activeParticlesRef.current.splice(i, 1);
              continue;
            }

            // Update physics
            particle.velocity.y -= gravity;
            particle.position.x += particle.velocity.x * delta;
            particle.position.y += particle.velocity.y * delta;
            particle.position.z += particle.velocity.z * delta;

            // Write to buffer
            if (activeCount < 500) {
              const i3 = activeCount * 3;
              positions[i3] = particle.position.x;
              positions[i3 + 1] = particle.position.y;
              positions[i3 + 2] = particle.position.z;

              const alpha = particle.life / particle.maxLife;
              const colorAlpha = alpha * alpha; // Quadratic fade for smoother look
              colors[i3] = particle.color.r * colorAlpha;
              colors[i3 + 1] = particle.color.g * colorAlpha;
              colors[i3 + 2] = particle.color.b * colorAlpha;

              sizes[activeCount] = particle.size * alpha;

              activeCount++;
            }
          }

          // Clear unused slots (only if needed)
          if (activeCount < 500) {
            for (let i = activeCount; i < Math.min(activeCount + 10, 500); i++) {
              sizes[i] = 0;
            }
          }

          posAttr.needsUpdate = true;
          colorAttr.needsUpdate = true;
          sizeAttr.needsUpdate = true;
          geometry.setDrawRange(0, activeCount);
        }

        playbackTimeRef.current.lastFrameTime = now;

        controls?.update();
        composer?.render(delta);
      }
      animate();

      const handleResize = () => {
        if (mountRef.current && renderer) {
          const { clientWidth, clientHeight } = mountRef.current;
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(clientWidth, clientHeight);
          composer?.setSize(clientWidth, clientHeight);
        }
      };

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onClick = (event: MouseEvent) => {
        if (!pianoModelRef.current || !renderer) return;

        event.preventDefault();
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(pianoModelRef.current, true);

        if (intersects.length > 0) {
          let intersectedObject = intersects[0].object;
          if (intersectedObject instanceof THREE.Mesh) {
            const objectName = intersectedObject.name;

            if (objectName === 'On_Off') {
              return;
            }

            const midiNote = keyNameToMidiNote[objectName];
            if (midiNote) {
              internalOnKeyClickRef.current(midiNote);
            }
          }
        }
      };

      renderer.domElement.addEventListener('click', onClick);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (renderer?.domElement) {
          renderer.domElement.removeEventListener('click', onClick);
        }
        cancelAnimationFrame(animationFrameId);
        controls?.dispose();
        if (composer) {
          composer.passes.forEach(pass => pass.dispose?.());
        }
        renderer?.dispose();
        if (currentMount && renderer?.domElement) {
          try {
            currentMount.removeChild(renderer.domElement);
          } catch (e) { /* ignore */ }
        }
      };
    };

    const cleanupPromise = initScene();

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [assets, onSceneInit, qualityLevel]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
});

