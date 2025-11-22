
"use client";

import { useEffect, useRef, useState, memo, Suspense, useCallback, useContext } from 'react';
import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Button } from './ui/button';
import DonationContent from './content/donation-content';
import RegisterHomeChurchContent from './content/register-home-church-content';
import StartBibleMeetingContent from './content/start-bible-meeting-content';
import FindHomeChurchContent from './content/find-home-church-content';
import AboutUsContent from './content/about-us-content';
import { useTranslation } from '@/hooks/useTranslation';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import Footer from './Footer';
import { AudioContext } from '@/context/AudioContext';
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';
import FloatingParticles from './FloatingParticles';


gsap.registerPlugin(MotionPathPlugin);

type Orb = {
  angle: number;
  speed: number;
  radius: number;
  elevation: number;
  inclination: number;
};

type OrbSystem = {
  points: THREE.Points;
  orbs: Orb[];
};

type ViewState = 'default' | 'zoomed';

const introCameraPosition = new THREE.Vector3(0, 40, 0);
const introCameraTarget = new THREE.Vector3(0, 0, 0);

const initialCameraPosition = new THREE.Vector3(0, 8, 24);
const initialCameraTarget = new THREE.Vector3(0, 8, 0);


type TextureAnimation = {
  material: THREE.MeshStandardMaterial;
  speed: number;
  originalSpeed: number;
  direction: number;
  intensity: number;
};

interface SceneProps {
  assets: {
    tree: GLTF;
    grass: GLTF;
    sparkVideo: HTMLVideoElement;
    ballNormal: THREE.Texture;
    imperfection: THREE.Texture;
    skyAlbedo: THREE.Texture;
    audio: HTMLAudioElement;
  };
  hasInteracted: boolean;
  startIntroAnimation: boolean;
  onIntroAnimationComplete: () => void;
  setViewState: (state: ViewState) => void;
  viewState: ViewState;
}

const Scene = ({ assets, hasInteracted, startIntroAnimation, onIntroAnimationComplete, setViewState, viewState }: SceneProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [showContentContainer, setShowContentContainer] = useState(false);
  const [zoomedTarget, setZoomedTarget] = useState<THREE.Object3D | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState('');
  const [theme, setTheme] = useState('light');
  const isMobile = useIsMobile();

  const hoveredMeshRef = useRef<{mesh: THREE.Mesh, name: string, orbSystem: OrbSystem | null } | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const sparkMaterialsRef = useRef<{ [key: string]: THREE.MeshStandardMaterial }>({});
  const waypointsRef = useRef<{ [key: string]: THREE.Vector3 }>({});
  const treeLightMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const meshesForHoverRef = useRef<THREE.Mesh[]>([]);
  const sphereToParentMapRef = useRef(new Map<THREE.Mesh, THREE.Object3D>());
  
  const materialToAnimationsMapRef = useRef<Map<THREE.Material, { rough: TextureAnimation, normal: TextureAnimation }>>(new Map());
  const grassScanAnimationRef = useRef<gsap.core.Timeline | null>(null);

  const treeMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const treeGrowActionRef = useRef<THREE.AnimationAction | null>(null);
  const grassMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const grassActionRef = useRef<THREE.AnimationAction | null>(null);
  const sphereParentObjectsRef = useRef<THREE.Object3D[]>([]);
  const mouseRef = useRef(new THREE.Vector2());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const audioContext = useContext(AudioContext);
  const [isAudioUnmuted, setIsAudioUnmuted] = useState(false);

  const scanUniformsRef = useRef({
    u_time: { value: 0 },
    u_scan_radius: { value: -1.0 },
    u_wave_width: { value: 0.1 },
    u_scan_color: { value: new THREE.Color("#6EAA43") },
    u_is_closing: { value: 0.0 },
    u_closing_radius: { value: -1.0 },
  });


  const sphereToSparkMap: { [key: string]: string } = {
    orangeBall: 'Spark_1',
    blueBall: 'Spark_2',
    redBall: 'Spark_3',
    blackBall: 'Spark_4',
    greenBall: 'Spark_5',
  };
  const searchParams = useSearchParams();

  const playGrassScanAnimation = useCallback((isClosing: boolean = false) => {
      if (grassScanAnimationRef.current) {
          grassScanAnimationRef.current.kill();
      }
      const uniforms = scanUniformsRef.current;
      const tl = gsap.timeline({
          onComplete: () => {
              if (isClosing) {
                uniforms.u_scan_radius.value = -1;
              }
              grassScanAnimationRef.current = null;
          }
      });
  
      if (isClosing) {
          uniforms.u_is_closing.value = 1.0;
          uniforms.u_closing_radius.value = 0;
          tl.to(uniforms.u_closing_radius, { value: 30, duration: 1.5, ease: "power2.out" });

      } else {
          uniforms.u_is_closing.value = 0.0;
          uniforms.u_scan_radius.value = 0;
          tl.to(uniforms.u_scan_radius, { value: 30, duration: 1.5, ease: "power2.out" });
      }
  
      grassScanAnimationRef.current = tl;
  }, []);

  const playFullGrassScanAnimation = useCallback(() => {
    if (grassScanAnimationRef.current) {
        grassScanAnimationRef.current.kill();
    }
    const uniforms = scanUniformsRef.current;
    uniforms.u_is_closing.value = 0.0;
    uniforms.u_closing_radius.value = -1.0;

    const tl = gsap.timeline({
        onComplete: () => {
            uniforms.u_scan_radius.value = -1;
            uniforms.u_closing_radius.value = -1;
            grassScanAnimationRef.current = null;
        }
    });

    tl.fromTo(uniforms.u_scan_radius, 
        { value: 0.0 }, 
        { value: 30, duration: 1.5, ease: "power2.out" }
    );
    
    tl.fromTo(uniforms.u_closing_radius, 
        { value: 0.0 }, 
        { value: 30, duration: 1.5, ease: "power2.out" },
        "<0.7" 
    );
    
    grassScanAnimationRef.current = tl;
}, []);

    const limitCameraOrbit = useCallback(() => {
        if (controlsRef.current) {
            controlsRef.current.minPolarAngle = Math.PI / 2 - (0.5 * Math.PI / 180);
            controlsRef.current.maxPolarAngle = Math.PI / 2 + (0.5 * Math.PI / 180);
        }
    }, []);

    const freeCameraOrbit = useCallback(() => {
        if (controlsRef.current) {
            controlsRef.current.minPolarAngle = 0;
            controlsRef.current.maxPolarAngle = Math.PI;
        }
    }, []);

    const resetCameraPosition = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (camera && controls) {
      const currentTarget = controls.target.clone();
      const lookAtTarget = currentTarget.clone();

      gsap.to(camera.position, {
        duration: 1.5,
        x: initialCameraPosition.x,
        y: initialCameraPosition.y,
        z: initialCameraPosition.z,
        ease: 'power3.inOut',
      });

      gsap.to(lookAtTarget, {
        duration: 1.5,
        x: initialCameraTarget.x,
        y: initialCameraTarget.y,
        z: initialCameraTarget.z,
        ease: 'power3.inOut',
        onUpdate: () => {
          camera.lookAt(lookAtTarget);
          controls.target.copy(lookAtTarget);
        },
        onComplete: () => {
          controls.target.copy(initialCameraTarget);
          controls.saveState();
        },
      });
    }
  }, []);

    const onMouseClick = useCallback((event: MouseEvent) => {
        if (!hasInteracted || showContentContainer || !cameraRef.current) return;
        
        const isAtInitialPosition = cameraRef.current.position.distanceTo(initialCameraPosition) < 0.1;
        if (!isMobile && !isAtInitialPosition) return;
        
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycaster.intersectObjects(meshesForHoverRef.current, true);

        if (intersects.length > 0) {
            event.stopPropagation();
            const firstIntersected = intersects[0].object as THREE.Mesh;
            const parent = sphereToParentMapRef.current.get(firstIntersected);
            
            if (parent) {
                setHoveredLabel('');
                if (isMobile) {
                    playFullGrassScanAnimation();
                }

                if (audioContext && !isAudioUnmuted && audioContext.audioElement) {
                    const audioElement = audioContext.audioElement;
                    audioElement.currentTime = 0;
                    audioElement.loop = true;
                    audioContext.play();
                    setIsAudioUnmuted(true);
                }

                const targetWaypoint = waypointsRef.current[parent.name];
                if (targetWaypoint && cameraRef.current && controlsRef.current) {
                    const camera = cameraRef.current;
                    const controls = controlsRef.current;
                    controls.enabled = false;
                    freeCameraOrbit();

                    const zoomToTarget = () => {
                        const sparkMaterialName = sphereToSparkMap[parent.name as keyof typeof sphereToSparkMap];
                        const sparkMaterial = sparkMaterialsRef.current[sparkMaterialName];

                        if (sparkMaterial && assets.sparkVideo) {
                            sparkMaterial.visible = true;
                            assets.sparkVideo.currentTime = 0;
                            const playPromise = assets.sparkVideo.play();
                            if (playPromise === undefined) {
                                gsap.to({}, { duration: 3.5 }); 
                            } else {
                                playPromise.catch(e => console.error("Video play failed:", e));
                            }
                        }
                        
                        gsap.to(camera.position, {
                            duration: 2.5,
                            x: targetWaypoint.x,
                            y: targetWaypoint.y,
                            z: targetWaypoint.z - 12,
                            ease: 'power3.inOut',
                            onComplete: () => {
                                setShowContentContainer(true);
                                setViewState('zoomed');
                            }
                        });

                        setZoomedTarget(parent);
                    };
                    
                    zoomToTarget();
                }
            }
        }
    }, [hasInteracted, showContentContainer, setViewState, assets.sparkVideo, freeCameraOrbit, audioContext, isAudioUnmuted, isMobile, playFullGrassScanAnimation]);
    
    const onMouseClickRef = useRef(onMouseClick);
    useEffect(() => {
        onMouseClickRef.current = onMouseClick;
    }, [onMouseClick]);

  
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        
        const currentMount = mountRef.current;
        if (!currentMount) return;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        const clock = new THREE.Clock();

        // Raycaster for mouse interaction
        const raycaster = new THREE.Raycaster();
        const mouse = mouseRef.current;

        // Camera
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.copy(introCameraPosition);
        camera.lookAt(introCameraTarget);
        cameraRef.current = camera;
        
        // Renderer
        const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
        });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        
        // Post-processing
        const composer = new EffectComposer(renderer);
        composerRef.current = composer;
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 18;
        bloomPass.strength = 7;
        bloomPass.radius = 0.01;
        composer.addPass(bloomPass);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enabled = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controls.target.copy(initialCameraTarget);
        controlsRef.current = controls;

        // Inactivity Timer Logic
        const onControlsStart = () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        };

        const onControlsEnd = () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            inactivityTimerRef.current = setTimeout(resetCameraPosition, 2000);
        };

        controls.addEventListener('start', onControlsStart);
        controls.addEventListener('end', onControlsEnd);


        // Lighting
        const ambientLight = new THREE.AmbientLight(0xdcdcdc,4.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xdcdcdc, 1);
        directionalLight.position.set(0, 1, 7.5);
        scene.add(directionalLight);

        // Video Texture Setup
        const video = assets.sparkVideo;
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.colorSpace = THREE.SRGBColorSpace;

        video.onended = () => {
        Object.values(sparkMaterialsRef.current).forEach(mat => {
            mat.visible = false;
        });
        };

        // Roughness/Normal Texture
        const imperfectionTexture = assets.imperfection;
        imperfectionTexture.wrapS = THREE.RepeatWrapping;
        imperfectionTexture.wrapT = THREE.RepeatWrapping;
        
        const ballNormalTexture = assets.ballNormal;
        ballNormalTexture.wrapS = THREE.RepeatWrapping;
        ballNormalTexture.wrapT = THREE.RepeatWrapping;

        const roughnessAnimations: TextureAnimation[] = [];
        const normalAnimations: TextureAnimation[] = [];
        
        const orbSystems: OrbSystem[] = [];
        const orbSystemMap: { [key: string]: OrbSystem } = {};

        const targetMaterialNames = [
            "orangeBall", 
            "blueBall", 
            "RedBallGlass", 
            "BlackBallGlass", 
            "GreenBallGlass"
        ];
        
        // Main model processing
        const gltf = assets.tree;
        const model = gltf.scene;
        modelRef.current = model;
        scene.add(model);
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);

        // Grass model processing
        const grassGltf = assets.grass;
        const grassModel = grassGltf.scene;
        scene.add(grassModel);
        grassModel.position.set(0, 0, 0);
        grassModel.rotation.set(0, 0, 0);
        grassModel.scale.set(1, 1, 1);
        
        grassMixerRef.current = new THREE.AnimationMixer(grassModel);
        const grassClip = THREE.AnimationClip.findByName(grassGltf.animations, 'GrassRight');
        if (grassClip && grassMixerRef.current) {
            grassActionRef.current = grassMixerRef.current.clipAction(grassClip);
            grassActionRef.current.setLoop(THREE.LoopRepeat, Infinity);
            grassActionRef.current.play();
        }


        grassModel.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            const grassMat = child.material;
            grassMat.color.set("#6EAA43");
            grassMat.transparent = true;
            
            grassMat.onBeforeCompile = (shader) => {
                shader.uniforms.u_time = scanUniformsRef.current.u_time;
                shader.uniforms.u_scan_radius = scanUniformsRef.current.u_scan_radius;
                shader.uniforms.u_wave_width = scanUniformsRef.current.u_wave_width;
                shader.uniforms.u_scan_color = scanUniformsRef.current.u_scan_color;
                shader.uniforms.u_is_closing = scanUniformsRef.current.u_is_closing;
                shader.uniforms.u_closing_radius = scanUniformsRef.current.u_closing_radius;

                shader.vertexShader = `
                    varying vec3 vWorldPosition;
                    ${shader.vertexShader.replace(
                    `#include <worldpos_vertex>`,
                    `#include <worldpos_vertex>
                        vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
                    )}
                `;
                
                shader.fragmentShader = `
                    varying vec3 vWorldPosition;
                    uniform float u_scan_radius;
                    uniform vec3 u_scan_color;
                    uniform float u_is_closing;
                    uniform float u_closing_radius;

                    ${shader.fragmentShader.replace(
                    `#include <dithering_fragment>`,
                    `#include <dithering_fragment>

                    float dist = distance(vWorldPosition.xz, vec2(0.0));
                    
                    // Visibility Logic
                    bool isVisible = dist < u_scan_radius;
                    if (u_is_closing > 0.5) {
                        isVisible = isVisible && dist > u_closing_radius;
                    }
                    if (!isVisible) {
                        discard;
                    }
                    
                    gl_FragColor.rgb = u_scan_color;
                    `
                )}
                `;
            };
            grassMat.needsUpdate = true;
        }
        });
        
        const sphereNameKeys = [
        "orangeBall",
        "blueBall",
        "redBall",
        "blackBall",
        "greenBall",
        ];

        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                if (child.name === 'SKY_SPHERE' && child.material instanceof THREE.MeshStandardMaterial) {
                    if(child.material.name === 'TREE_LIGHT') {
                      treeLightMaterialRef.current = child.material;
                      child.material.emissive = child.material.color;
                      child.material.emissiveIntensity = 60;
                    }
                    if (child.material.name === 'SKY_SPHERE') {
                      const skyTexture = assets.skyAlbedo;
                      skyTexture.colorSpace = THREE.SRGBColorSpace;
                      child.material.map = skyTexture;
                      child.material.needsUpdate = true;
                    }
                }

                const material = child.material as THREE.MeshStandardMaterial;

                if (targetMaterialNames.includes(material.name)) {
                    const clonedRoughnessTexture = imperfectionTexture.clone();
                    clonedRoughnessTexture.needsUpdate = true;
                    material.roughnessMap = clonedRoughnessTexture;

                    const clonedNormalTexture = ballNormalTexture.clone();
                    clonedNormalTexture.needsUpdate = true;
                    material.normalMap = clonedNormalTexture;

                    const roughAnim: TextureAnimation = {
                        material: material,
                        speed: 0.1,
                        originalSpeed: 0.1,
                        direction: 1,
                        intensity: 0.7
                    };
                    roughnessAnimations.push(roughAnim);

                    const normalAnim: TextureAnimation = {
                    material: material,
                    speed: 0.1,
                    originalSpeed: 0.1,
                    direction: 1,
                    intensity: 0.8
                    };
                    normalAnimations.push(normalAnim);
                    materialToAnimationsMapRef.current.set(material, { rough: roughAnim, normal: normalAnim });
                }

                const isSparkMesh = material && Object.values(sphereToSparkMap).some(name => material.name === name);

                if (isSparkMesh) {
                    sparkMaterialsRef.current[material.name] = material;
                    material.map = videoTexture;
                    material.emissiveMap = videoTexture;
                    material.alphaMap = videoTexture;

                    if ( material.name === 'Spark_3') {
                        material.emissiveIntensity = 10;
                    } else {
                        material.emissiveIntensity = 5;
                    }
                    
                    material.transparent = true;
                    material.visible = false;
                } else {
                    const parentObject = child.parent;
                    if (parentObject && sphereNameKeys.includes(parentObject.name)) {
                        meshesForHoverRef.current.push(child);
                        sphereToParentMapRef.current.set(child, parentObject);

                        if (!sphereParentObjectsRef.current.some(p => p === parentObject)) {
                            sphereParentObjectsRef.current.push(parentObject);
                        }
                        parentObject.scale.set(0, 0, 0); // Set initial scale to 0
                    }
                }
            }
        });

        
        treeMixerRef.current = new THREE.AnimationMixer(gltf.scene);
        const treeGrowClip = THREE.AnimationClip.findByName(gltf.animations, 'treeGrow');
        
        if (treeGrowClip && treeMixerRef.current) {
            treeGrowActionRef.current = treeMixerRef.current.clipAction(treeGrowClip);
            treeGrowActionRef.current.setLoop(THREE.LoopOnce, 1);
            treeGrowActionRef.current.clampWhenFinished = true;
        }


        const createOrbs = (color: number, parent: THREE.Object3D): OrbSystem => {
            const particlesGeometry = new THREE.BufferGeometry();
            const orbCount = 6;
            const posArray = new Float32Array(orbCount * 3);
            const orbs: Orb[] = [];

            for (let i = 0; i < orbCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 2.5 + Math.random() * 2;
                const elevation = (Math.random() - 0.5) * 2;
                const speed = (Math.random() * 0.2 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
                const inclination = (Math.random() - 0.5) * (Math.PI / 4);

                orbs.push({ angle, speed, radius, elevation, inclination });
                posArray.set([0, 0, 0], i * 3);
            }

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            
            const particlesMaterial = new THREE.PointsMaterial({
                color: color,
                size: 0.25,
                transparent: true,
                depthWrite: false, // Prevents artifacts with SAO
                depthTest: false,
            });

            const particles = new THREE.Points(particlesGeometry, particlesMaterial);
            particles.visible = false;
            parent.add(particles);

            return { points: particles, orbs };
        };

        const sphereInfo: { [key: string]: { name: string, color: number } } = {
            orangeBall: { name: "orangeBall", color: 0xffa500 },
            blueBall: { name: "blueBall", color: 0x0000ff },
            redBall: { name: "redBall", color: 0xff0000 },
            blackBall: { name: "blackBall", color: 0x808080 },
            greenBall: { name: "greenBall", color: 0x00ff00 },
        };
        
        Object.keys(sphereInfo).forEach(key => {
            const info = sphereInfo[key as keyof typeof sphereInfo];
            const sphereObject = model.getObjectByName(info.name);
            if (sphereObject) {
                const orbSystem = createOrbs(info.color, sphereObject);
                orbSystemMap[info.name] = orbSystem;
                orbSystems.push(orbSystem);

                const destination = new THREE.Vector3();
                sphereObject.getWorldPosition(destination);
                waypointsRef.current[info.name] = destination;
            }
        });

        const labelMap: { [key: string]: string } = {
            orangeBall: 'scene.support',
            blueBall: 'scene.register',
            redBall: 'scene.startMeeting',
            blackBall: 'scene.findChurch',
            greenBall: 'scene.aboutUs',
        };

        const sphereColorMap: { [key: string]: THREE.Color } = {
            orangeBall: new THREE.Color(0xffa500),
            blueBall: new THREE.Color(0x0000ff),
            redBall: new THREE.Color(0xff0000),
            blackBall: new THREE.Color(0x404040),
            greenBall: new THREE.Color(0x00ff00),
        };
        
        const onMouseMove = (event: MouseEvent) => {
            if (currentMount) {
                const rect = currentMount.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            }
        };

        const clickHandler = (event: MouseEvent) => {
            onMouseClickRef.current(event);
        };
        
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('click', clickHandler, true);


        const checkIntersections = () => {
            if (isMobile || !cameraRef.current || showContentContainer) return;
            
            const isAtInitialPosition = cameraRef.current.position.distanceTo(initialCameraPosition) < 0.1;
            if (!isAtInitialPosition) {
                 if (hoveredMeshRef.current) {
                    const { mesh, orbSystem } = hoveredMeshRef.current;
                    gsap.to(sphereToParentMapRef.current.get(mesh)?.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
                    if(orbSystem) orbSystem.points.visible = false;
                    setHoveredLabel('');
                    playGrassScanAnimation(true);
                    hoveredMeshRef.current = null;
                 }
                 return;
            }

            raycaster.setFromCamera(mouse, cameraRef.current);
            const intersects = raycaster.intersectObjects(meshesForHoverRef.current, true);

            let currentHoveredName: string | null = null;
            let firstIntersected : THREE.Mesh | null = null;
            let parentObject: THREE.Object3D | null = null;

            if (intersects.length > 0) {
                firstIntersected = intersects[0].object as THREE.Mesh;
                const foundParent = sphereToParentMapRef.current.get(firstIntersected);
                if (foundParent) {
                parentObject = foundParent;
                currentHoveredName = parentObject.name;
                }
            }
            

            if (hoveredMeshRef.current?.name !== currentHoveredName) {
                // HIDE OLD
                if (hoveredMeshRef.current) {
                    const { mesh, orbSystem } = hoveredMeshRef.current;
                    const oldParent = sphereToParentMapRef.current.get(mesh);
                    
                    if(oldParent) gsap.to(oldParent.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
                    
                    const materials = mesh.material;
                    if (Array.isArray(materials)) {
                        materials.forEach(mat => {
                            const anims = materialToAnimationsMapRef.current.get(mat);
                            if (anims) {
                                anims.rough.speed = anims.rough.originalSpeed;
                                anims.normal.speed = anims.normal.originalSpeed;
                            }
                        });
                    } else if (materials) {
                        const anims = materialToAnimationsMapRef.current.get(materials);
                        if (anims) {
                            anims.rough.speed = anims.rough.originalSpeed;
                            anims.normal.speed = anims.normal.originalSpeed;
                        }
                    }

                    playGrassScanAnimation(true);
                    if (orbSystem) {
                        orbSystem.points.visible = false;
                        gsap.to(orbSystem.points.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
                    }
                    setHoveredLabel('');
                }
                
                // SHOW NEW
                if (currentHoveredName && firstIntersected && parentObject) {
                    const orbSystem = orbSystemMap[currentHoveredName] || null;
                    hoveredMeshRef.current = { mesh: firstIntersected, name: currentHoveredName, orbSystem };
                    
                    const labelKey = Object.keys(labelMap).find(k => currentHoveredName!.includes(k));
                    if (labelKey && labelMap[labelKey]) {
                        setHoveredLabel(labelMap[labelKey]);
                    }

                    scanUniformsRef.current.u_scan_color.value.set(0x6EAA43); // Set to green on hover
                    playGrassScanAnimation(false);
                    
                    gsap.to(parentObject.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.3 });
                    const materials = firstIntersected.material;

                    const applyEffects = (mat: THREE.Material) => {
                        const anims = materialToAnimationsMapRef.current.get(mat);
                        if (anims) {
                            anims.rough.speed = anims.rough.originalSpeed * 5;
                            anims.normal.speed = anims.normal.originalSpeed * 5;
                        }
                    };

                    if (Array.isArray(materials)) {
                        materials.forEach(applyEffects);
                    } else if (materials) {
                        applyEffects(materials);
                    }
                    
                    if (orbSystem) {
                        orbSystem.points.visible = true;
                        gsap.to(orbSystem.points.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.3 });
                    }

                } else {
                    hoveredMeshRef.current = null;
                }
            }
        }

        let animationFrameId: number;
        const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        if (!showContentContainer && controlsRef.current?.enabled) {
            checkIntersections();
        }
        
        if (treeMixerRef.current) {
            treeMixerRef.current.update(delta);
        }

        if (grassMixerRef.current) {
            grassMixerRef.current.update(delta);
        }
        
        if(controlsRef.current && controlsRef.current.enabled) {
            controlsRef.current.update();
        }
        
        scanUniformsRef.current.u_time.value = time;

        if (treeLightMaterialRef.current) {
            treeLightMaterialRef.current.emissiveIntensity = 13 + Math.sin(time * 0.5) * 5;
        }

        orbSystems.forEach(system => {
            if (system.points.visible) {
                const positions = system.points.geometry.attributes.position.array as Float32Array;
                system.orbs.forEach((orb, i) => {
                    orb.angle += orb.speed * delta;

                    const x = Math.cos(orb.angle) * orb.radius;
                    const z = Math.sin(orb.angle) * orb.radius;
                    const y = orb.elevation;

                    const cosInclination = Math.cos(orb.inclination);
                    const sinInclination = Math.sin(orb.inclination);
                    const rotated_x = x * cosInclination - z * sinInclination;
                    const rotated_z = x * sinInclination + z * cosInclination;

                    positions[i * 3] = rotated_x;
                    positions[i * 3 + 1] = y;
                    positions[i * 3 + 2] = rotated_z;
                });
                system.points.geometry.attributes.position.needsUpdate = true;
            }
        });

        materialToAnimationsMapRef.current.forEach(({ rough, normal }) => {
            if (rough.material.roughnessMap) {
                rough.material.roughness = rough.intensity;
                rough.material.roughnessMap.offset.x += rough.speed * rough.direction * delta;
            }
            if (normal.material.normalMap) {
                normal.material.normalScale.set(normal.intensity, normal.intensity);
                normal.material.normalMap.offset.x += normal.speed * normal.direction * delta;
            }
        });

        composer.render();
        };
        animate();

        const handleResize = () => {
        if (mountRef.current && cameraRef.current && rendererRef.current && composerRef.current) {
            const { clientWidth, clientHeight } = mountRef.current;
            cameraRef.current.aspect = clientWidth / clientHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(clientWidth, clientHeight);
    composerRef.current.setSize(clientWidth, clientHeight);
            rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
        };
        window.addEventListener('resize', handleResize);

        return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('click', clickHandler, true);
        controls.removeEventListener('start', onControlsStart);
        controls.removeEventListener('end', onControlsEnd);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        cancelAnimationFrame(animationFrameId);
        if (treeMixerRef.current) {
            treeMixerRef.current.stopAllAction();
        }
        if (grassMixerRef.current) {
            grassMixerRef.current.stopAllAction();
        }
        if(controlsRef.current) {
            controlsRef.current.dispose();
        }
        if (currentMount && renderer.domElement) {
            currentMount.removeChild(renderer.domElement);
        }
        renderer.dispose();
        orbSystems.forEach(system => {
            system.points.geometry.dispose();
            (system.points.material as THREE.Material).dispose();
            if(sceneRef.current) {
                sceneRef.current.remove(system.points);
            }
        });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!startIntroAnimation || !hasInteracted || !cameraRef.current || !controlsRef.current) {
            return;
        }

        const controls = controlsRef.current;

        const onAnimationFinish = (event: any) => {
            if (event.action === treeGrowActionRef.current) {
                const shuffledSpheres = gsap.utils.shuffle([...sphereParentObjectsRef.current]);
                gsap.to(shuffledSpheres.map(s => s.scale), {
                    x: 1,
                    y: 1,
                    z: 1,
                    duration: 0.5,
                    ease: 'back.out(1.7)',
                    stagger: {
                        each: 0.1,
                        from: "random"
                    },
                    onComplete: () => {
                        onIntroAnimationComplete();
                    }
                });
                if(treeMixerRef.current) {
                  treeMixerRef.current.removeEventListener('finished', onAnimationFinish);
                }
            }
        };

        if (treeMixerRef.current) {
            treeMixerRef.current.addEventListener('finished', onAnimationFinish);
        }

        if (treeGrowActionRef.current) {
            treeGrowActionRef.current.reset().play();
        }

        const currentTarget = new THREE.Vector3().copy(introCameraTarget);
        
        gsap.to(cameraRef.current.position, {
            x: initialCameraPosition.x,
            y: initialCameraPosition.y,
            z: initialCameraPosition.z,
            duration: 1.5,
            ease: 'power3.inOut',
            onComplete: () => {
              if (controls) {
                controls.saveState();
                controls.enabled = true;
                limitCameraOrbit();
              }
            }
        });
        
        gsap.to(currentTarget, {
            x: initialCameraTarget.x,
            y: initialCameraTarget.y,
            z: initialCameraTarget.z,
            duration: 1.5,
            ease: 'power3.inOut',
            onUpdate: () => {
            if (cameraRef.current && controls) {
                cameraRef.current.lookAt(currentTarget);
                controls.target.copy(currentTarget);
            }
            },
        });
        
    }, [startIntroAnimation, hasInteracted, onIntroAnimationComplete, limitCameraOrbit]);

    useEffect(() => {
        if (viewState === 'zoomed' && controlsRef.current) {
            controlsRef.current.enabled = false;
        } else if (viewState === 'default' && controlsRef.current && hasInteracted) {
             controlsRef.current.enabled = true;
        }
    }, [viewState, hasInteracted]);


  const handleReturn = () => {
    if (cameraRef.current && controlsRef.current) {
        setShowContentContainer(false);
        playGrassScanAnimation(true);
        setViewState('default');
        setZoomedTarget(null);
        
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        
        const currentTarget = controls.target.clone();
        const lookAtTarget = currentTarget.clone();

        gsap.to(camera.position, {
          duration: 1.5,
          x: initialCameraPosition.x,
          y: initialCameraPosition.y,
          z: initialCameraPosition.z,
          ease: 'power3.inOut',
        });

        gsap.to(lookAtTarget, {
          duration: 1.5,
          x: initialCameraTarget.x,
          y: initialCameraTarget.y,
          z: initialCameraTarget.z,
          ease: 'power3.inOut',
          onUpdate: () => {
            camera.lookAt(lookAtTarget);
            controls.target.copy(lookAtTarget);
          },
          onComplete: () => {
            controls.target.copy(initialCameraTarget);
            controls.saveState();
            controls.enabled = true;
            limitCameraOrbit();
          },
        });
    }
  };
  
  const contentMap: { [key: string]: React.ReactNode } = {
    [t('scene.support')]: <DonationContent />,
    [t('scene.register')]: <RegisterHomeChurchContent />,
    [t('scene.startMeeting')]: <StartBibleMeetingContent />,
    [t('scene.findChurch')]: <FindHomeChurchContent />,
    [t('scene.aboutUs')]: <AboutUsContent />,
  };

  const getLabelKey = () => {
    if (!zoomedTarget) return '';
    const key = zoomedTarget.name;
    if (key.includes('orangeBall')) return t('scene.support');
    if (key.includes('blueBall')) return t('scene.register');
    if (key.includes('redBall')) return t('scene.startMeeting');
    if (key.includes('blackBall')) return t('scene.findChurch');
    if (key.includes('greenBall')) return t('scene.aboutUs');
    return '';
  }

  const sphereBorderColorMap: { [key: string]: string } = {
    orangeBall: "border-[#D1A300]",
    blueBall: "border-[#3257C7]",
    redBall: "border-[#990D11]",
    blackBall: "border-[#303030]",
    greenBall: "border-[#2D8D31]",
  };

  const getBorderColorClass = () => {
    if (!zoomedTarget) return "border-border";
    const key = zoomedTarget.name;
    
    const sphereKey = Object.keys(sphereBorderColorMap).find(sphereKey => key.includes(sphereKey));
    return sphereKey ? sphereBorderColorMap[sphereKey] : "border-border";
  };

  const sphereShadowColorMap: { [key: string]: string } = {
    orangeBall: "shadow-glow-orange",
    blueBall: "shadow-glow-blue",
    redBall: "shadow-glow-red",
    blackBall: "shadow-glow-black",
    greenBall: "shadow-glow-green",
  };

  const sphereTintColorMap: { [key: string]: string } = {
    orangeBall: "sepia(1) saturate(5) hue-rotate(330deg)",
    blueBall: "sepia(1) saturate(4) hue-rotate(190deg)",
    redBall: "sepia(1) saturate(6) hue-rotate(320deg)",
    blackBall: "grayscale(1) brightness(0.5)",
    greenBall: "sepia(1) saturate(3) hue-rotate(60deg)",
  };
  
  const getTintColor = () => {
    if (!zoomedTarget) return "";
    const key = zoomedTarget.name;
    const sphereKey = Object.keys(sphereTintColorMap).find(sphereKey => key.includes(sphereKey));
    return sphereKey ? sphereTintColorMap[sphereKey] : "";
  };


  const getShadowColorClass = () => {
    if (!zoomedTarget) return "";
    const key = zoomedTarget.name;
    
    const sphereKey = Object.keys(sphereShadowColorMap).find(sphereKey => key.includes(sphereKey));
    return sphereKey ? sphereShadowColorMap[sphereKey] : "";
  };

  const sphereJumboClassMap: { [key: string]: string } = {
    orangeBall: "jumbo-orange",
    blueBall: "jumbo-blue",
    redBall: "jumbo-red",
    blackBall: "jumbo-black",
    greenBall: "jumbo-green",
  };

  const getJumboClass = () => {
    if (!zoomedTarget) return "";
    const key = zoomedTarget.name;
    const sphereKey = Object.keys(sphereJumboClassMap).find(sphereKey => key.includes(sphereKey));
    return sphereKey ? sphereJumboClassMap[sphereKey] : "";
  };


  return (
    <>
      <div ref={mountRef} className="w-full h-full" />
      <div 
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-opacity duration-300 pointer-events-none ${hoveredLabel ? 'opacity-100' : 'opacity-0'}`}
      >
        <div
          className="text-foreground text-lg font-black font-body tracking-wider px-4 py-2 rounded-lg shadow-md animated-gradient backdrop-blur-[5px]"
          style={{
            '--gradient-light': 'linear-gradient(90deg, rgba(237, 237, 237, 0.17) 0%, rgba(196, 196, 196, 0.13) 48%, rgba(255, 255, 255, 0.28) 100%)',
            '--gradient-dark': 'linear-gradient(90deg,rgba(255, 0, 0, 0.17) 0%, rgba(20, 165, 255, 0.13) 48%, rgba(109, 242, 0, 0.28) 100%)',
            backgroundImage: theme === 'light' ? 'var(--gradient-light)' : 'var(--gradient-dark)'
          } as React.CSSProperties}
        >
          {t(hoveredLabel)}
        </div>
      </div>
      
      <div
        className={`hidden md:block absolute top-[5.75rem] right-10 w-[320px] max-h-[50vh] transition-opacity duration-300 pointer-events-none transform origin-top-right scale-[0.64] ${
          hoveredLabel ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-full h-full bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl overflow-auto">
          {contentMap[t(hoveredLabel) as keyof typeof contentMap]}
        </div>
      </div>

      {showContentContainer && (
        <>
          <div
            className={cn(
              "absolute inset-0 z-10 bg-black/30 backdrop-blur-[10px] pointer-events-auto jumbo-background",
              getJumboClass()
            )}
            onClick={(e) => { e.stopPropagation(); handleReturn(); }}
          />
           <FloatingParticles tintColor={getTintColor()} />
          <div className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[1350px] h-3/4 bg-card/80 backdrop-blur-md rounded-lg pointer-events-auto overflow-auto z-20 border-2", 
              getBorderColorClass(),
              getShadowColorClass()
            )}
            id="content-container">
            <Button 
                onClick={handleReturn}
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-30"
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            {contentMap[getLabelKey() as keyof typeof contentMap]}
          </div>
          <Button 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto z-20"
            onClick={handleReturn}
            variant="outline"
          >
            {t('scene.return')}
          </Button>
        </>
      )}
      <Footer viewState={viewState} show={startIntroAnimation && viewState === 'default'} />
    </>
  );
};

interface AppSceneProps {
    assets: any;
    hasInteracted: boolean;
    startIntroAnimation: boolean;
    onIntroAnimationComplete: () => void;
    setViewState: (state: ViewState) => void;
    viewState: ViewState;
}

const AppScene = ({ assets, hasInteracted, startIntroAnimation, onIntroAnimationComplete, setViewState, viewState }: AppSceneProps) => (
  <Suspense fallback={<div className="w-full h-screen flex items-center justify-center bg-background text-foreground">Loading Scene...</div>}>
    <Scene assets={assets} hasInteracted={hasInteracted} startIntroAnimation={startIntroAnimation} onIntroAnimationComplete={onIntroAnimationComplete} setViewState={setViewState} viewState={viewState} />
  </Suspense>
);

const MemoizedScene = memo(AppScene);
export default MemoizedScene;

    