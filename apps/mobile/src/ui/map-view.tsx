import type { GeoPoint } from '@concr/shared';
import { useEffect, useRef } from 'react';
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

export interface MapViewProps {
  plant?: GeoPoint | null;
  site?: GeoPoint | null;
  trucks?: MapTruck[];
  route?: GeoPoint[];
  /** Tailwind height class, e.g. "h-64"; the map fills its width. */
  className?: string;
  interactive?: boolean;
  /** Called with the map centre when the user taps (site pin picker). */
  onPickLocation?: (point: GeoPoint) => void;
  testID?: string;
}

const EDGE_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };

/**
 * react-native-maps wrapper (Apple Maps on iOS, Google Maps on Android; both work in Expo Go).
 * Fits all given points, draws the route, rotates truck markers by heading (spec §9.3).
 */
export function MapView({
  plant,
  site,
  trucks = [],
  route,
  className,
  interactive = true,
  onPickLocation,
  testID,
}: MapViewProps) {
  const ref = useRef<RNMapView>(null);
  const scheme = useColorScheme();
  const points: GeoPoint[] = [
    ...(plant ? [plant] : []),
    ...(site ? [site] : []),
    ...trucks.map((t) => ({ lat: t.lat, lng: t.lng })),
  ];
  const fitKey = points.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join('|');

  useEffect(() => {
    if (points.length === 0) return;
    const timer = setTimeout(() => {
      ref.current?.fitToCoordinates(
        points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
        { edgePadding: EDGE_PADDING, animated: true },
      );
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitKey summarises `points`
  }, [fitKey]);

  const initial = points[0] ?? { lat: 40.4093, lng: 49.8671 };

  return (
    <View className={cn('overflow-hidden rounded-2xl', className)} testID={testID}>
      <RNMapView
        ref={ref}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: initial.lat,
          longitude: initial.lng,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
        pitchEnabled={false}
        showsCompass={false}
        toolbarEnabled={false}
        onPress={
          onPickLocation
            ? (e) =>
                onPickLocation({
                  lat: e.nativeEvent.coordinate.latitude,
                  lng: e.nativeEvent.coordinate.longitude,
                })
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
        {plant ? (
          <Marker
            coordinate={{ latitude: plant.lat, longitude: plant.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary">
              <Icon name="business" size="sm" color={colors.primaryForeground} />
            </View>
          </Marker>
        ) : null}
        {site ? (
          <Marker
            coordinate={{ latitude: site.lat, longitude: site.lng }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <Icon name="location" size={36} color={colors.danger} />
          </Marker>
        ) : null}
        {trucks.map((truck) => (
          <Marker
            key={truck.id}
            coordinate={{ latitude: truck.lat, longitude: truck.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={truck.heading ?? 0}
            flat
            tracksViewChanges={false}
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
    </View>
  );
}
