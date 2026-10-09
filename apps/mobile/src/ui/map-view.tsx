import type { GeoPoint } from '@concr/shared';
import { type Ref, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useColorScheme, View } from 'react-native';
import RNMapView, { Marker, Polyline } from 'react-native-maps';
import { cn } from './cn';
import { Icon } from './icon';
import { colors } from './theme';

export interface MapTruck {
  id: string;
  lat: number;
  lng: number;
  /** Degrees clockwise from north; rotates the marker. */
  heading: number | null;
  /** Dimmed marker for idle trucks (dispatcher map). */
  idle?: boolean;
}

/** Imperative API for the few cases a screen must move the camera (location picker). */
export interface MapViewHandle {
  animateTo: (point: GeoPoint, delta?: number) => void;
}

export interface MapViewProps {
  plant?: GeoPoint | null;
  site?: GeoPoint | null;
  trucks?: MapTruck[];
  route?: GeoPoint[];
  /** Tailwind height class, e.g. "h-64"; the map fills its width. */
  className?: string;
  interactive?: boolean;
  /**
   * Picker mode: a fixed pin is drawn at the centre and the map pans underneath it
   * (Bolt-style). The map no longer auto-fits; use `initialCenter` instead.
   */
  centerPin?: boolean;
  /** Picker mode: fires after every pan/zoom with the new centre. */
  onCenterChange?: (point: GeoPoint, isGesture: boolean) => void;
  initialCenter?: GeoPoint | null;
  /** Latitude/longitude delta of the initial region (smaller = closer). */
  initialDelta?: number;
  ref?: Ref<MapViewHandle>;
  testID?: string;
}

const EDGE_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };
const BAKU_CENTER: GeoPoint = { lat: 40.4093, lng: 49.8671 };
const DEFAULT_DELTA = 0.08;
const PIN_SIZE = 36;

/**
 * react-native-maps wrapper (Apple Maps on iOS, Google Maps on Android; both work in Expo Go).
 * Fits all given points, draws the route, rotates truck markers by heading (spec §9.3).
 * Markers stop their taps from reaching the map: on Apple Maps a propagated tap used to swap the
 * plant marker for a default pin (owner item 13).
 */
export function MapView({
  plant,
  site,
  trucks = [],
  route,
  className,
  interactive = true,
  centerPin = false,
  onCenterChange,
  initialCenter,
  initialDelta = DEFAULT_DELTA,
  ref,
  testID,
}: MapViewProps) {
  const mapRef = useRef<RNMapView>(null);
  const scheme = useColorScheme();
  const points: GeoPoint[] = [
    ...(plant ? [plant] : []),
    ...(site ? [site] : []),
    ...trucks.map((t) => ({ lat: t.lat, lng: t.lng })),
  ];
  const fitKey = centerPin
    ? ''
    : points.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join('|');

  useImperativeHandle(
    ref,
    () => ({
      animateTo: (point, delta = 0.005) => {
        mapRef.current?.animateToRegion(
          {
            latitude: point.lat,
            longitude: point.lng,
            latitudeDelta: delta,
            longitudeDelta: delta,
          },
          400,
        );
      },
    }),
    [],
  );

  useEffect(() => {
    if (fitKey === '' || points.length === 0) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
        { edgePadding: EDGE_PADDING, animated: true },
      );
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitKey summarises `points`
  }, [fitKey]);

  const initial = initialCenter ?? points[0] ?? BAKU_CENTER;

  // Static markers keep a stable element tree so MapKit never re-creates their views.
  const plantMarker = useMemo(
    () =>
      plant ? (
        <Marker
          coordinate={{ latitude: plant.lat, longitude: plant.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          stopPropagation
        >
          <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary">
            <Icon name="business" size="sm" color={colors.primaryForeground} />
          </View>
        </Marker>
      ) : null,
    [plant],
  );
  const siteMarker = useMemo(
    () =>
      site && !centerPin ? (
        <Marker
          coordinate={{ latitude: site.lat, longitude: site.lng }}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
          stopPropagation
        >
          <Icon name="location" size={PIN_SIZE} color={colors.danger} />
        </Marker>
      ) : null,
    [site, centerPin],
  );

  return (
    <View className={cn('overflow-hidden rounded-2xl', className)} testID={testID}>
      <RNMapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: initial.lat,
          longitude: initial.lng,
          latitudeDelta: initialDelta,
          longitudeDelta: initialDelta,
        }}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
        showsCompass={false}
        toolbarEnabled={false}
        onRegionChangeComplete={
          onCenterChange
            ? (region, details) =>
                onCenterChange(
                  { lat: region.latitude, lng: region.longitude },
                  details?.isGesture ?? true,
                )
            : undefined
        }
      >
        {route && route.length > 1 ? (
          <Polyline
            coordinates={route.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[1, 0]}
          />
        ) : null}
        {plantMarker}
        {siteMarker}
        {trucks.map((truck) => (
          <Marker
            key={truck.id}
            coordinate={{ latitude: truck.lat, longitude: truck.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={truck.heading ?? 0}
            flat
            tracksViewChanges={false}
            stopPropagation
          >
            <View
              className={cn(
                'h-10 w-10 items-center justify-center rounded-full border-2 border-white',
                truck.idle ? 'bg-ink-subtle' : 'bg-accent',
              )}
            >
              <Icon
                name="navigate"
                size="md"
                color={truck.idle ? colors.surface : colors.accentForeground}
              />
            </View>
          </Marker>
        ))}
      </RNMapView>
      {centerPin ? (
        <View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center"
          testID="map-center-pin"
        >
          {/* The pin tip must sit exactly on the map centre: lift the glyph by half its height. */}
          <View style={{ transform: [{ translateY: -PIN_SIZE / 2 }] }}>
            <Icon name="location" size={PIN_SIZE} color={colors.danger} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
