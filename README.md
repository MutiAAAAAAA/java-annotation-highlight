# Java Annotation Highlight

Customize colors for JVM-style **annotations** (`@Override`) and **comments** (`//`, `/* */`, `<!-- -->`) in Obsidian code blocks and notes.

This plugin does **not** collect telemetry, show ads, or make network requests. All highlighting runs locally.

## Features

- Custom colors for `@annotations` (e.g. `@Autowired`, `@Bean`)
- Custom colors for `//` line comments and `/* */` block comments
- Optional HTML comments: `<!-- ... -->` in note body and html/xml fences
- Works in **Reading view** and **Editing** (source / live preview)
- Configurable languages (default: `java, kotlin, scala, groovy`)
- Independent toggles for reading view vs editing view

## Demo

````markdown
```java
@Component
public class Demo {
    // line comment
    /* block comment */
    @Bean
    public String hello() {
        return "hi";
    }
}
```
````

```markdown
<!-- section note -->
```

## Settings

Open **Settings → Java Annotation Highlight**:

| Setting | Description |
| --- | --- |
| Reading view | Apply colors to rendered / preview code blocks |
| Editing view | Apply colors while editing fences / markdown |
| Languages | Comma-separated fence languages (`kt` → `kotlin`) |
| Annotation color | Color for `@Name` |
| Comment color | Color for `//` and `/* */` |
| HTML comments | Color `<!-- -->` using the comment color |

## Install

### From Community Plugins (after approval)

1. Settings → Community plugins → Browse
2. Search **Java Annotation Highlight**
3. Install and enable

### Manual install

1. Build:
   ```bash
   npm install
   npm run build
   ```
2. Copy into your vault:
   ```text
   <Vault>/.obsidian/plugins/java-annotation-highlight/
     ├── main.js
     ├── manifest.json
     └── styles.css
   ```
3. Enable the plugin in Community plugins.

## Development

```bash
npm install
npm run dev
```

## Privacy

- No analytics / telemetry
- No remote code loading
- No network access required

## License

MIT © 悸節
