import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    project: "Subtitle Analyzer",
    version: "1.0",
    status: "ok",
    message: "Data analysis working fine!",
  });
});

export default router;
