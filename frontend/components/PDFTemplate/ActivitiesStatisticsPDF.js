import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';

const pieColors = [
  '#8FABD4', '#59AC77', '#FF714B', '#f7b40bff', '#F564A9',
  '#A9A9A9', '#092b9cff', '#4e4d4dff', '#cc062dff', '#fdf8fdff'
];

const categoryColors = {
  Activity: '#0ea5e9',
  Social: '#f9952b',
  Health: '#22c55e',
  Sleep: '#6366f1',
};

function beautifyName(name) {
  if (!name) return '';
  let str = name.replace(/-/g, ' ');
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSummaryPhrase(title, data) {
  if (!data || data.length === 0) return `No data for this category.`;
  const top = data[0];
  if (!top) return `No data for this category.`;
  if (title === 'Sleep') {
    return `Most students logged "${beautifyName(top.name)}" hours of sleep most often (${top.count} times, ${top.percent}%). Getting enough sleep is important for your mood and focus!`;
  }
  if (top.percent >= 50) {
    return `The activity "${beautifyName(top.name)}" made up more than half of your logs for this category (${top.count} times, ${top.percent}%).`;
  }
  if (top.percent >= 30) {
    return `"${beautifyName(top.name)}" was the most common in this category (${top.count} times, ${top.percent}%).`;
  }
  return `You did "${beautifyName(top.name)}" most often in this category (${top.count} times, ${top.percent}%).`;
}

function getOverallSummary(breakdowns) {
  const categoryCounts = Object.entries(breakdowns).map(([category, data]) => ({
    category,
    total: data.reduce((sum, item) => sum + item.count, 0)
  }));
  
  const maxCategory = categoryCounts.reduce((max, curr) => 
    curr.total > max.total ? curr : max, 
    categoryCounts[0]
  );
  
  if (!maxCategory || maxCategory.total === 0) {
    return 'No activities recorded during this period.';
  }
  
  return `The "${maxCategory.category}" category had the most recorded activities with ${maxCategory.total} total entries across this period.`;
}

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

function generatePieChartHTML(data, colors, total) {
  if (total === 0) return '';

  const size = 140;
  const radius = size / 2;
  const innerRadius = radius * 0.68;
  const centerX = radius;
  const centerY = radius;

  let currentAngle = -Math.PI / 2;
  let paths = '';
  let labels = '';

  data.forEach((item, idx) => {
    const percent = item.count / total;
    const sliceAngle = percent * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    const midAngle = currentAngle + sliceAngle / 2;
    const color = colors[idx % colors.length];

    let path;

    // Handle full circle (single item) by drawing a complete donut
    if (Math.abs(sliceAngle - 2 * Math.PI) < 0.001) {
      // Draw a complete circle by using two arcs that together make 360 degrees
      const angle1 = currentAngle;
      const angle2 = currentAngle + Math.PI;
      const angle3 = currentAngle + 2 * Math.PI;
      
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      
      const ix1 = centerX + innerRadius * Math.cos(angle1);
      const iy1 = centerY + innerRadius * Math.sin(angle1);
      const ix2 = centerX + innerRadius * Math.cos(angle2);
      const iy2 = centerY + innerRadius * Math.sin(angle2);

      // Create path with two semi-circles
      path = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 0 1 ${x2} ${y2}
        A ${radius} ${radius} 0 0 1 ${x1} ${y1}
        L ${ix1} ${iy1}
        A ${innerRadius} ${innerRadius} 0 0 0 ${ix2} ${iy2}
        A ${innerRadius} ${innerRadius} 0 0 0 ${ix1} ${iy1}
        Z
      `;
    } else {
      // Regular arc path for partial slices
      const startX = centerX + radius * Math.cos(currentAngle);
      const startY = centerY + radius * Math.sin(currentAngle);
      const endX = centerX + radius * Math.cos(endAngle);
      const endY = centerY + radius * Math.sin(endAngle);
      const innerStartX = centerX + innerRadius * Math.cos(currentAngle);
      const innerStartY = centerY + innerRadius * Math.sin(currentAngle);
      const innerEndX = centerX + innerRadius * Math.cos(endAngle);
      const innerEndY = centerY + innerRadius * Math.sin(endAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
      
      path = `
        M ${startX} ${startY}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
        L ${innerEndX} ${innerEndY}
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}
        Z
      `;
    }

    paths += `<path d="${path}" fill="${color}" />`;

    // Place count labels on the outer edge of slices
    const labelX = centerX + (radius * 0.85) * Math.cos(midAngle);
    const labelY = centerY + (radius * 0.85) * Math.sin(midAngle);
    
    labels += `<text x="${labelX}" y="${labelY}" fill="white" font-size="11" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${item.count}</text>`;

    currentAngle = endAngle;
  });

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      ${paths}
      <circle cx="${centerX}" cy="${centerY}" r="${innerRadius}" fill="white" />
      ${labels}
      <text x="${centerX}" y="${centerY - 5}" fill="#55AD9B" font-size="16" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${total}</text>
      <text x="${centerX}" y="${centerY + 8}" fill="#666" font-size="10" font-weight="600" text-anchor="middle" dominant-baseline="middle">total</text>
    </svg>
  `;
}

export async function generateActivitiesStatisticsPDF(emotion, moodType, moodPeriod, breakdowns) {
  try {
    // Load logos
    const tupLogoBase64 = await loadImageAsBase64(require('../../assets/images/tup.png'));
    const mindfulLogoBase64 = await loadImageAsBase64(require('../../assets/images/login/logo.png'));

    // Get timestamp
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Get overall summary
    const overallSummary = getOverallSummary(breakdowns);

    // Prepare sections data
    const sectionsData = [
      { title: 'Activity', data: breakdowns.Activity || [] },
      { title: 'Social', data: breakdowns.Social || [] },
      { title: 'Health', data: breakdowns.Health || [] },
    ];

    if (moodType === 'after') {
      sectionsData.push({ title: 'Sleep', data: breakdowns.Sleep || [] });
    }

    // Generate charts HTML - 2 columns per row like web version
    let chartsHTML = '';
    
    for (let i = 0; i < sectionsData.length; i += 2) {
      chartsHTML += '<div style="display: flex; gap: 20px; margin-bottom: 30px; page-break-inside: avoid;">';
      
      for (let j = 0; j < 2; j++) {
        const sectionIndex = i + j;
        if (sectionIndex >= sectionsData.length) {
          chartsHTML += '<div style="flex: 1;"></div>';
          continue;
        }

        const section = sectionsData[sectionIndex];
        const color = categoryColors[section.title];
        const total = section.data.reduce((sum, item) => sum + item.count, 0);
        const summary = getSummaryPhrase(section.title, section.data);
        const chartHTML = generatePieChartHTML(section.data, pieColors, total);

        chartsHTML += `
          <div style="flex: 1; background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
            <!-- Header with title -->
            <div style="margin-bottom: 12px;">
              <h3 style="color: ${color}; margin: 0; font-size: 18px; font-weight: bold;">${section.title}</h3>
            </div>
            
            <!-- Summary phrase -->
            <div style="background: #fafafa; border-radius: 8px; border: 1px solid #e0e7ef; padding: 10px 12px; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 11px; color: #272829; line-height: 1.5;">${summary}</p>
            </div>

            ${section.data.length > 0 ? `
              <!-- Chart and Legend side by side -->
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px;">
                <!-- Pie Chart -->
                <div style="flex-shrink: 0;">
                  ${chartHTML}
                </div>

                <!-- Legend on the right -->
                <div style="flex: 1; min-width: 0;">
                  ${section.data.map((item, idx) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; padding: 2px 0;">
                      <div style="display: flex; align-items: center; flex: 1; min-width: 0;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${pieColors[idx % pieColors.length]}; margin-right: 8px; flex-shrink: 0;"></div>
                        <span style="font-size: 10px; font-weight: 600; color: ${color}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${beautifyName(item.name)}</span>
                      </div>
                      <span style="font-size: 10px; font-weight: normal; color: #000; margin-left: 8px; white-space: nowrap;">${item.count} (${item.percent}%)</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : `
              <p style="text-align: center; color: #999; font-size: 12px; font-style: italic; margin: 20px 0;">No data for this category.</p>
            `}
          </div>
        `;
      }
      
      chartsHTML += '</div>';
    }

    // HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 40px 30px;
            background: #fcfcfcff;
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
          .logo {
            width: 60px;
            height: 60px;
            flex-shrink: 0;
          }
          .header-center {
            flex: 1;
            text-align: center;
          }
          .system-title {
            font-size: 22px;
            font-weight: bold;
            color: #55ad9b;
            margin: 0 0 4px 0;
            letter-spacing: 0.5px;
          }
          .system-subtitle {
            font-size: 15px;
            font-weight: 600;
            color: #55ad9b;
            margin: 0;
            letter-spacing: 0.3px;
          }
          .timestamp {
            font-size: 12px;
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
            margin-bottom: 30px;
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
            line-height: 1.6;
            margin: 0;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 11px;
            color: #999;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${tupLogoBase64}" alt="TUP Logo" class="logo" />
          <div class="header-center">
            <div class="system-title">Mindful Map: Mood and Habits Analyzer</div>
            <div class="system-subtitle">for Emotional Regulation</div>
          </div>
          <img src="${mindfulLogoBase64}" alt="Mindful Map Logo" class="logo" />
        </div>
        
        <div class="timestamp">Generated: ${timestamp}</div>
        
        <hr class="divider" />
        
        <h1 class="report-title">Activities Report: ${beautifyName(emotion)}</h1>
        <p class="report-meta">${moodType === 'before' ? 'Before' : 'After'} Emotion · ${moodPeriod.charAt(0).toUpperCase() + moodPeriod.slice(1)} Period</p>
        
        <div class="overall-summary">
          <h4>Overall Summary</h4>
          <p>${overallSummary}</p>
        </div>
        
        ${chartsHTML}
        
        <div class="footer">
          This report was automatically generated by Mindful Map system.
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export async function downloadActivitiesStatisticsPDF(emotion, moodType, moodPeriod, breakdowns) {
  try {
    // Generate HTML content
    const htmlContent = await generateActivitiesStatisticsPDF(emotion, moodType, moodPeriod, breakdowns);

    // Create filename
    const emotionCamel = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    const moodTypeCamel = moodType.charAt(0).toUpperCase() + moodType.slice(1);
    const periodCamel = moodPeriod.charAt(0).toUpperCase() + moodPeriod.slice(1);
    const filename = `ActivitiesReport_${emotionCamel}_${moodTypeCamel}_${periodCamel}.pdf`;

    // Generate PDF from HTML using expo-print
    const pdf = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      filename: filename.replace('.pdf', ''),
    });

    // Save to document directory
    const docPath = `${FileSystem.documentDirectory}${filename}`;
    
    // Copy PDF from temporary location to document directory
    await FileSystem.copyAsync({
      from: pdf.uri,
      to: docPath,
    });

    // Share the file (user can save to Downloads from here)
    await Sharing.shareAsync(docPath, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save Activities Report',
    });

    return { success: true, filename: filename, path: docPath };
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}
