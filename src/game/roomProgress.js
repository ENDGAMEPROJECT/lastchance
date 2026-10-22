import { useEffect, useRef } from 'react'

/* Rooms report real puzzle progress (a correct step, not just any click) so
   the HUD can tell a stuck player from a busy one. Pass a value that changes
   only when the player gets something right; each change announces progress. */
export const ROOM_PROGRESS_EVENT = 'lastchance:room-progress'

export function useRoomProgress(signature) {
  const previous = useRef(signature)
  useEffect(() => {
    if (previous.current === signature) return
    previous.current = signature
    window.dispatchEvent(new CustomEvent(ROOM_PROGRESS_EVENT))
  }, [signature])
}
