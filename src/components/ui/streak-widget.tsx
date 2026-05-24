'use client'

import { motion } from 'framer-motion'

interface StreakWidgetProps {
  currentStreak: number
  longestStreak: number
  today: boolean
  last7Days: boolean[]
}

export function StreakWidget({ currentStreak, longestStreak, today, last7Days }: StreakWidgetProps) {
  const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-subtle)]/30 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-xl"
            animate={{ scale: currentStreak > 0 ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.5, repeat: currentStreak > 0 ? Infinity : 0, repeatDelay: 2 }}
          >
            🔥
          </motion.span>
          <span className="text-[13px] font-[500] text-[var(--text)]">
            {currentStreak > 0 ? (
              <motion.span
                key={currentStreak}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <span className="text-[var(--accent)] text-[18px] font-[600]">{currentStreak}</span> dias de streak
              </motion.span>
            ) : (
              'Nenhum streak ativo'
            )}
          </span>
        </div>
        {currentStreak >= 7 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[500] bg-[var(--accent)] text-white"
          >
            🏆 Semana completa
          </motion.span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        {last7Days.map((active, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-[9px] font-[500] ${
              active
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-3)]'
            }`}
            title={active ? 'Ativo' : 'Inativo'}
          >
            {days[i]}
          </motion.div>
        ))}
      </div>

      {!today && (
        <p className="text-[11px] text-[var(--warning)]">
          Complete uma tarefa hoje para manter seu streak!
        </p>
      )}

      <p className="text-[10px] text-[var(--text-3)] mt-2">
        Recorde: {longestStreak} dias
      </p>
    </motion.div>
  )
}
