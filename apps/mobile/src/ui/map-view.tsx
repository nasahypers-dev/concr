import type { GeoPoint } from '@concr/shared';
import { memo, type Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image, useColorScheme, View } from 'react-native';
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
  /** The supplier's own icon for the plant marker; a factory symbol is used without it. */
  plantLogoUrl?: string | null;
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
  /** Picker mode: fires after every pan/zoom (and after `animateTo`) with the new centre. */
  onCenterChange?: (point: GeoPoint) => void;
  initialCenter?: GeoPoint | null;
  /** Latitude/longitude delta of the initial region (smaller = closer). */
  initialDelta?: number;
  ref?: Ref<MapViewHandle>;
  testID?: string;
}

const EDGE_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };
const BAKU_CENTER: GeoPoint = { lat: 40.4093, lng: 49.8671 };
const DEFAULT_DELTA = 0.08;
/** Street-level zoom for a single marker (fitting one point would zoom past the imagery). */
const SINGLE_POINT_DELTA = 0.008;
const PIN_SIZE = 36;
const PLANT_SIZE = 44;
const TRUCK_SIZE = 40;

/**
 * react-native-maps wrapper (Apple Maps on iOS, Google Maps on Android; both work in Expo Go).
 * Fits all given points, draws the route, rotates truck markers by heading (spec §9.3).
 *
 * Marker views have a fixed size and `tracksViewChanges` stays on until their content has
 * rendered (image loaded, layout done): a snapshot taken too early is what makes custom markers
 * sit next to their coordinate and slide when the map zooms. Markers stop their taps from
 * reaching the map: on Apple Maps a propagated tap used to swap the plant marker for a default
 * pin (owner item 13).
 */
export function MapView({
  plant,
  plantLogoUrl = null,
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
      const [only] = points;
      if (points.length === 1 && only) {
        mapRef.current?.animateToRegion(
          {
            latitude: only.lat,
            longitude: only.lng,
            latitudeDelta: SINGLE_POINT_DELTA,
            longitudeDelta: SINGLE_POINT_DELTA,
          },
          300,
        );
        return;
      }
      mapRef.current?.fitToCoordinates(
        points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
        { edgePadding: EDGE_PADDING, animated: true },
      );
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitKey summarises `points`
  }, [fitKey]);

  const initial = initialCenter ?? points[0] ?? BAKU_CENTER;
  const initialSpan =
    initialCenter === undefined && points.length === 1 ? SINGLE_POINT_DELTA : initialDelta;

  return (
    <View className={cn('overflow-hidden rounded-2xl', className)} testID={testID}>
      <RNMapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: initial.lat,
          longitude: initial.lng,
          latitudeDelta: initialSpan,
          longitudeDelta: initialSpan,
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
            ? (region) => onCenterChange({ lat: region.latitude, lng: region.longitude })
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
        {plant ? <PlantMarker point={plant} logoUrl={plantLogoUrl} /> : null}
        {site && !centerPin ? <SiteMarker point={site} /> : null}
        {trucks.map((truck) => (
          <TruckMarker key={truck.id} truck={truck} />
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

/** The supplier's plant: its own icon in a white badge, a factory glyph when it has none. */
const PlantMarker = memo(function PlantMarker({
  point,
  logoUrl,
}: {
  point: GeoPoint;
  logoUrl: string | null;
}) {
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'failed'>(
    logoUrl ? 'loading' : 'failed',
  );
  const [laidOut, setLaidOut] = useState(false);
  const showImage = logoUrl !== null && imageState !== 'failed';
  return (
    <Marker
      coordinate={{ latitude: point.lat, longitude: point.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={1}
      tracksViewChanges={!laidOut || imageState === 'loading'}
      stopPropagation
    >
      <View
        onLayout={() => setLaidOut(true)}
        style={{ width: PLANT_SIZE, height: PLANT_SIZE }}
        className="items-center justify-center overflow-hidden rounded-full border-[3px] border-primary bg-white"
      >
        {showImage ? (
          <Image
            source={{ uri: logoUrl }}
            style={{ width: PLANT_SIZE - 10, height: PLANT_SIZE - 10, borderRadius: 999 }}
            resizeMode="contain"
            onLoad={() => setImageState('ready')}
            onError={() => setImageState('failed')}
          />
        ) : (
          <Icon name="business" size="md" color={colors.primary} />
        )}
      </View>
    </Marker>
  );
});

/** The pour site: a pin whose tip sits on the coordinate. */
const SiteMarker = memo(function SiteMarker({ point }: { point: GeoPoint }) {
  const [laidOut, setLaidOut] = useState(false);
  return (
    <Marker
      coordinate={{ latitude: point.lat, longitude: point.lng }}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={2}
      tracksViewChanges={!laidOut}
      stopPropagation
    >
      <View
        onLayout={() => setLaidOut(true)}
        style={{ width: PIN_SIZE, height: PIN_SIZE }}
        className="items-center justify-end"
      >
        <Icon name="location" size={PIN_SIZE} color={colors.danger} />
      </View>
    </Marker>
  );
});

/** A mixer on the road: amber badge with a heading arrow; grey when idle. */
const TruckMarker = memo(function TruckMarker({ truck }: { truck: MapTruck }) {
  const [laidOut, setLaidOut] = useState(false);
  return (
    <Marker
      coordinate={{ latitude: truck.lat, longitude: truck.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={truck.heading ?? 0}
      flat
      zIndex={3}
      tracksViewChanges={!laidOut}
      stopPropagation
    >
      <View
        onLayout={() => setLaidOut(true)}
        style={{ width: TRUCK_SIZE, height: TRUCK_SIZE }}
        className={cn(
          'items-center justify-center rounded-full border-2 border-white',
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
  );
});
