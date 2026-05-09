export type BlogPost = {
  id: string;
  title: string;
  location: string;
  category: string;
  date: string;
  img: string;
  desc: string;
  fullStory: string[];
  gallery: string[];
  contentBlocks?: Array<{
    id: string;
    type: 'text' | 'image' | 'heading' | 'quote';
    content: string;
    level?: string;
    caption?: string;
  }>;
};

// Intentionally no hardcoded mock posts.
