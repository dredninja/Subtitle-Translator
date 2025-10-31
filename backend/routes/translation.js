import express from "express";
import multer from "multer";
import { spawn } from "child_process";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), (req, res) => {
  const file = req.file.path;
  const { src_lang, tgt_lang } = req.body;

  const py = spawn("python3", ["python_scripts/translate_script.py", file, src_lang, tgt_lang]);

  let result = "";
  py.stdout.on("data", (data) => (result += data.toString()));
  py.stderr.on("data", (data) => console.error("Python error:", data.toString()));

  py.on("close", () => {
    try {
      res.json(JSON.parse(result));
    } catch {
      res.status(500).json({ error: "Translation failed" });
    }
  });
});

export default router;
