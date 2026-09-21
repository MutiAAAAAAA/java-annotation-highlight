import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
} from "@codemirror/view";
import type { JavaHighlightSettings } from "./settings";

const annotationMark = Decoration.mark({ class: "cm-jah-annotation" });
const commentMark = Decoration.mark({ class: "cm-jah-comment" });

const ANNOTATION_RE = /@[A-Za-z_][\w.]*/g;
const LINE_COMMENT_RE = /\/\/.*$/gm;

function isJavaInfo(info: string): boolean {
	const lang = info.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
	return lang === "java";
}

function collectJavaCodeRanges(
	view: EditorView,
	from: number,
	to: number,
): Array<{ from: number; to: number }> {
	const ranges: Array<{ from: number; to: number }> = [];
	const tree = syntaxTree(view.state);

	tree.iterate({
		from,
		to,
		enter(node: { name: string; node: { getChild: (type: string) => { from: number; to: number } | null } }) {
			if (node.name !== "FencedCode") return;

			const infoNode = node.node.getChild("CodeInfo");
			const info = infoNode
				? view.state.doc.sliceString(infoNode.from, infoNode.to)
				: "";
			if (!isJavaInfo(info)) return;

			const codeText = node.node.getChild("CodeText");
			if (codeText) {
				ranges.push({ from: codeText.from, to: codeText.to });
			}
		},
	});

	return ranges;
}

function overlaps(
	aFrom: number,
	aTo: number,
	ranges: Array<{ from: number; to: number }>,
): boolean {
	return ranges.some((r) => aFrom < r.to && aTo > r.from);
}

function buildDecorations(
	view: EditorView,
	settings: JavaHighlightSettings,
): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	if (!settings.enableAnnotation && !settings.enableComment) {
		return builder.finish();
	}

	for (const { from: vf, to: vt } of view.visibleRanges) {
		const javaRanges = collectJavaCodeRanges(view, vf, vt);

		for (const range of javaRanges) {
			const from = Math.max(range.from, vf);
			const to = Math.min(range.to, vt);
			if (from >= to) continue;

			const text = view.state.doc.sliceString(from, to);
			const commentSpans: Array<{ from: number; to: number }> = [];
			type Hit = { from: number; to: number; kind: "annotation" | "comment" };
			const hits: Hit[] = [];

			if (settings.enableComment) {
				LINE_COMMENT_RE.lastIndex = 0;
				let m: RegExpExecArray | null;
				while ((m = LINE_COMMENT_RE.exec(text)) !== null) {
					const span = {
						from: from + m.index,
						to: from + m.index + m[0].length,
					};
					commentSpans.push(span);
					hits.push({ ...span, kind: "comment" });
				}
			}

			if (settings.enableAnnotation) {
				ANNOTATION_RE.lastIndex = 0;
				let m: RegExpExecArray | null;
				while ((m = ANNOTATION_RE.exec(text)) !== null) {
					const aFrom = from + m.index;
					const aTo = aFrom + m[0].length;
					if (overlaps(aFrom, aTo, commentSpans)) continue;
					hits.push({ from: aFrom, to: aTo, kind: "annotation" });
				}
			}

			hits.sort((a, b) => a.from - b.from || a.to - b.to);

			for (const hit of hits) {
				builder.add(
					hit.from,
					hit.to,
					hit.kind === "annotation" ? annotationMark : commentMark,
				);
			}
		}
	}

	return builder.finish();
}

export function createJavaHighlightExtension(
	getSettings: () => JavaHighlightSettings,
) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, getSettings());
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = buildDecorations(update.view, getSettings());
				}
			}
		},
		{
			decorations: (v) => v.decorations,
		},
	);
}
