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
				name: "阅读视图生效",
				desc: "在阅读视图 / 实时预览已渲染的代码块中应用颜色。",
				control: { type: "toggle", key: "enableReadingView" },
			},
			{
				name: "编辑视图生效",
				desc: "在源码模式 / 实时预览编辑代码块时应用颜色。",
				control: { type: "toggle", key: "enableEditingView" },
			},
			{
				name: "支持的语言",
				desc: "逗号分隔的代码块语言（注解语法一致即可），如 java, kotlin, scala, groovy；kt 会映射为 kotlin。",
				control: {
					type: "text",
					key: "languages",
					placeholder: "java, kotlin, scala, groovy",
				},
			},
			{
				type: "group",
				heading: "注解",
				items: [
					{
						name: "启用注解着色",
						desc: "为 @Override、@Autowired 等 @注解 设置颜色。",
						control: { type: "toggle", key: "enableAnnotation" },
					},
					{
						name: "注解颜色",
						control: { type: "color", key: "annotationColor" },
					},
					{
						name: "注解颜色（十六进制）",
						desc: "可选，例如 #d19a66。",
						control: {
							type: "text",
							key: "annotationColor",
							placeholder: "#d19a66",
							validate: (value: string) =>
								HEX_COLOR.test(value.trim())
									? undefined
									: "请输入合法的十六进制颜色，例如 #d19a66。",
						},
					},
				],
			},
			{
				type: "group",
				heading: "注释",
				items: [
					{
						name: "启用 // 与 /* */ 注释着色",
						desc: "为支持语言代码块中的行注释与块注释设置颜色。",
						control: { type: "toggle", key: "enableComment" },
					},
					{
						name: "启用 HTML 注释着色",
						desc: "为笔记正文与 html/xml 代码块中的 <!-- --> 着色。",
						control: { type: "toggle", key: "enableHtmlComment" },
					},
					{
						name: "注释颜色",
						control: { type: "color", key: "commentColor" },
					},
					{
						name: "注释颜色（十六进制）",
						desc: "可选，例如 #7ec699。",
						control: {
							type: "text",
							key: "commentColor",
							placeholder: "#7ec699",
							validate: (value: string) =>
								HEX_COLOR.test(value.trim())
									? undefined
									: "请输入合法的十六进制颜色，例如 #7ec699。",
						},
					},
				],
			},
		];
	}
}
