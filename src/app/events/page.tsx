import { Calendar } from "lucide-react";

export default function EventsPage() {
  return (
    <div className="min-h-screen text-black pt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Upcoming Events</h1>
          <p className="text-lg text-gray-600">
            Join us for worship, fellowship, and community events.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((event) => (
            <div
              key={event}
              className="bg-white/60 backdrop-blur-sm rounded-lg shadow-lg p-6 hover:shadow-primary/20 transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <Calendar className="text-primary mr-4" />
                <div>
                  <h2 className="text-2xl font-semibold">Event Title {event}</h2>
                  <p className="text-gray-500">Date & Time</p>
                </div>
              </div>
              <p className="text-gray-700">
                A brief description of the event will go here. It will provide
                details about the purpose, activities, and any special guests.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
