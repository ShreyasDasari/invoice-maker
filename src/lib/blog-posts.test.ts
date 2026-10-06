import { describe, expect, it } from 'vitest';
import { BLOG_POSTS, formatPostDate, getBlogPost } from './blog-posts';
import { SEO_SLUGS } from './seo-pages';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('BLOG_POSTS', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = BLOG_POSTS.map((post) => post.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('does not reuse a landing page slug', () => {
    for (const post of BLOG_POSTS) expect(SEO_SLUGS).not.toContain(post.slug);
  });

  it('keeps meta descriptions short enough for a search result', () => {
    for (const post of BLOG_POSTS) {
      expect(post.description.length).toBeGreaterThan(50);
      expect(post.description.length).toBeLessThanOrEqual(160);
    }
  });

  it('has valid dates, updated no earlier than published', () => {
    for (const post of BLOG_POSTS) {
      expect(post.publishedAt).toMatch(ISO_DATE);
      expect(post.updatedAt).toMatch(ISO_DATE);
      expect(post.updatedAt >= post.publishedAt).toBe(true);
    }
  });

  it('only links to posts that exist, and never to itself', () => {
    for (const post of BLOG_POSTS) {
      for (const slug of post.related) {
        expect(getBlogPost(slug)).toBeDefined();
        expect(slug).not.toBe(post.slug);
      }
    }
  });

  it('has unique section headings and FAQ questions within a post', () => {
    for (const post of BLOG_POSTS) {
      const headings = post.sections.map((section) => section.heading);
      const questions = post.faqs.map((faq) => faq.question);
      expect(new Set(headings).size).toBe(headings.length);
      expect(new Set(questions).size).toBe(questions.length);
    }
  });
});

describe('formatPostDate', () => {
  it('formats an ISO date without timezone drift', () => {
    expect(formatPostDate('2026-10-06')).toBe('6 October 2026');
    expect(formatPostDate('2026-01-01')).toBe('1 January 2026');
  });
});
