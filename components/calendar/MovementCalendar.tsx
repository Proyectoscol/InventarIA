"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

interface MovementCalendarProps {
  companyId: string
  onDateSelect: (date: Date) => void
}

export function MovementCalendar({ companyId, onDateSelect }: MovementCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [daysWithActivity, setDaysWithActivity] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    fetchActivityDays()
  }, [year, month, companyId])

  const fetchActivityDays = async () => {
    if (!companyId) return
    
    setLoading(true)
    try {
      const res = await fetch(
        `/api/movements/calendar?companyId=${companyId}&year=${year}&month=${month + 1}`
      )
      if (res.ok) {
        const data = await res.json()
        setDaysWithActivity(new Set(data.daysWithActivity))
      }
    } catch (error) {
      console.error("Error cargando días con actividad:", error)
    } finally {
      setLoading(false)
    }
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDateClick = (day: number) => {
    // Crear fecha en zona horaria local, pero representando el día en Colombia
    const selectedDate = new Date(year, month, day)
    // Ajustar para que represente el día correcto en Colombia
    selectedDate.setHours(12, 0, 0, 0) // Usar mediodía para evitar problemas de zona horaria
    onDateSelect(selectedDate)
  }

  const today = new Date()
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Card className="min-w-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Calendario de Movimientos
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-sm sm:text-base min-w-[120px] sm:min-w-[150px] text-center">
                {monthNames[month]} {year}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="grid grid-cols-7 gap-1 min-w-[280px]">
          {/* Días de la semana */}
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-semibold p-1 sm:p-2 text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Días vacíos al inicio */}
          {Array.from({ length: firstDayWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Días del mes */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const hasActivity = daysWithActivity.has(day)
            const todayClass = isToday(day) ? "ring-2 ring-primary" : ""

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square p-1 sm:p-2 rounded-md border transition-colors
                  hover:bg-accent hover:text-accent-foreground
                  ${hasActivity ? "bg-blue-50 border-blue-200" : "border-gray-200"}
                  ${todayClass}
                  flex flex-col items-center justify-center relative
                  min-w-[32px] sm:min-w-[40px]
                `}
              >
                <span className={`text-xs sm:text-sm ${isToday(day) ? "font-bold text-primary" : ""}`}>
                  {day}
                </span>
                {hasActivity && (
                  <span className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

