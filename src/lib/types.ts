export type MediaProductType =
  | "FEED"
  | "REELS"
  | "STORY"
  | "CAROUSEL_ALBUM"
  | "AD";

export interface IgProfile {
  id: string;
  username: string;
  name?: string;
  biography?: string;
  profilePictureUrl?: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
}

export interface IgMedia {
  id: string;
  caption?: string;
  mediaType: string;
  mediaProductType: MediaProductType;
  permalink?: string;
  timestamp: string; // ISO
  thumbnailUrl?: string;
  likeCount: number;
  commentsCount: number;
  // best-effort insights (present only with insights scope / sample)
  reach?: number;
  views?: number;
  saved?: number;
  shares?: number;
  totalInteractions?: number;
  reelsAvgWatchTimeMs?: number;
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  reach?: number;
  views?: number;
  followers?: number;
}

export interface AccountInsights {
  reach30d?: number;
  views30d?: number;
  accountsEngaged?: number;
  totalInteractions?: number;
  profileLinksTaps?: number;
  series?: TrendPoint[];
}

export interface Bucket {
  label: string;
  value: number;
}

export interface Demographics {
  gender?: Bucket[];
  age?: Bucket[];
  country?: Bucket[];
}

export interface DashboardData {
  live: boolean;
  fetchedAt: string; // ISO
  notice?: string;
  profile: IgProfile;
  media: IgMedia[];
  insights: AccountInsights;
  demographics: Demographics;
}

export interface Signals {
  followers: number;
  followerGrowth30d: number;
  followerGrowthPct30d: number;
  reach30d?: number;
  views30d?: number;
  engagementRatePct: number;
  avgInteractionsPerPost: number;
  bestFormat: string;
  bestFormatAvgInteractions: number;
  bestDay: string;
  bestHour: string;
  postsPerWeek: number;
  topPostCaption?: string;
  topPostInteractions?: number;
  topPostType?: string;
  reelsAvgWatchSec?: number;
  storyCompletionPct?: number;
  profileLinkTaps?: number;
}
