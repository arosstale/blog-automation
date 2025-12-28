import { NextRequest, NextResponse } from 'next/server';
import { generateBlogPost } from '@/lib/ai/blog-generator';
import { analyzeSEO } from '@/lib/seo/optimizer';

export const maxDuration = 60; // 60 second timeout

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic,
      keyword,
      tone = 'professional',
      audience = 'general audience',
      includeData = true,
      wordCount = 2000,
    } = body;

    // Validate required fields
    if (!topic || !keyword) {
      return NextResponse.json(
        { error: 'Missing required fields: topic and keyword are required' },
        { status: 400 }
      );
    }

    // Generate the blog post
    const generatedPost = await generateBlogPost({
      topic,
      keyword,
      tone,
      audience,
      includeData,
      wordCount,
    });

    // Analyze SEO
    const seoAnalysis = analyzeSEO({
      content: generatedPost.content,
      title: generatedPost.title,
      metaDescription: generatedPost.metaDescription,
      keyword,
      headings: generatedPost.headings,
      wordCount: generatedPost.wordCount,
      readabilityScore: generatedPost.readabilityScore,
      faqs: generatedPost.faqs,
      internalLinks: generatedPost.internalLinks,
      externalLinks: generatedPost.externalLinks,
    });

    return NextResponse.json({
      success: true,
      post: generatedPost,
      seo: seoAnalysis,
    });

  } catch (error) {
    console.error('Error generating blog post:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate blog post',
      },
      { status: 500 }
    );
  }
}
