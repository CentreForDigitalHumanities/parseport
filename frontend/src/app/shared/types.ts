export type ExportMode = "latex" | "pdf" | "overleaf" | "term-table" | "proof";

export interface SpindleInput {
    sentence: string;
    mode: ExportMode;
}

// This should be the same as the one in the backend.
export const enum SpindleErrorSource {
    INPUT = "input",
    SPINDLE = "spindle",
    LATEX = "latex",
    GENERAL = "general",
}

type LexicalItem = {
    word: string;
    pos: string;
    pt: string;
    lemma: string;
};

export type AethelDetailPhrase = {
    items: LexicalItem[];
    type: string;
    displayType: string;
};

// Should correspond with SpindleResponse dataclass in backend.
export interface SpindleReturn {
    error: SpindleErrorSource | null;
    latex: string | null;
    pdf: string | null;
    redirect: string | null;
    term: string | null;
    lexical_phrases: AethelDetailPhrase[];
    proof: Record<string, unknown> | null;
}

export type AethelMode = "word" | "type" | "word-and-type";

export interface AethelInput {
    word?: string;
    type?: string;
    limit?: number;
    skip?: number;
    sort?: string;
}

export interface AethelListLexicalItem {
    word: string;
    lemma: string;
}

export interface AethelListPhrase {
    items: AethelListLexicalItem[];
}

export interface AethelListResult {
    phrase: AethelListPhrase;
    type: string;
    displayType: string;
    sampleCount: number;
}

export interface AethelList {
    results: AethelListResult[];
    totalCount: number;
    error: string | null;
}

// This should be the same as the one in the backend.
export enum AethelDetailError {
    NO_QUERY_INPUT = "NO_QUERY_INPUT",
    SAMPLE_NOT_FOUND = "SAMPLE_NOT_FOUND",
    MULTIPLE_FOUND = "MULTIPLE_FOUND",
}

export interface AethelDetailResult {
    sentence: string;
    name: string;
    term: string;
    subset: string;
    phrases: AethelDetailPhrase[];
}

export interface AethelDetail {
    result: AethelDetailResult | null;
    error: AethelDetailError | null;
}

export interface AethelSampleDataPhrase {
    index: number;
    highlight: boolean;
    display: string;
}

export interface AethelSampleDataResult {
    name: string;
    phrases: AethelSampleDataPhrase[];
}

export interface AethelSampleDataReturn {
    results: AethelSampleDataResult[];
    error: string | null;
}
