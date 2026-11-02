Tài liệu đặc tả cho AI

- Kiến trúc kỹ thuật:
Source dùng Vite + React + Electron
Dùng SQLite
Trên trường đặt bằng tiếng anh
File db và các file import nên lưu vào thư mục an toàn tại app.getPath('userData')

- CHỨC NĂNG PHẦN MỀM
1. Đăng nhập: bảng user chứa thông tin đăng nhập
2. Nhập dữ liệu chấm công từ excel
  Lưu file trước khi import, tên file là Ymd_Hms với phần mở rộng
3. Xem dữ liệu chấm công:
  Ngoài dữ liệu đã nhập cần thêm các trường như: 
    Giờ làm chính
    Giờ làm ngoài giờ
    Ghi nhận đi trễ
    Trễ có phép
    Trễ không phép
    Xin nghỉ
  Duyệt phép
4. Thưởng chuyên cần theo tháng
5. Bảng nhân viên gồm:
  Mã
  Tên nhân viên
  Lương theo giờ
  Lương tăng ca theo giờ
6. Tổng hợp lương theo tháng: Xem tổng công, tổng giờ chính, tổng tăng ca, phạt trễ, chuyên cần, thực lĩnh. Không cần xuất dữ liệu excel.

- QUY ĐỊNH CHẤM CÔNG VÀ TÍNH LƯƠNG:
  Giờ làm chính: 7:00 đến 17:00 (Khách không trừ giờ nghỉ trưa vẫn tính giờ cho nhân viên luôn).
  Cho phép vào trễ 15 phút: 7:15 đến 17:00 không tính là đi trễ. Trong phạm vi giờ làm chính nếu đủ 9 giờ 45 phút thì làm tròn 10 giờ (chỉ làm tròn đối với trường hợp này).
  Nếu 7:16 vào thì coi như là trường hợp đi trễ. 
  Cho phép về sớm trước 17:00, nếu quên check giờ ra thì sẽ tính giờ ra là 17:00. Ví dụ nếu làm từ 7:00 đến 15:00 = 8 tiếng, không cần ghi nhận xin phép về sớm
  Giờ tăng ca được tính ngoài giờ làm chính (7:00 đến 17:00): trước 7:00 sáng và sau 17:00 tối. Lương tăng ca lấy giờ (bỏ phút lẻ).
  -------------------
  Trường hợp đi trễ KHÔNG XIN PHÉP thì bị trừ 1/2 ngày lương, lương ngoài giờ tính riêng không gom vào.
  Có xin phép thì làm bao nhiêu giờ tính bấy nhiêu
  -------------------
  Thưởng chuyên cần cộng vào lương, điều kiện là không nghỉ ngày nào kể cả có phép hoặc không phép, còn đi trễ không phép thì vẫn tính là có làm, ví dụ:
  1. Tháng đầu không nghỉ ngày nào thì thưởng 500k
  2. Các tháng tiếp theo không nghỉ ngày nào thì cộng thêm +100k. Ví dụ tháng thứ 2: 600k, tháng thứ 3: 700k.
  3. Còn nếu trong tháng có nghỉ thì không được nhận thưởng. Và reset lại 500k cho tháng sau nếu không nghỉ ngày nào.
  4. Không có mức giới hạn tối đa cho thưởng chuyên cần.
  5. Vì đây là đặc thù nên không có ngày nghỉ chủ nhật hay lễ.
  6. Nếu nhân viên không làm đủ các ngày trong tháng thì không tính chuyên cần tháng đó kể cả nhân viên mới
  -------------------
  Tính lương theo giờ (Không tính các phút lẻ, không làm tròn)
  Lương chính thức:
    20000/giờ
    200000/ngày
  Lương học việc:
    16.666/giờ
    166660/ngày
  Lương tăng ca: áp dụng cho chính thức và học việc là: 40000/giờ

- Dữ liệu máy chấm công xuất ra định dang excel gồm dòng/cột và dữ liệu như bên dưới.
  	B	C	D	E	F	G	H
  1	Mã	Ngày	Giờ	Kiểu chấm	Nguồn chấm	Mã số máy	Tên máy
  2	3	46296	46296.56319	255	1	1	Máy MCC00001
  3	3	46296	46296.57569	255	1	1	Máy MCC00001
  4	3	46296	46296.625	255	1	1	Máy MCC00001
  5	3	46296	46296.67083	255	1	1	Máy MCC00001
  6	4	46296	46296.69583	255	1	1	Máy MCC00001
  7	5	46296	46296.69653	255	1	1	Máy MCC00001
  8	1	46296	46296.69653	255	1	1	Máy MCC00001
  9	6	46296	46296.69722	255	1	1	Máy MCC00001
  10	2	46296	46296.69722	255	1	1	Máy MCC00001
  11	1	46297	46297.29097	255	1	1	Máy MCC00001
  12	5	46297	46297.30903	255	1	1	Máy MCC00001
  13	2	46297	46297.31944	255	1	1	Máy MCC00001
  14	6	46297	46297.32569	255	1	1	Máy MCC00001
  15	2	46297	46297.72083	255	1	1	Máy MCC00001
  16	5	46297	46297.72083	255	1	1	Máy MCC00001
  17	1	46297	46297.72083	255	1	1	Máy MCC00001
  18	6	46297	46297.72153	255	1	1	Máy MCC00001
  19	1	46298	46298.29028	255	1	1	Máy MCC00001

- Quản lý nhân viên và bảng lương
  Bảng nhân viên: bổ sung loại nhân viên, ngày vào làm, trạng thái