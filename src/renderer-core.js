const MAX_GENERATION = 6;
const PAGE_WIDTH_PT = 792;
const PAGE_HEIGHT_PT = 612;
const GENERATION_SIZES = [14, 12, 10.5, 9, 7.5, 6.5, 5.5];
const BOX_WIDTHS = [108, 88, 70, 54, 40, 14, 11];
const BOX_HEIGHTS = [54, 46, 36, 30, 24, 72, 64];
const BASE_ROW_STEPS = [0, 24, 26, 28, 30, 36, 40];
const CHART_WIDTH = 748;
const MARGIN_X = 22;
const MARGIN_TOP = 18;
const INNER_MARGIN = 3;

const DEFAULT_SETTINGS = {
  fontFamily: "Palatino Linotype",
  fauxBold: true,
  generationStyles: buildDefaultGenerationStyles(),
  titleBox: {
    enabled: true,
    title: "Johnson Family Tree",
    subtitle: "Demo export layout\nDraft lineage with placeholder crest",
    author: "Prepared with TreeGen",
    crestDataUrl: "",
  },
  boxNumbering: {
    enabled: false,
    startAt: 0,
  },
};

export function parseYaml(text) {
  const lines = String(text)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => !/^\s*#/.test(line));
  const { value } = parseBlock(lines, 0, 0);
  return value;
}

export function renderYamlToSvg(yamlText, overrides = {}) {
  const parsed = parseYaml(yamlText);
  const state = normalizeState(parsed, overrides);
  return renderStateToSvg(state);
}

export function renderStateToSvg(state) {
  const slotDefinitions = buildSlotDefinitions(MAX_GENERATION);
  const layout = buildLayout(slotDefinitions, state);
  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_WIDTH_PT} ${PAGE_HEIGHT_PT}" width="11in" height="8.5in">`
  );
  parts.push(`<rect x="0" y="0" width="${PAGE_WIDTH_PT}" height="${PAGE_HEIGHT_PT}" fill="#fffdfa"/>`);

  for (let generation = MAX_GENERATION; generation >= 1; generation -= 1) {
    const childGeneration = generation - 1;
    const childCount = 2 ** childGeneration;
    for (let index = 0; index < childCount; index += 1) {
      const childSlot = getSlotByGenerationIndex(slotDefinitions, childGeneration, index);
      const fatherSlot = getSlotByGenerationIndex(slotDefinitions, generation, index * 2);
      const motherSlot = getSlotByGenerationIndex(slotDefinitions, generation, index * 2 + 1);
      const childNode = layout.nodes[childSlot.id];
      const fatherNode = layout.nodes[fatherSlot.id];
      const motherNode = layout.nodes[motherSlot.id];
      const noteText = motherSlot.generation >= 5 ? "" : (state.people[motherSlot.id]?.childrenNote || "");
      parts.push(
        drawConnector(
          childSlot,
          childNode,
          fatherNode,
          motherNode,
          noteText,
          getGenerationStyle(state, motherSlot.generation),
          layout.rowSteps[motherSlot.generation]
        )
      );
    }
  }

  for (const slot of slotDefinitions) {
    parts.push(drawNode(state, slot, layout.nodes[slot.id]));
  }

  if (state.settings.titleBox.enabled) {
    parts.push(drawTitleBox(state));
  }

  parts.push(`</svg>`);
  return parts.join("");
}

function normalizeState(data, overrides) {
  const nextSettings = structuredClone(DEFAULT_SETTINGS);
  const importedSettings = data.settings || {};
  if (typeof importedSettings.fontFamily === "string" && importedSettings.fontFamily.trim()) {
    nextSettings.fontFamily = importedSettings.fontFamily.trim();
  }
  if (typeof importedSettings.fauxBold === "boolean") {
    nextSettings.fauxBold = importedSettings.fauxBold;
  }
  if (importedSettings.generationStyles && typeof importedSettings.generationStyles === "object") {
    nextSettings.generationStyles = normalizeGenerationStyles(
      Array.from({ length: MAX_GENERATION + 1 }, (_, generation) => importedSettings.generationStyles[`generation${generation}`] || {})
    );
  }
  if (importedSettings.titleBox && typeof importedSettings.titleBox === "object") {
    nextSettings.titleBox = {
      ...nextSettings.titleBox,
      ...importedSettings.titleBox,
    };
  }
  if (importedSettings.boxNumbering && typeof importedSettings.boxNumbering === "object") {
    nextSettings.boxNumbering = {
      enabled: typeof importedSettings.boxNumbering.enabled === "boolean" ? importedSettings.boxNumbering.enabled : nextSettings.boxNumbering.enabled,
      startAt: Number(importedSettings.boxNumbering.startAt ?? nextSettings.boxNumbering.startAt) || 0,
    };
  }
  if (overrides.settings) {
    Object.assign(nextSettings, overrides.settings);
  }

  const slotDefinitions = buildSlotDefinitions(MAX_GENERATION);
  const people = {};
  const importedPeople = data.people || {};
  for (const slot of slotDefinitions) {
    const incoming = importedPeople[slot.id] || {};
    people[slot.id] = {
      name: typeof incoming.name === "string" && incoming.name.trim() ? incoming.name.trim() : slot.label,
      birthYear: sanitizeYear(incoming.birthYear ?? "?"),
      deathYear: sanitizeYear(incoming.deathYear ?? "?"),
      childrenNote: typeof incoming.childrenNote === "string" ? incoming.childrenNote : "",
      note: typeof incoming.note === "string" ? incoming.note : "",
    };
  }
  return { settings: nextSettings, people };
}

function buildLayout(slotDefinitions, state) {
  const rowSteps = [...BASE_ROW_STEPS];
  for (let generation = 1; generation <= 4; generation += 1) {
    const childGeneration = generation - 1;
    const pairCount = 2 ** childGeneration;
    const pairWidth = CHART_WIDTH / pairCount;
      const noteWidth = generation === 4 ? Math.max(36, pairWidth * 0.42) : Math.max(26, pairWidth / 2 - 8);
    let maxHeight = 0;
    for (let index = 0; index < pairCount; index += 1) {
      const motherSlot = getSlotByGenerationIndex(slotDefinitions, generation, index * 2 + 1);
      const childLines = compactLines(state.people[motherSlot.id]?.childrenNote || "").slice(0, 9);
      if (!childLines.length) continue;
      const titleText = `${childLines.length} ${childLines.length === 1 ? "Child" : "Children"}`;
      const preferredChildSize = generation === 4
        ? Math.max(2.6, getGenerationStyle(state, generation).childrenSize - 2.8)
        : getGenerationStyle(state, generation).childrenSize;
      const noteLayout = layoutAnnotationText(childLines, noteWidth, preferredChildSize, titleText, 1000);
      maxHeight = Math.max(maxHeight, noteLayout.height);
    }
    if (maxHeight > 0) {
      const dateReserve = generation >= 4 ? 12 : 0;
      rowSteps[generation] = Math.max(rowSteps[generation], Math.ceil(maxHeight + 10 + dateReserve));
    }
  }

  const rowTops = {};
  rowTops[MAX_GENERATION] = MARGIN_TOP;
  for (let generation = MAX_GENERATION - 1; generation >= 0; generation -= 1) {
    rowTops[generation] = rowTops[generation + 1] + BOX_HEIGHTS[generation + 1] + rowSteps[generation + 1];
  }

  const rootBottom = rowTops[0] + BOX_HEIGHTS[0];
  const maxBottom = PAGE_HEIGHT_PT - 18;
  if (rootBottom > maxBottom) {
    const shiftUp = rootBottom - maxBottom;
    for (let generation = 0; generation <= MAX_GENERATION; generation += 1) {
      rowTops[generation] -= shiftUp;
    }
  }

  const positions = {};
  for (const slot of slotDefinitions) {
    const count = 2 ** slot.generation;
    const step = CHART_WIDTH / count;
    const centerX = MARGIN_X + (slot.index + 0.5) * step;
    const width = BOX_WIDTHS[slot.generation];
    const height = BOX_HEIGHTS[slot.generation];
    positions[slot.id] = {
      x: centerX - width / 2,
      y: rowTops[slot.generation],
      width,
      height,
      centerX,
      centerY: rowTops[slot.generation] + height / 2,
      generation: slot.generation,
      verticalText: slot.generation >= 5,
    };
  }

  return { nodes: positions, rowSteps };
}

function drawConnector(childSlot, childNode, fatherNode, motherNode, noteText, generationStyle, rowStep) {
  const parts = [];
  const joinY = Math.max(fatherNode.y + fatherNode.height, motherNode.y + motherNode.height) + 4;
  const midX = (fatherNode.centerX + motherNode.centerX) / 2;
  const childJoinY = childNode.y - 4;

  parts.push(line(fatherNode.centerX, fatherNode.y + fatherNode.height, fatherNode.centerX, joinY));
  parts.push(line(motherNode.centerX, motherNode.y + motherNode.height, motherNode.centerX, joinY));
  parts.push(line(fatherNode.centerX, joinY, motherNode.centerX, joinY));
  parts.push(line(midX, joinY, midX, childJoinY));
  parts.push(line(midX, childJoinY, childNode.centerX, childJoinY));
  parts.push(line(childNode.centerX, childJoinY, childNode.centerX, childNode.y));

  const childLines = compactLines(noteText).slice(0, 9);
  if (!childLines.length) {
    return `<g>${parts.join("")}</g>`;
  }

  const titleText = `${childLines.length} ${childLines.length === 1 ? "Child" : "Children"}`;
  const pairWidth = CHART_WIDTH / (2 ** childSlot.generation);
  const pairLeft = MARGIN_X + childSlot.index * pairWidth;
  const pairRight = pairLeft + pairWidth;
  const useFullPairWidth = motherNode.generation === 4;
  const laneLeft = useFullPairWidth ? midX + 8 : midX + 4;
  const laneRight = useFullPairWidth ? pairRight - 4 : pairRight - 2;
  const noteWidth = Math.max(24, useFullPairWidth ? Math.min(pairWidth * 0.39, laneRight - laneLeft) : Math.min(92, laneRight - laneLeft));
  const dateReserve = motherNode.generation >= 4 ? 12 : 0;
  const availableHeight = Math.max(10, childNode.y - (motherNode.y + motherNode.height + dateReserve + 6));
  const preferredChildSize = motherNode.generation === 4
    ? Math.max(2.6, generationStyle.childrenSize - 2.8)
    : generationStyle.childrenSize;
  const noteLayout = layoutAnnotationText(childLines, noteWidth, preferredChildSize, titleText, availableHeight);
  const noteX = clamp(motherNode.x + 2, laneLeft, Math.max(laneLeft, laneRight - noteLayout.width));
  const noteY = motherNode.y + motherNode.height + 4.2 + dateReserve;
  const titleY = noteY + noteLayout.fontSize;
  parts.push(text(noteX, titleY, titleText, generationStyle.childrenColor, noteLayout.fontSize, true, "start"));
  parts.push(`<line x1="${noteX}" y1="${round2(titleY + 2)}" x2="${round2(noteX + noteLayout.width)}" y2="${round2(titleY + 2)}" stroke="#303030" stroke-width="1.05"/>`);
  noteLayout.lines.forEach((lineText, idx) => {
    const y = titleY + 2.7 + (idx + 1) * noteLayout.lineHeight;
    parts.push(text(noteX + 1, y, lineText, generationStyle.childrenColor, noteLayout.fontSize, false, "start"));
  });
  return `<g>${parts.join("")}</g>`;
}

function drawNode(state, slot, node) {
  const person = state.people[slot.id];
  const style = getGenerationStyle(state, slot.generation);
  const parts = [];
  parts.push(`<g class="node-box" data-slot-id="${escapeAttribute(slot.id)}">`);
  parts.push(
    `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${slotCornerRadius(slot)}" fill="#fffdfa" stroke="#303030" stroke-width="1.25"/>`
  );

  const name = displayName(person.name);
  const dates = formatDates(person.birthYear, person.deathYear);
  if (node.verticalText) {
    const layout = fitVerticalNodeText(node, style, name);
    parts.push(`<g transform="translate(${round2(node.centerX)}, ${round2(node.centerY)}) rotate(-90)">`);
    const startY = -layout.height / 2 + layout.nameSize * 0.76;
    layout.nameLines.forEach((lineText, idx) => {
      parts.push(text(0, startY + idx * layout.lineHeight, lineText, style.nameColor, layout.nameSize, true, "middle", state.settings));
    });
    parts.push(`</g>`);
    const verticalDateLines = splitDateLines(person.birthYear, person.deathYear);
    verticalDateLines.forEach((lineText, idx) => {
      parts.push(
        text(
          node.centerX,
          node.y + node.height + layout.dateSize + 4 + idx * (layout.dateSize * 0.92),
          lineText,
          style.dateColor,
          layout.dateSize,
          false,
          "middle",
          state.settings
        )
      );
    });
  } else if (slot.generation >= 4) {
    const layout = fitBoxNameOnly(node, style, name, slot.generation);
    const startY = node.centerY - layout.height / 2 + layout.nameSize * 0.76;
    layout.nameLines.forEach((lineText, idx) => {
      parts.push(text(node.centerX, startY + idx * layout.lineHeight, lineText, style.nameColor, layout.nameSize, true, "middle", state.settings));
    });
    const lateDateLines = splitDateLines(person.birthYear, person.deathYear);
    const lateDateSize = slot.generation >= 5 ? Math.max(3.1, style.dateSize - 1.6) : Math.max(3.7, style.dateSize - 1.4);
    lateDateLines.forEach((lineText, idx) => {
      parts.push(
        text(
          node.centerX,
          node.y + node.height + lateDateSize + 4 + idx * (lateDateSize * 0.9),
          lineText,
          style.dateColor,
          lateDateSize,
          false,
          "middle",
          state.settings
        )
      );
    });
  } else {
    const noteLines = slot.generation <= 2 ? compactLines(person.note || "").slice(0, 2) : [];
    const layout = fitHorizontalNodeText(node, style, name, dates, noteLines);
    let y = node.centerY - layout.height / 2 + layout.nameSize * 0.76;
    layout.nameLines.forEach((lineText) => {
      parts.push(text(node.centerX, y, lineText, style.nameColor, layout.nameSize, true, "middle", state.settings));
      y += layout.nameLineHeight;
    });
    if (layout.nameLines.length && layout.dateLines.length) {
      y += layout.nameDateGap || 0;
    }
    layout.dateLines.forEach((lineText) => {
      parts.push(text(node.centerX, y, lineText, style.dateColor, layout.dateSize, false, "middle", state.settings));
      y += layout.dateLineHeight;
    });
    if (layout.dateLines.length && layout.noteLines.length) {
      y += layout.dateNoteGap || 0;
    }
    layout.noteLines.forEach((lineText) => {
      parts.push(text(node.centerX, y, lineText, "#000000", layout.noteSize, false, "middle", state.settings));
      y += layout.noteLineHeight;
    });
  }

  if (state.settings.boxNumbering.enabled) {
    const n = state.settings.boxNumbering.startAt + slot.index + (2 ** slot.generation - 1);
    parts.push(text(node.x + 1.2, node.y + 4.2, String(n), "#606060", 2.8, false, "start", state.settings));
  }

  parts.push(`</g>`);
  return parts.join("");
}

function fitHorizontalNodeText(node, style, name, dates, noteLines) {
  const availableWidth = Math.max(8, node.width - INNER_MARGIN * 2);
  const availableHeight = Math.max(8, node.height - INNER_MARGIN * 2);
  for (let scale = 1; scale >= 0.38; scale -= 0.025) {
    const nameSize = round2(style.nameSize * scale);
    const dateSize = round2((style.syncNameDate ? style.nameSize : style.dateSize) * Math.min(scale, 0.92));
    const noteSize = round2(Math.max(3.5, dateSize - 0.8));
    const nameChars = maxCharsForWidth(availableWidth, nameSize, true);
    const dateChars = maxCharsForWidth(availableWidth, dateSize, false);
    const noteChars = maxCharsForWidth(availableWidth, noteSize, false);
    const nameLines = fitWrappedLines(name, nameChars, 3);
    const dateLines = fitWrappedLines(dates, dateChars, 1);
    const wrappedNotes = noteLines.flatMap((line) => fitWrappedLines(line, noteChars, 1)).slice(0, 2);
    const nameLineHeight = Math.max(nameSize * 0.97, nameSize + 0.08);
    const dateLineHeight = Math.max(dateSize * 0.95, dateSize + 0.06);
    const noteLineHeight = Math.max(noteSize * 0.9, noteSize + 0.04);
    const nameDateGap = nameLines.length && dateLines.length ? 0.7 : 0;
    const dateNoteGap = dateLines.length && wrappedNotes.length ? 0.55 : 0;
    const height =
      nameLines.length * nameLineHeight +
      dateLines.length * dateLineHeight +
      wrappedNotes.length * noteLineHeight +
      nameDateGap +
      dateNoteGap;
    const widest = Math.max(
      ...nameLines.map((line) => estimateLineWidth(line, nameSize, true)),
      ...dateLines.map((line) => estimateLineWidth(line, dateSize, false)),
      ...(wrappedNotes.length ? wrappedNotes.map((line) => estimateLineWidth(line, noteSize, false)) : [0])
    );
    if (height <= availableHeight && widest <= availableWidth) {
      return {
        nameSize,
        dateSize,
        noteSize,
        nameLines,
        dateLines,
        noteLines: wrappedNotes,
        nameLineHeight,
        dateLineHeight,
        noteLineHeight,
        nameDateGap,
        dateNoteGap,
        height,
      };
    }
  }
  return {
    nameSize: 4.2,
    dateSize: 3.8,
    noteSize: 3.3,
    nameLines: fitWrappedLines(name, maxCharsForWidth(availableWidth, 4.2, true), 3),
    dateLines: [ellipsize(dates, maxCharsForWidth(availableWidth, 3.8, false))],
    noteLines: noteLines.slice(0, 1).map((line) => ellipsize(line, maxCharsForWidth(availableWidth, 3.3, false))),
    nameLineHeight: 4.0,
    dateLineHeight: 3.7,
    noteLineHeight: 3.2,
    nameDateGap: 0.7,
    dateNoteGap: noteLines.length ? 0.55 : 0,
    height: availableHeight,
  };
}

function fitBoxNameOnly(node, style, name, generation) {
  const availableWidth = Math.max(8, node.width - INNER_MARGIN * 2);
  const availableHeight = Math.max(8, node.height - INNER_MARGIN * 2);
  if (generation === 4) {
    for (let scale = 1; scale >= 0.42; scale -= 0.025) {
      const nameSize = round2(style.nameSize * scale);
      const nameChars = maxCharsForWidth(availableWidth, nameSize, true);
      const nameLines = fitWrappedLines(name, nameChars, 2);
      const lineHeight = Math.max(nameSize * 0.96, nameSize + 0.06);
      const height = nameLines.length * lineHeight;
      const widest = Math.max(...nameLines.map((line) => estimateLineWidth(line, nameSize, true)));
      if (height <= availableHeight && widest <= availableWidth) {
        return { nameSize, nameLines, lineHeight, height };
      }
    }
  }
  const maxWrapLines = generation === 4 ? 2 : 2;
  const minSingleScale = generation === 4 ? 0.38 : 0.28;
  for (let scale = 1; scale >= minSingleScale; scale -= 0.025) {
    const nameSize = round2(style.nameSize * scale);
    const lineHeight = Math.max(nameSize * 0.92, nameSize - 0.08);
    const widest = estimateLineWidth(name, nameSize, true);
    if (lineHeight <= availableHeight && widest <= availableWidth) {
      return { nameSize, nameLines: [name], lineHeight, height: lineHeight };
    }
  }
  for (let scale = 1; scale >= 0.38; scale -= 0.025) {
    const nameSize = round2(style.nameSize * scale);
    const nameChars = maxCharsForWidth(availableWidth, nameSize, true);
    const nameLines = fitWrappedLines(name, nameChars, maxWrapLines);
    const lineHeight = Math.max(nameSize * 0.92, nameSize - 0.08);
    const height = nameLines.length * lineHeight;
    const widest = Math.max(...nameLines.map((line) => estimateLineWidth(line, nameSize, true)));
    if (height <= availableHeight && widest <= availableWidth) {
      return { nameSize, nameLines, lineHeight, height };
    }
  }
  return {
    nameSize: 3.8,
    nameLines: fitWrappedLines(name, maxCharsForWidth(availableWidth, 3.8, true), maxWrapLines),
    lineHeight: 3.7,
    height: fitWrappedLines(name, maxCharsForWidth(availableWidth, 3.8, true), maxWrapLines).length * 3.7,
  };
}

function fitVerticalNodeText(node, style, name) {
  const availableExtent = Math.max(10, node.height - INNER_MARGIN * 2);
  const availableThickness = Math.max(4, node.width - INNER_MARGIN * 2);
  for (let scale = 1; scale >= 0.16; scale -= 0.02) {
    const nameSize = round2(style.nameSize * scale);
    const lineHeight = Math.max(nameSize * 0.94, nameSize - 0.1);
    const lineWidth = estimateLineWidth(name, nameSize, true);
    if (lineHeight <= availableThickness && lineWidth <= availableExtent) {
      return { nameSize, dateSize: Math.max(3.1, style.dateSize - 2), nameLines: [name], lineHeight, height: lineHeight };
    }
  }
  for (let scale = 0.16; scale >= 0.1; scale -= 0.01) {
    const nameSize = round2(style.nameSize * scale);
    const lineHeight = Math.max(nameSize * 0.94, nameSize - 0.1);
    if (lineHeight <= availableThickness) {
      const maxChars = Math.max(3, Math.floor(availableExtent / (nameSize * 0.58)));
      return {
        nameSize,
        dateSize: Math.max(3.1, style.dateSize - 2),
        nameLines: [ellipsize(name, maxChars)],
        lineHeight,
        height: lineHeight,
      };
    }
  }
  return { nameSize: 2.4, dateSize: 3.1, nameLines: [ellipsize(name, 8)], lineHeight: 2.4, height: 2.4 };
}

function layoutAnnotationText(linesToFit, noteWidth, preferredFontSize, titleText, maxHeight) {
  const sourceLines = linesToFit.length ? linesToFit : [""];
  for (let fontSize = preferredFontSize; fontSize >= 3.2; fontSize -= 0.5) {
    const maxChars = Math.max(5, Math.floor((noteWidth - 2) / (fontSize * 0.54)));
    if (titleText.length > maxChars) continue;
    if (sourceLines.some((line) => line.length > maxChars)) continue;
    const lineHeight = Math.max(fontSize * 0.9, fontSize + 0.45);
    const height = fontSize + 2.2 + sourceLines.length * lineHeight;
    if (height <= maxHeight) {
      return { lines: sourceLines, fontSize, lineHeight, height, width: noteWidth };
    }
  }
  return {
    lines: sourceLines.slice(0, 9).map((line) => line),
    fontSize: 3.2,
    lineHeight: 3.65,
    height: Math.min(maxHeight, 3.2 + 2.2 + sourceLines.length * 3.65),
    width: noteWidth,
  };
}

function getGenerationStyle(state, generation) {
  return state.settings.generationStyles[generation] || buildDefaultGenerationStyles()[generation];
}

function buildDefaultGenerationStyles() {
  return GENERATION_SIZES.map((size) => ({
    nameSize: size,
    nameColor: "#314A9C",
    dateSize: Math.max(4, size - 1),
    dateColor: "#C7281C",
    childrenSize: Math.max(4, size - 1),
    childrenColor: "#000000",
    syncNameDate: false,
  }));
}

function normalizeGenerationStyles(styles) {
  const defaults = buildDefaultGenerationStyles();
  return defaults.map((fallback, generation) => {
    const incoming = styles[generation] || {};
    return {
      nameSize: Number(incoming.nameSize) || fallback.nameSize,
      nameColor: normalizeColor(incoming.nameColor || fallback.nameColor),
      dateSize: Number(incoming.dateSize) || fallback.dateSize,
      dateColor: normalizeColor(incoming.dateColor || fallback.dateColor),
      childrenSize: Number(incoming.childrenSize) || fallback.childrenSize,
      childrenColor: normalizeColor(incoming.childrenColor || fallback.childrenColor),
      syncNameDate: typeof incoming.syncNameDate === "boolean" ? incoming.syncNameDate : fallback.syncNameDate,
    };
  });
}

function buildSlotDefinitions(maxGeneration) {
  const slots = [];
  for (let generation = 0; generation <= maxGeneration; generation += 1) {
    const count = 2 ** generation;
    for (let index = 0; index < count; index += 1) {
      const path = generation === 0 ? [] : indexToPath(generation, index);
      const id = path.length ? path.join("_") : "root";
      slots.push({ id, generation, index, path, label: relationLabel(path) });
    }
  }
  return slots;
}

function getSlotByGenerationIndex(slotDefinitions, generation, index) {
  return slotDefinitions.find((slot) => slot.generation === generation && slot.index === index);
}

function indexToPath(generation, index) {
  const bits = index.toString(2).padStart(generation, "0");
  return [...bits].map((bit) => (bit === "0" ? "father" : "mother"));
}

function relationLabel(path) {
  if (path.length === 0) return "Original Person";
  if (path.length === 1) return path[0] === "father" ? "Father" : "Mother";
  const side = path[0] === "father" ? "Paternal" : "Maternal";
  const gender = path[path.length - 1] === "father" ? "Grandfather" : "Grandmother";
  if (path.length === 2) return `${side} ${gender}`;
  const withinSideIndex = parseInt(path.slice(1).map((step) => (step === "father" ? "0" : "1")).join(""), 2);
  const pairIndex = Math.floor(withinSideIndex / 2) + 1;
  if (path.length === 3) return `${side} Great-${gender}-${pairIndex}`;
  const multiplier = path.length - 2;
  return `${side} ${multiplier}x ${gender}-${pairIndex}`;
}

function drawTitleBox(state) {
  const x = 6;
  const y = PAGE_HEIGHT_PT - 78;
  const width = 176;
  const height = 60;
  const notes = compactLines(state.settings.titleBox.subtitle || "");
  const parts = [];
  parts.push(`<g>`);
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#fffdfa" stroke="#303030" stroke-width="1.15"/>`);
  const crestDataUrl = state.settings.titleBox.crestDataUrl || "";
  if (crestDataUrl) {
    parts.push(`<image href="${escapeAttribute(crestDataUrl)}" x="${x + 6}" y="${y + 6}" width="28" height="28" preserveAspectRatio="xMidYMid meet"/>`);
  } else {
    parts.push(drawDefaultCrest(x + 6, y + 6, 28, state.people.root?.name));
  }
  parts.push(text(x + 42, y + 16, state.settings.titleBox.title || "Family Tree", "#314A9C", 7.5, true, "start", state.settings));
  parts.push(`<line x1="${x + 42}" y1="${y + 20}" x2="${x + width - 6}" y2="${y + 20}" stroke="#303030" stroke-width="1.15"/>`);
  notes.forEach((lineText, index) => {
    parts.push(text(x + 42, y + 32 + index * 8, lineText, "#000000", 4.6, false, "start", state.settings));
  });
  const author = state.settings.titleBox.author || "";
  if (author) {
    parts.push(text(x + 42, y + height - 6, author, "#5f5649", 4.2, false, "start", state.settings));
  }
  parts.push(`</g>`);
  return parts.join("");
}

function line(x1, y1, x2, y2) {
  return `<line x1="${round2(x1)}" y1="${round2(y1)}" x2="${round2(x2)}" y2="${round2(y2)}" stroke="#303030" stroke-width="1.15"/>`;
}

function text(x, y, content, color, fontSize, emphasize, anchor = "middle", settings = DEFAULT_SETTINGS) {
  const attrs = [
    `x="${round2(x)}"`,
    `y="${round2(y)}"`,
    `fill="${color}"`,
    `font-family="${escapeAttribute(`"${settings.fontFamily}", "Book Antiqua", Palatino, serif`)}"`,
    `font-size="${round2(fontSize)}pt"`,
    `font-weight="${emphasize ? "700" : "600"}"`,
    `text-anchor="${anchor}"`,
  ];
  if (settings.fauxBold) {
    attrs.push(`stroke="${color}"`);
    attrs.push(`stroke-width="${emphasize ? "0.28" : "0.2"}"`);
    attrs.push(`paint-order="stroke fill"`);
  }
  return `<text ${attrs.join(" ")}>${escapeText(content)}</text>`;
}

function slotCornerRadius(slot) {
  if (slot.id === "root") return 1.5;
  const last = slot.path[slot.path.length - 1];
  return last === "mother" ? 2.5 : 0;
}

function displayName(name) {
  const text = String(name || "").trim();
  return text || "?";
}

function formatDates(birthYear, deathYear) {
  const birth = sanitizeYear(birthYear);
  const death = sanitizeYear(deathYear);
  if (!birth && !death) return "?";
  return `(${birth || "?"}-${death || "?"})`;
}

function compactLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function sanitizeYear(value) {
  const text = String(value ?? "").replace(/[^0-9?]/g, "").slice(0, 8);
  return text || "?";
}

function normalizeColor(value) {
  const text = String(value || "").trim();
  if (!text) return "#000000";
  return text.startsWith("#") ? text.toUpperCase() : `#${text.toUpperCase()}`;
}

function splitDateLines(birthYear, deathYear) {
  const birth = sanitizeYear(birthYear) || "?";
  const death = sanitizeYear(deathYear) || "?";
  return [birth, death];
}

function drawDefaultCrest(x, y, size, rootName) {
  const letter = extractLastInitial(rootName);
  const scale = size / 128;
  const tx = round2(x);
  const ty = round2(y);
  const sx = round2(scale);
  return (
    `<g transform="translate(${tx} ${ty}) scale(${sx})">` +
    `<path d="M64 8 L102 20 V56 C102 82 88 102 64 118 C40 102 26 82 26 56 V20 Z" fill="#ffffff" stroke="#1f1f1f" stroke-width="6"/>` +
    `<text x="64" y="79" text-anchor="middle" font-family="Palatino Linotype, Book Antiqua, Palatino, serif" font-size="62" font-weight="700" fill="#111111">${escapeText(letter)}</text>` +
    `</g>`
  );
}

function extractLastInitial(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const last = words.length ? words[words.length - 1] : "F";
  const firstChar = last.charAt(0).toUpperCase();
  return /[A-Z]/.test(firstChar) ? firstChar : "F";
}

function fitWrappedLines(text, maxChars, maxLines) {
  const wrapped = wrapText(text, Math.max(3, maxChars));
  if (wrapped.length <= maxLines) return wrapped;
  const clipped = wrapped.slice(0, maxLines);
  clipped[maxLines - 1] = ellipsize(clipped[maxLines - 1], Math.max(3, maxChars));
  return clipped;
}

function wrapText(text, maxChars) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const trial = `${current} ${words[i]}`;
    if (trial.length <= maxChars) {
      current = trial;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function maxCharsForWidth(width, fontSize, emphasize) {
  return Math.max(3, Math.floor(width / (fontSize * (emphasize ? 0.62 : 0.58))));
}

function estimateLineWidth(line, fontSize, emphasize) {
  return line.length * fontSize * (emphasize ? 0.58 : 0.54);
}

function ellipsize(text, maxChars) {
  const value = String(text || "");
  if (value.length <= maxChars) return value;
  return value.slice(0, Math.max(1, maxChars - 1)) + "\u2026";
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return escapeText(value).replace(/"/g, "&quot;");
}

function parseBlock(lines, startIndex, indent) {
  const object = {};
  let index = startIndex;
  while (index < lines.length) {
    const raw = lines[index];
    if (!raw.trim()) {
      index += 1;
      continue;
    }
    const currentIndent = countIndent(raw);
    if (currentIndent < indent) break;
    if (currentIndent > indent) {
      throw new Error(`Unexpected indentation on line ${index + 1}`);
    }
    const content = raw.trim();
    const separator = content.indexOf(":");
    if (separator === -1) {
      throw new Error(`Expected key/value on line ${index + 1}`);
    }
    const key = content.slice(0, separator).trim();
    const remainder = content.slice(separator + 1).trim();
    if (!remainder) {
      const nested = parseBlock(lines, index + 1, indent + 2);
      object[key] = nested.value;
      index = nested.nextIndex;
    } else {
      object[key] = parseScalar(remainder);
      index += 1;
    }
  }
  return { value: object, nextIndex: index };
}

function countIndent(line) {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

function parseScalar(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^\[(.*)\]$/.test(value)) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return splitArray(inner).map(parseScalar);
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    return value
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function splitArray(inner) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < inner.length; i += 1) {
    const char = inner[i];
    if (char === '"' && inner[i - 1] !== "\\") inQuotes = !inQuotes;
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) values.push(current.trim());
  return values;
}
