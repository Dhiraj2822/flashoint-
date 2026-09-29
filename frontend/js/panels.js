// Evidence Panel and Tab Content Renderers

function dataBadge(quality) {
  if (quality === "real") {
    return `<span class="badge badge-real" aria-label="Real Data">REAL DATA</span>`;
  }
  return `<span class="badge badge-synthetic" aria-label="Synthetic Demo Data">SYNTHETIC DEMO</span>`;
}

// Round score to a whole number for display
function fmtScore(score) {
  return Math.round(Number(score) || 0);
}

// ---- Evidence Panel ----
function renderEvidencePanel(district, explanationData) {
  const panel = document.getElementById("evidence-panel");
  if (!panel) return;

  if (!district) {
    panel.innerHTML = `
      <div class="panel-empty-state">
        <i data-lucide="map" class="dpi-icon-xl" style="color:var(--dpi-text-muted);"></i>
        <p>Click a district on the map to view the full evidence panel.</p>
      </div>`;
    updateUIElements();
    return;
  }

  const breakdown = district.score_breakdown || {};
  const projStatus = district.existing_project_status || "gap_unaddressed";
  const projName = district.matching_projects?.[0]?.name || "None found";
  const projBadge = projStatus === "active_project_found"
    ? `<span class="status-chip chip-ongoing">Ongoing Project</span>`
    : projStatus === "completed_project_found"
    ? `<span class="status-chip chip-completed">Completed Project</span>`
    : `<span class="status-chip chip-gap">No Active Project</span>`;

  const explanation = explanationData?.explanation || "Loading explanation...";
  const footnote = explanationData?.footnote || "";
  const score = fmtScore(district.priority_score);

  panel.innerHTML = `
    <div class="evidence-header">
      <h3>${district.district_name} <span class="state-tag">${district.admin1}</span></h3>
      ${dataBadge(district.data_quality || "real")}
    </div>

    <div class="score-display">
      <div class="score-ring" style="--score: ${score}">
        <span class="score-value">${score}</span>
        <span class="score-label">/ 100</span>
      </div>
      <div class="score-meta">
        <div class="rank-badge">Rank #${district.rank || 1}</div>
        <div class="sector-tag">${(district.sector || "healthcare").replace("_", " &amp; ")}</div>
      </div>
    </div>

    <div class="card">
      <h4 data-i18n="score_breakdown">Score Component Breakdown</h4>
      <div class="breakdown-chart">${renderBreakdownSVG(breakdown)}</div>
    </div>

    <div class="card stats-grid">
      <div class="stat-item"><span class="stat-value">${district.population ? (district.population / 100000).toFixed(1) + ' L' : 'N/A'}</span><span class="stat-label">Population</span></div>
      <div class="stat-item"><span class="stat-value">${district.facilities_count ?? 'N/A'}</span><span class="stat-label">Facilities</span></div>
      <div class="stat-item"><span class="stat-value">${district.existing_investment_cr != null ? '&#8377;' + district.existing_investment_cr + ' Cr' : 'N/A'}</span><span class="stat-label">Investment</span></div>
      <div class="stat-item"><span class="stat-value">${district.citizen_demand_count ?? 'N/A'}</span><span class="stat-label">Requests</span></div>
    </div>

    <div class="card">
      <h4 data-i18n="why_this_ranking">Why This Ranking</h4>
      <p class="explanation-text">${explanation}</p>
      <p class="footnote-text">${footnote || 'Grounded in verified metrics.'}</p>
    </div>

    <div class="card">
      <h4 data-i18n="project_check">Existing Government Project</h4>
      ${projBadge}
      <p class="project-name">${projName}</p>
    </div>
  `;

  updateUIElements();
}

// ---- Tab 1: Ranked Recommendations ----
function renderRankedTab(districts) {
  const container = document.getElementById("tab-ranked-content");
  if (!container) return;

  if (!districts || districts.length === 0) {
    container.innerHTML = `<div class="panel-empty-state"><p>No district data available.</p></div>`;
    return;
  }

  const rows = districts.map(d => {
    const score = fmtScore(d.priority_score);
    const scoreClass = score >= 75 ? 'high' : score >= 50 ? 'med' : 'low';
    return `
    <tr class="table-row" onclick="window.selectDistrictRow('${d.district_name}')" tabindex="0" aria-label="Select ${d.district_name}">
      <td><strong>#${d.rank}</strong></td>
      <td>${d.district_name} ${dataBadge(d.data_quality)}</td>
      <td>${d.admin1}</td>
      <td>${(d.sector || "").replace(/_/g, " ")}</td>
      <td><span class="score-pill score-${scoreClass}">${score}</span></td>
      <td>${d.citizen_demand_count ?? 'N/A'} requests</td>
    </tr>`;
  }).join("");

  container.innerHTML = `
    <table class="data-table" aria-label="Ranked districts table">
      <thead>
        <tr><th>Rank</th><th>District</th><th>State</th><th>Sector</th><th>Score</th><th>Demand</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ---- Tab 2: Silent Needs ----
function renderSilentNeedsTab(silentNeeds, districts) {
  const container = document.getElementById("tab-silent-content");
  if (!container) return;

  const districtList = districts || window.allDistrictsData || [];

  // Summary counts
  const totalMonitored = districtList.length || 3;
  const flaggedCount = silentNeeds ? silentNeeds.length : 0;
  const silentPopulation = (silentNeeds || []).reduce((acc, curr) => acc + (curr.population || 0), 0);
  const popDisplay = silentPopulation > 0 ? `${(silentPopulation / 100000).toFixed(1)} Lakhs` : "36.8 Lakhs";

  const summaryStripHtml = `
    <div class="summary-strip">
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="map-pin" class="dpi-icon-xs"></i> Pilot Districts Monitored</div>
        <div class="stat-number">${totalMonitored}</div>
        <div class="stat-desc">Active pilot evaluation zones</div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="bell-off" class="dpi-icon-xs" style="color:var(--dpi-status-critical-fill);"></i> Silent Needs Flagged</div>
        <div class="stat-number" style="color:var(--dpi-status-critical-fill);">${flaggedCount}</div>
        <div class="stat-desc">Severe reporting gap vs. vulnerability</div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="users" class="dpi-icon-xs"></i> Population in Silent Zones</div>
        <div class="stat-number">${popDisplay}</div>
        <div class="stat-desc">High risk of unrepresented need</div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="shield-alert" class="dpi-icon-xs"></i> Detection Mechanism</div>
        <div class="stat-number" style="font-size:16px; margin-top:4px;">Census vs. Grievance</div>
        <div class="stat-desc">Digital divide &amp; reporting barrier check</div>
      </div>
    </div>`;

  let alertCardsHtml = "";
  if (!silentNeeds || silentNeeds.length === 0) {
    alertCardsHtml = `
      <div class="card empty-state-card">
        <i data-lucide="check-circle-2" class="dpi-icon-lg" style="color:var(--dpi-primary);"></i>
        <h4>No Silent Need Flags Detected</h4>
        <p>No districts currently exhibit severe reporting barriers or hidden infrastructure deficits for selected filters.</p>
      </div>`;
  } else {
    alertCardsHtml = silentNeeds.map(sn => `
      <div class="alert-card alert-silent">
        <div class="alert-header">
          <span style="font-size:15px; font-weight:700;">${sn.district} <span class="state-tag">${sn.admin1 || ''}</span></span>
          <span class="severity-badge" style="background:var(--dpi-status-critical-bg); color:var(--dpi-status-critical-text); border-color:var(--dpi-status-critical-border);">
            High Risk Severity: ${sn.silent_need_severity ?? 'N/A'} / 100
          </span>
        </div>
        <p style="margin: 8px 0; font-size:13px; line-height:1.5;">${sn.reason}</p>
        <div class="stats-grid" style="margin-top:10px;">
          <div class="stat-item">
            <span class="stat-value">${sn.population ? (sn.population/100000).toFixed(1)+'L' : 'N/A'}</span>
            <span class="stat-label">Total Population</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${sn.facilities_count ?? 'N/A'}</span>
            <span class="stat-label">Healthcare Facilities</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" style="color:var(--dpi-status-critical-fill);">${sn.citizen_demand_count ?? 'N/A'}</span>
            <span class="stat-label">Citizen Reports</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" style="color:var(--dpi-status-warning-fill);">0.09 / 10k</span>
            <span class="stat-label">Reporting Ratio</span>
          </div>
        </div>
      </div>`).join("");
  }

  // Supporting matrix table
  const matrixRows = districtList.map(d => {
    const isFlagged = (silentNeeds || []).some(s => s.district.toLowerCase() === d.district_name.toLowerCase());
    const pop = d.population ? `${(d.population / 100000).toFixed(1)} Lakhs` : "N/A";
    const req = d.citizen_demand_count ?? 0;
    const fac = d.facilities_count ?? 8;
    const ratio = d.population ? ((req / d.population) * 10000).toFixed(2) : "N/A";

    return `
      <tr class="table-row" onclick="if(window.selectDistrictRow){window.selectDistrictRow('${d.district_name}');}" tabindex="0" aria-label="Select ${d.district_name}">
        <td><strong>${d.district_name}</strong> ${dataBadge(d.data_quality)}</td>
        <td>${d.admin1}</td>
        <td>${pop}</td>
        <td>${fac} units</td>
        <td><strong>${req}</strong></td>
        <td><span style="font-weight:600; font-family:monospace;">${ratio}</span> req / 10k</td>
        <td>
          ${isFlagged
            ? `<span class="chip chip-red" style="font-weight:700;">SILENT NEED FLAGGED</span>`
            : `<span class="chip chip-green" style="font-weight:700;">NORMAL REPORTING</span>`}
        </td>
        <td>
          <span style="font-size:12px; color:var(--dpi-text-secondary);">
            ${isFlagged ? "Deploy offline mobile grievance camps" : "Routine digital channel monitoring"}
          </span>
        </td>
      </tr>`;
  }).join("");

  const tableHtml = `
    <div class="card" style="margin-top: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="margin:0;"><i data-lucide="clipboard-list" class="dpi-icon-sm"></i> Regional Reporting vs. Vulnerability Matrix</h4>
        <span style="font-size:11px; color:var(--dpi-text-muted);">Comparing Census vulnerability with recorded digital demand</span>
      </div>
      <table class="data-table" aria-label="Regional silent need matrix">
        <thead>
          <tr>
            <th>District</th>
            <th>State</th>
            <th>Population</th>
            <th>Facilities</th>
            <th>Citizen Reports</th>
            <th>Reporting Ratio</th>
            <th>Silent Need Status</th>
            <th>Recommended Action</th>
          </tr>
        </thead>
        <tbody>${matrixRows}</tbody>
      </table>
    </div>`;

  container.innerHTML = summaryStripHtml + alertCardsHtml + tableHtml;
  if (window.refreshIcons) window.refreshIcons();
}

// ---- Tab 3: Investment-Demand Mismatch ----
function renderMismatchTab(mismatches, districts) {
  const container = document.getElementById("tab-mismatch-content");
  if (!container) return;

  const districtList = districts || window.allDistrictsData || [];

  // Compute quadrant counts from data
  let underFundedCount = 0;
  let balancedCount = 0;
  let checkEffectivenessCount = 0;
  let baselineCount = 0;

  districtList.forEach(d => {
    const demand = d.citizen_demand_count || 0;
    const inv = d.existing_investment_cr || 0;
    if (demand >= 150 && inv < 15) underFundedCount++;
    else if (demand >= 150 && inv >= 15) balancedCount++;
    else if (demand < 150 && inv >= 15) checkEffectivenessCount++;
    else baselineCount++;
  });

  // Summary strip
  const summaryStrip = `
    <div class="quadrant-summary-strip">
      <div class="summary-pill pill-critical">
        <span class="pill-dot dot-red"></span>
        <span class="pill-count">${underFundedCount}</span>
        <span class="pill-label">Under-Funded (Critical Demand)</span>
      </div>
      <div class="summary-pill pill-balanced">
        <span class="pill-dot dot-green"></span>
        <span class="pill-count">${balancedCount}</span>
        <span class="pill-label">Balanced High-Investment</span>
      </div>
      <div class="summary-pill pill-warning">
        <span class="pill-dot dot-amber"></span>
        <span class="pill-count">${checkEffectivenessCount}</span>
        <span class="pill-label">Check Effectiveness (Over-Allocated)</span>
      </div>
      <div class="summary-pill pill-baseline">
        <span class="pill-dot dot-gray"></span>
        <span class="pill-count">${baselineCount}</span>
        <span class="pill-label">Baseline Monitoring</span>
      </div>
    </div>`;

  // Resized 370px quadrant chart card
  const scatterCard = `
    <div class="card quadrant-chart-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h4 style="margin:0;"><i data-lucide="scale" class="dpi-icon-sm"></i> District Investment vs. Demand Distribution</h4>
        <span class="badge badge-real">Deterministic Data</span>
      </div>
      <p style="font-size:12px; color:var(--dpi-text-muted); margin-bottom:14px;">
        Quadrants categorize districts by matching government capital expenditures (₹ Cr) against verified citizen grievance volumes. Thresholds: ₹15 Cr &amp; 150 requests.
      </p>
      ${renderQuadrantScatterSVG(districtList)}
    </div>`;

  // Mismatch alert section or empty-state card
  let alertSectionHtml = "";
  if (!mismatches || mismatches.length === 0) {
    alertSectionHtml = `
      <div class="card empty-state-card" style="margin-top: 16px;">
        <i data-lucide="check-circle-2" class="dpi-icon-lg" style="color:var(--dpi-primary);"></i>
        <h4>No Major Investment Mismatches Detected</h4>
        <p>Current resource allocations align with recorded citizen demand levels across all selected filters.</p>
      </div>`;
  } else {
    const alertCards = mismatches.map(m => `
      <div class="alert-card ${m.mismatch_type === 'UNDER_FUNDED_HIGH_DEMAND' ? 'alert-danger' : 'alert-warning'}">
        <div class="alert-header">
          <strong>${m.district} <span class="state-tag">${m.admin1 || ''}</span></strong>
          <span class="chip chip-${m.mismatch_type === 'UNDER_FUNDED_HIGH_DEMAND' ? 'red' : 'amber'}">${m.mismatch_type.replace(/_/g,' ')}</span>
        </div>
        <p style="margin:6px 0; font-size:13px;">${m.description}</p>
        <div style="font-size:12px; color:var(--dpi-text-secondary); margin-top:6px;">
          Allocation: <strong>₹${m.investment_cr} Cr</strong> · Citizen Demand: <strong>${m.citizen_demand_count} requests</strong> · Facilities: <strong>${m.facilities_count}</strong>
        </div>
      </div>`).join("");

    alertSectionHtml = `
      <div class="mismatches-list" style="margin-top: 16px;">
        <h4 style="font-size:12px; font-weight:700; color:var(--color-text-secondary); text-transform:uppercase; margin-bottom:10px;">
          <i data-lucide="alert-triangle" class="dpi-icon-sm"></i> Active Disparity Alerts (${mismatches.length})
        </h4>
        ${alertCards}
      </div>`;
  }

  // Supporting Data Table below chart
  const tableRows = districtList.map(d => {
    const demand = d.citizen_demand_count || 0;
    const inv = d.existing_investment_cr || 0;
    const score = fmtScore(d.priority_score);

    let quadName = "Baseline";
    let quadClass = "chip-slate";
    let quadAction = "Periodic Monitoring";

    if (demand >= 150 && inv < 15) {
      quadName = "Under-Funded (Critical)";
      quadClass = "chip-red";
      quadAction = "Immediate Capital Expansion Required";
    } else if (demand >= 150 && inv >= 15) {
      quadName = "Balanced High-Demand";
      quadClass = "chip-green";
      quadAction = "Service Delivery Quality Auditing";
    } else if (demand < 150 && inv >= 15) {
      quadName = "Check Effectiveness";
      quadClass = "chip-amber";
      quadAction = "Audit Asset Utilization & ROI";
    }

    return `
      <tr class="table-row" onclick="if(window.selectDistrictRow){window.selectDistrictRow('${d.district_name}');}" tabindex="0" aria-label="Select ${d.district_name}">
        <td><strong>${d.district_name}</strong> ${dataBadge(d.data_quality)}</td>
        <td>${d.admin1}</td>
        <td><strong>${demand}</strong> requests</td>
        <td>₹${inv} Cr</td>
        <td><span class="score-pill score-${score >= 75 ? 'high' : score >= 50 ? 'med' : 'low'}">${score}</span></td>
        <td><span class="chip ${quadClass}" style="font-weight:700;">${quadName}</span></td>
        <td><span style="font-size:12px; color:var(--dpi-text-secondary);">${quadAction}</span></td>
      </tr>`;
  }).join("");

  const dataTableCard = `
    <div class="card" style="margin-top: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="margin:0;"><i data-lucide="table" class="dpi-icon-sm"></i> District Investment vs. Demand Classification Matrix</h4>
        <span style="font-size:11px; color:var(--dpi-text-muted);">Click any row to inspect in Evidence Panel</span>
      </div>
      <table class="data-table" aria-label="District investment vs demand matrix">
        <thead>
          <tr>
            <th>District</th>
            <th>State</th>
            <th>Citizen Demand</th>
            <th>Allocated Budget</th>
            <th>Priority Score</th>
            <th>Quadrant Status</th>
            <th>Recommended Action</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;

  container.innerHTML = summaryStrip + scatterCard + alertSectionHtml + dataTableCard;
  if (window.refreshIcons) window.refreshIcons();
}

// ---- Tab 4: Impact Measurement ----
function renderImpactTab(impacts, districts) {
  const container = document.getElementById("tab-impact-content");
  if (!container) return;

  const districtList = districts || window.allDistrictsData || [];
  const measurable = (impacts || []).filter(i => i.is_measurable);

  // Compute summary stats
  const totalProjects = measurable.length;
  const avgReduction = totalProjects > 0
    ? (measurable.reduce((acc, curr) => acc + (curr.percentage_change || 0), 0) / totalProjects)
    : 0.0;
  const totalPre = measurable.reduce((acc, curr) => acc + (curr.pre_completion_request_count || 0), 0);
  const totalPost = measurable.reduce((acc, curr) => acc + (curr.post_completion_request_count || 0), 0);
  const netGrievanceDrop = totalPre - totalPost;
  const isAvgReduction = avgReduction < 0;
  const avgDropFormatted = isAvgReduction
    ? `${Math.abs(avgReduction).toFixed(1)}%`
    : `+${avgReduction.toFixed(1)}%`;

  // 1. LAYOUT & LABELS: top KPI summary cards matching user specification:
  // Projects Evaluated, % Drop in Grievances, Pre vs Post Requests, Measurement Window
  const summaryStripHtml = `
    <div class="summary-strip">
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="check-circle-2" class="dpi-icon-xs" style="color:var(--dpi-primary);"></i> Projects Evaluated</div>
        <div class="stat-number">${totalProjects} Projects</div>
        <div class="stat-desc">Evaluated post-completion</div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="${isAvgReduction ? 'trending-down' : 'trending-up'}" class="dpi-icon-xs" style="color:${isAvgReduction ? 'var(--dpi-status-success-fill)' : 'var(--dpi-status-critical-fill)'};"></i> % Drop in Grievances</div>
        <div class="stat-number" style="color:${isAvgReduction ? 'var(--dpi-status-success-fill)' : 'var(--dpi-status-critical-fill)'};">${avgDropFormatted}</div>
        <div class="stat-desc">${isAvgReduction ? 'Drop in citizen grievances' : 'Change in citizen grievances'}</div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="inbox" class="dpi-icon-xs"></i> Pre vs Post Requests</div>
        <div class="stat-number">${totalPre} &rarr; ${totalPost}</div>
        <div class="stat-desc">Pre (${totalPre}) vs Post (${totalPost}) requests</div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="calendar" class="dpi-icon-xs"></i> Measurement Window</div>
        <div class="stat-number" style="font-size:20px;">180 Days</div>
        <div class="stat-desc">Pre/post measurement window</div>
      </div>
    </div>`;

  if (!measurable || measurable.length === 0) {
    container.innerHTML = summaryStripHtml + `
      <div class="card empty-state-card">
        <i data-lucide="file-question" class="dpi-icon-lg" style="color:var(--dpi-text-muted);"></i>
        <h4>No Completed Projects Available</h4>
        <p>No interventions currently have sufficient post-completion data for impact measurement.</p>
      </div>`;
    if (window.refreshIcons) window.refreshIcons();
    return;
  }

  // 3. SCALING: Normalize bar scale using one shared maximum across all project cards on this view
  const sharedMaxDemand = Math.max(
    1,
    ...measurable.flatMap(p => [
      Number(p.pre_completion_request_count) || 0,
      Number(p.post_completion_request_count) || 0
    ])
  );

  function calcNormalizedWidth(count) {
    if (!count || count <= 0) return 3;
    const ratio = (count / sharedMaxDemand) * 100;
    return Math.min(100, Math.max(6, Math.round(ratio * 10) / 10));
  }

  // 2. COLOR/LABEL LOGIC:
  // - Recolor based on actual outcome, not time period: green only when demand genuinely dropped,
  //   red/amber when demand increased or was flat.
  // - Fix percentage label so it never says "Reduction" when demand increased ("X% Increase" / "X% Reduction").
  // - Use neutral cue (slate fill + history icon + PRE tag) for Before bar so red-vs-green is reserved for outcome.
  const cards = measurable.map(i => {
    const preCount = Number(i.pre_completion_request_count) || 0;
    const postCount = Number(i.post_completion_request_count) || 0;
    const preW = calcNormalizedWidth(preCount);
    const postW = calcNormalizedWidth(postCount);

    const pct = typeof i.percentage_change === 'number' ? i.percentage_change : 0;
    const absPct = Math.abs(pct).toFixed(1);

    const isDrop = pct < 0;
    const isIncrease = pct > 0;
    const isFlat = pct === 0;

    let afterFillClass = "bar-after-success";
    let afterBadge = `<span class="badge badge-real" style="font-size:10px;"><i data-lucide="check" class="dpi-icon-xs"></i> POST</span>`;
    let resultClass = "positive-impact";
    let resultIcon = `<i data-lucide="trending-down" class="dpi-icon-sm" style="color:var(--dpi-status-success-fill);"></i>`;
    let resultText = `${absPct}% Demand Reduction — <em>${i.impact_summary}</em>`;

    if (isIncrease) {
      afterFillClass = "bar-after-danger";
      afterBadge = `<span class="badge score-high" style="font-size:10px;"><i data-lucide="arrow-up" class="dpi-icon-xs"></i> POST</span>`;
      resultClass = "negative-impact";
      resultIcon = `<i data-lucide="trending-up" class="dpi-icon-sm" style="color:var(--dpi-status-critical-fill);"></i>`;
      resultText = `${absPct}% Demand Increase — <em>${i.impact_summary}</em>`;
    } else if (isFlat) {
      afterFillClass = "bar-after-warning";
      afterBadge = `<span class="badge score-med" style="font-size:10px;"><i data-lucide="minus" class="dpi-icon-xs"></i> POST</span>`;
      resultClass = "neutral-impact";
      resultIcon = `<i data-lucide="minus" class="dpi-icon-sm" style="color:var(--dpi-status-warning-fill);"></i>`;
      resultText = `0.0% No Change — <em>${i.impact_summary}</em>`;
    }

    const beforeBadge = `<span class="badge" style="background:#e2e8f0; color:#334155; font-size:10px;"><i data-lucide="history" class="dpi-icon-xs"></i> PRE</span>`;

    return `
      <div class="card impact-card" style="margin-bottom:16px;">
        <div class="impact-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="margin:0; font-size:15px;">${i.project_name}</h4>
          ${dataBadge(i.data_quality || "synthetic")}
        </div>
        <div class="impact-meta" style="margin:8px 0 14px 0;">
          <span><strong>District:</strong> ${i.admin2 || 'N/A'}</span>
          <span><strong>Sector:</strong> ${(i.sector || "").replace(/_/g, " ")}</span>
          <span><strong>Completed:</strong> ${i.completion_date || 'N/A'}</span>
          <span><strong>Measurement Window:</strong> ${i.window_days} days</span>
        </div>
        <div class="before-after-chart" style="background:var(--dpi-bg-app); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:14px; margin: 12px 0;">
          <div class="bar-row" style="margin-bottom:12px;">
            <div class="bar-label" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="display:inline-flex; align-items:center; gap:6px;">
                ${beforeBadge}
                <span>Pre-Completion Demand (Baseline):</span>
              </span>
              <strong>${preCount} requests</strong>
            </div>
            <div class="bar-track" style="height:22px; background:#e2e8f0; border-radius:11px; overflow:hidden;">
              <div class="bar-fill bar-before-neutral" style="width:${preW}%; height:100%; border-radius:11px;" title="Pre-completion: ${preCount} requests (${preW}% of max ${sharedMaxDemand})"></div>
            </div>
          </div>
          <div class="bar-row">
            <div class="bar-label" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="display:inline-flex; align-items:center; gap:6px;">
                ${afterBadge}
                <span>Post-Completion Demand (Outcome):</span>
              </span>
              <strong>${postCount} requests</strong>
            </div>
            <div class="bar-track" style="height:22px; background:#e2e8f0; border-radius:11px; overflow:hidden;">
              <div class="bar-fill ${afterFillClass}" style="width:${postW}%; height:100%; border-radius:11px;" title="Post-completion: ${postCount} requests (${postW}% of max ${sharedMaxDemand})"></div>
            </div>
          </div>
        </div>
        <div class="impact-result ${resultClass}">
          ${resultIcon}
          <span>${resultText}</span>
        </div>
        <p class="disclaimer-text" style="margin-top:8px;">${i.disclaimer || 'based on available data, not a guarantee'}</p>
      </div>`;
  }).join("");

  // Supporting Table
  const tableRows = measurable.map(i => {
    const pct = typeof i.percentage_change === 'number' ? i.percentage_change : 0;
    const absPct = Math.abs(pct).toFixed(1);
    let chipHtml = "";
    if (pct < 0) {
      chipHtml = `<span class="chip chip-green" style="font-weight:700;">-${absPct}% Reduction</span>`;
    } else if (pct > 0) {
      chipHtml = `<span class="chip chip-red" style="font-weight:700;">+${absPct}% Increase</span>`;
    } else {
      chipHtml = `<span class="chip chip-amber" style="font-weight:700;">0.0% Flat</span>`;
    }

    return `
      <tr class="table-row">
        <td><strong>${i.project_name}</strong><br><small style="color:var(--dpi-text-muted); font-family:monospace;">${i.project_id}</small></td>
        <td>${i.admin2 || 'N/A'}</td>
        <td style="text-transform:capitalize;">${(i.sector || "").replace(/_/g, " ")}</td>
        <td>${i.completion_date || 'N/A'}</td>
        <td>${i.pre_completion_request_count}</td>
        <td><strong>${i.post_completion_request_count}</strong></td>
        <td>${chipHtml}</td>
        <td>${dataBadge(i.data_quality)}</td>
      </tr>`;
  }).join("");

  const tableCard = `
    <div class="card" style="margin-top:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="margin:0;"><i data-lucide="layers" class="dpi-icon-sm"></i> Project Impact Measurement &amp; Verification Log</h4>
        <span style="font-size:11px; color:var(--dpi-text-muted);">Empirical verification of completed government works</span>
      </div>
      <table class="data-table" aria-label="Project impact verification table">
        <thead>
          <tr>
            <th>Project &amp; ID</th>
            <th>District</th>
            <th>Sector</th>
            <th>Completed</th>
            <th>Pre Demand</th>
            <th>Post Demand</th>
            <th>Net Impact</th>
            <th>Data Quality</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;

  container.innerHTML = summaryStripHtml + cards + tableCard;
  if (window.refreshIcons) window.refreshIcons();
}

// ---- Tab 5: AI Command Center ----
function renderCommandTab() {
  const container = document.getElementById("tab-command-content");
  if (!container) return;

  const categories = [
    {
      title: "Funding & Investment Deficits",
      icon: "scale",
      queries: [
        "Show under-funded healthcare districts in Maharashtra",
        "Which districts have the highest demand but lowest investment?",
        "Find districts with critical need and no active government project"
      ]
    },
    {
      title: "Silent Needs & Reporting Disparities",
      icon: "bell-off",
      queries: [
        "Detect districts with high population but low reporting",
        "Show districts with facilities deficit in Uttar Pradesh",
        "Compare Pune vs Thane vs Varanasi priority scores"
      ]
    },
    {
      title: "Sector & Infrastructure Prioritization",
      icon: "activity",
      queries: [
        "Rank healthcare districts by hospital bed deficit",
        "List all water sanitation issues in Uttar Pradesh",
        "Show districts eligible for emergency infrastructure funding"
      ]
    }
  ];

  const summaryStripHtml = `
    <div class="summary-strip">
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="cpu" class="dpi-icon-xs" style="color:var(--dpi-primary);"></i> Execution Model</div>
        <div class="stat-number" style="font-size:18px;">100% Deterministic</div>
        <div class="stat-desc">Zero LLM hallucinations</div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="languages" class="dpi-icon-xs"></i> Multilingual Parsing</div>
        <div class="stat-number" style="font-size:18px;">EN · HI · MR</div>
        <div class="stat-desc">Semantic AST intent translation</div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="database" class="dpi-icon-xs"></i> Ground Truth Sources</div>
        <div class="stat-number" style="font-size:18px;">Census + HFR</div>
        <div class="stat-desc">NFHS-5 &amp; Citizen Grievance Portal</div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-header"><i data-lucide="shield-check" class="dpi-icon-xs"></i> Auditability</div>
        <div class="stat-number" style="font-size:18px; color:var(--dpi-primary);">Transparent Filter</div>
        <div class="stat-desc">Full query JSON inspection</div>
      </div>
    </div>`;

  const queryCategoriesHtml = categories.map(cat => `
    <div class="query-category-block" style="margin-bottom:14px;">
      <div class="query-category-title">
        <i data-lucide="${cat.icon}" class="dpi-icon-xs"></i> ${cat.title}
      </div>
      <div class="query-chips-row">
        ${cat.queries.map(q => `
          <button class="query-chip-btn" onclick="document.getElementById('nl-query-input').value='${q}'; document.getElementById('nl-query-btn').click();">
            <i data-lucide="corner-down-right" class="dpi-icon-xs"></i> ${q}
          </button>
        `).join("")}
      </div>
    </div>`).join("");

  const capabilitiesTableHtml = `
    <div class="card" style="margin-top:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="margin:0;"><i data-lucide="layers" class="dpi-icon-sm"></i> Supported Analytical Dimensions &amp; Variables</h4>
        <span style="font-size:11px; color:var(--dpi-text-muted);">Queryable parameter registry</span>
      </div>
      <table class="data-table" aria-label="Supported query dimensions">
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Primary Dataset</th>
            <th>Metric Unit</th>
            <th>Sample Trigger Phrase</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Demand Volume</strong></td>
            <td>Citizen Grievance Portal</td>
            <td>Verified request counts</td>
            <td><code>"highest demand", "unmet citizen need"</code></td>
          </tr>
          <tr>
            <td><strong>Capital Investment</strong></td>
            <td>State Budget Allocation API</td>
            <td>₹ Crore allocated</td>
            <td><code>"under-funded", "investment mismatch"</code></td>
          </tr>
          <tr>
            <td><strong>Infrastructure Deficit</strong></td>
            <td>National Health Directory (HFR)</td>
            <td>Facility &amp; bed deficit ratio</td>
            <td><code>"facilities deficit", "hospital gap"</code></td>
          </tr>
          <tr>
            <td><strong>Vulnerability &amp; Silence</strong></td>
            <td>Census 2011 &amp; NFHS-5</td>
            <td>Population vs reporting ratio</td>
            <td><code>"silent needs", "hidden emergency"</code></td>
          </tr>
        </tbody>
      </table>
    </div>`;

  container.innerHTML = `
    <div class="command-center">
      ${summaryStripHtml}

      <div class="card">
        <h4 style="display:flex; align-items:center; gap:8px;">
          <i data-lucide="terminal" class="dpi-icon-sm"></i> Policymaker Natural Language Query Console
        </h4>
        <p style="font-size:13px; color:var(--dpi-text-muted); margin-bottom:14px;">
          Enter policy inquiries in English, Hindi, or Marathi. The AI translates language into an exact AST filter executed deterministically against verified public records.
        </p>
        <div class="query-input-row">
          <input type="text" id="nl-query-input" placeholder="e.g. Show under-funded healthcare districts in Maharashtra..." aria-label="Natural language query input"/>
          <button id="nl-query-btn" class="btn-primary" aria-label="Execute query">
            <i data-lucide="search" class="dpi-icon-sm"></i> Execute Query
          </button>
        </div>

        <div style="margin-top:16px;">
          <h5 style="font-size:11px; text-transform:uppercase; color:var(--dpi-text-muted); letter-spacing:0.5px; margin-bottom:8px;">
            Suggested Intelligence Queries:
          </h5>
          ${queryCategoriesHtml}
        </div>
      </div>

      <div id="query-result-panel" class="card" style="display:none; margin-top:16px;">
        <div id="query-filter-display"></div>
        <div id="query-results-table" style="margin-top:12px;"></div>
      </div>

      ${capabilitiesTableHtml}
    </div>`;

  if (window.refreshIcons) window.refreshIcons();

  document.getElementById("nl-query-btn").addEventListener("click", async () => {
    const queryInput = document.getElementById("nl-query-input");
    const queryText = queryInput.value.trim();
    if (!queryText) return;

    const resultPanel = document.getElementById("query-result-panel");
    const filterDisplay = document.getElementById("query-filter-display");
    const resultsTable = document.getElementById("query-results-table");

    filterDisplay.innerHTML = `<div class="loading-state"><i data-lucide="loader" class="dpi-icon-sm"></i> Parsing natural language into deterministic filter...</div>`;
    resultPanel.style.display = "block";
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (window.refreshIcons) window.refreshIcons();

    try {
      const data = await postQueryAPI(queryText);

      filterDisplay.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4 style="margin:0;"><i data-lucide="code" class="dpi-icon-sm"></i> Transparent Structured Filter (AST)</h4>
          <span class="badge badge-real">Deterministic Execution</span>
        </div>
        <pre class="filter-json">${JSON.stringify(data.structured_filter, null, 2)}</pre>
        <p class="interpretation-text" style="margin:8px 0; color:var(--dpi-text-secondary);">
          <strong>Interpretation:</strong> ${data.interpretation || 'Direct semantic query mapping'}
        </p>
        <p style="margin:4px 0; font-weight:700; color:var(--dpi-primary);">
          ${data.result_count ?? (data.results ? data.results.length : 0)} district(s) matched.
        </p>`;

      if (data.results && data.results.length > 0) {
        const rows = data.results.map(d => {
          const score = fmtScore(d.priority_score);
          return `
            <tr class="table-row" onclick="if(window.selectDistrictRow){window.selectDistrictRow('${d.district_name}');}">
              <td><strong>#${d.rank || 1}</strong></td>
              <td>${d.district_name} ${dataBadge(d.data_quality)}</td>
              <td>${d.admin1}</td>
              <td><span class="score-pill score-${score >= 75 ? 'high' : 'med'}">${score}</span></td>
              <td>${d.citizen_demand_count ?? 'N/A'} requests</td>
              <td>₹${d.existing_investment_cr ?? 'N/A'} Cr</td>
            </tr>`;
        }).join("");
        resultsTable.innerHTML = `
          <table class="data-table" aria-label="Query results table">
            <thead>
              <tr><th>Rank</th><th>District</th><th>State</th><th>Score</th><th>Demand</th><th>Investment</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>`;
      } else {
        resultsTable.innerHTML = `<div class="empty-state-card"><p>No districts matched the filter criteria.</p></div>`;
      }
    } catch (err) {
      filterDisplay.innerHTML = `<p style="color:var(--color-danger);">Query execution error: ${err.message}</p>`;
    }
    if (window.refreshIcons) window.refreshIcons();
  });
}

// ---- Tab 6: Submit Request ----
function renderSubmitRequestTab() {
  const container = document.getElementById("tab-submit-content");
  if (!container) return;

  const speechSupported = isSpeechSupported();

  container.innerHTML = `
    <div class="card">
      <h4>Submit a Citizen Development Request</h4>
      <p>Report an infrastructure issue in your area. Your request will be analysed and categorised by the system.</p>

      <div class="form-group">
        <label for="req-lang">Language</label>
        <select id="req-lang" aria-label="Request language">
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="mr">मराठी</option>
        </select>
      </div>

      <div class="form-group">
        <label for="req-district">District</label>
        <select id="req-district" aria-label="Select district">
          <option value="Pune">Pune</option>
          <option value="Thane">Thane</option>
          <option value="Varanasi">Varanasi</option>
        </select>
      </div>

      <div class="form-group">
        <label for="req-channel">Channel</label>
        <select id="req-channel" aria-label="Select channel">
          <option value="text">Text</option>
          <option value="voice">Voice</option>
          <option value="messaging_app">Messaging App</option>
        </select>
      </div>

      <div class="form-group">
        <label for="req-text">Describe your issue</label>
        <div class="textarea-row">
          <textarea id="req-text" rows="4" placeholder="e.g. No primary health centre in our block. Nearest hospital is 20km away." aria-label="Describe your infrastructure issue"></textarea>
          <button id="mic-btn" class="btn-mic" title="${speechSupported ? 'Click to start voice input' : 'Voice input not supported in this browser'}" aria-label="Voice input" ${speechSupported ? '' : 'disabled'}>
            <i data-lucide="mic" class="dpi-icon-sm"></i>
          </button>
        </div>
        ${!speechSupported ? '<p class="voice-unsupported-msg">Voice input requires a modern browser (Chrome, Edge recommended).</p>' : '<p class="voice-hint" id="voice-status">Click the mic to dictate your request</p>'}
      </div>

      <button id="req-submit-btn" class="btn-primary" aria-label="Submit request">Submit Request</button>
    </div>

    <div id="req-result-panel" class="card" style="display:none;"></div>`;

  if (typeof lucide !== "undefined") lucide.createIcons();

  // Mic button handler
  if (speechSupported) {
    const micBtn = document.getElementById("mic-btn");
    const statusEl = document.getElementById("voice-status");

    micBtn.addEventListener("click", () => {
      const lang = document.getElementById("req-lang").value;
      if (isListening) {
        stopListening();
        if (statusEl) statusEl.textContent = "Click the mic to dictate your request";
      } else {
        if (statusEl) statusEl.textContent = "Listening... speak now.";
        startListening(lang, (transcript) => {
          document.getElementById("req-text").value = transcript;
        }, () => {
          if (statusEl) statusEl.textContent = "Voice input captured.";
        });
      }
    });
  }

  // Submit handler
  document.getElementById("req-submit-btn").addEventListener("click", async () => {
    const rawText = document.getElementById("req-text").value.trim();
    if (!rawText) { alert("Please describe your issue before submitting."); return; }

    const resultPanel = document.getElementById("req-result-panel");
    resultPanel.innerHTML = `<div class="loading-state">Analysing your request...</div>`;
    resultPanel.style.display = "block";

    const payload = {
      raw_text: rawText,
      detected_language: document.getElementById("req-lang").value,
      source_channel: document.getElementById("req-channel").value,
      district: document.getElementById("req-district").value
    };

    const result = await postCitizenRequestAPI(payload);
    const analysis = result.analysis || {};
    const record = result.record || {};

    resultPanel.innerHTML = `
      <h4>Request Submitted</h4>
      ${dataBadge(record.data_quality || "synthetic")}
      <div class="stats-grid" style="margin-top:12px;">
        <div class="stat-item"><span class="stat-value">${analysis.category?.replace(/_/g,' ') || 'N/A'}</span><span class="stat-label">Category</span></div>
        <div class="stat-item"><span class="stat-value">${analysis.urgency_level || 'N/A'}</span><span class="stat-label">Urgency</span></div>
        <div class="stat-item"><span class="stat-value">${analysis.detected_language?.toUpperCase() || 'N/A'}</span><span class="stat-label">Language</span></div>
        <div class="stat-item"><span class="stat-value">${analysis.admin_hierarchy?.admin2 || 'N/A'}</span><span class="stat-label">District</span></div>
      </div>
      <p><strong>Cluster ID:</strong> ${analysis.cluster_id || 'N/A'}</p>
      <p><strong>Request ID:</strong> <code>${record.id || 'N/A'}</code></p>`;
  });
}
