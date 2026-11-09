import { useState, useEffect } from 'react'
import { loadRoomValue, saveRoomValue } from './session.js'

/* useState that survives a refresh.

   Rooms hold their working state in components, so a reload used to drop a
   player back at the start of a puzzle they had half finished — the run
   resumed, the puzzle did not. Swapping useState for this on the few pieces
   that represent progress (and only those: a dragged ghost or an open
   panel is not progress) makes the puzzle resume with the run.

   Keys are namespaced per room by the caller, e.g. 'influencer.answers'.
   Values must be JSON. Storage is the run's own (see session.js), so
   "start over" clears these too and debug mode keeps none of it. */
export function useRoomState(key, initial) {
  const [value, setValue] = useState(() => loadRoomValue(key, initial))
  useEffect(() => { saveRoomValue(key, value) }, [key, value])
  return [value, setValue]
}
