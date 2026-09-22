import { App, PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type JavaAnnotationHighlightPlugin from "./main";
import type { JavaHighlightSettings } from "./settings";

const HEX_COLOR = /^#[0-9A-Fa-f]{3,8}$/;

export class JavaHighlightSettingTab extends PluginSettingTab {
	plugin: JavaAnnotationHighlightPlugin;

	constructor(app: App, plugin: JavaAnnotationHighlightPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem<
		keyof JavaHighlightSettings & string
	>[] {
		return [
			{
				name: "Enable in reading view",
				desc: "Apply colors to rendered / live-preview code blocks.",
				control: { type: "toggle", key: "enableReadingView" },
			},
			{
				name: "Enable in editing view",
				desc: "Apply colors while editing source or live-preview fences.",
				control: { type: "toggle", key: "enableEditingView" },
			},
			{
				name: "Languages",
				desc: "Comma-separated fence languages that share @annotation syntax (e.g. java, kotlin, scala, groovy). Alias: kt → kotlin.",
				control: {
					type: "text",
					key: "languages",
					placeholder: "java, kotlin, scala, groovy",
				},
			},
			{
				type: "group",
				heading: "Annotations",
				items: [
					{
						name: "Enable annotations",
						desc: "Color @Name tokens such as @Override / @Autowired.",
						control: { type: "toggle", key: "enableAnnotation" },
					},
					{
						name: "Annotation color",
						control: { type: "color", key: "annotationColor" },
					},
					{
						name: "Annotation color (hex)",
						desc: "Optional hex fallback, e.g. #d19a66.",
						control: {
							type: "text",
							key: "annotationColor",
							placeholder: "#d19a66",
							validate: (value: string) =>
								HEX_COLOR.test(value.trim())
									? undefined
									: "Use a hex color like #d19a66.",
						},
					},
				],
			},
			{
				type: "group",
				heading: "Comments",
				items: [
					{
						name: "Enable // and /* */ comments",
						desc: "Color line and block comments in supported language fences.",
						control: { type: "toggle", key: "enableComment" },
					},
					{
						name: "Enable HTML comments",
						desc: "Color <!-- --> in note body and html/xml fences.",
						control: { type: "toggle", key: "enableHtmlComment" },
					},
					{
						name: "Comment color",
						control: { type: "color", key: "commentColor" },
					},
					{
						name: "Comment color (hex)",
						desc: "Optional hex fallback, e.g. #7ec699.",
						control: {
							type: "text",
							key: "commentColor",
							placeholder: "#7ec699",
							validate: (value: string) =>
								HEX_COLOR.test(value.trim())
									? undefined
									: "Use a hex color like #7ec699.",
						},
					},
				],
			},
		];
	}
}
