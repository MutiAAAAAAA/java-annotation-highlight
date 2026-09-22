import { Plugin } from "obsidian";
import type { Extension } from "@codemirror/state";
import { createJavaHighlightExtension } from "./editorExtension";
import {
	DEFAULT_SETTINGS,
	type JavaHighlightSettings,
} from "./settings";
import { JavaHighlightSettingTab } from "./settingTab";

const STYLE_ID = "java-annotation-highlight-vars";

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
		this.editorExtensions.length = 0;
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
			enableReadingView,
			enableEditingView,
		} = this.settings;

		const parts: string[] = [];

		parts.push(`:root {
	--jah-annotation-color: ${annotationColor};
	--jah-comment-color: ${commentColor};
}`);

		if (enableReadingView && enableAnnotation) {
			parts.push(`
.markdown-rendered .language-java .token.annotation,
.markdown-rendered .language-java .token.annotation .token,
.markdown-preview-view .language-java .token.annotation,
.markdown-preview-view .language-java .token.annotation .token,
.cm-preview-code-block .language-java .token.annotation,
.cm-preview-code-block .language-java .token.annotation .token {
	color: var(--jah-annotation-color) !important;
}`);
		}

		if (enableReadingView && enableComment) {
			parts.push(`
.markdown-rendered .language-java .token.comment,
.markdown-preview-view .language-java .token.comment,
.cm-preview-code-block .language-java .token.comment {
	color: var(--jah-comment-color) !important;
}`);
		}

		if (enableEditingView && enableAnnotation) {
			parts.push(`
.cm-jah-annotation {
	color: var(--jah-annotation-color) !important;
}`);
		}

		if (enableEditingView && enableComment) {
			parts.push(`
.cm-jah-comment {
	color: var(--jah-comment-color) !important;
}`);
		}

		el.textContent = parts.join("\n");
	}
}
