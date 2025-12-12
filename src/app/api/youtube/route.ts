import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const channelHandle = '@christianitatis2106';
        const channelUrl = `https://www.youtube.com/${channelHandle}`;

        // 1. Fetch the channel page to extract the Channel ID
        const channelPageResponse = await fetch(channelUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (!channelPageResponse.ok) {
            return NextResponse.json({ error: 'Failed to fetch channel page' }, { status: 500 });
        }

        const channelPageText = await channelPageResponse.text();

        // Attempt to find channelId in meta tags or JSON config
        // Pattern 1: <meta itemprop="channelId" content="UC..."
        // Pattern 2: "externalId":"UC..."
        const channelIdMatch = channelPageText.match(/itemprop="channelId" content="(UC[\w-]+)"/) ||
            channelPageText.match(/"externalId":"(UC[\w-]+)"/);

        const channelId = channelIdMatch ? channelIdMatch[1] : null;

        if (!channelId) {
            console.error('Could not extract channel ID');
            return NextResponse.json({ error: 'Could not extract channel ID' }, { status: 500 });
        }

        // 2. Fetch the RSS feed using the extracted Channel ID
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const rssResponse = await fetch(rssUrl);

        if (!rssResponse.ok) {
            return NextResponse.json({ error: 'Failed to fetch RSS feed' }, { status: 500 });
        }

        const rssText = await rssResponse.text();

        // 3. Simple XML parsing (Regex-based to avoid dependencies)
        const videos = [];
        // Regex to match <entry> blocks
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;

        while ((match = entryRegex.exec(rssText)) !== null) {
            const entryContent = match[1];

            const idMatch = entryContent.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
            const titleMatch = entryContent.match(/<title>(.*?)<\/title>/);

            if (idMatch && titleMatch) {
                videos.push({
                    id: idMatch[1],
                    title: titleMatch[1].replace('<![CDATA[', '').replace(']]>', '') // Clean up CDATA if present
                });
            }
        }

        return NextResponse.json({ videos });

    } catch (error) {
        console.error('Error fetching videos:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
