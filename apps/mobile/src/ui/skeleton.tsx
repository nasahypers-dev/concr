import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { cn } from './cn';

export interface SkeletonProps {
  /** Tailwind size classes, e.g. "h-4 w-32". */
  className?: string;
  rounded?: 'md' | 'xl' | 'full';
}

/** Pulsing placeholder block used by every loading state. */
export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  const radius =
    rounded === 'full' ? 'rounded-full' : rounded === 'xl' ? 'rounded-xl' : 'rounded-md';
  return (
    <Animated.View
      style={{ opacity }}
      className={cn('bg-surface-muted dark:bg-surface-muted-dark', radius, className)}
    />
  );
}

/** Three card-shaped placeholders for lists. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-3" accessibilityLabel="loading">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          className="gap-2 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark"
        >
          <View className="flex-row items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20" rounded="full" />
          </View>
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-24" />
        </View>
      ))}
    </View>
  );
}
