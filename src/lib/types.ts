export type MediaProductType = "FEED" | "REELS" | "STORY" | "CAROUSEL_ALBUM" | "AD";

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
  mediaUrl?: string; // video URL for transcription
  transcript?: string;
  likeCount: number;
  commentsCount: number;
  reach?: number;
  views?: number;
  saved?: number;
  shares?: number;
  totalInteractions?: number;
  reelsAvgWatchTimeMs?: number;
}

export interface FollowerDay {
  date: string;
  followers: number;
  gained: number;
  reelPublished: boolean;
  reelViews?: number;
}

export interface Bucket {
  label: string;
  value: number;
}

export interface Demographics {
  gender?: Bucket[];
  age?: Bucket[];
  country?: Bucket[];
  cities?: Bucket[];
}

export interface DashboardData {
  live: boolean;
  fetchedAt: string;
  notice?: string;
  profile: IgProfile;
  media: IgMedia[];
  followerSeries: FollowerDay[];
  demographics: Demographics;
}

export interface ScatterPoint {
  views: number;
  gained: number;
  date: string;
  caption?: string;
}

export interface Analytics {
  kpis: {
    reels: number;
    posts: number;
    totalViews: number;
    totalReach: number;
    avgViews: number;
    avgER: number;
    totalSaves: number;
    totalShares: number;
    totalLikes: number;
    followers: number;
    followerGrowth30d: number;
    followerGrowthPct30d: number;
    avgSaveRate: number;
    avgShareRate: number;
    profileLinkTaps: number;
  };
  topByViews: IgMedia[];
  topByER: IgMedia[];
  viewsOverTime: { date: string; views: number }[];
  savesVsShares: { label: string; saves: number; shares: number }[];
  weekday: { day: string; avgViews: number; count: number; best: boolean }[];
  monthly: { month: string; avgViews: number; avgER: number }[];
  distribution: Bucket[];
  viewsTrend: { date: string; views: number; ma: number }[];
  topSaved: IgMedia[];
  topShared: IgMedia[];
  scatter: ScatterPoint[];
  bestDay: string;
  bestHour: string;
  bestFormat: string;
  postsPerWeek: number;
}

export interface Signals {
  followers: number;
  followerGrowth30d: number;
  followerGrowthPct30d: number;
  totalViews: number;
  avgViews: number;
  avgER: number;
  avgSaveRate: number;
  avgShareRate: number;
  bestFormat: string;
  bestDay: string;
  bestHour: string;
  postsPerWeek: number;
  topPostCaption?: string;
  topPostViews?: number;
}
