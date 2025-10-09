
"use client";

import { useEffect, useRef, useState, memo, Suspense } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { Button } from './ui/button';
import DonationContent from './content/donation-content';
import RegisterHomeChurchContent from './content/register-home-church-content';
import StartBibleMeetingContent from './content/start-bible-meeting-content';
import FindHomeChurchContent from './content/find-home-church-content';
import AboutUsContent from './content/about-us-content';
import { useTranslation } from '@/hooks/useTranslation';
import { useSearchParams } from 'next/navigation';

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

const initialCameraPosition = new THREE.Vector3(0, 4, 24);
const initialCameraTarget = new THREE.Vector3(0, 11, 0);

const Scene = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('default');
  const [showContentContainer, setShowContentContainer] = useState(false);
  const [zoomedTarget, setZoomedTarget] = useState<THREE.Object3D | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState('');
  const [theme, setTheme] = useState('light');


  const hoveredMeshRef = useRef<{mesh: THREE.Mesh, name: string, orbSystem: OrbSystem | null } | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const sparkMaterialsRef = useRef<{ [key: string]: THREE.MeshStandardMaterial }>({});
  const waypointsRef = useRef<{ [key: string]: THREE.Vector3 }>({});
  const sphereToSparkMap: { [key: string]: string } = {
    orangeBall: 'Spark_1',
    blueBall: 'Spark_2',
    redBall: 'Spark_3',
    blackBall: 'Spark_4',
    greenBall: 'Spark_5',
  };
  const searchParams = useSearchParams();


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const clock = new THREE.Clock();
    let mixer: THREE.AnimationMixer;

    // Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.copy(initialCameraPosition);
    camera.lookAt(initialCameraTarget);
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
    renderer.toneMappingExposure = 1;
    currentMount.appendChild(renderer.domElement);

    // Post-processing
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 6.5;
    bloomPass.strength = 1.5;
    bloomPass.radius = 0.4;
    
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Video Texture Setup
    const video = document.createElement('video');
    video.src = '/assets/SparkVideo.mp4';
    video.muted = true;
    video.loop = false; 
    video.playsInline = true;
    
    const onCanPlay = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                video.pause();
            }).catch(e => {
                console.error("Pre-play failed:", e);
            });
        }
        video.removeEventListener('canplay', onCanPlay);
    };

    video.addEventListener('canplay', onCanPlay);
    video.load(); 

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    video.onended = () => {
      Object.values(sparkMaterialsRef.current).forEach(mat => {
        mat.visible = false;
      });
    };
    
    // GLTF Loader with DRACO
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    
    const meshesForHover: THREE.Mesh[] = [];
    const sphereScaleMap: { [key: string]: THREE.Mesh[] } = {
      orange: [], blue: [], red: [], black: [], green: []
    };
    
    const orbSystems: OrbSystem[] = [];
    const orbSystemMap: { [key: string]: OrbSystem } = {};
      
    loader.load(
      '/models/CHRISTIANTATIS_TREE.glb',
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;
        scene.add(model);
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        
        const sphereNameKeys = [
          "orangeBall",
          "blueBall",
          "redBall",
          "blackBall",
          "greenBall",
        ];

        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const material = child.material as THREE.MeshStandardMaterial;
                const isSparkMesh = material && Object.values(sphereToSparkMap).some(name => material.name === name);

                if (isSparkMesh) {
                    sparkMaterialsRef.current[material.name] = material;
                    material.map = videoTexture;
                    material.emissiveMap = videoTexture;
                    material.alphaMap = videoTexture;

                    if (material.name === 'Spark_2' || material.name === 'Spark_3') {
                        material.emissiveIntensity = 25;
                    } else {
                        material.emissiveIntensity = 8;
                    }
                    
                    material.transparent = true;
                    material.visible = false;
                } else {
                    const parentObject = child.parent;
                    const parentName = parentObject ? parentObject.name : '';
                    if (sphereNameKeys.includes(parentName)) {
                        meshesForHover.push(child);
                        const groupKey = parentName.replace('Ball', '');
                        if (sphereScaleMap[groupKey]) {
                            sphereScaleMap[groupKey].push(child);
                        }
                    }
                }
            }
        });


        const createOrbs = (color: number, parent: THREE.Object3D): OrbSystem => {
            const particlesGeometry = new THREE.BufferGeometry();
            const orbCount = 6;
            const posArray = new Float32Array(orbCount * 3);
            const orbs: Orb[] = [];

            for (let i = 0; i < orbCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 2.5 + Math.random() * 1;
                const elevation = (Math.random() - 0.5) * 2;
                const speed = (Math.random() * 0.2 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
                const inclination = (Math.random() - 0.5) * (Math.PI / 4);

                orbs.push({ angle, speed, radius, elevation, inclination });
                posArray.set([0, 0, 0], i * 3);
            }

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            
            const particlesMaterial = new THREE.PointsMaterial({
                color: color,
                size: 0.2,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false,
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
        
        mixer = new THREE.AnimationMixer(model);
        const animations = gltf.animations;

        if (animations && animations.length) {
          setTimeout(() => {
            animations.forEach((clip) => {
              const action = mixer.clipAction(clip);
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = true;
              action.play();
            });
          }, 600);
        }
        
        setLoading(false);

        const orderedSphereGroups = [
            sphereScaleMap.orange,
            sphereScaleMap.blue,
            sphereScaleMap.red,
            sphereScaleMap.black,
            sphereScaleMap.green
        ];

        let delay = 0;
        const animationDuration = 500;
        const delayIncrement = 200; 

        orderedSphereGroups.forEach((group) => {
             if(group) {
                setTimeout(() => {
                    const startTime = Date.now();
                    const animateScale = () => {
                        const elapsedTime = Date.now() - startTime;
                        const progress = Math.min(elapsedTime / animationDuration, 1);
                        const currentScale = progress;

                        group.forEach(mesh => {
                            mesh.scale.set(currentScale, currentScale, currentScale);
                        });

                        if (progress < 1) {
                            requestAnimationFrame(animateScale);
                        }
                    };
                    requestAnimationFrame(animateScale);
                }, delay);
                delay += delayIncrement;
            }
        });

      },
      (xhr) => {
        const newProgress = (xhr.loaded / xhr.total) * 100;
        setProgress(newProgress);
      },
      (error) => {
        console.error('An error happened during loading:', error);
        setLoading(false);
      }
    );
    
    const labelMap: { [key: string]: string } = {
        orangeBall: 'scene.support',
        blueBall: 'scene.register',
        redBall: 'scene.startMeeting',
        blackBall: 'scene.findChurch',
        greenBall: 'scene.aboutUs',
    };

    const originalIntensities: WeakMap<THREE.Material, number> = new WeakMap();

    const onMouseMove = (event: MouseEvent) => {
      if (currentMount) {
        const rect = currentMount.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };
    
    const onMouseClick = (event: MouseEvent) => {
        if (viewState !== 'default' || !cameraRef.current) return;

        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(meshesForHover, true);

        if (intersects.length > 0) {
            const firstIntersected = intersects[0].object as THREE.Mesh;
            const parent = firstIntersected.parent;
            
            if (parent) {
                setZoomedTarget(parent);
                setViewState('zoomed');

                const sparkMaterialName = sphereToSparkMap[parent.name as keyof typeof sphereToSparkMap];
                const sparkMaterial = sparkMaterialsRef.current[sparkMaterialName];

                if (sparkMaterial && cameraRef.current) {
                    sparkMaterial.visible = true;
                    video.currentTime = 0;
                    
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => console.error("Video play failed:", e));
                    }
                    
                    const waypoint = waypointsRef.current[parent.name];
                    if (waypoint) {
                       gsap.to(cameraRef.current.position, {
                          x: waypoint.x,
                          y: waypoint.y,
                          z: waypoint.z - 12,
                          duration: 2.1,
                          delay: 0.5,
                          ease: 'power3.inOut',
                          onComplete: () => {
                            setShowContentContainer(true);
                          }
                       });
                    }
                }
            }
        }
    }
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);


    const checkIntersections = () => {
      if (!cameraRef.current) return;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(meshesForHover, true);

      let currentHoveredName: string | null = null;
      let firstIntersected : THREE.Mesh | null = null;
      let parentObject: THREE.Object3D | null = null;

      if (intersects.length > 0) {
        firstIntersected = intersects[0].object as THREE.Mesh;
        parentObject = firstIntersected.parent;

        if (parentObject) {
          currentHoveredName = parentObject.name;
        }
      }

      if (hoveredMeshRef.current?.name !== currentHoveredName) {
        if (hoveredMeshRef.current) {
          const { mesh, orbSystem } = hoveredMeshRef.current;
          
          if(mesh.parent) gsap.to(mesh.parent.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
          
          const materials = mesh.material;
            if (Array.isArray(materials)) {
                materials.forEach(mat => {
                    if (originalIntensities.has(mat)) {
                        gsap.to(mat, { emissiveIntensity: originalIntensities.get(mat), duration: 0.3 });
                    }
                });
            } else if (materials) {
                if (originalIntensities.has(materials)) {
                    gsap.to(materials, { emissiveIntensity: originalIntensities.get(materials), duration: 0.3 });
                }
            }


          if (orbSystem) {
            orbSystem.points.visible = false;
            gsap.to(orbSystem.points.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
          }
          setHoveredLabel('');
        }
        
        if (currentHoveredName && firstIntersected && parentObject) {
            const orbSystem = orbSystemMap[currentHoveredName] || null;
            hoveredMeshRef.current = { mesh: firstIntersected, name: currentHoveredName, orbSystem };
            
            const labelKey = Object.keys(labelMap).find(k => currentHoveredName!.includes(k));
            if (labelKey && labelMap[labelKey]) {
                setHoveredLabel(labelMap[labelKey]);
            }
            
            gsap.to(parentObject.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.3 });
            const materials = firstIntersected.material;

            const applyIntensity = (mat: THREE.Material) => {
              if (!originalIntensities.has(mat)) {
                  originalIntensities.set(mat, (mat as THREE.MeshStandardMaterial).emissiveIntensity || 0.1);
              }
              gsap.to(mat, { emissiveIntensity: (originalIntensities.get(mat) ?? 0.1) * 26, duration: 0.3 });
            };

            if (Array.isArray(materials)) {
              materials.forEach(applyIntensity);
            } else if (materials) {
              applyIntensity(materials);
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

      if (viewState === 'default') {
        checkIntersections();
      }
      
      if (mixer) {
        mixer.update(delta);
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

      composer.render();
    };
    animate();

    const handleResize = () => {
      if (mountRef.current && cameraRef.current) {
        const { clientWidth, clientHeight } = mountRef.current;
        cameraRef.current.aspect = clientWidth / clientHeight;
        cameraRef.current.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
        composer.setSize(clientWidth, clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onMouseClick);
      cancelAnimationFrame(animationFrameId);
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
  }, []);


  const handleReturn = () => {
    if (cameraRef.current) {
        setShowContentContainer(false);
        gsap.to(cameraRef.current.position, {
            x: initialCameraPosition.x,
            y: initialCameraPosition.y,
            z: initialCameraPosition.z,
            duration: 1.5,
            ease: 'power3.inOut',
            onComplete: () => {
                setViewState('default');
                setZoomedTarget(null);
                if (cameraRef.current) {
                    cameraRef.current.lookAt(initialCameraTarget);
                }
            }
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

  return (
    <>
      {loading && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white z-20">
          <div className="w-1/2">
            <div className="h-[1px] w-full bg-gray-200">
              <div className="h-full bg-black transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
      <div ref={mountRef} className="w-full h-full" />
      <div 
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-opacity duration-300 pointer-events-none ${hoveredLabel ? 'opacity-100' : 'opacity-0'}`}
      >
        <div
          className="text-black text-lg font-black font-body tracking-wider px-4 py-2 rounded-lg shadow-md animated-gradient backdrop-blur-[5px]"
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

      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${showContentContainer ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[1350px] h-3/4 bg-card/80 backdrop-blur-md rounded-lg pointer-events-auto p-8 overflow-auto" id="content-container">
            {contentMap[getLabelKey() as keyof typeof contentMap]}
          </div>
          <Button 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto"
            onClick={handleReturn}
            variant="outline"
          >
            {t('scene.return')}
          </Button>
      </div>
    </>
  );
};

const SceneWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Scene />
  </Suspense>
);

const MemoizedScene = memo(SceneWrapper);
export default MemoizedScene;

    

    


