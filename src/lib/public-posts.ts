import type { BlogPostRow, PortfolioItemRow } from '@/src/types';
import type { BlogPost } from '@/src/lib/blog-posts';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

type ContentBlock = NonNullable<BlogPost['contentBlocks']>[number];

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeContentBlocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  const blocks: ContentBlock[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    const type = (item as any).type;
    const content = (item as any).content;
    const id = safeString((item as any).id) || `b_${blocks.length + 1}`;
    if (type !== 'text' && type !== 'image' && type !== 'heading' && type !== 'quote') continue;
    if (typeof content !== 'string') continue;
    const block: ContentBlock = { id, type, content };
    if (type === 'heading') {
      const level = safeString((item as any).level);
      if (level) block.level = level;
    }
    if (safeString((item as any).caption)) {
      block.caption = safeString((item as any).caption);
    }
    blocks.push(block);
  }
  return blocks;
}

function formatIsoDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function normalizeGalleryFromImagesField(images: unknown): string[] {
  if (!images) return [];

  // Some rows store editor blocks in `images` (array), where image blocks have { type: 'image', content: 'url' }
  if (Array.isArray(images)) {
    const urls: string[] = [];
    for (const item of images) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed) urls.push(trimmed);
        continue;
      }
      if (typeof item === 'object' && item !== null) {
        const maybeType = (item as any).type;
        const maybeContent = (item as any).content;
        if (maybeType === 'image' && typeof maybeContent === 'string' && maybeContent.trim()) {
          urls.push(maybeContent.trim());
        }
      }
    }
    return urls;
  }

  // Some rows may store JSON in string form
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return normalizeGalleryFromImagesField(parsed);
    } catch {
      return [];
    }
  }

  return [];
}

export function mapPortfolioItemToPublicPost(row: PortfolioItemRow | any): BlogPost {
  const slug = safeString(row?.slug);
  const id = slug || safeString(row?.id);

  const title = safeString(row?.title);
  const location = safeString(row?.location);
  const category = safeString(row?.event_type);
  const img = safeString(row?.featured_image);

  // Parse description as JSON first (new format with subtitle, contentBlocks)
  const descriptionObject = parseMaybeJson(row?.description);
  const descriptionContent =
    typeof descriptionObject === 'object' && descriptionObject !== null
      ? (descriptionObject as any)
      : null;
  
  // Get contentBlocks from description JSON first, then fall back to images field
  let contentBlocks = descriptionContent?.contentBlocks 
    ? normalizeContentBlocks(descriptionContent.contentBlocks)
    : normalizeContentBlocks(parseMaybeJson(row?.images));

  // Get subtitle from description JSON if available
  const subtitle = safeString(descriptionContent?.subtitle);
  const contentImage = safeString(descriptionContent?.image);

  const storySource = safeString(row?.description);
  const fullStory = contentBlocks.length
    ? contentBlocks
        .filter((b) => b.type === 'text' || b.type === 'heading' || b.type === 'quote')
        .map((b) => b.content)
    : splitParagraphs(storySource);

  const desc =
    subtitle ||
    safeString(row?.excerpt) ||
    safeString(row?.meta_description) ||
    fullStory.find(Boolean) ||
    '';

  const gallery =
    safeStringArray(row?.gallery_images).filter((u) => u.trim().length > 0) ||
    [];
  const imagesValue = parseMaybeJson(row?.images);
  const galleryFromImages = normalizeGalleryFromImagesField(imagesValue);
  const mergedGallery = Array.from(new Set([...gallery, ...galleryFromImages])).filter(Boolean);

  const date = formatIsoDate(safeString(row?.event_date)) || formatIsoDate(safeString(row?.published_at));

  return {
    id,
    title,
    location,
    category,
    date,
    img: img || contentImage || mergedGallery[0] || '',
    desc,
    fullStory: fullStory.length ? fullStory : desc ? [desc] : [],
    gallery: mergedGallery,
    contentBlocks: contentBlocks.length ? contentBlocks : undefined
  };
}
export function mapBlogRowToPublicPost(row: BlogPostRow | any): BlogPost {
  const slug = safeString(row?.slug);
  const id = slug || safeString(row?.id);

  const title = safeString(row?.title);
  const featuredImage = safeString(row?.featured_image);

  const contentValue = parseMaybeJson(row?.content);
  const contentObject = typeof contentValue === 'object' && contentValue !== null ? (contentValue as any) : null;
  const blocks = normalizeContentBlocks(contentObject?.contentBlocks);

  const subtitle = safeString(contentObject?.subtitle);
  const location = safeString(contentObject?.location);
  const contentImage = safeString(contentObject?.image);

  const fullStory = blocks.length
    ? blocks
        .filter((b) => b.type === 'text' || b.type === 'heading' || b.type === 'quote')
        .map((b) => b.content)
    : splitParagraphs(safeString(contentValue));

  const firstTextBlock = blocks.find((b) => b.type === 'text')?.content || '';
  const desc = safeString(row?.excerpt) || subtitle || firstTextBlock || fullStory[0] || '';

  const categories = row?.category
    ? safeString(row.category)
    : Array.isArray(row?.categories)
      ? safeString(row.categories[0])
      : '';

  const date = formatIsoDate(safeString(row?.published_at)) || formatIsoDate(safeString(row?.created_at));

  const imageBlocks = blocks.filter((b) => b.type === 'image').map((b) => b.content).filter(Boolean);
  const img = featuredImage || contentImage || imageBlocks[0] || '';
  const gallery = imageBlocks.filter((u) => u !== img);

  return {
    id,
    title,
    location,
    category: categories,
    date,
    img,
    desc,
    fullStory: fullStory.length ? fullStory : desc ? [desc] : [],
    gallery,
    contentBlocks: blocks.length ? blocks : undefined
  };
}
