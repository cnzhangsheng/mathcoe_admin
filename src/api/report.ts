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

export const reportApi = {
  getQuestionTypeReport: () => request.get<QuestionTypeReport>('/admin/reports/question-type'),
  getTopicPreferenceReport: () => request.get<TopicPreferenceReport>('/admin/reports/topic-preference'),
}
