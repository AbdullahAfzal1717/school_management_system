"use client"

import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar'
import moment from 'moment'
import "react-big-calendar/lib/css/react-big-calendar.css"
import { useState } from 'react'
import { calendarEvents } from '@/lib/data'

const localizer = momentLocalizer(moment)



const BigCalendar = () => {
    const [view, setView] = useState<View>(Views.WORK_WEEK)

    const handleViewChange =(selectedView:View)=>{
setView(selectedView)
    }
  return (
        <Calendar
      localizer={localizer}
      events={calendarEvents}
      startAccessor="start"
      endAccessor="end"
      views={["work_week","day"]}
      view={view}
      onView={handleViewChange}
      style={{ height: "98%" }}
      min={new Date(2025,4,10,8,0,0 )}
      max={new Date(2025,5,10,17,0,0 )}
    />
  )
}

export default BigCalendar