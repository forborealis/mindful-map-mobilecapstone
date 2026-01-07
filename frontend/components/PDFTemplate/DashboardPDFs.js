import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';

async function loadImageAsBase64(assetPath) {
  try {
    const asset = Asset.fromModule(assetPath);
    await asset.downloadAsync();
    const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error loading image:', error);
    return '';
  }
}

const generateHeaderHTML = (tupLogo, mindfulLogo, title, subtitle) => {
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', { 
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true 
  });

  return `
    <div class="header">
      <img src="${tupLogo}" class="logo" />
      <div class="header-center">
        <div class="system-title">Mindful Map: Mood and Habits Analyzer</div>
            <div class="system-subtitle">for Emotional Regulation</div>
        </div>
      <img src="${mindfulLogo}" class="logo" />
    </div>
    <p class="timestamp">Generated on: ${timestamp}</p>
    <hr class="divider" />
    <h1 class="report-title">${title}</h1>
    ${subtitle ? `<p class="report-meta">${subtitle}</p>` : ''}
  `;
};

const generateStyles = () => `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 40px 30px;
      background: #fff;
      color: #333;
      line-height: 1.6;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      gap: 20px;
    }
    .logo { width: 60px; height: 60px; flex-shrink: 0; }
    .header-center { flex: 1; text-align: center; }
    .system-title {
      font-size: 18px;
      font-weight: bold;
      color: #55ad9b;
      margin: 0 0 2px 0;
      letter-spacing: 0.5px;
    }
    .system-subtitle {
      font-size: 18px;
      font-weight: 600;
      color: #55ad9b;
      margin: 0;
      letter-spacing: 0.3px;
    }
    .timestamp {
      font-size: 11px;
      color: #666;
      text-align: center;
      margin: 12px 0 0 0;
    }
    .divider {
      border: none;
      border-top: 1px solid #55ad9b;
      margin: 20px 0 30px 0;
    }
    .report-title {
      font-size: 22px;
      font-weight: bold;
      text-align: center;
      color: #000;
      margin: 0 0 8px 0;
      letter-spacing: 0.5px;
    }
    .report-meta {
      font-size: 13px;
      color: #555;
      text-align: center;
      margin: 0 0 20px 0;
      opacity: 0.8;
    }
    .overall-summary {
      background: #f0f8ff;
      border-radius: 16px;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid #d0e7ff;
      page-break-inside: avoid;
    }
    .overall-summary h4 {
      color: #55ad9b;
      font-size: 14px;
      margin: 0 0 10px 0;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .overall-summary p {
      color: #3c3c3c;
      font-size: 13px;
      margin: 0;
    }
    .chart-container {
      margin: 30px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      page-break-inside: avoid;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 15px;
      margin-top: 20px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      font-size: 12px;
    }
    .legend-color {
      width: 12px;
      height: 12px;
      margin-right: 6px;
      border-radius: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 30px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #eee;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f9f9f9;
      font-weight: bold;
      color: #55ad9b;
    }
    .footer {
      margin-top: 50px;
      font-size: 10px;
      text-align: center;
      color: #999;
    }
  </style>
`;

const generateBarChartSVG = (labels, data, color = '#4CAF50') => {
  const width = 600;
  const height = 300;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const maxVal = Math.max(...data, 5);
  const yStep = Math.ceil(maxVal / 5);
  const yMax = yStep * 5;

  let bars = '';
  let xLabels = '';
  let yLines = '';

  // Y-axis lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + chartHeight - (i / 5) * chartHeight;
    const val = i * yStep;
    yLines += `
      <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#eee" stroke-width="1" />
      <text x="${padding - 10}" y="${y + 4}" font-size="10" text-anchor="end" fill="#999">${val}</text>
    `;
  }

  const barWidth = (chartWidth / labels.length) * 0.7;
  const gap = (chartWidth / labels.length) * 0.3;

  labels.forEach((label, i) => {
    const val = data[i];
    const barHeight = (val / yMax) * chartHeight;
    const x = padding + i * (barWidth + gap) + gap / 2;
    const y = padding + chartHeight - barHeight;

    bars += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="2" />
      <text x="${x + barWidth / 2}" y="${y - 5}" font-size="10" text-anchor="middle" fill="#666">${val}</text>
    `;

    xLabels += `
      <text x="${x + barWidth / 2}" y="${padding + chartHeight + 15}" font-size="9" text-anchor="middle" fill="#666">${label}</text>
    `;
  });

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${yLines}
      ${bars}
      ${xLabels}
      <line x1="${padding}" y1="${padding + chartHeight}" x2="${width - padding}" y2="${padding + chartHeight}" stroke="#ccc" stroke-width="1" />
    </svg>
  `;
};

const generatePieChartSVG = (data) => {
  const size = 300;
  const radius = 100;
  const centerX = size / 2;
  const centerY = size / 2;
  const total = data.reduce((sum, item) => sum + item.population, 0);

  if (total === 0) return '<p>No data available</p>';

  let currentAngle = -Math.PI / 2;
  let paths = '';
  let legend = '';

  data.forEach((item) => {
    const sliceAngle = (item.population / total) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    
    const x1 = centerX + radius * Math.cos(currentAngle);
    const y1 = centerY + radius * Math.sin(currentAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    
    const pathData = `
      M ${centerX} ${centerY}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `;

    paths += `<path d="${pathData}" fill="${item.color}" stroke="#fff" stroke-width="2" />`;
    
    const percent = ((item.population / total) * 100).toFixed(1);
    const midAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + (radius * 0.7) * Math.cos(midAngle);
    const labelY = centerY + (radius * 0.7) * Math.sin(midAngle);
    
    if (item.population > 0) {
      paths += `<text x="${labelX}" y="${labelY}" fill="white" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${percent}%</text>`;
    }

    legend += `
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${item.color}"></div>
        <span>${item.name}: ${item.population}</span>
      </div>
    `;

    currentAngle = endAngle;
  });

  return `
    <div class="chart-container">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${paths}
      </svg>
      <div class="legend">${legend}</div>
    </div>
  `;
};

const generateLineChartSVG = (labels, datasets) => {
  const width = 700;
  const height = 350;
  const padding = 50;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const allValues = datasets.flatMap(d => d.data);
  const maxVal = Math.max(...allValues, 5);
  const yStep = Math.ceil(maxVal / 5);
  const yMax = yStep * 5;

  let lines = '';
  let points = '';
  let xLabels = '';
  let yLines = '';
  let legend = '';

  // Y-axis lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + chartHeight - (i / 5) * chartHeight;
    const val = i * yStep;
    yLines += `
      <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#eee" stroke-width="1" />
      <text x="${padding - 10}" y="${y + 4}" font-size="10" text-anchor="end" fill="#999">${val}</text>
    `;
  }

  const xStep = chartWidth / (labels.length - 1 || 1);

  datasets.forEach((dataset) => {
    let pathData = '';
    dataset.data.forEach((val, i) => {
      const x = padding + i * xStep;
      const y = padding + chartHeight - (val / yMax) * chartHeight;
      
      if (i === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }

      points += `<circle cx="${x}" cy="${y}" r="3" fill="${dataset.color}" />`;
    });

    lines += `<path d="${pathData}" fill="none" stroke="${dataset.color}" stroke-width="2" />`;
    
    legend += `
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${dataset.color}"></div>
        <span>${dataset.label}</span>
      </div>
    `;
  });

  labels.forEach((label, i) => {
    const x = padding + i * xStep;
    xLabels += `
      <text x="${x}" y="${padding + chartHeight + 20}" font-size="8" text-anchor="middle" fill="#666">${label}</text>
    `;
  });

  return `
    <div class="chart-container">
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${yLines}
        ${lines}
        ${points}
        ${xLabels}
        <line x1="${padding}" y1="${padding + chartHeight}" x2="${width - padding}" y2="${padding + chartHeight}" stroke="#ccc" stroke-width="1" />
      </svg>
      <div class="legend">${legend}</div>
    </div>
  `;
};

export const downloadChartPDF = async (chartName, data, viewType = null) => {
  try {
    const tupLogoBase64 = await loadImageAsBase64(require('../../assets/images/tup.png'));
    const mindfulLogoBase64 = await loadImageAsBase64(require('../../assets/images/login/logo.png'));

    let title = chartName;
    let subtitle = '';
    let chartHTML = '';
    let tableHTML = '';
    let summaryHTML = '';

    if (chartName === 'Monthly User Registrations') {
      title = 'Monthly User Registrations Report';
      chartHTML = `<div class="chart-container">${generateBarChartSVG(data.labels, data.datasets[0].data, '#4CAF50')}</div>`;
      
      const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
      const maxVal = Math.max(...data.datasets[0].data);
      const maxMonth = data.labels[data.datasets[0].data.indexOf(maxVal)];
      
      summaryHTML = `
        <div class="overall-summary">
          <h4>SUMMARY OVERVIEW</h4>
          <p>A total of <strong>${total}</strong> new users registered during this period. The highest registration activity occurred in <strong>${maxMonth}</strong> with <strong>${maxVal}</strong> new sign-ups.</p>
        </div>
      `;

      const rows = data.labels.map((label, index) => `
        <tr><td>${label}</td><td>${data.datasets[0].data[index]}</td></tr>
      `).join('');
      tableHTML = `<table><thead><tr><th>Month</th><th>New Registrations</th></tr></thead><tbody>${rows}</tbody></table>`;
    } 
    else if (chartName === 'Active vs Inactive Students') {
      title = 'Active vs Inactive Students Report';
      chartHTML = generatePieChartSVG(data);
      
      const total = data.reduce((sum, item) => sum + item.population, 0);
      const active = data.find(i => i.name === 'Active')?.population || 0;
      const inactive = data.find(i => i.name === 'Inactive')?.population || 0;
      const activePercent = total > 0 ? ((active / total) * 100).toFixed(1) : 0;

      summaryHTML = `
        <div class="overall-summary">
          <h4>SUMMARY OVERVIEW</h4>
          <p>Out of <strong>${total}</strong> total students, <strong>${active}</strong> (${activePercent}%) are currently active, while <strong>${inactive}</strong> remain inactive. Maintaining high student engagement is key to system effectiveness.</p>
        </div>
      `;

      const rows = data.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.population}</td>
          <td>${total > 0 ? ((item.population / total) * 100).toFixed(1) : 0}%</td>
        </tr>
      `).join('');
      tableHTML = `<table><thead><tr><th>Status</th><th>Count</th><th>Percentage</th></tr></thead><tbody>${rows}</tbody></table>`;
    } 
    else if (chartName === 'Weekly Logs by Category') {
      title = 'Categorical Logs Report';
      subtitle = `${viewType.charAt(0).toUpperCase() + viewType.slice(1)} | ${data.weekStart} - ${data.weekEnd}`;
      
      const totalActivity = data.activity.reduce((a, b) => a + b, 0);
      const totalSocial = data.social.reduce((a, b) => a + b, 0);
      const totalHealth = data.health.reduce((a, b) => a + b, 0);
      const totalSleep = data.sleep.reduce((a, b) => a + b, 0);
      const grandTotal = totalActivity + totalSocial + totalHealth + totalSleep;

      const totals = [
        { name: 'Activity', count: totalActivity },
        { name: 'Social', count: totalSocial },
        { name: 'Health', count: totalHealth },
        { name: 'Sleep', count: totalSleep }
      ];
      const topCategory = totals.reduce((max, curr) => curr.count > max.count ? curr : max, totals[0]);

      summaryHTML = `
        <div class="overall-summary">
          <h4>SUMMARY OVERVIEW</h4>
          <p>During this ${viewType} period, a total of <strong>${grandTotal}</strong> mood logs were recorded across all categories. The <strong>${topCategory.name}</strong> category was the most active with <strong>${topCategory.count}</strong> entries, representing <strong>${grandTotal > 0 ? ((topCategory.count / grandTotal) * 100).toFixed(1) : 0}%</strong> of all logs.</p>
        </div>
      `;

      const datasets = [
        { label: 'Activity', data: data.activity, color: '#2196F3' },
        { label: 'Social', data: data.social, color: '#E91E63' },
        { label: 'Health', data: data.health, color: '#4CAF50' },
        { label: 'Sleep', data: data.sleep, color: '#FF9800' }
      ];
      
      chartHTML = generateLineChartSVG(data.labels, datasets);
      
      const rows = data.labels.map((label, index) => `
        <tr>
          <td>${label}</td>
          <td>${data.activity[index] || 0}</td>
          <td>${data.social[index] || 0}</td>
          <td>${data.health[index] || 0}</td>
          <td>${data.sleep[index] || 0}</td>
        </tr>
      `).join('');
      tableHTML = `<table><thead><tr><th>Time Period</th><th>Activity</th><th>Social</th><th>Health</th><th>Sleep</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${generateStyles()}
      </head>
      <body>
        ${generateHeaderHTML(tupLogoBase64, mindfulLogoBase64, title, subtitle)}
        ${summaryHTML}
        ${chartHTML}
        ${tableHTML}
        <div class="footer">
          <p>Mindful Map - Admin Dashboard Report</p>
        </div>
      </body>
      </html>
    `;

    let filename = '';
    if (chartName === 'Weekly Logs by Category') {
      filename = `CategoricalLogsReport_${viewType.charAt(0).toUpperCase() + viewType.slice(1)}`;
    } else if (chartName === 'Monthly User Registrations') {
      filename = 'UserRegistrationsReport';
    } else if (chartName === 'Active vs Inactive Students') {
      filename = 'StudentStatusReport';
    } else {
      filename = chartName.replace(/\s+/g, '');
    }
    filename += `_${new Date().getTime()}.pdf`;

    const pdf = await Print.printToFileAsync({ html: htmlContent, base64: false });
    
    const docPath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.copyAsync({ from: pdf.uri, to: docPath });

    await Sharing.shareAsync(docPath, {
      mimeType: 'application/pdf',
      dialogTitle: `Save ${chartName}`,
    });

    return { success: true, path: docPath };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
