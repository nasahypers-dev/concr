import {
  bearingDeg,
  densifyPolyline,
  haversineKm,
  interpolateAlongPolyline,
  isPointInPolygon,
  polylineLengthKm,
} from './geo';

const plant = { lat: 40.4858529, lng: 49.8294278 }; // Novxanı (spec §7)
const baku = { lat: 40.4093, lng: 49.8671 };

describe('geo', () => {
  it('measures distances and bearings', () => {
    expect(haversineKm(plant, plant)).toBe(0);
    const km = haversineKm(plant, baku);
    expect(km).toBeGreaterThan(8);
    expect(km).toBeLessThan(10);
    const bearing = bearingDeg(plant, baku);
    expect(bearing).toBeGreaterThan(150); // roughly south-south-east
    expect(bearing).toBeLessThan(180);
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(0, 5);
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(90, 5);
  });

  it('tests points against a polygon', () => {
    const square = {
      points: [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 10 },
        { lat: 10, lng: 0 },
      ],
    };
    expect(isPointInPolygon({ lat: 5, lng: 5 }, square)).toBe(true);
    expect(isPointInPolygon({ lat: 15, lng: 5 }, square)).toBe(false);
    expect(isPointInPolygon({ lat: 0, lng: 5 }, square)).toBe(true); // on the edge
    expect(
      isPointInPolygon({ lat: 5, lng: 5 }, { points: [square.points[0]!, square.points[1]!] }),
    ).toBe(false);
  });

  it('interpolates along a polyline with headings', () => {
    const line = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 1 },
    ];
    expect(polylineLengthKm(line)).toBeGreaterThan(200);
    const start = interpolateAlongPolyline(line, 0);
    expect(start.point).toEqual({ lat: 0, lng: 0 });
    expect(start.heading).toBeCloseTo(90, 5);
    const mid = interpolateAlongPolyline(line, 0.5);
    expect(mid.point.lng).toBeCloseTo(1, 1);
    expect(mid.segmentIndex).toBe(1);
    const end = interpolateAlongPolyline(line, 1);
    expect(end.point).toEqual({ lat: 1, lng: 1 });
    expect(interpolateAlongPolyline(line, 2).point).toEqual({ lat: 1, lng: 1 }); // clamped
    expect(interpolateAlongPolyline([plant], 0.3).point).toEqual(plant);
    expect(() => interpolateAlongPolyline([], 0)).toThrow(RangeError);
  });

  it('densifies waypoints', () => {
    const dense = densifyPolyline(
      [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 1 },
      ],
      4,
    );
    expect(dense).toHaveLength(5);
    expect(dense[2]).toEqual({ lat: 0, lng: 0.5 });
    expect(densifyPolyline([plant], 3)).toEqual([plant]);
  });
});
