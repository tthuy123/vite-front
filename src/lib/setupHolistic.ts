// lib/setupHolistic.ts
import { Holistic } from "@mediapipe/holistic";
import * as cam from "@mediapipe/camera_utils";

let sequence: number[][] = [];

export function setupHolistic(
  videoElement: HTMLVideoElement,
  onResult: (results: any & { prediction?: string }) => void
) {
  const holistic = new Holistic({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
  });

  holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.75,
    minTrackingConfidence: 0.75,
    refineFaceLandmarks: true,
  });

  holistic.onResults(async (results) => {
    const keypoints = extractKeypoints(results);
    if (keypoints) {
      sequence.push(keypoints);
      sequence = sequence.slice(-50);
      console.log("🔢 Sequence length:", sequence.length);

      if (sequence.length === 50) {
        const predictions = await predictAction(sequence);
        console.log("📨 Backend trả về:", predictions);
        onResult({ ...results, predictions });
        return;
      }
    }
    onResult(results); 
  });

  const camera = new cam.Camera(videoElement, {
    onFrame: async () => {
      await holistic.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });

  camera.start();
}

function extractKeypoints(results: any): number[] | null {
    // Kiểm tra và xử lý các keypoints nếu có
    const pose = results.poseLandmarks
      ? results.poseLandmarks.flatMap((l: any) => {
          return [l.x, l.y, l.z, l.visibility];  // Lấy thêm visibility
      })
      : new Array(33 * 4).fill(0);  // 33 điểm với 4 giá trị mỗi điểm (x, y, z, visibility)

    // const face = results.faceLandmarks
    //   ? results.faceLandmarks.flatMap((l: any) => {
    //       console.log("Face landmark: ", l);  // Log từng điểm trong face
    //       return [l.x, l.y, l.z];  // 3 giá trị mỗi điểm (x, y, z)
    //   })
    //   : new Array(468 * 3).fill(0);  // 468 điểm với 3 giá trị mỗi điểm (x, y, z)
    //   console.log("Face landmarks length:", results.faceLandmarks?.length);  // Log chiều dài của faceLandmarks

    const face = results.faceLandmarks
      ? results.faceLandmarks.slice(0, 468).flatMap((l: any) => {  // Giới hạn chỉ lấy 468 điểm
          return [l.x, l.y, l.z];  // 3 giá trị mỗi điểm (x, y, z)
      })
      : new Array(468 * 3).fill(0);  // 468 điểm với 3 giá trị mỗi điểm (x, y, z)
    
    const lh = results.leftHandLandmarks
      ? results.leftHandLandmarks.flatMap((l: any) => {
          return [l.x, l.y, l.z];  // 3 giá trị mỗi điểm (x, y, z)
      })
      : new Array(21 * 3).fill(0);  // 21 điểm với 3 giá trị mỗi điểm (x, y, z)

    const rh = results.rightHandLandmarks
      ? results.rightHandLandmarks.flatMap((l: any) => {
          return [l.x, l.y, l.z];  // 3 giá trị mỗi điểm (x, y, z)
      })
      : new Array(21 * 3).fill(0);  // 21 điểm với 3 giá trị mỗi điểm (x, y, z)
  
    // Kết hợp tất cả các keypoints lại với nhau
    const keypoints = [...pose, ...face, ...lh, ...rh];

    return keypoints;
}

  

  async function predictAction(sequence: number[][]): Promise<string> {
    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sequence }),
      });
  
      if (!res.ok) {
        console.error("❌ Lỗi gửi request:", res.status, await res.text());
        return "error";
      }
  
      const data = await res.json();
  
      if (data.error) {
        console.error("❌ Backend báo lỗi:", data.error);
        return "error";
      }
    
      return data.predictions;
    } catch (error) {
      console.error("❌ Lỗi kết nối backend:", error);
      return "error";
    }
  }
  