const mongoose = require("mongoose");

const breathingExerciseSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  streak: { 
    type: Number, 
    default: 0 
  },
  totalSessions: { 
    type: Number, 
    default: 0 
  },
  lastSession: { 
    type: Date, 
    default: null 
  },
  techniques: [{
    techniqueId: { 
      type: String, 
      required: true 
    },
    sessions: { 
      type: Number, 
      default: 0 
    }
  }],
  lastSelectedTechnique: { 
    type: String, 
    default: null 
  },
  lastSelectedDuration: { 
    type: Number, 
    default: null 
  },
  lastSessionStartTime: { 
    type: Date, 
    default: null 
  },
  lastSessionElapsedTime: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model("BreathingExercise", breathingExerciseSchema);