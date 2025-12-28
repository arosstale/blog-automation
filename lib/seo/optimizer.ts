export interface SEOAnalysis {
  score: number;
  checks: SEOChecks;
  recommendations: string[];
  keywordDensity: number;
}

export interface SEOChecks {
  keywordDensity: boolean;
  keywordInTitle: boolean;
  keywordInMetaDescription: boolean;
  keywordInH1: boolean;
  keywordInFirstParagraph: boolean;
  titleLength: boolean;
  metaDescriptionLength: boolean;
  headingStructure: boolean;
  internalLinkCount: boolean;
  externalLinkCount: boolean;
  wordCount: boolean;
  readabilityScore: boolean;
  hasFAQs: boolean;
  hasCallToAction: boolean;
  hasImages: boolean;
  imageAltTags: boolean;
}

const TARGET_KEYWORD_DENSITY = { min: 1, max: 3 }; // percentage
const TARGET_TITLE_LENGTH = { min: 30, max: 60 };
const TARGET_META_DESCRIPTION_LENGTH = { min: 120, max: 160 };
const TARGET_WORD_COUNT = 2000;
const TARGET_INTERNAL_LINKS = { min: 3, max: 7 };
const TARGET_EXTERNAL_LINKS = { min: 3 };
const TARGET_READABILITY_SCORE = 60;

export function analyzeSEO(params: {
  content: string;
  title: string;
  metaDescription?: string;
  keyword: string;
  headings: Array<{ level: number; text: string }>;
  wordCount: number;
  readabilityScore: number;
  faqs?: Array<{ question: string; answer: string }>;
  internalLinks?: string[];
  externalLinks?: Array<{ url: string; text: string }>;
}): SEOAnalysis {
  const {
    content,
    title,
    metaDescription = '',
    keyword,
    headings,
    wordCount,
    readabilityScore,
    faqs = [],
    internalLinks = [],
    externalLinks = [],
  } = params;

  const checks: SEOChecks = {
    keywordDensity: checkKeywordDensity(content, keyword),
    keywordInTitle: title.toLowerCase().includes(keyword.toLowerCase()),
    keywordInMetaDescription: metaDescription.toLowerCase().includes(keyword.toLowerCase()),
    keywordInH1: headings.some(h => h.level === 1 && h.text.toLowerCase().includes(keyword.toLowerCase())),
    keywordInFirstParagraph: checkKeywordInFirstParagraph(content, keyword),
    titleLength: title.length >= TARGET_TITLE_LENGTH.min && title.length <= TARGET_TITLE_LENGTH.max,
    metaDescriptionLength: metaDescription.length >= TARGET_META_DESCRIPTION_LENGTH.min && metaDescription.length <= TARGET_META_DESCRIPTION_LENGTH.max,
    headingStructure: validateHeadingStructure(headings),
    internalLinkCount: internalLinks.length >= TARGET_INTERNAL_LINKS.min && internalLinks.length <= TARGET_INTERNAL_LINKS.max,
    externalLinkCount: externalLinks.length >= TARGET_EXTERNAL_LINKS.min,
    wordCount: wordCount >= TARGET_WORD_COUNT,
    readabilityScore: readabilityScore >= TARGET_READABILITY_SCORE,
    hasFAQs: faqs.length >= 3,
    hasCallToAction: content.toLowerCase().includes('cta') ||
                      content.toLowerCase().includes('call to action') ||
                      content.toLowerCase().includes('get started') ||
                      content.toLowerCase().includes('learn more'),
    hasImages: content.includes('<img') || content.includes('!['),
    imageAltTags: content.includes('alt=') || content.match(/!\[.*?\]\(.*?\)/g)?.length > 0,
  };

  const keywordDensity = calculateKeywordDensity(content, keyword);
  const recommendations = generateRecommendations(checks, keywordDensity, keyword);

  const score = calculateSEOScore(checks);

  return {
    score,
    checks,
    recommendations,
    keywordDensity,
  };
}

function checkKeywordDensity(content: string, keyword: string): boolean {
  const density = calculateKeywordDensity(content, keyword);
  return density >= TARGET_KEYWORD_DENSITY.min && density <= TARGET_KEYWORD_DENSITY.max;
}

function calculateKeywordDensity(content: string, keyword: string): number {
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const keywordLower = keyword.toLowerCase();
  const keywordMatches = words.filter(w => w.includes(keywordLower)).length;

  if (words.length === 0) return 0;
  return Math.round((keywordMatches / words.length) * 100 * 100) / 100;
}

function checkKeywordInFirstParagraph(content: string, keyword: string): boolean {
  const firstParagraph = content.split(/\n\n+/)[0] || content;
  return firstParagraph.toLowerCase().includes(keyword.toLowerCase());
}

function validateHeadingStructure(headings: Array<{ level: number; text: string }>): boolean {
  if (headings.length === 0) return false;

  // Must have at least one H1
  const hasH1 = headings.some(h => h.level === 1);
  if (!hasH1) return false;

  // Check proper hierarchy (no skipping levels)
  let previousLevel = 1;
  for (const heading of headings) {
    if (heading.level > previousLevel + 1) return false;
    previousLevel = heading.level;
  }

  return true;
}

function generateRecommendations(checks: SEOChecks, density: number, keyword: string): string[] {
  const recommendations: string[] = [];

  if (!checks.keywordDensity) {
    if (density < TARGET_KEYWORD_DENSITY.min) {
      recommendations.push(`Add more mentions of "${keyword}" naturally (currently ${density}%, aim for 1-3%)`);
    } else {
      recommendations.push(`Reduce keyword usage (currently ${density}%, aim for 1-3%) to avoid keyword stuffing`);
    }
  }

  if (!checks.keywordInTitle) {
    recommendations.push(`Include your keyword "${keyword}" in the title`);
  }

  if (!checks.keywordInMetaDescription) {
    recommendations.push(`Add your keyword "${keyword}" to the meta description`);
  }

  if (!checks.keywordInH1) {
    recommendations.push(`Include your keyword in the main H1 heading`);
  }

  if (!checks.keywordInFirstParagraph) {
    recommendations.push(`Mention "${keyword}" in the first paragraph for better SEO`);
  }

  if (!checks.titleLength) {
    recommendations.push(`Optimize title length (30-60 characters)`);
  }

  if (!checks.metaDescriptionLength) {
    recommendations.push(`Adjust meta description to 120-160 characters for optimal display`);
  }

  if (!checks.headingStructure) {
    recommendations.push('Fix heading structure: Use H1→H2→H3 hierarchy without skipping levels');
  }

  if (!checks.internalLinkCount) {
    recommendations.push(`Add ${TARGET_INTERNAL_LINKS.min}-${TARGET_INTERNAL_LINKS.max} internal links to related content`);
  }

  if (!checks.externalLinkCount) {
    recommendations.push(`Include at least ${TARGET_EXTERNAL_LINKS.min} authoritative external links`);
  }

  if (!checks.wordCount) {
    recommendations.push(`Expand content to at least ${TARGET_WORD_COUNT} words for better rankings`);
  }

  if (!checks.readabilityScore) {
    recommendations.push(`Improve readability (aim for score of ${TARGET_READABILITY_SCORE}+). Use shorter sentences and simpler words.`);
  }

  if (!checks.hasFAQs) {
    recommendations.push('Add an FAQ section with at least 3 common questions');
  }

  if (!checks.hasCallToAction) {
    recommendations.push('Add a clear call-to-action at the end of the post');
  }

  if (!checks.hasImages) {
    recommendations.push('Add relevant images to make the content more engaging');
  }

  if (!checks.imageAltTags) {
    recommendations.push('Ensure all images have descriptive alt text for accessibility and SEO');
  }

  return recommendations;
}

function calculateSEOScore(checks: SEOChecks): number {
  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  return Math.round((passedChecks / totalChecks) * 100);
}

export function generateMetaTags(params: {
  title: string;
  description: string;
  keyword: string;
  url: string;
  image?: string;
  publishedAt?: string;
}) {
  const { title, description, keyword, url, image, publishedAt } = params;

  return {
    title,
    description,
    keywords: keyword,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Blog Automation',
      images: image ? [{ url: image }] : undefined,
      type: 'article',
      publishedTime: publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function generateSchemaMarkup(params: {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  modifiedAt: string;
  url: string;
  image?: string;
  faqs?: Array<{ question: string; answer: string }>;
}) {
  const { title, description, author, publishedAt, modifiedAt, url, image, faqs } = params;

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished: publishedAt,
    dateModified: modifiedAt,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  if (image) {
    (baseSchema as any).image = {
      '@type': 'ImageObject',
      url: image,
    };
  }

  if (faqs && faqs.length > 0) {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        baseSchema,
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        },
      ],
    };
  }

  return baseSchema;
}
