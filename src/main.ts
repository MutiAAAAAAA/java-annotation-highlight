import { Plugin } from "obsidian";
import type { Extension } from "@codemirror/state";
import { createJavaHighlightExtension } from "./editorExtension";
import {
	DEFAULT_SETTINGS,
	type JavaHighlightSettings,
} from "./settings";
import { JavaHighlightSettingTab } from "./settingTab";

const BODY_CLASSES = [
	"jah-reading-annotation",
	"jah-reading-comment",
	"jah-reading-html-comment",
	"jah-editing-annotation",
	"jah-editing-comment",
] as const;

export default class JavaAnnotationHighlightPlugin extends Plugin {
	settings: JavaHighlightSettings = { ...DEFAULT_SETTINGS };
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
		this.clearBodyStyles();
	}

	async loadSettings() {
		const data: unknown = await this.loadData();
		const loaded =
			data !== null && typeof data === "object"
				? (data as Partial<JavaHighlightSettings>)
				: {};
		this.settings = { ...DEFAULT_SETTINGS, ...loaded };
	}

	/**
	 * Persist settings. Also used by declarative settings controls (they call
	 * plugin.saveData), so side effects for CSS / editor extensions live here.
	 */
	async saveData(data: unknown): Promise<void> {
		await super.saveData(data);
		if (data !== null && typeof data === "object") {
			this.settings = {
				...DEFAULT_SETTINGS,
				...(data as Partial<JavaHighlightSettings>),
			};
		}
		this.applyStyles();
		this.rebuildEditorExtension();
		this.app.workspace.updateOptions();
	}

	async saveSettings() {
		await this.saveData(this.settings);
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
		const {
			annotationColor,
			commentColor,
			enableAnnotation,
			enableComment,
			enableHtmlComment,
			enableReadingView,
			enableEditingView,
		} = this.settings;

		document.body.style.setProperty(
			"--jah-annotation-color",
			annotationColor,
		);
		document.body.style.setProperty("--jah-comment-color", commentColor);

		document.body.classList.toggle(
			"jah-reading-annotation",
			enableReadingView && enableAnnotation,
		);
		document.body.classList.toggle(
			"jah-reading-comment",
			enableReadingView && enableComment,
		);
		document.body.classList.toggle(
			"jah-reading-html-comment",
			enableReadingView && enableHtmlComment,
		);
		document.body.classList.toggle(
			"jah-editing-annotation",
			enableEditingView && enableAnnotation,
		);
		document.body.classList.toggle(
			"jah-editing-comment",
			enableEditingView && (enableComment || enableHtmlComment),
		);
	}

	private clearBodyStyles() {
		for (const cls of BODY_CLASSES) {
			document.body.classList.remove(cls);
		}
		document.body.style.removeProperty("--jah-annotation-color");
		document.body.style.removeProperty("--jah-comment-color");
	}
}
