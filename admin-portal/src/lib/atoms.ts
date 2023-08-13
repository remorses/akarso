import { atom } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'

export const metadataXmlAtom = persistentAtom<string>('metadataXmlAtom', '')
export const metadataUrlAtom = persistentAtom<string>('metadataUrlAtom', '')
export const domainAtom = persistentAtom<string>('domainAtom', '')
