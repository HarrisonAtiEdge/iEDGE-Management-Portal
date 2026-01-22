// lib/eventSchedule.ts

export type DayKey = "day0" | "day1" | "day2";

export type Slot = {
  time: string; // e.g. "04:00 PM"
  title: string;
  detail?: string;
  duration?: string;
  location?: string;
};

export const EVENT_DATES: Record<DayKey, string> = {
  day0: "2025-12-10",
  day1: "2025-12-11",
  day2: "2025-12-12",
};


export const schedule: Record<DayKey, Slot[]> = {
  day0: [
    {
      time: "10:30 AM",
      title: "Check In ",
      duration: "5.5 hours",
      detail: "Check-in and welcome distribution for guests.",
      location: "Zevar Hall",
    },
    {
      time: "01:00 PM",
      title: "Lunch",
      duration: "2 hr 30 min",
      detail: "Lunch served for arriving guests.",
    },
    {
      time: "05:00 PM",
      title: "FLC Got Talent",
      duration: "2 hours",
      detail: "Engagement activities and talent show.",
    },
    {
      time: "08:00 PM",
      title: "Musical Night",
      duration: "2 hours",
      detail: "Musical night for all participants.",
    },
  ],

  day1: [
       {
      time: "07:30 AM",
      title: "Breakfast",
      duration: "2 hour",
      detail: "Morning breakfast for all participants.",
        location: "Naida Cafe",
      
    },
    {
      time: "09:00 AM",
      title: "Conference",
      duration: "4 hr 20 min",
      detail: "Main conference sessions and presentations.",
    },
    {
      time: "01:45 PM",
      title: "Lunch Break",
      duration: "1 hr 10 min",
      detail: "Lunch served for attendees.",
    },
    {
      time: "02:30 PM",
      title: "Break",
      duration: "2 hr 30 min",
      detail: "Relaxation and preparation time before the gala.",
    },
    {
      time: "05:00 PM",
      title: "Award Gala",
      duration: "3 hr 00 min",
      detail: "Awards ceremony and recognition event.",
    },
    {
      time: "08:00 PM",
      title: "Dinner",
      duration: "1 hr 30 min",
      detail: "Dinner for all guests after the award gala.",
    },
    {
      time: "09:30 PM",
      title: "Concert",
      duration: "2 hr 30 min",
      detail: "Musical concert to conclude the night.",
    },
  ],

  day2: [
    {
      time: "07:30 AM",
      title: "Breakfast",
      duration: "2 hour",
      detail: "Morning breakfast for all participants.",
       location: "Naida Cafe",
    },
    {
      time: "09:30 AM",
      title: "Check Out",
      duration: "2 hr 30 min",
      detail: "Departure and check-out from the venue.",
       location: "Zevar Hall",
    },
  ],
};



export const longSchedule: Record<DayKey, Slot[]> = {
  day0: [
    {
      time: "10:30 AM",
      title: "Check-in/Welcome Pack Distribution",
      location: "Zevar Hall",
    },
    {
      time: "01:00 PM",
      title: "Lunch for Arriving Guests",
      
      location: "Foyer & Shazia Hall",
    },
    {
      time: "05:00 PM",
      title: "Hi-tea",
      
      location: "Foyer & Shazia Hall",
    },
    {
      time: "05:30 PM",
      title: "Friesland's Got Talent",
      
      location: "Chiar Hall",
    },
    {
      time: "08:00 PM",
      title: "Musical Night",
      
      location: "Chiar Hall",
    },
    {
      time: "09:30 PM",
      title: "Dinner",
     
      location: "Foyer & Shazia Hall",
    },
  ],

  day1: [
    {
      time: "07:30 AM",
      title: "Breakfast",
      duration: "1 hr 30 min",
      
      location: "Nadia Cafe",
    },
    {
      time: "09:00 AM",
      title: "Assemble for Conference",
      duration: "30 min",
      
      location: "Chiar Hall",
    },
    {
      time: "09:30 AM",
      title: "Tilawat & National Anthem + Safety Pause",
      duration: "10 min",
      
      location: "Chiar Hall",
    },
    {
      time: "09:40 AM",
      title: "Kick off by the host",
      duration: "5 min",
      
      location: "Chiar Hall",
    },
    {
      time: "09:45 AM",
      title: "Summit Commencement by Director Sales",
      duration: "5 min",
      
      location: "Chiar Hall",
    },
    {
      time: "09:50 AM",
      title: "Keynote by MD FCEPL",
      duration: "40 min",
      
      location: "Chiar Hall",
    },
    {
      time: "10:30 AM",
      title: "Deputy MD's Address",
      duration: "15 min",
      
      location: "Chiar Hall",
    },
    {
      time: "10:45 AM",
      title: "Director Finance's Address",
      duration: "15 min",
      
      location: "Chiar Hall",
    },
    {
      time: "11:00 AM",
      title: "Director HR's Address",
      duration: "10 min",
      
      location: "Chiar Hall",
    },
    {
      time: "11:10 AM",
      title: "Director Marketing's Address",
      duration: "10 min",
      
      location: "Chiar Hall",
    },
    {
      time: "11:20 AM",
      title: "Director Supply Chain's Address",
      duration: "10 min",
      
      location: "Chiar Hall",
    },
    {
      time: "11:30 AM",
      title: "Director Agricultural Business's Address",
      duration: "10 min",
      
      location: "Chiar Hall",
    },
    {
      time: "11:40 AM",
      title: "Director Manufacturing's Address",
      duration: "10 min",
      
      location: "Chiar Hall",
    },
    {
      time: "11:50 AM",
      title: "CLDS Head's Address",
      duration: "10 min",
      
      location: "Chiar Hall",
    },
    {
      time: "12:00 PM",
      title: "Head of Regulatory & Compliance's Address",
      duration: "10 min",
      
      location: "Chiar Hall",
    },
    {
      time: "12:10 PM",
      title: "Message from Director Manufacturing",
      duration: "5 min",
      
      location: "Chiar Hall",
    },
    {
      time: "12:15 PM",
      title: "Head of CSC's Address",
      duration: "10 min",
      
      location: "Chiar Hall",
    },
    {
      time: "12:25 PM",
      title: "Message from Director Agri Business",
      duration: "5 min",
      
      location: "Chiar Hall",
    },
    {
      time: "12:30 PM",
      title: "Keynote by Director Sales",
      duration: "35 min",
      
      location: "Chiar Hall",
    },
    {
      time: "01:05 PM",
      title: "GM Sales Ice Cream to rally the IC Team",
      duration: "5 min",
      
      location: "Chiar Hall",
    },
    {
      time: "01:10 PM",
      title: "GM Sales Dairy to rally the Dairy Team",
      duration: "5 min",
      
      location: "Chiar Hall",
    },
    {
      time: "01:15 PM",
      title: "Group Pictures",
      duration: "30 min",
      
      location: "Chiar Hall",
    },
    {
      time: "01:45 PM",
      title: "Lunch",
      duration: "1 hr",
      
      location: "Foyer & Shazia Hall",
    },
    {
      time: "02:45 PM",
      title: "Session Break",
      duration: "2 hr 15 min",
      
      location: "Foyer & Shazia Hall",
    },
    {
      time: "05:00 PM",
      title: "Hi Tea + Team to Reassemble for Gala Night",
      duration: "30 min",
      
      location: "Foyer & Shazia Hall",
    },
    {
      time: "05:30 PM",
      title: "Director Sales to kick-off the Ceremony",
      duration: "5 min",
      
      location: "Chiar Hall",
    },
    {
      time: "05:45 PM",
      title: "Awards (Part 1)",
      duration: "1 hr",
      
      location: "Chiar Hall",
    },
    {
      time: "06:45 PM",
      title: "Engagement Activity",
      duration: "30 min",
      
      location: "Chiar Hall",
    },
    {
      time: "07:15 PM",
      title: "Honouring Dr Nasir for his invaluable service",
      duration: "25 min",
      
      location: "Chiar Hall",
    },
    {
      time: "07:40 PM",
      title: "Awards (Part 2)",
      duration: "30 min",
      
      location: "Chiar Hall",
    },
    {
      time: "08:10 PM",
      title: "Engagement Activity",
      duration: "30 min",
      
      location: "Chiar Hall",
    },
    {
      time: "08:40 PM",
      title: "Awards (Part 3)",
      duration: "25 min",
      
      location: "Chiar Hall",
    },
    {
      time: "09:05 PM",
      title: "Close of Event",
      duration: "10 min",
      
      location: "Chiar Hall",
    },
    {
      time: "09:15 PM",
      title: "Dinner",
      duration: "1 hr",
      
      location: "Foyer & Shazia Hall",
    },
    {
      time: "10:15 PM",
      title: "Concert",
      duration: "1 hr 30 min",
      
      location: "Chiar Hall",
    },
  ],

  day2: [
    {
      time: "07:30 AM",
      title: "Breakfast",
      duration: "2 hr",
      
      location: "Nadia Cafe",
    },
    {
      time: "09:30 AM",
      title: "Check-out",
      duration: "2 hr 30 min",
      
      location: "Reception",
    },
  ],
};


/**
 * Text used before the first event starts.
 * Change this here only and the countdown will update.
 */
export const PRE_EVENT_LABEL = "Time until Event";