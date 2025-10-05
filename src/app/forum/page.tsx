import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ForumPage() {
  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold mb-4">Community Forum</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        To foster a vibrant and moderated community discussion, we invite you to join our official subreddit.
      </p>
      <Button asChild size="lg">
        <Link href="https://www.reddit.com" target="_blank" rel="noopener noreferrer">
          Go to Reddit Forum
        </Link>
      </Button>
    </div>
  );
}
