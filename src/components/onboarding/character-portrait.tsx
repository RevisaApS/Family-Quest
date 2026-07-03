'use client'

import { cn } from '@/lib/utils'

interface CharacterPortraitProps {
  characterClass: 'warrior' | 'wizard' | 'rogue' | 'ranger'
  gender: 'male' | 'female' | 'neutral'
  size?: number
  className?: string
}

const classColors: Record<string, string> = {
  warrior: '#ef4444',
  wizard: '#a855f7',
  rogue: '#10b981',
  ranger: '#f59e0b',
}

function WarriorPortrait({ gender, color }: { gender: string; color: string }) {
  const broad = gender === 'male' ? 4 : gender === 'female' ? -2 : 0
  return (
    <g>
      {/* Shoulders / armor */}
      <path
        d={`M${32 + broad},72 Q38,58 48,56 L52,56 Q62,58 ${68 - broad},72 L${66 - broad},78 Q60,68 52,66 L48,66 Q40,68 ${34 + broad},78 Z`}
        fill="#1e1e2e"
        stroke={color}
        strokeWidth="1"
      />
      {/* Chest plate accent */}
      <path d="M44,66 L50,74 L56,66" fill="none" stroke={color} strokeWidth="1.5" opacity="0.8" />
      {/* Neck */}
      <rect x="46" y="52" width="8" height="8" rx="2" fill="#1e1e2e" />
      {/* Head */}
      <ellipse cx="50" cy="42" rx="12" ry="14" fill="#1e1e2e" />
      {/* Helmet */}
      <path d="M38,42 Q38,26 50,24 Q62,26 62,42" fill="#2a2a3e" stroke={color} strokeWidth="1.2" />
      {/* Helmet visor slit */}
      <line x1="42" y1="40" x2="58" y2="40" stroke={color} strokeWidth="1.5" opacity="0.9" />
      {/* Helmet horns */}
      <path d="M38,34 L32,22 L40,30" fill={color} opacity="0.7" />
      <path d="M62,34 L68,22 L60,30" fill={color} opacity="0.7" />
      {/* Female: hair flowing from under helmet */}
      {gender === 'female' && (
        <path d="M38,42 Q34,50 32,58" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      )}
      {/* Neutral: abstract face mark */}
      {gender === 'neutral' && (
        <circle cx="50" cy="36" r="2" fill={color} opacity="0.6" />
      )}
    </g>
  )
}

function WizardPortrait({ gender, color }: { gender: string; color: string }) {
  const broad = gender === 'male' ? 3 : gender === 'female' ? -2 : 0
  return (
    <g>
      {/* Robes */}
      <path
        d={`M${34 + broad},78 Q40,62 46,58 L54,58 Q60,62 ${66 - broad},78 Z`}
        fill="#1e1e2e"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.9"
      />
      {/* Robe collar accent */}
      <path d="M46,58 L50,64 L54,58" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
      {/* Neck */}
      <rect x="46" y="50" width="8" height="8" rx="2" fill="#1e1e2e" />
      {/* Head */}
      <ellipse cx="50" cy="42" rx="10" ry="12" fill="#1e1e2e" />
      {/* Pointed hat */}
      <path d="M36,44 L50,10 L64,44" fill="#2a2a3e" stroke={color} strokeWidth="1" />
      {/* Hat brim */}
      <ellipse cx="50" cy="44" rx="16" ry="4" fill="#2a2a3e" stroke={color} strokeWidth="0.8" />
      {/* Hat star/jewel */}
      <circle cx="50" cy="30" r="2.5" fill={color} opacity="0.8" />
      {/* Magic aura glow */}
      <circle cx="50" cy="30" r="5" fill={color} opacity="0.15" />
      {/* Glowing orb in hand */}
      <circle cx="68" cy="68" r="5" fill={color} opacity="0.3" />
      <circle cx="68" cy="68" r="3" fill={color} opacity="0.6" />
      {/* Female: longer flowing hair */}
      {gender === 'female' && (
        <>
          <path d="M40,44 Q36,52 34,60" stroke={color} strokeWidth="1.2" fill="none" opacity="0.4" />
          <path d="M60,44 Q64,52 66,58" stroke={color} strokeWidth="1.2" fill="none" opacity="0.4" />
        </>
      )}
      {/* Neutral: abstract eye marks */}
      {gender === 'neutral' && (
        <>
          <line x1="45" y1="40" x2="48" y2="40" stroke={color} strokeWidth="1.5" opacity="0.6" />
          <line x1="52" y1="40" x2="55" y2="40" stroke={color} strokeWidth="1.5" opacity="0.6" />
        </>
      )}
    </g>
  )
}

function RoguePortrait({ gender, color }: { gender: string; color: string }) {
  const broad = gender === 'male' ? 3 : gender === 'female' ? -2 : 0
  return (
    <g>
      {/* Body / sleek tunic */}
      <path
        d={`M${36 + broad},76 Q42,60 46,56 L54,56 Q58,60 ${64 - broad},76 Z`}
        fill="#1e1e2e"
        stroke={color}
        strokeWidth="0.6"
      />
      {/* Crossed arms / daggers */}
      <line x1="38" y1="68" x2="50" y2="58" stroke={color} strokeWidth="1.2" opacity="0.7" />
      <line x1="62" y1="68" x2="50" y2="58" stroke={color} strokeWidth="1.2" opacity="0.7" />
      {/* Dagger hilts */}
      <circle cx="38" cy="68" r="1.5" fill={color} opacity="0.8" />
      <circle cx="62" cy="68" r="1.5" fill={color} opacity="0.8" />
      {/* Neck */}
      <rect x="46" y="50" width="8" height="6" rx="2" fill="#1e1e2e" />
      {/* Head */}
      <ellipse cx="50" cy="40" rx="11" ry="13" fill="#1e1e2e" />
      {/* Hood */}
      <path d="M37,46 Q36,30 50,24 Q64,30 63,46" fill="#2a2a3e" stroke={color} strokeWidth="0.8" />
      {/* Mask / eye slit */}
      <path d="M42,38 L50,36 L58,38" fill="none" stroke={color} strokeWidth="1.5" opacity="0.9" />
      {/* Gleaming eye dots */}
      <circle cx="46" cy="38" r="1" fill={color} opacity="0.8" />
      <circle cx="54" cy="38" r="1" fill={color} opacity="0.8" />
      {/* Female: hair strand */}
      {gender === 'female' && (
        <path d="M63,40 Q66,48 64,56" stroke={color} strokeWidth="1.2" fill="none" opacity="0.4" />
      )}
      {/* Neutral: face scarf */}
      {gender === 'neutral' && (
        <path d="M40,42 Q50,46 60,42" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      )}
    </g>
  )
}

function RangerPortrait({ gender, color }: { gender: string; color: string }) {
  const broad = gender === 'male' ? 3 : gender === 'female' ? -2 : 0
  return (
    <g>
      {/* Cloak body */}
      <path
        d={`M${34 + broad},78 Q40,60 46,56 L54,56 Q60,60 ${66 - broad},78 Z`}
        fill="#1e1e2e"
        stroke={color}
        strokeWidth="0.6"
      />
      {/* Bow slung on back */}
      <path d="M60,50 Q72,60 64,76" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <line x1="60" y1="50" x2="64" y2="76" stroke={color} strokeWidth="0.8" opacity="0.4" />
      {/* Neck */}
      <rect x="46" y="50" width="8" height="6" rx="2" fill="#1e1e2e" />
      {/* Head */}
      <ellipse cx="50" cy="40" rx="11" ry="13" fill="#1e1e2e" />
      {/* Hood / cloak hood */}
      <path d="M36,46 Q34,28 50,22 Q66,28 64,46" fill="#2a2a3e" stroke={color} strokeWidth="0.8" />
      {/* Eyes */}
      <ellipse cx="46" cy="38" rx="1.5" ry="1" fill={color} opacity="0.7" />
      <ellipse cx="54" cy="38" rx="1.5" ry="1" fill={color} opacity="0.7" />
      {/* Leaf motifs on cloak */}
      <path d="M38,64 Q40,60 42,64" fill={color} opacity="0.3" />
      <path d="M56,68 Q58,64 60,68" fill={color} opacity="0.3" />
      <path d="M44,72 Q46,68 48,72" fill={color} opacity="0.25" />
      {/* Female: flowing hair from under hood */}
      {gender === 'female' && (
        <>
          <path d="M36,44 Q32,52 34,62" stroke={color} strokeWidth="1.2" fill="none" opacity="0.4" />
          <path d="M64,44 Q68,50 66,58" stroke={color} strokeWidth="1" fill="none" opacity="0.3" />
        </>
      )}
      {/* Neutral: abstract nature mark on forehead */}
      {gender === 'neutral' && (
        <path d="M48,32 L50,28 L52,32" fill={color} opacity="0.5" />
      )}
    </g>
  )
}

const portraitComponents: Record<string, React.FC<{ gender: string; color: string }>> = {
  warrior: WarriorPortrait,
  wizard: WizardPortrait,
  rogue: RoguePortrait,
  ranger: RangerPortrait,
}

export function CharacterPortrait({
  characterClass,
  gender,
  size = 120,
  className,
}: CharacterPortraitProps) {
  const color = classColors[characterClass]
  const PortraitContent = portraitComponents[characterClass]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn('select-none', className)}
      aria-label={`${gender} ${characterClass} portrait`}
    >
      {/* Circular frame background */}
      <defs>
        <radialGradient id={`bg-${characterClass}-${gender}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#bg-${characterClass}-${gender})`} />
      <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />

      {/* Character silhouette */}
      <PortraitContent gender={gender} color={color} />
    </svg>
  )
}
