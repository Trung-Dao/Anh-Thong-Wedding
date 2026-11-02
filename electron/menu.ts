import { Menu, BrowserWindow, dialog, shell, app, MenuItemConstructorOptions } from 'electron';

export function setupApplicationMenu(win: BrowserWindow) {
  const sendNavigate = (tab: string) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('menu-navigate', tab);
    }
  };

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Hệ Thống',
      submenu: [
        {
          label: 'Đăng Xuất Tài Khoản',
          click: () => {
            sendNavigate('logout');
          },
        },
        { type: 'separator' },
        {
          label: 'Thoát Ứng Dụng',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit',
        },
      ],
    },
    {
      label: 'Chức Năng',
      submenu: [
        {
          label: '📊 Tổng Quan (Dashboard)',
          accelerator: 'CmdOrCtrl+1',
          click: () => sendNavigate('dashboard'),
        },
        { type: 'separator' },
        {
          label: '👥 Quản Lý Nhân Viên',
          accelerator: 'CmdOrCtrl+2',
          click: () => sendNavigate('employees'),
        },
        {
          label: '📥 Nhập Công Từ Excel',
          accelerator: 'CmdOrCtrl+3',
          click: () => sendNavigate('import'),
        },
        {
          label: '📅 Dữ Liệu Chấm Công',
          accelerator: 'CmdOrCtrl+4',
          click: () => sendNavigate('attendance'),
        },
        {
          label: '📝 Duyệt Phép & Đi Trễ',
          accelerator: 'CmdOrCtrl+5',
          click: () => sendNavigate('leaves'),
        },
      ],
    },
    {
      label: 'Tiền Lương',
      submenu: [
        {
          label: '🏆 Thưởng Chuyên Cần',
          accelerator: 'CmdOrCtrl+6',
          click: () => sendNavigate('bonuses'),
        },
        {
          label: '💰 Tổng Hợp Bảng Lương',
          accelerator: 'CmdOrCtrl+7',
          click: () => sendNavigate('salaries'),
        },
      ],
    },
    {
      label: 'Hiển Thị',
      submenu: [
        {
          label: 'Tải Lại Trang',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload',
        },
        {
          label: 'Buộc Tải Lại',
          accelerator: 'CmdOrCtrl+Shift+R',
          role: 'forceReload',
        },
        {
          label: 'Công Cụ Phát Triển (DevTools)',
          accelerator: 'F12',
          role: 'toggleDevTools',
        },
        { type: 'separator' },
        {
          label: 'Phóng To',
          accelerator: 'CmdOrCtrl+=',
          role: 'zoomIn',
        },
        {
          label: 'Thu Nhỏ',
          accelerator: 'CmdOrCtrl+-',
          role: 'zoomOut',
        },
        {
          label: 'Đặt Lại Kích Thước',
          accelerator: 'CmdOrCtrl+0',
          role: 'resetZoom',
        },
        { type: 'separator' },
        {
          label: 'Toàn Màn Hình',
          accelerator: 'F11',
          role: 'togglefullscreen',
        },
      ],
    },
    {
      label: 'Trợ Giúp',
      submenu: [
        {
          label: 'Quy Định Chấm Công & Tiền Lương',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'Quy Định Chấm Công & Tính Lương',
              message: 'QUY ĐỊNH CHẤM CÔNG',
              detail: 
                '1. Giờ làm chính: 07:00 - 17:00 (10 tiếng, không trừ giờ trưa).\n' +
                '2. Vào trễ: Cho phép đến 07:15. Nếu đủ 9h45 làm tròn 10h. Vào từ 07:16 tính là đi trễ.\n' +
                '3. Về sớm: Cho phép về sớm, quên check-out mặc định là 17:00.\n' +
                '4. Trễ không phép: Trừ 1/2 ngày lương chính. Trễ có phép: tính theo giờ thực làm.\n' +
                '5. Tăng ca: Tính ngoài giờ chính (trước 7:00 và sau 17:00), 40.000đ/giờ (chỉ lấy giờ, bỏ phút lẻ).\n' +
                '6. Chuyên cần: Không nghỉ ngày nào kể cả có phép/không phép. Tháng 1: 500k, mỗi tháng sau +100k. Có nghỉ sẽ bị reset lại 500k.',
              buttons: ['Đã hiểu'],
            });
          },
        },
        { type: 'separator' },
        {
          label: 'Giới Thiệu Ứng Dụng',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'Về Phần Mềm',
              message: 'Hệ Thống Quản Lý Chấm Công & Tiền Lương',
              detail: 'Phiên bản: 1.0.0',
              buttons: ['Đóng'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  if (win && !win.isDestroyed()) {
    win.setMenu(menu);
  }
}

