// components/CameraView.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { setupHolistic } from "../lib/setupHolistic";
import {
  drawConnectors,
  drawLandmarks,
} from "@mediapipe/drawing_utils";
import {
  FACEMESH_TESSELATION,
  POSE_CONNECTIONS,
} from "@mediapipe/holistic";

type Props = {
  setPredictions: (value: string[]) => void;
};
export default function CameraView({ setPredictions }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    setupHolistic(videoRef.current, (results) => {
      if (!ctx || !canvas || !results.image) return;
      console.log("results", results);

      // Resize canvas theo video
      canvas.width = results.image.width;
      canvas.height = results.image.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2,
        });
        drawLandmarks(ctx, results.poseLandmarks, {
          color: "#FF0000",
          lineWidth: 1,
        });
      }

      if (results.faceLandmarks) {
        drawConnectors(ctx, results.faceLandmarks, FACEMESH_TESSELATION, {
          color: "#C0C0C070",
          lineWidth: 1,
        });
      }

      if (results.leftHandLandmarks) {
        drawLandmarks(ctx, results.leftHandLandmarks, {
          color: "#00FFFF",
          lineWidth: 2,
        });
      }

      if (results.rightHandLandmarks) {
        drawLandmarks(ctx, results.rightHandLandmarks, {
          color: "#FF00FF",
          lineWidth: 2,
        });
      }

      if (results.predictions) {
        console.log("in cameraview",results.predictions)
        setPredictions(results.predictions);
      }
    });
  }, []);

  return (
    <div className="relative w-fit">
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} className="rounded-xl shadow-lg" />
    </div>
  );
}
