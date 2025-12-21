"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { compressImage } from "@/lib/image-compression"
import Image from "next/image"

interface ImageUploadProps {
  value?: string
  onChange: (base64: string | null) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validar tipo
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen válida")
      return
    }
    
    // Validar tamaño (max 5MB antes de comprimir)
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es muy grande (máx 5MB)")
      return
    }
    
    setLoading(true)
    try {
      const compressed = await compressImage(file)
      setPreview(compressed)
      onChange(compressed)
    } catch (error) {
      console.error("Error procesando imagen:", error)
      alert("Error al procesar la imagen")
    } finally {
      setLoading(false)
    }
  }
  
  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }
  
  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative w-full max-w-xs">
          <img 
            src={preview} 
            alt="Preview" 
            className="rounded-lg border object-cover w-full h-48"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Arrastra una imagen o haz clic para seleccionar
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
          >
            {loading ? "Procesando..." : "Seleccionar Imagen"}
          </Button>
        </div>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        Formatos: JPG, PNG, WebP. Máx 5MB. Se comprimirá automáticamente.
      </p>
    </div>
  )
}

