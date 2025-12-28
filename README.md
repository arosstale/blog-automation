# Blog Automation Platform

AI-powered blog automation platform with SEO optimization, keyword research, and automated outreach.

## Features

- **AI Blog Generation**: Generate SEO-optimized blog posts using GLM (General Language Model)
- **SEO Analysis**: Real-time SEO scoring and optimization suggestions
- **Keyword Research**: Find high-volume, low-competition keywords
- **Internal Linking**: Auto-generate internal linking structure
- **Content Analytics**: Track performance and engagement metrics
- **Outreach System**: Automated email outreach for backlink opportunities
- **Multi-Format Support**: Blog posts, social media content, newsletters

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: GLM API for content generation
- **Styling**: Tailwind CSS
- **Analytics**: Custom tracking system

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/blog_automation"
GLM_API_KEY="your_glm_api_key"
OPENAI_API_KEY="your_openai_api_key"  # Optional
```

## API Endpoints

### Blog Generation
```
POST /api/generate/blog-post
```
Body:
```json
{
  "topic": "How to build a startup",
  "keyword": "startup guide",
  "tone": "professional",
  "audience": "entrepreneurs",
  "wordCount": 2000
}
```

### Keyword Research
```
POST /api/keywords/research
```

### SEO Analysis
```
POST /api/seo/analyze
```

## Database Schema

The platform uses 12+ tables including:
- Blog posts, categories, tags
- Keywords and research data
- SEO metrics and analytics
- Outreach campaigns and templates
- Media assets and internal links

## License

MIT

---

Built with ❤️ by [arosstale](https://github.com/arosstale)
