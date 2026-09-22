import { Plugin } from "obsidian";
import type { Extension } from "@codemirror/state";
import { createJavaHighlightExtension } from "./editorExtension";
import {
	DEFAULT_SETTINGS,
	MARKUP_COMMENT_LANGUAGES,
	parseLanguageList,
	type JavaHighlightSettings,
} from "./settings";
import { JavaHighlightSettingTab } from "./settingTab";

const STYLE_ID = "java-annotation-highlight-vars";

function langSelectors(
	langs: string[],
	suffix: string,
): string {
	return langs
		.map((lang) => {
			const root = `.language-${lang}`;
			return [
				`.markdown-rendered ${root}${suffix}`,
				`.markdown-preview-view ${root}${suffix}`,
				`.cm-preview-code-block ${root}${suffix}`,
			].join(",\n");
		})
		.join(",\n");
}

export default class JavaAnnotationHighlightPlugin extends Plugin {
	settings: JavaHighlightSettings = DEFAULT_SETTINGS;
	/** Mutated in place so Obsidian picks up setting changes via updateOptions(). */
	private readonly editorExtensions: Extension[] = [];

	async onload() {
		await this.loadSettings();
		this.applyStyles();
		this.rebuildEditorExtension();
		this.registerEditorExtension(this.editorExtensions);
		this.addSettingTab(new JavaHighlightSettingTab(this.app, this));
	}

	onunload() {
		document.getElementById(STYLE_ID)?.remove();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.applyStyles();
		this.rebuildEditorExtension();
		this.app.workspace.updateOptions();
	}

	private rebuildEditorExtension() {
		this.editorExtensions.splice(0, this.editorExtensions.length);
		if (this.settings.enableEditingView) {
			this.editorExtensions.push(
				createJavaHighlightExtension(() => this.settings),
			);
		}
	}

	applyStyles() {
		let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
		if (!el) {
			el = document.createElement("style");
			el.id = STYLE_ID;
			document.head.appendChild(el);
		}

		const {
			annotationColor,
			commentColor,
			enableAnnotation,
			enableComment,
			enableHtmlComment,
			enableReadingView,
			enableEditingView,
			languages,
		} = this.settings;

		const jvmLangs = [...parseLanguageList(languages)];
		const parts: string[] = [];

		parts.push(`:root {
	--jah-annotation-color: ${annotationColor};
	--jah-comment-color: ${commentColor};
}`);

		if (enableReadingView && enableAnnotation && jvmLangs.length > 0) {
			parts.push(`
${langSelectors(jvmLangs, " .token.annotation")},
${langSelectors(jvmLangs, " .token.annotation .token")} {
	color: var(--jah-annotation-color) !important;
}`);
		}

		if (enableReadingView && enableComment && jvmLangs.length > 0) {
			parts.push(`
${langSelectors(jvmLangs, " .token.comment")} {
	color: var(--jah-comment-color) !important;
}`);
		}

		if (enableReadingView && enableHtmlComment) {
			const markup = [...MARKUP_COMMENT_LANGUAGES];
			parts.push(`
${langSelectors(markup, " .token.comment")} {
	color: var(--jah-comment-color) !important;
}`);
		}

		if (enableEditingView && enableAnnotation) {
			parts.push(`
.cm-jah-annotation {
	color: var(--jah-annotation-color) !important;
}`);
		}

		if (
			enableEditingView &&
			(enableComment || enableHtmlComment)
		) {
			parts.push(`
.cm-jah-comment {
	color: var(--jah-comment-color) !important;
}`);
		}

		el.textContent = parts.join("\n");
	}
}
