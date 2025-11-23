'use client';

import type React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Box, Globe, Lightbulb, Plus, Sun, Trash2 } from 'lucide-react';
import type { LightSettings, DirectionalLightSettings, SceneObject } from '@/lib/types';

interface ControlsPanelProps {
  ambientLight: LightSettings;
  setAmbientLight: React.Dispatch<React.SetStateAction<LightSettings>>;
  directionalLight: DirectionalLightSettings;
  setDirectionalLight: React.Dispatch<React.SetStateAction<DirectionalLightSettings>>;
  addObject: (type: 'cube' | 'sphere', position: { x: number; y: number; z: number }) => void;
  removeObject: (id: number) => void;
  objects: SceneObject[];
}

const objectSchema = z.object({
  type: z.enum(['cube', 'sphere']),
  x: z.coerce.number().min(-10).max(10),
  y: z.coerce.number().min(0).max(10),
  z: z.coerce.number().min(-10).max(10),
});

export default function ControlsPanel({
  ambientLight,
  setAmbientLight,
  directionalLight,
  setDirectionalLight,
  addObject,
  removeObject,
  objects,
}: ControlsPanelProps) {
  const form = useForm<z.infer<typeof objectSchema>>({
    resolver: zodResolver(objectSchema),
    defaultValues: {
      type: 'cube',
      x: 0,
      y: 0.5,
      z: 0,
    },
  });

  function onSubmit(values: z.infer<typeof objectSchema>) {
    addObject(values.type, { x: values.x, y: values.y, z: values.z });
  }

  return (
    <aside className="w-full shrink-0 border-b border-border bg-card lg:h-full lg:w-96 lg:border-b-0 lg:border-r">
      <ScrollArea className="h-full w-full">
        <div className="flex h-full flex-col p-4">
          <div className="p-2">
            <h1 className="text-xl font-bold">ThreeJS Scene Generator</h1>
            <p className="text-sm text-muted-foreground">
              Adjust lighting and add objects to the scene.
            </p>
          </div>

          <Separator className="my-4" />

          <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Ambient Light</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="ambient-intensity">Intensity</Label>
                  <Slider
                    id="ambient-intensity"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[ambientLight.intensity]}
                    onValueChange={([val]) => setAmbientLight((prev) => ({ ...prev, intensity: val }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ambient-color">Color</Label>
                  <Input
                    id="ambient-color"
                    type="color"
                    value={ambientLight.color}
                    onChange={(e) =>
                      setAmbientLight((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="h-10 p-1"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  <span>Directional Light</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="directional-intensity">Intensity</Label>
                  <Slider
                    id="directional-intensity"
                    min={0}
                    max={5}
                    step={0.1}
                    value={[directionalLight.intensity]}
                    onValueChange={([val]) => setDirectionalLight((prev) => ({ ...prev, intensity: val }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="directional-color">Color</Label>
                  <Input
                    id="directional-color"
                    type="color"
                    value={directionalLight.color}
                    onChange={(e) =>
                      setDirectionalLight((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="h-10 p-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      step={0.5}
                      value={directionalLight.position.x}
                      onChange={(e) =>
                        setDirectionalLight((prev) => ({
                          ...prev,
                          position: { ...prev.position, x: parseFloat(e.target.value) },
                        }))
                      }
                      placeholder="X"
                    />
                    <Input
                      type="number"
                      step={0.5}
                      value={directionalLight.position.y}
                      onChange={(e) =>
                        setDirectionalLight((prev) => ({
                          ...prev,
                          position: { ...prev.position, y: parseFloat(e.target.value) },
                        }))
                      }
                      placeholder="Y"
                    />
                    <Input
                      type="number"
                      step={0.5}
                      value={directionalLight.position.z}
                      onChange={(e) =>
                        setDirectionalLight((prev) => ({
                          ...prev,
                          position: { ...prev.position, z: parseFloat(e.target.value) },
                        }))
                      }
                      placeholder="Z"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span>Add Object</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an object type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cube">Cube</SelectItem>
                              <SelectItem value="sphere">Sphere</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name="x"
                          render={({ field }) => <FormControl><Input placeholder="X" {...field} /></FormControl>}
                        />
                        <FormField
                          control={form.control}
                          name="y"
                          render={({ field }) => <FormControl><Input placeholder="Y" {...field} /></FormControl>}
                        />
                        <FormField
                          control={form.control}
                          name="z"
                          render={({ field }) => <FormControl><Input placeholder="Z" {...field} /></FormControl>}
                        />
                      </div>
                      <FormMessage>{form.formState.errors.x?.message || form.formState.errors.y?.message || form.formState.errors.z?.message}</FormMessage>
                    </FormItem>

                    <Button type="submit" className="w-full">Add to Scene</Button>
                  </form>
                </Form>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <Separator className="my-4" />
          
          <div className="flex-1 space-y-2">
            <h3 className="text-base font-semibold px-2">Scene Objects</h3>
            <div className="space-y-2">
              {objects.map(obj => (
                <div key={obj.id} className="flex items-center justify-between rounded-md p-2 hover:bg-muted">
                  <div className="flex items-center gap-2">
                    {obj.type === 'cube' ? <Box className="h-4 w-4 text-accent"/> : <Globe className="h-4 w-4 text-accent" />}
                    <span className="text-sm capitalize">{obj.type}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeObject(obj.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {objects.length === 0 && <p className="px-2 text-sm text-muted-foreground">No objects in scene.</p>}
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
