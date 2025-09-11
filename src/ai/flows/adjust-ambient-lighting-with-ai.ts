'use server';
/**
 * @fileOverview An AI agent to adjust ambient lighting for optimal GLB model viewing.
 *
 * - adjustAmbientLighting - A function that suggests optimal ambient lighting settings.
 * - AdjustAmbientLightingInput - The input type for the adjustAmbientLighting function, including a data URI of the GLB model preview.
 * - AdjustAmbientLightingOutput - The return type for the adjustAmbientLighting function, providing suggested ambient light color and intensity.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustAmbientLightingInputSchema = z.object({
  modelPreviewDataUri: z
    .string()
    .describe(
      "A preview image of the GLB model in the scene, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AdjustAmbientLightingInput = z.infer<typeof AdjustAmbientLightingInputSchema>;

const AdjustAmbientLightingOutputSchema = z.object({
  suggestedAmbientLightColor: z
    .string()
    .describe(
      'The suggested ambient light color as a hexadecimal color code (e.g., #RRGGBB).'
    ),
  suggestedAmbientLightIntensity: z
    .number()
    .describe(
      'The suggested ambient light intensity as a floating-point number (e.g., 0.5).'
    ),
});
export type AdjustAmbientLightingOutput = z.infer<typeof AdjustAmbientLightingOutputSchema>;

export async function adjustAmbientLighting(
  input: AdjustAmbientLightingInput
): Promise<AdjustAmbientLightingOutput> {
  return adjustAmbientLightingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustAmbientLightingPrompt',
  input: {schema: AdjustAmbientLightingInputSchema},
  output: {schema: AdjustAmbientLightingOutputSchema},
  prompt: `You are an expert lighting designer for 3D scenes. Given a preview image of a GLB model in a Three.js scene, you will suggest the optimal ambient light color and intensity for viewing the model under ideal conditions.

  Consider the model's colors, textures, and overall aesthetic when making your suggestions. Provide the ambient light color as a hexadecimal color code (e.g., #RRGGBB) and the intensity as a floating-point number (e.g., 0.5).

  Here is a preview of the model in the scene:
  {{media url=modelPreviewDataUri}}

  Respond with the suggested color and intensity.
`,
});

const adjustAmbientLightingFlow = ai.defineFlow(
  {
    name: 'adjustAmbientLightingFlow',
    inputSchema: AdjustAmbientLightingInputSchema,
    outputSchema: AdjustAmbientLightingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
