export type Role = 'user' | 'editor' | 'duma' | 'admin'

export type PublishStatus = 'draft' | 'published' | 'archived'

export type NewsCategory =
  | 'state'
  | 'government'
  | 'duma'
  | 'legislation'
  | 'international'
  | 'security'
  | 'statements'
  | 'announcements'

export type DocStatus =
  | 'draft'
  | 'in_force'
  | 'amended'
  | 'suspended'
  | 'repealed'
  | 'cancelled'

export type BillStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'voting'
  | 'adopted'
  | 'rejected'
  | 'revision'
  | 'signed'
  | 'published'
  | 'void'

export type CodeKind = 'criminal' | 'administrative'

export type BodyKind =
  | 'head'
  | 'government'
  | 'duma'
  | 'judicial'
  | 'law_enforcement'
  | 'agency'

export type IntlDocKind = 'treaty' | 'agreement' | 'statement' | 'negotiation'

export type SessionKind = 'agenda' | 'protocol'

export interface Profile {
  id: string
  display_name: string | null
  role: Role
  created_at: string
}

export interface NewsPost {
  id: string
  slug: string
  title: string
  summary: string | null
  body: string | null
  category: NewsCategory
  author: string | null
  status: PublishStatus
  is_demo: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface LegislationDocument {
  id: string
  doc_number: string
  title: string
  doc_type: string
  authority: string
  category: string
  adopted_on: string | null
  published_on: string | null
  effective_on: string | null
  revision: string | null
  status: DocStatus
  is_demo: boolean
  summary: string | null
  body: string | null
  related_numbers: string[] | null
  history: Array<{ date: string; note: string }> | null
  created_at: string
  updated_at: string
}

export interface CodeArticle {
  id: string
  code_kind: CodeKind
  article_number: string
  title: string
  part: string | null
  category: string
  description: string | null
  sanction: string | null
  notes: string | null
  related: string[] | null
  status: DocStatus
  effective_on: string | null
  is_demo: boolean
  history: Array<{ date: string; note: string }> | null
  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  number: string
  title: string
  summary: string | null
  status: BillStatus
  is_demo: boolean
  initiator: string
  submitted_on: string | null
  related_law_number: string | null
  created_at: string
  updated_at: string
}

export interface BillEvent {
  id: string
  bill_id: string
  occurred_on: string
  title: string
  description: string | null
}

export interface Vote {
  id: string
  bill_id: string
  voted_on: string | null
  title: string
  for_count: number | null
  against_count: number | null
  abstain_count: number | null
  published: boolean
  source_note: string | null
}

export interface DumaSession {
  id: string
  kind: SessionKind
  number: string
  title: string
  session_date: string | null
  body: string | null
  published: boolean
}

export interface GovBody {
  id: string
  slug: string
  name: string
  kind: BodyKind
  summary: string | null
  description: string | null
  structure: string | null
  contacts: string | null
  sort_order: number
}

export interface IntlDocument {
  id: string
  title: string
  kind: IntlDocKind
  country: string
  signed_on: string | null
  status: string
  is_demo: boolean
  summary: string | null
  body: string | null
  published: boolean
}


