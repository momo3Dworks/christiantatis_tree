
import * as THREE from 'three';
import { SSGIEffect, SSGIOptions, MotionBlurEffect } from 'realism-effects';
import { EffectComposer, EffectPass, ToneMappingEffect } from 'postprocessing';

export default class SSGIEffectComponent {
  private composer: EffectComposer;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private ssgiEffect: SSGIEffect;

  constructor(composer: EffectComposer, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = composer;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    const options: Partial<SSGIOptions> = {
        distance: 10,
        thickness: 5,
        intensity: 2,
        maxRoughness: 0.8,
        denoiseIterations: 3,
        denoiseKernel: 2,
        denoiseDiffuse: 25,
        denoiseSpecular: 25.5,
        radius: 11,
        phi: 0,
        lumaPhi: 20.62,
        depthPhi: 23.37,
        normalPhi: 26.32,
        roughnessPhi: 18.48,
        specularPhi: 7.0,
        envBlur: 0,
    };
    
    this.ssgiEffect = new SSGIEffect(this.scene, this.camera, options);
  }

  public init() {
    const motionBlurEffect = new MotionBlurEffect(this.ssgiEffect);
    const toneMappingEffect = new ToneMappingEffect();
    const effectPass = new EffectPass(this.camera, this.ssgiEffect, motionBlurEffect, toneMappingEffect);
    this.composer.addPass(effectPass);
  }

  public getEffect() {
    return this.ssgiEffect;
  }
}
