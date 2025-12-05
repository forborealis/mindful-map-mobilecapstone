const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    activity: { type: String, required: true },
    moodScore: { type: Number, default: null }
  },
  { _id: false }
);

const tukeyHSDSchema = new mongoose.Schema(
  {
    group1: { type: String, required: true },
    group2: { type: String, required: true },
    meandiff: { type: Number, default: null },
    p_adj: { type: Number, default: null }, // normalized from "p-adj"
    lower: { type: Number, default: null },
    upper: { type: Number, default: null },
    reject: { type: Boolean, default: false }
  },
  { _id: false }
);

const anovaResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  moodScoreRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: "MoodScore" }],
  anova: {
    F_value: { type: Number, default: null },
    p_value: { type: Number, default: null },
    MSB: { type: Number, default: null },
    MSW: { type: Number, default: null },
    interpretation: { type: String, default: null },
    includedGroups: { type: [String], default: [] },
    ignoredGroups: { type: [String], default: [] },
    tukeyInfo: { type: mongoose.Schema.Types.Mixed },
    groupMeans: { type: mongoose.Schema.Types.Mixed, default: {} },
    groupCounts: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  topPositive: [activitySchema],
  topNegative: [activitySchema],
  tukeyHSD: [tukeyHSDSchema],
  date: { type: Date, default: Date.now }
});

anovaResultSchema.index({ user: 1, category: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("AnovaResult", anovaResultSchema);