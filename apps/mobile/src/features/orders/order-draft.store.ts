import { type CreateOrderInput, PaymentMethod, type SlumpClass } from '@concr/shared';
import { create } from 'zustand';
import type { DeliveryWindow } from '@/ui';

/** State of the 5-step order wizard (spec §13). Memory only: a draft dies with the app. */
export interface OrderDraft {
  productId: string | null;
  slump: SlumpClass | null;
  volumeM3: number;
  siteId: string | null;
  pumpRequired: boolean;
  pumpOptionId: string | null;
  window: DeliveryWindow | null;
  paymentMethod: PaymentMethod;
  customerNote: string;
}

interface OrderDraftState extends OrderDraft {
  patch: (partial: Partial<OrderDraft>) => void;
  loadFrom: (input: CreateOrderInput) => void;
  reset: () => void;
}

/** UX default, not a business value: one typical mixer load; min/max come from the supplier. */
const DEFAULT_VOLUME_M3 = 10;

const initialDraft: OrderDraft = {
  productId: null,
  slump: null,
  volumeM3: DEFAULT_VOLUME_M3,
  siteId: null,
  pumpRequired: false,
  pumpOptionId: null,
  window: null,
  paymentMethod: PaymentMethod.CASH,
  customerNote: '',
};

export const useOrderDraftStore = create<OrderDraftState>()((set) => ({
  ...initialDraft,
  patch: (partial) => set(partial),
  loadFrom: (input) =>
    set({
      productId: input.productId,
      slump: input.slump,
      volumeM3: input.volumeM3,
      siteId: input.siteId,
      pumpRequired: input.pumpRequired,
      pumpOptionId: input.pumpOptionId,
      window: {
        date: input.requestedDate,
        timeWindowStart: input.timeWindowStart,
        timeWindowEnd: input.timeWindowEnd,
      },
      paymentMethod: input.paymentMethod,
      customerNote: input.customerNote ?? '',
    }),
  reset: () => set(initialDraft),
}));

/** The request body once every step is complete, otherwise null. */
export function draftToCreateOrderInput(draft: OrderDraft): CreateOrderInput | null {
  if (!draft.productId || !draft.slump || !draft.siteId || !draft.window) return null;
  if (draft.pumpRequired && !draft.pumpOptionId) return null;
  return {
    productId: draft.productId,
    siteId: draft.siteId,
    volumeM3: draft.volumeM3,
    slump: draft.slump,
    pumpRequired: draft.pumpRequired,
    pumpOptionId: draft.pumpRequired ? draft.pumpOptionId : null,
    requestedDate: draft.window.date,
    timeWindowStart: draft.window.timeWindowStart,
    timeWindowEnd: draft.window.timeWindowEnd,
    paymentMethod: draft.paymentMethod,
    customerNote: draft.customerNote.trim() === '' ? null : draft.customerNote.trim(),
  };
}

/** Which wizard step index the draft is valid up to (for resuming and for the Stepper). */
export const WIZARD_STEPS = ['product', 'site', 'pump', 'schedule', 'review'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];
