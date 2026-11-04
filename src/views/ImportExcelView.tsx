import React, { useState, useEffect } from 'react';
import type { ImportFileRecord, ImportResult } from '../types';

export const ImportExcelView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    details?: ImportResult;
  } | null>(null);

  const [history, setHistory] = useState<ImportFileRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    if (window.electronAPI?.getImportHistory) {
      setLoadingHistory(true);
      try {
        const list = await window.electronAPI.getImportHistory();
        setHistory(list || []);
      } catch (err) {
        console.error('Lỗi tải lịch sử import:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setStatusMsg(null);
    }
  };

  // Nút tải file mẫu Excel
  const handleDownloadTemplate = async () => {
    try {
      if (window.electronAPI?.downloadTemplate) {
        const res = await window.electronAPI.downloadTemplate();
        if (res.canceled) return;
        if (res.success) {
          setStatusMsg({
            type: 'success',
            text: `Đã lưu file mẫu thành công tại: ${res.filePath}`,
          });
        } else {
          setStatusMsg({
            type: 'error',
            text: res.message || 'Không thể tải file mẫu!',
          });
        }
      } else {
        // Fallback Web: Tải trực tiếp file tĩnh từ thư mục /Template.xlsx
        const a = document.createElement('a');
        a.href = './Template.xlsx';
        a.download = 'Template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Lỗi khi tải file mẫu: ${err.message}`,
      });
    }
  };

  // Nhập file Excel vào hệ thống
  const handleImport = async () => {
    if (!selectedFile) {
      setStatusMsg({
        type: 'error',
        text: 'Vui lòng chọn một file Excel (.xlsx, .xls) để tiếp tục.',
      });
      return;
    }

    setUploading(true);
    setStatusMsg({
      type: 'info',
      text: 'Đang lưu trữ file dạng Ymd_His và tính toán dữ liệu chấm công vào CSDL...',
    });

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      if (!window.electronAPI?.importExcel) {
        throw new Error('Không thể kết nối đến hệ thống máy chủ Electron API.');
      }

      const result = await window.electronAPI.importExcel({
        fileBuffer: uint8Array,
        originalName: selectedFile.name,
      });

      if (!result.success) {
        throw new Error(result.message || 'Không thể nhập dữ liệu từ file Excel.');
      }

      const dupText =
        (result.duplicateRawRows || 0) > 0
          ? ` (Phát hiện ${result.duplicateRawRows} dòng quẹt thẻ trùng lặp đã được bỏ qua)`
          : '';

      setStatusMsg({
        type: 'success',
        text: `Nhập dữ liệu thành công! Đã lưu file "${result.savedFileName}". Đã nạp ${result.newRawRows ?? result.totalPunches} dòng dữ liệu thô mới${dupText}, tổng hợp thành ${result.totalDays} ngày công cho ${result.uniqueEmployees} nhân viên (Từ ${result.dateRange?.from} đến ${result.dateRange?.to}).`,
        details: result,
      });

      // Tải lại lịch sử file và reset input
      setSelectedFile(null);
      const fileInput = document.getElementById('excelFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      loadHistory();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Nhập file thất bại: ${err.message}`,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span className="card-title">📥 Nhập Dữ Liệu Chấm Công Từ Excel</span>

          {/* NÚT TẢI FILE MẪU THEO YÊU CẦU CỦA NGƯỜI DÙNG */}
          <button
            className="btn btn-secondary"
            onClick={handleDownloadTemplate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f1f5f9',
              borderColor: '#cbd5e1',
              fontWeight: '600',
              color: '#0f172a',
            }}
            title="Tải file mẫu Excel chuẩn để nhập dữ liệu"
          >
            <span style={{ fontSize: '18px' }}>📑</span>
            <span>Tải File Mẫu Excel (.xlsx)</span>
          </button>
        </div>

        <div className="card-body">
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '36px 20px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              marginBottom: '20px',
              transition: 'border-color 0.2s, background-color 0.2s',
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
            <div
              style={{
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '13px' }}>
                <strong>File đã chọn:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={uploading}
              >
                {uploading ? '⏳ Đang Xử Lý & Lưu...' : '🚀 Bắt Đầu Nhập Dữ Liệu'}
              </button>
            </div>
          )}

          {statusMsg && (
            <div
              className={`badge badge-${statusMsg.type === 'error' ? 'danger' : statusMsg.type === 'success' ? 'success' : 'info'}`}
              style={{
                padding: '12px 16px',
                fontSize: '13px',
                width: '100%',
                borderRadius: '8px',
                whiteSpace: 'normal',
                lineHeight: '1.5',
                textAlign: 'left',
              }}
            >
              {statusMsg.text}
            </div>
          )}
        </div>
      </div>

      {/* LỊCH SỬ CÁC FILE ĐÃ IMPORT THỰC TẾ TRONG HỆ THỐNG */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">📋 Lịch Sử Các File Excel Đã Nhập</span>
          {/* <button className="btn btn-secondary btn-sm" onClick={loadHistory} disabled={loadingHistory}>
            {loadingHistory ? 'Đang tải...' : '🔄 Làm Mới'}
          </button> */}
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>STT</th>
                <th>Tên File Lưu Trữ (Ymd_His)</th>
                <th>Tên File Gốc Khi Tải Lên</th>
                <th>Số Dòng Đã Đọc</th>
                <th>Thời Gian Nhập</th>
                <th>Đường Dẫn An Toàn</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Chưa có file nào được nhập vào hệ thống. Hãy chọn file Excel ở trên để bắt đầu!
                  </td>
                </tr>
              ) : (
                history.map((h, idx) => (
                  <tr key={h.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong style={{ color: 'var(--primary)' }}>{h.file_name}</strong>
                    </td>
                    <td style={{ fontWeight: '500' }}>{h.original_name}</td>
                    <td>
                      <span className="badge badge-info">{h.total_rows.toLocaleString('vi-VN')} dòng</span>
                    </td>
                    <td>{h.imported_at}</td>
                    <td style={{ fontSize: '11px', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.file_path}>
                      {h.file_path}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
