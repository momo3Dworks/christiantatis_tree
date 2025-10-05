
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutUsContent() {
  return (
    <div className="PreviewContent p-4 md:p-8 text-foreground">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About Us</h1>
        </header>

        <main className="space-y-12">
          <section className="grid md:grid-cols-1 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-lg">
                  To spread the message of faith, hope, and love, fostering a global community of believers dedicated to spiritual growth and service. We aim to make the teachings of the Bible accessible to everyone, everywhere, empowering individuals to build a personal relationship with God.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
            <div className="grid grid-cols-1 gap-6">
              {[
                { title: "Faith", description: "Rooted in the teachings of Jesus Christ and the Holy Scripture." },
                { title: "Community", description: "Building strong, supportive relationships among believers." },
                { title: "Service", description: "Serving others with love and compassion, following Christ's example." },
                { title: "Integrity", description: "Upholding honesty and transparency in all our actions." },
                { title: "Worship", description: "Glorifying God in all that we do, in spirit and in truth." },
                { title: "Discipleship", description: "Helping believers grow in their faith and become followers of Christ." },
              ].map((value, index) => (
                <Card key={index}>
                    <CardHeader>
                        <CardTitle>{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{value.description}</p>
                    </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
