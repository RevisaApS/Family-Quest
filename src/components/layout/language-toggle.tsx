'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface LanguageToggleProps {
  className?: string
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const [language, setLanguage] = useState<'en' | 'da'>('en')
  const toggle = () => setLanguage(prev => prev === 'en' ? 'da' : 'en')

  return (
    <button
      onClick={toggle}
      className={cn("text-2xl hover:scale-110 transition-transform", className)}
      aria-label={`Switch to ${language === 'en' ? 'Danish' : 'English'}`}
    >
      {language === 'en' ? '🇬🇧' : '🇩🇰'}
    </button>
  )
}
