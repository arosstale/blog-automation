import { GoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

const glm = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const blogPostSchema = z.object({
  title: z.string(),
  slug: z.string(),
  metaTitle: z.string().max(60),
  metaDescription: z.string().min(120).max(160),
  content: z.string(),
  headings: z.array(z.object({
    level: z.number().min(1).max(6),
    text: z.string(),
  })),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  internalLinks: z.array(z.string()),
  externalLinks: z.array(z.object({
    url: z.string().url(),
    text: z.string(),
  })),
  wordCount: z.number(),
  readabilityScore: z.number().min(0).max(100),
});

export async function generateBlogPost(params: {
  topic: string;
  keyword: string;
  tone?: 'professional' | 'casual' | 'technical' | 'conversational';
  audience?: string;
  includeData?: boolean;
  wordCount?: number;
}) {
  const {
    topic,
    keyword,
    tone = 'professional',
    audience = 'general audience',
    includeData = true,
    wordCount = 2000,
  } = params;

  const systemPrompt = `You are an expert SEO content writer and copywriter. Your posts consistently rank on page 1 of Google because:

1. You provide genuine value, not fluff
2. You include current 2025 data and real examples
3. You use natural, conversational language (no keyword stuffing)
4. You match the specified tone perfectly
5. You optimize for featured snippets
6. You structure content with clear H1, H2, H3 headings
7. You include actionable, specific advice
8. You add relevant statistics and studies when applicable

Write content that real people actually want to read and share.`;

  const userPrompt = `Write a comprehensive, SEO-optimized blog post.

TOPIC: ${topic}
TARGET KEYWORD: "${keyword}"
TONE: ${tone}
TARGET AUDIENCE: ${audience}
INCLUDE DATA: ${includeData ? 'Yes, include real statistics, studies, and examples' : 'No'}
WORD COUNT: ${wordCount}+

REQUIREMENTS:
1. SEO-optimized H1 title that includes the keyword naturally
2. Meta title (60 characters max, includes keyword)
3. Meta description (120-160 characters, compelling, includes keyword)
4. Compelling introduction with a strong hook
5. Multiple sections with H2 and H3 headings
6. Practical, actionable advice throughout
7. ${includeData ? 'Include at least 3 relevant statistics, studies, or data points with citations' : ''}
8. FAQ section at the end with 3-5 common questions
9. Clear call-to-action conclusion
10. 5-7 suggestions for internal links (relevant topics on your blog)
11. 3-5 authoritative external links with anchor text

IMPORTANT:
- Don't repeat the keyword unnaturally
- Write for humans first, search engines second
- Use short paragraphs (2-3 sentences max)
- Include bullet points and numbered lists where helpful
- Make every section valuable on its own
- Add transitions between sections
- End with a clear CTA`;

  const { object } = await generateObject({
    model: glm('gemini-1.5-pro'),
    schema: blogPostSchema,
    systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
  });

  const readabilityScore = calculateReadability(object.content);

  return {
    ...object,
    readabilityScore,
    wordCount: object.content.split(/\s+/).length,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateBulkPosts(params: {
  topics: Array<{ topic: string; keyword: string; tone?: string }>;
  audience?: string;
  includeData?: boolean;
}) {
  const { topics, audience = 'general audience', includeData = true } = params;

  const posts = [];
  for (const item of topics) {
    try {
      const post = await generateBlogPost({
        topic: item.topic,
        keyword: item.keyword,
        tone: (item.tone as any) || 'professional',
        audience,
        includeData,
      });
      posts.push({ success: true, post });
    } catch (error) {
      posts.push({ success: false, topic: item.topic, error });
    }
  }

  return posts;
}

function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = countSyllables(text);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(text: string): number {
  return text.toLowerCase()
    .replace(/[^a-z]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .reduce((acc, word) => {
      if (word.length <= 3) return acc + 1;
      const syllableMatches = word.match(/[aeiouy]+/g);
      return acc + Math.max(1, syllableMatches ? syllableMatches.length : 1);
    }, 0);
}

export async function improveReadability(content: string, targetScore: number = 70): Promise<string> {
  const currentScore = calculateReadability(content);

  if (currentScore >= targetScore) {
    return content;
  }

  const { text } = await generateText({
    model: glm('gemini-1.5-pro'),
    prompt: `Improve the readability of this content to achieve a Flesch Reading Ease score of at least ${targetScore} (current: ${currentScore}).

Content to improve:
${content}

Rules:
- Shorten long sentences (break them into 2-3 shorter sentences)
- Replace complex words with simpler alternatives
- Use more short paragraphs (2-3 sentences max)
- Keep the meaning unchanged
- Keep the SEO keywords intact
- Maintain the same structure and headings`,
    temperature: 0.3,
  });

  return text;
}
