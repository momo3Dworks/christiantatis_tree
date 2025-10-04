
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { TextureAnimator } from "@/lib/texture-animator";
import TWEEN from '@tweenjs/tween.js';
import { Button } from "@/components/ui/button";

type MaterialRefs = {
  [materialName: string]: THREE.MeshStandardMaterial | null;
};

const INTERACTIVE_MESH_NAMES = ["orangeBall", "blueBall", "redBall", "blackBall", "greenBall"];

// Helper function to get materials from an object
const getMaterials = (object: THREE.Object3D): THREE.MeshStandardMaterial[] => {
    const materials: THREE.MeshStandardMaterial[] = [];
    object.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
                materials.push(...child.material as THREE.MeshStandardMaterial[]);
            } else {
                materials.push(child.material as THREE.MeshStandardMaterial);
            }
        }
    });
    return materials;
};

const GlbSceneViewer = React.memo(function GlbSceneViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const animationFrameId = useRef<number>();
  const isMoving = useRef(false);
  const controlsRef = useRef<OrbitControls>();
  const gltfRef = useRef<GLTF>();
  
  const mixerRef = useRef<THREE.AnimationMixer>();
  const clockRef = useRef(new THREE.Clock());

  const [isFaded, setIsFaded] = useState(false);
  const [showReturnButton, setShowReturnButton] = useState(false);
  const fadeOverlayOpacity = useRef({ value: 0 }).current;
  const initialCameraPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const initialControlsTarget = useRef<THREE.Vector3>(new THREE.Vector3());

  const [hoveredObject, setHoveredObject] = useState<THREE.Object3D | null>(null);
  const previouslyHoveredObject = useRef<THREE.Object3D | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const textureAnimatorsRef = useRef<TextureAnimator[]>([]);

  const materialRefs = useRef<MaterialRefs>({});
  const sphereMeshesRef = useRef<THREE.Mesh[]>([]);
  const initialEmissionIntensityRef = useRef<Map<THREE.Material, number>>(new Map());

    // =================================================================
  // CONTROLES DE MATERIALES (Modificar aquí los valores)
  // =================================================================
  
  // SKY_SPHERE & TREE_LIGHT
  const [skySphere_emissionColor, setSkySphere_emissionColor] = useState("#ffffff");
  const [skySphere_emissionIntensity, setSkySphere_emissionIntensity] = useState(0.0);
  const [skySphere_color, setSkySphere_color] = useState("#dcdcdc");
  const [skySphere_roughness, setSkySphere_roughness] = useState(1);
  const [skySphere_metalness, setSkySphere_metalness] = useState(0);

  const [treeLight_emissionColor, setTreeLight_emissionColor] = useState("#ffffff");
  const [treeLight_emissionIntensity, setTreeLight_emissionIntensity] = useState(2);
  const [treeLight_color, setTreeLight_color] = useState("#ffffff");
  const [treeLight_roughness, setTreeLight_roughness] = useState(1);
  const [treeLight_metalness, setTreeLight_metalness] = useState(0);

  const [barkCrhistiantatis_emissionIntensity, setBarkCrhistiantatis_emissionIntensity] = useState(1);
  
  // orangeBall
  const [fireTexIntensity, setFireTexIntensity] = useState(0.3);
  const [fireTex2Intensity, setFireTex2Intensity] = useState(5);
  const [orangeBall_color, setOrangeBall_color] = useState("#ffffff");
  const [orangeBall_opacity, setOrangeBall_opacity] = useState(1);


  // blueBall
  const [blueTextIntensity, setBlueTextIntensity] = useState(0.8);
  const [blueText2Intensity, setBlueText2Intensity] = useState(5);
  const [ballBall_color, setBallBall_color] = useState("#ffffff");
  const [ballBall_opacity, setBallBall_opacity] = useState(1);

  // redBall
  const [redText01Intensity, setRedText01Intensity] = useState(2);
  const [redText02Intensity, setRedText02Intensity] = useState(3);
  const [redBallGlass_color, setRedBallGlass_color] = useState("#ffffff");
  const [redBallGlass_opacity, setRedBallGlass_opacity] = useState(1);

  // blackBall
  const [blackText01Intensity, setBlackText01Intensity] = useState(0.3);
  const [blackText02Intensity, setBlackText02Intensity] = useState(3);
  const [blackBallGlass_color, setBlackBallGlass_color] = useState("#ffffff");
  const [blackBallGlass_opacity, setBlackBallGlass_opacity] = useState(1);

  // greenBall
  const [greenText01Intensity, setGreenText01Intensity] = useState(0.3);
  const [greenText02Intensity, setGreenText02Intensity] = useState(3);
  const [GreenBallGlass_color, setGreenBallGlass_color] = useState("#ffffff");
  const [GreenBallGlass_opacity, setGreenBallGlass_opacity] = useState(1);
  // =================================================================

  const { toast } = useToast();

  const emissionIntensityConfig: { [key: string]: number } = {
    FireTex: fireTexIntensity,
    FireTex2: fireTex2Intensity,
    BlueText: blueTextIntensity,
    BlueText2: blueText2Intensity,
    RedText01: redText01Intensity,
    RedText02: redText02Intensity,
    BlackText01: blackText01Intensity,
    BlackText02: blackText02Intensity,
    GreenText01: greenText01Intensity,
    GreenText02: greenText02Intensity,
    BarkCrhistiantatis: barkCrhistiantatis_emissionIntensity,
  };

  useEffect(() => {
    Object.entries(emissionIntensityConfig).forEach(([matName, intensity]) => {
      const material = materialRefs.current[matName];
      if (material) {
        material.emissiveIntensity = intensity;
      }
    });
  }, [
      fireTexIntensity, fireTex2Intensity, blueTextIntensity, blueText2Intensity,
      redText01Intensity, redText02Intensity, blackText01Intensity, blackText02Intensity,
      greenText01Intensity, greenText02Intensity, barkCrhistiantatis_emissionIntensity
  ]);

  useEffect(() => {
      const skyMaterial = materialRefs.current['SKY_SPHERE'];
      if(skyMaterial) {
        skyMaterial.emissive.set(skySphere_emissionColor);
        skyMaterial.emissiveIntensity = skySphere_emissionIntensity;
        skyMaterial.color.set(skySphere_color);
        skyMaterial.roughness = skySphere_roughness;
        skyMaterial.metalness = skySphere_metalness;
      }
      const treeMaterial = materialRefs.current['TREE_LIGHT'];
      if(treeMaterial) {
        treeMaterial.emissive.set(treeLight_emissionColor);
        treeMaterial.emissiveIntensity = treeLight_emissionIntensity;
        treeMaterial.color.set(treeLight_color);
        treeMaterial.roughness = treeLight_roughness;
        treeMaterial.metalness = treeLight_metalness;
      }
  }, [
    skySphere_emissionColor, skySphere_emissionIntensity, skySphere_color, skySphere_roughness, skySphere_metalness,
    treeLight_emissionColor, treeLight_emissionIntensity, treeLight_color, treeLight_roughness, treeLight_metalness,
  ]);

  useEffect(() => {
    const updateMaterial = (
      name: string,
      color: string,
      opacity: number
    ) => {
      const material = materialRefs.current[name];
      if (material) {
        material.color.set(color);
        material.opacity = opacity;
      }
    };
    updateMaterial('orangeBall', orangeBall_color, orangeBall_opacity);
    updateMaterial('ballBall', ballBall_color, ballBall_opacity);
    updateMaterial('RedBallGlass', redBallGlass_color, redBallGlass_opacity);
    updateMaterial('BlackBallGlass', blackBallGlass_color, blackBallGlass_opacity);
    updateMaterial('GreenBallGlass', GreenBallGlass_color, GreenBallGlass_opacity);
  }, [
    orangeBall_color,
    orangeBall_opacity,
    ballBall_color,
    ballBall_opacity,
    redBallGlass_color,
    redBallGlass_opacity,
    blackBallGlass_color,
    blackBallGlass_opacity,
    GreenBallGlass_color,
    GreenBallGlass_opacity,
  ]);


  useEffect(() => {
    if (previouslyHoveredObject.current && previouslyHoveredObject.current !== hoveredObject) {
        new TWEEN.Tween(previouslyHoveredObject.current.scale)
            .to({ x: 1, y: 1, z: 1 }, 500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        const materials = getMaterials(previouslyHoveredObject.current);
        materials.forEach(material => {
            if (material.emissiveMap) {
                const initialIntensity = initialEmissionIntensityRef.current.get(material) || 0;
                new TWEEN.Tween(material)
                    .to({ emissiveIntensity: initialIntensity }, 500)
                    .easing(TWEEN.Easing.Cubic.InOut)
                    .start();
            }
        });
    }

    if (hoveredObject && INTERACTIVE_MESH_NAMES.includes(hoveredObject.name)) {
        new TWEEN.Tween(hoveredObject.scale)
            .to({ x: 1.3, y: 1.3, z: 1.3 }, 500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        const materials = getMaterials(hoveredObject);
        materials.forEach(material => {
            if (material.emissiveMap) {
                if (!initialEmissionIntensityRef.current.has(material)) {
                    initialEmissionIntensityRef.current.set(material, material.emissiveIntensity);
                }
                new TWEEN.Tween(material)
                    .to({ emissiveIntensity: material.emissiveIntensity * 5 }, 500)
                    .easing(TWEEN.Easing.Cubic.InOut)
                    .start();
            }
        });
    }

    previouslyHoveredObject.current = hoveredObject;
}, [hoveredObject]);


  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--background').trim());

    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 150);
    initialCameraPosition.current.copy(camera.position);


    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.autoUpdate = true;
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xdcdcdc, 1);
    directionalLight.position.set(0, 15, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.001; 
    scene.add(directionalLight);
    
    let composer: EffectComposer;
    let saoPass: SAOPass;

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);
    
    loader.load('/models/CHRISTIANTATIS_TREE.glb', 
    (gltf) => {
      gltfRef.current = gltf;
      const newModel = gltf.scene;
      const sphereMaterials = ['orangeBall', 'ballBall', 'RedBallGlass', 'BlackBallGlass', 'GreenBallGlass'];

      newModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (INTERACTIVE_MESH_NAMES.some(name => child.name.includes(name))) {
                sphereMeshesRef.current.push(child);
                child.scale.set(0, 0, 0); // Set initial scale to 0
            }

            child.castShadow = true;
            child.receiveShadow = true;

            if (child.name === 'christiantatis_tree') {
              directionalLight.target = child;
              directionalLight.target.updateMatrixWorld();
            }

            const processMaterial = (mat: THREE.Material) => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                    if (mat.name && !materialRefs.current[mat.name]) {
                        materialRefs.current[mat.name] = mat;
                    }

                    if (sphereMaterials.includes(mat.name)) {
                      mat.transparent = true;
                    }

                    if (emissionIntensityConfig[mat.name] !== undefined) {
                        mat.emissiveIntensity = emissionIntensityConfig[mat.name];
                    }

                    if (mat.name === 'SKY_SPHERE') {
                      mat.emissive.set(skySphere_emissionColor);
                      mat.emissiveIntensity = skySphere_emissionIntensity;
                      mat.color.set(skySphere_color);
                      mat.roughness = skySphere_roughness;
                      mat.metalness = skySphere_metalness;
                    }
                    if (mat.name === 'TREE_LIGHT') {
                      mat.emissive.set(treeLight_emissionColor);
                      mat.emissiveIntensity = treeLight_emissionIntensity;
                      mat.color.set(treeLight_color);
                      mat.roughness = treeLight_roughness;
                      mat.metalness = treeLight_metalness;
                    }

                    const texturesToAnimate: THREE.Texture[] = [];
                    const textureMaps = ['map', 'emissiveMap', 'roughnessMap', 'metalnessMap', 'normalMap', 'aoMap', 'displacementMap'];
                    
                    textureMaps.forEach(mapKey => {
                        const map = mapKey as keyof THREE.MeshStandardMaterial;
                        const texture = mat[map] as THREE.Texture | null;
                        if (texture) {
                            texturesToAnimate.push(texture);
                        }
                    });

                    if (mat.alphaMap) {
                        texturesToAnimate.push(mat.alphaMap);
                        mat.transparent = true;
                        mat.depthWrite = false;
                    }
                    
                    const isSphereMaterial = INTERACTIVE_MESH_NAMES.some(name => child.name.includes(name));

                    if (texturesToAnimate.length > 0 && (isSphereMaterial || mat.name.toLowerCase().includes('tex') || mat.name.toLowerCase().includes('text'))) {
                         const animator = new TextureAnimator(texturesToAnimate, { offsetXSpeed: 0.5, offsetYSpeed: 0.0, rotationSpeed: 0.2 });
                         textureAnimatorsRef.current.push(animator);
                    }
                }
            };
            
            if (Array.isArray(child.material)) {
                child.material.forEach(processMaterial);
            } else if (child.material) {
                processMaterial(child.material);
            }
        }
      });
      
      Object.entries(emissionIntensityConfig).forEach(([matName, intensity]) => {
        const material = materialRefs.current[matName];
        if (material) {
          material.emissiveIntensity = intensity;
        }
      });
      
      const skyMaterial = materialRefs.current['SKY_SPHERE'];
      if (skyMaterial) {
        skyMaterial.emissive.set(skySphere_emissionColor);
        skyMaterial.emissiveIntensity = skySphere_emissionIntensity;
        skyMaterial.color.set(skySphere_color);
        skyMaterial.roughness = skySphere_roughness;
        skyMaterial.metalness = skySphere_metalness;
      }
      const treeMaterial = materialRefs.current['TREE_LIGHT'];
      if (treeMaterial) {
        treeMaterial.emissive.set(treeLight_emissionColor);
        treeMaterial.emissiveIntensity = treeLight_emissionIntensity;
        treeMaterial.color.set(treeLight_color);
        treeMaterial.roughness = treeLight_roughness;
        treeMaterial.metalness = treeLight_metalness;
      }
      
      newModel.position.set(0, -2, 40);
      newModel.rotation.set(6, 0, 0);
      newModel.scale.set(0.5, 0.5, 0.5);

      scene.add(newModel);

      if (gltf.animations && gltf.animations.length) {
        mixerRef.current = new THREE.AnimationMixer(newModel);
        
        const clipsToPlay = gltf.animations.filter(clip => clip.name.includes('treeGrow'));
        const actions: THREE.AnimationAction[] = [];

        clipsToPlay.forEach(clip => {
            const action = mixerRef.current!.clipAction(clip);
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            actions.push(action);
        });

        const onFinished = () => {
          // Animate spheres appearing
          sphereMeshesRef.current.forEach((sphere, index) => {
            new TWEEN.Tween(sphere.scale)
              .to({ x: 1, y: 1, z: 1 }, 1500)
              .easing(TWEEN.Easing.Elastic.Out)
              .delay(index * 200) // Stagger the animation
              .start();
          });
        };

        mixerRef.current.addEventListener('finished', onFinished);
        
        setTimeout(() => {
          actions.forEach(action => action.play());
        }, 1000);

      }
      
      controlsRef.current = new OrbitControls(camera, renderer.domElement);
      const controls = controlsRef.current;
      initialControlsTarget.current.copy(controls.target);

      controls.enabled = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 15;
      controls.maxDistance = 50;
      controls.maxPolarAngle = Math.PI;

      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      saoPass = new SAOPass(scene, camera, false, true);
      saoPass.params.saoIntensity = 0.0005;
      saoPass.params.saoBias = 0.008;
      saoPass.params.saoScale = 0.07;
      saoPass.params.saoKernelRadius = 10;
      composer.addPass(saoPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(currentMount.clientWidth, currentMount.clientHeight),
        2,
        3,
        15.0
      );
      composer.addPass(bloomPass);
      
      controls.addEventListener('start', () => {
        isMoving.current = true;
      });
      controls.addEventListener('end', () => {
        isMoving.current = false;
      });
      
      toast({
        title: "Modelo Cargado",
        description: "El modelo del árbol ha sido cargado.",
      });

    },
    (xhr) => {
        const progress = (xhr.loaded / xhr.total) * 100;
        setLoadingProgress(progress);
    },
    (error) => {
      console.error('An error happened while loading the model:', error);
      toast({
          variant: "destructive",
          title: "Error de Carga",
          description: "No se pudo cargar el modelo GLB.",
      });
      controlsRef.current = new OrbitControls(camera, renderer.domElement);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (event: MouseEvent) => {
        if (!currentMount || !camera) return;
        const rect = currentMount.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObjects(scene.children, true);

        let foundMesh: THREE.Object3D | null = null;
        if (intersects.length > 0) {
            let intersect = intersects[0].object;
            
            // Traverse up to find the main sphere group if intersected a child mesh
            let parent = intersect;
            while(parent.parent && !INTERACTIVE_MESH_NAMES.includes(parent.name)) {
                parent = parent.parent;
            }

            if (INTERACTIVE_MESH_NAMES.includes(parent.name)) {
              foundMesh = parent;
            }
        }
        
        setHoveredObject(foundMesh);
    };
    window.addEventListener('pointermove', onPointerMove);

    const onPointerDown = (event: MouseEvent) => {
      if (isFaded || !camera) return;
      if (!currentMount || !camera) return;
      const rect = currentMount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
          let intersect = intersects[0].object;
          
          let parent = intersect;
          while(parent.parent && !INTERACTIVE_MESH_NAMES.includes(parent.name)) {
              parent = parent.parent;
          }

          if (INTERACTIVE_MESH_NAMES.includes(parent.name)) {
            console.log("Clicked on:", parent.name);
            const targetPosition = new THREE.Vector3();
            parent.getWorldPosition(targetPosition);
            
            let yOffset = 0;
            if (parent.name === 'orangeBall') yOffset = 0.3;

            setIsFaded(true);

            const finalTargetPosition = new THREE.Vector3(targetPosition.x, targetPosition.y + yOffset, targetPosition.z - 2);

            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            
            const windUpPosition = camera.position.clone().add(cameraDirection.multiplyScalar(-3));

            const windupTween = new TWEEN.Tween(camera.position)
              .to(windUpPosition, 400)
              .easing(TWEEN.Easing.Cubic.Out);

            const zoomTween = new TWEEN.Tween(camera.position)
              .to(finalTargetPosition, 1500)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onComplete(() => {
                setShowReturnButton(true);
              });
            
            windupTween.chain(zoomTween).start();

            new TWEEN.Tween(fadeOverlayOpacity)
              .to({ value: 1 }, 1900) // 400ms + 1500ms
              .easing(TWEEN.Easing.Cubic.InOut)
              .start();

          
          }
      }
    };
    window.addEventListener('pointerdown', onPointerDown);


    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();

      TWEEN.update();

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      textureAnimatorsRef.current.forEach(animator => animator.update(delta));

      if (controlsRef.current) controlsRef.current.update();
      
      if (saoPass) {
        const targetIntensity = isMoving.current ? 0 : 0.0001;
        saoPass.params.saoIntensity = THREE.MathUtils.lerp(
          saoPass.params.saoIntensity,
          targetIntensity,
          0.1
        );
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    const handleResize = () => {
      if (!currentMount || !camera || !renderer) return;
      const { clientWidth, clientHeight } = currentMount;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      if (composer) {
        composer.setSize(clientWidth, clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (controlsRef.current) {
        const controls = controlsRef.current;
        controls.removeEventListener('start', () => {});
        controls.removeEventListener('end', () => {});
        controls.dispose();
      }
      if(mixerRef.current) {
        mixerRef.current.removeEventListener('finished', () => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleReturnClick = () => {
    setShowReturnButton(false);

    new TWEEN.Tween(fadeOverlayOpacity)
      .to({ value: 0 }, 1500)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => {
        setIsFaded(false);
      })
      .start();

      if (controlsRef.current) {
        new TWEEN.Tween(controlsRef.current.object.position)
            .to(initialCameraPosition.current, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        new TWEEN.Tween(controlsRef.current.target)
            .to(initialControlsTarget.current, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();
    }
  }

  return (
    <div ref={mountRef} className="w-full h-full cursor-default relative">
      {loadingProgress > 0 && loadingProgress < 100 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="w-1/4">
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-center mt-2 text-sm text-foreground">Loading model...</p>
          </div>
        </div>
      )}
      {isFaded && (
        <div 
          className="absolute inset-0 bg-gray-800/70 backdrop-blur-[5px] z-30"
          style={{ opacity: fadeOverlayOpacity.value }}
        />
      )}
      {showReturnButton && (
          <div className="absolute inset-0 flex items-center justify-center z-40">
            <Button 
                onClick={handleReturnClick}
                className="ReturnButton bg-sidebar text-sidebar-foreground hover:bg-sidebar/90"
            >
                Return
            </Button>
        </div>
      )}
    </div>
  );
});

export default GlbSceneViewer;
