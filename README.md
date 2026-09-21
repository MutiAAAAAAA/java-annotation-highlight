# Java Annotation Highlight

Obsidian 插件：自定义 Java 代码块中 **注解**（`@Override`）和 **行注释**（`// ...`）的颜色。

## 功能

- 自定义 `@注解` 颜色（默认主题下通常为灰色）
- 自定义 `//` 行注释颜色
- 支持阅读视图 / 实时预览（Prism）与源码编辑（CodeMirror）
- 设置页可开关并选择颜色

## 安装

### 手动安装

1. 在本目录执行：
   ```bash
   npm install
   npm run build
   ```
2. 将以下文件复制到库的插件目录：
   ```
   <Vault>/.obsidian/plugins/java-annotation-highlight/
     ├── main.js
     ├── manifest.json
     └── styles.css
   ```
3. 打开 Obsidian → 设置 → 第三方插件 → 启用 **Java Annotation Highlight**

### 开发模式

```bash
npm install
npm run dev
```

用符号链接或直接把本仓库放到 `plugins/java-annotation-highlight` 下即可热更新。

## 使用

1. 启用插件后，设置中打开 **Java Annotation Highlight**
2. 用颜色选择器或十六进制值设置注解 / 注释颜色
3. 在笔记中使用：

````markdown
```java
@Override
public void run() {
    // 这是注释
    System.out.println("hi");
}
```
````

注解和 `//` 注释会按你设置的颜色显示。
