
// It's crucial to use NEXT_PUBLIC_ prefix for environment variables
// that you want to be accessible on the client-side (in the browser).
// Create a .env.local file in the root of your project to store these values.
// Example .env.local:
// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
// NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=YOUR_MAP_ID_HERE

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "";

export const mapsConfig = {
  apiKey,
  mapId,
};
