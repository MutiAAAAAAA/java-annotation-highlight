import { RangeSetBuilder, type Text } from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
} from "@codemirror/view";
import {
	normalizeLang,
	parseLanguageList,
	type JavaHighlightSettings,
} from "./settings";

type Hit = { from: number; to: number; kind: "annotation" | "comment" };
type DocRange = { from: number; to: number };

const FENCE_RE = /^(\s*)(`{3,}|~{3,})\s*([^\s`~]*)/;
const ANNOTATION_RE = /^@[A-Za-z_][\w.]*/;
const HTML_COMMENT_LOOKBACK = 100_000;

function parseFence(lineText: string): { lang: string } | null {
	const m = lineText.match(FENCE_RE);
	if (!m) return null;
	return { lang: normalizeLang(m[3] ?? "") };
}

type FenceScan = {
	/** Bodies of fences whose lang is in the annotation language set */
	annotationRanges: DocRange[];
	/** Bodies of every fenced code block (to skip when scanning markdown HTML comments) */
	allFenceBodies: DocRange[];
};

function scanFences(doc: Text, annotationLangs: Set<string>): FenceScan {
	const annotationRanges: DocRange[] = [];
	const allFenceBodies: DocRange[] = [];
	let inFence = false;
	let fenceLang = "";
	let bodyStart = 0;

	for (let n = 1; n <= doc.lines; n++) {
		const line = doc.line(n);
		const fence = parseFence(line.text);
		if (!fence) continue;

		if (inFence) {
			if (bodyStart <= line.from) {
				const body = { from: bodyStart, to: line.from };
				allFenceBodies.push(body);
				if (annotationLangs.has(fenceLang)) {
					annotationRanges.push(body);
				}
			}
			inFence = false;
			fenceLang = "";
		} else {
			inFence = true;
			fenceLang = fence.lang;
			bodyStart = n < doc.lines ? line.to + 1 : line.to;
		}
	}

	if (inFence && bodyStart <= doc.length) {
		const body = { from: bodyStart, to: doc.length };
		allFenceBodies.push(body);
		if (annotationLangs.has(fenceLang)) {
			annotationRanges.push(body);
		}
	}

	return { annotationRanges, allFenceBodies };
}

function inAnyRange(pos: number, ranges: DocRange[]): boolean {
	// ranges are ordered; linear scan is fine for typical note fence counts
	for (const r of ranges) {
		if (pos < r.from) return false;
		if (pos >= r.from && pos < r.to) return true;
	}
	return false;
}

/**
 * Scan annotation-language fence body: @annotations, // and /* *\/.
 * Skips matches inside strings.
 */
function collectJvmHitsInRange(
	doc: Text,
	range: DocRange,
	visibleFrom: number,
	visibleTo: number,
	settings: JavaHighlightSettings,
): Hit[] {
	const scanFrom = range.from;
	const scanTo = Math.min(range.to, visibleTo);
	if (scanFrom >= scanTo) return [];

	const fullText = doc.sliceString(scanFrom, scanTo);
	const hits: Hit[] = [];
	let i = 0;
	let inBlock = false;
	let inLine = false;
	let inString: '"' | "'" | null = null;
	let blockStart = -1;
	let lineStart = -1;

	const abs = (idx: number) => scanFrom + idx;

	const pushClipped = (from: number, to: number, kind: Hit["kind"]) => {
		const a = Math.max(from, visibleFrom);
		const b = Math.min(to, visibleTo);
		if (a < b) hits.push({ from: a, to: b, kind });
	};

	while (i < fullText.length) {
		const ch = fullText[i]!;
		const next = fullText[i + 1];
		const pos = abs(i);

		if (inBlock) {
			if (ch === "*" && next === "/") {
				if (settings.enableComment) pushClipped(blockStart, pos + 2, "comment");
				inBlock = false;
				blockStart = -1;
				i += 2;
				continue;
			}
			i++;
			continue;
		}

		if (inLine) {
			if (ch === "\n") {
				if (settings.enableComment) pushClipped(lineStart, pos, "comment");
				inLine = false;
				lineStart = -1;
				i++;
				continue;
			}
			i++;
			continue;
		}

		if (inString) {
			if (ch === "\\") {
				i += 2;
				continue;
			}
			if (ch === inString) inString = null;
			i++;
			continue;
		}

		if (ch === "/" && next === "*") {
			inBlock = true;
			blockStart = pos;
			i += 2;
			continue;
		}
		if (ch === "/" && next === "/") {
			inLine = true;
			lineStart = pos;
			i += 2;
			continue;
		}
		if (ch === '"' || ch === "'") {
			inString = ch;
			i++;
			continue;
		}

		if (settings.enableAnnotation && ch === "@") {
			const m = fullText.slice(i).match(ANNOTATION_RE);
			if (m) {
				pushClipped(pos, pos + m[0].length, "annotation");
				i += m[0].length;
				continue;
			}
		}

		i++;
	}

	if (inBlock && settings.enableComment) {
		pushClipped(blockStart, abs(fullText.length), "comment");
	}
	if (inLine && settings.enableComment) {
		pushClipped(lineStart, abs(fullText.length), "comment");
	}

	return hits;
}

function findHtmlCommentScanStart(
	doc: Text,
	visibleFrom: number,
	floor = 0,
): number {
	const lookback = Math.min(visibleFrom - floor, HTML_COMMENT_LOOKBACK);
	if (lookback <= 0) return visibleFrom;

	const text = doc.sliceString(visibleFrom - lookback, visibleFrom);
	let lastOpen = -1;
	let i = 0;
	while (i < text.length) {
		if (text.startsWith("<!--", i)) {
			lastOpen = i;
			i += 4;
			continue;
		}
		if (text.startsWith("-->", i)) {
			lastOpen = -1;
			i += 3;
			continue;
		}
		i++;
	}
	return lastOpen >= 0 ? visibleFrom - lookback + lastOpen : visibleFrom;
}

/**
 * Color <!-- ... --> in markdown (outside fences) and inside fence bodies.
 */
function collectHtmlCommentHits(
	doc: Text,
	visibleFrom: number,
	visibleTo: number,
	fenceBodies: DocRange[],
	onlyOutsideFences: boolean,
	scanFloor = 0,
): Hit[] {
	const scanFrom = findHtmlCommentScanStart(doc, visibleFrom, scanFloor);
	const scanTo = visibleTo;
	if (scanFrom >= scanTo) return [];

	const text = doc.sliceString(scanFrom, scanTo);
	const hits: Hit[] = [];
	let i = 0;
	let inComment = false;
	let commentStart = -1;

	const abs = (idx: number) => scanFrom + idx;

	const pushClipped = (from: number, to: number) => {
		const a = Math.max(from, visibleFrom);
		const b = Math.min(to, visibleTo);
		if (a < b) hits.push({ from: a, to: b, kind: "comment" });
	};

	const skipIfInFence = (pos: number): boolean =>
		onlyOutsideFences && inAnyRange(pos, fenceBodies);

	while (i < text.length) {
		const pos = abs(i);

		if (inComment) {
			if (text.startsWith("-->", i)) {
				pushClipped(commentStart, pos + 3);
				inComment = false;
				commentStart = -1;
				i += 3;
				continue;
			}
			i++;
			continue;
		}

		if (skipIfInFence(pos)) {
			i++;
			continue;
		}

		if (text.startsWith("<!--", i)) {
			inComment = true;
			commentStart = pos;
			i += 4;
			continue;
		}
		i++;
	}

	if (inComment) {
		pushClipped(commentStart, abs(text.length));
	}

	return hits;
}

function markFor(kind: "annotation" | "comment"): Decoration {
	const cls =
		kind === "annotation" ? "cm-jah-annotation" : "cm-jah-comment";
	return Decoration.mark({ class: cls });
}

function buildDecorations(
	view: EditorView,
	annotationRanges: DocRange[],
	allFenceBodies: DocRange[],
	settings: JavaHighlightSettings,
): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();

	const wantJvm =
		settings.enableAnnotation || settings.enableComment;
	const wantHtml = settings.enableHtmlComment;

	if (!settings.enableEditingView || (!wantJvm && !wantHtml)) {
		return builder.finish();
	}

	const doc = view.state.doc;
	const allHits: Hit[] = [];

	for (const { from: vf, to: vt } of view.visibleRanges) {
		if (wantJvm && annotationRanges.length > 0) {
			for (const range of annotationRanges) {
				if (range.to <= vf || range.from >= vt) continue;
				allHits.push(
					...collectJvmHitsInRange(doc, range, vf, vt, settings),
				);
			}
		}

		if (wantHtml) {
			// Markdown HTML comments outside fences
			allHits.push(
				...collectHtmlCommentHits(doc, vf, vt, allFenceBodies, true, 0),
			);
			// <!-- --> inside any code fence (html/xml/…)
			for (const range of allFenceBodies) {
				if (range.to <= vf || range.from >= vt) continue;
				const from = Math.max(vf, range.from);
				const to = Math.min(vt, range.to);
				allHits.push(
					...collectHtmlCommentHits(doc, from, to, [], false, range.from),
				);
			}
		}
	}

	allHits.sort((a, b) => a.from - b.from || a.to - b.to);

	let lastTo = -1;
	for (const hit of allHits) {
		if (hit.from < lastTo) continue;
		builder.add(hit.from, hit.to, markFor(hit.kind));
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
			annotationRanges: DocRange[];
			allFenceBodies: DocRange[];

			constructor(view: EditorView) {
				const langs = parseLanguageList(getSettings().languages);
				const scanned = scanFences(view.state.doc, langs);
				this.annotationRanges = scanned.annotationRanges;
				this.allFenceBodies = scanned.allFenceBodies;
				this.decorations = buildDecorations(
					view,
					this.annotationRanges,
					this.allFenceBodies,
					getSettings(),
				);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					// Always rescan fences on doc changes — mapping ranges with
					// bias can drop the edited span and delay visible highlights
					// until the view is remounted.
					if (update.docChanged) {
						const langs = parseLanguageList(getSettings().languages);
						const scanned = scanFences(update.view.state.doc, langs);
						this.annotationRanges = scanned.annotationRanges;
						this.allFenceBodies = scanned.allFenceBodies;
					}
					this.decorations = buildDecorations(
						update.view,
						this.annotationRanges,
						this.allFenceBodies,
						getSettings(),
					);
				}
			}
		},
		{
			decorations: (v) => v.decorations,
		},
	);
}
