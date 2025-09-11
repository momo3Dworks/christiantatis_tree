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
  const redBallMaterialRef = useRef<THREE.MeshStandardMaterial>();
  
  const mixerRef = useRef<THREE.AnimationMixer>();
  const clockRef = useRef(new THREE.Clock());

  const [hoveredObject, setHoveredObject] = useState<THREE.Object3D | null>(null);

  // Esferas para la animación de escalado
  const animatingSpheresRef = useRef<AnimatingSphere[]>([]);
  const allSpheresRef = useRef<THREE.Mesh[]>([]);

  // =================================================================
  // CONTROLES DE EMISIÓN (Modificar aquí los valores)
  // =================================================================
  const [skySphereEmissionColor, setSkySphereEmissionColor] = useState("#ffffff");
  const [skySphereEmissionIntensity, setSkySphereEmissionIntensity] = useState(10);
  const [treeLightEmissionColor, setTreeLightEmissionColor] = useState("#ff0000");
  const [treeLightEmissionIntensity, setTreeLightEmissionIntensity] = useState(10);
  const [redBallEmissionIntensity, setRedBallEmissionIntensity] = useState(50);
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
    if (redBallMaterialRef.current) {
      redBallMaterialRef.current.emissiveIntensity = redBallEmissionIntensity;
    }
  }, [skySphereEmissionColor, skySphereEmissionIntensity, treeLightEmissionColor, treeLightEmissionIntensity, redBallEmissionIntensity]);


  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--background').trim());

    let camera: THREE.PerspectiveCamera;

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
    directionalLight.position.set(5, 10, -25);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.001; 
    scene.add(directionalLight);
    
    let controls: OrbitControls;
    let composer: EffectComposer;
    let saoPass: SAOPass;

    const loader = new GLTFLoader();
    loader.load('/models/CHRISTIANTATIS_TREE.glb', (gltf) => {
      const newModel = gltf.scene;

      const sphereNames = ["redBall Remeshed", "blueBall", "redBall", "blackBall", "greenBall"];

      newModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Almacenar esferas y poner su escala a 0
            if (sphereNames.includes(child.name)) {
                allSpheresRef.current.push(child);
                child.scale.set(0, 0, 0);
            }
            
            if (child.name === "redBall Remeshed") {
              if (child.material instanceof THREE.MeshStandardMaterial) {
                redBallMaterialRef.current = child.material;
                if (child.material.emissiveMap) {
                  child.material.emissive = new THREE.Color(0xffffff);
                } else {
                  child.material.emissiveMap = child.material.map;
                }
              }
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
      if (redBallMaterialRef.current) {
        redBallMaterialRef.current.emissiveIntensity = redBallEmissionIntensity;
      }

      // Set model transform in code
      newModel.position.set(0, -2, 0);
      newModel.rotation.set(0, 0, 0);
      newModel.scale.set(0.5, 0.5, 0.5);

      scene.add(newModel);

      // Handle animations
      if (gltf.animations && gltf.animations.length) {
        mixerRef.current = new THREE.AnimationMixer(newModel);
        const treeGrowClip = THREE.AnimationClip.findByName(gltf.animations, 'treeGrow');
        if (treeGrowClip) {
          const treeGrowAction = mixerRef.current.clipAction(treeGrowClip);
          treeGrowAction.setLoop(THREE.LoopOnce, 1);
          treeGrowAction.clampWhenFinished = true;
          
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

          setTimeout(() => {
            treeGrowAction.play();
          }, 1000);
        }
      } else {
        // If there's no animation, bake shadows right away.
        if (rendererRef.current) {
          rendererRef.current.shadowMap.needsUpdate = true;
        }
      }

      let glbCamera: THREE.PerspectiveCamera | undefined;
      gltf.cameras.forEach((cam) => {
        if (cam instanceof THREE.PerspectiveCamera) {
          if (!glbCamera) {
             glbCamera = cam;
          }
        }
      });

      if (glbCamera) {
        camera = glbCamera;
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        toast({
          title: "Cámara del modelo cargada",
          description: "Usando la cámara encontrada en el archivo GLB.",
        });
      } else {
        camera = new THREE.PerspectiveCamera(
          75,
          currentMount.clientWidth / currentMount.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 8, 25);
      }
      
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 1;
      controls.maxDistance = 500;
      controls.maxPolarAngle = Math.PI;

      // Post-processing
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(currentMount.clientWidth, currentMount.clientHeight),
        0.4, // strength
        0.3, // radius
        1.0 // threshold
      );
      composer.addPass(bloomPass);

      saoPass = new SAOPass(scene, camera, false, true);
      saoPass.params.saoIntensity = 0.00001;
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

    }, undefined, (error) => {
      console.error('An error happened while loading the model:', error);
      toast({
          variant: "destructive",
          title: "Error de Carga",
          description: "No se pudo cargar el modelo GLB.",
      });
      camera = new THREE.PerspectiveCamera( 75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      camera.position.z = 5;
      controls = new OrbitControls(camera, renderer.domElement);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (event: MouseEvent) => {
        if (!currentMount) return;
        const rect = currentMount.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener('pointermove', onPointerMove);


    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const elapsedTime = clockRef.current.getElapsedTime();

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

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

      // Raycasting for hover
      const redBallMesh = allSpheresRef.current.find(m => m.name === "redBall Remeshed");
      if (camera && redBallMesh) {
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);
          const found = intersects.find(intersect => intersect.object === redBallMesh || (intersect.object.parent && intersect.object.parent === redBallMesh));

          if (found) {
              setHoveredObject(redBallMesh);
          } else {
              setHoveredObject(null);
          }
      }
      
      // Animation for hovered object
      if (redBallMesh) {
        const targetScale = hoveredObject === redBallMesh ? 1.1 : 1;
        // Solo aplicar lerp si la animación de aparición ha terminado
        const isAnimating = animatingSpheresRef.current.some(s => s.mesh === redBallMesh && s.mesh.scale.x < 1);
        if (!isAnimating) {
          redBallMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }

        if(hoveredObject === redBallMesh) {
          redBallMesh.rotation.y += 0.02;
        }
      }


      if (saoPass) {
        const targetIntensity = isMoving.current ? 0 : 0.00001;
        saoPass.params.saoIntensity = THREE.MathUtils.lerp(
          saoPass.params.saoIntensity,
          targetIntensity,
          0.1
        );
      }

      if (composer) {
        composer.render();
      } else if (camera) {
        renderer.render(scene, camera);
      }
    };
    animate();

    const handleResize = () => {
      const { clientWidth, clientHeight } = currentMount;
      if (camera) {
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
      }
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
    <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
  );
}
    