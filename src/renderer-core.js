const MAX_GENERATION = 6;
const PAGE_WIDTH_PT = 792;
const PAGE_HEIGHT_PT = 612;
const GENERATION_SIZES = [14, 12, 10.5, 9, 7.5, 6.5, 5.5];
const BOX_WIDTHS = [108, 88, 70, 54, 40, 14, 11];
const BOX_HEIGHTS = [54, 46, 36, 30, 28, 72, 64];
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
    title: "Famiglia Bellandi-Castelluccio",
    subtitle: "Demo export layout\nExample lineage with surname crest",
    author: "Prepared with TreeGen",
    crestDataUrl: "",
  },
  datePrefixes: {
    birth: "N",
    death: "S",
    marriage: "M",
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
          state.people[fatherSlot.id],
          state.people[motherSlot.id],
          getGenerationStyle(state, motherSlot.generation),
          state.settings
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
  if (importedSettings.datePrefixes && typeof importedSettings.datePrefixes === "object") {
    nextSettings.datePrefixes = {
      birth: sanitizePrefix(importedSettings.datePrefixes.birth),
      death: sanitizePrefix(importedSettings.datePrefixes.death),
      marriage: sanitizePrefix(importedSettings.datePrefixes.marriage),
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
      name: sanitizeText(incoming.name),
      birthYear: sanitizeDateValue(incoming.birth ?? incoming.birthYear),
      deathYear: sanitizeDateValue(incoming.death ?? incoming.deathYear),
      marriageDate: sanitizeDateValue(incoming.marriageDate),
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
    let maxReserve = 0;
    for (let index = 0; index < pairCount; index += 1) {
      const fatherSlot = getSlotByGenerationIndex(slotDefinitions, generation, index * 2);
      const motherSlot = getSlotByGenerationIndex(slotDefinitions, generation, index * 2 + 1);
      const fatherPerson = state.people[fatherSlot.id];
      const motherPerson = state.people[motherSlot.id];
      const childLines = compactLines(state.people[motherSlot.id]?.childrenNote || "").slice(0, 9);
      const familyReserve = Math.max(
        getExternalDateReserve(fatherPerson, generation, getGenerationStyle(state, generation), state.settings),
        getExternalDateReserve(motherPerson, generation, getGenerationStyle(state, generation), state.settings),
        getMarriageReserve(motherPerson?.marriageDate, generation, getGenerationStyle(state, generation), state.settings)
      );
      maxReserve = Math.max(maxReserve, familyReserve);
      if (!childLines.length) continue;
      const titleText = `${childLines.length} ${childLines.length === 1 ? "Child" : "Children"}`;
      const preferredChildSize = generation === 4
        ? Math.max(2.6, getGenerationStyle(state, generation).childrenSize - 2.8)
        : getGenerationStyle(state, generation).childrenSize;
      const noteLayout = layoutAnnotationText(childLines, noteWidth, preferredChildSize, titleText, 1000);
      maxHeight = Math.max(maxHeight, noteLayout.height);
    }
    rowSteps[generation] = Math.max(
      rowSteps[generation],
      Math.ceil(maxReserve + (maxHeight > 0 ? maxHeight + 10 : 8))
    );
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

function drawConnector(childSlot, childNode, fatherNode, motherNode, noteText, fatherPerson, motherPerson, generationStyle, settings) {
  const parts = [];
  const fatherAnchorX = getConnectorAnchorX(fatherNode, "father");
  const motherAnchorX = getConnectorAnchorX(motherNode, "mother");
  const parentBottom = Math.max(fatherNode.y + fatherNode.height, motherNode.y + motherNode.height);
  const parentGeneration = motherNode.generation;
  const marriageReserve = getMarriageReserve(motherPerson?.marriageDate, parentGeneration, generationStyle, settings);
  const fatherDateReserve = getExternalDateReserve(fatherPerson, parentGeneration, generationStyle, settings);
  const motherDateReserve = getExternalDateReserve(motherPerson, parentGeneration, generationStyle, settings);
  const pairReserve = Math.max(fatherDateReserve, motherDateReserve, marriageReserve);
  const joinY = parentBottom + pairReserve + 4;
  const midX = (fatherAnchorX + motherAnchorX) / 2;
  const childJoinY = childNode.y - 4;

  parts.push(line(fatherAnchorX, fatherNode.y + fatherNode.height, fatherAnchorX, joinY));
  parts.push(line(motherAnchorX, motherNode.y + motherNode.height, motherAnchorX, joinY));
  parts.push(line(fatherAnchorX, joinY, motherAnchorX, joinY));
  parts.push(line(midX, joinY, midX, childJoinY));
  parts.push(line(midX, childJoinY, childNode.centerX, childJoinY));
  parts.push(line(childNode.centerX, childJoinY, childNode.centerX, childNode.y));

  const marriageLabel = formatMarriageForGeneration(motherPerson?.marriageDate, parentGeneration, generationStyle, settings);
  if (marriageLabel.text) {
    parts.push(
      text(
        midX,
        joinY - 1.8,
        marriageLabel.text,
        generationStyle.dateColor,
        marriageLabel.fontSize,
        false,
        "middle",
        settings || DEFAULT_SETTINGS
      )
    );
  }

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
  const availableHeight = Math.max(10, childNode.y - (motherNode.y + motherNode.height + pairReserve + 6));
  const preferredChildSize = motherNode.generation === 4
    ? Math.max(2.6, generationStyle.childrenSize - 2.8)
    : generationStyle.childrenSize;
  const noteLayout = layoutAnnotationText(childLines, noteWidth, preferredChildSize, titleText, availableHeight);
  const noteX = clamp(motherNode.x + 2, laneLeft, Math.max(laneLeft, laneRight - noteLayout.width));
  const noteY = motherNode.y + motherNode.height + 4.2 + pairReserve;
  const titleY = noteY + noteLayout.fontSize;
  parts.push(text(noteX, titleY, titleText, generationStyle.childrenColor, noteLayout.fontSize, true, "start"));
  parts.push(`<line x1="${noteX}" y1="${round2(titleY + 2)}" x2="${round2(noteX + noteLayout.width)}" y2="${round2(titleY + 2)}" stroke="#303030" stroke-width="1.05"/>`);
  noteLayout.lines.forEach((lineText, idx) => {
    const y = titleY + 1.8 + (idx + 1) * noteLayout.lineHeight;
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
  const dateLines = getExternalDateLines(person, slot.generation, state.settings);
  if (node.verticalText) {
    const layout = fitVerticalNodeText(node, style, name);
    parts.push(`<g transform="translate(${round2(node.centerX)}, ${round2(node.centerY)}) rotate(-90)">`);
    const startY = -layout.height / 2 + layout.nameSize * 0.76;
    layout.nameLines.forEach((lineText, idx) => {
      parts.push(text(0, startY + idx * layout.lineHeight, lineText, style.nameColor, layout.nameSize, true, "middle", state.settings));
    });
    parts.push(`</g>`);
    const externalDateLayout = getExternalDateLayout(node, style, slot, person, state.settings);
    externalDateLayout.lines.forEach((lineText, idx) => {
      parts.push(
        text(
          externalDateLayout.x,
          externalDateLayout.y + idx * externalDateLayout.lineHeight,
          lineText,
          style.dateColor,
          externalDateLayout.fontSize,
          false,
          externalDateLayout.anchor,
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
    const lateDateSize = slot.generation >= 5 ? Math.max(3.1, style.dateSize - 1.6) : Math.max(3.7, style.dateSize - 1.4);
    dateLines.forEach((lineText, idx) => {
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
    const layout = fitHorizontalNodeText(node, style, name, noteLines, slot.generation);
    let y = node.centerY - layout.height / 2 + layout.nameSize * 0.76;
    layout.nameLines.forEach((lineText) => {
      parts.push(text(node.centerX, y, lineText, style.nameColor, layout.nameSize, true, "middle", state.settings));
      y += layout.nameLineHeight;
    });
    if (layout.nameLines.length && layout.noteLines.length) y += layout.nameNoteGap || 0;
    layout.noteLines.forEach((lineText) => {
      parts.push(text(node.centerX, y, lineText, "#000000", layout.noteSize, false, "middle", state.settings));
      y += layout.noteLineHeight;
    });
    const externalDateLayout = getExternalDateLayout(node, style, slot, person, state.settings);
    externalDateLayout.lines.forEach((lineText, idx) => {
      parts.push(
        text(
          externalDateLayout.x,
          externalDateLayout.y + idx * externalDateLayout.lineHeight,
          lineText,
          style.dateColor,
          externalDateLayout.fontSize,
          false,
          externalDateLayout.anchor,
          state.settings
        )
      );
    });
  }

  if (state.settings.boxNumbering.enabled) {
    const n = state.settings.boxNumbering.startAt + slot.index + (2 ** slot.generation - 1);
    parts.push(text(node.x + 1.2, node.y + 4.2, String(n), "#606060", 2.8, false, "start", state.settings));
  }

  parts.push(`</g>`);
  return parts.join("");
}

function fitHorizontalNodeText(node, style, name, noteLines, generation) {
  const availableWidth = Math.max(8, node.width - INNER_MARGIN * 2);
  const availableHeight = Math.max(8, node.height - INNER_MARGIN * 2);
  const preferThreeNameLines = generation >= 1 && generation <= 3;
  const preferredBaseNameSize = round2(style.nameSize * (preferThreeNameLines ? 1.14 : 1));
  const baseNameChars = maxCharsForWidth(availableWidth, preferredBaseNameSize, true);
  const baseNameLines = preferThreeNameLines
    ? fitWrappedLinesPreferred(name, baseNameChars, 3, 3)
    : fitWrappedLines(name, baseNameChars, 3);
  const baseNameLineHeight = Math.max(preferredBaseNameSize * 0.97, preferredBaseNameSize + 0.08);
  const baseNoteSize = Math.max(3.5, style.dateSize * 0.82);
  const baseNoteChars = maxCharsForWidth(availableWidth, baseNoteSize, false);
  const baseWrappedNotes = noteLines.flatMap((line) => fitWrappedLines(line, baseNoteChars, 1)).slice(0, 2);
  const baseNoteLineHeight = Math.max(baseNoteSize * 0.9, baseNoteSize + 0.04);
  const baseNameNoteGap = baseNameLines.length && baseWrappedNotes.length ? 0.55 : 0;
  const baseHeight =
    baseNameLines.length * baseNameLineHeight +
    baseWrappedNotes.length * baseNoteLineHeight +
    baseNameNoteGap;
  const baseWidest = Math.max(
    ...baseNameLines.map((line) => estimateLineWidth(line, preferredBaseNameSize, true)),
    ...(baseWrappedNotes.length ? baseWrappedNotes.map((line) => estimateLineWidth(line, baseNoteSize, false)) : [0])
  );
  if (baseHeight <= availableHeight && baseWidest <= availableWidth) {
    return {
      nameSize: preferredBaseNameSize,
      noteSize: round2(baseNoteSize),
      nameLines: baseNameLines,
      noteLines: baseWrappedNotes,
      nameLineHeight: baseNameLineHeight,
      noteLineHeight: baseNoteLineHeight,
      nameNoteGap: baseNameNoteGap,
      height: baseHeight,
    };
  }
  for (let scale = (preferThreeNameLines ? 1.14 : 1); scale >= 0.38; scale -= 0.025) {
    const nameSize = round2(style.nameSize * scale);
    const noteSize = round2(Math.max(3.5, style.dateSize * Math.min(scale, 0.82)));
    const nameChars = maxCharsForWidth(availableWidth, nameSize, true);
    const noteChars = maxCharsForWidth(availableWidth, noteSize, false);
    const nameLines = preferThreeNameLines
      ? fitWrappedLinesPreferred(name, nameChars, 3, 3)
      : fitWrappedLines(name, nameChars, 3);
    const wrappedNotes = noteLines.flatMap((line) => fitWrappedLines(line, noteChars, 1)).slice(0, 2);
    const nameLineHeight = Math.max(nameSize * 0.97, nameSize + 0.08);
    const noteLineHeight = Math.max(noteSize * 0.9, noteSize + 0.04);
    const nameNoteGap = nameLines.length && wrappedNotes.length ? 0.55 : 0;
    const height =
      nameLines.length * nameLineHeight +
      wrappedNotes.length * noteLineHeight +
      nameNoteGap;
    const widest = Math.max(
      ...nameLines.map((line) => estimateLineWidth(line, nameSize, true)),
      ...(wrappedNotes.length ? wrappedNotes.map((line) => estimateLineWidth(line, noteSize, false)) : [0])
    );
    if (height <= availableHeight && widest <= availableWidth) {
      return {
        nameSize,
        noteSize,
        nameLines,
        noteLines: wrappedNotes,
        nameLineHeight,
        noteLineHeight,
        nameNoteGap,
        height,
      };
    }
  }
  return {
    nameSize: 4.2,
    noteSize: 3.3,
    nameLines: fitWrappedLines(name, maxCharsForWidth(availableWidth, 4.2, true), 3),
    noteLines: noteLines.slice(0, 1).map((line) => ellipsize(line, maxCharsForWidth(availableWidth, 3.3, false))),
    nameLineHeight: 4.0,
    noteLineHeight: 3.2,
    nameNoteGap: noteLines.length ? 0.55 : 0,
    height: availableHeight,
  };
}

function fitWrappedLinesPreferred(text, maxChars, maxLines, preferredLines) {
  const initial = fitWrappedLines(text, maxChars, maxLines);
  if (preferredLines <= 1 || initial.length >= preferredLines) {
    return initial;
  }
  for (let candidateChars = Math.max(3, maxChars - 1); candidateChars >= 3; candidateChars -= 1) {
    const wrapped = fitWrappedLines(text, candidateChars, maxLines);
    if (wrapped.length >= preferredLines) {
      return wrapped;
    }
  }
  return initial;
}

function fitBoxNameOnly(node, style, name, generation) {
  const availableWidth = Math.max(8, node.width - INNER_MARGIN * 2);
  const availableHeight = Math.max(8, node.height - INNER_MARGIN * 2);
  const preferThreeNameLines = generation === 4;
  const preferredBaseNameSize = round2(style.nameSize * (preferThreeNameLines ? 1.12 : 1));
  const baseChars = maxCharsForWidth(availableWidth, preferredBaseNameSize, true);
  const baseLines = preferThreeNameLines
    ? fitWrappedLinesPreferred(name, baseChars, 3, 3)
    : fitWrappedLines(name, baseChars, 3);
  const baseLineHeight = Math.max(preferredBaseNameSize * 0.96, preferredBaseNameSize + 0.06);
  const baseHeight = baseLines.length * baseLineHeight;
  const baseWidest = Math.max(...baseLines.map((line) => estimateLineWidth(line, preferredBaseNameSize, true)));
  if (baseHeight <= availableHeight && baseWidest <= availableWidth) {
    return { nameSize: preferredBaseNameSize, nameLines: baseLines, lineHeight: baseLineHeight, height: baseHeight };
  }
  const maxWrapLines = 3;
  for (let scale = (preferThreeNameLines ? 1.12 : 1); scale >= 0.38; scale -= 0.025) {
    const nameSize = round2(style.nameSize * scale);
    const nameChars = maxCharsForWidth(availableWidth, nameSize, true);
    const nameLines = preferThreeNameLines
      ? fitWrappedLinesPreferred(name, nameChars, maxWrapLines, 3)
      : fitWrappedLines(name, nameChars, maxWrapLines);
    const lineHeight = Math.max(nameSize * 0.96, nameSize + 0.06);
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
  for (let scale = 1.08; scale >= 0.16; scale -= 0.02) {
    const nameSize = round2(style.nameSize * scale);
    const lineHeight = Math.max(nameSize * 0.94, nameSize - 0.1);
    const maxChars = Math.max(3, Math.floor(availableExtent / (nameSize * 0.58)));
    const nameLines = fitWrappedLinesPreferred(name, maxChars, 2, 2);
    const widest = Math.max(...nameLines.map((line) => estimateLineWidth(line, nameSize, true)));
    const height = nameLines.length * lineHeight;
    if (height <= availableThickness && widest <= availableExtent) {
      return { nameSize, dateSize: Math.max(3.1, style.dateSize - 2), nameLines, lineHeight, height };
    }
  }
  for (let scale = 0.16; scale >= 0.1; scale -= 0.01) {
    const nameSize = round2(style.nameSize * scale);
    const lineHeight = Math.max(nameSize * 0.94, nameSize - 0.1);
    const maxChars = Math.max(3, Math.floor(availableExtent / (nameSize * 0.58)));
    const nameLines = fitWrappedLinesPreferred(name, maxChars, 2, 2);
    const widest = Math.max(...nameLines.map((line) => estimateLineWidth(line, nameSize, true)));
    const height = nameLines.length * lineHeight;
    if (height <= availableThickness && widest <= availableExtent) {
      return {
        nameSize,
        dateSize: Math.max(3.1, style.dateSize - 2),
        nameLines,
        lineHeight,
        height,
      };
    }
    if (lineHeight <= availableThickness) {
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
  const y = PAGE_HEIGHT_PT - 72;
  const width = 176;
  const height = 54;
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
  const titleLayout = fitTitleText(state.settings.titleBox.title || "Family Tree", width - 48, 7.5, 3);
  titleLayout.lines.forEach((lineText, index) => {
    parts.push(text(x + 42, y + 14 + index * titleLayout.lineHeight, lineText, "#314A9C", titleLayout.fontSize, true, "start", state.settings));
  });
  const subtitleLayout = fitTitleText(notes.join(" "), width - 48, 4.6, 3);
  subtitleLayout.lines.forEach((lineText, index) => {
    parts.push(text(x + 42, y + 29 + index * subtitleLayout.lineHeight, lineText, "#000000", subtitleLayout.fontSize, false, "start", state.settings));
  });
  parts.push(`</g>`);
  return parts.join("");
}

function fitTitleText(textValue, width, preferredSize, maxLines) {
  const clean = sanitizeText(textValue);
  if (!clean) return { lines: [], fontSize: preferredSize, lineHeight: preferredSize + 0.6 };
  for (let fontSize = preferredSize; fontSize >= 3.8; fontSize -= 0.3) {
    const chars = maxCharsForWidth(width, fontSize, true);
    const lines = fitWrappedLines(clean, chars, maxLines);
    const lineHeight = Math.max(fontSize * 0.95, fontSize + 0.2);
    const widest = Math.max(...lines.map((line) => estimateLineWidth(line, fontSize, true)));
    if (widest <= width) {
      return { lines, fontSize: round2(fontSize), lineHeight };
    }
  }
  return {
    lines: fitWrappedLines(clean, maxCharsForWidth(width, 3.8, true), maxLines),
    fontSize: 3.8,
    lineHeight: 4.1,
  };
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
  return sanitizeText(name);
}

function compactLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function sanitizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function sanitizeDateValue(value) {
  return sanitizeText(value);
}

function normalizeColor(value) {
  const text = String(value || "").trim();
  if (!text) return "#000000";
  return text.startsWith("#") ? text.toUpperCase() : `#${text.toUpperCase()}`;
}

function extractYear(value) {
  const text = sanitizeDateValue(value);
  const matches = text.match(/\b(?:1[5-9]\d{2}|20\d{2}|21\d{2})\b/g);
  return matches && matches.length ? matches[matches.length - 1] : "";
}

function getExternalDateLines(person, generation, settings = DEFAULT_SETTINGS) {
  const birth = sanitizeDateValue(person?.birthYear);
  const death = sanitizeDateValue(person?.deathYear);
  if (generation <= 2) {
    return [
      formatPrefixedDate(getActiveDatePrefix("birth", generation, settings), birth),
      formatPrefixedDate(getActiveDatePrefix("death", generation, settings), death),
    ].filter(Boolean);
  }
  const birthYear = extractYear(birth);
  const deathYear = extractYear(death);
  return [
    formatPrefixedDate(getActiveDatePrefix("birth", generation, settings), birthYear),
    formatPrefixedDate(getActiveDatePrefix("death", generation, settings), deathYear),
  ].filter(Boolean);
}

function getExternalDateReserve(person, generation, style, settings = DEFAULT_SETTINGS) {
  const lines = getExternalDateLines(person, generation, settings);
  if (!lines.length) return 0;
  const fontSize = generation >= 5 ? Math.max(3.1, style.dateSize - 1.6) : generation >= 3 ? Math.max(3.8, Math.min(4.4, style.dateSize - 0.8)) : 4.6;
  const lineHeight = generation <= 2 ? Math.max(fontSize + 1, fontSize * 1.08) : Math.max(fontSize * 0.92, fontSize + 0.1);
  return round2(fontSize + 4 + (lines.length - 1) * lineHeight + 2);
}

function getExternalDateLayout(node, style, slot, person, settings = DEFAULT_SETTINGS) {
  const lines = getExternalDateLines(person, slot.generation, settings);
  if (!lines.length) {
    return { lines: [], x: node.centerX, y: node.y + node.height + 5, lineHeight: 0, fontSize: 0, anchor: "middle" };
  }
  const fontSize = slot.generation >= 3 ? Math.max(3.8, Math.min(4.4, style.dateSize - 0.8)) : 4.6;
  const lineHeight = slot.generation <= 2 ? Math.max(fontSize + 1, fontSize * 1.08) : Math.max(fontSize * 0.92, fontSize + 0.1);
  if (slot.generation === 0) {
    return {
      lines,
      x: node.centerX,
      y: node.y + node.height + fontSize + 5,
      lineHeight,
      fontSize,
      anchor: "middle",
    };
  }
  if (slot.generation >= 5) {
    const isMother = slot.path[slot.path.length - 1] === "mother";
    return {
      lines,
      x: getConnectorAnchorX(node, isMother ? "mother" : "father") - 1.5,
      y: node.y + node.height + fontSize + 2.6,
      lineHeight,
      fontSize,
      anchor: "end",
    };
  }
  const isMother = slot.path[slot.path.length - 1] === "mother";
  return {
    lines,
    x: getConnectorAnchorX(node, isMother ? "mother" : "father") + (isMother ? 1 : -1),
    y: node.y + node.height + (slot.generation <= 3 ? fontSize + 1.2 : fontSize + 4),
    lineHeight,
    fontSize,
    anchor: isMother ? "start" : "end",
  };
}

function getMarriageReserve(marriageDate, generation, style, settings = DEFAULT_SETTINGS) {
  const label = formatMarriageForGeneration(marriageDate, generation, style, settings);
  if (!label.text) return 0;
  return round2(label.fontSize + 3);
}

function formatMarriageForGeneration(marriageDate, generation, style, settings = DEFAULT_SETTINGS) {
  const full = sanitizeDateValue(marriageDate);
  if (!full || generation >= 5) return { text: "", fontSize: 0 };
  const prefix = getActiveDatePrefix("marriage", generation, settings);
  const formattedFull = formatPrefixedDate(prefix, full);
  if (generation <= 2) {
    return { text: formattedFull, fontSize: 4.6 };
  }
  return { text: formatPrefixedDate(prefix, extractYear(full)), fontSize: generation === 4 ? 3.2 : 3.8 };
}

function getActiveDatePrefix(kind, generation, settings = DEFAULT_SETTINGS) {
  if (generation >= 4) return "";
  return sanitizePrefix(settings.datePrefixes?.[kind]);
}

function formatPrefixedDate(prefix, value) {
  const text = sanitizeDateValue(value);
  if (!text) return "";
  const cleanPrefix = sanitizePrefix(prefix);
  return cleanPrefix ? `${cleanPrefix}: ${text}` : text;
}

function sanitizePrefix(value) {
  return String(value ?? "").trim().slice(0, 1);
}

function getConnectorAnchorX(node, side) {
  if (node.generation >= 5) return node.centerX;
  if (side === "father") return round2(node.x + node.width * 0.72);
  return round2(node.x + node.width * 0.28);
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
