// Manual Jest mock for react-native-maps (native module). Renders plain views so screens that
// embed a map can be tested; markers expose a testID for counting. A hidden "map-pan" button lets
// tests simulate the user moving the map (Apple Maps style: no `isGesture` flag).
import type { PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
type AnyProps = PropsWithChildren<Record<string, unknown>> & {
  testID?: string;
  initialRegion?: Region;
  onRegionChangeComplete?: (region: Region, details: { isGesture?: boolean }) => void;
};

const PAN_DELTA = 0.01;

function MockMapView({ children, testID, initialRegion, onRegionChangeComplete }: AnyProps) {
  return (
    <View testID={testID ?? 'map-view'}>
      {children}
      {onRegionChangeComplete && initialRegion ? (
        <Pressable
          testID="map-pan"
          onPress={() =>
            onRegionChangeComplete(
              { ...initialRegion, latitude: initialRegion.latitude + PAN_DELTA },
              { isGesture: false },
            )
          }
        />
      ) : null}
    </View>
  );
}

export function Marker({ children }: AnyProps) {
  return <View testID="map-marker">{children}</View>;
}

export function Polyline() {
  return null;
}

export const PROVIDER_DEFAULT = undefined;
export const PROVIDER_GOOGLE = 'google';

export default MockMapView;
