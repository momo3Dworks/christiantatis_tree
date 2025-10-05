
"use client";

import { useEffect, useRef, useState, memo } from 'react';
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

  const hoveredGroupRef = useRef<{meshes: THREE.Mesh[], materials: THREE.Material[], name: string, orbSystem: OrbSystem | null } | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);


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

    // Post-processing - Bloom
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(currentMount.clientWidth, currentMount.clientHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 10;
    bloomPass.strength = 0.8;
    bloomPass.radius = 0.55;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // GLTF Loader with DRACO
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    
    const spheresForHover: THREE.Object3D[] = [];
    
    const animatedMaterials: { [key: string]: THREE.MeshStandardMaterial } = {};
    const targetMaterialNames = ["FireTex", "BlueText", "RedText01", "BlackText01", "GreenText01"];
    const targetMaterialNamesTwo = ["orangeBall", "blueBall", "RedBallGlass", "BlackBallGlass", "GreenBallGlass"];
    const allTargetMaterials = [...targetMaterialNames, ...targetMaterialNamesTwo];
    const sphereGroups: { [key: string]: THREE.Mesh[] } = {
        orange: [],
        blue: [],
        red: [],
        black: [],
        green: [],
      };
  
      const sphereNameMapping: { [key: string]: string } = {
        FireTex: 'orange',
        orangeBall: 'orange',
        BlueText: 'blue',
        blueBall: 'blue',
        RedText01: 'red',
        RedBallGlass: 'red',
        BlackText01: 'black',
        BlackBallGlass: 'black',
        GreenText01: 'green',
        GreenBallGlass: 'green',
      };
      
      const animationSpeeds: {[key: string]: number} = {
        FireTex: 1,
        BlueText: 1,
        RedText01: 1,
        BlackText01: 1,
        GreenText01: 1,
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
        
        const sphereNameKeys = ["orangeBall_2", "blueBall_2", "redBall_2", "blackBall_2", "greenBall_2"];
        
        sphereNameKeys.forEach(name => {
            const sphere = model.getObjectByName(name);
            if (sphere) {
                spheresForHover.push(sphere);
            }
        });
        
        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshStandardMaterial;
              if (material && sphereNameMapping[material.name]) {
                const sphereColor = sphereNameMapping[material.name];
                sphereGroups[sphereColor].push(child);
              }
      
              if (material && allTargetMaterials.includes(material.name)) {
                if (!animatedMaterials[material.name]) {
                    animatedMaterials[material.name] = material;
                }
                if (material.map) {
                  material.map.wrapS = THREE.RepeatWrapping;
                  material.map.wrapT = THREE.RepeatWrapping;
                }
              }
            }
          });

        if (animatedMaterials["FireTex"]) animatedMaterials["FireTex"].emissiveIntensity = 0.1;
        if (animatedMaterials["BlueText"]) animatedMaterials["BlueText"].emissiveIntensity = 0.1;
        if (animatedMaterials["RedText01"]) animatedMaterials["RedText01"].emissiveIntensity = 0.1;
        if (animatedMaterials["BlackText01"]) animatedMaterials["BlackText01"].emissiveIntensity = 0.1;
        if (animatedMaterials["GreenText01"]) animatedMaterials["GreenText01"].emissiveIntensity = 0.1;

        Object.values(sphereGroups).forEach(group => {
            group.forEach(mesh => {
                mesh.scale.set(0, 0, 0);
            });
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
            
            const particlesMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(color) },
                },
                vertexShader: `
                    attribute float size;
                    void main() {
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = 100.0 * (1.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    void main() {
                        float d = distance(gl_PointCoord, vec2(0.5, 0.5));
                        if (d > 0.5) {
                            discard;
                        }
                        float alpha = 1.0 - smoothstep(0.4, 0.5, d);
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
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
            orange: { name: "orangeBall_2", color: 0xffa500 },
            blue: { name: "blueBall_2", color: 0x0000ff },
            red: { name: "redBall_2", color: 0xff0000 },
            black: { name: "blackBall_2", color: 0x808080 },
            green: { name: "greenBall_2", color: 0x00ff00 },
        };

        Object.keys(sphereInfo).forEach(key => {
            const info = sphereInfo[key];
            const sphereObject = model.getObjectByName(info.name);
            if (sphereObject) {
                const orbSystem = createOrbs(info.color, sphereObject);
                orbSystems.push(orbSystem);
                orbSystemMap[info.name] = orbSystem;
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

        // Start scaling animation after load
        const orderedSphereGroups = [
            sphereGroups.orange,
            sphereGroups.blue,
            sphereGroups.red,
            sphereGroups.black,
            sphereGroups.green
        ];

        let delay = 0;
        const animationDuration = 500; // ms
        const delayIncrement = 200; // ms

        orderedSphereGroups.forEach((group) => {
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

    const groupMap: { [key: string]: THREE.Mesh[] } = {
        orangeBall_2: sphereGroups.orange,
        blueBall_2: sphereGroups.blue,
        redBall_2: sphereGroups.red,
        blackBall_2: sphereGroups.black,
        greenBall_2: sphereGroups.green,
    };

    const groupMaterialMap: { [key: string]: string } = {
        orangeBall_2: 'FireTex',
        blueBall_2: 'BlueText',
        redBall_2: 'RedText01',
        blackBall_2: 'BlackText01',
        greenBall_2: 'GreenText01',
    };
    
    const labelMap: { [key: string]: string } = {
        orangeBall_2: 'scene.support',
        blueBall_2: 'scene.register',
        redBall_2: 'scene.startMeeting',
        blackBall_2: 'scene.findChurch',
        greenBall_2: 'scene.aboutUs',
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
        const intersects = raycaster.intersectObjects(spheresForHover, true);

        if (intersects.length > 0) {
            const firstIntersected = intersects[0].object;
            let parent: THREE.Object3D | null = firstIntersected;
            while(parent && !groupMap[parent.name]) {
                parent = parent.parent;
            }
            if (parent) {
                setZoomedTarget(parent);
                setViewState('zoomed');
            }
        }
    }
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);


    const checkIntersections = () => {
      if (!cameraRef.current) return;
      if(viewState !== 'default') {
          if (hoveredGroupRef.current) {
            hoveredGroupRef.current = null;
          }
          setHoveredLabel('');
          return;
      }
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(spheresForHover, true);

      let currentHoveredGroup: {meshes: THREE.Mesh[], materials: (THREE.Material | THREE.Material[])[], name: string, orbSystem: OrbSystem | null } | null = null;
      if (intersects.length > 0) {
        const firstIntersected = intersects[0].object;
        let parent: THREE.Object3D | null = firstIntersected;
        while(parent && !groupMap[parent.name]) {
            parent = parent.parent;
        }
        if (parent && groupMap[parent.name]) {
          const meshes = groupMap[parent.name];
          const materials = meshes.map(mesh => mesh.material);
          const orbSystem = orbSystemMap[parent.name] || null;
          currentHoveredGroup = {meshes, materials: materials.flat(), name: parent.name, orbSystem };
        }
      }

      if (hoveredGroupRef.current?.name !== currentHoveredGroup?.name) {
        // De-hover previous group
        if (hoveredGroupRef.current) {
          const prevGroupName = hoveredGroupRef.current.name;
          const prevMaterialName = groupMaterialMap[prevGroupName];
          if (prevMaterialName) {
            animationSpeeds[prevMaterialName] = 1;
          }
          if (hoveredGroupRef.current.orbSystem) {
            hoveredGroupRef.current.orbSystem.points.visible = false;
            gsap.to(hoveredGroupRef.current.orbSystem.points.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
          }
          setHoveredLabel('');

          hoveredGroupRef.current.meshes.forEach(mesh => {
            gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
          });
          hoveredGroupRef.current.materials.forEach(mat => {
              const material = mat as THREE.MeshStandardMaterial;
              if (originalIntensities.has(material)) {
                gsap.to(material, { emissiveIntensity: originalIntensities.get(material), duration: 0.3 });
              }
          });
        }
        
        // Hover new group
        hoveredGroupRef.current = currentHoveredGroup as {meshes: THREE.Mesh[], materials: THREE.Material[], name: string, orbSystem: OrbSystem | null};
        if (hoveredGroupRef.current) {
            const currentGroupName = hoveredGroupRef.current.name;
            const currentMaterialName = groupMaterialMap[currentGroupName];
            if (currentMaterialName) {
                animationSpeeds[currentMaterialName] = 2;
            }
            if (labelMap[currentGroupName]) {
                setHoveredLabel(labelMap[currentGroupName]);
            }
            if (hoveredGroupRef.current.orbSystem) {
                hoveredGroupRef.current.orbSystem.points.visible = true;
                gsap.to(hoveredGroupRef.current.orbSystem.points.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.3 });
            }

          hoveredGroupRef.current.meshes.forEach(mesh => {
            gsap.to(mesh.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.3 });
          });
          hoveredGroupRef.current.materials.forEach(mat => {
            const material = mat as THREE.MeshStandardMaterial;
            if (!originalIntensities.has(material)) {
                originalIntensities.set(material, material.emissiveIntensity);
            }
            gsap.to(material, { emissiveIntensity: (originalIntensities.get(material) ?? 0.1) * 26, duration: 0.3 });
        });
        }
      }
    }


    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      checkIntersections();
      
      if (mixer) {
        mixer.update(delta);
      }
      
      if (animatedMaterials["FireTex"]?.map) {
        animatedMaterials["FireTex"].map.offset.x += 0.001 * animationSpeeds.FireTex;
        animatedMaterials["FireTex"].map.offset.y -= 0.002 * animationSpeeds.FireTex;
        animatedMaterials["FireTex"].map.rotation += 0.0005 * animationSpeeds.FireTex;
      }

      if (animatedMaterials["BlueText"]?.map) {
        animatedMaterials["BlueText"].map.offset.x -= 0.001 * animationSpeeds.BlueText;
        animatedMaterials["BlueText"].map.offset.y += 0.002 * animationSpeeds.BlueText;
        animatedMaterials["BlueText"].map.rotation -= 0.0005 * animationSpeeds.BlueText;
      }

      if (animatedMaterials["RedText01"]?.map) {
        animatedMaterials["RedText01"].map.offset.x += 0.002 * animationSpeeds.RedText01;
        animatedMaterials["RedText01"].map.offset.y += 0.001 * animationSpeeds.RedText01;
        animatedMaterials["RedText01"].map.rotation += 0.0006 * animationSpeeds.RedText01;
      }

      if (animatedMaterials["BlackText01"]?.map) {
        animatedMaterials["BlackText01"].map.offset.x -= 0.002 * animationSpeeds.BlackText01;
        animatedMaterials["BlackText01"].map.offset.y -= 0.001 * animationSpeeds.BlackText01;
        animatedMaterials["BlackText01"].map.rotation -= 0.0006 * animationSpeeds.BlackText01;
      }

      if (animatedMaterials["GreenText01"]?.map) {
        animatedMaterials["GreenText01"].map.offset.x += 0.0015 * animationSpeeds.GreenText01;
        animatedMaterials["GreenText01"].map.offset.y -= 0.0015 * animationSpeeds.GreenText01;
        animatedMaterials["GreenText01"].map.rotation += 0.0007 * animationSpeeds.GreenText01;
      }
      
      orbSystems.forEach(system => {
        if (system.points.visible) {
            const positions = system.points.geometry.attributes.position.array as Float32Array;
            system.orbs.forEach((orb, i) => {
                orb.angle += orb.speed * delta;

                const x = Math.cos(orb.angle) * orb.radius;
                const z = Math.sin(orb.angle) * orb.radius;
                const y = orb.elevation;

                // Apply inclination
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

    // Handle window resize
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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onMouseClick);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      composer.dispose();
      orbSystems.forEach(system => {
        system.points.geometry.dispose();
        (system.points.material as THREE.Material).dispose();
        if(sceneRef.current) {
            sceneRef.current.remove(system.points);
        }
    });
    };
  }, []);

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (viewState === 'zoomed' && zoomedTarget) {
        const targetPosition = new THREE.Vector3();
        zoomedTarget.getWorldPosition(targetPosition);
        
        const direction = new THREE.Vector3().subVectors(camera.position, targetPosition).normalize();
        const distance = -4; 
        const newCameraPosition = new THREE.Vector3().addVectors(targetPosition, direction.multiplyScalar(distance));

        gsap.to(camera.position, {
            x: newCameraPosition.x,
            y: newCameraPosition.y,
            z: newCameraPosition.z,
            duration: 1,
            ease: 'power3.inOut',
            onComplete: () => {
              setShowContentContainer(true);
            }
        });

    } else if (viewState === 'default') {
        setShowContentContainer(false);
        gsap.to(camera.position, {
            x: initialCameraPosition.x,
            y: initialCameraPosition.y,
            z: initialCameraPosition.z,
            duration: 1,
            ease: 'power3.inOut',
            onUpdate: () => {
                camera.lookAt(initialCameraTarget);
            }
        });
    }
  }, [viewState, zoomedTarget]);

  const handleReturn = () => {
    setZoomedTarget(null);
    setViewState('default');
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
    if (key === 'orangeBall_2') return t('scene.support');
    if (key === 'blueBall_2') return t('scene.register');
    if (key === 'redBall_2') return t('scene.startMeeting');
    if (key === 'blackBall_2') return t('scene.findChurch');
    if (key === 'greenBall_2') return t('scene.aboutUs');
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

export default memo(Scene);

    