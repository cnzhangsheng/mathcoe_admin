import request from './request'

export interface QuestionTypeReportItem {
  question_type: string
  type_label: string
  practice_count: number
  practice_ratio: number
  favorite_count: number
  favorite_rate: number
}

export interface QuestionTypeReport {
  items: QuestionTypeReportItem[]
  total_practice: number
}

export interface TopicPreferenceItem {
  topic_id: number
  topic_title: string
  practice_count: number
  user_count: number
  favorite_count: number
}

export interface TopicPreferenceReport {
  items: TopicPreferenceItem[]
  top_favorites: TopicPreferenceItem[]
}

export interface ExamPaperTypeStat {
  paper_type: string
  type_label: string
  test_count: number
  completed_count: number
  completion_rate: number
  avg_score: number
}

export interface TopPaper {
  id: number
  title: string
  paper_type: string
  type_label: string
  test_count: number
  avg_score: number
  user_count: number
}

export interface ScoreDistItem {
  range: string
  count: number
}

export interface ExamPaperStatsReport {
  total_tests: number
  completed_tests: number
  total_users: number
  avg_score: number
  type_stats: ExamPaperTypeStat[]
  top_papers: TopPaper[]
  score_distribution: ScoreDistItem[]
}

export interface QuestionRankingItem {
  id: number
  title: string
  content: string
  difficulty_level: number
  topic_title: string
  practice_count?: number
  user_count?: number
  favorite_count?: number
  fav_user_count?: number
}

export interface QuestionRankingLevel {
  hot_questions: QuestionRankingItem[]
  favorite_questions: QuestionRankingItem[]
}

export type QuestionRankingReport = Record<string, QuestionRankingLevel>

export interface PracticeTrendItem {
  date: string
  practice_count: number
  user_count: number
}

export interface PracticeTrendReport {
  items: PracticeTrendItem[]
}

export const reportApi = {
  getQuestionTypeReport: () => request.get<QuestionTypeReport>('/admin/reports/question-type'),
  getTopicPreferenceReport: () => request.get<TopicPreferenceReport>('/admin/reports/topic-preference'),
  getExamPaperStatsReport: () => request.get<ExamPaperStatsReport>('/admin/reports/exam-paper-stats'),
  getQuestionRankingReport: () => request.get<QuestionRankingReport>('/admin/reports/question-ranking'),
  getPracticeTrendReport: (days: number = 30) => request.get<PracticeTrendReport>('/admin/reports/practice-trend', { params: { days } }),
}