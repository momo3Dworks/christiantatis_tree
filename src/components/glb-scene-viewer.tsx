"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { TextureAnimator } from "@/lib/texture-animator";

type AnimatingSphere = {
  mesh: THREE.Mesh;
  startTime: number;
  delay: number;
  duration: number;
};

export default function GlbSceneViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const animationFrameId = useRef<number>();
  const isMoving = useRef(false);
  
  const skySphereMaterialRef = useRef<THREE.MeshStandardMaterial>();
  const treeLightMaterialRef = useRef<THREE.MeshStandardMaterial>();
  
  const mixerRef = useRef<THREE.AnimationMixer>();
  const clockRef = useRef(new THREE.Clock());

  const [hoveredObject, setHoveredObject] = useState<THREE.Object3D | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const animatingSpheresRef = useRef<AnimatingSphere[]>([]);
  const allSpheresRef = useRef<THREE.Mesh[]>([]);
  const textureAnimatorsRef = useRef<TextureAnimator[]>([]);

  const blueBallMaterialsRef = useRef<{blueText1: THREE.MeshStandardMaterial | null, blueText2: THREE.MeshStandardMaterial | null}>({blueText1: null, blueText2: null});
  const redBallRemeshedMaterialsRef = useRef<{fireText1: THREE.MeshStandardMaterial | null, fireText2: THREE.MeshStandardMaterial | null}>({fireText1: null, fireText2: null});


  // =================================================================
  // CONTROLES DE EMISIÓN (Modificar aquí los valores)
  // =================================================================
  const [skySphereEmissionColor, setSkySphereEmissionColor] = useState("#ffffff");
  const [skySphereEmissionIntensity, setSkySphereEmissionIntensity] = useState(10);
  const [treeLightEmissionColor, setTreeLightEmissionColor] = useState("#ff0000");
  const [treeLightEmissionIntensity, setTreeLightEmissionIntensity] = useState(10);
  
  // Intensidades para redBall Remeshed (FireTex)
  const [fireText1Intensity, setFireText1Intensity] = useState(10);
  const [fireText2Intensity, setFireText2Intensity] = useState(10);

  // Intensidades para blueBall (BlueText)
  const [blueText1Intensity, setBlueText1Intensity] = useState(10);
  const [blueText2Intensity, setBlueText2Intensity] = useState(10);
  // =================================================================

  const { toast } = useToast();

  useEffect(() => {
    if (skySphereMaterialRef.current) {
      skySphereMaterialRef.current.emissive.set(skySphereEmissionColor);
      skySphereMaterialRef.current.emissiveIntensity = skySphereEmissionIntensity;
    }
    if (treeLightMaterialRef.current) {
      treeLightMaterialRef.current.emissive.set(treeLightEmissionColor);
      treeLightMaterialRef.current.emissiveIntensity = treeLightEmissionIntensity;
    }
  }, [skySphereEmissionColor, skySphereEmissionIntensity, treeLightEmissionColor, treeLightEmissionIntensity]);


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

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.autoUpdate = false; 
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xdcdcdc, 0.3);
    directionalLight.position.set(0, 15, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.001; 
    scene.add(directionalLight);
    
    let controls: OrbitControls;
    let composer: EffectComposer;
    let saoPass: SAOPass;

    const loader = new GLTFLoader();
    loader.load('/models/CHRISTIANTATIS_TREE.glb', 
    (gltf) => {
      const newModel = gltf.scene;

      const sphereNames = ["redBall_Remeshed_1", "blueBall_3", "redBall_1", "blackBall_1", "greenBall_1"];

      newModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Almacenar esferas y poner su escala a 0
            if (sphereNames.includes(child.name)) {
                allSpheresRef.current.push(child);
                child.scale.set(0, 0, 0);
            }
            
            if(child.name === "SKY_SPHERE" && Array.isArray(child.material)) {
                const skySphereMat = child.material.find(m => m.name === "SKY_SPHERE");
                const treeLightMat = child.material.find(m => m.name === "TREE_LIGHT");
                if (skySphereMat && skySphereMat instanceof THREE.MeshStandardMaterial) {
                    skySphereMaterialRef.current = skySphereMat;
                }
                if (treeLightMat && treeLightMat instanceof THREE.MeshStandardMaterial) {
                    treeLightMaterialRef.current = treeLightMat;
                }
            }

            if (child.name === 'christiantatis_tree') {
              directionalLight.target = child;
              directionalLight.target.updateMatrixWorld();
            }

            // Configuración de materiales emisivos para redBall Remeshed y blueBall
            const applyEmissiveSettings = (mat: THREE.Material) => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                    let animator: TextureAnimator | null = null;
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

                    if (texturesToAnimate.length > 0) {
                        if (mat.name === "FireTex") {
                            mat.emissiveIntensity = fireText1Intensity;
                            redBallRemeshedMaterialsRef.current.fireText1 = mat;
                            animator = new TextureAnimator(texturesToAnimate, { offsetXSpeed: 0.5, offsetYSpeed: 0.0, rotationSpeed: 0.2 });
                        } else if (mat.name === "FireTex2") {
                            mat.emissiveIntensity = fireText2Intensity;
                            redBallRemeshedMaterialsRef.current.fireText2 = mat;
                            animator = new TextureAnimator(texturesToAnimate, { offsetXSpeed: 0.6, offsetYSpeed: 0.0, rotationSpeed: 0.1 });
                        } else if (mat.name === "BlueText") {
                            mat.emissiveIntensity = blueText1Intensity;
                            blueBallMaterialsRef.current.blueText1 = mat;
                            animator = new TextureAnimator(texturesToAnimate, { offsetXSpeed: 0.5, offsetYSpeed: 0.0, rotationSpeed: 0.2 });
                        } else if (mat.name === "BlueText2") {
                            mat.emissiveIntensity = blueText2Intensity;
                            blueBallMaterialsRef.current.blueText2 = mat;
                            animator = new TextureAnimator(texturesToAnimate, { offsetXSpeed: 0.6, offsetYSpeed: 0.0, rotationSpeed: 0.1 });
                        }
                    }

                    if (animator) {
                        textureAnimatorsRef.current.push(animator);
                    }
                }
            };
            
            if (Array.isArray(child.material)) {
                child.material.forEach(applyEmissiveSettings);
            } else if (child.material) {
                applyEmissiveSettings(child.material);
            }
        }
      });
      
      if (skySphereMaterialRef.current) {
        skySphereMaterialRef.current.emissive.set(skySphereEmissionColor);
        skySphereMaterialRef.current.emissiveIntensity = skySphereEmissionIntensity;
      }
      if (treeLightMaterialRef.current) {
        treeLightMaterialRef.current.emissive.set(treeLightEmissionColor);
        treeLightMaterialRef.current.emissiveIntensity = treeLightEmissionIntensity;
      }

      // Set model transform in code
      newModel.position.set(0, -2, 40);
      newModel.rotation.set(6, 0, 0);
      newModel.scale.set(0.5, 0.5, 0.5);

      scene.add(newModel);

      // Handle animations
      if (gltf.animations && gltf.animations.length) {
        mixerRef.current = new THREE.AnimationMixer(newModel);
        
        const animationMap: { [key: string]: string } = {
          'treeGrow': 'christiantatis_tree',
          'OrangeBall': 'redBall_Remeshed_1',
          'BlueBall': 'blueBall_3',
          'RedBall': 'redBall_1',
          'BlackBall': 'blackBall_1',
          'GreenBall': 'greenBall_1',
        };
        const clipsToPlay = gltf.animations.filter(clip => Object.keys(animationMap).some(name => clip.name.includes(name)));
        const actions: THREE.AnimationAction[] = [];

        clipsToPlay.forEach(clip => {
            const action = mixerRef.current!.clipAction(clip);
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            actions.push(action);
        });

        const treeGrowAction = actions.find(action => action.getClip().name.includes('treeGrow'));

        if (treeGrowAction) {
          mixerRef.current.addEventListener('finished', (e) => {
            if (e.action === treeGrowAction) {
              if (rendererRef.current) {
                rendererRef.current.shadowMap.needsUpdate = true;
              }
               // Iniciar animación de escalado de esferas
               const currentTime = clockRef.current.getElapsedTime();
               allSpheresRef.current.forEach(sphereMesh => {
                   animatingSpheresRef.current.push({
                       mesh: sphereMesh,
                       startTime: currentTime,
                       delay: Math.random() * 2, // Delay aleatorio hasta 2 segundos
                       duration: 1 + Math.random() * 1.5 // Duración aleatoria entre 1 y 2.5 segundos
                   });
               });
            }
          });
        }
        
        setTimeout(() => {
          actions.forEach(action => action.play());
        }, 1000);

      } else {
        // If there's no animation, bake shadows right away.
        if (rendererRef.current) {
          rendererRef.current.shadowMap.needsUpdate = true;
        }
      }
      
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enabled = false; // Bloquear la cámara
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 15;
      controls.maxDistance = 50;
      controls.maxPolarAngle = Math.PI;

      // Post-processing
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(currentMount.clientWidth, currentMount.clientHeight),
        0.2, // strength
        0.3, // radius
        10.0 // threshold
      );
      composer.addPass(bloomPass);

      saoPass = new SAOPass(scene, camera, false, true);
      saoPass.params.saoIntensity = 0.00005;
      saoPass.params.saoBias = 0.003;
      saoPass.params.saoScale = 0.1;
      saoPass.params.saoKernelRadius = 10;
      composer.addPass(saoPass);
      
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
      controls = new OrbitControls(camera, renderer.domElement);
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
            const ignoreNames = ["christiantatis_tree", "GROUND", "SKY_SPHERE"];
            
            if (!ignoreNames.includes(intersect.name)) {
                console.log("Intersected object:", intersect.name);
            }

            // Traverse up to find the main interactive mesh
            const interactiveNames = ["redBall_Remeshed_1", "blueBall_3", "blackBall_1"];
            while(intersect.parent && !interactiveNames.includes(intersect.name)) {
                intersect = intersect.parent;
            }
            if (interactiveNames.includes(intersect.name)) {
              foundMesh = intersect;
            }
        }
        
        setHoveredObject(foundMesh);
    };
    window.addEventListener('pointermove', onPointerMove);


    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const elapsedTime = clockRef.current.getElapsedTime();

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Actualizar animadores de textura
      textureAnimatorsRef.current.forEach(animator => animator.update(delta));

      // Animación de escalado de esferas
      animatingSpheresRef.current.forEach(sphere => {
        const timeSinceStart = elapsedTime - sphere.startTime;
        if (timeSinceStart > sphere.delay) {
            const animationProgress = Math.min((timeSinceStart - sphere.delay) / sphere.duration, 1);
            const scale = THREE.MathUtils.lerp(0, 1, animationProgress);
            sphere.mesh.scale.set(scale, scale, scale);
        }
      });

      if (controls) controls.update();
      
      // Animation for hovered objects
      const redBallMesh = allSpheresRef.current.find(m => m.name === "redBall_Remeshed_1");
      const blueBallMesh = allSpheresRef.current.find(m => m.name === "blueBall_3");
      const blackBallMesh = allSpheresRef.current.find(m => m.name === "blackBall_1");

      const handleHoverAnimation = (mesh: THREE.Mesh | undefined, isHovered: boolean, scaleFactor = 1.1) => {
        if (!mesh) return;
        const isGrowing = animatingSpheresRef.current.some(s => s.mesh === mesh && s.mesh.scale.x < 1);
        
        const targetScale = isHovered ? scaleFactor : 1.0;
        
        if (!isGrowing) {
            mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }

        if (isHovered) {
          mesh.rotation.y += 0.02;
        }
      }

      handleHoverAnimation(redBallMesh, hoveredObject === redBallMesh);
      handleHoverAnimation(blueBallMesh, hoveredObject === blueBallMesh);
      handleHoverAnimation(blackBallMesh, hoveredObject === blackBallMesh, 1.3);

      // Emission intensity for blueBall hover
      if (blueBallMaterialsRef.current.blueText1 && blueBallMaterialsRef.current.blueText2) {
          const isBlueHovered = hoveredObject === blueBallMesh;
          const targetIntensity1 = isBlueHovered ? blueText1Intensity * 1.3 : blueText1Intensity;
          const targetIntensity2 = isBlueHovered ? blueText2Intensity * 1.3 : blueText2Intensity;

          blueBallMaterialsRef.current.blueText1.emissiveIntensity = THREE.MathUtils.lerp(blueBallMaterialsRef.current.blueText1.emissiveIntensity, targetIntensity1, 0.1);
          blueBallMaterialsRef.current.blueText2.emissiveIntensity = THREE.MathUtils.lerp(blueBallMaterialsRef.current.blueText2.emissiveIntensity, targetIntensity2, 0.1);
      }
      
      // Emission intensity for redBall Remeshed hover
      if (redBallRemeshedMaterialsRef.current.fireText1 && redBallRemeshedMaterialsRef.current.fireText2) {
          const isRedHovered = hoveredObject === redBallMesh;
          const targetIntensity1 = isRedHovered ? fireText1Intensity * 1.3 : fireText1Intensity;
          const targetIntensity2 = isRedHovered ? fireText2Intensity * 1.3 : fireText2Intensity;

          redBallRemeshedMaterialsRef.current.fireText1.emissiveIntensity = THREE.MathUtils.lerp(redBallRemeshedMaterialsRef.current.fireText1.emissiveIntensity, targetIntensity1, 0.1);
          redBallRemeshedMaterialsRef.current.fireText2.emissiveIntensity = THREE.MathUtils.lerp(redBallRemeshedMaterialsRef.current.fireText2.emissiveIntensity, targetIntensity2, 0.1);
      }


      if (saoPass) {
        const targetIntensity = isMoving.current ? 0 : 0.00005;
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
      if (composer) {
        composer.setSize(clientWidth, clientHeight);
      }
      // Re-bake shadows on resize if needed, as aspect ratio changes
      if (rendererRef.current) {
        rendererRef.current.shadowMap.needsUpdate = true;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('pointermove', onPointerMove);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (controls) {
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
  
  return (
    <div ref={mountRef} className="w-full h-full cursor-default relative">
      {loadingProgress > 0 && loadingProgress < 100 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="w-1/4">
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-center mt-2 text-sm text-foreground">Loading model...</p>
          </div>
        </div>
      )}
    </div>
  );
}
