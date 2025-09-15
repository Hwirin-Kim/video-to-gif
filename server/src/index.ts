import express from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });
ffmpeg.setFfmpegPath(ffmpegPath as string);

// 필요한 디렉토리 생성
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir("uploads");
ensureDir("gifs");

// body 파서 추가
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS 허용
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

app.post("/convert", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file uploaded" });
  }

  const {
    fps = "24",
    width = "720",
    start = "0",
    duration = "0",
    quality = "high",
  } = req.body as Record<string, string>;
  const input = req.file.path;
  const output = path.join("gifs", `${Date.now()}.gif`);

  console.log("변환 시작:", { input, output, fps, width, quality });
  console.log("입력 파일 존재:", fs.existsSync(input));
  console.log("입력 파일 크기:", fs.statSync(input).size, "bytes");
  console.log("입력 파일 정보:", req.file);

  // 가장 간단한 ffmpeg 명령어로 테스트
  let command = ffmpeg(input)
    .fps(Number(fps))
    .size(`${width}x?`)
    .outputOptions(["-loop", "0"]);

  if (Number(start) > 0) command = command.setStartTime(Number(start));
  if (Number(duration) > 0) command = command.setDuration(Number(duration));

  command
    .save(output)
    .on("start", (commandLine) => {
      console.log("FFmpeg 명령어:", commandLine);
    })
    .on("progress", (progress) => {
      console.log("진행률:", progress.percent + "%");
    })
    .on("end", () => {
      console.log("변환 완료:", output);
      console.log("파일 존재 확인:", fs.existsSync(output));
      console.log("gifs 디렉토리 내용:", fs.readdirSync("gifs"));

      if (fs.existsSync(output)) {
        res.download(output, (err) => {
          if (err) {
            console.error("Download error:", err);
            res.status(500).json({ error: "Failed to download file" });
          }
          // 임시 파일 정리
          if (fs.existsSync(input)) {
            fs.unlinkSync(input);
          }
        });
      } else {
        console.error("출력 파일이 생성되지 않음:", output);
        res.status(500).json({ error: "Output file was not created" });
      }
    })
    .on("error", (err, stdout, stderr) => {
      console.error("FFmpeg error:", err);
      console.error("FFmpeg stdout:", stdout);
      console.error("FFmpeg stderr:", stderr);
      res
        .status(500)
        .json({ error: "Video conversion failed", details: stderr });
      // 임시 파일 정리
      if (fs.existsSync(input)) {
        fs.unlinkSync(input);
      }
    });
});

app.listen(4000, () => {
  console.log("🚀 Server running on http://localhost:4000");
});
