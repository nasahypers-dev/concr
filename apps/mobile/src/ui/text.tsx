import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from './cn';

export type TextVariant =
  'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodySm' | 'caption' | 'label';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextTone =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'inverse'
  | 'primary'
  | 'accent'
  | 'danger'
  | 'success'
  /** No colour class: the caller sets it via className (badges, chips, filled buttons). */
  | 'none';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  tone?: TextTone;
  className?: string;
}

const variantClass: Record<TextVariant, string> = {
  display: 'text-display',
  title: 'text-title',
  heading: 'text-heading',
  subheading: 'text-subheading',
  body: 'text-body',
  bodySm: 'text-body-sm',
  caption: 'text-caption',
  label: 'text-label uppercase tracking-wide',
};

const defaultWeight: Record<TextVariant, TextWeight> = {
  display: 'bold',
  title: 'bold',
  heading: 'semibold',
  subheading: 'semibold',
  body: 'regular',
  bodySm: 'regular',
  caption: 'regular',
  label: 'medium',
};

/** Inter is loaded per weight; React Native cannot synthesise weights for custom fonts. */
const weightClass: Record<TextWeight, string> = {
  regular: 'font-inter',
  medium: 'font-inter-medium',
  semibold: 'font-inter-semibold',
  bold: 'font-inter-bold',
};

const toneClass: Record<TextTone, string> = {
  default: 'text-ink dark:text-ink-dark',
  muted: 'text-ink-muted dark:text-ink-muted-dark',
  subtle: 'text-ink-subtle',
  inverse: 'text-ink-inverse',
  primary: 'text-primary dark:text-ink-dark',
  accent: 'text-accent',
  danger: 'text-danger',
  success: 'text-success',
  none: '',
};

/**
 * The only text primitive the app uses: one type scale, Inter with real weights, semantic tones.
 * Azerbaijani letters (ə ğ ı ö ş ü ç) are covered by Inter's Latin Extended set.
 */
export function Text({
  variant = 'body',
  weight,
  tone = 'default',
  className,
  ...rest
}: TextProps) {
  return (
    <RNText
      className={cn(
        variantClass[variant],
        weightClass[weight ?? defaultWeight[variant]],
        toneClass[tone],
        className,
      )}
      {...rest}
    />
  );
}
