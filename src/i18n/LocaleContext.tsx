import { createContext, useContext } from 'react'
import type { Locale } from './translations'
import { translate } from './translations'

export type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (text: string) => string
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used inside LocaleContext.Provider')
  return value
}

export function makeLocaleValue(locale: Locale, setLocale: (locale: Locale) => void): LocaleContextValue {
  return { locale, setLocale, t: (text) => translate(text, locale) }
}
