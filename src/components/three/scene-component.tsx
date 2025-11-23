'use client';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LightSettings, DirectionalLightSettings, SceneObject } from '@/lib/types';

interface SceneComponentProps {
  ambientLight: LightSettings;
  directionalLight: DirectionalLightSettings;
  objects: SceneObject[];
}

export default function SceneComponent({
  ambientLight,
  directionalLight,
  objects,
}: SceneComponentProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    ambientLight?: THREE.AmbientLight;
    directionalLight?: THREE.DirectionalLight;
    objectMeshes: Map<number, THREE.Mesh>;
  }>({ objectMeshes: new Map() });

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    const sRef = sceneRef.current;

    // Initialize scene, camera, renderer
    const scene = new THREE.Scene();
    sRef.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    sRef.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);
    sRef.renderer = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 2;
    controls.maxDistance = 50;

    // Add Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.2,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Resize handler
    const handleResize = () => {
      if (currentMount && sRef.renderer && sRef.camera) {
        sRef.renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        sRef.camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        sRef.camera.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      currentMount.removeChild(renderer.domElement);
      renderer.dispose();
      sRef.objectMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });
    };
  }, []);

  // Update ambient light
  useEffect(() => {
    const sRef = sceneRef.current;
    if (!sRef.scene) return;

    if (!sRef.ambientLight) {
      sRef.ambientLight = new THREE.AmbientLight();
      sRef.scene.add(sRef.ambientLight);
    }
    sRef.ambientLight.color.set(ambientLight.color);
    sRef.ambientLight.intensity = ambientLight.intensity;
  }, [ambientLight]);

  // Update directional light
  useEffect(() => {
    const sRef = sceneRef.current;
    if (!sRef.scene) return;

    if (!sRef.directionalLight) {
      sRef.directionalLight = new THREE.DirectionalLight();
      sRef.directionalLight.castShadow = true;
      sRef.directionalLight.shadow.mapSize.width = 1024;
      sRef.directionalLight.shadow.mapSize.height = 1024;
      sRef.scene.add(sRef.directionalLight);
    }
    sRef.directionalLight.color.set(directionalLight.color);
    sRef.directionalLight.intensity = directionalLight.intensity;
    sRef.directionalLight.position.set(
      directionalLight.position.x,
      directionalLight.position.y,
      directionalLight.position.z
    );
  }, [directionalLight]);

  // Update objects
  useEffect(() => {
    const sRef = sceneRef.current;
    if (!sRef.scene) return;

    const currentObjectIds = new Set(objects.map((o) => o.id));

    // Remove old objects
    sRef.objectMeshes.forEach((mesh, id) => {
      if (!currentObjectIds.has(id)) {
        sRef.scene?.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
        sRef.objectMeshes.delete(id);
      }
    });

    // Add/update objects
    objects.forEach((obj) => {
      if (sRef.objectMeshes.has(obj.id)) {
        const mesh = sRef.objectMeshes.get(obj.id)!;
        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
      } else {
        const geometry =
          obj.type === 'cube'
            ? new THREE.BoxGeometry(obj.size.x, obj.size.y, obj.size.z)
            : new THREE.SphereGeometry(obj.size.x / 2, 32, 16);
        const material = new THREE.MeshStandardMaterial({
          color: '#008080', // Teal accent color
          metalness: 0.3,
          roughness: 0.4,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        sRef.scene?.add(mesh);
        sRef.objectMeshes.set(obj.id, mesh);
      }
    });
  }, [objects]);

  return <div ref={mountRef} className="h-full w-full" />;
}
