import { App, PluginSettingTab, Setting } from "obsidian";
import type JavaAnnotationHighlightPlugin from "./main";

export class JavaHighlightSettingTab extends PluginSettingTab {
	plugin: JavaAnnotationHighlightPlugin;

	constructor(app: App, plugin: JavaAnnotationHighlightPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Java Annotation Highlight" });

		new Setting(containerEl)
			.setName("阅读视图生效")
			.setDesc("在阅读视图 / 实时预览已渲染的代码块中应用颜色")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableReadingView)
					.onChange(async (value) => {
						this.plugin.settings.enableReadingView = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("编辑视图生效")
			.setDesc("在源码模式 / 实时预览编辑代码块时应用颜色")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableEditingView)
					.onChange(async (value) => {
						this.plugin.settings.enableEditingView = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("支持的语言")
			.setDesc(
				"逗号分隔的代码块语言（注解语法一致即可），如 java, kotlin, scala, groovy；kt 会映射为 kotlin",
			)
			.addText((text) =>
				text
					.setPlaceholder("java, kotlin, scala, groovy")
					.setValue(this.plugin.settings.languages)
					.onChange(async (value) => {
						this.plugin.settings.languages = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("自定义注解颜色")
			.setDesc("为支持语言中 @注解（如 @Override / @Autowired）设置颜色")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableAnnotation)
					.onChange(async (value) => {
						this.plugin.settings.enableAnnotation = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			)
			.addColorPicker((picker) =>
				picker
					.setValue(this.plugin.settings.annotationColor)
					.onChange(async (value) => {
						this.plugin.settings.annotationColor = value;
						await this.plugin.saveSettings();
					}),
			)
			.addText((text) =>
				text
					.setPlaceholder("#d19a66")
					.setValue(this.plugin.settings.annotationColor)
					.onChange(async (value) => {
						if (!/^#[0-9A-Fa-f]{3,8}$/.test(value.trim())) return;
						this.plugin.settings.annotationColor = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("自定义注释颜色")
			.setDesc("为 // 行注释与 /* */ 块注释设置颜色")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableComment)
					.onChange(async (value) => {
						this.plugin.settings.enableComment = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			)
			.addColorPicker((picker) =>
				picker
					.setValue(this.plugin.settings.commentColor)
					.onChange(async (value) => {
						this.plugin.settings.commentColor = value;
						await this.plugin.saveSettings();
					}),
			)
			.addText((text) =>
				text
					.setPlaceholder("#7ec699")
					.setValue(this.plugin.settings.commentColor)
					.onChange(async (value) => {
						if (!/^#[0-9A-Fa-f]{3,8}$/.test(value.trim())) return;
						this.plugin.settings.commentColor = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("HTML 注释")
			.setDesc(
				"为笔记正文与 html/xml 代码块中的 <!-- 注释 --> 着色（使用上方注释颜色）",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableHtmlComment)
					.onChange(async (value) => {
						this.plugin.settings.enableHtmlComment = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
