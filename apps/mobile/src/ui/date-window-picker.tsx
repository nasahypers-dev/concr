import type { EarliestSlot, IsoDate, TimeOfDay } from '@concr/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { dayOffsetFromToday, formatDate, formatWindow, todayIsoDate } from '@/lib/format';
import { cn } from './cn';
import { Text } from './text';

export interface DeliveryWindow {
  date: IsoDate;
  timeWindowStart: TimeOfDay;
  timeWindowEnd: TimeOfDay;
}

export interface DateWindowPickerProps {
  value: DeliveryWindow | null;
  onChange: (value: DeliveryWindow) => void;
  /** Slots before this one are disabled (lead time, spec §3). */
  earliest: EarliestSlot;
  daysAhead?: number;
  now?: Date;
  className?: string;
}

/** 2-hour windows around the clock: the plant works 24/7 (spec §3), night slots included. */
export const WINDOW_SLOTS: readonly (readonly [TimeOfDay, TimeOfDay])[] = Array.from(
  { length: 12 },
  (_, i) => {
    const start = i * 2;
    const end = (start + 2) % 24;
    return [`${String(start).padStart(2, '0')}:00`, `${String(end).padStart(2, '0')}:00`] as const;
  },
);

function slotMinutes(time: TimeOfDay): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Day chips (next N days) + a grid of 2-hour slots; invalid slots are disabled, never hidden. */
export function DateWindowPicker({
  value,
  onChange,
  earliest,
  daysAhead = 14,
  now = new Date(),
  className,
}: DateWindowPickerProps) {
  const { t } = useTranslation();
  const selectedDate = value?.date ?? earliest.date;
  const days = Array.from({ length: daysAhead }, (_, i) => todayIsoDate(now, i)).filter(
    (date) => date >= earliest.date,
  );

  const dayLabel = (date: IsoDate): string => {
    const offset = dayOffsetFromToday(date, now);
    if (offset === 0) return t('time.today');
    if (offset === 1) return t('time.tomorrow');
    return formatDate(date).slice(0, 5); // "12.10"
  };

  const slotDisabled = (start: TimeOfDay): boolean =>
    selectedDate === earliest.date && slotMinutes(start) < slotMinutes(earliest.timeWindowStart);

  return (
    <View className={cn('gap-4', className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {days.map((date) => {
          const selected = date === selectedDate;
          return (
            <Pressable
              key={date}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={formatDate(date)}
              onPress={() => {
                const start =
                  value &&
                  !(
                    date === earliest.date &&
                    slotMinutes(value.timeWindowStart) < slotMinutes(earliest.timeWindowStart)
                  )
                    ? value
                    : null;
                onChange({
                  date,
                  timeWindowStart:
                    start?.timeWindowStart ??
                    (date === earliest.date ? earliest.timeWindowStart : '08:00'),
                  timeWindowEnd:
                    start?.timeWindowEnd ??
                    (date === earliest.date ? earliest.timeWindowEnd : '10:00'),
                });
              }}
              className={cn(
                'min-h-14 min-w-[72px] items-center justify-center rounded-xl border px-3',
                selected
                  ? 'border-primary bg-primary dark:border-accent dark:bg-accent'
                  : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark',
              )}
            >
              <Text
                variant="bodySm"
                weight="semibold"
                className={
                  selected
                    ? 'text-primary-foreground dark:text-accent-foreground'
                    : 'text-ink dark:text-ink-dark'
                }
              >
                {dayLabel(date)}
              </Text>
              <Text
                variant="caption"
                className={
                  selected
                    ? 'text-primary-foreground/80 dark:text-accent-foreground/80'
                    : 'text-ink-muted'
                }
              >
                {formatDate(date)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View className="flex-row flex-wrap gap-2">
        {WINDOW_SLOTS.map(([start, end]) => {
          const selected = value?.date === selectedDate && value.timeWindowStart === start;
          const disabled = slotDisabled(start);
          return (
            <Pressable
              key={start}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={formatWindow(start, end)}
              disabled={disabled}
              onPress={() =>
                onChange({ date: selectedDate, timeWindowStart: start, timeWindowEnd: end })
              }
              className={cn(
                'min-h-12 w-[31%] items-center justify-center rounded-xl border',
                selected
                  ? 'border-primary bg-primary dark:border-accent dark:bg-accent'
                  : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark',
                disabled && 'opacity-35',
              )}
            >
              <Text
                variant="bodySm"
                weight="medium"
                className={
                  selected
                    ? 'text-primary-foreground dark:text-accent-foreground'
                    : 'text-ink dark:text-ink-dark'
                }
              >
                {formatWindow(start, end)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
