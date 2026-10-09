import type { PropsWithChildren } from 'react';
import { Platform, ScrollView } from 'react-native';

export interface ScrollProps extends PropsWithChildren {
  contentContainerClassName?: string;
}

/**
 * Vertical scroll area with the app defaults: dragging closes the keyboard, iOS insets the
 * content so a focused field (wizard note) rises above it, no scrollbar.
 */
export function Scroll({ children, contentContainerClassName }: ScrollProps) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      showsVerticalScrollIndicator={false}
      contentContainerClassName={contentContainerClassName}
    >
      {children}
    </ScrollView>
  );
}
