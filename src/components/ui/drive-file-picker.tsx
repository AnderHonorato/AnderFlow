'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DriveFile {
  name: string
  url: string
  mimeType: string
}

interface DriveFilePickerProps {
  onSelect: (file: DriveFile) => void
  className?: string
  projectId?: string
}

export function DriveFilePicker({ onSelect, className, projectId }: DriveFilePickerProps) {
  const [loading, setLoading] = useState(false)
  const [pickerReady, setPickerReady] = useState(false)

  const loadGoogleApi = useCallback(() => {
    if (pickerReady) return
    setLoading(true)

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      const gapi = (window as any).gapi
      if (!gapi) {
        toast.error('Google API nao disponivel')
        setLoading(false)
        return
      }

      gapi.load('picker', () => {
        setPickerReady(true)
        setLoading(false)
      })
    }
    script.onerror = () => {
      toast.error('Erro ao carregar Google API')
      setLoading(false)
    }
    document.head.appendChild(script)
  }, [pickerReady])

  const createPicker = useCallback((token: string) => {
    const google = (window as any).google
    if (!google?.picker) {
      toast.error('Google Picker API nao carregada')
      return
    }

    const picker = new google.picker.PickerBuilder()
      .addView(google.picker.ViewId.DOCS)
      .setOAuthToken(token)
      .setCallback((data: any) => {
        if (data.action === google.picker.Action.PICKED) {
          const doc = data.docs?.[0]
          if (doc) {
            onSelect({
              name: doc.name,
              url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
              mimeType: doc.mimeType || 'application/octet-stream',
            })
            toast.success(`Arquivo "${doc.name}" vinculado!`)
          }
        }
      })
      .build()

    picker.setVisible(true)
  }, [onSelect])

  const openPicker = useCallback(() => {
    const google = (window as any).google
    if (!google?.picker) {
      loadGoogleApi()
      return
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

    if (!clientId) {
      const docId = prompt('Cole o link publico do Google Drive (Docs, Sheets, Slides):')
      if (docId) {
        let url = docId
        let extractedId = ''
        const idMatch = docId.match(/[-\w]{25,}/)
        if (idMatch) {
          extractedId = idMatch[0]
          url = `https://drive.google.com/file/d/${extractedId}/view`
        }
        const fileName = prompt('Nome do arquivo:') || 'Documento Google Drive'
        onSelect({
          name: fileName,
          url,
          mimeType: 'application/vnd.google-apps.document',
        })
        toast.success('Link do Drive vinculado!')
      }
      return
    }

    const oauthToken = google.accounts?.oauth2?.getAuthResponse?.()?.access_token

    if (!oauthToken) {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${window.location.origin}/api/files/drive-callback&response_type=token&scope=https://www.googleapis.com/auth/drive.readonly`
      const authWindow = window.open(authUrl, '_blank', 'width=600,height=700')

      if (!authWindow) {
        toast.error('Popup bloqueado. Permita popups para usar Google Drive.')
        return
      }

      const checkToken = setInterval(() => {
        try {
          const token = (window as any).__googleToken
          if (token) {
            clearInterval(checkToken)
            createPicker(token)
          }
        } catch {}
      }, 500)

      setTimeout(() => {
        clearInterval(checkToken)
        toast.error('Tempo de autenticacao expirado')
      }, 120000)
      return
    }

    createPicker(oauthToken)
  }, [onSelect, loadGoogleApi, createPicker])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openPicker}
      disabled={loading}
      className={className}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1.5">
        <path d="M7.487 1l6.912 12H14.4L7.487 1z" fill="#4285F4"/>
        <path d="M9.6 7.444L2.688 19.296C2.347 19.879 2.8 21 3.467 21h13.845c.67 0 1.12-1.121.78-1.704L11.18 7.444c-.341-.576-1.237-.576-1.58 0z" fill="#34A853"/>
        <path d="M15.467 14.534l-3.467-6 3.467-6c.34-.576 1.237-.576 1.579 0l6.913 12c.34.583-.11 1.304-.78 1.304h-6.933" fill="#FBBC04"/>
        <path d="M21.78 20.779c.34-.583-.11-1.304-.78-1.304H8.533l3.467 6h6.934" fill="#EA4335"/>
      </svg>
      {loading ? 'Carregando...' : 'Vincular Google Drive'}
    </Button>
  )
}
