import React, { useState } from 'react';

export const ImportExcelView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setStatusMsg(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setStatusMsg({ type: 'error', text: 'Vui lòng chọn một file Excel (.xlsx, .xls) để tiếp tục.' });
      return;
    }

    setUploading(true);
    setStatusMsg({ type: 'info', text: 'Đang lưu file dạng Ymd_His và phân tích dữ liệu chấm công...' });

    // Tạo giả lập thời gian xử lý
    setTimeout(() => {
      setUploading(false);
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      
      setStatusMsg({
        type: 'success',
        text: `Đã lưu file thành công với tên "${timestamp}.xlsx" và cập nhật dữ liệu chấm công!`,
      });
    }, 1200);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">📥 Tải Lên Tệp Excel Máy Chấm Công</span>
        </div>
        <div className="card-body">
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
            onClick={() => document.getElementById('excelFileInput')?.click()}
          >
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>📊</div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
              {selectedFile ? selectedFile.name : 'Nhấp để chọn file Excel hoặc kéo thả vào đây'}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Hỗ trợ định dạng file từ máy chấm công (.xlsx, .xls)
            </p>
            <input
              id="excelFileInput"
              type="file"
              accept=".xlsx, .xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {selectedFile && (
            <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px' }}>
                <strong>File đã chọn:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={uploading}
              >
                {uploading ? 'Đang xử lý...' : 'Bắt Đầu Nhập Dữ Liệu'}
              </button>
            </div>
          )}

          {statusMsg && (
            <div
              className={`badge badge-${statusMsg.type === 'error' ? 'danger' : statusMsg.type === 'success' ? 'success' : 'info'}`}
              style={{ padding: '10px 14px', fontSize: '13px', width: '100%', borderRadius: '8px' }}
            >
              {statusMsg.text}
            </div>
          )}
        </div>
      </div>

      {/* Thông tin mô tả quy định & cấu trúc dữ liệu */}
      {/* <div className="card">
        <div className="card-header">
          <span className="card-title">ℹ️ Cấu Trúc Dữ Liệu Excel Chuẩn Của Máy Chấm Công</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cột B (Mã)</th>
                  <th>Cột C (Ngày)</th>
                  <th>Cột D (Giờ)</th>
                  <th>Cột E (Kiểu chấm)</th>
                  <th>Cột F (Nguồn)</th>
                  <th>Cột G (Mã máy)</th>
                  <th>Cột H (Tên máy)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>46297</td>
                  <td>46297.29097 (06:59)</td>
                  <td>255</td>
                  <td>1</td>
                  <td>1</td>
                  <td>Máy MCC00001</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>46297</td>
                  <td>46297.72083 (17:18)</td>
                  <td>255</td>
                  <td>1</td>
                  <td>1</td>
                  <td>Máy MCC00001</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '14px', fontSize: '12px', color: '#64748b' }}>
            * Hệ thống tự động tính toán giờ vào sớm nhất (check-in) và giờ ra muộn nhất (check-out) trong ngày của từng nhân viên.
            Nếu quên check-out, hệ thống mặc định tính giờ ra là 17:00.
          </div>
        </div>
      </div> */}
    </div>
  );
};

