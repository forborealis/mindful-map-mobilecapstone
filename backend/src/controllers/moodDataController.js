const MoodLog = require('../models/MoodLog');
const User = require('../models/User');
const moment = require('moment');

const MoodDataController = {
  async getAllMoodLogs(req, res) {
    try {
      const moodLogs = await MoodLog.find()
        .populate('user', 'email firstName lastName')
        .sort({ date: -1 });
        
      res.json({
        success: true,
        moodLogs
      });
    } catch (error) {
      console.error('Error fetching all mood logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch mood logs'
      });
    }
  },

  async getUserMoodLogs(req, res) {
    try {
      const { userId } = req.params; 
      console.log('🔍 Looking for user with Firebase UID:', userId);

      const user = await User.findOne({ firebaseUid: userId });
      
      if (!user) {
        console.error('User not found with Firebase UID:', userId);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const skip = (page - 1) * limit;

      const moodLogs = await MoodLog.find({ user: user._id })
        .sort({ date: -1 })
        .limit(limit)
        .skip(skip)
        .populate('user', 'email firstName lastName'); 

      const totalCount = await MoodLog.countDocuments({ user: user._id }); 

      res.json({
        success: true,
        moodLogs,
        pagination: {
          total: totalCount,
          page: page,
          limit: limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching mood logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch mood logs'
      });
    }
  },

  async getMoodLogById(req, res) {
    try {
      const { id } = req.params;
      
      const moodLog = await MoodLog.findById(id)
        .populate('user', 'email firstName lastName');
      
      if (!moodLog) {
        return res.status(404).json({
          success: false,
          error: 'Mood log not found'
        });
      }

      res.json({
        success: true,
        moodLog
      });

    } catch (error) {
      console.error('Error fetching mood log by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch mood log'
      });
    }
  },

  async getUserMoodStats(req, res) {
    try {
      const { userId } = req.params; 
      console.log('Getting stats for Firebase UID:', userId);

      const user = await User.findOne({ firebaseUid: userId });
      
      if (!user) {
        console.error('User not found with Firebase UID:', userId);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const moodLogs = await MoodLog.find({ user: user._id }); 

      const totalLogs = moodLogs.length;
      
      if (totalLogs === 0) {
        return res.json({
          success: true,
          stats: {
            totalLogs: 0,
            averages: {
              beforeIntensity: 0,
              afterIntensity: 0,
              improvement: 0
            },
            improvements: 0,
            categories: {},
            recentTrend: 'neutral'
          }
        });
      }

      const validBeforeLogs = moodLogs.filter(log => log.beforeIntensity !== undefined && log.beforeIntensity !== null);
      const validAfterLogs = moodLogs.filter(log => log.afterIntensity !== undefined && log.afterIntensity !== null);

      const avgBeforeIntensity = validBeforeLogs.length > 0 
        ? validBeforeLogs.reduce((sum, log) => sum + log.beforeIntensity, 0) / validBeforeLogs.length 
        : 0;

      const avgAfterIntensity = validAfterLogs.length > 0
        ? validAfterLogs.reduce((sum, log) => sum + log.afterIntensity, 0) / validAfterLogs.length
        : 0;
      
      const improvements = moodLogs.filter(log => 
        log.afterIntensity && log.beforeIntensity && 
        log.afterIntensity > log.beforeIntensity
      ).length;
      
      const improvementPercentage = totalLogs > 0 ? Math.round((improvements / totalLogs) * 100) : 0;

      const categories = {};
      moodLogs.forEach(log => {
        if (!categories[log.category]) {
          categories[log.category] = 0;
        }
        categories[log.category]++;
      });

      const recentLogs = moodLogs.slice(0, 7);
      let recentTrend = 'neutral';
      if (recentLogs.length >= 3) {
        const recentAvgAfter = recentLogs.reduce((sum, log) => sum + (log.afterIntensity || 0), 0) / recentLogs.length;
        const recentAvgBefore = recentLogs.reduce((sum, log) => sum + (log.beforeIntensity || 0), 0) / recentLogs.length;
        
        if (recentAvgAfter > recentAvgBefore + 0.5) {
          recentTrend = 'improving';
        } else if (recentAvgAfter < recentAvgBefore - 0.5) {
          recentTrend = 'declining';
        }
      }

      res.json({
        success: true,
        stats: {
          totalLogs,
          averages: {
            beforeIntensity: Math.round(avgBeforeIntensity * 10) / 10,
            afterIntensity: Math.round(avgAfterIntensity * 10) / 10,
            improvement: Math.round((avgAfterIntensity - avgBeforeIntensity) * 10) / 10
          },
          improvements: improvementPercentage,
          categories,
          recentTrend
        }
      });

    } catch (error) {
      console.error('Error fetching mood stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch mood stats'
      });
    }
  },

  async saveMood(req, res) {
    try {
      const { 
        category, 
        activity, 
        hrs, 
        beforeValence, 
        beforeEmotion, 
        beforeIntensity,
        beforeReason, 
        afterValence, 
        afterEmotion, 
        afterIntensity,
        afterReason,
        selectedDate,
        selectedTime
      } = req.body;

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No user found in request.' });
      }

      // Validate required fields
      if (!category || !['activity', 'social', 'health', 'sleep'].includes(category)) {
        return res.status(400).json({ success: false, message: 'Valid category is required (activity, social, health, sleep).' });
      }

      if (!beforeValence || !afterValence) {
        return res.status(400).json({ success: false, message: 'Before and after valence are required.' });
      }

      if (!afterEmotion || !afterIntensity || !afterReason) {
        return res.status(400).json({ success: false, message: 'After emotion, intensity, and reason are required.' });
      }

      // Validate category-specific fields
      if (category === 'sleep') {
        if (!hrs || typeof hrs !== 'number') {
          return res.status(400).json({ success: false, message: 'Valid sleep hours is required for sleep category.' });
        }
      } else {
        if (!activity) {
          return res.status(400).json({ success: false, message: 'Activity is required for non-sleep categories.' });
        }
      }

      // Validate before emotion and intensity if not "can't remember"
      if (beforeValence !== 'can\'t remember') {
        if (!beforeEmotion || !beforeIntensity || !beforeReason) {
          return res.status(400).json({ success: false, message: 'Before emotion, intensity, and reason are required when before valence is not "can\'t remember".' });
        }
      }

      const now = new Date();
      
      // Use selectedTime if provided, otherwise selectedDate with current time, otherwise current date/time
      let logDate = now;
      if (selectedTime && category !== 'sleep') {
        logDate = new Date(selectedTime);
      } else if (selectedDate) {
        const dateParts = selectedDate.split('-');
        if (category === 'sleep') {
          logDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0, 0);
        } else {
          logDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), now.getHours(), now.getMinutes(), now.getSeconds());
        }
      } else {
        if (category === 'sleep') {
          logDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
        }
      }

      // For sleep category, check if there's already an entry today and update it
      if (category === 'sleep') {
        const startOfDay = new Date(logDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(logDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingSleepLog = await MoodLog.findOne({
          user: req.user._id,
          category: 'sleep',
          date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existingSleepLog) {
          existingSleepLog.hrs = hrs;
          existingSleepLog.beforeValence = beforeValence;
          existingSleepLog.beforeEmotion = beforeValence !== 'can\'t remember' ? beforeEmotion : null;
          existingSleepLog.beforeIntensity = beforeValence !== 'can\'t remember' ? beforeIntensity : 0;
          existingSleepLog.beforeReason = beforeValence !== 'can\'t remember' ? beforeReason : null;
          existingSleepLog.afterValence = afterValence;
          existingSleepLog.afterEmotion = afterEmotion;
          existingSleepLog.afterIntensity = afterIntensity;
          existingSleepLog.afterReason = afterReason;

          await existingSleepLog.save();

          return res.status(200).json({ 
            success: true, 
            message: 'Sleep log updated successfully.',
            log: existingSleepLog
          });
        }
      }

      // Create new mood log entry
      const newMoodLog = new MoodLog({
        user: req.user._id,
        date: logDate,
        category,
        activity: category !== 'sleep' ? activity : undefined,
        hrs: category === 'sleep' ? hrs : undefined,
        beforeValence,
        beforeEmotion: beforeValence !== 'can\'t remember' ? beforeEmotion : null,
        beforeIntensity: beforeValence !== 'can\'t remember' ? beforeIntensity : 0,
        beforeReason: beforeValence !== 'can\'t remember' ? beforeReason : null,
        afterValence,
        afterEmotion,
        afterIntensity,
        afterReason
      });

      await newMoodLog.save();

      res.status(200).json({ 
        success: true, 
        message: 'Mood log saved successfully.',
        log: newMoodLog
      });
    } catch (error) {
      console.error('Error saving mood log:', error);
      res.status(500).json({ success: false, message: 'Server error while saving mood log.' });
    }
  },

  async getTodaysLastMoodLog(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No user found in request.' });
      }

      const { category, date } = req.query;

      // Get date range - use provided date or today
      let targetDate = new Date();
      if (date) {
        const dateParts = date.split('-');
        targetDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      }
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Build query
      const query = {
        user: req.user._id,
        date: { $gte: startOfDay, $lte: endOfDay }
      };

      // If category is specified, filter by category
      if (category) {
        query.category = category;
      }

      // Find all mood logs for the specified date (optionally filtered by category)
      const todaysMoodLogs = await MoodLog.find(query).sort({ date: -1 });

      if (!todaysMoodLogs.length) {
        return res.status(200).json({ 
          success: false, 
          message: category 
            ? `No previous mood logs found for ${category} category today` 
            : 'No previous mood logs found for today',
          lastLog: null 
        });
      }

      // Return the most recent log from today
      const lastMoodLog = todaysMoodLogs[0];

      res.status(200).json({ 
        success: true, 
        lastLog: lastMoodLog 
      });
    } catch (error) {
      console.error('Error fetching today\'s last mood log:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching today\'s last mood log.' });
    }
  },

  async getTodaysSleepLog(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No user found in request.' });
      }

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(now);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const sleepLog = await MoodLog.findOne({
        user: req.user._id,
        category: 'sleep',
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (!sleepLog) {
        return res.status(200).json({ 
          success: false, 
          message: 'No sleep log found for today',
          sleepLog: null 
        });
      }

      res.status(200).json({ 
        success: true, 
        sleepLog 
      });
    } catch (error) {
      console.error('Error fetching today\'s sleep log:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching today\'s sleep log.' });
    }
  },

  async checkMoodLogs(req, res) {
    try {
      const userId = req.user._id;

      const startOfCurrentWeek = moment().startOf('isoWeek');

      // Get the last two full weeks before the current week
      const startOfLastWeek = moment(startOfCurrentWeek).subtract(1, 'weeks');
      const endOfLastWeek = moment(startOfCurrentWeek).subtract(1, 'days');
      const startOfTwoWeeksAgo = moment(startOfCurrentWeek).subtract(2, 'weeks');
      const endOfTwoWeeksAgo = moment(startOfLastWeek).subtract(1, 'days');

      const logsLastWeek = await MoodLog.find({
        user: userId,
        date: { $gte: startOfLastWeek.toDate(), $lte: endOfLastWeek.toDate() }
      });

      const logsTwoWeeksAgo = await MoodLog.find({
        user: userId,
        date: { $gte: startOfTwoWeeksAgo.toDate(), $lte: endOfTwoWeeksAgo.toDate() }
      });

      // Count unique days logged in each week
      const uniqueDaysLastWeek = new Set(logsLastWeek.map(log => moment(log.date).format('YYYY-MM-DD')));
      const uniqueDaysTwoWeeksAgo = new Set(logsTwoWeeksAgo.map(log => moment(log.date).format('YYYY-MM-DD')));

      const hasLogsLastWeek = uniqueDaysLastWeek.size > 0;
      const hasLogsTwoWeeksAgo = uniqueDaysTwoWeeksAgo.size > 0;

      // Check if user skipped 2 full consecutive weeks
      const skippedTwoWeeks = !hasLogsLastWeek && !hasLogsTwoWeeksAgo;

      res.json({
        success: true,
        allowAccess: !skippedTwoWeeks, 
        skippedTwoWeeks,
        logsLastWeek: uniqueDaysLastWeek.size,
        logsTwoWeeksAgo: uniqueDaysTwoWeeksAgo.size,
      });

    } catch (error) {
      console.error('Error checking mood logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking mood logs',
        error: error.message
      });
    }
  },

  async getPaginatedMoodLogs(req, res) {
    try {
      const { month, year, page = 0, limit = 4, category } = req.query;
      const skip = page * limit;

      // Build query
      const query = {
        user: req.user._id,
        date: {
          $gte: new Date(year, month - 1, 1),
          $lt: new Date(year, month, 1)
        }
      };

      // Add category filter if specified
      if (category) {
        query.category = category;
      }

      const moodLogs = await MoodLog.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      res.status(200).json(moodLogs);
    } catch (error) {
      console.error('Error fetching paginated mood logs:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching paginated mood logs.' });
    }
  },

  async getMoodLogsByCategory(req, res) {
    try {
      const { category } = req.params;
      
      if (!['activity', 'social', 'health', 'sleep'].includes(category)) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }

      const moodLogs = await MoodLog.find({ 
        user: req.user._id, 
        category 
      }).sort({ date: -1 });

      res.status(200).json(moodLogs);
    } catch (error) {
      console.error('Error fetching mood logs by category:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching mood logs by category.' });
    }
  }
};

module.exports = MoodDataController;