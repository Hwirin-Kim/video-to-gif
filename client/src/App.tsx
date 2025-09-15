import { useState } from "react";

export default function App() {
  const [video, setVideo] = useState<File | null>(null);
  const [fps, setFps] = useState(24);
  const [width, setWidth] = useState(720);
  const [quality, setQuality] = useState("high");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    const formData = new FormData();
    formData.append("video", video);
    formData.append("fps", fps.toString());
    formData.append("width", width.toString());
    formData.append("quality", quality);

    const res = await fetch("http://localhost:4000/convert", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    // 다운로드
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.gif";
    a.click();
  };

  return (
    <div className="p-6 flex flex-col gap-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center">🎞 Video → GIF 변환기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">비디오 파일</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
            className="border rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            FPS (초당 프레임 수)
          </label>
          <input
            type="number"
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            placeholder="기본값: 24"
            className="border rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">너비 (픽셀)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            placeholder="기본값: 720px"
            className="border rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">품질</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="high">고화질 (256색)</option>
            <option value="medium">중화질 (128색)</option>
            <option value="low">저화질 (64색)</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          변환하기
        </button>
      </form>
    </div>
  );
}
