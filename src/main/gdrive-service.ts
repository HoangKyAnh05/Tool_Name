import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { app, shell } from 'electron';

const TOKEN_PATH = path.join(app.getPath('userData'), 'gdrive_tokens.json');

export class GDriveService {
  private oauth2Client: any = null;
  private tokens: any = null;

  initOAuth(clientId: string, clientSecret: string): boolean {
    this.oauth2Client = new google.auth.OAuth2(
      clientId.trim(),
      clientSecret.trim(),
      'http://localhost:8899/oauth2callback'
    );

    this.oauth2Client.on('tokens', (tokens: any) => {
      this.saveTokens(tokens);
    });

    this.startLocalServer();

    // Load saved tokens if present
    if (fs.existsSync(TOKEN_PATH)) {
      try {
        const raw = fs.readFileSync(TOKEN_PATH, 'utf-8');
        this.tokens = JSON.parse(raw);
        this.oauth2Client.setCredentials(this.tokens);
        return true;
      } catch (e) {
        console.error('Failed to load saved tokens:', e);
      }
    }
    return false;
  }

  private saveTokens(tokens: any) {
    this.tokens = { ...(this.tokens || {}), ...tokens };
    try {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(this.tokens, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save tokens to file:', e);
    }
  }

  clearTokens() {
    this.tokens = null;
    if (fs.existsSync(TOKEN_PATH)) {
      try {
        fs.unlinkSync(TOKEN_PATH);
      } catch (e) {}
    }
  }

  private authServer: http.Server | null = null;
  private pendingAuthResolve: ((value: boolean) => void) | null = null;
  private pendingAuthReject: ((reason?: any) => void) | null = null;

  startLocalServer() {
    if (this.authServer) return;

    const server = http.createServer(async (req, res) => {
      try {
        // Video Range Streaming Proxy for Canvas Frame Extraction
        if (req.url?.startsWith('/video-stream/')) {
          const fileId = req.url.split('/video-stream/')[1].split('?')[0];
          if (!this.oauth2Client || !this.tokens) {
            res.writeHead(401, { 'Access-Control-Allow-Origin': '*' });
            return res.end('Unauthorized');
          }

          try {
            const drive = this.getDriveClient();
            const range = req.headers.range;

            const driveRes = await drive.files.get(
              { fileId, alt: 'media', supportsAllDrives: true },
              { responseType: 'stream', headers: range ? { Range: range } : {} }
            );

            const headers: any = {
              'Content-Type': driveRes.headers['content-type'] || 'video/mp4',
              'Accept-Ranges': 'bytes',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': '*',
            };
            if (driveRes.headers['content-range']) {
              headers['Content-Range'] = driveRes.headers['content-range'];
            }
            if (driveRes.headers['content-length']) {
              headers['Content-Length'] = driveRes.headers['content-length'];
            }

            res.writeHead(driveRes.status || 200, headers);
            driveRes.data.pipe(res);
          } catch (err: any) {
            res.writeHead(500, { 'Access-Control-Allow-Origin': '*' });
            res.end(err.message);
          }
          return;
        }

        // OAuth2 Callback
        if (req.url?.startsWith('/oauth2callback')) {
          const qs = new url.URL(req.url, 'http://localhost:8899').searchParams;
          const code = qs.get('code');
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #fff; text-align: center; padding-top: 60px;">
                <div style="display: inline-block; background: #1e293b; padding: 40px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                  <h1 style="color: #38bdf8; margin-bottom: 12px;">✅ Đăng nhập Google Drive thành công!</h1>
                  <p style="color: #94a3b8; font-size: 15px;">Bạn có thể đóng tab trình duyệt này và quay lại ứng dụng để sử dụng.</p>
                </div>
              </body>
            </html>
          `);

          if (code && this.pendingAuthResolve) {
            const { tokens } = await this.oauth2Client!.getToken(code);
            this.oauth2Client!.setCredentials(tokens);
            this.saveTokens(tokens);
            this.tokens = tokens;
            this.pendingAuthResolve(true);
            this.pendingAuthResolve = null;
            this.pendingAuthReject = null;
          }
          return;
        }

        res.writeHead(404);
        res.end('Not Found');
      } catch (e: any) {
        if (this.pendingAuthReject) {
          this.pendingAuthReject(e);
          this.pendingAuthResolve = null;
          this.pendingAuthReject = null;
        }
      }
    });

    server.on('error', (err: any) => {
      console.warn(`Local server port 8899 error: ${err.message}`);
    });

    server.listen(8899, () => {
      console.log('Google Drive Local Proxy & Streaming server listening on port 8899');
    });

    this.authServer = server;
  }

  async authenticate(): Promise<boolean> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 Client chưa được khởi tạo. Vui lòng cấu hình Client ID & Secret.');
    }

    this.startLocalServer();

    return new Promise((resolve, reject) => {
      this.pendingAuthResolve = resolve;
      this.pendingAuthReject = reject;

      const authUrl = this.oauth2Client!.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.metadata'
        ],
      });
      shell.openExternal(authUrl);
    });
  }

  isAuthenticated(): boolean {
    return !!this.tokens;
  }

  getDriveClient() {
    if (!this.oauth2Client) {
      throw new Error('Chưa xác thực Google Drive.');
    }
    return google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async listFolders(parentId?: string) {
    const drive = this.getDriveClient();
    const allFolders: any[] = [];
    let pageToken: string | undefined = undefined;

    try {
      // Quét các trang thư mục (tối đa 500 thư mục) theo thời gian sửa đổi gần nhất
      for (let i = 0; i < 5; i++) {
        const q = `mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const res: any = await drive.files.list({
          q,
          fields: 'nextPageToken, files(id, name, parents, modifiedTime)',
          orderBy: 'modifiedTime desc',
          pageSize: 100,
          pageToken: pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        const files = res.data.files || [];
        for (const f of files) {
          if (!f.name) continue;
          const name = f.name.trim();
          if (name.startsWith('.')) continue;
          if (['node_modules', 'dist', 'build', '__pycache__', 'vendor', 'bin', '.bin', '.agents'].includes(name.toLowerCase())) continue;
          allFolders.push({
            id: f.id,
            name: f.name,
            parents: f.parents,
          });
        }

        pageToken = res.data.nextPageToken || undefined;
        if (!pageToken || allFolders.length >= 250) break;
      }
    } catch (e: any) {
      console.warn('Error fetching all folders:', e.message);
    }

    // Sắp xếp lại danh sách thư mục theo bảng chữ cái A-Z
    allFolders.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return allFolders;
  }

  async listVideos(folderId: string = 'root') {
    const drive = this.getDriveClient();
    // Tuyệt đối không lấy thư mục, chỉ lấy các tệp video
    const q = `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder' and (mimeType contains 'video/' or name contains '.mp4' or name contains '.mov' or name contains '.mkv' or name contains '.avi' or name contains '.webm' or name contains '.m4v' or name contains '.wmv' or name contains '.flv' or name contains '.3gp')`;
    const res = await drive.files.list({
      q,
      fields: 'files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, videoMediaMetadata)',
      orderBy: 'modifiedTime desc',
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return (res.data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? formatBytes(parseInt(file.size, 10)) : 'N/A',
      modifiedTime: file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('vi-VN') : '',
      thumbnailLink: file.thumbnailLink,
      webViewLink: file.webViewLink,
      duration: file.videoMediaMetadata?.durationMillis 
        ? formatDuration(file.videoMediaMetadata.durationMillis) 
        : 'N/A',
      status: 'idle',
      selected: true,
    }));
  }

  async renameFile(fileId: string, newName: string) {
    const drive = this.getDriveClient();
    const res = await drive.files.update({
      fileId,
      requestBody: {
        name: newName,
      },
      fields: 'id, name',
    });
    return res.data;
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDuration(millis: number | string) {
  const totalSeconds = Math.floor(Number(millis) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export const gdriveService = new GDriveService();
