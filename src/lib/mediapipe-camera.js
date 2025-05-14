export class Camera {
    constructor(videoElement, {
      onFrame,
      width = 640,
      height = 480,
      facingMode = "user"
    }) {
      this.video = videoElement;
      this.onFrame = onFrame;
      this.width = width;
      this.height = height;
      this.facingMode = facingMode;
      this.stream = null;
      this.running = false;
    }
  
    async start() {
      if (this.running) return;
      this.running = true;
  
      const constraints = {
        audio: false,
        video: {
          width: this.width,
          height: this.height,
          facingMode: this.facingMode
        }
      };
  
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
  
      await this.video.play();
  
      const frameLoop = async () => {
        if (!this.running) return;
        await this.onFrame();
        requestAnimationFrame(frameLoop);
      };
  
      requestAnimationFrame(frameLoop);
    }
  
    stop() {
      this.running = false;
      if (this.video.srcObject) {
        this.video.srcObject.getTracks().forEach(track => track.stop());
        this.video.srcObject = null;
      }
    }
  }
  