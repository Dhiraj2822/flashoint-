// Lightweight SVG Chart Utility

function renderBreakdownSVG(breakdown) {
  if (!breakdown) return "<p>No breakdown data available.</p>";

  const items = [
    { label: "Demand (30%)", score: breakdown.demand?.normalized_score || 0, color: "#3b82f6" },
    { label: "Population (25%)", score: breakdown.population?.normalized_score || 0, color: "#8b5cf6" },
    { label: "Infra Deficit (25%)", score: breakdown.infra_deficit?.normalized_score || 0, color: "#ef4444" },
    { label: "Accessibility (10%)", score: breakdown.accessibility?.normalized_score || 0, color: "#f59e0b" },
    { label: "Inverse Inv (10%)", score: breakdown.inverse_investment?.normalized_score || 0, color: "#10b981" }
  ];

  let svgHtml = `<svg width="100%" height="160" viewBox="0 0 400 160" style="font-family: system-ui, sans-serif; font-size: 12px;">`;

  items.forEach((item, index) => {
    const y = index * 30 + 10;
    const barWidth = (item.score / 100) * 230;

    svgHtml += `
      <text x="5" y="${y + 14}" fill="#475569" font-weight="500">${item.label}</text>
      <rect x="130" y="${y}" width="230" height="18" fill="#f1f5f9" rx="4"/>
      <rect x="130" y="${y}" width="${barWidth}" height="18" fill="${item.color}" rx="4"/>
      <text x="365" y="${y + 14}" fill="#1e293b" font-weight="600">${item.score}</text>
    `;
  });

  svgHtml += `</svg>`;
  return svgHtml;
}

function renderQuadrantScatterSVG(districts) {
  if (!districts || districts.length === 0) return "<p>No district data available for scatter plot.</p>";

  const width = 760;
  const height = 370;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 55;
  const chartW = width - padLeft - padRight; // 660
  const chartH = height - padTop - padBottom; // 290
  const midX = padLeft + chartW / 2; // 400
  const midY = padTop + chartH / 2; // 170

  let svg = `<svg width="100%" height="370" viewBox="0 0 ${width} ${height}" style="font-family: var(--dpi-font-family, system-ui, sans-serif); overflow: visible; display: block;">`;

  // Draw Quadrant Background Panels
  svg += `
    <!-- Top-Left: High Demand, Low Investment (Under-Funded) -->
    <rect x="${padLeft}" y="${padTop}" width="${chartW / 2}" height="${chartH / 2}" fill="#fef2f2" fill-opacity="0.8"/>
    <!-- Top-Right: High Demand, High Investment (Balanced High) -->
    <rect x="${midX}" y="${padTop}" width="${chartW / 2}" height="${chartH / 2}" fill="#ecfdf5" fill-opacity="0.8"/>
    <!-- Bottom-Left: Low Demand, Low Investment (Baseline) -->
    <rect x="${padLeft}" y="${midY}" width="${chartW / 2}" height="${chartH / 2}" fill="#f8fafc" fill-opacity="0.8"/>
    <!-- Bottom-Right: Low Demand, High Investment (Check Effectiveness) -->
    <rect x="${midX}" y="${midY}" width="${chartW / 2}" height="${chartH / 2}" fill="#fffbeb" fill-opacity="0.8"/>

    <!-- Outer Border -->
    <rect x="${padLeft}" y="${padTop}" width="${chartW}" height="${chartH}" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>

    <!-- Quadrant Midline Axes -->
    <line x1="${padLeft}" y1="${midY}" x2="${padLeft + chartW}" y2="${midY}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,4"/>
    <line x1="${midX}" y1="${padTop}" x2="${midX}" y2="${padTop + chartH}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,4"/>

    <!-- High-Contrast Quadrant Title Badges -->
    <g>
      <rect x="${padLeft + 14}" y="${padTop + 12}" width="220" height="26" rx="4" fill="#fee2e2" stroke="#fca5a5" stroke-width="1"/>
      <text x="${padLeft + 24}" y="${padTop + 29}" fill="#991b1b" font-weight="700" font-size="11" letter-spacing="0.5">UNDER-FUNDED (HIGH DEMAND)</text>

      <rect x="${midX + 14}" y="${padTop + 12}" width="220" height="26" rx="4" fill="#d1fae5" stroke="#a7f3d0" stroke-width="1"/>
      <text x="${midX + 24}" y="${padTop + 29}" fill="#065f46" font-weight="700" font-size="11" letter-spacing="0.5">BALANCED HIGH INVESTMENT</text>

      <rect x="${padLeft + 14}" y="${padTop + chartH - 36}" width="180" height="26" rx="4" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
      <text x="${padLeft + 24}" y="${padTop + chartH - 19}" fill="#475569" font-weight="700" font-size="11" letter-spacing="0.5">BASELINE MONITORING</text>

      <rect x="${midX + 14}" y="${padTop + chartH - 36}" width="260" height="26" rx="4" fill="#fef3c7" stroke="#fde68a" stroke-width="1"/>
      <text x="${midX + 24}" y="${padTop + chartH - 19}" fill="#92400e" font-weight="700" font-size="11" letter-spacing="0.5">CHECK EFFECTIVENESS (OVER-FUNDED)</text>
    </g>

    <!-- Scale Reference Ticks -->
    <text x="${padLeft - 10}" y="${padTop + 10}" text-anchor="end" fill="#64748b" font-size="11" font-weight="600">300 req</text>
    <text x="${padLeft - 10}" y="${midY + 4}" text-anchor="end" fill="#64748b" font-size="11" font-weight="600">150 req</text>
    <text x="${padLeft - 10}" y="${padTop + chartH}" text-anchor="end" fill="#64748b" font-size="11" font-weight="600">0 req</text>

    <text x="${padLeft}" y="${padTop + chartH + 18}" text-anchor="middle" fill="#64748b" font-size="11" font-weight="600">₹0 Cr</text>
    <text x="${midX}" y="${padTop + chartH + 18}" text-anchor="middle" fill="#64748b" font-size="11" font-weight="600">₹15 Cr (Threshold)</text>
    <text x="${padLeft + chartW}" y="${padTop + chartH + 18}" text-anchor="middle" fill="#64748b" font-size="11" font-weight="600">₹30 Cr</text>

    <!-- Axis Titles -->
    <text x="${midX}" y="${height - 10}" text-anchor="middle" fill="#1e293b" font-weight="700" font-size="13">Existing Public Investment Allocated (₹ Crore)</text>
    <text x="-${midY}" y="20" transform="rotate(-90)" text-anchor="middle" fill="#1e293b" font-weight="700" font-size="13">Citizen Demand Volume (Requests)</text>
  `;

  // Plot Data Points with High Visibility
  districts.forEach(d => {
    const demand = d.citizen_demand_count || 50;
    const inv = d.existing_investment_cr || 10;

    // Scale Inv 0 to 30 Cr -> X
    const x = padLeft + (Math.min(30, inv) / 30) * chartW;
    // Scale Demand 0 to 300 -> Y
    const y = (padTop + chartH) - (Math.min(300, demand) / 300) * chartH;

    const color = d.priority_score >= 75 ? "#dc2626" : (d.priority_score >= 50 ? "#d97706" : "#059669");
    const labelText = `${d.district_name}: ₹${inv}Cr / ${demand} req`;
    const labelW = labelText.length * 7.5 + 16;

    // Smart label offset to prevent clipping
    const labelX = (x + labelW + 20 > width) ? (x - labelW - 14) : (x + 14);

    svg += `
      <g class="scatter-point-group" style="cursor: pointer;" onclick="if(window.selectDistrictRow){window.selectDistrictRow('${d.district_name}');}">
        <circle cx="${x}" cy="${y}" r="14" fill="${color}" fill-opacity="0.2"/>
        <circle cx="${x}" cy="${y}" r="8" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
        <rect x="${labelX}" y="${y - 12}" width="${labelW}" height="24" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" opacity="0.95"/>
        <text x="${labelX + 8}" y="${y + 4}" fill="#0f172a" font-weight="700" font-size="11">${labelText}</text>
      </g>
    `;
  });

  svg += `</svg>`;
  return svg;
}
