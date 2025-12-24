"use client"

import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { useState, useEffect } from "react"

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CurrencyInput({ 
  value, 
  onChange, 
  placeholder,
  disabled = false,
  className
}: CurrencyInputProps) {
  // Función para formatear números con coma como separador de miles
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }
  
  const [displayValue, setDisplayValue] = useState(
    value ? formatNumber(value) : ""
  )
  
  useEffect(() => {
    if (value === 0) {
      setDisplayValue("")
    } else {
      setDisplayValue(formatNumber(value))
    }
  }, [value])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Permitir números y comas (para separadores de miles)
    const numericValue = input.replace(/[^0-9,]/g, "").replace(/,/g, "")
    
    if (numericValue === "") {
      setDisplayValue("")
      onChange(0)
      return
    }
    
    const number = parseInt(numericValue)
    setDisplayValue(formatNumber(number))
    onChange(number)
  }
  
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        $
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder || "1,000,000"}
        disabled={disabled}
        className={`pl-7 ${className || ""}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
        COP
      </span>
    </div>
  )
}

