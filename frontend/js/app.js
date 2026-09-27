// Main Application Orchestrator

let allDistricts = [];
let selectedDistrict = null;

async function loadAllData() {
  try {
    allDistricts = await getDistrictsAPI();
  } catch (e) {
    console.error("Failed to load districts:", e);
    allDistricts = [];
  }
}

async function onSelectDistrict(district) {
  selectedDistrict = district;
  let explanationData = null;
  try {
    explanationData = await getDistrictExplanationAPI(district.district_name);
  } catch (e) {
    console.warn("Explanation fetch failed, using district data only.");
  }
  renderEvidencePanel(district, explanationData);
  updateUIElements();
}

function setupFilters() {
  const stateSelect = document.getElementById("filter-state");
  const qualitySelect = document.getElementById("filter-quality");

  [stateSelect, qualitySelect].forEach(el => {
    if (el) {
      el.addEventListener("change", applyFilters);
    }
  });
}

function applyFilters() {
  const stateVal = document.getElementById("filter-state")?.value || "all";
  const qualityVal = document.getElementById("filter-quality")?.value || "all";

  let filtered = [...allDistricts];
  if (stateVal !== "all") filtered = filtered.filter(d => d.admin1 === stateVal);
  if (qualityVal !== "all") filtered = filtered.filter(d => d.data_quality === qualityVal);

  renderMapMarkers(filtered, onSelectDistrict);
  renderRankedTab(filtered);

  window.selectDistrictRow = function(dname) {
    const target = filtered.find(d => d.district_name.toLowerCase() === dname.toLowerCase());
    if (target) onSelectDistrict(target);
    activateTab("ranked");
  };
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      activateTab(btn.dataset.tab);
    });
    btn.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateTab(btn.dataset.tab);
      }
    });
  });
}

function activateTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `tab-${tabId}-panel`);
  });

  // Toggle layout mode: Map & Rankings has 3 columns with evidence panel;
  // All other views use full content width (no map, no evidence panel)
  const mainLayout = document.querySelector(".main-layout");
  if (mainLayout) {
    if (tabId === "ranked") {
      mainLayout.classList.remove("full-content-view");
    } else {
      mainLayout.classList.add("full-content-view");
    }
  }

  // When switching back to Map & Rankings, ensure Leaflet calculates dimensions properly
  if (tabId === "ranked" && typeof mapInstance !== "undefined" && mapInstance) {
    setTimeout(() => {
      try {
        mapInstance.invalidateSize();
      } catch (e) {
        console.warn("Leaflet resize notice:", e);
      }
    }, 120);
  }
}

function setupLangSwitcher() {
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      setLanguage(btn.dataset.lang);
    });
  });
}

async function renderFooter() {
  const footer = document.getElementById("datasets-footer");
  if (!footer) return;
  try {
    const data = await getDatasetsAPI();
    const datasets = data.datasets || [];
    const note = data.census_honesty_note || "";

    const dsHtml = datasets.map(d => `
      <div class="ds-item">
        <strong>${d.dataset_name}</strong>
        ${d.data_quality === "real"
          ? `<span class="badge badge-real">REAL DATA</span>`
          : `<span class="badge badge-synthetic">SYNTHETIC DEMO DATA</span>`}
        <span class="ds-meta">v${d.version} · ${d.record_count} records · ${d.ingested_at?.slice(0,10) || 'N/A'}</span>
      </div>`).join("");

    footer.innerHTML = `
      <div class="footer-datasets"><h4>Data Sources &amp; Versions</h4>${dsHtml}</div>
      <div class="census-note"><em>${note}</em></div>`;
  } catch (e) {
    footer.innerHTML = `<p>Dataset metadata unavailable.</p>`;
  }
}

async function main() {
  // Language switcher
  setupLangSwitcher();

  // Load core data
  await loadAllData();

  // Initialize map safely
  try {
    if (typeof L !== "undefined") {
      initMap();
      renderMapMarkers(allDistricts, onSelectDistrict);
    } else {
      console.warn("Leaflet map library (L) not available.");
      const mapEl = document.getElementById("leaflet-map");
      if (mapEl) {
        mapEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--dpi-text-muted); font-weight: 500;">
          <strong>Interactive Pilot Region View</strong><br>
          <span style="font-size: 0.9em;">(Select a district from the ranked recommendations table below to inspect full evidence panel.)</span>
        </div>`;
      }
    }
  } catch (mapErr) {
    console.warn("Map setup warning:", mapErr);
  }

  // Default evidence panel
  renderEvidencePanel(null, null);

  // Filters
  setupFilters();
  applyFilters();

  // Tabs setup
  setupTabs();

  // Render tab-specific content
  renderRankedTab(allDistricts);

  // Silent Needs
  getSilentNeedsAPI().then(renderSilentNeedsTab).catch(() => renderSilentNeedsTab([]));

  // Mismatches
  getMismatchesAPI().then(m => renderMismatchTab(m, allDistricts)).catch(() => renderMismatchTab([], allDistricts));

  // Impact
  getImpactAPI().then(renderImpactTab).catch(() => renderImpactTab([]));

  // AI Command Center
  renderCommandTab();

  // Submit Request
  renderSubmitRequestTab();

  // Footer
  renderFooter();

  // Enable row selection from ranked table
  window.selectDistrictRow = function(dname) {
    const target = allDistricts.find(d => d.district_name.toLowerCase() === dname.toLowerCase());
    if (target) onSelectDistrict(target);
    activateTab("ranked");
  };

  // Activate first tab
  activateTab("ranked");

  // Auto-select the top-ranked district so the evidence panel is pre-populated on load
  if (allDistricts && allDistricts.length > 0) {
    const topDistrict = allDistricts.find(d => d.rank === 1) || allDistricts[0];
    onSelectDistrict(topDistrict);
  }

  // Initialize Lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

window.refreshIcons = function() {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
};

document.addEventListener("DOMContentLoaded", main);

