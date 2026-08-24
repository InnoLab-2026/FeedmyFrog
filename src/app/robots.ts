import type { MetadataRoute } from 'next';

// This file is Next.js's native robots metadata route. At build time Next.js
// turns it into a static `/robots.txt`, which Vercel serves directly from its
// edge — no extra configuration, redirect, or `public/robots.txt` needed. To
// change crawler policy, edit the arrays below and redeploy; the generated
// file is picked up automatically by Vercel.
//
// Reutlingen University Connect is a hochschulinterne (institution-internal),
// authentication-gated platform. We do not want AI/LLM crawlers training on,
// indexing, or answering queries about its content. Robots.txt is advisory —
// well-behaved AI crawlers honour it — so it is paired with an
// `X-Robots-Tag: noai, noimageai` response header (see next.config.ts) and the
// fact that all real content sits behind a session cookie.

// Known AI / LLM / agent crawler user-agents to fully disallow. Kept as a
// maintainable list; add new bots here as vendors publish them.
const AI_CRAWLERS = [
  // OpenAI
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  // Anthropic
  'ClaudeBot',
  'Claude-Web',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  // Google (Gemini / Vertex AI training — separate from Googlebot)
  'Google-Extended',
  'GoogleOther',
  // Apple Intelligence
  'Applebot-Extended',
  // Common Crawl (widely used as an LLM training corpus)
  'CCBot',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Meta
  'FacebookBot',
  'meta-externalagent',
  'Meta-ExternalAgent',
  'meta-externalfetcher',
  'Meta-ExternalFetcher',
  // ByteDance / TikTok
  'Bytespider',
  'TikTokSpider',
  // Amazon
  'Amazonbot',
  // Cohere
  'cohere-ai',
  'cohere-training-data-crawler',
  // You.com
  'YouBot',
  // DuckDuckGo AI assist
  'DuckAssistBot',
  // Allen Institute for AI
  'AI2Bot',
  'AI2Bot-Dolma',
  // Other AI scrapers / dataset builders
  'Diffbot',
  'Omgilibot',
  'Omgili',
  'ImagesiftBot',
  'PetalBot',
  'Timpibot',
  'Kangaroo Bot',
  'Scrapy',
  'img2dataset',
  'ProRataInc',
  'QualifiedBot',
  'SemrushBot-OCOB',
  'Webzio-Extended',
  'iaskspider/2.0',
  'ISSCyberRiskCrawler',
  'VelenPublicWebCrawler',
  'FriendlyCrawler',
  'PanguBot',
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return {
    rules: [
      // Explicitly deny every known AI/LLM/agent crawler across the whole site.
      {
        userAgent: AI_CRAWLERS,
        disallow: '/',
      },
      // A catch-all for any AI crawler we have not enumerated yet: the wildcard
      // rule still permits conventional search engines to reach the public
      // legal pages while keeping the authenticated app out of scope.
      {
        userAgent: '*',
        allow: ['/login', '/impressum', '/datenschutz'],
        disallow: ['/', '/meine/', '/new', '/verify', '/verify-prompt', '/api/'],
      },
    ],
    ...(baseUrl ? { host: baseUrl } : {}),
  };
}
