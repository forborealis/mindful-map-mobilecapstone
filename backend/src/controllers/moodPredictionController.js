const fetch = require('node-fetch');
const MoodLog = require('../models/MoodLog');

exports.predictMood = async (req, res) => {
    try {
        console.log("User ID from request:", req.user._id); 

        // Get the user's mood logs from the database
        const moodLogs = await MoodLog.find({ 
            user: req.user._id,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).select('mood moodScore date activities -_id');

        console.log("Retrieved mood logs:", moodLogs);

        if (moodLogs.length < 7) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient data for prediction. At least 7 mood entries are required.',
                currentEntries: moodLogs.length
            });
        }

        // Format logs for the Python service
        const formattedLogs = moodLogs.map(log => ({
            mood: log.mood.toLowerCase(),
            moodScore: log.moodScore,
            timestamp: log.date.toISOString(),
            activities: Array.isArray(log.activities) ? log.activities : []
        }));

        console.log("Formatted logs for Python service:", formattedLogs);

        // Forward the request to the Python service
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5003';
        const token = req.headers.authorization;
        
        // Instead of making a direct API call to the Python service, 
        // we'll just forward the user's token so the Python service can fetch the logs itself
        const pythonResponse = await fetch(`${pythonApiUrl}/api/predict-mood`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });

        const pythonData = await pythonResponse.json();
        console.log("Python service response:", pythonData);

        if (!pythonData.success) {
            return res.status(500).json({
                success: false,
                message: pythonData.message || 'Python service error',
                error: pythonData.error
            });
        }

        res.json({
            success: true,
            predictions: pythonData.predictions,
            insights: pythonData.insights
        });

    } catch (error) {
        console.error('Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating predictions',
            error: error.message
        });
    }
};

exports.getMoodLogs = async (req, res) => {
    try {
        const moodLogs = await MoodLog.find({ 
            user: req.user._id,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).select('mood moodScore date activities -_id');

        return res.status(200).json({
            success: true,
            logs: moodLogs.map(log => ({
                mood: log.mood,
                moodScore: log.moodScore, 
                date: log.date.toISOString(),
                activities: Array.isArray(log.activities) ? log.activities : []
            }))
        });
    } catch (error) {
        console.error('Error fetching mood logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching mood logs',
            error: error.message
        });
    }
};

exports.getMoodLogsForCategory = async (req, res) => {
    try {
        const moodLogs = await MoodLog.find({ 
            user: req.user._id,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).select('category activity hrs afterEmotion afterValence afterIntensity afterReason date -_id');

        return res.status(200).json({
            success: true,
            logs: moodLogs.map(log => ({
                category: log.category,
                activity: log.activity,
                hrs: log.hrs,
                afterEmotion: log.afterEmotion,
                afterValence: log.afterValence,
                afterIntensity: log.afterIntensity,
                afterReason: log.afterReason,
                timestamp: log.date.toISOString()
            }))
        });
    } catch (error) {
        console.error('Error fetching category mood logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching category mood logs',
            error: error.message
        });
    }
};

exports.predictCategoryMood = async (req, res) => {
    try {
        const { category } = req.query;
        
        if (!category || !['activity', 'social', 'health', 'sleep'].includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category. Must be one of: activity, social, health, sleep'
            });
        }

        // Forward the request to the Python service
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5003';
        const token = req.headers.authorization;
        
        const pythonResponse = await fetch(`${pythonApiUrl}/api/predict-category-mood?category=${category}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });

        const pythonData = await pythonResponse.json();
        console.log("Python service response:", pythonData);

        if (!pythonData.success) {
            return res.status(500).json({
                success: false,
                message: pythonData.message || 'Python service error',
                error: pythonData.error
            });
        }

        res.json({
            success: true,
            category: pythonData.category,
            predictions: pythonData.predictions,
            dateRange: pythonData.date_range
        });

    } catch (error) {
        console.error('Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating category predictions',
            error: error.message
        });
    }
};

exports.checkCategoryData = async (req, res) => {
    try {
        // Forward the request to the Python service
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5003';
        const token = req.headers.authorization;
        
        const pythonResponse = await fetch(`${pythonApiUrl}/api/check-category-data`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });

        const pythonData = await pythonResponse.json();
        console.log("Python service response:", pythonData);

        if (!pythonData.success) {
            return res.status(500).json({
                success: false,
                message: pythonData.message || 'Python service error',
                error: pythonData.error
            });
        }

        res.json({
            success: true,
            availability: pythonData.availability
        });

    } catch (error) {
        console.error('Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while checking category data',
            error: error.message
        });
    }
};