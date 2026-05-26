'use client'

import { useEffect, useRef } from 'react'

interface Ponto { x: number; y: number }

interface RastroEspaguete {
  pontos: Ponto[]
  cor: string
  larguraMax: number
  vida: number
  vidaMax: number
  velocidade: Ponto
}

interface Estrela {
  x: number; y: number
  tamanho: number
  brilho: number
  velocidadeBrilho: number
  camada: number
}

interface Meteoro {
  x: number; y: number
  vx: number; vy: number
  comprimento: number
  opacidade: number
  vida: number
  vidaMax: number
}

interface Nebulosa {
  x: number; y: number
  raio: number
  cor: string
  opacidade: number
  escala: number
}

interface Planeta {
  x: number; y: number
  raio: number
  cor: string
  corBrilho: string
  angulo: number
  velocidadeAngulo: number
  distanciaBH: number
  foiEngolido: boolean
  trajetoriaX: number[]
  trajetoriaY: number[]
  opacidade: number
  temAneis: boolean
}

interface Espaconave {
  x: number; y: number
  vx: number; vy: number
  angulo: number
  tamanho: number
  cor: string
  pulsoMotor: number
  opacidade: number
  vida: number
  vidaMax: number
  foiEngolida: boolean
}

function criarMotorEspacial(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  let animFrameId: number
  let tempo = 0
  let largura = canvas.width
  let altura = canvas.height

  let buracoNegroX = largura * 0.28
  let buracoNegroY = altura * 0.52
  const RAIO_SINGULARIDADE = 38
  const RAIO_HORIZONTE = 90
  const RAIO_ACRESCAO = 200

  const galaxiaX = largura * 0.18
  const galaxiaY = altura * 0.22
  const RAIO_GALAXIA = Math.min(largura, altura) * 0.18

  const rastros: RastroEspaguete[] = []
  const estrelas: Estrela[] = []
  const meteoros: Meteoro[] = []
  const nebulosas: Nebulosa[] = []
  const planetas: Planeta[] = []
  const espaconaves: Espaconave[] = []

  const sementeBase = Math.random() * 1000000
  function ruidoPerlin(x: number, y: number, z: number): number {
    const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123
    return n - Math.floor(n)
  }

  function inicializarEstrelas() {
    estrelas.length = 0
    const total = Math.floor((largura * altura) / 3000)
    for (let i = 0; i < total; i++) {
      estrelas.push({
        x: Math.random() * largura,
        y: Math.random() * altura,
        tamanho: Math.random() * 1.8 + 0.2,
        brilho: Math.random(),
        velocidadeBrilho: (Math.random() * 0.008 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
        camada: Math.floor(Math.random() * 3),
      })
    }
  }

  function inicializarNebulosas() {
    nebulosas.length = 0
    const configs = [
      { x: largura * 0.12, y: altura * 0.65, raio: altura * 0.35, cor: '139, 92, 246', opacidade: 0.045 },
      { x: largura * 0.72, y: altura * 0.15, raio: altura * 0.28, cor: '59, 130, 246', opacidade: 0.04 },
      { x: largura * 0.55, y: altura * 0.78, raio: altura * 0.22, cor: '232, 98, 42', opacidade: 0.03 },
      { x: largura * 0.88, y: altura * 0.55, raio: altura * 0.25, cor: '16, 185, 129', opacidade: 0.035 },
      { x: largura * 0.35, y: altura * 0.1, raio: altura * 0.2, cor: '236, 72, 153', opacidade: 0.025 },
    ]
    configs.forEach(c => nebulosas.push({ ...c, escala: 1 }))
  }

  function inicializarPlanetas() {
    planetas.length = 0
    const configsPlanetas = [
      { raio: 14, cor: '#C4852A', corBrilho: '#E8A040', angulo: Math.random() * Math.PI * 2, velocidadeAngulo: 0.00018, distancia: RAIO_ACRESCAO * 2.8, temAneis: false },
      { raio: 20, cor: '#3A7AC4', corBrilho: '#5B9EE8', angulo: Math.random() * Math.PI * 2, velocidadeAngulo: 0.00011, distancia: RAIO_ACRESCAO * 4.1, temAneis: true },
      { raio: 10, cor: '#8B5CF6', corBrilho: '#A78BFA', angulo: Math.random() * Math.PI * 2, velocidadeAngulo: 0.00025, distancia: RAIO_ACRESCAO * 2.0, temAneis: false },
      { raio: 8, cor: '#E8622A', corBrilho: '#FF8C5A', angulo: Math.random() * Math.PI * 2, velocidadeAngulo: 0.0003, distancia: RAIO_ACRESCAO * 3.5, temAneis: false },
    ]
    configsPlanetas.forEach(c => {
      const bx = buracoNegroX + Math.cos(c.angulo) * c.distancia
      const by = buracoNegroY + Math.sin(c.angulo) * c.distancia
      planetas.push({
        x: bx, y: by,
        raio: c.raio, cor: c.cor, corBrilho: c.corBrilho,
        angulo: c.angulo,
        velocidadeAngulo: c.velocidadeAngulo,
        distanciaBH: c.distancia,
        foiEngolido: false,
        trajetoriaX: [],
        trajetoriaY: [],
        opacidade: 1,
        temAneis: c.temAneis,
      })
    })
  }

  function spawnarEspaconave() {
    if (espaconaves.filter(e => !e.foiEngolida).length >= 3) return
    const lado = Math.floor(Math.random() * 4)
    let x: number, y: number, vx: number, vy: number
    const speed = 0.18 + Math.random() * 0.25
    if (lado === 0) { x = -20; y = Math.random() * altura; vx = speed; vy = (Math.random() - 0.5) * 0.15 }
    else if (lado === 1) { x = largura + 20; y = Math.random() * altura; vx = -speed; vy = (Math.random() - 0.5) * 0.15 }
    else if (lado === 2) { x = Math.random() * largura; y = -20; vx = (Math.random() - 0.5) * 0.15; vy = speed }
    else { x = Math.random() * largura; y = altura + 20; vx = (Math.random() - 0.5) * 0.15; vy = -speed }
    const cores = ['#4AE8F0', '#F0D44A', '#C8E8A0', '#F04A9A', '#A0D4F0']
    const vidaMax = 18000 + Math.random() * 12000
    espaconaves.push({
      x, y, vx, vy,
      angulo: Math.atan2(vy, vx),
      tamanho: 5 + Math.random() * 4,
      cor: cores[Math.floor(Math.random() * cores.length)],
      pulsoMotor: 0,
      opacidade: 0,
      vida: 0,
      vidaMax,
      foiEngolida: false,
    })
  }

  function spawnarMeteoro() {
    if (meteoros.length >= 5) return
    const y = Math.random() * altura * 0.7
    const velocidade = 0.08 + Math.random() * 0.12
    meteoros.push({
      x: -100,
      y,
      vx: velocidade,
      vy: velocidade * 0.3,
      comprimento: 60 + Math.random() * 100,
      opacidade: 0.15 + Math.random() * 0.25,
      vida: 0,
      vidaMax: (largura + 200) / velocidade,
    })
  }

  function spawnarRastro() {
    if (rastros.length >= 22) return
    const angulo = Math.random() * Math.PI * 2
    const distancia = RAIO_HORIZONTE + Math.random() * RAIO_ACRESCAO * 1.2
    const x = buracoNegroX + Math.cos(angulo) * distancia
    const y = buracoNegroY + Math.sin(angulo) * distancia
    const coresRastros = [
      'rgba(232, 120, 42,',
      'rgba(200, 80, 180,',
      'rgba(80, 180, 232,',
      'rgba(180, 80, 80,',
      'rgba(120, 200, 80,',
      'rgba(255, 180, 60,',
      'rgba(100, 120, 255,',
    ]
    const cor = coresRastros[Math.floor(Math.random() * coresRastros.length)]
    rastros.push({
      pontos: [{ x, y }],
      cor,
      larguraMax: 1.2 + Math.random() * 1.8,
      vida: 0,
      vidaMax: 220 + Math.random() * 180,
      velocidade: { x: 0, y: 0 },
    })
  }

  function desenharGalaxia() {
    const t = tempo * 0.00003
    ctx.save()
    ctx.translate(galaxiaX, galaxiaY)

    const gradNucleo = ctx.createRadialGradient(0, 0, 0, 0, 0, RAIO_GALAXIA * 0.15)
    gradNucleo.addColorStop(0, 'rgba(255, 240, 180, 0.18)')
    gradNucleo.addColorStop(0.5, 'rgba(255, 200, 100, 0.08)')
    gradNucleo.addColorStop(1, 'rgba(255, 180, 80, 0)')
    ctx.beginPath()
    ctx.arc(0, 0, RAIO_GALAXIA * 0.15, 0, Math.PI * 2)
    ctx.fillStyle = gradNucleo
    ctx.fill()

    for (let braco = 0; braco < 4; braco++) {
      const anguloBase = (braco / 4) * Math.PI * 2 + t
      const totalPontos = 280

      for (let i = 0; i < totalPontos; i++) {
        const progresso = i / totalPontos
        const r = progresso * RAIO_GALAXIA
        const ang = anguloBase + progresso * Math.PI * 3.5
        const perturbacao = ruidoPerlin(i * 0.05, braco * 100, tempo * 0.0001) * 0.4 - 0.2
        const px = Math.cos(ang + perturbacao) * r
        const py = Math.sin(ang + perturbacao) * r * 0.45
        const opacidade = (1 - progresso) * 0.18 * (0.6 + ruidoPerlin(i * 0.1, braco * 50, tempo * 0.00005) * 0.4)
        const tamanho = (1 - progresso) * 2.5 + 0.3

        ctx.beginPath()
        ctx.arc(px, py, tamanho, 0, Math.PI * 2)
        ctx.fillStyle = braco % 2 === 0
          ? `rgba(200, 200, 255, ${opacidade})`
          : `rgba(255, 220, 150, ${opacidade * 0.8})`
        ctx.fill()
      }
    }

    const gradHalo = ctx.createRadialGradient(0, 0, RAIO_GALAXIA * 0.2, 0, 0, RAIO_GALAXIA)
    gradHalo.addColorStop(0, 'rgba(160, 180, 255, 0.04)')
    gradHalo.addColorStop(1, 'rgba(100, 120, 200, 0)')
    ctx.beginPath()
    ctx.ellipse(0, 0, RAIO_GALAXIA, RAIO_GALAXIA * 0.45, 0.3, 0, Math.PI * 2)
    ctx.fillStyle = gradHalo
    ctx.fill()

    ctx.restore()
  }

  function desenharNebulosas() {
    nebulosas.forEach((neb, i) => {
      const pulsacao = Math.sin(tempo * 0.0002 + i * 1.7) * 0.05
      const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.raio * (1 + pulsacao))
      grad.addColorStop(0, `rgba(${neb.cor}, ${neb.opacidade * 1.8})`)
      grad.addColorStop(0.4, `rgba(${neb.cor}, ${neb.opacidade})`)
      grad.addColorStop(1, `rgba(${neb.cor}, 0)`)
      ctx.beginPath()
      ctx.ellipse(
        neb.x, neb.y,
        neb.raio * (1.4 + pulsacao),
        neb.raio * (0.7 + pulsacao * 0.5),
        Math.sin(tempo * 0.00008 + i) * 0.4,
        0, Math.PI * 2
      )
      ctx.fillStyle = grad
      ctx.fill()
    })
  }

  function desenharBuracoNegro() {
    const t = tempo * 0.001

    for (let camada = 3; camada >= 0; camada--) {
      const raioExterno = RAIO_ACRESCAO * (0.5 + camada * 0.18)
      const rotacao = t * (0.8 - camada * 0.12)
      const espessura = 10 - camada * 1.5
      const calor = camada === 0 ? '255, 220, 120' : camada === 1 ? '255, 160, 60' : camada === 2 ? '200, 80, 30' : '140, 40, 80'

      ctx.save()
      ctx.translate(buracoNegroX, buracoNegroY)
      ctx.rotate(rotacao)
      ctx.beginPath()
      ctx.ellipse(0, 0, raioExterno, espessura, 0, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${calor}, ${0.15 - camada * 0.02})`
      ctx.lineWidth = espessura * 0.8
      ctx.stroke()
      ctx.restore()
    }

    const numArcos = 24
    for (let i = 0; i < numArcos; i++) {
      const angBase = (i / numArcos) * Math.PI * 2 + t * 0.3
      const raioArco = RAIO_HORIZONTE * (1.08 + (i % 3) * 0.12)
      const arcSpan = (0.15 + (i % 5) * 0.04) * (1 + Math.sin(t * 2.1 + i) * 0.1)
      const intensidade = 0.06 + Math.sin(t * 1.7 + i * 0.9) * 0.03

      ctx.beginPath()
      ctx.arc(buracoNegroX, buracoNegroY, raioArco, angBase, angBase + arcSpan)
      ctx.strokeStyle = `rgba(255, 240, 200, ${intensidade})`
      ctx.lineWidth = 0.8
      ctx.stroke()
    }

    const gradHawking = ctx.createRadialGradient(
      buracoNegroX, buracoNegroY, RAIO_HORIZONTE * 0.9,
      buracoNegroX, buracoNegroY, RAIO_HORIZONTE * 1.6
    )
    gradHawking.addColorStop(0, 'rgba(255, 220, 100, 0.22)')
    gradHawking.addColorStop(0.3, 'rgba(220, 100, 40, 0.12)')
    gradHawking.addColorStop(1, 'rgba(100, 20, 60, 0)')
    ctx.beginPath()
    ctx.arc(buracoNegroX, buracoNegroY, RAIO_HORIZONTE * 1.6, 0, Math.PI * 2)
    ctx.fillStyle = gradHawking
    ctx.fill()

    const gradHorizonte = ctx.createRadialGradient(
      buracoNegroX, buracoNegroY, RAIO_HORIZONTE * 0.6,
      buracoNegroX, buracoNegroY, RAIO_HORIZONTE * 1.05
    )
    gradHorizonte.addColorStop(0, 'rgba(0, 0, 0, 1)')
    gradHorizonte.addColorStop(0.6, 'rgba(0, 0, 0, 0.98)')
    gradHorizonte.addColorStop(1, 'rgba(0, 0, 0, 0.85)')
    ctx.beginPath()
    ctx.arc(buracoNegroX, buracoNegroY, RAIO_HORIZONTE * 1.05, 0, Math.PI * 2)
    ctx.fillStyle = gradHorizonte
    ctx.fill()

    ctx.beginPath()
    ctx.arc(buracoNegroX, buracoNegroY, RAIO_SINGULARIDADE, 0, Math.PI * 2)
    ctx.fillStyle = '#000000'
    ctx.fill()

    const pulso = Math.sin(t * 1.1) * 0.5 + 0.5
    ctx.beginPath()
    ctx.arc(buracoNegroX, buracoNegroY, RAIO_SINGULARIDADE + pulso * 4, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(60, 0, 20, ${0.4 + pulso * 0.3})`
    ctx.lineWidth = 3
    ctx.stroke()
  }

  function atualizarRastros() {
    for (let i = rastros.length - 1; i >= 0; i--) {
      const r = rastros[i]
      r.vida++

      const ultimo = r.pontos[r.pontos.length - 1]
      const dx = buracoNegroX - ultimo.x
      const dy = buracoNegroY - ultimo.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const gravidade = Math.min(dist < 10 ? 10 : 28000 / (dist * dist), 3.5)

      const sementeLocal = i * 1000 + sementeBase
      const pertX = (ruidoPerlin(tempo * 0.0002, sementeLocal, 0) - 0.5) * 0.6
      const pertY = (ruidoPerlin(tempo * 0.0002, sementeLocal, 100) - 0.5) * 0.6

      r.velocidade.x += (dx / dist) * gravidade * 0.012 + pertX * 0.1
      r.velocidade.y += (dy / dist) * gravidade * 0.012 + pertY * 0.1

      r.velocidade.x *= 0.995
      r.velocidade.y *= 0.995

      const novoX = ultimo.x + r.velocidade.x
      const novoY = ultimo.y + r.velocidade.y

      r.pontos.push({ x: novoX, y: novoY })

      const comprimentoMax = Math.floor(60 + (r.vida / r.vidaMax) * 80)
      if (r.pontos.length > comprimentoMax) {
        r.pontos.shift()
      }

      if (r.pontos.length > 2) {
        ctx.beginPath()
        ctx.moveTo(r.pontos[0].x, r.pontos[0].y)
        for (let j = 1; j < r.pontos.length; j++) {
          ctx.lineTo(r.pontos[j].x, r.pontos[j].y)
        }

        const progressoVida = r.vida / r.vidaMax
        const opacidadeBase = Math.min(progressoVida * 3, 1) * (1 - progressoVida * 0.7)

        const grad = ctx.createLinearGradient(
          r.pontos[0].x, r.pontos[0].y,
          r.pontos[r.pontos.length - 1].x, r.pontos[r.pontos.length - 1].y
        )
        grad.addColorStop(0, `${r.cor} 0)`)
        grad.addColorStop(0.3, `${r.cor} ${opacidadeBase * 0.4})`)
        grad.addColorStop(0.75, `${r.cor} ${opacidadeBase * 0.85})`)
        grad.addColorStop(1, `${r.cor} ${opacidadeBase})`)

        ctx.strokeStyle = grad

        const proximidade = 1 - Math.min(dist / RAIO_ACRESCAO, 1)
        ctx.lineWidth = r.larguraMax * (0.2 + proximidade * 0.8)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
      }

      if (dist < RAIO_SINGULARIDADE + 5 || r.vida >= r.vidaMax) {
        rastros.splice(i, 1)
      }
    }
  }

  function atualizarPlanetas() {
    planetas.forEach((p, idx) => {
      if (p.foiEngolido) return

      p.distanciaBH *= 0.99992 + Math.sin(tempo * 0.0001 + idx) * 0.000008
      p.angulo += p.velocidadeAngulo * (1 + (1 - p.distanciaBH / (RAIO_ACRESCAO * 4)) * 2)

      p.x = buracoNegroX + Math.cos(p.angulo) * p.distanciaBH
      p.y = buracoNegroY + Math.sin(p.angulo) * p.distanciaBH * 0.55

      p.trajetoriaX.push(p.x)
      p.trajetoriaY.push(p.y)
      if (p.trajetoriaX.length > 120) {
        p.trajetoriaX.shift()
        p.trajetoriaY.shift()
      }

      const distBH = Math.sqrt((p.x - buracoNegroX) ** 2 + (p.y - buracoNegroY) ** 2)
      if (distBH < RAIO_HORIZONTE * 1.1) {
        p.opacidade -= 0.04
        if (p.opacidade <= 0) {
          p.distanciaBH = RAIO_ACRESCAO * (2.5 + Math.random() * 2.5)
          p.angulo = Math.random() * Math.PI * 2
          p.opacidade = 1
        }
        return
      }

      if (p.trajetoriaX.length > 2) {
        ctx.beginPath()
        ctx.moveTo(p.trajetoriaX[0], p.trajetoriaY[0])
        for (let i = 1; i < p.trajetoriaX.length; i++) {
          ctx.lineTo(p.trajetoriaX[i], p.trajetoriaY[i])
        }
        const rgbCor = p.cor.replace('#', '').match(/.{2}/g)!.map(h => parseInt(h, 16))
        ctx.strokeStyle = `rgba(${rgbCor.join(',')}, ${0.08 * p.opacidade})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      ctx.globalAlpha = p.opacidade
      const gradPlaneta = ctx.createRadialGradient(p.x - p.raio * 0.3, p.y - p.raio * 0.3, 0, p.x, p.y, p.raio)
      gradPlaneta.addColorStop(0, p.corBrilho)
      gradPlaneta.addColorStop(0.6, p.cor)
      gradPlaneta.addColorStop(1, '#000000')
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2)
      ctx.fillStyle = gradPlaneta
      ctx.fill()

      if (p.temAneis) {
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.raio * 2.2, p.raio * 0.55, p.angulo * 0.1, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(200, 180, 120, ${0.3 * p.opacidade})`
        ctx.lineWidth = p.raio * 0.35
        ctx.stroke()
      }

      ctx.globalAlpha = 1
    })
  }

  function atualizarEspaconaves() {
    for (let i = espaconaves.length - 1; i >= 0; i--) {
      const e = espaconaves[i]
      if (e.foiEngolida) {
        espaconaves.splice(i, 1)
        continue
      }

      e.vida++
      e.pulsoMotor = (e.pulsoMotor + 0.08) % (Math.PI * 2)

      if (e.vida < 60) e.opacidade = e.vida / 60
      else if (e.vida > e.vidaMax - 60) e.opacidade = (e.vidaMax - e.vida) / 60

      const dx = buracoNegroX - e.x
      const dy = buracoNegroY - e.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < RAIO_ACRESCAO * 2.5) {
        const fuga = dist < RAIO_HORIZONTE * 2 ? -0.0004 : 0.00008
        e.vx += dx / dist * fuga
        e.vy += dy / dist * fuga
      }

      const idxEspaconave = espaconaves.indexOf(e)
      e.vx += (ruidoPerlin(tempo * 0.0001, idxEspaconave * 50, 0) - 0.5) * 0.005
      e.vy += (ruidoPerlin(tempo * 0.0001, idxEspaconave * 50, 100) - 0.5) * 0.005

      e.x += e.vx
      e.y += e.vy
      e.angulo = Math.atan2(e.vy, e.vx)

      if (dist < RAIO_SINGULARIDADE * 1.5) {
        e.foiEngolida = true
        continue
      }

      if (e.vida >= e.vidaMax) {
        espaconaves.splice(i, 1)
        continue
      }

      ctx.save()
      ctx.translate(e.x, e.y)
      ctx.rotate(e.angulo)
      ctx.globalAlpha = e.opacidade

      ctx.beginPath()
      ctx.moveTo(e.tamanho * 2, 0)
      ctx.lineTo(-e.tamanho, e.tamanho * 0.7)
      ctx.lineTo(-e.tamanho * 0.5, 0)
      ctx.lineTo(-e.tamanho, -e.tamanho * 0.7)
      ctx.closePath()
      ctx.fillStyle = e.cor
      ctx.fill()

      const pulso = Math.sin(e.pulsoMotor) * 0.4 + 0.6
      const gradMotor = ctx.createLinearGradient(-e.tamanho, 0, -e.tamanho * 3, 0)
      gradMotor.addColorStop(0, `rgba(255, 180, 60, ${0.9 * pulso * e.opacidade})`)
      gradMotor.addColorStop(0.4, `rgba(255, 100, 30, ${0.5 * pulso * e.opacidade})`)
      gradMotor.addColorStop(1, 'rgba(255, 60, 0, 0)')
      ctx.beginPath()
      ctx.moveTo(-e.tamanho, e.tamanho * 0.3)
      ctx.lineTo(-e.tamanho * (2.5 + pulso * 0.8), 0)
      ctx.lineTo(-e.tamanho, -e.tamanho * 0.3)
      ctx.fillStyle = gradMotor
      ctx.fill()

      ctx.restore()
      ctx.globalAlpha = 1
    }
  }

  function atualizarMeteoros() {
    for (let i = meteoros.length - 1; i >= 0; i--) {
      const m = meteoros[i]
      m.x += m.vx
      m.y += m.vy
      m.vida++

      if (m.vida >= m.vidaMax || m.x > largura + 150) {
        meteoros.splice(i, 1)
        continue
      }

      const grad = ctx.createLinearGradient(m.x - m.comprimento, m.y - m.comprimento * 0.3, m.x, m.y)
      grad.addColorStop(0, 'rgba(200, 220, 255, 0)')
      grad.addColorStop(0.6, `rgba(200, 220, 255, ${m.opacidade * 0.4})`)
      grad.addColorStop(1, `rgba(255, 255, 255, ${m.opacidade})`)
      ctx.beginPath()
      ctx.moveTo(m.x - m.comprimento, m.y - m.comprimento * 0.3)
      ctx.lineTo(m.x, m.y)
      ctx.strokeStyle = grad
      ctx.lineWidth = 0.8
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(m.x, m.y, 1.2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${m.opacidade * 0.9})`
      ctx.fill()
    }
  }

  function desenharEstrelas() {
    estrelas.forEach(est => {
      est.brilho += est.velocidadeBrilho
      if (est.brilho > 1 || est.brilho < 0) est.velocidadeBrilho *= -1
      est.brilho = Math.max(0, Math.min(1, est.brilho))

      const opacidade = 0.2 + est.brilho * 0.75
      const paralaxe = [1, 0.6, 0.3][est.camada]

      ctx.beginPath()
      ctx.arc(est.x, est.y, est.tamanho * paralaxe, 0, Math.PI * 2)
      ctx.fillStyle = est.camada === 2
        ? `rgba(255, 250, 240, ${opacidade})`
        : est.camada === 1
          ? `rgba(200, 220, 255, ${opacidade * 0.8})`
          : `rgba(150, 180, 255, ${opacidade * 0.5})`
      ctx.fill()
    })
  }

  function loop() {
    ctx.clearRect(0, 0, largura, altura)

    const gradFundo = ctx.createRadialGradient(
      buracoNegroX, buracoNegroY, 0,
      largura * 0.5, altura * 0.5, Math.max(largura, altura)
    )
    gradFundo.addColorStop(0, '#040412')
    gradFundo.addColorStop(0.35, '#060816')
    gradFundo.addColorStop(0.7, '#050712')
    gradFundo.addColorStop(1, '#020408')
    ctx.fillStyle = gradFundo
    ctx.fillRect(0, 0, largura, altura)

    desenharEstrelas()
    desenharNebulosas()
    desenharGalaxia()
    atualizarMeteoros()
    atualizarPlanetas()
    desenharBuracoNegro()
    atualizarRastros()
    atualizarEspaconaves()

    if (Math.random() < 0.06) spawnarRastro()
    if (Math.random() < 0.0015) spawnarMeteoro()
    if (Math.random() < 0.0008) spawnarEspaconave()

    tempo++
    animFrameId = requestAnimationFrame(loop)
  }

  function inicializar() {
    largura = canvas.width
    altura = canvas.height
    buracoNegroX = largura * 0.28
    buracoNegroY = altura * 0.52
    inicializarEstrelas()
    inicializarNebulosas()
    inicializarPlanetas()
    for (let i = 0; i < 8; i++) spawnarRastro()
    for (let i = 0; i < 2; i++) spawnarEspaconave()
    for (let i = 0; i < 2; i++) spawnarMeteoro()
  }

  inicializar()
  loop()

  return {
    destruir: () => cancelAnimationFrame(animFrameId),
    redimensionar: (w: number, h: number) => {
      canvas.width = w
      canvas.height = h
      inicializar()
    },
  }
}

export default function MotorEspacial({ modoObservar }: { modoObservar: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const motorRef = useRef<ReturnType<typeof criarMotorEspacial> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    motorRef.current = criarMotorEspacial(canvas)

    const redimensionar = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      motorRef.current?.redimensionar(canvas.width, canvas.height)
    }
    window.addEventListener('resize', redimensionar)
    return () => {
      window.removeEventListener('resize', redimensionar)
      motorRef.current?.destruir()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 0,
        filter: modoObservar ? 'brightness(1)' : 'brightness(0.92)',
      }}
      aria-hidden="true"
    />
  )
}
