
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StartBibleMeetingContent() {
  return (
    <div className="PreviewContent flex flex-col items-center justify-center p-4 md:p-8 text-foreground">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Start a Bible Meeting</h1>
        </header>

        <main className="space-y-12">
          <section className="grid grid-cols-1 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>What is a Church?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A church is not a building, but a community of believers united by their faith in Jesus Christ. It's a spiritual family dedicated to worship, fellowship, discipleship, ministry, and evangelism. The early church met in homes, and this model emphasizes close-knit relationships and mutual support.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>What is a Home Church?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A home church is a small group of believers who meet regularly in a home instead of a traditional church building. It focuses on creating an intimate environment for worship, prayer, Bible study, and fellowship, fostering deeper connections and personal growth in a comfortable, accessible setting.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-center mb-8">Related Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">YouTube Video {index + 1}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
