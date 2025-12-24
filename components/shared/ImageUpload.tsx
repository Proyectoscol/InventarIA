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
    <div className="space-y-2">
      {preview ? (
        <div className="relative inline-block">
          <img 
            src={preview} 
            alt="Preview" 
            className="rounded-lg border object-cover w-24 h-24"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {loading ? "Procesando..." : "Seleccionar Imagen"}
        </Button>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        JPG, PNG, WebP. Máx 5MB. Se comprimirá automáticamente.
      </p>
    </div>
  )
}

