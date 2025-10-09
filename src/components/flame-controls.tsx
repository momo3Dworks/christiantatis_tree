
"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type FlameControlsProps = {
  controls: {
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
  };
  setControls: (controls: any) => void;
  initialControls: {
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
  };
};

export default function FlameControls({ controls, setControls, initialControls }: FlameControlsProps) {
  const handleReset = () => {
    setControls(initialControls);
  };

  return (
    <div className="absolute top-24 left-4 z-10 w-64 rounded-lg border bg-card/80 p-4 text-card-foreground shadow-lg backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Flame Shader Controls</h3>
        <Button variant="ghost" size="icon" onClick={handleReset} title="Reset Controls">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="scale">Scale</Label>
          <Slider
            id="scale"
            min={0.1}
            max={20}
            step={0.1}
            value={[controls.scale]}
            onValueChange={([value]) => setControls((prev: any) => ({ ...prev, scale: value }))}
          />
          <span className="text-sm text-muted-foreground">{controls.scale.toFixed(2)}</span>
        </div>
        <div className="space-y-3">
          <Label htmlFor="offsetX">Offset X</Label>
          <Slider
            id="offsetX"
            min={-5}
            max={5}
            step={0.1}
            value={[controls.offsetX]}
            onValueChange={([value]) => setControls((prev: any) => ({ ...prev, offsetX: value }))}
          />
           <span className="text-sm text-muted-foreground">{controls.offsetX.toFixed(2)}</span>
        </div>
        <div className="space-y-3">
          <Label htmlFor="offsetY">Offset Y</Label>
          <Slider
            id="offsetY"
            min={-5}
            max={5}
            step={0.1}
            value={[controls.offsetY]}
            onValueChange={([value]) => setControls((prev: any) => ({ ...prev, offsetY: value }))}
          />
           <span className="text-sm text-muted-foreground">{controls.offsetY.toFixed(2)}</span>
        </div>
        <div className="space-y-3">
          <Label htmlFor="rotation">Rotation</Label>
          <Slider
            id="rotation"
            min={0}
            max={360}
            step={1}
            value={[controls.rotation]}
            onValueChange={([value]) => setControls((prev: any) => ({ ...prev, rotation: value }))}
          />
           <span className="text-sm text-muted-foreground">{controls.rotation.toFixed(0)}°</span>
        </div>
      </div>
    </div>
  );
}
