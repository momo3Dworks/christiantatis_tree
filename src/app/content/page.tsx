import { Youtube, Podcast } from "lucide-react";

export default function ContentPage() {
  return (
    <div className="min-h-screen text-black pt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Content Hub</h1>
          <p className="text-lg text-gray-600">
            Watch our latest sermons and listen to our podcasts.
          </p>
        </div>

        {/* YouTube Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <Youtube size={40} className="text-red-600" />
            <h2 className="text-4xl font-semibold">Our YouTube Channel</h2>
          </div>
          <div className="p-8 bg-white/60 backdrop-blur-sm rounded-lg shadow-lg text-center">
            <p className="text-xl">
              YouTube API integration will be here to display our channel's
              videos.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video bg-gray-200 rounded-md animate-pulse"></div>
              ))}
            </div>
          </div>
        </section>

        {/* Spotify Section */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <Podcast size={40} className="text-green-500" />
            <h2 className="text-4xl font-semibold">Our Spotify Podcast</h2>
          </div>
          <div className="p-8 bg-white/60 backdrop-blur-sm rounded-lg shadow-lg text-center">
            <p className="text-xl">
              Spotify API integration will be here to show the latest podcast
              episodes.
            </p>
            <div className="mt-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-md animate-pulse"></div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
