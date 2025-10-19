const MoodLog = require('../models/MoodLog');
const User = require('../models/User');

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
  }
};

module.exports = MoodDataController;