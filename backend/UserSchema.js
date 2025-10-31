// models/UserSchema.js
const mongoose = require("mongoose");

// ---------------- User ----------------
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, required: true },
  purpose: { type: String, required: true },
  password: { type: String, required: true },
  fullName: String,
  phone: String,
  dob: Date,
  lastLogin: Date
}, { timestamps: true });

// ---------------- Translation ----------------
const translationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalFile: String,
  translatedFile: String,
  jsonReport: String,
  srcLang: String,
  tgtLang: String,
  progress: Number
}, { timestamps: true });

// ---------------- Similarity ----------------
const similaritySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalFile: String,
  translatedFile: String,
  backTranslated: String,
  jsonReport: String,
  threshold: Number
}, { timestamps: true });

// Export models as named exports
module.exports = {
  User: mongoose.model("User", userSchema),
  Translation: mongoose.model("Translation", translationSchema),
  Similarity: mongoose.model("Similarity", similaritySchema)
};
