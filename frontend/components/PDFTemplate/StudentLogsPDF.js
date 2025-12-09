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

function formatTimestamp(date) {
  const logDate = new Date(date);
  const dateStr = logDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  // Always 2-digit hour and minute, 12-hour format, with trailing zero if needed
  let hours = logDate.getHours();
  const minutes = logDate.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hourStr = hours < 10 ? `0${hours}` : `${hours}`;
  const minuteStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const timeStr = `${hourStr}:${minuteStr}${ampm}`;
  return `${dateStr} ${timeStr}`;
}

function beautifyName(name) {
  if (!name) return '';
  let str = name.replace(/-/g, ' ');
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const activityMap = {
  // Activity category
  'commute': 'Commute',
  'exam': 'Exam',
  'homework': 'Homework',
  'study': 'Study',
  'project': 'Project',
  'read': 'Read',
  'extracurricular': 'Extracurricular Activities',
  'household-chores': 'Household Chores',
  'relax': 'Relax',
  'watch-movie': 'Watch Movie',
  'listen-music': 'Listen to Music',
  'gaming': 'Gaming',
  'browse-internet': 'Browse the Internet',
  'shopping': 'Shopping',
  'travel': 'Travel',
  
  // Social category
  'alone': 'Alone',
  'friends': 'Friend/s',
  'family': 'Family',
  'classmates': 'Classmate/s',
  'relationship': 'Relationship',
  'online': 'Online Interaction',
  'pet': 'Pet',
  
  // Health category
  'jog': 'Jog',
  'walk': 'Walk',
  'exercise': 'Exercise',
  'sports': 'Sports',
  'meditate': 'Meditate',
  'eat-healthy': 'Eat Healthy',
  'no-physical': 'No Physical Activity',
  'eat-unhealthy': 'Eat Unhealthy',
  'drink-alcohol': 'Drink Alcohol',
};

function getActivityName(activityId) {
  return activityMap[activityId] || beautifyName(activityId);
}

export async function generateStudentLogsPDF(student, logs) {
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

    // Calculate statistics
    const totalLogs = logs ? logs.length : 0;
    const categoryCount = {
      activity: 0,
      social: 0,
      health: 0,
      sleep: 0
    };
    const emotionCountBefore = {};
    const emotionCountAfter = {};
    
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        // Count by category
        if (categoryCount.hasOwnProperty(log.category)) {
          categoryCount[log.category]++;
        }
        
        // Count emotions before
        if (log.beforeEmotion) {
          emotionCountBefore[log.beforeEmotion] = (emotionCountBefore[log.beforeEmotion] || 0) + 1;
        }
        
        // Count emotions after
        if (log.afterEmotion) {
          emotionCountAfter[log.afterEmotion] = (emotionCountAfter[log.afterEmotion] || 0) + 1;
        }
      });
    }

    // Get top emotions
    const topEmotionBefore = Object.keys(emotionCountBefore).length > 0
      ? Object.entries(emotionCountBefore).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'N/A';
    
    const topEmotionAfter = Object.keys(emotionCountAfter).length > 0
      ? Object.entries(emotionCountAfter).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'N/A';

    // Get most logged category
    const mostCategory = Object.entries(categoryCount).length > 0
      ? Object.entries(categoryCount).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'N/A';

    // Estimate page count: ~25 rows per page (A4), accounting for header/stats/margins
    const rowsPerPage = 25;
    const estimatedPages = Math.max(1, Math.ceil(totalLogs / rowsPerPage));

    let tableHTML = '';
    if (logs && logs.length > 0) {
      tableHTML = logs.map((log, idx) => `
        <tr style="${idx % 2 === 0 ? 'background: #fafafa;' : ''}">
          <td>${formatTimestamp(log.date)}</td>
          <td>${beautifyName(log.category)}</td>
          <td>${log.category === 'sleep' ? `${log.hrs} hours` : getActivityName(log.activity) || 'N/A'}</td>
          <td>${beautifyName(log.beforeValence || 'N/A')}</td>
          <td>${beautifyName(log.beforeEmotion || 'N/A')}</td>
          <td style="text-align: center;">${log.beforeIntensity || '—'}</td>
          <td>${beautifyName(log.afterValence || 'N/A')}</td>
          <td>${beautifyName(log.afterEmotion || 'N/A')}</td>
          <td style="text-align: center;">${log.afterIntensity || '—'}</td>
        </tr>
      `).join('');
    } else {
      tableHTML = `
        <tr>
          <td colspan="9" style="padding: 30px; text-align: center; font-size: 13px; color: #999; font-style: italic;">
            No mood logs available for this student.
          </td>
        </tr>
      `;
    }

    // HTML content with professional design
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
            padding: 40px 30px 50px 30px;
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
            page-break-after: avoid;
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
            font-size: 12px;
            color: #666;
            text-align: center;
            margin: 12px 0 0 0;
          }
          .divider {
            border: none;
            border-top: 1px solid #55ad9b;
            margin: 20px 0 30px 0;
            page-break-after: avoid;
          }
          .report-title {
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            color: #000;
            margin: 0 0 8px 0;
            letter-spacing: 0.5px;
            page-break-after: avoid;
          }
          .student-info {
            background: #f0f8ff;
            border-radius: 12px;
            padding: 18px;
            margin: 20px 0 30px 0;
            border: 1px solid #d0e7ff;
            page-break-inside: avoid;
          }
          .student-info-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-bottom: 0;
          }
          .student-info-item {
            font-size: 13px;
            color: #3c3c3c;
          }
          .student-info-label {
            font-weight: 600;
            color: #55ad9b;
            margin-bottom: 2px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .student-info-value {
            font-size: 13px;
            color: #000;
            font-weight: 500;
          }
          .stats-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 30px 0;
            page-break-inside: avoid;
          }
          .stat-card {
            background: white;
            border-radius: 12px;
            padding: 18px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            text-align: center;
            page-break-inside: avoid;
          }
          .stat-label {
            font-size: 11px;
            color: #666;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #55ad9b;
            margin-bottom: 4px;
          }
          .stat-detail {
            font-size: 13px;
            color: #3c3c3c;
            font-weight: 500;
          }
          .table-container {
            overflow-x: auto;
            margin-top: 40px;
            margin-bottom: 40px;
            padding-top: 40px;
            padding-bottom: 40px;
            border-top: 1px solid transparent;
            border-bottom: 1px solid transparent;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          thead {
            background: #55ad9b;
            color: white;
            display: table-header-group;
          }
          tbody {
            display: table-row-group;
          }
          th {
            padding: 12px 10px;
            font-size: 9px;
            font-weight: 600;
            text-align: left;
            border-bottom: 2px solid #55ad9b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 10px;
            font-size: 9px;
            border-bottom: 1px solid #e0e0e0;
            color: #3c3c3c;
          }
          tr {
            page-break-inside: avoid;
          }
          .col-timestamp { width: 17%; }
          .col-category { width: 10%; }
          .col-activity { width: 12%; }
          .col-emotion { width: 10%; }
          .col-intensity { width: 8%; }
          .col-valence { width: 11%; }
          /* Footer and page number styles removed */
          .empty-state {
            text-align: center;
            padding: 40px;
            color: #999;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
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
        
        <!-- Report Title -->
        <h1 class="report-title">Student Mood Logs Report</h1>
        
        <!-- Student Information -->
        <div class="student-info">
          <div class="student-info-row">
            <div class="student-info-item">
              <div class="student-info-label">Student Name</div>
              <div class="student-info-value">${student.firstName} ${student.lastName}</div>
            </div>
            <div class="student-info-item">
              <div class="student-info-label">Email</div>
              <div class="student-info-value">${student.email}</div>
            </div>
            <div class="student-info-item">
              <div class="student-info-label">Section</div>
              <div class="student-info-value">${student.section || 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
        ${totalLogs > 0 ? `
          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-label">Activity Logs</div>
              <div class="stat-value">${categoryCount.activity}</div>
              <div class="stat-detail">entries</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Social Logs</div>
              <div class="stat-value">${categoryCount.social}</div>
              <div class="stat-detail">entries</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Health Logs</div>
              <div class="stat-value">${categoryCount.health}</div>
              <div class="stat-detail">entries</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Sleep Logs</div>
              <div class="stat-value">${categoryCount.sleep}</div>
              <div class="stat-detail">entries</div>
            </div>
          </div>

          <div class="stats-container" style="grid-template-columns: repeat(3, 1fr);">
            <div class="stat-card">
              <div class="stat-label">Top Emotion Before</div>
              <div class="stat-value">${beautifyName(topEmotionBefore)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Top Emotion After</div>
              <div class="stat-value">${beautifyName(topEmotionAfter)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Overall</div>
              <div class="stat-value">${totalLogs}</div>
              <div class="stat-detail">mood entries</div>
            </div>
          </div>
        ` : ''}

        <!-- Logs Table -->
        ${totalLogs > 0 ? `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th class="col-timestamp">Timestamp</th>
                  <th class="col-category">Category</th>
                  <th class="col-activity">Activity</th>
                  <th class="col-valence">Before Valence</th>
                  <th class="col-emotion">Before Emotion</th>
                  <th class="col-intensity">Before Intensity</th>
                  <th class="col-valence">After Valence</th>
                  <th class="col-emotion">After Emotion</th>
                  <th class="col-intensity">After Intensity</th>
                </tr>
              </thead>
              <tbody>
                ${tableHTML}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <p>No mood logs available for this student.</p>
          </div>
        `}

        <!-- Footer and page number removed -->
      </body>
      </html>
    `;

    return htmlContent;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export async function downloadStudentLogsPDF(student, logs) {
  try {
    // Generate HTML content
    const htmlContent = await generateStudentLogsPDF(student, logs);

    // Create filename
    const filename = `${student.firstName}_${student.lastName}_MoodLogs.pdf`;

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
      dialogTitle: 'Save Student Mood Logs',
    });

    return { success: true, filename: filename, path: docPath };
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}
