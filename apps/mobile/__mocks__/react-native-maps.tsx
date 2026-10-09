// Manual Jest mock for react-native-maps (native module). Renders plain views so screens that
// embed a map can be tested; markers expose a testID for counting.
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

type AnyProps = PropsWithChildren<Record<string, unknown>> & { testID?: string };

function MockMapView({ children, testID }: AnyProps) {
  return <View testID={testID ?? 'map-view'}>{children}</View>;
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
