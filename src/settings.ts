export interface JavaHighlightSettings {
	annotationColor: string;
	commentColor: string;
	enableAnnotation: boolean;
	enableComment: boolean;
}

export const DEFAULT_SETTINGS: JavaHighlightSettings = {
	annotationColor: "#d19a66",
	commentColor: "#7ec699",
	enableAnnotation: true,
	enableComment: true,
};
