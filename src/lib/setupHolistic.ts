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
    console.log("🧐 Keypoints:", keypoints);  // Log keypoints để xem dữ liệu có đúng không
    if (keypoints) {
      sequence.push(keypoints);
      sequence = sequence.slice(-30);
      console.log("🔢 Sequence length:", sequence.length);

      if (sequence.length === 30) {
        console.log("✅ Sequence đầy đủ. Gửi đến backend...");
        const prediction = await predictAction(sequence);
        console.log("📨 Backend trả về:", prediction);
        onResult({ ...results, prediction });
        return;
      }
    }
    onResult(results); // Trường hợp chưa đủ 30 frame vẫn gửi để vẽ
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
          console.log("Pose landmark: ", l);  // Log từng điểm trong pose
          return [l.x, l.y, l.z, l.visibility];  // Lấy thêm visibility
      })
      : new Array(33 * 4).fill(0);  // 33 điểm với 4 giá trị mỗi điểm (x, y, z, visibility)
    console.log("Pose landmarks length:", results.poseLandmarks?.length);  // Log chiều dài của poseLandmarks

    // const face = results.faceLandmarks
    //   ? results.faceLandmarks.flatMap((l: any) => {
    //       console.log("Face landmark: ", l);  // Log từng điểm trong face
    //       return [l.x, l.y, l.z];  // 3 giá trị mỗi điểm (x, y, z)
    //   })
    //   : new Array(468 * 3).fill(0);  // 468 điểm với 3 giá trị mỗi điểm (x, y, z)
    //   console.log("Face landmarks length:", results.faceLandmarks?.length);  // Log chiều dài của faceLandmarks

    const face = results.faceLandmarks
      ? results.faceLandmarks.slice(0, 468).flatMap((l: any) => {  // Giới hạn chỉ lấy 468 điểm
          console.log("Face landmark: ", l);  // Log từng điểm trong face
          return [l.x, l.y, l.z];  // 3 giá trị mỗi điểm (x, y, z)
      })
      : new Array(468 * 3).fill(0);  // 468 điểm với 3 giá trị mỗi điểm (x, y, z)
    
    const lh = results.leftHandLandmarks
      ? results.leftHandLandmarks.flatMap((l: any) => {
          console.log("Left hand landmark: ", l);  // Log từng điểm trong leftHand
          return [l.x, l.y, l.z];  // 3 giá trị mỗi điểm (x, y, z)
      })
      : new Array(21 * 3).fill(0);  // 21 điểm với 3 giá trị mỗi điểm (x, y, z)
    console.log("Left hand landmarks length:", results.leftHandLandmarks?.length);  // Log chiều dài của leftHandLandmarks

    const rh = results.rightHandLandmarks
      ? results.rightHandLandmarks.flatMap((l: any) => {
          console.log("Right hand landmark: ", l);  // Log từng điểm trong rightHand
          return [l.x, l.y, l.z];  // 3 giá trị mỗi điểm (x, y, z)
      })
      : new Array(21 * 3).fill(0);  // 21 điểm với 3 giá trị mỗi điểm (x, y, z)
    console.log("Right hand landmarks length:", results.rightHandLandmarks?.length);  // Log chiều dài của rightHandLandmarks
  
    // Kết hợp tất cả các keypoints lại với nhau
    const keypoints = [...pose, ...face, ...lh, ...rh];
    console.log("Total keypoints length:", keypoints.length);  // Log tổng chiều dài của keypoints

    // Trả về mảng kết hợp của tất cả các keypoints
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
  
      console.log("📨 Dự đoán:", data.prediction, "| độ tin cậy:", data.confidence);
  
      return data.prediction;
    } catch (error) {
      console.error("❌ Lỗi kết nối backend:", error);
      return "error";
    }
  }
  