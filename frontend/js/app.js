// Main Application Orchestrator

let allDistricts = [];
let selectedDistrict = null;

async function loadAllData() {
  try {
    allDistricts = await getDistrictsAPI();
    window.allDistrictsData = allDistricts;
  } catch (e) {
    console.error("Failed to load districts:", e);
    allDistricts = [];
    window.allDistrictsData = [];
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

  // Keep all view tabs synchronized with current filter state
  getSilentNeedsAPI().then(sn => renderSilentNeedsTab(sn, filtered)).catch(() => renderSilentNeedsTab([], filtered));
  getMismatchesAPI().then(m => renderMismatchTab(m, filtered)).catch(() => renderMismatchTab([], filtered));
  getImpactAPI().then(imp => renderImpactTab(imp, filtered)).catch(() => renderImpactTab([], filtered));

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

  // Reset scroll on panel switch so top KPI cards always render fully visible below navbar with normal padding
  const centerPanel = document.querySelector(".center-panel");
  if (centerPanel) {
    centerPanel.scrollTop = 0;
  }
  window.scrollTo(0, 0);

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
  const footerContainer = document.getElementById("datasets-footer");
  if (!footerContainer) return;
  const appFooter = document.querySelector(".app-footer");

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

    footerContainer.innerHTML = `
      <div class="footer-header-bar" id="footer-toggle-bar" role="button" tabindex="0" aria-expanded="true" aria-controls="footer-collapsible-content">
        <div class="footer-header-left">
          <i data-lucide="database" class="dpi-icon-xs" style="color:var(--dpi-primary);"></i>
          <h4>Data Sources &amp; Versions</h4>
          <span class="footer-header-badge">${datasets.length} datasets</span>
        </div>
        <button type="button" class="footer-toggle-btn" id="footer-toggle-btn" aria-label="Toggle Data Sources">
          <span id="footer-toggle-label">Hide</span>
          <i data-lucide="chevron-down" class="footer-chevron-icon dpi-icon-xs"></i>
        </button>
      </div>
      <div id="footer-collapsible-content" class="footer-collapsible-content">
        <div class="footer-datasets-list">${dsHtml}</div>
        <div class="census-note"><em>${note}</em></div>
      </div>`;

    if (window.refreshIcons) window.refreshIcons();

    let isCollapsed = false;
    const toggleBar = document.getElementById("footer-toggle-bar");
    const toggleBtn = document.getElementById("footer-toggle-btn");
    const toggleLabel = document.getElementById("footer-toggle-label");

    function toggleFooter(e) {
      if (e) e.stopPropagation();
      isCollapsed = !isCollapsed;
      if (appFooter) {
        appFooter.classList.toggle("collapsed", isCollapsed);
      }
      if (toggleBar) {
        toggleBar.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
      }
      if (toggleLabel) {
        toggleLabel.textContent = isCollapsed ? "See" : "Hide";
      }
      if (window.refreshIcons) window.refreshIcons();
    }

    if (toggleBar) {
      toggleBar.addEventListener("click", toggleFooter);
      toggleBar.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFooter();
        }
      });
    }
  } catch (e) {
    footerContainer.innerHTML = `<p>Dataset metadata unavailable.</p>`;
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
  getSilentNeedsAPI().then(sn => renderSilentNeedsTab(sn, allDistricts)).catch(() => renderSilentNeedsTab([], allDistricts));

  // Mismatches
  getMismatchesAPI().then(m => renderMismatchTab(m, allDistricts)).catch(() => renderMismatchTab([], allDistricts));

  // Impact
  getImpactAPI().then(imp => renderImpactTab(imp, allDistricts)).catch(() => renderImpactTab([], allDistricts));

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

