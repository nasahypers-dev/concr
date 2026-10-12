import { distanceMetres, movedFrom } from './picker-geo';

const plant = { lat: 40.4858529, lng: 49.8294278 };

describe('picker-geo', () => {
  it('measures distances in metres', () => {
    expect(distanceMetres(plant, plant)).toBe(0);
    // ~1 km north
    expect(distanceMetres(plant, { lat: plant.lat + 0.009, lng: plant.lng })).toBeCloseTo(1000, -2);
  });

  it('ignores map settling but notices a real pan', () => {
    expect(movedFrom(plant, { lat: plant.lat + 0.00005, lng: plant.lng })).toBe(false); // ~5 m
    expect(movedFrom(plant, { lat: plant.lat + 0.0005, lng: plant.lng })).toBe(true); // ~55 m
  });
});
