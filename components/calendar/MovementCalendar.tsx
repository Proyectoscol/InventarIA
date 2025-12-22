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
    const selectedDate = new Date(year, month, day)
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario de Movimientos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[150px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Días de la semana */}
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-semibold p-2 text-muted-foreground">
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
                  aspect-square p-2 rounded-md border transition-colors
                  hover:bg-accent hover:text-accent-foreground
                  ${hasActivity ? "bg-blue-50 border-blue-200" : "border-gray-200"}
                  ${todayClass}
                  flex flex-col items-center justify-center relative
                `}
              >
                <span className={`text-sm ${isToday(day) ? "font-bold text-primary" : ""}`}>
                  {day}
                </span>
                {hasActivity && (
                  <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

