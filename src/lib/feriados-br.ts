function calcEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getFeriadosBR(year: number): { date: string; name: string; type: 'fixed' | 'movable' }[] {
  const fixos: { date: string; name: string; type: 'fixed' | 'movable' }[] = [
    { date: `${year}-01-01`, name: 'Confraternizacao Universal', type: 'fixed' },
    { date: `${year}-04-21`, name: 'Tiradentes', type: 'fixed' },
    { date: `${year}-05-01`, name: 'Dia do Trabalho', type: 'fixed' },
    { date: `${year}-09-07`, name: 'Independencia do Brasil', type: 'fixed' },
    { date: `${year}-10-12`, name: 'Nossa Sra. Aparecida', type: 'fixed' },
    { date: `${year}-11-02`, name: 'Finados', type: 'fixed' },
    { date: `${year}-11-15`, name: 'Proclamacao da Republica', type: 'fixed' },
    { date: `${year}-12-25`, name: 'Natal', type: 'fixed' },
  ]

  try {
    const easter = calcEaster(year)
    const carnival = addDays(easter, -47)
    const goodFriday = addDays(easter, -2)
    const corpusChristi = addDays(easter, 60)

    return [
      ...fixos,
      { date: formatDate(carnival), name: 'Carnaval', type: 'movable' },
      { date: formatDate(goodFriday), name: 'Sexta-feira Santa', type: 'movable' },
      { date: formatDate(easter), name: 'Pascoa', type: 'movable' },
      { date: formatDate(corpusChristi), name: 'Corpus Christi', type: 'movable' },
    ]
  } catch {
    return [...fixos]
  }
}
