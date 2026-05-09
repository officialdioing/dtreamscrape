/**
 * Cache Revalidation Utility
 *
 * Use these functions to invalidate cache when content is updated
 */

/**
 * Revalidate portfolio items cache
 */
export async function revalidatePortfolio() {
  try {
    await fetch('/api/revalidate?tag=portfolio', { method: 'POST' });
  } catch (error) {
    console.error('Failed to revalidate portfolio cache:', error);
  }
}

/**
 * Revalidate specific portfolio item cache
 */
export async function revalidatePortfolioItem(id: string) {
  try {
    await fetch(`/api/revalidate?tag=portfolio-${id}`, { method: 'POST' });
  } catch (error) {
    console.error('Failed to revalidate portfolio item cache:', error);
  }
}

/**
 * Revalidate site content cache
 */
export async function revalidateSiteContent(page?: string) {
  try {
    const tag = page ? `content-${page}` : 'site-content';
    await fetch(`/api/revalidate?tag=${tag}`, { method: 'POST' });
  } catch (error) {
    console.error('Failed to revalidate site content cache:', error);
  }
}

/**
 * Revalidate blog posts cache
 */
export async function revalidateBlog() {
  try {
    await fetch('/api/revalidate?tag=blog', { method: 'POST' });
  } catch (error) {
    console.error('Failed to revalidate blog cache:', error);
  }
}

/**
 * Revalidate availability cache
 */
export async function revalidateAvailability() {
  try {
    await fetch('/api/revalidate?tag=availability', { method: 'POST' });
  } catch (error) {
    console.error('Failed to revalidate availability cache:', error);
  }
}

/**
 * Revalidate all caches
 */
export async function revalidateAll() {
  await Promise.all([
    revalidatePortfolio(),
    revalidateSiteContent(),
    revalidateBlog(),
    revalidateAvailability(),
  ]);
}
