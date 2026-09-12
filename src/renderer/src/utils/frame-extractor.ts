/**
 * Trích xuất 10 khung hình trải đều từ đầu đến cuối video qua HTML5 Video & Canvas
 */
export async function extractVideoFrames(
  fileId: string,
  frameCount: number = 10,
  onProgress?: (progress: string) => void
): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const frames: string[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Timeout phòng trường hợp video lỗi định dạng (sau 10s tự fallback)
    const timeout = setTimeout(() => {
      video.src = '';
      resolve(frames);
    }, 12000);

    video.src = `http://localhost:8899/video-stream/${fileId}`;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || isNaN(duration) || duration <= 0) {
        clearTimeout(timeout);
        video.src = '';
        return resolve([]);
      }

      // Kích thước chuẩn tối ưu cho AI Vision (480x270)
      canvas.width = 480;
      canvas.height = 270;

      const timestamps: number[] = [];
      const step = duration / (frameCount + 1);
      for (let i = 1; i <= frameCount; i++) {
        timestamps.push(step * i);
      }

      for (let idx = 0; idx < timestamps.length; idx++) {
        const t = timestamps[idx];
        if (onProgress) {
          onProgress(`Trích xuất ảnh ${idx + 1}/${timestamps.length} (giây thứ ${Math.round(t)}s)...`);
        }

        try {
          await new Promise<void>((seekResolve) => {
            let seekTimer: any = null;

            const onSeeked = () => {
              clearTimeout(seekTimer);
              video.removeEventListener('seeked', onSeeked);
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg', 0.75);
                frames.push(base64);
              }
              seekResolve();
            };

            seekTimer = setTimeout(() => {
              video.removeEventListener('seeked', onSeeked);
              seekResolve();
            }, 2000); // 2s max per seek

            video.addEventListener('seeked', onSeeked);
            video.currentTime = t;
          });
        } catch (e) {
          break;
        }
      }

      clearTimeout(timeout);
      video.src = '';
      resolve(frames);
    };

    video.onerror = () => {
      clearTimeout(timeout);
      video.src = '';
      resolve([]);
    };
  });
}
