Tài liệu đặc tả cho AI

- CẤU HÌNH:
Tên db: athong_chamcong
user local: root
pass: rỗng

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
4. Thưởng chuyên cần theo tháng
5. Bảng nhân viên gồm:
  Mã
  Tên nhân viên
  Lương theo giờ
  Lương tăng ca theo giờ

- QUY ĐỊNH CHẤM CÔNG VÀ TÍNH LƯƠNG:
  Giờ làm chính: 7:00 đến 17:00 
  Cho phép vào trễ 15 phút: 7:15 đến 17:00 không tính là đi trễ.
  Nếu 7:16 vào thì coi như là trường hợp đi trễ. (Cho phép về sớm trước 17:00)
  Giờ tăng ca được tính ngoài giờ làm chính (7:00 đến 17:00)
  -------------------
  Trường hợp đi trễ KHÔNG XIN PHÉP thì bị trừ 1/2 ngày lương
  Có xin phép thì làm bao nhiêu giờ tính bấy nhiêu
  -------------------
  Thưởng chuyên cần cộng vào lương, ví dụ:
  1. Tháng đầu không nghỉ ngày nào thì thưởng 500k
  2. Các tháng tiếp theo không nghỉ ngày nào thì cộng thêm +100k. Ví dụ tháng thứ 2: 600k, tháng thứ 3: 700k.
  3. Còn nếu trong tháng có nghỉ thì không được nhận thưởng. Và reset lại 500k cho tháng sau nếu không nghỉ ngày nào.
  -------------------
  Tính lương theo giờ (Không tính các phút lẻ, không làm tròn)
  Lương chính thức:
    20000/giờ
    200000/ngày
  Lương học việc:
    16.666/giờ
    166660/ngày
  Lương tăng ca: áp dụng cho chính thức và học việc là: 40000/giờ