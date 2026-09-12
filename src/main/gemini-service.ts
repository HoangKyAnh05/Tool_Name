import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VideoAnalysisRequest {
  fileName: string;
  fileId: string;
  mimeType: string;
  duration?: string;
  thumbnailLink?: string;
  imageFrames?: string[]; // Danh sách 5-10 khung hình trích xuất từ video
  namingPattern: string;
  customTemplate?: string;
  language: 'vi' | 'en' | 'vi_no_accent';
  caseStyle: 'Readable Space' | 'snake_case' | 'kebab-case' | 'CamelCase' | 'lowercase';
  includeDate: boolean;
  includeIndex?: boolean;
  indexFormat?: '1.' | '01.' | '1 -' | '[1]';
  index?: number;
  prefix: string;
  maxWords: number;
  contextHint?: string;
}

export interface VideoAnalysisResponse {
  proposedName: string;
  summary: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string = '';
  private modelName: string = 'gemini-3.7-flash';

  init(apiKey: string, modelName: string = 'gemini-3.7-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName || 'gemini-3.7-flash';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeVideoName(req: VideoAnalysisRequest): Promise<VideoAnalysisResponse> {
    if (!this.genAI || !this.apiKey) {
      throw new Error('Gemini API Key chưa được khởi tạo. Vui lòng cấu hình API Key.');
    }

    // Lấy phần mở rộng file ban đầu (ví dụ: .mp4, .mkv)
    const extMatch = req.fileName.match(/\.[0-9a-z]+$/i);
    const extension = extMatch ? extMatch[0] : '.mp4';
    const baseName = req.fileName.replace(/\.[0-9a-z]+$/i, '');

    // Tạo tiền tố số thứ tự nếu có
    let indexPrefix = '';
    if (req.includeIndex && typeof req.index === 'number') {
      const num = req.index;
      if (req.indexFormat === '01.') {
        indexPrefix = `${String(num).padStart(2, '0')}. `;
      } else if (req.indexFormat === '1 -') {
        indexPrefix = `${num} - `;
      } else if (req.indexFormat === '[1]') {
        indexPrefix = `[${num}] `;
      } else {
        indexPrefix = `${num}. `;
      }
    }

    const contextInstruction = req.contextHint
      ? `- GỢI Ý CHỦ ĐỀ TỪ NGƯỜI DÙNG: "${req.contextHint}".`
      : '';

    const dateInstruction = req.includeDate
      ? '- Thêm ngày hiện tại theo định dạng [YYYY-MM-DD] vào tên file.'
      : '- TUYỆT ĐỐI KHÔNG thêm ngày tháng năm hay timestamp (như 2024_10_24 hay ngày 13 tháng 9) vào tên file.';

    const promptText = `
Bạn là một chuyên gia phân tích video thể thao và biên tập kỹ thuật số hàng đầu.
Nhiệm vụ của bạn là quan sát kỹ toàn bộ các hình ảnh trích xuất từ video (từ đầu đến cuối video), tổng hợp diễn biến và tạo ra một TÊN TỆP MỚI chi tiết, chuẩn xác, mô tả đúng những gì diễn ra trong video (tên không quá dài nhưng phải ĐỦ Ý và CỤ THỂ).

THÔNG TIN TỆP:
- Tên gốc: "${req.fileName}"
- Định dạng: ${req.mimeType}
- Thời lượng: ${req.duration || 'Không rõ'}
${contextInstruction}

HƯỚNG DẪN QUAN SÁT & ĐẶT TÊN CHI TIẾT:
1. Quan sát kỹ:
   - Thể loại & Thể thức: Đơn nam, Đôi nam, Đôi nam nữ, Tập luyện kỹ thuật, Đấu giao lưu, Đấu set tính điểm...
   - Đặc điểm nhận dạng & trang phục: Màu áo người chơi (áo xanh, áo đỏ, áo đen...), vị trí sân (gần camera / xa camera).
   - Hành động / Kỹ thuật nổi bật xuyên suốt: Tập đập cầu smash, kéo lưới, giao cầu, đánh cầu bền nhiều chạm, cứu cầu ngoạn mục, tranh cãi tỉ số...
2. Cấu trúc tên:
   - Ngắn gọn nhưng đầy đủ ý chi tiết (khoảng 4 - 8 từ).
   - Ví dụ hay: "đánh đơn nam áo xanh giao đấu cầu bền", "giao lưu đôi nam set 1 gay cấn", "tập kỹ thuật đập cầu smash chéo sân", "đánh đôi nam phối hợp kéo lưới".
3. Ngôn ngữ: ${req.language === 'vi' ? 'Tiếng Việt có dấu tự nhiên' : req.language === 'vi_no_accent' ? 'Tiếng Việt KHÔNG DẤU' : 'Tiếng Anh'}
4. Kiểu viết: ${req.caseStyle} (lowercase: chữ thường có khoảng cách; Readable Space: Viết Hoa Chữ Đầu; snake_case: dấu gạch dưới)
5. ${dateInstruction}
6. Không tự thêm số thứ tự 1., 2. (hệ thống sẽ tự thêm ở đầu).
7. Đuôi tệp: ${extension}

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON HỢP LỆ:
{
  "proposedName": "đánh đơn nam áo xanh giao đấu cầu bền${extension}",
  "summary": "Mô tả chi tiết 2-3 câu về những gì diễn ra xuyên suốt video dựa trên các khung hình đã quan sát."
}
`;

    // Chuẩn bị payload (Text + Nhiều ảnh trích xuất từ video)
    const contentParts: any[] = [promptText];

    if (req.imageFrames && req.imageFrames.length > 0) {
      req.imageFrames.forEach((base64Img, idx) => {
        const cleanBase64 = base64Img.replace(/^data:image\/[a-z]+;base64,/, '');
        contentParts.push(`--- Khung hình ${idx + 1}/${req.imageFrames!.length} (Trích xuất theo tiến trình video) ---`);
        contentParts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg'
          }
        });
      });
    } else if (req.thumbnailLink) {
      try {
        const imgRes = await fetch(req.thumbnailLink);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const base64Data = Buffer.from(arrayBuffer).toString('base64');
          contentParts.push({
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg'
            }
          });
        }
      } catch (e) {
        // Fallback to text only if thumbnail cannot be downloaded
      }
    }

    const candidateModels = [
      this.modelName,
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
    ].filter((v, i, a) => a.indexOf(v) === i);

    let lastError: any = null;

    for (const modelToUse of candidateModels) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelToUse });
        const result = await model.generateContent(contentParts);
        const text = result.response.text().trim();
        
        // Parse JSON from output
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          let nameWithoutExt = (parsed.proposedName || `${baseName}`).replace(/\.[0-9a-z]+$/i, '').trim();
          
          // Loại bỏ số thứ tự dư thừa ở đầu nếu hệ thống đã cấu hình tự thêm
          if (indexPrefix) {
            nameWithoutExt = nameWithoutExt.replace(/^(\d+[\.\-\s\]\)]+|\#\d+\s*)/, '').trim();
          }

          // Format case style nếu cần
          if (req.caseStyle === 'lowercase') {
            nameWithoutExt = nameWithoutExt.replace(/_/g, ' ').toLowerCase();
          } else if (req.caseStyle === 'snake_case') {
            nameWithoutExt = nameWithoutExt.replace(/\s+/g, '_').toLowerCase();
          } else if (req.caseStyle === 'kebab-case') {
            nameWithoutExt = nameWithoutExt.replace(/\s+/g, '-').toLowerCase();
          } else if (req.caseStyle === 'Readable Space') {
            nameWithoutExt = nameWithoutExt
              .replace(/_/g, ' ')
              .split(' ')
              .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
              .join(' ');
          }

          let finalName = `${indexPrefix}${nameWithoutExt}${extension}`;
          return {
            proposedName: finalName,
            summary: parsed.summary || 'Phân tích hoàn tất từ thông tin video.'
          };
        } else {
          return {
            proposedName: `${indexPrefix}${baseName}${extension}`,
            summary: text.slice(0, 120)
          };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelToUse} failed, trying fallback:`, err.message);
      }
    }

    console.error('Gemini Analysis Error:', lastError);
    throw new Error(`Lỗi phân tích Gemini AI: ${lastError?.message || lastError}`);
  }
}

export const geminiService = new GeminiService();
