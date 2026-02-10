export interface SearchResult {
  id: string;
  type: 'application' | 'interview' | 'assessment' | 'note';
  title: string;
  snippet: string;
  company_name?: string;
  rank: number;
  link: string;
  updated_at: string;
}

export interface GroupedSearchResponse {
  applications: SearchResult[];
  interviews: SearchResult[];
  assessments: SearchResult[];
  notes: SearchResult[];
  total_count: number;
  query: string;
}
