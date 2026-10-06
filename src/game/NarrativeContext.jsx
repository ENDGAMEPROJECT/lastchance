import { createContext, useContext } from 'react'
import { getNarrative } from './characters.js'

export const NarrativeContext = createContext(getNarrative())
export const useNarrative = () => useContext(NarrativeContext)
