import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, FileText, Paperclip, X, Loader2 } from 'lucide-react'
import { uploadArquivo, isPdfUrl } from '@/services/cambui'
import { toast } from 'sonner'

interface AnexoPickerProps {
  /** Chamado com a URL pública do arquivo enviado */
  onUploaded: (url: string, tipo: 'foto' | 'pdf') => void
  pasta?: string
  label?: string
  className?: string
}

/**
 * Botão que pergunta "Foto ou PDF?" e envia o arquivo escolhido para o sistema.
 */
export const AnexoPicker: React.FC<AnexoPickerProps> = ({
  onUploaded,
  pasta = 'geral',
  label = 'Anexar foto ou PDF',
  className = '',
}) => {
  const [escolhendo, setEscolhendo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const fotoRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setEnviando(true)
    try {
      const { url, tipo } = await uploadArquivo(file, pasta)
      onUploaded(url, tipo)
      toast.success(tipo === 'pdf' ? 'PDF anexado!' : 'Foto anexada!')
    } catch (err: any) {
      toast.error('Erro ao enviar arquivo: ' + (err?.message || 'tente novamente'))
    } finally {
      setEnviando(false)
      setEscolhendo(false)
    }
  }

  return (
    <div className={className}>
      <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input
        ref={pdfRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFile}
      />

      {enviando ? (
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full h-12 text-xs font-bold gap-2"
        >
          <Loader2 className="w-4 h-4 animate-spin" /> Enviando arquivo...
        </Button>
      ) : !escolhendo ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setEscolhendo(true)}
          className="w-full h-12 text-xs font-bold gap-2 border-dashed border-2"
        >
          <Paperclip className="w-4 h-4 text-amber-500" />
          {label}
        </Button>
      ) : (
        <div className="border-2 border-amber-500/40 rounded-xl p-3 space-y-2 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">O que você quer enviar?</span>
            <button type="button" onClick={() => setEscolhendo(false)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => fotoRef.current?.click()}
              className="h-12 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold gap-2"
            >
              <Camera className="w-4 h-4" /> Foto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => pdfRef.current?.click()}
              className="h-12 font-bold gap-2 border-2"
            >
              <FileText className="w-4 h-4 text-red-600" /> PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Miniatura de um anexo: imagem ou ícone de PDF (abre em nova aba) */
export const AnexoThumb: React.FC<{ url: string; onRemove?: () => void; size?: string }> = ({
  url,
  onRemove,
  size = 'w-20 h-20',
}) => (
  <div className={`relative ${size} rounded-lg overflow-hidden border shrink-0 bg-muted`}>
    <a href={url} target="_blank" rel="noreferrer" className="block w-full h-full">
      {isPdfUrl(url) ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
          <FileText className="w-7 h-7 text-red-600" />
          <span className="text-[10px] font-bold">PDF</span>
        </div>
      ) : (
        <img src={url} alt="Anexo" className="w-full h-full object-cover" />
      )}
    </a>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
      >
        <X className="w-3 h-3 text-white" />
      </button>
    )}
  </div>
)
