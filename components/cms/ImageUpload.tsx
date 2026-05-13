'use client'

import { useState } from 'react'
import { CldUploadWidget } from 'next-cloudinary'
import { ImagePlus, Trash, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  onRemove?: () => void
  buttonText?: string
}

interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
}

interface CloudinaryUploadResult {
  event?: string
  info?: CloudinaryUploadResponse | string
}

export function ImageUpload({ value, onChange, onRemove, buttonText = "Fazer upload de imagem" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onUpload = (result: CloudinaryUploadResult) => {
    setIsUploading(false)
    if (result.event === 'success' && result.info && typeof result.info !== 'string') {
      onChange(result.info.secure_url)
    }
  }

  const onError = (error: unknown) => {
    setIsUploading(false)
    console.error('Upload error:', error)
    toast({
      title: "Erro no upload",
      description: "Ocorreu um problema ao enviar a imagem. Tente novamente.",
      variant: "destructive"
    })
  }

  return (
    <div className="space-y-4 w-full">
      {value ? (
        <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-md border border-border">
          <Image
            fill
            src={value}
            alt="Upload"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {onRemove && (
            <div className="absolute top-2 right-2 z-10">
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                onClick={onRemove}
                title="Remover imagem"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <CldUploadWidget 
        signatureEndpoint="/api/upload/signature"
        uploadPreset="bigdatabet_cms"
        options={{
          maxFiles: 1,
          clientAllowedFormats: ["jpg", "png", "jpeg", "webp", "gif"],
          maxFileSize: 5000000, // 5MB
          theme: "minimal",
        }}
        onUploadAdded={() => setIsUploading(true)}
        onSuccess={onUpload}
        onError={onError}
      >
        {({ open }) => {
          return (
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => open?.()}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {buttonText}
                </>
              )}
            </Button>
          )
        }}
      </CldUploadWidget>
    </div>
  )
}
