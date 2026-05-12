import { analyzeYamlLayout, renderYamlToSvg } from "./renderer-core.js";

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const APP_META = {
    version: "0.2.27",
    lastUpdated: "2026-05-12",
  };
  const MAX_GENERATION = 6;
  const GENERATION_SIZES = [14, 12, 10.5, 9, 7.5, 6.5, 5.5];
  const PAGE_WIDTH_PT = 792;
  const PAGE_HEIGHT_PT = 612;
  const BOX_WIDTHS = [108, 88, 70, 54, 40, 14, 11];
  const BOX_HEIGHTS = [54, 46, 36, 30, 28, 72, 64];
  const ROW_STEPS = [0, 24, 26, 28, 30, 36, 40];
  const CHART_WIDTH = 748;
  const MARGIN_X = 22;
  const MARGIN_TOP = 18;
  const MARGIN_BOTTOM = 8;
  const CONNECTOR_HEIGHT = 40;
  const PAIR_GAP = 28;
  const SLOT_DEFINITIONS = buildSlotDefinitions(MAX_GENERATION);

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
    datePrefixes: buildDefaultDatePrefixes(),
    boxNumbering: {
      enabled: false,
      startAt: 0,
    },
  };

  const state = {
    selectedId: "root",
    settings: clone(DEFAULT_SETTINGS),
    people: buildDefaultPeople(),
    yamlText: "",
    fitReport: [],
    export: {
      format: "pdf",
      quality: 100,
      widthInches: 11,
      heightInches: 8.5,
      dpi: 600,
      lockAspect: true,
    },
  };

  const elements = {
    svgWrapper: document.getElementById("svg-wrapper"),
    statusText: document.getElementById("status-text"),
    selectedSlotLabel: document.getElementById("selected-slot-label"),
    personName: document.getElementById("person-name"),
    personBirth: document.getElementById("person-birth"),
    personDeath: document.getElementById("person-death"),
    personMarriage: document.getElementById("person-marriage"),
    personChildren: document.getElementById("person-children"),
    personNote: document.getElementById("person-note"),
    personNameSizeOverride: document.getElementById("person-name-size-override"),
    personNameColorOverride: document.getElementById("person-name-color-override"),
    personDateSizeOverride: document.getElementById("person-date-size-override"),
    personDateColorOverride: document.getElementById("person-date-color-override"),
    fontFamily: document.getElementById("font-family"),
    fauxBold: document.getElementById("faux-bold"),
    generationStyleSelect: document.getElementById("generation-style-select"),
    genNameSize: document.getElementById("gen-name-size"),
    genNameColor: document.getElementById("gen-name-color"),
    genDateSize: document.getElementById("gen-date-size"),
    genDateColor: document.getElementById("gen-date-color"),
    genSyncNameDate: document.getElementById("gen-sync-name-date"),
    genChildrenSize: document.getElementById("gen-children-size"),
    genChildrenColor: document.getElementById("gen-children-color"),
    datePrefixBirth: document.getElementById("date-prefix-birth"),
    datePrefixDeath: document.getElementById("date-prefix-death"),
    datePrefixMarriage: document.getElementById("date-prefix-marriage"),
    generationFitReport: document.getElementById("generation-fit-report"),
    zoomRange: document.getElementById("zoom-range"),
    imageFormat: document.getElementById("image-format"),
    imageQuality: document.getElementById("image-quality"),
    exportWidthInches: document.getElementById("export-width-in"),
    exportHeightInches: document.getElementById("export-height-in"),
    exportDpi: document.getElementById("export-dpi"),
    lockAspect: document.getElementById("lock-aspect"),
    exportSummary: document.getElementById("export-summary"),
    exportCapabilities: document.getElementById("export-capabilities"),
    previewStage: document.querySelector(".preview-stage"),
    titleEnabled: document.getElementById("title-enabled"),
    titleMain: document.getElementById("title-main"),
    titleSub: document.getElementById("title-sub"),
    boxNumberingEnabled: document.getElementById("box-numbering-enabled"),
    boxNumberingStart: document.getElementById("box-numbering-start"),
    titleCrest: document.getElementById("title-crest"),
    clearCrest: document.getElementById("clear-crest"),
    crestStatus: document.getElementById("crest-status"),
    inspectorSection: document.getElementById("inspector-section"),
    sidebarTabs: Array.from(document.querySelectorAll(".sidebar-tab")),
    tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
    openImport: document.getElementById("open-import"),
    openExport: document.getElementById("open-export"),
    openHelp: document.getElementById("open-help"),
    openAbout: document.getElementById("open-about"),
    openDownloads: document.getElementById("open-downloads"),
    menuToggle: document.getElementById("menu-toggle"),
    topbarMenu: document.getElementById("topbar-menu"),
    importModal: document.getElementById("import-modal"),
    exportModal: document.getElementById("export-modal"),
    aboutModal: document.getElementById("about-modal"),
    downloadsModal: document.getElementById("downloads-modal"),
    helpModal: document.getElementById("help-modal"),
    closeImport: document.getElementById("close-import"),
    closeExport: document.getElementById("close-export"),
    closeHelp: document.getElementById("close-help"),
    closeAbout: document.getElementById("close-about"),
    closeDownloads: document.getElementById("close-downloads"),
    acceptHelp: document.getElementById("accept-help"),
    importYamlFile: document.getElementById("import-yaml-file"),
    importYamlChoose: document.getElementById("import-yaml-choose"),
    importYamlText: document.getElementById("import-yaml-text"),
    applyImport: document.getElementById("apply-import"),
    downloadExport: document.getElementById("download-export"),
    exportOrientation: document.getElementById("export-orientation"),
    zoomOut: document.getElementById("zoom-out"),
    zoomIn: document.getElementById("zoom-in"),
    zoomPercent: document.getElementById("zoom-percent"),
    appVersionBadge: document.getElementById("app-version-badge"),
    aboutVersion: document.getElementById("about-version"),
    aboutLastUpdated: document.getElementById("about-last-updated"),
    aboutRuntime: document.getElementById("about-runtime"),
    aboutReleaseLinkWrap: document.getElementById("about-release-link-wrap"),
    aboutReleaseLink: document.getElementById("about-release-link"),
    downloadSuggestion: document.getElementById("download-suggestion"),
    downloadOptions: document.getElementById("download-options"),
    inspectorActiveLabel: document.getElementById("inspector-active-label"),
  };
  const desktopBridge = window.treegenDesktop && window.treegenDesktop.isDesktop ? window.treegenDesktop : null;
  const canExactServerExport = !!desktopBridge || isLikelyLocalHost();
  const latestReleaseUrl = resolveLatestReleaseUrl();

  function init() {
    configureRuntimeMode();
    populateGenerationStyleSelect();
    bindEvents();
    bindTabs();
    enablePreviewDragging();
    loadDemoData();
    maybeShowHelpModal();
    window.addEventListener("resize", handleWindowResize);
  }

  function bindEvents() {
    document.getElementById("load-demo").addEventListener("click", () => {
      closeTopbarMenu();
      loadDemoData();
    });
    document.getElementById("clear-tree").addEventListener("click", () => {
      closeTopbarMenu();
      clearTree();
    });
    document.getElementById("fit-view").addEventListener("click", fitWidth);
    elements.menuToggle.addEventListener("click", toggleTopbarMenu);
    elements.zoomOut.addEventListener("click", () => stepZoom(-5));
    elements.zoomIn.addEventListener("click", () => stepZoom(5));
    elements.zoomPercent.addEventListener("input", () => {
      const value = clamp(Number(elements.zoomPercent.value) || 100, 5, 300);
      elements.zoomRange.value = String(value);
      applyZoom();
    });
    elements.openImport.addEventListener("click", () => openModal("import"));
    elements.openExport.addEventListener("click", () => openModal("export"));
    elements.openDownloads.addEventListener("click", () => openModal("downloads"));
    elements.openHelp.addEventListener("click", () => openModal("help"));
    elements.openAbout.addEventListener("click", () => openModal("about"));
    elements.closeImport.addEventListener("click", () => closeModal("import"));
    elements.closeExport.addEventListener("click", () => closeModal("export"));
    elements.closeHelp.addEventListener("click", acknowledgeHelpModal);
    elements.closeAbout.addEventListener("click", () => closeModal("about"));
    elements.closeDownloads.addEventListener("click", () => closeModal("downloads"));
    elements.acceptHelp.addEventListener("click", acknowledgeHelpModal);
    document.querySelectorAll("[data-close-modal]").forEach((node) => {
      node.addEventListener("click", () => closeModal(node.getAttribute("data-close-modal")));
    });
    document.addEventListener("click", handleDocumentMenuClick);
    elements.importYamlFile.addEventListener("change", handleImportFile);
    elements.importYamlChoose.addEventListener("click", chooseImportFile);
    elements.applyImport.addEventListener("click", applyImportModal);
    elements.downloadExport.addEventListener("click", handleExportAction);

    elements.personName.addEventListener("input", () => {
      state.people[state.selectedId].name = elements.personName.value;
      syncAfterChange();
    });
    elements.personBirth.addEventListener("input", () => {
      state.people[state.selectedId].birthYear = sanitizeDateValue(elements.personBirth.value);
      syncAfterChange();
    });
    elements.personDeath.addEventListener("input", () => {
      state.people[state.selectedId].deathYear = sanitizeDateValue(elements.personDeath.value);
      syncAfterChange();
    });
    elements.personMarriage.addEventListener("input", () => {
      state.people[state.selectedId].marriageDate = sanitizeDateValue(elements.personMarriage.value);
      syncAfterChange();
    });
    elements.personChildren.addEventListener("input", () => {
      state.people[state.selectedId].childrenNote = elements.personChildren.value;
      syncAfterChange();
    });
    elements.personNote.addEventListener("input", () => {
      state.people[state.selectedId].note = elements.personNote.value;
      syncAfterChange();
    });
    elements.personNameSizeOverride.addEventListener("input", () => {
      state.people[state.selectedId].nameSizeOverride = sanitizeOptionalNumber(elements.personNameSizeOverride.value);
      syncAfterChange();
    });
    elements.personNameColorOverride.addEventListener("input", () => {
      state.people[state.selectedId].nameColorOverride = sanitizeOptionalColor(elements.personNameColorOverride.value);
      syncAfterChange();
    });
    elements.personDateSizeOverride.addEventListener("input", () => {
      state.people[state.selectedId].dateSizeOverride = sanitizeOptionalNumber(elements.personDateSizeOverride.value);
      syncAfterChange();
    });
    elements.personDateColorOverride.addEventListener("input", () => {
      state.people[state.selectedId].dateColorOverride = sanitizeOptionalColor(elements.personDateColorOverride.value);
      syncAfterChange();
    });

    elements.fontFamily.addEventListener("input", () => {
      state.settings.fontFamily = elements.fontFamily.value.trim() || DEFAULT_SETTINGS.fontFamily;
      syncAfterChange();
    });
    elements.fauxBold.addEventListener("change", () => {
      state.settings.fauxBold = elements.fauxBold.checked;
      syncAfterChange();
    });
    elements.generationStyleSelect.addEventListener("change", hydrateGenerationStyleControls);
    elements.genNameSize.addEventListener("input", () => updateGenerationStyle("nameSize", Number(elements.genNameSize.value) || 8));
    elements.genNameColor.addEventListener("input", () => updateGenerationStyle("nameColor", normalizeColor(elements.genNameColor.value)));
    elements.genDateSize.addEventListener("input", () => updateGenerationStyle("dateSize", Number(elements.genDateSize.value) || 8));
    elements.genDateColor.addEventListener("input", () => updateGenerationStyle("dateColor", normalizeColor(elements.genDateColor.value)));
    elements.genSyncNameDate.addEventListener("change", () => {
      const generation = Number(elements.generationStyleSelect.value || "0");
      state.settings.generationStyles[generation].syncNameDate = elements.genSyncNameDate.checked;
      if (elements.genSyncNameDate.checked) {
        state.settings.generationStyles[generation].dateSize = state.settings.generationStyles[generation].nameSize;
      }
      syncAfterChange();
    });
    elements.genChildrenSize.addEventListener("input", () => updateGenerationStyle("childrenSize", Number(elements.genChildrenSize.value) || 8));
    elements.genChildrenColor.addEventListener("input", () => updateGenerationStyle("childrenColor", normalizeColor(elements.genChildrenColor.value)));
    elements.datePrefixBirth.addEventListener("input", () => updateDatePrefix("birth", elements.datePrefixBirth.value));
    elements.datePrefixDeath.addEventListener("input", () => updateDatePrefix("death", elements.datePrefixDeath.value));
    elements.datePrefixMarriage.addEventListener("input", () => updateDatePrefix("marriage", elements.datePrefixMarriage.value));
    elements.titleEnabled.addEventListener("change", () => {
      state.settings.titleBox.enabled = elements.titleEnabled.checked;
      syncAfterChange();
    });
    elements.titleMain.addEventListener("input", () => {
      state.settings.titleBox.title = elements.titleMain.value;
      syncAfterChange();
    });
    elements.titleSub.addEventListener("input", () => {
      state.settings.titleBox.subtitle = elements.titleSub.value;
      syncAfterChange();
    });
    elements.boxNumberingEnabled.addEventListener("change", () => {
      state.settings.boxNumbering.enabled = elements.boxNumberingEnabled.checked;
      syncAfterChange();
    });
    elements.boxNumberingStart.addEventListener("change", () => {
      state.settings.boxNumbering.startAt = Number(elements.boxNumberingStart.value || "0");
      syncAfterChange();
    });
    elements.titleCrest.addEventListener("change", handleCrestUpload);
    elements.clearCrest.addEventListener("click", () => {
      state.settings.titleBox.crestDataUrl = "";
      elements.titleCrest.value = "";
      syncAfterChange();
    });
    elements.zoomRange.addEventListener("input", applyZoom);
    elements.imageFormat.addEventListener("change", () => {
      state.export.format = elements.imageFormat.value;
      updateExportControls();
    });
    elements.imageQuality.addEventListener("input", () => {
      state.export.quality = clamp(Number(elements.imageQuality.value) || 92, 10, 100);
      updateExportControls();
    });
    elements.exportWidthInches.addEventListener("input", () => {
      state.export.widthInches = clamp(Number(elements.exportWidthInches.value) || 24, 1, 100);
      if (state.export.lockAspect) {
        state.export.heightInches = round2(state.export.widthInches / getChartAspectRatio());
      }
      updateExportControls();
    });
    elements.exportHeightInches.addEventListener("input", () => {
      state.export.heightInches = clamp(Number(elements.exportHeightInches.value) || 8.5, 1, 100);
      if (state.export.lockAspect) {
        state.export.widthInches = round2(state.export.heightInches * getChartAspectRatio());
      }
      updateExportControls();
    });
    elements.exportDpi.addEventListener("input", () => {
      state.export.dpi = clamp(Number(elements.exportDpi.value) || 600, 72, 1200);
      updateExportControls();
    });
    elements.lockAspect.addEventListener("change", () => {
      state.export.lockAspect = elements.lockAspect.checked;
      if (state.export.lockAspect) {
        state.export.heightInches = round2(state.export.widthInches / getChartAspectRatio());
      }
      updateExportControls();
    });
    elements.exportOrientation.addEventListener("change", () => {
      const landscape = elements.exportOrientation.value === "landscape";
      const longSide = Math.max(state.export.widthInches, state.export.heightInches);
      const shortSide = Math.min(state.export.widthInches, state.export.heightInches);
      state.export.widthInches = landscape ? longSide : shortSide;
      state.export.heightInches = landscape ? shortSide : longSide;
      updateExportControls();
    });
  }

  function bindTabs() {
    elements.sidebarTabs.forEach((button) => {
      button.addEventListener("click", () => setActivePanel(button.dataset.targetPanel));
    });
  }

  function setActivePanel(target) {
    elements.tabPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === target);
    });
    elements.sidebarTabs.forEach((button) => {
      button.classList.toggle("active", button.dataset.targetPanel === target);
    });
    if (elements.inspectorActiveLabel) {
      const active = elements.sidebarTabs.find((button) => button.dataset.targetPanel === target);
      elements.inspectorActiveLabel.textContent = active ? active.textContent : "Editor";
    }
  }

  function clearTree() {
    if (!window.confirm("Clear the whole tree and replace all values with blanks?")) return;
    state.people = buildBlankPeople();
    state.selectedId = "root";
    hydrateControls();
    renderChart();
    refreshYamlEditor();
    setStatus("Cleared tree");
  }

  function buildDefaultPeople() {
    const people = {};
    for (const slot of SLOT_DEFINITIONS) {
      const years = sampleYears(slot);
      people[slot.id] = {
        name: demoNameForSlot(slot),
        birthYear: years.birthYear,
        deathYear: years.deathYear,
        marriageDate: sampleMarriageDate(slot),
        childrenNote: sampleChildrenNote(slot),
        note: sampleNoteForSlot(slot),
        nameSizeOverride: null,
        nameColorOverride: "",
        dateSizeOverride: null,
        dateColorOverride: "",
      };
    }
    return people;
  }

  function buildBlankPeople() {
    const people = {};
    for (const slot of SLOT_DEFINITIONS) {
      people[slot.id] = {
        name: "",
        birthYear: "",
        deathYear: "",
        marriageDate: "",
        childrenNote: "",
        note: "",
        nameSizeOverride: null,
        nameColorOverride: "",
        dateSizeOverride: null,
        dateColorOverride: "",
      };
    }
    return people;
  }

  function loadDemoData() {
    state.settings = clone(DEFAULT_SETTINGS);
    state.people = buildDefaultPeople();
    state.selectedId = "root";
    state.export = {
      format: canExactServerExport ? "pdf" : "svg",
      quality: 100,
      widthInches: 11,
      heightInches: round2(11 / getChartAspectRatio()),
      dpi: 600,
      lockAspect: true,
    };
    hydrateControls();
    refreshYamlEditor();
    renderChart();
    fitWidth();
    setStatus("Loaded Italian family demo");
  }

  function hydrateControls() {
    const person = state.people[state.selectedId];
    const slot = getSlot(state.selectedId);
    elements.selectedSlotLabel.textContent = slot.label;
    elements.personName.value = person.name;
    elements.personBirth.value = person.birthYear;
    elements.personDeath.value = person.deathYear;
    elements.personMarriage.value = person.marriageDate || "";
    elements.personChildren.value = person.childrenNote;
    elements.personNote.value = person.note || "";
    elements.personNameSizeOverride.value = person.nameSizeOverride == null ? "" : String(person.nameSizeOverride);
    elements.personNameColorOverride.value = person.nameColorOverride || "";
    elements.personDateSizeOverride.value = person.dateSizeOverride == null ? "" : String(person.dateSizeOverride);
    elements.personDateColorOverride.value = person.dateColorOverride || "";
    elements.personChildren.disabled = slot.generation >= 5;
    if (slot.generation >= 5) {
      elements.personChildren.value = "";
    }
    elements.personNote.disabled = slot.generation >= 3;
    elements.personMarriage.disabled = !(slot.generation > 0 && slot.generation < 5 && slot.path[slot.path.length - 1] === "mother");
    if (elements.personMarriage.disabled) {
      elements.personMarriage.value = "";
    }
    elements.fontFamily.value = state.settings.fontFamily;
    elements.fauxBold.checked = !!state.settings.fauxBold;
    hydrateGenerationStyleControls();
    elements.titleEnabled.checked = !!state.settings.titleBox.enabled;
    elements.titleMain.value = state.settings.titleBox.title || "";
    elements.titleSub.value = state.settings.titleBox.subtitle || "";
    elements.boxNumberingEnabled.checked = !!state.settings.boxNumbering.enabled;
    elements.boxNumberingStart.value = String(state.settings.boxNumbering.startAt || 0);
    elements.crestStatus.textContent = state.settings.titleBox.crestDataUrl ? "Custom crest image loaded." : "Default crest from root surname.";
    elements.exportOrientation.value = state.export.widthInches >= state.export.heightInches ? "landscape" : "portrait";
    setActivePanel(document.querySelector(".sidebar-tab.active")?.dataset.targetPanel || "person");
    elements.imageFormat.value = state.export.format;
    elements.imageQuality.value = String(state.export.quality);
    elements.exportWidthInches.value = String(state.export.widthInches);
    elements.exportHeightInches.value = String(state.export.heightInches);
    elements.exportDpi.value = String(state.export.dpi);
    elements.lockAspect.checked = !!state.export.lockAspect;
    updateExportControls();
  }

  function selectSlot(id) {
    state.selectedId = id;
    hydrateControls();
    renderChart();
  }

  function syncAfterChange() {
    hydrateControls();
    refreshYamlEditor();
    renderChart();
  }

  function refreshYamlEditor() {
    state.yamlText = serializeCurrentState();
    if (elements.importYamlText && !elements.importModal.hidden) {
      elements.importYamlText.value = state.yamlText;
    }
  }

  function serializeCurrentState() {
    return serializeYaml({
      settings: state.settings,
      rootPersonId: "root",
      people: state.people,
    });
  }

  function applyYamlFromEditor(yamlText = "") {
    try {
      const parsed = parseYaml(yamlText || elements.importYamlText.value);
      applyImportedState(parsed);
      hydrateControls();
      renderChart();
      refreshYamlEditor();
      setStatus("Imported YAML");
    } catch (error) {
      setStatus("YAML error: " + error.message);
      throw error;
    }
  }

  function applyImportedState(data) {
    const importedSettings = data.settings || {};
    const nextSettings = clone(DEFAULT_SETTINGS);
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
    } else if (Array.isArray(importedSettings.generationFontSizes)) {
      nextSettings.generationStyles = buildDefaultGenerationStyles();
      importedSettings.generationFontSizes.forEach((size, generation) => {
        if (nextSettings.generationStyles[generation]) {
          nextSettings.generationStyles[generation].nameSize = Number(size) || nextSettings.generationStyles[generation].nameSize;
        }
      });
    }
    if (importedSettings.titleBox && typeof importedSettings.titleBox === "object") {
      nextSettings.titleBox = {
        enabled: typeof importedSettings.titleBox.enabled === "boolean" ? importedSettings.titleBox.enabled : DEFAULT_SETTINGS.titleBox.enabled,
        title: typeof importedSettings.titleBox.title === "string" ? importedSettings.titleBox.title : DEFAULT_SETTINGS.titleBox.title,
        subtitle: typeof importedSettings.titleBox.subtitle === "string" ? importedSettings.titleBox.subtitle : DEFAULT_SETTINGS.titleBox.subtitle,
        author: typeof importedSettings.titleBox.author === "string" ? importedSettings.titleBox.author : DEFAULT_SETTINGS.titleBox.author,
        crestDataUrl: typeof importedSettings.titleBox.crestDataUrl === "string" ? importedSettings.titleBox.crestDataUrl : "",
      };
    }
    if (importedSettings.datePrefixes && typeof importedSettings.datePrefixes === "object") {
      nextSettings.datePrefixes = normalizeDatePrefixes(importedSettings.datePrefixes);
    }
    if (importedSettings.boxNumbering && typeof importedSettings.boxNumbering === "object") {
      nextSettings.boxNumbering = {
        enabled: typeof importedSettings.boxNumbering.enabled === "boolean" ? importedSettings.boxNumbering.enabled : DEFAULT_SETTINGS.boxNumbering.enabled,
        startAt: Number(importedSettings.boxNumbering.startAt ?? DEFAULT_SETTINGS.boxNumbering.startAt) || 0,
      };
    }

    const nextPeople = buildBlankPeople();
    const importedPeople = data.people || {};
    for (const slot of SLOT_DEFINITIONS) {
      const incoming = importedPeople[slot.id] || {};
      nextPeople[slot.id] = {
        name: sanitizeText(incoming.name ?? nextPeople[slot.id].name),
        birthYear: sanitizeDateValue(incoming.birth ?? incoming.birthYear ?? nextPeople[slot.id].birthYear),
        deathYear: sanitizeDateValue(incoming.death ?? incoming.deathYear ?? nextPeople[slot.id].deathYear),
        marriageDate: sanitizeDateValue(incoming.marriageDate ?? nextPeople[slot.id].marriageDate),
        childrenNote: typeof incoming.childrenNote === "string" ? incoming.childrenNote : nextPeople[slot.id].childrenNote,
        note: typeof incoming.note === "string" ? incoming.note : nextPeople[slot.id].note,
        nameSizeOverride: sanitizeOptionalNumber(incoming.nameSizeOverride ?? nextPeople[slot.id].nameSizeOverride),
        nameColorOverride: sanitizeOptionalColor(incoming.nameColorOverride ?? nextPeople[slot.id].nameColorOverride),
        dateSizeOverride: sanitizeOptionalNumber(incoming.dateSizeOverride ?? nextPeople[slot.id].dateSizeOverride),
        dateColorOverride: sanitizeOptionalColor(incoming.dateColorOverride ?? nextPeople[slot.id].dateColorOverride),
      };
    }

    state.settings = nextSettings;
    state.people = nextPeople;
    if (!state.people[state.selectedId]) state.selectedId = "root";
  }

  function renderChart() {
    const yaml = serializeCurrentState();
    state.yamlText = yaml;
    try {
      const svgText = applyPreviewMargin(renderYamlToSvg(yaml), 36);
      state.fitReport = analyzeYamlLayout(yaml);
      const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
      const svg = doc.documentElement;
      bindRenderedSvg(svg);
      elements.svgWrapper.replaceChildren(svg);
      applyZoom();
      updateGenerationFitReport();
      setStatus("Preview updated");
    } catch (error) {
      setStatus("Render error: " + error.message);
    }
  }

  function bindRenderedSvg(svg) {
    svg.querySelectorAll(".node-box").forEach((node) => {
      const slotId = node.getAttribute("data-slot-id");
      if (!slotId) return;
      node.classList.toggle("selected", slotId === state.selectedId);
      node.addEventListener("click", (event) => {
        event.stopPropagation();
        selectSlot(slotId);
      });
    });
  }

  function buildLayout() {
    const positions = {};
    const chartHeight = PAGE_HEIGHT_PT;

    const rowTops = {};
    rowTops[MAX_GENERATION] = MARGIN_TOP;
    for (let generation = MAX_GENERATION - 1; generation >= 0; generation -= 1) {
      rowTops[generation] = rowTops[generation + 1] + BOX_HEIGHTS[generation + 1] + ROW_STEPS[generation + 1];
    }

    for (const slot of SLOT_DEFINITIONS) {
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
        generation: slot.generation,
        centerX,
        centerY: rowTops[slot.generation] + height / 2,
        verticalText: slot.generation >= 5,
      };
    }

    return {
      chartHeight,
      nodes: positions,
    };
  }

  function drawConnector(childNode, fatherNode, motherNode, noteText) {
    const group = document.createElementNS(SVG_NS, "g");
    const generationStyle = getGenerationStyle(motherNode.generation);
    const preferredFontSize = generationStyle.childrenSize;
    const childLines = compactLines(noteText).slice(0, 9);
    const childCount = childLines.length;
    const joinY = Math.max(fatherNode.y + fatherNode.height, motherNode.y + motherNode.height) + 5;
    const midX = (fatherNode.centerX + motherNode.centerX) / 2;
    const childJoinY = childNode.y - 5;

    group.appendChild(line(fatherNode.centerX, fatherNode.y + fatherNode.height, fatherNode.centerX, joinY));
    group.appendChild(line(motherNode.centerX, motherNode.y + motherNode.height, motherNode.centerX, joinY));
    group.appendChild(line(fatherNode.centerX, joinY, motherNode.centerX, joinY));
    group.appendChild(line(midX, joinY, midX, childJoinY));
    group.appendChild(line(midX, childJoinY, childNode.centerX, childJoinY));
    group.appendChild(line(childNode.centerX, childJoinY, childNode.centerX, childNode.y));

    if (!childCount) {
      return group;
    }

    const titleText = `${childCount} ${childCount === 1 ? "Child" : "Children"}`;
    const availableHeight = Math.max(14, childNode.y - motherNode.y - 6);
    const rightWidth = Math.max(32, PAGE_WIDTH_PT - (motherNode.x + motherNode.width + 6));
    const leftWidth = Math.max(32, motherNode.x - 6);
    const placeRight = rightWidth >= leftWidth;
    const maxWidth = Math.min(96, placeRight ? rightWidth : leftWidth);
    const noteLayout = layoutAnnotationText(childLines, maxWidth, preferredFontSize, titleText, availableHeight);
    const noteFontSize = noteLayout.fontSize;
    const noteLineHeight = noteLayout.lineHeight;
    const noteHeight = noteLayout.height;
    const noteX = placeRight ? motherNode.x + motherNode.width + 4 : Math.max(4, motherNode.x - noteLayout.width - 4);
    const noteY = Math.max(2, Math.min(motherNode.y + 1, childNode.y - noteHeight - 2));
    const titleY = noteY + noteFontSize;
    const listStartY = titleY + 2.5 + noteLineHeight;

    const titleNode = document.createElementNS(SVG_NS, "text");
    titleNode.textContent = titleText;
    titleNode.setAttribute("x", String(noteX));
    titleNode.setAttribute("y", String(titleY));
    applyTextStyle(titleNode, generationStyle.childrenColor, noteFontSize, true);
    group.appendChild(titleNode);

    const underline = document.createElementNS(SVG_NS, "line");
    underline.setAttribute("x1", String(noteX));
    underline.setAttribute("y1", String(titleY + 4));
    underline.setAttribute("x2", String(noteX + noteLayout.width));
    underline.setAttribute("y2", String(titleY + 4));
    underline.setAttribute("stroke", "#303030");
    underline.setAttribute("stroke-width", "1.15");
    group.appendChild(underline);

    noteLayout.lines.forEach((text, idx) => {
      const node = document.createElementNS(SVG_NS, "text");
      node.textContent = text;
      node.setAttribute("x", String(noteX + 2));
      node.setAttribute("y", String(listStartY + idx * noteLineHeight));
      applyTextStyle(node, generationStyle.childrenColor, noteFontSize, false);
      group.appendChild(node);
    });

    return group;
  }

  function drawNode(slot, node) {
    const person = state.people[slot.id];
    const generationStyle = getGenerationStyle(slot.generation);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "node-box" + (state.selectedId === slot.id ? " selected" : ""));
    group.dataset.slotId = slot.id;

    const glow = document.createElementNS(SVG_NS, "rect");
    glow.setAttribute("x", String(node.x - 3));
    glow.setAttribute("y", String(node.y - 3));
    glow.setAttribute("width", String(node.width + 6));
    glow.setAttribute("height", String(node.height + 6));
    glow.setAttribute("rx", String(slotCornerRadius(slot) + 3));
    glow.setAttribute("fill", "none");
    glow.setAttribute("stroke", "#7ea0ff");
    glow.setAttribute("stroke-width", "3");
    glow.setAttribute("opacity", state.selectedId === slot.id ? "0.9" : "0");
    glow.setAttribute("class", "selection-glow");
    group.appendChild(glow);

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(node.x));
    rect.setAttribute("y", String(node.y));
    rect.setAttribute("width", String(node.width));
    rect.setAttribute("height", String(node.height));
    rect.setAttribute("rx", String(slotCornerRadius(slot)));
    rect.setAttribute("fill", "#fffdfa");
    rect.setAttribute("stroke", "#303030");
    rect.setAttribute("stroke-width", "1.25");
    group.appendChild(rect);

    const textGroup = document.createElementNS(SVG_NS, "g");
    const name = displayName(person.name);
    const dates = formatDates(person.birthYear, person.deathYear);
    if (node.verticalText) {
      const verticalLayout = fitVerticalNodeText(node, generationStyle, name, dates);
      textGroup.setAttribute("transform", `translate(${node.centerX}, ${node.centerY - 4}) rotate(-90)`);
      const lines = verticalLayout.nameLines;
      const startY = -((lines.length - 1) * verticalLayout.nameLineHeight) / 2;
      lines.forEach((lineText, idx) => {
        const lineNode = document.createElementNS(SVG_NS, "text");
        lineNode.textContent = lineText;
        lineNode.setAttribute("x", "0");
        lineNode.setAttribute("y", String(startY + idx * verticalLayout.nameLineHeight));
        applyTextStyle(lineNode, generationStyle.nameColor, verticalLayout.nameSize, true);
        lineNode.setAttribute("text-anchor", "middle");
        textGroup.appendChild(lineNode);
      });
      group.appendChild(textGroup);

      const dateNode = document.createElementNS(SVG_NS, "text");
      dateNode.textContent = dates;
      dateNode.setAttribute("x", String(node.centerX));
      dateNode.setAttribute("y", String(node.y + node.height + verticalLayout.dateSize + 1.5));
      dateNode.setAttribute("transform", `rotate(-90 ${node.centerX} ${node.y + node.height + verticalLayout.dateSize + 1.5})`);
      applyTextStyle(dateNode, generationStyle.dateColor, verticalLayout.dateSize, false);
      dateNode.setAttribute("text-anchor", "start");
      group.appendChild(dateNode);
    } else {
      const note = slot.generation <= 2 ? compactLines(person.note || "").slice(0, 2) : [];
      const layout = fitHorizontalNodeText(node, generationStyle, name, dates, note);
      const startY = node.centerY - (layout.height / 2) + layout.nameSize;
      layout.nameLines.forEach((lineText, idx) => {
        const lineNode = document.createElementNS(SVG_NS, "text");
        lineNode.textContent = lineText;
        lineNode.setAttribute("x", String(node.centerX));
        lineNode.setAttribute("y", String(startY + idx * layout.nameLineHeight));
        applyTextStyle(lineNode, generationStyle.nameColor, layout.nameSize, true);
        lineNode.setAttribute("text-anchor", "middle");
        textGroup.appendChild(lineNode);
      });

      layout.dateLines.forEach((lineText, idx) => {
        const dateNode = document.createElementNS(SVG_NS, "text");
        dateNode.textContent = lineText;
        dateNode.setAttribute("x", String(node.centerX));
        dateNode.setAttribute("y", String(startY + layout.nameLines.length * layout.nameLineHeight + idx * layout.dateLineHeight));
        applyTextStyle(dateNode, generationStyle.dateColor, layout.dateSize, false);
        dateNode.setAttribute("text-anchor", "middle");
        textGroup.appendChild(dateNode);
      });

      layout.noteLines.forEach((lineText, idx) => {
        const noteNode = document.createElementNS(SVG_NS, "text");
        noteNode.textContent = lineText;
        noteNode.setAttribute("x", String(node.centerX));
        noteNode.setAttribute("y", String(startY + layout.nameLines.length * layout.nameLineHeight + layout.dateLines.length * layout.dateLineHeight + idx * layout.noteLineHeight));
        applyTextStyle(noteNode, "#000000", layout.noteSize, false);
        noteNode.setAttribute("text-anchor", "middle");
        textGroup.appendChild(noteNode);
      });
      group.appendChild(textGroup);
    }
    group.addEventListener("click", () => selectSlot(slot.id));
    return group;
  }

  function line(x1, y1, x2, y2) {
    const path = document.createElementNS(SVG_NS, "line");
    path.setAttribute("x1", String(x1));
    path.setAttribute("y1", String(y1));
    path.setAttribute("x2", String(x2));
    path.setAttribute("y2", String(y2));
    path.setAttribute("stroke", "#303030");
    path.setAttribute("stroke-width", "1.15");
    path.setAttribute("fill", "none");
    return path;
  }

  function applyTextStyle(node, color, fontSize, emphasize) {
    node.setAttribute("fill", color);
    node.setAttribute("font-family", `"${state.settings.fontFamily}", "Book Antiqua", Palatino, serif`);
    node.setAttribute("font-size", `${fontSize}pt`);
    node.setAttribute("font-weight", emphasize ? "700" : "600");
    if (state.settings.fauxBold) {
      node.setAttribute("stroke", color);
      node.setAttribute("stroke-width", emphasize ? "0.28" : "0.2");
      node.setAttribute("paint-order", "stroke fill");
    }
  }

  function fitHorizontalNodeText(node, style, name, dates, noteLines) {
    const availableWidth = Math.max(8, node.width);
    const availableHeight = Math.max(8, node.height);
    for (let scale = 1; scale >= 0.45; scale -= 0.05) {
      const nameSize = round2(style.nameSize * scale);
      const dateSize = round2((style.syncNameDate ? style.nameSize : style.dateSize) * scale);
      const noteSize = round2(Math.max(3.5, dateSize - 1));
      const nameChars = Math.max(4, Math.floor(availableWidth / (nameSize * 0.56)));
      const dateChars = Math.max(4, Math.floor(availableWidth / (dateSize * 0.56)));
      const noteChars = Math.max(4, Math.floor(availableWidth / (noteSize * 0.56)));
      const nameLines = wrapText(name, nameChars).slice(0, 4);
      const dateLines = wrapText(dates, dateChars).slice(0, 2);
      const wrappedNotes = noteLines.flatMap((line) => wrapText(line, noteChars)).slice(0, 2);
      const nameLineHeight = Math.max(nameSize * 0.92, nameSize - 0.1);
      const dateLineHeight = Math.max(dateSize * 0.88, dateSize - 0.15);
      const noteLineHeight = Math.max(noteSize * 0.84, noteSize - 0.2);
      const height =
        nameLines.length * nameLineHeight +
        dateLines.length * dateLineHeight +
        wrappedNotes.length * noteLineHeight;
      if (height <= availableHeight) {
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
          height,
        };
      }
    }

    const fallbackNameSize = 4;
    const fallbackDateSize = 3.5;
    return {
      nameSize: fallbackNameSize,
      dateSize: fallbackDateSize,
      noteSize: 3.2,
      nameLines: wrapText(name, Math.max(4, Math.floor(availableWidth / (fallbackNameSize * 0.56)))).slice(0, 4).map((line) => ellipsize(line, 16)),
      dateLines: [ellipsize(dates, 18)],
      noteLines: noteLines.slice(0, 1).map((line) => ellipsize(line, 16)),
      nameLineHeight: 3.9,
      dateLineHeight: 3.3,
      noteLineHeight: 3.1,
      height: availableHeight,
    };
  }

  function fitVerticalNodeText(node, style, name, dates) {
    const availableExtent = Math.max(10, node.height - 4);
    for (let scale = 1; scale >= 0.45; scale -= 0.05) {
      const nameSize = round2(style.nameSize * scale);
      const dateSize = round2(Math.max(3.5, style.dateSize * Math.min(scale, 0.8)));
      const nameChars = Math.max(3, Math.floor(availableExtent / (nameSize * 1.2)));
      const nameLines = wrapText(name, nameChars).slice(0, 3);
      const nameLineHeight = Math.max(nameSize * 0.95, nameSize - 0.1);
      const used = nameLines.length * nameLineHeight;
      if (used <= availableExtent) {
        return {
          nameSize,
          dateSize,
          nameLines,
          nameLineHeight,
        };
      }
    }
    return {
      nameSize: 4,
      dateSize: 3.2,
      nameLines: wrapText(name, 6).slice(0, 3).map((line) => ellipsize(line, 8)),
      nameLineHeight: 4,
    };
  }

  function applyZoom() {
    const zoom = Number(elements.zoomRange.value) / 100;
    elements.zoomPercent.value = String(Number(elements.zoomRange.value));
    elements.svgWrapper.style.transform = `scale(${zoom})`;
  }

  function enablePreviewDragging() {
    const stage = elements.previewStage;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    stage.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".node-box")) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = stage.scrollLeft;
      startTop = stage.scrollTop;
      stage.classList.add("dragging");
      stage.setPointerCapture(event.pointerId);
    });

    stage.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      stage.scrollLeft = startLeft - dx;
      stage.scrollTop = startTop - dy;
    });

    const stopDragging = (event) => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("dragging");
      if (event && typeof event.pointerId === "number") {
        stage.releasePointerCapture(event.pointerId);
      }
    };

    stage.addEventListener("pointerup", stopDragging);
    stage.addEventListener("pointercancel", stopDragging);
    stage.addEventListener("pointerleave", stopDragging);
  }

  function fitWidth() {
    const stage = elements.previewStage;
    const svg = elements.svgWrapper.querySelector("svg");
    if (!svg) return;
    const fitMarginX = 56;
    const fitMarginY = 72;
    const width = Math.max(1, stage.clientWidth - fitMarginX);
    const height = Math.max(1, stage.clientHeight - fitMarginY);
    const svgWidth = svg.viewBox.baseVal.width || PAGE_WIDTH_PT;
    const svgHeight = svg.viewBox.baseVal.height || PAGE_HEIGHT_PT;
    const percentage = Math.max(5, Math.min(150, Math.floor(Math.min(width / svgWidth, height / svgHeight) * 100)));
    elements.zoomRange.value = String(percentage);
    elements.zoomPercent.value = String(percentage);
    applyZoom();
    requestAnimationFrame(() => {
      const scaledWidth = (svgWidth * percentage) / 100;
      stage.scrollLeft = Math.max(0, (scaledWidth - stage.clientWidth) / 2);
      stage.scrollTop = 0;
    });
  }

  function handleWindowResize() {
    clearTimeout(handleWindowResize.timer);
    handleWindowResize.timer = setTimeout(() => {
      fitWidth();
    }, 60);
  }

  async function downloadSvgFile() {
    const text = await requestRenderedArtifact("svg", buildRenderPayload("svg"), "text");
    await saveOrDownload(new Blob([text], { type: "image/svg+xml;charset=utf-8" }), "family-tree-chart.svg", [
      { name: "SVG", extensions: ["svg"] },
    ]);
    setStatus(desktopBridge ? "Saved SVG" : "Downloaded SVG");
  }

  async function downloadRasterFile() {
    const format = state.export.format;
    const extension = format === "jpeg" ? "jpg" : "png";
    const blob = await requestRenderedArtifact(format, buildRenderPayload(format), "blob");
    const { pixelWidth, pixelHeight } = getExportPixels();
    await saveOrDownload(blob, `family-tree-chart-${pixelWidth}x${pixelHeight}.${extension}`, [
      { name: extension === "jpg" ? "JPG" : "PNG", extensions: [extension] },
    ]);
    setStatus(`${desktopBridge ? "Saved" : "Downloaded"} ${format.toUpperCase()} at ${pixelWidth}x${pixelHeight}`);
  }

  async function printPdf() {
    const blob = await requestRenderedArtifact("pdf", buildRenderPayload("pdf"), "blob");
    await saveOrDownload(blob, "family-tree-chart.pdf", [
      { name: "PDF", extensions: ["pdf"] },
    ]);
    setStatus(desktopBridge ? "Saved PDF" : "Downloaded PDF");
  }

  function setStatus(text) {
    elements.statusText.textContent = text;
  }

  function stepZoom(delta) {
    const value = clamp(Number(elements.zoomRange.value) + delta, 5, 300);
    elements.zoomRange.value = String(value);
    applyZoom();
  }

  function openModal(kind) {
    closeTopbarMenu();
    const modal =
      kind === "import" ? elements.importModal :
      kind === "export" ? elements.exportModal :
      kind === "help" ? elements.helpModal :
      kind === "downloads" ? elements.downloadsModal :
      elements.aboutModal;
    modal.hidden = false;
    if (kind === "import") {
      elements.importYamlText.value = state.yamlText || serializeCurrentState();
    }
  }

  function closeModal(kind) {
    if (kind === "help") {
      try {
        window.localStorage.setItem("treegen-help-seen-v1", "1");
      } catch {}
    }
    const modal =
      kind === "import" ? elements.importModal :
      kind === "export" ? elements.exportModal :
      kind === "help" ? elements.helpModal :
      kind === "downloads" ? elements.downloadsModal :
      elements.aboutModal;
    modal.hidden = true;
  }

  function toggleTopbarMenu(event) {
    event.stopPropagation();
    const nextHidden = !elements.topbarMenu.hidden;
    elements.topbarMenu.hidden = nextHidden;
    elements.menuToggle.setAttribute("aria-expanded", String(!nextHidden));
  }

  function closeTopbarMenu() {
    elements.topbarMenu.hidden = true;
    elements.menuToggle.setAttribute("aria-expanded", "false");
  }

  function handleDocumentMenuClick(event) {
    if (elements.topbarMenu.hidden) return;
    if (event.target === elements.menuToggle || elements.menuToggle.contains(event.target)) return;
    if (elements.topbarMenu.contains(event.target)) return;
    closeTopbarMenu();
  }

  function maybeShowHelpModal() {
    const key = "treegen-help-seen-v1";
    try {
      if (window.localStorage.getItem(key)) return;
      openModal("help");
    } catch {}
  }

  function acknowledgeHelpModal() {
    try {
      window.localStorage.setItem("treegen-help-seen-v1", "1");
    } catch {}
    closeModal("help");
  }

  async function chooseImportFile() {
    if (desktopBridge) {
      const result = await desktopBridge.openYamlFile();
      if (!result || result.canceled) return;
      elements.importYamlText.value = result.text || "";
      setStatus(`Loaded YAML from ${basename(result.path || "selected file")}`);
      return;
    }
    elements.importYamlFile.click();
  }

  async function handleImportFile() {
    const [file] = elements.importYamlFile.files || [];
    if (!file) return;
    elements.importYamlText.value = await file.text();
  }

  function applyImportModal() {
    const yamlText = elements.importYamlText.value.trim();
    if (!yamlText) return;
    try {
      applyYamlFromEditor(yamlText);
      closeModal("import");
    } catch (error) {
      // status already updated
    }
  }

  async function handleExportAction() {
    try {
      const format = state.export.format;
      if (format === "yaml") {
        refreshYamlEditor();
        await saveOrDownload(new Blob([state.yamlText], { type: "text/yaml;charset=utf-8" }), "family-tree.yaml", [
          { name: "YAML", extensions: ["yaml", "yml"] },
        ]);
        setStatus(desktopBridge ? "Saved YAML" : "Downloaded YAML");
        closeModal("export");
        return;
      }
      if (format === "svg") {
        await downloadSvgFile();
      } else if (format === "pdf") {
        await printPdf();
      } else {
        await downloadRasterFile();
      }
      closeModal("export");
    } catch (error) {
      if (error && error.message === "Save cancelled") {
        setStatus("Save cancelled");
        return;
      }
      setStatus(`Export error: ${error.message}`);
    }
  }

  async function handleCrestUpload(event) {
    const [file] = event.target.files || [];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    state.settings.titleBox.crestDataUrl = dataUrl;
    syncAfterChange();
  }

  function updateExportControls() {
    if (!canExactServerExport && ["pdf", "png", "jpeg"].includes(state.export.format)) {
      state.export.format = "svg";
    }
    if (state.export.lockAspect) {
      state.export.heightInches = round2(state.export.widthInches / getChartAspectRatio());
    }
    elements.imageQuality.disabled = state.export.format !== "jpeg";
    syncExactExportAvailability();
    elements.imageFormat.value = state.export.format;
    elements.imageQuality.value = String(state.export.quality);
    elements.exportWidthInches.value = String(round2(state.export.widthInches));
    elements.exportHeightInches.value = String(round2(state.export.heightInches));
    elements.exportDpi.value = String(state.export.dpi);
    elements.lockAspect.checked = !!state.export.lockAspect;
    elements.exportOrientation.value = state.export.widthInches >= state.export.heightInches ? "landscape" : "portrait";
    elements.zoomPercent.value = elements.zoomRange.value;
    const { pixelWidth, pixelHeight } = getExportPixels();
    elements.exportSummary.textContent =
      `${pixelWidth} x ${pixelHeight} px at ${state.export.dpi} DPI ` +
      `(${round2(state.export.widthInches)}in x ${round2(state.export.heightInches)}in). ` +
      `Quality applies to JPG. SVG and PDF stay vector.`;
  }

  function getExportPixels() {
    return {
      pixelWidth: Math.max(1, Math.round(state.export.widthInches * state.export.dpi)),
      pixelHeight: Math.max(1, Math.round(state.export.heightInches * state.export.dpi)),
    };
  }

  function getChartAspectRatio() {
    return PAGE_WIDTH_PT / PAGE_HEIGHT_PT;
  }

  function buildRenderPayload(formatOverride) {
    const format = formatOverride || state.export.format;
    return {
      yaml: serializeCurrentState(),
      widthInches: state.export.widthInches,
      heightInches: state.export.heightInches,
      dpi: state.export.dpi,
      quality: state.export.quality,
      pageMarginPoints: format === "pdf" ? 36 : 8,
    };
  }

  function applyPreviewMargin(svgText, marginPoints) {
    const margin = Math.max(0, Number(marginPoints) || 0);
    if (!margin) return svgText;
    const viewBoxMatch = svgText.match(/viewBox="([^"]+)"/i);
    if (!viewBoxMatch) return svgText;
    const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
    if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
      return svgText;
    }
    const [minX, minY, width, height] = parts;
    const paddedViewBox = `${round2(minX - margin)} ${round2(minY - margin)} ${round2(width + margin * 2)} ${round2(height + margin * 2)}`;
    return svgText.replace(/viewBox="[^"]*"/i, `viewBox="${paddedViewBox}"`);
  }

  async function requestRenderedArtifact(format, payload, responseType) {
    const response = await fetch("api/render", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        format,
        ...payload,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return responseType === "blob" ? response.blob() : response.text();
  }

  async function saveOrDownload(blob, filename, filters) {
    if (!desktopBridge) {
      downloadBlob(blob, filename);
      return;
    }
    const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
    const result = await desktopBridge.saveFile({
      suggestedName: filename,
      filters,
      bytes,
    });
    if (!result || result.canceled) {
      throw new Error("Save cancelled");
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function basename(value) {
    return String(value || "").split(/[\\/]/).pop() || "";
  }

  function configureRuntimeMode() {
    const fileLabel = elements.importYamlFile.closest("label");
    if (desktopBridge && fileLabel) {
      fileLabel.hidden = true;
    }
    if (elements.appVersionBadge) {
      elements.appVersionBadge.textContent = `v${APP_META.version}`;
    }
    if (elements.aboutVersion) {
      elements.aboutVersion.textContent = `v${APP_META.version}`;
    }
    if (elements.aboutLastUpdated) {
      elements.aboutLastUpdated.textContent = APP_META.lastUpdated;
    }
    if (elements.aboutRuntime) {
      elements.aboutRuntime.textContent = desktopBridge
        ? "Desktop app"
        : canExactServerExport
          ? "Local browser app"
          : "Hosted browser demo";
    }
    if (elements.aboutReleaseLinkWrap && elements.aboutReleaseLink) {
      if (latestReleaseUrl) {
        elements.aboutReleaseLink.href = latestReleaseUrl;
        elements.aboutReleaseLinkWrap.hidden = false;
      } else {
        elements.aboutReleaseLinkWrap.hidden = true;
      }
    }
    renderDownloadOptions();
    if (elements.personName) {
      elements.personName.disabled = false;
      elements.personName.title = "Direct full text rendered for this box. This field should be editable in both the browser and the desktop app.";
    }
  }

  function renderDownloadOptions() {
    if (!elements.downloadOptions) return;
    if (!latestReleaseUrl) {
      elements.downloadSuggestion.textContent = "Release downloads are not available right now.";
      elements.downloadOptions.innerHTML = "";
      return;
    }
    const platform = detectPlatform();
    const options = [
      {
        key: "windows",
        label: "Windows",
        icon: "W",
        description: "Installer for most Windows PCs.",
        href: `${latestReleaseUrl}/download/TreeGen-Windows-Setup.exe`,
        secondaryLabel: "Portable",
        secondaryHref: `${latestReleaseUrl}/download/TreeGen-Windows-Portable.exe`,
      },
      {
        key: "macos",
        label: "macOS",
        icon: "M",
        description: "Native desktop app for Apple silicon Macs.",
        href: `${latestReleaseUrl}/download/TreeGen-macOS.dmg`,
        secondaryLabel: "ZIP",
        secondaryHref: `${latestReleaseUrl}/download/TreeGen-macOS.zip`,
      },
      {
        key: "linux",
        label: "Linux",
        icon: "L",
        description: "AppImage for most Linux desktops.",
        href: `${latestReleaseUrl}/download/TreeGen-Linux.AppImage`,
        secondaryLabel: "DEB",
        secondaryHref: `${latestReleaseUrl}/download/TreeGen-Linux.deb`,
      },
    ];
    const recommendedKey = platform === "macos" ? "macos" : platform === "windows" ? "windows" : platform === "linux" ? "linux" : "";
    elements.downloadSuggestion.textContent = recommendedKey
      ? `Recommended for this device: ${options.find((option) => option.key === recommendedKey)?.label}.`
      : "Choose the desktop download that matches your operating system.";
    elements.downloadOptions.innerHTML = options.map((option) => {
      const recommended = option.key === recommendedKey;
      return `
        <section class="download-card${recommended ? " recommended" : ""}">
          <div class="download-card-header">
            <div class="download-card-title">
              <span class="download-icon" aria-hidden="true">${option.icon}</span>
              <span>${option.label}</span>
            </div>
            ${recommended ? '<span class="download-badge">Recommended</span>' : ""}
          </div>
          <p>${option.description}</p>
          <div class="download-actions">
            <a class="download-link" href="${option.href}" target="_blank" rel="noopener noreferrer">Download</a>
            <a class="download-link" href="${option.secondaryHref}" target="_blank" rel="noopener noreferrer">${option.secondaryLabel}</a>
          </div>
        </section>
      `;
    }).join("");
  }

  function syncExactExportAvailability() {
    const exactFormats = new Set(["pdf", "png", "jpeg"]);
    Array.from(elements.imageFormat.options).forEach((option) => {
      option.disabled = !canExactServerExport && exactFormats.has(option.value);
    });
    if (elements.exportCapabilities) {
      elements.exportCapabilities.textContent = canExactServerExport
        ? "Exact PDF, PNG, JPG, SVG, and YAML export is available in the desktop app or local server."
        : "This hosted demo supports preview, YAML import, and SVG/YAML export. For exact PDF, PNG, and JPG export, use the desktop app.";
    }
  }

  function isLikelyLocalHost() {
    const host = window.location.hostname;
    return host === "127.0.0.1" || host === "localhost" || host === "";
  }

  function detectPlatform() {
    const value = String(
      window.navigator.userAgentData?.platform ||
      window.navigator.platform ||
      window.navigator.userAgent ||
      ""
    ).toLowerCase();
    if (value.includes("mac")) return "macos";
    if (value.includes("win")) return "windows";
    if (value.includes("linux") || value.includes("x11")) return "linux";
    return "";
  }

  function resolveLatestReleaseUrl() {
    const host = window.location.hostname;
    if (host.endsWith(".github.io")) {
      const owner = host.replace(/\.github\.io$/, "");
      const repo = window.location.pathname.split("/").filter(Boolean)[0];
      if (owner && repo) {
        return `https://github.com/${owner}/${repo}/releases/latest`;
      }
    }
    return null;
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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

  function buildDefaultDatePrefixes() {
    return Array.from({ length: MAX_GENERATION + 1 }, (_, generation) => ({
      birth: generation <= 3 ? "N" : "",
      death: generation <= 3 ? "S" : "",
      marriage: generation <= 3 ? "M" : "",
    }));
  }

  function normalizeDatePrefixes(datePrefixes) {
    const defaults = buildDefaultDatePrefixes();
    const hasPerGenerationKeys = Array.from({ length: MAX_GENERATION + 1 }, (_, generation) => `generation${generation}`)
      .some((key) => datePrefixes && typeof datePrefixes[key] === "object");
    if (hasPerGenerationKeys) {
      return defaults.map((fallback, generation) => {
        const incoming = datePrefixes[`generation${generation}`] || {};
        return {
          birth: sanitizePrefix(incoming.birth ?? fallback.birth),
          death: sanitizePrefix(incoming.death ?? fallback.death),
          marriage: sanitizePrefix(incoming.marriage ?? fallback.marriage),
        };
      });
    }
    const legacyBirth = sanitizePrefix(datePrefixes?.birth);
    const legacyDeath = sanitizePrefix(datePrefixes?.death);
    const legacyMarriage = sanitizePrefix(datePrefixes?.marriage);
    return defaults.map((fallback, generation) => ({
      birth: generation <= 3 ? (legacyBirth || fallback.birth) : "",
      death: generation <= 3 ? (legacyDeath || fallback.death) : "",
      marriage: generation <= 3 ? (legacyMarriage || fallback.marriage) : "",
    }));
  }

  function populateGenerationStyleSelect() {
    elements.generationStyleSelect.innerHTML = "";
    for (let generation = 0; generation <= MAX_GENERATION; generation += 1) {
      const option = document.createElement("option");
      option.value = String(generation);
      option.textContent = generationLabel(generation);
      elements.generationStyleSelect.appendChild(option);
    }
    elements.generationStyleSelect.value = "0";
  }

  function getGenerationStyle(generation) {
    return state.settings.generationStyles[generation] || buildDefaultGenerationStyles()[generation];
  }

  function hydrateGenerationStyleControls() {
    const generation = Number(elements.generationStyleSelect.value || "0");
    const style = getGenerationStyle(generation);
    elements.genNameSize.value = String(style.nameSize);
    elements.genNameColor.value = normalizeColor(style.nameColor);
    elements.genDateSize.value = String(style.dateSize);
    elements.genDateColor.value = normalizeColor(style.dateColor);
    elements.genSyncNameDate.checked = !!style.syncNameDate;
    elements.genChildrenSize.value = String(style.childrenSize);
    elements.genChildrenColor.value = normalizeColor(style.childrenColor);
    const prefixes = state.settings.datePrefixes[generation] || buildDefaultDatePrefixes()[generation];
    elements.datePrefixBirth.value = prefixes.birth || "";
    elements.datePrefixDeath.value = prefixes.death || "";
    elements.datePrefixMarriage.value = prefixes.marriage || "";
    updateGenerationFitReport();
  }

  function updateGenerationStyle(key, value) {
    const generation = Number(elements.generationStyleSelect.value || "0");
    state.settings.generationStyles[generation][key] = value;
    if (key === "nameSize" && state.settings.generationStyles[generation].syncNameDate) {
      state.settings.generationStyles[generation].dateSize = value;
    }
    syncAfterChange();
  }

  function updateDatePrefix(kind, value) {
    const generation = Number(elements.generationStyleSelect.value || "0");
    state.settings.datePrefixes[generation][kind] = sanitizePrefix(value);
    syncAfterChange();
  }

  function updateGenerationFitReport() {
    const generation = Number(elements.generationStyleSelect.value || "0");
    const report = state.fitReport[generation];
    if (!report) {
      elements.generationFitReport.textContent = "";
      return;
    }
    const parts = [];
    if (report.limited.nameCount > 0) {
      parts.push(
        `Name auto-fit active: requested ${report.requested.nameSize}pt, effective ${report.actual.nameMin}-${report.actual.nameMax}pt across ${report.limited.nameCount}/${report.boxCount} boxes.`
      );
    } else {
      parts.push(`Names fit at the requested ${report.requested.nameSize}pt in this generation.`);
    }
    if (report.actual.dateMax > 0) {
      if (report.limited.dateCount > 0) {
        parts.push(
          `Date labels are using ${report.actual.dateMin}-${report.actual.dateMax}pt instead of the requested ${report.requested.dateSize}pt in ${report.limited.dateCount} box${report.limited.dateCount === 1 ? "" : "es"}.`
        );
      } else {
        parts.push(`Date labels fit at the requested ${report.requested.dateSize}pt in this generation.`);
      }
    }
    elements.generationFitReport.textContent = parts.join(" ");
  }

  function sanitizeText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function sanitizeDateValue(value) {
    return sanitizeText(value);
  }

  function sanitizeOptionalNumber(value) {
    if (value == null || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function sanitizeOptionalColor(value) {
    const text = String(value ?? "").trim();
    return text ? normalizeColor(text) : "";
  }

  function normalizeColor(value) {
    const text = String(value || "").trim();
    if (!text) return "#000000";
    return text.startsWith("#") ? text.toUpperCase() : `#${text.toUpperCase()}`;
  }

  function sanitizePrefix(value) {
    return String(value ?? "").trim().slice(0, 1);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function compactLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function slotCornerRadius(slot) {
    if (slot.id === "root") return 1.5;
    const last = slot.path[slot.path.length - 1];
    return last === "mother" ? 4 : 0;
  }

  function layoutAnnotationText(linesToFit, noteWidth, preferredFontSize, titleText, maxHeight) {
    const sourceLines = linesToFit.length ? linesToFit : [""];
    for (let fontSize = preferredFontSize; fontSize >= 4; fontSize -= 1) {
      const maxChars = Math.max(6, Math.floor((noteWidth - 4) / (fontSize * 0.56)));
      const longestLineLength = Math.max(titleText.length, ...sourceLines.map((line) => line.length));
      const lineHeight = Math.max(fontSize * 0.95, fontSize - 0.2);
      const height = 6 + sourceLines.length * lineHeight + fontSize;
      if (longestLineLength <= maxChars && sourceLines.length <= 9 && height <= maxHeight) {
        return {
          lines: sourceLines,
          fontSize,
          lineHeight,
          height,
          width: noteWidth,
        };
      }
    }

    return {
      lines: sourceLines.slice(0, 9).map((line) => ellipsize(line, 22)),
      fontSize: 3.2,
      lineHeight: 3.3,
      height: Math.min(maxHeight, 6 + Math.min(sourceLines.length, 9) * 3.3 + 3.2),
      width: noteWidth,
    };
  }

  function ellipsize(text, maxChars) {
    const value = String(text || "");
    if (value.length <= maxChars) return value;
    return value.slice(0, Math.max(1, maxChars - 1)) + "\u2026";
  }

  function sampleYears(slot) {
    const baseBirth = 1952 - slot.generation * 28;
    const birthYearNumber = baseBirth + slot.index * 2;
    const deathYearNumber = birthYearNumber + 68 + ((slot.index + slot.generation) % 10);
    if (slot.generation <= 2) {
      return {
        birthYear: formatItalianFullDate(birthYearNumber, slot.index + slot.generation + 2),
        deathYear: formatItalianFullDate(deathYearNumber, slot.index + slot.generation + 9),
      };
    }
    return { birthYear: String(birthYearNumber), deathYear: String(deathYearNumber) };
  }

  function sampleMarriageDate(slot) {
    if (!(slot.generation > 0 && slot.generation < 5 && slot.path[slot.path.length - 1] === "mother")) return "";
    const childPath = slot.path.slice(0, -1);
    const childSlot = getSlot(childPath.length ? childPath.join("_") : "root");
    const childBirth = sampleYears(childSlot).birthYear;
    if (slot.generation <= 2) {
      const year = extractYear(childBirth) || String(1935 - slot.generation * 18 + slot.index);
      return formatItalianFullDate(Number(year) - 2, slot.index + slot.generation + 5);
    }
    const year = extractYear(childBirth) || String(1880 + slot.index * 2 + slot.generation);
    return year ? String(Number(year) - 2) : "";
  }

  function sampleChildrenNote(slot) {
    if (!(slot.generation > 0 && slot.generation < 5 && slot.path[slot.path.length - 1] === "mother")) {
      return "";
    }
    const childPath = slot.path.slice(0, -1);
    const childSlot = getSlot(childPath.length ? childPath.join("_") : "root");
    const childYears = sampleYears(childSlot);
    const count = demoChildCountForSlot(slot);
    if (count === 0) return "";
    const childBirthYear = extractYear(childYears.birthYear);
    const childBirth = childBirthYear ? Number(childBirthYear) : null;
    const children = [];
    for (let i = 0; i < count; i += 1) {
      if (i === 0) {
        children.push(
          slot.generation <= 3
            ? formatFullChildEntry(demoNameForSlot(childSlot), childYears.birthYear, childYears.deathYear)
            : formatCompactChildName(demoNameForSlot(childSlot), formatDates(childYears.birthYear, childYears.deathYear), count, i)
        );
      } else {
        const birthYear = childBirth == null ? null : childBirth - 4 + i * 3;
        const deathYear = birthYear == null ? null : birthYear + 70 + (i % 5);
        const birth = birthYear == null ? "" : (slot.generation <= 3 ? formatItalianFullDate(birthYear, slot.index + slot.generation + 20 + i * 2) : String(birthYear));
        const death = deathYear == null ? "" : (slot.generation <= 3 ? formatItalianFullDate(deathYear, slot.index + slot.generation + 35 + i * 2) : String(deathYear));
        const siblingName = i % 2 === 0 ? siblingNameForSlot(childSlot, "older") : siblingNameForSlot(childSlot, "younger");
        children.push(
          slot.generation <= 3
            ? formatFullChildEntry(siblingName, birth, death)
            : formatCompactChildName(siblingName, formatDates(birth, death), count, i)
        );
      }
    }
    return children.join("\n");
  }

  function demoChildCountForSlot(slot) {
    if (slot.generation === 1) return 1;
    if (slot.generation === 2) return slot.index === 3 ? 2 : 1;
    if (slot.generation === 3) {
      const counts = [1, 2, 2, 2];
      return counts[Math.floor(slot.index / 2)] || 1;
    }
    return slot.index % 10;
  }

  function sampleNoteForSlot(slot) {
    return "";
  }

  function demoNameForSlot(slot) {
    const maleNames = [
      "Alessandro",
      "Francescantonio",
      "Giandomenico",
      "Marcantonio",
      "Sebastiano",
      "Gianlorenzo",
      "Michelangelo",
      "Costantino",
      "Bartolomeo",
      "Salvatore",
      "Raffaele",
      "Domenicantonio",
      "Ferdinando",
      "Giovambattista",
      "Ludovico",
      "Pasqualino",
    ];
    const femaleNames = [
      "Mariacristina",
      "Annunziata",
      "Francescamaria",
      "Giuseppina",
      "Michelina",
      "Caterinella",
      "Alessandrina",
      "Vittoriana",
      "Serafina",
      "Domenica",
      "Mariangela",
      "Antonietta",
      "Eleonorina",
      "Beatricella",
      "Ludovica",
      "Rosalinda",
    ];
    const paternalSurnames = [
      "Bellandi-Castelluccio",
      "Bellandi-Castelluccio",
      "Bellandi-Castelluccio",
      "Sannazzaro-Farnesini",
      "Pietrantonio-Valentini",
      "Montemurro-Casalvecchio",
      "Zaccagnini-Boncompagni",
      "Campolongo-Serravalle",
    ];
    const maternalSurnames = [
      "Della Rovere-Malatesta",
      "Della Rovere-Malatesta",
      "Della Rovere-Malatesta",
      "Fioravanti-Bartolomei",
      "Brancaleoni-Sforzeschi",
      "Santamaria-Viscontelli",
      "Valguarnera-Monteleone",
      "Caracciolo-Raverdino",
    ];
    if (slot.id === "root") return "Eleonora Mariacristina Bellandi-Castelluccio";
    const last = slot.path[slot.path.length - 1];
    const firstNamePool = last === "father" ? maleNames : femaleNames;
    const firstName = firstNamePool[(slot.index + slot.generation * 3) % firstNamePool.length];
    const side = slot.path[0] === "father" ? paternalSurnames : maternalSurnames;
    const surname = side[Math.min(slot.generation, side.length - 1)];
    return `${firstName} ${surname}`;
  }

  function siblingNameForSlot(slot, offset) {
    const maleNames = ["Adriano", "Beniamino", "Daniele", "Federicantonio", "Ignazio", "Nicodemo", "Orazio", "Pierluigi"];
    const femaleNames = ["Adelina", "Beatrice", "Carlotta", "Dorotea", "Elisabetta", "Francesca", "Ginevra", "Ludovica"];
    const rootLastName = demoNameForSlot(slot).split(" ").slice(-1)[0];
    const pool = offset === "older" ? maleNames : femaleNames;
    const firstName = pool[(slot.index + slot.generation) % pool.length];
    return `${firstName} ${rootLastName}`;
  }

  function drawTitleBox(chartHeight) {
    const group = document.createElementNS(SVG_NS, "g");
    const x = 6;
    const y = chartHeight - 82;
    const width = 162;
    const height = 64;
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(height));
    rect.setAttribute("fill", "#fffdfa");
    rect.setAttribute("stroke", "#303030");
    rect.setAttribute("stroke-width", "1.15");
    group.appendChild(rect);

    const crestSize = 28;
    if (state.settings.titleBox.crestDataUrl) {
      const image = document.createElementNS(SVG_NS, "image");
      image.setAttribute("href", state.settings.titleBox.crestDataUrl);
      image.setAttribute("x", String(x + 6));
      image.setAttribute("y", String(y + 6));
      image.setAttribute("width", String(crestSize));
      image.setAttribute("height", String(crestSize));
      preserveAspect(image);
      group.appendChild(image);
    } else {
      const crestPlaceholder = document.createElementNS(SVG_NS, "rect");
      crestPlaceholder.setAttribute("x", String(x + 6));
      crestPlaceholder.setAttribute("y", String(y + 6));
      crestPlaceholder.setAttribute("width", String(crestSize));
      crestPlaceholder.setAttribute("height", String(crestSize));
      crestPlaceholder.setAttribute("fill", "none");
      crestPlaceholder.setAttribute("stroke", "#8f8779");
      crestPlaceholder.setAttribute("stroke-dasharray", "6 4");
      group.appendChild(crestPlaceholder);
    }

    const title = document.createElementNS(SVG_NS, "text");
    title.textContent = state.settings.titleBox.title || "Family Tree";
    title.setAttribute("x", String(x + 42));
    title.setAttribute("y", String(y + 16));
    applyTextStyle(title, getGenerationStyle(0).nameColor, 7.5, true);
    group.appendChild(title);

    const notes = compactLines(state.settings.titleBox.subtitle || "");
    notes.forEach((lineText, index) => {
      const text = document.createElementNS(SVG_NS, "text");
      text.textContent = lineText;
      text.setAttribute("x", String(x + 42));
      text.setAttribute("y", String(y + 32 + index * 9));
      applyTextStyle(text, "#000000", 4.8, false);
      group.appendChild(text);
    });

    return group;
  }

  function preserveAspect(imageNode) {
    imageNode.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }

  function extractYear(value) {
    const matches = sanitizeDateValue(value).match(/\b(?:1[5-9]\d{2}|20\d{2}|21\d{2})\b/g);
    return matches && matches.length ? matches[matches.length - 1] : "";
  }

  function formatDates(birthYear, deathYear) {
    const birth = extractYear(birthYear) || sanitizeDateValue(birthYear);
    const death = extractYear(deathYear) || sanitizeDateValue(deathYear);
    if (!birth && !death) return "";
    if (birth && death) return `(${birth}-${death})`;
    return `(${birth || death})`;
  }

  function displayName(name) {
    return sanitizeText(name);
  }

  function formatItalianFullDate(year, seed) {
    const months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
    const day = ((seed * 7) % 27) + 1;
    const month = months[(seed * 5) % months.length];
    return `${day} ${month} ${year}`;
  }

  function formatCompactChildName(fullName, dateText, totalCount, index) {
    const parts = sanitizeText(fullName).split(" ").filter(Boolean);
    const firstName = parts[0] || "";
    const fullLabel = dateText && totalCount <= 2 ? `${fullName} ${dateText}` : fullName;
    if (totalCount <= 2) return fullLabel;
    if (totalCount <= 4) return firstName;
    return index === 0 && dateText ? `${firstName} ${dateText}` : firstName;
  }

  function formatFullChildEntry(fullName, birthText, deathText) {
    const name = sanitizeText(fullName);
    const birth = sanitizeDateValue(birthText);
    const death = sanitizeDateValue(deathText);
    if (birth && death) return `${name} (${birth} - ${death})`;
    if (birth || death) return `${name} (${birth || death})`;
    return name;
  }

  function wrapText(text, maxChars) {
    const words = String(text || "")
      .split(/\s+/)
      .filter(Boolean)
      .flatMap((word) => splitLongToken(word, maxChars));
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

  function splitLongToken(token, maxChars) {
    const clean = String(token || "");
    if (!clean || clean.length <= maxChars) return [clean];
    if (!clean.includes("-")) return [clean];
    const parts = clean.split(/(?<=-)/).filter(Boolean);
    const chunks = [];
    for (const part of parts) {
      if (part.length <= maxChars) {
        chunks.push(part);
        continue;
      }
      for (let index = 0; index < part.length; index += maxChars) {
        chunks.push(part.slice(index, index + maxChars));
      }
    }
    return chunks;
  }

  function generationLabel(generation) {
    if (generation === 0) return "Generation 0 - Original Person";
    if (generation === 1) return "Generation 1 - Parents";
    if (generation === 2) return "Generation 2 - Grandparents";
    if (generation === 3) return "Generation 3 - Great-Grandparents";
    return `Generation ${generation} - ${generation - 2}x Great-Grandparents`;
  }

  function getSlot(id) {
    return SLOT_DEFINITIONS.find((slot) => slot.id === id);
  }

  function getSlotByGenerationIndex(generation, index) {
    return SLOT_DEFINITIONS.find((slot) => slot.generation === generation && slot.index === index);
  }

  function buildSlotDefinitions(maxGeneration) {
    const slots = [];
    for (let generation = 0; generation <= maxGeneration; generation += 1) {
      const count = 2 ** generation;
      for (let index = 0; index < count; index += 1) {
        const path = generation === 0 ? [] : indexToPath(generation, index);
        const id = path.length ? path.join("_") : "root";
        const label = relationLabel(path);
        const childPath = path.slice(0, -1);
        const childLabel = relationLabel(childPath);
        slots.push({
          id,
          generation,
          index,
          path,
          label,
          placeholderName: label,
          childrenPlaceholder: generation > 0 && path[path.length - 1] === "mother" ? childLabel : "",
        });
      }
    }
    return slots;
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

  function serializeYaml(data) {
    const lines = [];
    lines.push("settings:");
    lines.push(`  fontFamily: ${quoteYaml(data.settings.fontFamily)}`);
    lines.push(`  fauxBold: ${data.settings.fauxBold ? "true" : "false"}`);
    lines.push("  generationStyles:");
    data.settings.generationStyles.forEach((style, generation) => {
      lines.push(`    generation${generation}:`);
      lines.push(`      nameSize: ${style.nameSize}`);
      lines.push(`      nameColor: ${quoteYaml(normalizeColor(style.nameColor))}`);
      lines.push(`      dateSize: ${style.dateSize}`);
      lines.push(`      dateColor: ${quoteYaml(normalizeColor(style.dateColor))}`);
      lines.push(`      childrenSize: ${style.childrenSize}`);
      lines.push(`      childrenColor: ${quoteYaml(normalizeColor(style.childrenColor))}`);
    });
    lines.push("  titleBox:");
    lines.push(`    enabled: ${data.settings.titleBox.enabled ? "true" : "false"}`);
    lines.push(`    title: ${quoteYaml(data.settings.titleBox.title || "")}`);
    lines.push(`    subtitle: ${quoteYaml(data.settings.titleBox.subtitle || "")}`);
    if (data.settings.titleBox.crestDataUrl) {
      lines.push(`    crestDataUrl: ${quoteYaml(data.settings.titleBox.crestDataUrl)}`);
    }
    lines.push("  datePrefixes:");
    data.settings.datePrefixes.forEach((prefixes, generation) => {
      lines.push(`    generation${generation}:`);
      lines.push(`      birth: ${quoteYaml(prefixes.birth || "")}`);
      lines.push(`      death: ${quoteYaml(prefixes.death || "")}`);
      lines.push(`      marriage: ${quoteYaml(prefixes.marriage || "")}`);
    });
    lines.push("rootPersonId: root");
    lines.push("people:");
    for (const slot of SLOT_DEFINITIONS) {
      const person = data.people[slot.id] || {};
      lines.push(`  ${slot.id}:`);
      lines.push(`    name: ${quoteYaml(person.name || "")}`);
      lines.push(`    birth: ${quoteYaml(person.birthYear || "")}`);
      lines.push(`    death: ${quoteYaml(person.deathYear || "")}`);
      if (person.marriageDate) {
        lines.push(`    marriageDate: ${quoteYaml(person.marriageDate)}`);
      }
      if (person.childrenNote) {
        lines.push(`    childrenNote: ${quoteYaml(person.childrenNote)}`);
      }
      if (person.note) {
        lines.push(`    note: ${quoteYaml(person.note)}`);
      }
      if (person.nameSizeOverride != null) {
        lines.push(`    nameSizeOverride: ${person.nameSizeOverride}`);
      }
      if (person.nameColorOverride) {
        lines.push(`    nameColorOverride: ${quoteYaml(person.nameColorOverride)}`);
      }
      if (person.dateSizeOverride != null) {
        lines.push(`    dateSizeOverride: ${person.dateSizeOverride}`);
      }
      if (person.dateColorOverride) {
        lines.push(`    dateColorOverride: ${quoteYaml(person.dateColorOverride)}`);
      }
    }
    return lines.join("\n");
  }

  function quoteYaml(value) {
    const text = String(value ?? "");
    return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  }

  function parseYaml(text) {
    const lines = String(text)
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .filter((line) => !/^\s*#/.test(line));
    const { value } = parseBlock(lines, 0, 0);
    return value;
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

  function makePaperFilter() {
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", "paper-grain");
    filter.setAttribute("x", "0");
    filter.setAttribute("y", "0");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "100%");

    const turbulence = document.createElementNS(SVG_NS, "feTurbulence");
    turbulence.setAttribute("type", "fractalNoise");
    turbulence.setAttribute("baseFrequency", "0.8");
    turbulence.setAttribute("numOctaves", "2");
    turbulence.setAttribute("stitchTiles", "stitch");
    turbulence.setAttribute("result", "noise");
    filter.appendChild(turbulence);

    const matrix = document.createElementNS(SVG_NS, "feColorMatrix");
    matrix.setAttribute("type", "matrix");
    matrix.setAttribute("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.03 0");
    matrix.setAttribute("in", "noise");
    matrix.setAttribute("result", "grain");
    filter.appendChild(matrix);

    const blend = document.createElementNS(SVG_NS, "feBlend");
    blend.setAttribute("mode", "multiply");
    blend.setAttribute("in", "SourceGraphic");
    blend.setAttribute("in2", "grain");
    filter.appendChild(blend);
    return filter;
  }

  init();
})();
