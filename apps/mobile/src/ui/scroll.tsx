import type { PropsWithChildren } from 'react';
import { ScrollView } from 'react-native';

export interface ScrollProps extends PropsWithChildren {
  contentContainerClassName?: string;
}

/** Vertical scroll area with the app defaults (taps close the keyboard, no scrollbar). */
export function Scroll({ children, contentContainerClassName }: ScrollProps) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerClassName={contentContainerClassName}
    >
      {children}
    </ScrollView>
  );
}
