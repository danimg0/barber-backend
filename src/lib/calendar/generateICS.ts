import { createEvent } from "ics";

export function generateICS({
  title,
  description,
  location,
  startDate,
  endDate,
  organizer,
}: {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  organizer?: { name: string; email: string };
}): Promise<{ value: string }> {
  const event: any = {
    start: [
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
    ] as [number, number, number, number, number],
    end: [
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate(),
      endDate.getHours(),
      endDate.getMinutes(),
    ] as [number, number, number, number, number],
    title,
    description,
  };

  if (location) {
    event.location = location;
  }
  if (organizer) {
    event.organizer = organizer;
  }

  return new Promise((resolve, reject) => {
    createEvent(event, (error, value) => {
      if (error) reject(error);
      else resolve({ value });
    });
  });
}
