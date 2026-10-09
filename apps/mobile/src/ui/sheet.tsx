import type { PropsWithChildren } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from './cn';
import { Icon } from './icon';
import { Text } from './text';
import { colors } from './theme';

export interface SheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}

/** Bottom sheet on a transparent Modal: backdrop tap or the × closes it. */
export function Sheet({ visible, onClose, title, children, className }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable accessibilityLabel="close" className="flex-1" onPress={onClose} />
        <View
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
                <Icon name="close" size="lg" color={colors.inkMuted} />
              </Pressable>
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}
