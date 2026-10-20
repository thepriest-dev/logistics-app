interface Event {
  id: string;
  status: string;
  notes: string;
  location: string;
  created_at: string;
  triggered_by: string;
}

interface TrackingTimelineProps {
  events: Event[];
}

export default function TrackingTimeline({ events }: TrackingTimelineProps) {
  // If no events, show message
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No tracking events available</p>
      </div>
    );
  }

  // Sort events by date (oldest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedEvents.map((event, index) => {
        // Format status label
        const statusLabel = event.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5"></div>
              {index < sortedEvents.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-300 min-h-[20px]"></div>
              )}
            </div>
            
            {/* Event content */}
            <div className="flex-1 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="font-medium text-gray-800">{statusLabel}</p>
                <p className="text-xs text-gray-400">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
              {event.notes && (
                <p className="text-sm text-gray-600 mt-0.5">{event.notes}</p>
              )}
              {event.location && (
                <p className="text-xs text-gray-400 mt-0.5">📍 {event.location}</p>
              )}
              {event.triggered_by && (
                <p className="text-xs text-gray-400">👤 {event.triggered_by}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}