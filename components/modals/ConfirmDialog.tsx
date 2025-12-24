"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Trash2, Archive, Info } from "lucide-react"

export type ConfirmDialogType = "delete" | "soft-delete" | "hard-delete" | "warning" | "info"

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  type?: ConfirmDialogType
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  type = "warning",
  confirmText,
  cancelText = "Cancelar",
  loading = false
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  const getIcon = () => {
    switch (type) {
      case "delete":
      case "hard-delete":
        return <Trash2 className="h-5 w-5 text-red-600" />
      case "soft-delete":
        return <Archive className="h-5 w-5 text-orange-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getConfirmButtonVariant = () => {
    switch (type) {
      case "delete":
      case "hard-delete":
        return "destructive"
      case "soft-delete":
        return "default"
      default:
        return "default"
    }
  }

  const getDefaultConfirmText = () => {
    switch (type) {
      case "delete":
        return "Eliminar"
      case "hard-delete":
        return "Eliminar Definitivamente"
      case "soft-delete":
        return "Mover a Papelera"
      case "warning":
        return "Continuar"
      case "info":
        return "Aceptar"
      default:
        return "Confirmar"
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel disabled={loading} className="w-full sm:w-auto">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={`w-full sm:w-auto ${
              type === "hard-delete" || type === "delete"
                ? "bg-red-600 hover:bg-red-700"
                : type === "soft-delete"
                ? "bg-orange-600 hover:bg-orange-700"
                : ""
            }`}
          >
            {loading ? "Procesando..." : (confirmText || getDefaultConfirmText())}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

