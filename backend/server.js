// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const { User, Translation, Similarity } = require("./UserSchema"); // <-- correct import

// ---------------- MONGO ----------------
mongoose.connect("mongodb://localhost:27017/subtitleApp")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ---------------- APP INIT ----------------
const app = express();
const PORT = 8007;
const SECRET_KEY = process.env.SECRET_KEY || "REPLACE_WITH_A_SECURE_KEY";

// adjust allowed origins for dev
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ---------------- DIRECTORIES ----------------
const BASE_DIR = __dirname;
const UPLOAD_DIR = path.join(BASE_DIR, "uploads");
const DOWNLOAD_DIR = path.join(BASE_DIR, "downloads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
app.use("/downloads", express.static(DOWNLOAD_DIR));

// ---------------- JWT AUTH ----------------
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = payload;
    next();
  } catch (err) {
    console.error("JWT verify error:", err && err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------------- MULTER ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${uuidv4()}${path.extname(file.originalname) || ".srt"}`)
});
const upload = multer({ storage });

// ---------------- ROUTES ----------------

// REGISTER
app.post("/api/register", async (req, res) => {
  console.log("Received registration request:", req.body);
  const { username, email, purpose, fullName, phone, dob, password } = req.body;

  if (!username || !email || !purpose || !password) {
    console.log("Missing required fields:", { username, email, purpose, password });
    return res.status(400).json({ error: "All required fields must be filled" });
  }

  try {
    const hashed = bcrypt.hashSync(password, 8);
    const user = await User.create({
      username,
      email,
      purpose,
      password: hashed,
      fullName: fullName || "",
      phone: phone || "",
      dob: dob ? new Date(dob) : null
    });
    console.log("User created successfully:", { id: user._id, username: user.username });
    return res.json({ message: "User registered", userId: user._id });
  } catch (err) {
    console.error("Error in /api/register:", err);
    if (err.code === 11000) return res.status(400).json({ error: "Username already exists" });
    return res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  console.log("Login request body:", req.body);
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    console.log("User not found:", username);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  console.log("Comparing password with hash:", user.password);
  const isMatch = bcrypt.compareSync(password, user.password);
  console.log("Password match:", isMatch);

  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id, username }, SECRET_KEY, { expiresIn: "4h" });
  user.lastLogin = new Date();
  await user.save();

  res.json({ token, username, userId: user._id });
});


// PROFILE
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    console.log("Profile request for:", req.user);
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password"); // don't send password
    if (!user) return res.status(404).json({ error: "User not found" });

    const translations = await Translation.find({ userId }).sort({ createdAt: -1 });
    const similarities = await Similarity.find({ userId }).sort({ createdAt: -1 });

    return res.json({ user, translations, similarities });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

// ---------------- TRANSLATION ----------------
app.post("/api/translate", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const srcLang = req.body.srcLang || "en";
    const tgtLang = req.body.tgtLang || "es";
    const uploadedPath = path.resolve(req.file.path);
    const outBase = path.join(DOWNLOAD_DIR, `translated_${Date.now()}_${uuidv4()}`);

    // adjust this path to your Python runtime if needed
    const pythonPath = process.env.PYTHON_PATH || "python";

    const py = spawn(pythonPath, [
      path.join(__dirname, "python_scripts", "translate.py"),
      uploadedPath,
      srcLang,
      tgtLang,
      outBase
    ], { shell: true });

    let stdoutBuffer = "";
    let stderrBuffer = "";
    py.stdout.on("data", (data) => { stdoutBuffer += data.toString(); });
    py.stderr.on("data", (data) => { stderrBuffer += data.toString(); });

    py.on("close", async (code) => {
      if (code !== 0) {
        console.error("Python translate error:", stderrBuffer);
        return res.status(500).json({ error: "Translation failed", details: stderrBuffer });
      }

      try {
        const finalLine = stdoutBuffer.split("\n").filter(Boolean).pop();
        const result = JSON.parse(finalLine);

        // Persist translation record
        await Translation.create({
          userId: req.user.userId,
          originalFile: uploadedPath,
          translatedFile: result.srt_file,
          jsonReport: result.json_file,
          srcLang,
          tgtLang,
          progress: 1
        });

        return res.json({
          message: "Translation complete",
          progress: 1,
          srt_file: `/downloads/${path.basename(result.srt_file)}`,
          json_file: `/downloads/${path.basename(result.json_file)}`
        });
      } catch (e) {
        console.error("Failed to parse Python output:", e, stdoutBuffer);
        return res.status(500).json({ error: "Failed to parse Python output" });
      }
    });
  } catch (err) {
    console.error("Translate endpoint error:", err);
    return res.status(500).json({ error: "Translate endpoint error" });
  }
});

// ---------------- SIMILARITY ----------------
app.post("/api/similarity",
  authMiddleware,
  upload.fields([{ name: "original", maxCount: 1 }, { name: "translated", maxCount: 1 }]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.original || !req.files.translated)
        return res.status(400).json({ error: "Upload both files" });

      const originalPath = path.resolve(req.files.original[0].path);
      const translatedPath = path.resolve(req.files.translated[0].path);
      const threshold = parseFloat(req.body.threshold || "0.7");
      const outJson = path.join(DOWNLOAD_DIR, `similarity_${Date.now()}_${uuidv4()}.json`);

      const pythonPath = process.env.PYTHON_PATH || "python";

      const py = spawn(pythonPath, [
        path.join(__dirname, "python_scripts", "similarity.py"),
        originalPath,
        translatedPath,
        "--threshold", threshold.toString(),
        "--out_json", outJson
      ], { shell: true });

      let stderr = "";
      py.stderr.on("data", (data) => stderr += data.toString());

      py.on("close", async (code) => {
        if (code !== 0) {
          console.error("Python similarity error:", stderr);
          return res.status(500).json({ error: "Python script failed", details: stderr });
        }

        try {
          const fileContent = fs.readFileSync(outJson, "utf-8");
          const result = JSON.parse(fileContent);
          const lowSimLines = (result.report || []).filter(r => r.similarity < (result.summary?.threshold ?? threshold));

          // Save similarity
          await Similarity.create({
            userId: req.user.userId,
            originalFile: originalPath,
            translatedFile: translatedPath,
            backTranslated: result.back_translated_file || "",
            jsonReport: outJson,
            threshold
          });

          return res.json({
            summary: result.summary,
            report: result.report,
            low_similarity: lowSimLines,
            json_file: `/downloads/${path.basename(outJson)}`
          });
        } catch (e) {
          console.error("Error parsing Python similarity output:", e);
          return res.status(500).json({ error: "Failed to parse Python output" });
        }
      });
    } catch (err) {
      console.error("Similarity endpoint error:", err);
      return res.status(500).json({ error: "Similarity endpoint error" });
    }
  });

// ---------------- START SERVER ----------------
app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
