export type LightSettings = {
  intensity: number;
  color: string;
};

export type DirectionalLightSettings = LightSettings & {
  position: { x: number; y: number; z: number };
};

export type SceneObject = {
  id: number;
  type: 'cube' | 'sphere';
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
};
