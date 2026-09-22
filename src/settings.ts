export interface JavaHighlightSettings {
	annotationColor: string;
	commentColor: string;
	enableAnnotation: boolean;
	enableComment: boolean;
	/** Color <!-- ... --> in markdown and html/xml code blocks */
	enableHtmlComment: boolean;
	/** Apply Prism CSS overrides in Reading / Live Preview rendered blocks */
	enableReadingView: boolean;
	/** Apply CodeMirror decorations while editing source / live-preview fences */
	enableEditingView: boolean;
	/**
	 * Comma-separated fence languages that share @annotation and C-style comment rules
	 * (e.g. java, kotlin, scala, groovy).
	 */
	languages: string;
}

export const DEFAULT_SETTINGS: JavaHighlightSettings = {
	annotationColor: "#d19a66",
	commentColor: "#7ec699",
	enableAnnotation: true,
	enableComment: true,
	enableHtmlComment: true,
	enableReadingView: true,
	enableEditingView: true,
	languages: "java, kotlin, scala, groovy",
};

/** Common aliases Obsidian / Prism may use on fences. */
const LANG_ALIASES: Record<string, string> = {
	kt: "kotlin",
	kts: "kotlin",
};

export function normalizeLang(raw: string): string {
	const lang = raw.trim().toLowerCase();
	return LANG_ALIASES[lang] ?? lang;
}

export function parseLanguageList(raw: string): Set<string> {
	const set = new Set<string>();
	for (const part of raw.split(/[,，\s]+/)) {
		const lang = normalizeLang(part);
		if (lang) set.add(lang);
	}
	return set;
}

/** Markup fences where <!-- --> comments appear (reading-view CSS). */
export const MARKUP_COMMENT_LANGUAGES = [
	"html",
	"htm",
	"xml",
	"svg",
	"vue",
] as const;
