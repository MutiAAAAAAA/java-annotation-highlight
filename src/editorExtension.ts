import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
} from "@codemirror/view";
import type { JavaHighlightSettings } from "./settings";

const ANNOTATION_RE = /@[A-Za-z_][\w.]*/g;
const LINE_COMMENT_RE = /\/\/.*$/g;
const FENCE_RE = /^(\s*)(`{3,}|~{3,})\s*([^\s`~]*)/;

type Hit = { from: number; to: number; kind: "annotation" | "comment" };

function parseFence(lineText: string): { lang: string } | null {
	const m = lineText.match(FENCE_RE);
	if (!m) return null;
	return { lang: (m[3] ?? "").toLowerCase() };
}

/**
 * Scan from doc start so viewport mid-block still knows fence language.
 * Returns whether each line index (1-based) is inside a ```java body.
 */
function javaBodyLineFlags(
	doc: EditorView["state"]["doc"],
	fromLine: number,
	toLine: number,
): boolean[] {
	const flags: boolean[] = [];
	let inFence = false;
	let fenceLang = "";

	for (let n = 1; n <= toLine; n++) {
		const text = doc.line(n).text;
		const fence = parseFence(text);

		if (fence) {
			if (inFence) {
				inFence = false;
				fenceLang = "";
				if (n >= fromLine) flags[n] = false;
			} else {
				inFence = true;
				fenceLang = fence.lang;
				if (n >= fromLine) flags[n] = false; // fence opener itself
			}
			continue;
		}

		if (n >= fromLine) {
			flags[n] = inFence && fenceLang === "java";
		}
	}

	return flags;
}

function collectHitsOnLine(
	lineFrom: number,
	text: string,
	settings: JavaHighlightSettings,
): Hit[] {
	const hits: Hit[] = [];
	const commentSpans: Array<{ from: number; to: number }> = [];

	if (settings.enableComment) {
		LINE_COMMENT_RE.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = LINE_COMMENT_RE.exec(text)) !== null) {
			const span = {
				from: lineFrom + m.index,
				to: lineFrom + m.index + m[0].length,
			};
			commentSpans.push(span);
			hits.push({ ...span, kind: "comment" });
		}
	}

	if (settings.enableAnnotation) {
		ANNOTATION_RE.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = ANNOTATION_RE.exec(text)) !== null) {
			const aFrom = lineFrom + m.index;
			const aTo = aFrom + m[0].length;
			const inComment = commentSpans.some((r) => aFrom < r.to && aTo > r.from);
			if (inComment) continue;
			hits.push({ from: aFrom, to: aTo, kind: "annotation" });
		}
	}

	hits.sort((a, b) => a.from - b.from || a.to - b.to);
	return hits;
}

function markFor(
	kind: "annotation" | "comment",
	settings: JavaHighlightSettings,
): Decoration {
	const color =
		kind === "annotation"
			? settings.annotationColor
			: settings.commentColor;
	const cls =
		kind === "annotation" ? "cm-jah-annotation" : "cm-jah-comment";
	return Decoration.mark({
		class: cls,
		attributes: { style: `color: ${color} !important` },
	});
}

function buildDecorations(
	view: EditorView,
	settings: JavaHighlightSettings,
): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();

	if (
		!settings.enableEditingView ||
		(!settings.enableAnnotation && !settings.enableComment)
	) {
		return builder.finish();
	}

	const doc = view.state.doc;
	const allHits: Hit[] = [];

	for (const { from: vf, to: vt } of view.visibleRanges) {
		const fromLine = doc.lineAt(vf).number;
		const toLine = doc.lineAt(vt).number;
		const inJava = javaBodyLineFlags(doc, fromLine, toLine);

		for (let n = fromLine; n <= toLine; n++) {
			if (!inJava[n]) continue;
			const line = doc.line(n);
			allHits.push(...collectHitsOnLine(line.from, line.text, settings));
		}
	}

	allHits.sort((a, b) => a.from - b.from || a.to - b.to);

	let lastTo = -1;
	for (const hit of allHits) {
		if (hit.from < lastTo) continue; // skip overlaps
		builder.add(hit.from, hit.to, markFor(hit.kind, settings));
		lastTo = hit.to;
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
