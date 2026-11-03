import { forwardRef } from 'react'

/* A button behind a reading gate (game/readingGate.js).

   It is on screen from the moment its panel is, disabled, with its background
   filling left to right over the reading time — so the player sees the wait
   passing instead of a button appearing out of nowhere.

   The fill is a pure CSS animation driven by `--gate-ms` (styles in
   global.css), so nothing re-renders per frame. Keying the element on the
   gate's `gateKey` restarts that animation whenever the gated text changes —
   otherwise React would reuse the DOM node and the fill would stay full from
   the previous panel.

   Pass the button's colour variant in `className` ('btn' and 'gate-btn' are
   added here). `disabled` is OR-ed with the gate, for buttons that have their
   own reason to be disabled (e.g. a reward already collected). */
const GateButton = forwardRef(function GateButton(
  { gate, className = '', disabled = false, children, ...rest },
  ref,
) {
  const { ready, waitMs, gateKey } = gate
  return (
    <button
      key={gateKey ?? 'gate'}
      ref={ref}
      type="button"
      className={`btn gate-btn ${ready ? '' : 'is-waiting'} ${className}`.trim()}
      disabled={disabled || !ready}
      aria-busy={ready ? undefined : true}
      style={ready ? undefined : { '--gate-ms': `${waitMs}ms` }}
      {...rest}
    >
      <span className="gate-btn-label">{children}</span>
    </button>
  )
})

export default GateButton
