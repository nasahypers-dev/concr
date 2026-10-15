import type { PropsWithChildren } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from './cn';
import { Icon } from './icon';
import { Text } from './text';

export interface SheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}

/**
 * Bottom sheet on a transparent Modal. The sheet rises above the keyboard (ADR 0010) so a field
 * stays visible while typing; a tap on the backdrop first closes the keyboard and only closes
 * the sheet when no keyboard is open; a tap on empty sheet content closes the keyboard too.
 */
export function Sheet({ visible, onClose, title, children, className }: SheetProps) {
  const insets = useSafeAreaInsets();

  const onBackdropPress = () => {
    if (Keyboard.isVisible()) Keyboard.dismiss();
    else onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/40"
      >
        <Pressable accessibilityLabel="close" className="flex-1" onPress={onBackdropPress} />
        <Pressable
          accessible={false}
          onPress={Keyboard.dismiss}
          className={cn('rounded-t-3xl bg-surface px-4 pt-3 dark:bg-surface-dark', className)}
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-border-strong" />
          {title ? (
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="heading">{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={onClose}
                className="p-1"
              >
                <Icon name="close" size="lg" tone="muted" />
              </Pressable>
            </View>
          ) : null}
          {children}
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
