// AI Sistemi TypeScript Tipleri

export type AIMode = 'autonomous' | 'readonly' | 'hybrid';
export type AIDecision = 'approved' | 'rejected' | 'interview' | 'revision';
export type AIActionTaken = 'approved' | 'rejected' | 'revision_sent' | 'forwarded_to_admin' | 'no_action' | 'error';
export type AIProcessingStatus = 'pending' | 'queued' | 'processing' | 'done' | 'error' | 'skipped';

// AI Ayarları
export interface AISettings {
    id: string;
    mode: AIMode;
    is_enabled: boolean;
    confidence_threshold: number;
    auto_approve: boolean;
    auto_reject: boolean;
    revision_limit: number;
    daily_limit: number;
    discord_bot_token?: string;
    discord_server_id?: string;
    discord_role_id?: string;
    discord_log_webhook?: string;
    discord_alert_webhook?: string;
    discord_delay_ms: number;
    blacklist_words: string[];
    updated_at: string;
    updated_by?: string;
}

// DeepSeek Analizi
export interface DeepSeekAnalysis {
    player_profile: {
        experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        roleplay_style: string;
        character_depth: number; // 1-10
    };
    mentality_analysis: {
        maturity_score: number; // 1-10
        conflict_handling: string;
        team_player: boolean;
        rule_awareness: number; // 1-10
    };
    answer_quality: {
        [questionId: string]: {
            score: number; // 1-10
            notes: string;
        };
    };
    blacklist_matches: string[];
    copy_suspicion: boolean;
    overall_score: number; // 0-100
}

// Claude Analizi
export interface ClaudeAnalysis {
    character_evaluation: {
        backstory_quality: number; // 1-10
        personality_depth: number; // 1-10
        motivation_clarity: number; // 1-10
    };
    rp_readiness: {
        scenario_handling: number; // 1-10
        conflict_resolution: number; // 1-10
        improvisation_skill: number; // 1-10
    };
    strengths: string[];
    weaknesses: string[];
    recommendation: AIDecision;
    recommendation_notes: string;
    confidence: number; // 0-100
}

// AI Raporu
export interface AIReport {
    id: number;
    application_id: number;
    mode: AIMode;
    deepseek_analysis: DeepSeekAnalysis | null;
    claude_analysis: ClaudeAnalysis | null;
    final_decision: AIDecision | null;
    confidence_score: number | null;
    action_taken: AIActionTaken | null;
    staff_decision: string | null;
    decision_match: boolean | null;
    priority: number;
    error_log: string | null;
    processing_time_ms: number | null;
    created_at: string;
}

// AI Audit Log
export interface AIAuditLog {
    id: number;
    action: string;
    user_id: string | null;
    details: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
}

// Günlük İstatistikler
export interface AIDailyStats {
    report_date: string;
    total_processed: number;
    approved_count: number;
    rejected_count: number;
    interview_count: number;
    revision_count: number;
    avg_confidence: number;
    avg_processing_time_ms: number;
}

// AI Formu Gönderme Request
export interface SendToAIRequest {
    application_id: number;
    priority: boolean;
}

// Dashboard İstatistikleri
export interface AIManagerStats {
    total_reports: number;
    today_processed: number;
    daily_limit: number;
    avg_confidence: number;
    approval_rate: number;
    ai_staff_match_rate: number;
    daemon_status: 'running' | 'stopped' | 'error';
    last_processed_at: string | null;
}
