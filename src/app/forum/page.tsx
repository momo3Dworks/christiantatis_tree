import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ForumPage() {
  return (
    <div className="min-h-screen text-black flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold mb-4">Community Forum</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl">
          Join the conversation on our community forum. For now, our discussions are hosted on Reddit. Click the button below to join in!
        </p>
        <Link href="https://www.reddit.com" target="_blank" rel="noopener noreferrer">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Go to Reddit Forum <ArrowRight className="ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
