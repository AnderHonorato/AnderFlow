export interface PixData {
  pixKey: string
  amount: number
  name: string
  city: string
  txId: string
  description?: string
}

function format(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

function calculateCRC16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function generatePixPayload({ pixKey, amount, name, city, txId }: PixData): string {
  const merchantAccount = format('00', 'br.gov.bcb.pix') + format('01', pixKey)
  const payload = [
    format('00', '01'),
    format('26', merchantAccount),
    format('52', '0000'),
    format('53', '986'),
    format('54', amount.toFixed(2)),
    format('58', 'BR'),
    format('59', name.slice(0, 25)),
    format('60', city.slice(0, 15)),
    format('62', format('05', txId.slice(0, 25))),
    '6304',
  ].join('')
  const crc = calculateCRC16(payload)
  return payload + crc
}
