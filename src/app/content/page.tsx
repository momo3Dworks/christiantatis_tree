import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContentPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="grid gap-16">
        {/* YouTube Section */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8">Our YouTube Channel</h2>
          <div className="text-center p-8 border rounded-lg">
            <p className="text-muted-foreground">YouTube API integration coming soon to display latest videos.</p>
          </div>
        </section>

        {/* Spotify Section */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8">Latest Podcasts on Spotify</h2>
          <div className="text-center p-8 border rounded-lg">
            <p className="text-muted-foreground">Spotify API integration coming soon to display latest podcasts.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
