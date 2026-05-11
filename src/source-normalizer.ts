const FLOWCHART_START = /^\s*(?:flowchart|graph)\b/i;

const needsQuotedLabel = (label: string): boolean => {
  const trimmed = label.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("\"") || trimmed.startsWith("'") || trimmed.startsWith("`")) {
    return false;
  }
  return /[(),]/.test(label);
};

const normalizeEscapedLineBreaks = (label: string): string =>
  label.replace(/\\n/g, "<br/>");

const quoteLabel = (label: string): string =>
  `["${normalizeEscapedLineBreaks(label).replace(/"/g, "#quot;")}"]`;

const normalizeLabel = (label: string): string => {
  const normalized = normalizeEscapedLineBreaks(label);
  return needsQuotedLabel(normalized) ? quoteLabel(normalized) : `[${normalized}]`;
};

const normalizeEdgeLabels = (line: string): string =>
  line.replace(/\|([^|]*)\|/g, (_match, label: string) =>
    `|${normalizeEscapedLineBreaks(label)}|`,
  );

const normalizeFlowchartLine = (line: string): string => {
  let result = "";
  let index = 0;

  while (index < line.length) {
    const start = line.indexOf("[", index);
    if (start === -1) {
      result += line.slice(index);
      break;
    }

    const end = line.indexOf("]", start + 1);
    if (end === -1) {
      result += line.slice(index);
      break;
    }

    const label = line.slice(start + 1, end);
    result += line.slice(index, start);
    result += normalizeLabel(label);
    index = end + 1;
  }

  return normalizeEdgeLabels(result);
};

/**
 * Obsidian's bundled Mermaid parser treats parentheses inside unquoted
 * flowchart square-bracket labels as shape syntax. Other Mermaid renderers are
 * more forgiving, so normalize the source before parse/render:
 *
 *   A[canTransfer(from, to, amount)]
 *   -> A["canTransfer(from, to, amount)"]
 *
 * It also converts escaped newlines inside labels to Mermaid HTML breaks:
 *
 *   A["Smart Contracts\n(on-chain events)"]
 *   -> A["Smart Contracts<br/>(on-chain events)"]
 */
export const normalizeMermaidSource = (source: string): string => {
  const lines = source.split("\n");
  const firstMeaningfulLine = lines.find((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith("%%");
  });

  if (!firstMeaningfulLine || !FLOWCHART_START.test(firstMeaningfulLine)) {
    return source;
  }

  return lines.map(normalizeFlowchartLine).join("\n");
};
