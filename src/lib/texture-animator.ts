import * as THREE from 'three';

type TextureAnimationOptions = {
  speed?: number;
  offsetXSpeed?: number;
  offsetYSpeed?: number;
  rotationSpeed?: number;
};

export class TextureAnimator {
  private textures: THREE.Texture[];
  private speed: number;
  private offsetXSpeed: number;
  private offsetYSpeed: number;
  private rotationSpeed: number;

  constructor(textures: THREE.Texture[], options: TextureAnimationOptions = {}) {
    this.textures = textures;
    this.textures.forEach(texture => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });

    this.speed = options.speed ?? 1.0;
    this.offsetXSpeed = options.offsetXSpeed ?? 0.1;
    this.offsetYSpeed = options.offsetYSpeed ?? 0.1;
    this.rotationSpeed = options.rotationSpeed ?? 0.1;
  }

  public update(delta: number) {
    const effectiveDelta = delta * this.speed;
    this.textures.forEach(texture => {
      texture.offset.x += this.offsetXSpeed * effectiveDelta;
      texture.offset.y += this.offsetYSpeed * effectiveDelta;
      texture.rotation += this.rotationSpeed * effectiveDelta;
    });
  }
}
