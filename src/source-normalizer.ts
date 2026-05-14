const FLOWCHART_START = /^\s*(?:flowchart|graph)\b/i;

export interface MermaidNormalizeOptions {
  normalizeFlowchartLabels: boolean;
  normalizeEscapedNewlines: boolean;
}

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

const applyNewlines = (label: string, options: MermaidNormalizeOptions): string =>
  options.normalizeEscapedNewlines ? normalizeEscapedLineBreaks(label) : label;

const normalizeEdgeLabels = (line: string, options: MermaidNormalizeOptions): string => {
  if (!options.normalizeEscapedNewlines) return line;
  return line.replace(/\|([^|]*)\|/g, (_match, label: string) =>
    `|${normalizeEscapedLineBreaks(label)}|`,
  );
};

const normalizeLabel = (label: string, options: MermaidNormalizeOptions): string => {
  const text = applyNewlines(label, options);
  if (options.normalizeFlowchartLabels && needsQuotedLabel(text)) {
    return `["${text.replace(/"/g, "#quot;")}"]`;
  }
  return `[${text}]`;
};

const normalizeFlowchartLine = (line: string, options: MermaidNormalizeOptions): string => {
  if (!options.normalizeFlowchartLabels && !options.normalizeEscapedNewlines) {
    return line;
  }

  if (!options.normalizeFlowchartLabels && options.normalizeEscapedNewlines) {
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
      result += `[${applyNewlines(label, options)}]`;
      index = end + 1;
    }

    return normalizeEdgeLabels(result, options);
  }

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
    result += normalizeLabel(label, options);
    index = end + 1;
  }

  return normalizeEdgeLabels(result, options);
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
export const normalizeMermaidSource = (
  source: string,
  options: MermaidNormalizeOptions,
): string => {
  const lines = source.split("\n");
  const firstMeaningfulLine = lines.find((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith("%%");
  });

  if (!firstMeaningfulLine || !FLOWCHART_START.test(firstMeaningfulLine)) {
    return source;
  }

  if (!options.normalizeFlowchartLabels && !options.normalizeEscapedNewlines) {
    return source;
  }

  return lines.map((line) => normalizeFlowchartLine(line, options)).join("\n");
};
