import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { BlogPostBody } from '@/components/blog/BlogPostBody';
import { BLOG_POSTS, getBlogPost } from '@/lib/blog-posts';
import { absoluteUrl } from '@/lib/site';

/** One route backed by the `BLOG_POSTS` list, statically generated at build time. */

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${post.slug}`),
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <AppShell>
      <BlogPostBody post={post} />
    </AppShell>
  );
}
