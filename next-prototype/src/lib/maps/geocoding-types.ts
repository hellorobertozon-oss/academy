export type GeocodedLocation = {
  id: string;
  latitude: number;
  longitude: number;
  displayName: string;
  boundingBox: [south: number, north: number, west: number, east: number] | null;
};
