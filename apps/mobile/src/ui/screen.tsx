import type { PropsWithChildren } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';
import { cn } from './cn';

export interface ScreenProps extends PropsWithChildren {
  /** Wrap content in a ScrollView (forms, long lists of cards). */
  scroll?: boolean;
  /** Safe-area edges to respect; tab screens usually omit 'bottom'. */
  edges?: Edge[];
  /** Remove the default 16 px gutters (full-bleed maps, lists with their own padding). */
  bare?: boolean;
  /** Keyboard-aware (forms). */
  keyboard?: boolean;
  className?: string;
}

/**
 * Every screen starts here: safe area, app background, 16 px gutters, dark mode aware.
 * A tap on any empty area closes the keyboard (inputs and buttons keep their own taps).
 */
export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  bare = false,
  keyboard = false,
  className,
}: ScreenProps) {
  const gutters = bare ? '' : 'p-4';
  const content = scroll ? (
    <ScrollView
      contentContainerClassName={cn('flex-grow gap-4', gutters, className)}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={cn('flex-1 gap-4', gutters, className)}>{children}</View>
  );
  const body = keyboard ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background dark:bg-background-dark">
      <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
        <View className="flex-1">{body}</View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
