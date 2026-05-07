import request from './request'

export interface QuestionTypeReportItem {
  question_type: string
  type_label: string
  practice_count: number
  practice_ratio: number
  like_count: number
  like_rate: number
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
  like_count: number
  favorite_count: number
}

export interface TopicPreferenceReport {
  items: TopicPreferenceItem[]
  top_favorites: TopicPreferenceItem[]
  top_likes: TopicPreferenceItem[]
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

export const reportApi = {
  getQuestionTypeReport: () => request.get<QuestionTypeReport>('/admin/reports/question-type'),
  getTopicPreferenceReport: () => request.get<TopicPreferenceReport>('/admin/reports/topic-preference'),
  getExamPaperStatsReport: () => request.get<ExamPaperStatsReport>('/admin/reports/exam-paper-stats'),
}
