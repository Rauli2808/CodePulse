export type Contest = {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds: number;
};

export type RatingChange = {
  contestId: number;
  contestName: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
};

export type CodeforcesUser = {
  handle: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  avatar?: string;
  titlePhoto?: string;
  contribution?: number;
  friendOfCount?: number;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  lastOnlineTimeSeconds?: number;
  registrationTimeSeconds?: number;
};

export type Submission = {
  id: number;
  creationTimeSeconds: number;
  verdict?: string;
  programmingLanguage?: string;
  problem: {
    contestId?: number;
    problemsetName?: string;
    index: string;
    name: string;
    rating?: number;
    tags: string[];
  };
};

export type UserStats = CodeforcesUser & {
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  contests: number;
  solved: number;
  attempted: number;
  submissions: number;
  acceptedSubmissions: number;
  accuracy: number;
  averageSolvedRating: number;
  hardestSolved?: {
    name: string;
    rating: number;
    contestId?: number;
    index?: string;
  };
  topTags: Array<{ name: string; count: number }>;
  topLanguages: Array<{ name: string; count: number }>;
  activity: Array<{ label: string; count: number }>;
  ratingHistory: RatingChange[];
  recentChanges: RatingChange[];
  bestChange: number;
  worstChange: number;
  submissionHistoryComplete: boolean;
  submissionHistoryLimit: number;
};

export type ApiEnvelope<T> = {
  status: "OK" | "FAILED";
  result?: T;
  comment?: string;
};
