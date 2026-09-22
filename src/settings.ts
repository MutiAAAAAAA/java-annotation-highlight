export interface JavaHighlightSettings {
	annotationColor: string;
	commentColor: string;
	enableAnnotation: boolean;
	enableComment: boolean;
	/** Apply Prism CSS overrides in Reading / Live Preview rendered blocks */
	enableReadingView: boolean;
	/** Apply CodeMirror decorations while editing source / live-preview fences */
	enableEditingView: boolean;
}

export const DEFAULT_SETTINGS: JavaHighlightSettings = {
	annotationColor: "#d19a66",
	commentColor: "#7ec699",
	enableAnnotation: true,
	enableComment: true,
	enableReadingView: true,
	enableEditingView: true,
};
