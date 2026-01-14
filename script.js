const svg = d3.select("#viz");
const tooltip = d3.select("#tooltip");
const legend = d3.select("#legend");
const controls = d3.select("#controls");
const vizWrap = d3.select("#viz-wrap");
const playBtn = d3.select("#play");
const slider = d3.select("#year-slider");
const yearLabel = d3.select("#year-label");
const mapSvg = d3.select("#map");
const mapLegend = d3.select("#map-legend");
const mapMetricSelect = d3.select("#map-metric");
const mapYearSelect = d3.select("#map-year");
const lineSvg = d3.select("#line-chart");
const lineLegend = d3.select("#line-legend");
const lineButtons = d3.selectAll(".chip[data-metric]");
const corrPanel = d3.select("#corr-panel");
const corrList = d3.select("#corr-list");
const focusToggles = d3.select("#focus-toggles");
const focusNegBtn = d3.select("#btn-focus-neg");
const focusPosBtn = d3.select("#btn-focus-pos");

const state = {
  mode: "scan",
  xMetric: "val_openness",
  year: null,
  playing: false,
  timer: null,
  mapYear: null,
  mapMetric: "trust",
  lineMetric: "corr_open_lr"
};

const colorMap = {
  Nordic: "#1f77b4",
  Western: "#2ca02c",
  Mediterranean: "#ff7f0e",
  Eastern: "#9467bd",
  Other: "#7f7f7f"
};

const metricLabels = {
  trust: "Confiança",
  vote_rate: "Participació",
  lr: "Eix polític",
  openness: "Obertura",
  corr_open_lr: "Correlació obertura-eix"
};

const variableMeta = [
  { key: "ipcrtiv", label: "Creativitat (PVQ)", domain: [1, 6] },
  { key: "impfree", label: "Llibertat personal (PVQ)", domain: [1, 6] },
  { key: "ipshabt", label: "Comportament adequat (PVQ)", domain: [1, 6] },
  { key: "ipsuces", label: "Èxit personal (PVQ)", domain: [1, 6] },
  { key: "impsafe", label: "Seguretat (PVQ)", domain: [1, 6] },
  { key: "ipstrgv", label: "Poder (PVQ)", domain: [1, 6] },
  { key: "ipgdtim", label: "Diversió (PVQ)", domain: [1, 6] },
  { key: "ipudrst", label: "Comprensió dels altres (PVQ)", domain: [1, 6] },
  { key: "ipeqopt", label: "Igualtat (PVQ)", domain: [1, 6] },
  { key: "iphlppl", label: "Ajudar els altres (PVQ)", domain: [1, 6] },
  { key: "iplylfr", label: "Lleialtat (PVQ)", domain: [1, 6] },
  { key: "ipadvnt", label: "Aventura (PVQ)", domain: [1, 6] },
  { key: "ipbhprp", label: "Humilitat (PVQ)", domain: [1, 6] },
  { key: "ipmodst", label: "Tradició (PVQ)", domain: [1, 6] },
  { key: "ipfrule", label: "Respecte per les normes (PVQ)", domain: [1, 6] },
  { key: "val_self_direction", label: "Autodirecció (índex)", domain: [1, 6] },
  { key: "val_stimulation", label: "Estimulació (índex)", domain: [1, 6] },
  { key: "val_hedonism", label: "Hedonisme (índex)", domain: [1, 6] },
  { key: "val_power", label: "Poder (índex)", domain: [1, 6] },
  { key: "val_security", label: "Seguretat (índex)", domain: [1, 6] },
  { key: "val_universalism", label: "Universalisme (índex)", domain: [1, 6] },
  { key: "val_benevolence", label: "Benevolència (índex)", domain: [1, 6] },
  { key: "val_conservation", label: "Conservació (índex)", domain: [1, 6] },
  { key: "val_openness", label: "Obertura al canvi (índex)", domain: [1, 6] },
  { key: "val_self_transc", label: "Autotranscendència (índex)", domain: [1, 6] },
  { key: "val_self_enh", label: "Autopromoció (índex)", domain: [1, 6] },
  { key: "trstprl", label: "Confiança al parlament", domain: [0, 10] },
  { key: "trstplt", label: "Confiança en polítics", domain: [0, 10] },
  { key: "trstprt", label: "Confiança en partits", domain: [0, 10] },
  { key: "stfgov", label: "Satisfacció amb el govern", domain: [0, 10] },
  { key: "vote_rate", label: "Participació electoral", domain: [0, 1] },
  { key: "trust", label: "Confiança política (mitjana)", domain: [0, 10] },
  { key: "openness", label: "Obertura al canvi", domain: [1, 6] },
  { key: "conservation", label: "Conservació", domain: [1, 6] },
  { key: "self_transc", label: "Autotranscendència", domain: [1, 6] },
  { key: "self_enh", label: "Autopromoció", domain: [1, 6] }
];

const variableByKey = new Map(variableMeta.map(d => [d.key, d]));

function labelForKey(key) {
  const meta = variableByKey.get(key);
  return meta ? meta.label : (metricLabels[key] || key);
}

function domainForKey(key) {
  const meta = variableByKey.get(key);
  return meta && meta.domain ? meta.domain : null;
}

const correlationKeys = [
  "ipcrtiv", "impfree", "ipshabt", "ipsuces", "impsafe", "ipstrgv", "ipgdtim", "ipudrst",
  "ipeqopt", "iphlppl", "iplylfr", "ipadvnt", "ipbhprp", "ipmodst", "ipfrule",
  "val_self_direction", "val_stimulation", "val_hedonism", "val_power", "val_security",
  "val_universalism", "val_benevolence", "val_conservation", "val_openness",
  "val_self_transc", "val_self_enh",
  "trstprl", "trstplt", "trstprt", "stfgov", "trust", "vote_rate"
];

const margin = { top: 40, right: 24, bottom: 50, left: 60 };
let width = 900;
let height = 520;

const mapMargin = { top: 10, right: 10, bottom: 10, left: 10 };
let mapWidth = 600;
let mapHeight = 380;

const lineMargin = { top: 20, right: 20, bottom: 40, left: 50 };
let lineWidth = 600;
let lineHeight = 380;

const gRoot = svg.append("g");
const gAxisX = gRoot.append("g").attr("class", "x-axis");
const gAxisY = gRoot.append("g").attr("class", "y-axis");
const gBubbles = gRoot.append("g").attr("class", "bubbles");
const gLabels = gRoot.append("g").attr("class", "labels");
const gAnno = gRoot.append("g").attr("class", "annotations");
const gTrend = gRoot.append("g").attr("class", "trend");

const xScale = d3.scaleLinear();
const yScale = d3.scaleLinear();
const rScale = d3.scaleSqrt();

const mapG = mapSvg.append("g");
const lineG = lineSvg.append("g");
const lineAxisX = lineG.append("g").attr("class", "line-x");
const lineAxisY = lineG.append("g").attr("class", "line-y");
const lineLines = lineG.append("g").attr("class", "line-series");

let data = [];
let dataByYear;
let years = [];
let bubbleYears = [];
let lineDataByMetric = {};
let europeGeo = window.EUROPE_GEO || null;
let corrResults = [];
let storyFocus = { topPositive: null, topNegative: null, topAbs: null };

function showMessage(text) {
  let message = d3.select("#viz-message");
  if (message.empty()) {
    message = vizWrap.append("div").attr("id", "viz-message");
  }
  message.text(text);
}

function hideMessage() {
  d3.select("#viz-message").remove();
}

function normalizeData(rows) {
  const numericKeys = [
    "essyear", "n", "lr", "vote_rate", "trust",
    "openness", "conservation", "self_transc", "self_enh",
    ...correlationKeys
  ];

  const cleaned = rows.map(d => {
    const out = {
      country_name: d.country_name,
      cntry: d.cntry,
      iso3: d.iso3,
      macro_region: d.macro_region || "Other"
    };
    numericKeys.forEach(key => {
      if (d[key] !== undefined && d[key] !== null && d[key] !== "") {
        out[key] = +d[key];
      }
    });
    return out;
  });

  return cleaned.filter(d =>
    Number.isFinite(d.lr) &&
    Number.isFinite(d.vote_rate)
  );
}

function setStats() {
  const countries = new Set(data.map(d => d.country_name)).size;
  const rows = data.length;
  d3.select("#stat-countries").text(countries);
  d3.select("#stat-years").text(years.length);
  d3.select("#stat-rows").text(rows);
}

function setDimensions() {
  const wrap = document.getElementById("viz-wrap");
  width = wrap.clientWidth;
  height = window.innerWidth < 980 ? 460 : 520;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  gAxisX.attr("transform", `translate(0, ${height - margin.bottom})`);
  gAxisY.attr("transform", `translate(${margin.left}, 0)`);
}

function setMapDimensions() {
  if (mapSvg.empty()) return;
  const box = mapSvg.node().parentElement.getBoundingClientRect();
  mapWidth = box.width;
  mapHeight = window.innerWidth < 980 ? 320 : 380;
  mapSvg.attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`);
}

function setLineDimensions() {
  if (lineSvg.empty()) return;
  const box = lineSvg.node().parentElement.getBoundingClientRect();
  lineWidth = box.width;
  lineHeight = window.innerWidth < 980 ? 320 : 380;
  lineSvg.attr("viewBox", `0 0 ${lineWidth} ${lineHeight}`);

  lineAxisX.attr("transform", `translate(0, ${lineHeight - lineMargin.bottom})`);
  lineAxisY.attr("transform", `translate(${lineMargin.left}, 0)`);
}

function updateScales() {
  xScale
    .domain([0, 10])
    .range([margin.left, width - margin.right]);

  const fixedDomain = domainForKey(state.xMetric);
  let yDomain;
  if (fixedDomain) {
    const pad = (fixedDomain[1] - fixedDomain[0]) * 0.08;
    yDomain = [fixedDomain[0] - pad, fixedDomain[1] + pad];
  } else {
    const yExtent = d3.extent(data, d => d[state.xMetric]);
    if (!Number.isFinite(yExtent[0]) || !Number.isFinite(yExtent[1])) return;
    const yPad = (yExtent[1] - yExtent[0]) * 0.1 || 0.5;
    yDomain = [yExtent[0] - yPad, yExtent[1] + yPad];
  }
  yScale
    .domain(yDomain)
    .nice()
    .range([height - margin.bottom, margin.top]);

  rScale
    .domain(d3.extent(data, d => d.vote_rate))
    .range([6, 46]);
}

function pearsonCorr(values, xKey, yKey) {
  const valid = values.filter(d => Number.isFinite(d[xKey]) && Number.isFinite(d[yKey]));
  if (valid.length < 3) return NaN;
  const meanX = d3.mean(valid, d => d[xKey]);
  const meanY = d3.mean(valid, d => d[yKey]);
  const num = d3.sum(valid, d => (d[xKey] - meanX) * (d[yKey] - meanY));
  const denX = d3.sum(valid, d => (d[xKey] - meanX) ** 2);
  const denY = d3.sum(valid, d => (d[yKey] - meanY) ** 2);
  if (!denX || !denY) return NaN;
  return num / Math.sqrt(denX * denY);
}

function linearFit(values, xKey, yKey) {
  const valid = values.filter(d => Number.isFinite(d[xKey]) && Number.isFinite(d[yKey]));
  if (valid.length < 3) return null;
  const xMean = d3.mean(valid, d => d[xKey]);
  const yMean = d3.mean(valid, d => d[yKey]);
  const num = d3.sum(valid, d => (d[xKey] - xMean) * (d[yKey] - yMean));
  const denX = d3.sum(valid, d => (d[xKey] - xMean) ** 2);
  const denY = d3.sum(valid, d => (d[yKey] - yMean) ** 2);
  if (!denX || !denY) return null;

  const slope = num / denX;
  const intercept = yMean - slope * xMean;
  const r = num / Math.sqrt(denX * denY);
  return { slope, intercept, r, n: valid.length };
}

function correlationResultsForRows(rows) {
  return correlationKeys
    .map(key => {
      const valid = rows.filter(d => Number.isFinite(d.lr) && Number.isFinite(d[key]));
      if (valid.length < 8) return null;
      const r = pearsonCorr(valid, "lr", key);
      if (!Number.isFinite(r)) return null;
      return { key, label: labelForKey(key), r, n: valid.length };
    })
    .filter(Boolean);
}

function pickStoryYear() {
  if (!years.length) return null;
  const minCount = 18;

  for (let i = years.length - 1; i >= 0; i -= 1) {
    const year = years[i];
    const rows = dataByYear.get(year) || [];
    const results = correlationResultsForRows(rows);
    const hasPos = results.some(d => d.r > 0);
    const hasNeg = results.some(d => d.r < 0);
    if (results.length >= minCount && hasPos && hasNeg) return year;
  }

  let bestYear = years[years.length - 1];
  let bestCount = -1;
  years.forEach(year => {
    const rows = dataByYear.get(year) || [];
    const count = correlationResultsForRows(rows).length;
    if (count > bestCount) {
      bestCount = count;
      bestYear = year;
    }
  });
  return bestYear;
}

function computeCorrelations() {
  const base = (dataByYear && Number.isFinite(state.year))
    ? (dataByYear.get(state.year) || [])
    : data;

  const results = correlationResultsForRows(base);

  storyFocus = { topPositive: null, topNegative: null, topAbs: null };
  corrResults = [];

  if (!results.length) return;
  const focusCandidates = results.filter(d => d.key !== "vote_rate");
  const focusPool = focusCandidates.length ? focusCandidates : results;
  storyFocus.topPositive = [...focusPool].sort((a, b) => d3.descending(a.r, b.r))[0];
  storyFocus.topNegative = [...focusPool].sort((a, b) => d3.ascending(a.r, b.r))[0];
  storyFocus.topAbs = [...focusPool].sort((a, b) => d3.descending(Math.abs(a.r), Math.abs(b.r)))[0];

  corrResults = [...results].sort((a, b) => d3.descending(Math.abs(a.r), Math.abs(b.r)));
}

function formatCorr(value) {
  if (!Number.isFinite(value)) return "NA";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function renderCorrPanel() {
  if (corrPanel.empty() || corrList.empty()) return;
  if (!corrResults.length) {
    corrList.html(`<div class="corr-hint">No hi ha prou dades per calcular correlacions.</div>`);
    return;
  }

  const headerTitle = corrPanel.select(".corr-title");
  if (!headerTitle.empty()) {
    const yearText = Number.isFinite(state.year) ? ` · Any ESS: ${state.year}` : "";
    headerTitle.text(`Correlació (r) amb l'eix polític${yearText}`);
  }
  const headerHint = corrPanel.select(".corr-hint");
  if (!headerHint.empty()) {
    headerHint.text("Ordenat per |r| · Clica una variable per veure les bombolles");
  }

  const rows = corrList.selectAll("button.corr-row").data(corrResults, d => d.key);
  const enter = rows.enter()
    .append("button")
    .attr("type", "button")
    .attr("class", "corr-row")
    .attr("role", "listitem");

  enter.append("span").attr("class", "corr-name");
  const bar = enter.append("div").attr("class", "corr-bar");
  bar.append("span").attr("class", "corr-zero");
  bar.append("span").attr("class", "corr-fill");
  enter.append("span").attr("class", "corr-r");

  const merged = enter.merge(rows);
  merged.select(".corr-name").text(d => d.label);
  merged.select(".corr-r").text(d => formatCorr(d.r));

  merged.select(".corr-fill")
    .attr("class", d => `corr-fill ${d.r >= 0 ? "pos" : "neg"}`)
    .style("width", d => `${Math.min(1, Math.abs(d.r)) * 50}%`)
    .style("left", d => {
      const w = Math.min(1, Math.abs(d.r)) * 50;
      return `${d.r >= 0 ? 50 : 50 - w}%`;
    });

  merged.classed("is-selected", d => d.key === state.xMetric);
  merged.attr("aria-label", d => `${d.label}, r = ${formatCorr(d.r)}`);

  merged.on("click", (event, d) => {
    const prevYear = state.year;
    state.xMetric = d.key;
    if (updateBubbleYears()) {
      if (state.year !== prevYear) {
        computeCorrelations();
        updateStoryText();
      }
      updateChart();
      d3.select("#viz-subtitle").text(`Eix X: eix polític · Eix Y: ${labelForKey(state.xMetric)}`);
      renderCorrPanel();
    } else {
      renderCorrPanel();
    }
  });

  rows.exit().remove();
  merged.order();
}

function setTextIfPresent(id, text) {
  const sel = d3.select(`#${id}`);
  if (!sel.empty()) sel.text(text);
}

function updateStoryText() {
  if (!corrResults.length || !storyFocus.topPositive || !storyFocus.topNegative) return;

  const neg = storyFocus.topNegative;
  const pos = storyFocus.topPositive;
  const abs = storyFocus.topAbs || neg;

  setTextIfPresent("focus-neg", `${neg.label} (r = ${formatCorr(neg.r)})`);
  setTextIfPresent("focus-pos", `${pos.label} (r = ${formatCorr(pos.r)})`);
  setTextIfPresent("focus-neg-name", neg.label);
  setTextIfPresent("focus-pos-name", pos.label);
  setTextIfPresent("focus-abs-name", abs.label);
  setTextIfPresent("insight-neg", `${neg.label} (r = ${formatCorr(neg.r)})`);
  setTextIfPresent("insight-pos", `${pos.label} (r = ${formatCorr(pos.r)})`);

  if (!focusNegBtn.empty()) {
    focusNegBtn.attr("title", neg.label);
    focusNegBtn.attr("aria-label", `Veure variable negativa: ${neg.label}`);
  }
  if (!focusPosBtn.empty()) {
    focusPosBtn.attr("title", pos.label);
    focusPosBtn.attr("aria-label", `Veure variable positiva: ${pos.label}`);
  }

  const topNeg = [...corrResults]
    .sort((a, b) => d3.ascending(a.r, b.r))
    .slice(0, 3)
    .map(d => `${d.label} (${formatCorr(d.r)})`)
    .join(", ");

  const topPos = [...corrResults]
    .sort((a, b) => d3.descending(a.r, b.r))
    .slice(0, 3)
    .map(d => `${d.label} (${formatCorr(d.r)})`)
    .join(", ");

  setTextIfPresent("corr-neg-list", topNeg || "—");
  setTextIfPresent("corr-pos-list", topPos || "—");
}

function updateFocusToggles() {
  if (focusToggles.empty()) return;
  const negKey = storyFocus.topNegative ? storyFocus.topNegative.key : null;
  const posKey = storyFocus.topPositive ? storyFocus.topPositive.key : null;
  focusNegBtn.classed("active", !!negKey && state.xMetric === negKey);
  focusPosBtn.classed("active", !!posKey && state.xMetric === posKey);
}

function setupFocusToggles() {
  if (focusNegBtn.empty() || focusPosBtn.empty()) return;

  focusNegBtn.on("click", () => {
    if (!storyFocus.topNegative) return;
    state.xMetric = storyFocus.topNegative.key;
    if (updateBubbleYears()) {
      updateChart();
      d3.select("#viz-subtitle").text(`Eix X: eix polític · Eix Y: ${labelForKey(state.xMetric)}`);
      updateFocusToggles();
    }
  });

  focusPosBtn.on("click", () => {
    if (!storyFocus.topPositive) return;
    state.xMetric = storyFocus.topPositive.key;
    if (updateBubbleYears()) {
      updateChart();
      d3.select("#viz-subtitle").text(`Eix X: eix polític · Eix Y: ${labelForKey(state.xMetric)}`);
      updateFocusToggles();
    }
  });
}

function buildLineData() {
  const metrics = ["trust", "openness", "vote_rate", "lr", "corr_open_lr"];
  lineDataByMetric = {};

  metrics.forEach(metric => {
    let roll;
    if (metric === "corr_open_lr") {
      roll = d3.rollup(
        data,
        v => pearsonCorr(v, "openness", "lr"),
        d => d.macro_region,
        d => d.essyear
      );
    } else {
      roll = d3.rollup(
        data,
        v => {
          const valid = v.filter(d => Number.isFinite(d[metric]));
          const total = d3.sum(valid, d => d.n);
          const weighted = d3.sum(valid, d => d[metric] * d.n);
          return total ? weighted / total : d3.mean(valid, d => d[metric]);
        },
        d => d.macro_region,
        d => d.essyear
      );
    }

    lineDataByMetric[metric] = Array.from(roll, ([region, yearMap]) => ({
      region,
      values: Array.from(yearMap, ([year, value]) => ({ year: +year, value }))
        .filter(d => Number.isFinite(d.value))
        .sort((a, b) => a.year - b.year)
    }));
  });
}

function updateAxes() {
  gAxisX.call(d3.axisBottom(xScale).ticks(6));
  gAxisY.call(d3.axisLeft(yScale).ticks(5));

  const xLabel = "Eix polític (esquerra-dreta)";

  gAxisX.selectAll(".axis-label").data([xLabel])
    .join("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height - 8)
    .attr("text-anchor", "middle")
    .attr("fill", "#54657a")
    .text(d => d);

  const yLabel = labelForKey(state.xMetric) || "Valor";
  gAxisY.selectAll(".axis-label").data([yLabel])
    .join("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .attr("fill", "#54657a")
    .text(d => d);
}

function targetX(d) {
  return xScale(d.lr);
}

function targetY(d) {
  return yScale(d[state.xMetric]);
}

const simulation = d3.forceSimulation()
  .force("x", d3.forceX(d => targetX(d)).strength(0.8))
  .force("y", d3.forceY(d => targetY(d)).strength(0.8))
  .force("collide", d3.forceCollide(d => rScale(d.vote_rate) + 1.5))
  .stop();

function layoutNodes(nodes) {
  simulation.nodes(nodes);
  simulation.force("x", d3.forceX(d => targetX(d)).strength(0.8));
  simulation.force("y", d3.forceY(d => targetY(d)).strength(0.8));
  simulation.force("collide", d3.forceCollide(d => rScale(d.vote_rate) + 1.5));
  simulation.alpha(0.9);
  for (let i = 0; i < 140; i += 1) simulation.tick();
  simulation.stop();

  nodes.forEach(d => {
    const r = rScale(d.vote_rate);
    d.x = Math.max(margin.left + r, Math.min(width - margin.right - r, d.x));
    d.y = Math.max(margin.top + r, Math.min(height - margin.bottom - r, d.y));
  });
}

function updateLegend() {
  const items = legend.selectAll(".legend-item").data(Object.keys(colorMap));
  const enter = items.enter().append("div").attr("class", "legend-item");
  enter.append("span").attr("class", "legend-swatch");
  enter.append("span").attr("class", "legend-label");

  const merged = enter.merge(items);
  merged.select(".legend-swatch").style("background", d => colorMap[d]);
  merged.select(".legend-label").text(d => d);
  items.exit().remove();
}

function updateMap() {
  if (!europeGeo || mapSvg.empty()) return;
  const yearData = dataByYear.get(state.mapYear) || [];
  if (!yearData.length) return;

  const metric = state.mapMetric;
  const metricLabel = metricLabels[metric] || metric;
  const valueByIso = new Map(yearData.map(d => [d.iso3, d[metric]]));
  const nameByIso = new Map(yearData.map(d => [d.iso3, d.country_name]));
  const regionByIso = new Map(yearData.map(d => [d.iso3, d.macro_region]));
  const extent = d3.extent(yearData, d => d[metric]);
  if (!Number.isFinite(extent[0]) || !Number.isFinite(extent[1])) return;

  const interpolator = metric === "vote_rate"
    ? d3.interpolateOranges
    : metric === "lr"
      ? d3.interpolatePuBuGn
      : d3.interpolateBlues;

  const color = d3.scaleSequential(interpolator).domain(extent);

  const projection = d3.geoMercator().fitSize(
    [mapWidth - mapMargin.left - mapMargin.right, mapHeight - mapMargin.top - mapMargin.bottom],
    europeGeo
  );
  const path = d3.geoPath(projection);
  mapG.attr("transform", `translate(${mapMargin.left}, ${mapMargin.top})`);

  mapG.selectAll("path")
    .data(europeGeo.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
      const iso = d.properties["ISO3166-1-Alpha-3"];
      const value = valueByIso.get(iso);
      return Number.isFinite(value) ? color(value) : "#e5e7eb";
    })
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.6)
    .on("mousemove", (event, d) => {
      const iso = d.properties["ISO3166-1-Alpha-3"];
      const value = valueByIso.get(iso);
      const name = nameByIso.get(iso) || d.properties.name;
      const region = regionByIso.get(iso) || "Other";
	      tooltip
	        .style("opacity", 1)
	        .style("left", `${event.clientX + 12}px`)
	        .style("top", `${event.clientY + 12}px`)
	        .html(`
	          <strong>${name}</strong><br>
	          Any: ${state.mapYear}<br>
	          Macroregió: ${region}<br>
	          Mètrica: ${metricLabel}<br>
	          Valor: ${Number.isFinite(value) ? (metric === "vote_rate" ? `${(value * 100).toFixed(1)}%` : value.toFixed(2)) : "NA"}
	        `);
	    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  const minLabel = metric === "vote_rate" ? `${(extent[0] * 100).toFixed(0)}%` : extent[0].toFixed(2);
  const maxLabel = metric === "vote_rate" ? `${(extent[1] * 100).toFixed(0)}%` : extent[1].toFixed(2);
  mapLegend.html(`
    <div class="legend-bar" style="background: linear-gradient(90deg, ${interpolator(0.1)}, ${interpolator(0.95)});"></div>
    <div class="legend-labels">
      <span>${minLabel}</span>
      <span>${maxLabel}</span>
    </div>
  `);
}

function updateLineChart() {
  if (lineSvg.empty()) return;
  const metric = state.lineMetric;
  const series = lineDataByMetric[metric] || [];
  const values = series.flatMap(s => s.values.map(v => v.value));
  if (!values.length) return;

  const yearsAll = Array.from(new Set(series.flatMap(s => s.values.map(v => v.year)))).sort(d3.ascending);
  const xScaleLine = d3.scaleLinear()
    .domain(d3.extent(yearsAll))
    .range([lineMargin.left, lineWidth - lineMargin.right]);

  const yScaleLine = d3.scaleLinear()
    .range([lineHeight - lineMargin.bottom, lineMargin.top]);
  if (metric === "corr_open_lr") {
    yScaleLine.domain([-1, 1]);
  } else {
    const yExtent = d3.extent(values);
    const yPad = (yExtent[1] - yExtent[0]) * 0.1 || 0.3;
    yScaleLine.domain([yExtent[0] - yPad, yExtent[1] + yPad]);
  }

  lineAxisX.call(d3.axisBottom(xScaleLine).ticks(6).tickFormat(d3.format("d")));
  lineAxisY.call(d3.axisLeft(yScaleLine).ticks(5));

  const zeroLine = lineG.selectAll(".zero-line").data(metric === "corr_open_lr" ? [0] : []);
  zeroLine.join("line")
    .attr("class", "zero-line")
    .attr("x1", lineMargin.left)
    .attr("x2", lineWidth - lineMargin.right)
    .attr("y1", d => yScaleLine(d))
    .attr("y2", d => yScaleLine(d))
    .attr("stroke", "#94a3b8")
    .attr("stroke-dasharray", "4 4")
    .attr("stroke-width", 1);

  lineG.selectAll(".line-axis-label").data([metricLabels[metric] || metric])
    .join("text")
    .attr("class", "line-axis-label")
    .attr("x", -lineHeight / 2)
    .attr("y", 16)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("fill", "#54657a")
    .text(d => d);

  lineG.selectAll(".line-axis-label-x").data(["Any"])
    .join("text")
    .attr("class", "line-axis-label-x")
    .attr("x", lineWidth / 2)
    .attr("y", lineHeight - 6)
    .attr("text-anchor", "middle")
    .attr("fill", "#54657a")
    .text(d => d);

  const line = d3.line()
    .x(d => xScaleLine(d.year))
    .y(d => yScaleLine(d.value))
    .curve(d3.curveMonotoneX);

  const lines = lineLines.selectAll("path").data(series, d => d.region);
  lines.enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke-width", 2.2)
    .merge(lines)
    .attr("stroke", d => colorMap[d.region] || "#999")
    .attr("d", d => line(d.values));
  lines.exit().remove();

  const dots = lineLines.selectAll("circle").data(
    series.flatMap(s => s.values.map(v => ({ ...v, region: s.region }))),
    d => `${d.region}-${d.year}`
  );

  dots.enter()
    .append("circle")
    .attr("r", 2.5)
    .merge(dots)
    .attr("cx", d => xScaleLine(d.year))
    .attr("cy", d => yScaleLine(d.value))
    .attr("fill", d => colorMap[d.region] || "#999")
    .on("mousemove", (event, d) => {
      const formatted = metric === "vote_rate"
        ? `${(d.value * 100).toFixed(1)}%`
        : metric === "corr_open_lr"
          ? `r = ${d.value.toFixed(2)}`
          : d.value.toFixed(2);
      tooltip
        .style("opacity", 1)
        .style("left", `${event.clientX + 12}px`)
        .style("top", `${event.clientY + 12}px`)
        .html(`
          <strong>${d.region}</strong><br>
          Any: ${d.year}<br>
          Valor: ${formatted}
        `);
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  dots.exit().remove();

  const items = lineLegend.selectAll(".legend-item").data(Object.keys(colorMap));
  const enter = items.enter().append("div").attr("class", "legend-item");
  enter.append("span").attr("class", "legend-swatch");
  enter.append("span").attr("class", "legend-label");
  const merged = enter.merge(items);
  merged.select(".legend-swatch").style("background", d => colorMap[d]);
  merged.select(".legend-label").text(d => d);
  items.exit().remove();
}

function updateAnnotations(nodes) {
  gAnno.selectAll("text").remove();
  if (state.mode !== "conclusion") return;

  const xKey = "lr";
  const yKey = state.xMetric;
  const fit = linearFit(nodes, xKey, yKey);
  if (!fit) return;

  const scored = nodes
    .filter(d => Number.isFinite(d[xKey]) && Number.isFinite(d[yKey]))
    .map(d => ({
      name: d.country_name,
      residual: d[yKey] - (fit.slope * d[xKey] + fit.intercept)
    }));

  const above = scored
    .filter(d => d.residual > 0)
    .sort((a, b) => d3.descending(a.residual, b.residual))
    .slice(0, 2)
    .map(d => d.name)
    .join(", ");

  const below = scored
    .filter(d => d.residual < 0)
    .sort((a, b) => d3.ascending(a.residual, b.residual))
    .slice(0, 2)
    .map(d => d.name)
    .join(", ");

  gAnno.append("text")
    .attr("x", margin.left)
    .attr("y", margin.top - 12)
    .attr("fill", "#0b1a2b")
    .attr("font-weight", 600)
    .text(`Excepcions per sobre de la línia: ${above}`);

  gAnno.append("text")
    .attr("x", margin.left)
    .attr("y", margin.top + 6)
    .attr("fill", "#0b1a2b")
    .text(`Excepcions per sota de la línia: ${below}`);
}

function updateTrend(nodes) {
  gTrend.selectAll("*").remove();
  if (nodes.length < 3) return;

  const xKey = "lr";
  const yKey = state.xMetric;
  const valid = nodes.filter(d => Number.isFinite(d[xKey]) && Number.isFinite(d[yKey]));
  if (valid.length < 3) return;

  if (state.mode === "region") {
    const grouped = d3.group(valid, d => d.macro_region);
    const lines = [];

    Object.keys(colorMap).forEach(region => {
      const group = grouped.get(region);
      if (!group || group.length < 3) return;
      const fit = linearFit(group, xKey, yKey);
      if (!fit) return;

      const xExtent = d3.extent(group, d => d[xKey]);
      const y1 = fit.slope * xExtent[0] + fit.intercept;
      const y2 = fit.slope * xExtent[1] + fit.intercept;

      gTrend.append("line")
        .attr("x1", xScale(xExtent[0]))
        .attr("y1", yScale(y1))
        .attr("x2", xScale(xExtent[1]))
        .attr("y2", yScale(y2))
        .attr("stroke", colorMap[region])
        .attr("stroke-width", 1.6)
        .attr("stroke-dasharray", "6 4")
        .attr("opacity", 0.75);

      lines.push({ region, r: fit.r, slope: fit.slope });
    });

    if (lines.length) {
      const text = gTrend.append("text")
        .attr("x", width - margin.right)
        .attr("y", margin.top - 10)
        .attr("text-anchor", "end")
        .attr("fill", "#0f172a")
        .attr("font-weight", 600);

      text.append("tspan").text("Per macroregió (r · pendent)");
      lines.forEach((d, i) => {
        text
          .append("tspan")
          .attr("x", width - margin.right)
          .attr("dy", i === 0 ? 16 : 14)
          .attr("fill", colorMap[d.region])
          .text(`${d.region}: ${formatCorr(d.r)} · ${d.slope.toFixed(2)}`);
      });
    }
    return;
  }

  const fit = linearFit(valid, xKey, yKey);
  if (!fit) return;

  const xExtent = d3.extent(valid, d => d[xKey]);
  const y1 = fit.slope * xExtent[0] + fit.intercept;
  const y2 = fit.slope * xExtent[1] + fit.intercept;

  gTrend.append("line")
    .attr("x1", xScale(xExtent[0]))
    .attr("y1", yScale(y1))
    .attr("x2", xScale(xExtent[1]))
    .attr("y2", yScale(y2))
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.6)
    .attr("stroke-dasharray", "6 4")
    .attr("opacity", 0.7);

  gTrend.append("text")
    .attr("x", width - margin.right)
    .attr("y", margin.top - 10)
    .attr("text-anchor", "end")
    .attr("fill", "#0f172a")
    .attr("font-weight", 600)
    .text(`r = ${formatCorr(fit.r)} · pendent = ${fit.slope.toFixed(2)}`);
}

function updateChart() {
  const xKey = "lr";
  const yKey = state.xMetric;
  const yearData = (dataByYear.get(state.year) || []).filter(
    d => Number.isFinite(d[xKey]) && Number.isFinite(d[yKey])
  );
  const nodes = yearData.map(d => ({ ...d }));
  if (!nodes.length) {
    showMessage("No hi ha dades per aquest any.");
    return;
  }
  hideMessage();
  updateScales();
  updateAxes();
  layoutNodes(nodes);

  const circles = gBubbles.selectAll("circle").data(nodes, d => d.country_name);

  circles.enter()
    .append("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", 0)
    .attr("fill", d => colorMap[d.macro_region] || "#aaa")
    .attr("stroke", "#1f2937")
	    .attr("stroke-width", 0.6)
	    .attr("opacity", 0.85)
	    .on("mousemove", (event, d) => {
	      const yLabel = labelForKey(state.xMetric) || "Valor";
	      const yValue = d[state.xMetric];
	      const yFormatted = Number.isFinite(yValue)
	        ? (state.xMetric === "vote_rate" ? `${(yValue * 100).toFixed(1)}%` : yValue.toFixed(2))
	        : "NA";
	      const trustFormatted = Number.isFinite(d.trust) ? d.trust.toFixed(2) : "NA";
	      tooltip
	        .style("opacity", 1)
	        .style("left", `${event.clientX + 12}px`)
	        .style("top", `${event.clientY + 12}px`)
		        .html(`
		          <strong>${d.country_name}</strong><br>
		          Any: ${d.essyear}<br>
		          Macroregió: ${d.macro_region}<br>
		          Eix polític: ${d.lr.toFixed(2)}<br>
		          ${yLabel}: ${yFormatted}<br>
		          Confiança: ${trustFormatted}<br>
		          Participació: ${(d.vote_rate * 100).toFixed(1)}%
		        `);
	    })
    .on("mouseout", () => tooltip.style("opacity", 0))
    .merge(circles)
    .transition()
    .duration(900)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => rScale(d.vote_rate))
    .attr("fill", d => colorMap[d.macro_region] || "#aaa");

  circles.exit().remove();

  let aboveSet = new Set();
  let belowSet = new Set();
  if (state.mode === "conclusion") {
    const fit = linearFit(nodes, xKey, yKey);
    if (fit) {
      const scored = nodes
        .filter(d => Number.isFinite(d[xKey]) && Number.isFinite(d[yKey]))
        .map(d => ({
          name: d.country_name,
          residual: d[yKey] - (fit.slope * d[xKey] + fit.intercept)
        }));

      aboveSet = new Set(
        scored
          .filter(d => d.residual > 0)
          .sort((a, b) => d3.descending(a.residual, b.residual))
          .slice(0, 2)
          .map(d => d.name)
      );
      belowSet = new Set(
        scored
          .filter(d => d.residual < 0)
          .sort((a, b) => d3.ascending(a.residual, b.residual))
          .slice(0, 2)
          .map(d => d.name)
      );
    }
  }

  gBubbles.selectAll("circle")
    .classed("highlight-top", d => state.mode === "conclusion" && aboveSet.has(d.country_name))
    .classed("highlight-bottom", d => state.mode === "conclusion" && belowSet.has(d.country_name))
    .attr("stroke", d => {
      if (state.mode === "conclusion" && aboveSet.has(d.country_name)) return "#d4a017";
      if (state.mode === "conclusion" && belowSet.has(d.country_name)) return "#cc3d3d";
      return "#1f2937";
    })
    .attr("stroke-width", d => {
      if (state.mode === "conclusion" && (aboveSet.has(d.country_name) || belowSet.has(d.country_name))) return 2;
      return 0.6;
    });

  updateTrend(nodes);
  updateAnnotations(nodes);
}

function setMode(storyStep) {
  if (storyStep !== "time") {
    computeCorrelations();
    updateStoryText();
  }

  const absKey = storyFocus.topAbs ? storyFocus.topAbs.key : "val_openness";
  const negKey = storyFocus.topNegative ? storyFocus.topNegative.key : absKey;
  const posKey = storyFocus.topPositive ? storyFocus.topPositive.key : absKey;

  const config = {
    scan: { mode: "scan", xMetric: absKey, showCorr: true, title: "Selecció (I): criba de correlacions" },
    scan2: { mode: "scan", xMetric: absKey, showCorr: true, title: "Selecció (II): com llegir el r" },
    scan3: { mode: "scan", xMetric: absKey, showCorr: true, title: "Selecció (III): del rànquing a les bombolles" },
    neg: { mode: "neg", xMetric: negKey, title: `Anàlisi (I): correlació negativa (${labelForKey(negKey)})` },
    neg2: { mode: "neg", xMetric: negKey, title: "Anàlisi (II): excepcions i contrast" },
    pos: { mode: "pos", xMetric: posKey, title: `Anàlisi (I): correlació positiva (${labelForKey(posKey)})` },
    pos2: { mode: "pos", xMetric: posKey, title: "Anàlisi (II): comparar lectures" },
    region: { mode: "region", xMetric: absKey, title: "Macroregions: pendents i contrast" },
    time: { mode: "time", xMetric: absKey, title: "Temps: variabilitat any a any" },
    conclusion: { mode: "conclusion", xMetric: absKey, title: "Conclusió: variables clau i casos extrems" }
  };

  const selected = config[storyStep] || config.scan;
  const prevMode = state.mode;
  const prevMetric = state.xMetric;

  const nextMode = selected.mode;
  const nextMetric = selected.xMetric;
  const metricChanged = prevMetric !== nextMetric;

  state.mode = nextMode;
  state.xMetric = nextMetric;

  corrPanel.classed("hidden", !selected.showCorr);
  focusToggles.classed("hidden", state.mode !== "conclusion");
  controls.classed("hidden", state.mode !== "time");
  rScale.range([6, 46]);

  d3.select("#viz-title").text(selected.title || "Bombolles ESS en el temps");
  if (state.mode === "region") {
    d3.select("#viz-subtitle").text("Línies de regressió per macroregió.");
  } else {
    d3.select("#viz-subtitle").text(`Eix X: eix polític · Eix Y: ${labelForKey(state.xMetric)}`);
  }

  if (state.mode === "time") {
    if (!state.playing) {
      playBtn.text("Reprodueix");
    }
  } else {
    stopPlaying();
  }

  if (metricChanged && !updateBubbleYears()) {
    renderCorrPanel();
    updateFocusToggles();
    return;
  }

  const special = new Set(["region", "conclusion"]);
  const needsRedraw = metricChanged || special.has(prevMode) || special.has(state.mode);

  if (needsRedraw && updateBubbleYears()) {
    updateChart();
  }

  renderCorrPanel();
  updateFocusToggles();
}

function setupScroller() {
  const steps = Array.from(document.querySelectorAll(".step"));
  if (!steps.length) return;

  let active = null;
  const activationY = () => window.innerHeight * 0.35;

  const setActive = step => {
    if (!step || step === active) return;
    active = step;
    steps.forEach(s => s.classList.toggle("is-active", s === active));
    setMode(active.dataset.step);
  };

  const pickActive = () => {
    const y = activationY();
    let best = null;
    let bestDist = Infinity;

    for (const step of steps) {
      const rect = step.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - y);
      if (dist < bestDist) {
        best = step;
        bestDist = dist;
      }
    }

    if (!best) {
      const above = steps.filter(step => step.getBoundingClientRect().top < y);
      best = above.length ? above[above.length - 1] : steps[0];
    }

    setActive(best);
  };

  let ticking = false;
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      pickActive();
    });
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  pickActive();
}

function setupControls() {
  slider.on("input", event => {
    const idx = +event.target.value;
    state.year = bubbleYears[idx];
    yearLabel.text(state.year);
    updateChart();
  });

  playBtn.on("click", () => {
    if (state.playing) {
      stopPlaying();
      playBtn.text("Reprodueix");
    } else {
      startPlaying();
      playBtn.text("Pausa");
    }
  });
}

function updateBubbleYears() {
  const available = data.filter(d => Number.isFinite(d[state.xMetric]) && Number.isFinite(d.lr));
  bubbleYears = Array.from(d3.group(available, d => d.essyear).keys()).sort(d3.ascending);
  if (!bubbleYears.length) {
    showMessage("No hi ha dades suficients per aquest valor.");
    return false;
  }

  if (!bubbleYears.includes(state.year)) {
    state.year = bubbleYears[bubbleYears.length - 1];
  }

  slider.attr("min", 0).attr("max", bubbleYears.length - 1)
    .property("value", bubbleYears.indexOf(state.year));
  yearLabel.text(state.year);
  return true;
}

function setupMapControls() {
  if (mapYearSelect.empty()) return;
  mapYearSelect.selectAll("option")
    .data(years)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  state.mapYear = years[years.length - 1];
  mapYearSelect.property("value", state.mapYear);
  mapMetricSelect.property("value", state.mapMetric);

  mapYearSelect.on("change", event => {
    state.mapYear = +event.target.value;
    updateMap();
  });

  mapMetricSelect.on("change", event => {
    state.mapMetric = event.target.value;
    updateMap();
  });
}

function setupLineControls() {
  if (lineButtons.empty()) return;
  lineButtons.classed("active", function () {
    return this.dataset.metric === state.lineMetric;
  });
  lineButtons.on("click", function () {
    const metric = this.dataset.metric;
    state.lineMetric = metric;
    lineButtons.classed("active", false);
    d3.select(this).classed("active", true);
    updateLineChart();
  });
}

function startPlaying() {
  state.playing = true;
  state.timer = setInterval(() => {
    let idx = bubbleYears.indexOf(state.year);
    idx = (idx + 1) % bubbleYears.length;
    state.year = bubbleYears[idx];
    slider.property("value", idx);
    yearLabel.text(state.year);
    updateChart();
  }, 1100);
}

function stopPlaying() {
  state.playing = false;
  if (state.timer) clearInterval(state.timer);
}

function init(dataset) {
  data = dataset;
  if (!data.length) {
    showMessage("Dades buides després de filtrar. Revisa el fitxer de dades.");
    return;
  }
  dataByYear = d3.group(data, d => d.essyear);
  years = Array.from(dataByYear.keys()).sort(d3.ascending);
  state.year = pickStoryYear() || years[years.length - 1];
  computeCorrelations();
  updateStoryText();
  state.mode = "scan";
  state.xMetric = storyFocus.topAbs ? storyFocus.topAbs.key : "val_openness";
  if (!updateBubbleYears()) return;
  computeCorrelations();
  updateStoryText();

  setStats();
  setDimensions();
  setMapDimensions();
  setLineDimensions();
  updateScales();
  updateLegend();
  buildLineData();
  setupControls();
  setupMapControls();
  setupLineControls();
  setupFocusToggles();
  setupScroller();
  setMode("scan");
  updateChart();
  updateMap();
  updateLineChart();
  hideMessage();

  window.addEventListener("resize", () => {
    setDimensions();
    updateChart();
    setMapDimensions();
    updateMap();
    setLineDimensions();
    updateLineChart();
  });
}

showMessage("Carregant dades...");

if (window.ESS_DATA && Array.isArray(window.ESS_DATA)) {
  init(normalizeData(window.ESS_DATA));
} else {
  d3.csv("data/ess_country_year.csv")
    .then(rows => init(normalizeData(rows)))
    .catch(err => {
      console.error(err);
      showMessage("No puc carregar les dades. Obre la carpeta web amb un servidor local.");
    });
}
