# Một lần xác thực admin và Quick cache không đóng app

Ngày 2026-10-11. Feedback production: mỗi mục System Junk hỏi mật khẩu, Quick đóng Chrome/ChatGPT/Antigravity, có lô bị ngắt vì manifest quá lớn.

- Một lượt dọn dùng một engine process và một payload có giới hạn 64 MiB; giữ đầy đủ proof, không cắt manifest. Kiểm tra giới hạn trước khi ghi intent/dọn. Không chia thành nhiều subprocess làm mất phiên xác thực.
- Dọn user-level trước; gom đúng những mục được cấp quyền và gặp permission để chạy một AppleScript admin cuối lượt. Mỗi mục kiểm tra identity/symlink và trạng thái tiến trình, trả kết quả riêng, journal riêng. Cancel không hỏi lại cho các mục khác, không tự replay. Không lưu password.
- Quick trong Library/Caches: không ép đóng app. Giữ guard dữ liệu profile/project/runtime và identity/content, chỉ dọn cache đã cấp quyền. Cache đang ghi có thể bị bỏ qua do thay đổi hoặc sinh lại. Chrome detailed/Application Support và adapter media/AI chi tiết vẫn giữ lifecycle theo rule.
- Nghiệm thu: nhiều mục cần admin chỉ một invocation; Cancel giữ các mục pending; path có dấu nháy/newline không chèn lệnh; identity thay đổi không xóa; payload >4 MiB qua producer→consumer không cắt proof; scan Quick không requires_app_quit dù Chrome đang mở; detailed giữ yêu cầu.

## Điều chỉnh 1.0.6 sau QA GUI thật

Hai lượt GUI chưa mutation: identity hoặc content một target đổi sau scan chặn cả Quick. Quick host phải preflight từng target độc lập, báo skipped theo path/lý do, chỉ gửi những target còn đúng proof. Không refresh proof để cấp quyền nội dung mới ngoài ngoại lệ Chrome cache đang mở được quy định ở mục cuối; không bỏ guard. Detailed/uninstall vẫn strict. Mọi skipped được cộng failure_count và hiển thị trong summary/history; không tự retry/replay.

## Điều chỉnh1.0.7 — admin physical parent

QA GUI1.0.6 dọn69/92mục,1.131.565.337bytes;4target đổi sau scan và19admin targets bị parent guard chặn. Foundation URL có thể hiển thị /tmp hoặc /var/log dù physical path là /private/...; parent shell pwd -P phải so với Darwin realpath, không Foundation URL.path. Thêm native fixture thật raw /tmp và /var/tmp qua cùng admin guarded shell; vẫn một invocation. Parser stdout xử lý cả LF/CR do AppleScript chuẩn hóa newline.

## Thông báo Quick ngắn gọn — 2026-10-11

- Lỗi thao tác và quét chưa đầy đủ dùng thông báo tiếng Việt ngắn, có nút đóng. Mã lỗi, đường dẫn và lý do kỹ thuật nằm trong phần chi tiết mở rộng, không nối thành đoạn đỏ dài.
- Kết quả dọn một phần giữ rõ số mục chưa dọn và số mục thành công; dùng biểu tượng cảnh báo thay biểu tượng thành công toàn phần. Chi tiết gom lý do trùng và giới hạn chiều cao cuộn.
- Đóng thông báo không thay đổi kết quả, lựa chọn hoặc khả năng quét lại. Quét mới đặt lại trạng thái thông báo.

## Chrome cache đang mở — 2026-10-11

- Quick đã cấp quyền cho mục `~/Library/Caches/Google/Chrome` theo `chrome_quick_cache` thì nội dung cache thay đổi không làm vô hiệu toàn mục. Giữ kiểm tra định danh thư mục gốc; chỉ lấy manifest hiện tại trong chính vùng cache đã chọn.
- Native xác minh lại từng đường dẫn, rule, symlink/hardlink và file thường trước khi xóa. File cùng inode được ghi thêm vẫn được dọn; dùng kích thước thực tại lúc cô lập để tính dung lượng. File thay định danh giữa manifest thực thi và xóa vẫn bị từ chối.
- Không áp dụng cơ chế này cho Application Support, profile, Detailed, gỡ app, tệp cá nhân hoặc rule chưa xác minh. Không quit Chrome trong Quick; cache mới sinh sau khi dọn có thể xuất hiện lại.

## Hoàn tất live Quick: Codex cache và loại wifi.log — 2026-10-11

- Áp dụng cùng cơ chế cache đang mở cho `ai_frontend_quick_cache` trong `~/Library/Caches/Codex`. Không mở rộng sang Application Support, lịch sử, plugin/MCP/runtime. Giữ root identity, rule từng child, no-follow/hardlink và kiểm tra inode lúc cô lập file.
- Theo chỉ đạo mới của user, bỏ riêng `/var/log/wifi.log` và alias `/private/var/log/wifi.log` khỏi scope Quick: không emit item, không cộng total/default selection hoặc đưa vào nhóm giữ lại. Native revalidation cũng từ chối nếu có payload/ticket cũ. Log xoay vòng như `wifi.log.0.bz2` vẫn giữ rule MClean hiện tại. Không nới content guard cho System Junk vì vấn đề wifi.log.
- Các rule khác vẫn dùng snapshot strict. Quét/dọn lại không tự replay hoặc mở rộng sang tệp lớn chưa chọn. App/OS có thể sinh cache/log mới sau dọn, vì vậy không hứa mọi scan sau đó là 0 B.

## UX chọn card và cảnh báo sự cố — 2026-10-11

- Card hạng mục Quick: click nền, tiêu đề, icon, mô tả hoặc dung lượng bật/tắt toàn bộ mục có thể dọn. Khi chọn một phần, click card chọn hết; click lần nữa bỏ hết.
- Toàn bộ dòng “Xem và chọn từng mục” chỉ mở/đóng details, không đổi lựa chọn. Checkbox từng tệp chỉ đổi tệp đó. Checkbox nhóm không toggle hai lần. Enter/Space trên card chọn nhóm; thao tác trên controls con giữ hành vi riêng.
- Cảnh báo chỉ hiện cho incident thực tế chưa được user acknowledge. Nút X lưu trạng thái đã xem qua backend, giữ nguyên bằng chứng và guard updater. Lịch sử độc lập tại Settings vẫn xem được cả lượt cũ, lượt đã ẩn và lượt thành công. Lượt thành công mới không được che nghĩa vụ mở lại app cũ; app đã chạy lại đúng bundle/path được đối soát thụ động.
- Không thay engine dọn hoặc tự chạy lại bất kỳ thao tác xóa nào.

## Bảo trì recovery/admin/policy — 2026-10-11

- Banner dùng incident chưa acknowledge từ toàn history, không dùng latest-only. Settings có lịch sử độc lập; acknowledge không đổi kết quả xóa, không bỏ guard updater. Backend cung cấp recovery_required cho UI và cùng phân loại pending reopen/journal lỗi cho updater.
- Reconcile chỉ đối soát app đang chạy đúng bundle/path; version khác do update không ngăn xác nhận already_running. Tự launch vẫn yêu cầu identity/version được kiểm chứng như cũ. Không tự Quit/launch qua thao tác xem history.
- Journal đọc giới hạn từng operation, trả summary thay full success-file log, tối đa200 failed/unknown targets mỗi operation trên UI; có tổng số retained targets và archive nguyên bản cho phần còn lại. Terminal có thể compact vào archive gzip có checksum và summary commit nguyên tử; giữ evidence unknown, không coi là success. Pending reopen/corrupt không compact. Known partial/cancelled có vòng đời180 ngày; unknown không tự hết hạn.
- Admin batch trả status từng mục, một parent lỗi không chặn siblings. Revalidate root metadata sau password; System Junk cấp quyền toàn root MClean, không claim proof từng descendant. Cancel giữ phần đã xóa nếu có. Một lượt một lần xác thực.
- execution_mode của rule native phân biệt strict_snapshot và live_cache_root; Rust dùng metadata đã giữ trong scan ticket, không thêm allowlist app riêng. Không mở rộng scope Quick.
- Một cleanup request/process, bỏ vòng loop batch cũ; giữ toàn proof và giới hạn64MiB. Đo RAM với fixture lớn. Regression nối history/banner/updater và admin guard lỗi từng mục.

- Khi compact, giữ `history_updated_at_ms` từ journal gốc để thứ tự và tuổi retention không bị reset theo thời điểm nén hoặc acknowledge. Có regression đọc trước/sau nén và ẩn cảnh báo.

## Thứ tự item khi expand — 2026-10-12

- Danh sách item trong mỗi card kết quả quét sắp theo size_bytes giảm dần (lớn trước, nhỏ sau). Chỉ đổi thứ tự hiển thị, giữ path làm key và giữ nguyên lựa chọn/scope dọn. Không mutate mảng items của scan ticket.
