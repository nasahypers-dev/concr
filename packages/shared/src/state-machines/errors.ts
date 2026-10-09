export type TransitionDenial =
  'INVALID_TRANSITION' | 'ACTOR_NOT_ALLOWED' | 'REASON_REQUIRED' | 'CANCEL_CUTOFF_PASSED';

export type TransitionCheck = { allowed: true } | { allowed: false; denial: TransitionDenial };

/** Thrown by `transitionOrder` / `transitionDelivery`; the API maps it to INVALID_STATE_TRANSITION. */
export class InvalidTransitionError extends Error {
  readonly from: string;
  readonly to: string;
  readonly denial: TransitionDenial;

  constructor(entity: 'order' | 'delivery', from: string, to: string, denial: TransitionDenial) {
    super(`${entity}: ${from} -> ${to} not allowed (${denial})`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
    this.denial = denial;
  }
}
