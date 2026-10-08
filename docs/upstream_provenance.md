# Nguồn gốc và Lịch sử Upstream (Upstream Provenance)

Tài liệu này ghi nhận nguồn gốc ban đầu của kho mã nguồn trước khi thực hiện tùy biến thành **VXClean**.

---

## 1. Thông tin Kho Mã nguồn và Remote

- **Remote Origin thực tế:** `https://github.com/linhbv94/Cleaner_for_Mac.git`
- **Nhánh mặc định:** `main`
- **Commit Local Baseline (Full Hash):** `42cf1f86ae91bc191858d2ae9df197e026da8f2b`
- **Tác giả Commit Local:** `Vic <vic@Vicision-Z.local>`
- **Thời gian Commit:** `2026-10-07 15:53:28 +0700`
- **Nội dung Commit:** `feat: initial commit for cleaner_for_mac`

---

## 2. Dự án Upstream Gốc

- **Địa chỉ Upstream (theo tài liệu README gốc):** `https://github.com/maclifevn/MClean`
- **Tên dự án gốc:** MClean (maclifevn)
- **Commit Upstream:** **Chưa xác minh (Unverified)**. Kho mã nguồn local được khởi tạo từ một bản import đơn lẻ (initial commit `42cf1f86ae91bc191858d2ae9df197e026da8f2b`), không chứa lịch sử git commit trước đó của upstream nên không thể xác định chính xác hash commit upstream tại thời điểm import nếu không có bằng chứng đối chiếu trực tiếp.
- **Bản quyền & Giấy phép:** Giữ nguyên toàn bộ giấy phép MIT của tác giả gốc (xem [LICENSE](../LICENSE) và [docs_upstream/readme_original.md](../docs_upstream/readme_original.md)). Mọi ghi nhận quyền tác giả của dự án MClean gốc được bảo lưu nguyên vẹn.

---

## 3. Cấu trúc Cây Nguồn Trước Khi Sửa đổi (Baseline Source Tree)

Dưới đây là cấu trúc thư mục và tập tin tại thời điểm commit `42cf1f86ae91bc191858d2ae9df197e026da8f2b`:

```text
cleaner_for_mac/
├── .claude/
│   └── settings.local.json
├── .github/
│   ├── FUNDING.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── build.yml
│       └── release.yml
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
├── MClean/
│   ├── Assets.xcassets/
│   ├── Core/
│   │   └── AppConstants.swift
│   ├── Extensions/
│   │   └── Theme.swift
│   ├── Info.plist
│   ├── Logic/
│   │   ├── Scanning/
│   │   │   ├── AppInfoFetcher.swift
│   │   │   ├── AppPathFinder.swift
│   │   │   ├── Conditions.swift
│   │   │   ├── Locations.swift
│   │   │   └── StringNormalization.swift
│   │   └── Utilities/
│   │       ├── CLI.swift
│   │       ├── FileSize.swift
│   │       ├── Logger.swift
│   │       └── OrphanSafetyPolicy.swift
│   ├── MClean.entitlements
│   ├── MCleanApp.swift
│   ├── Models/
│   │   ├── AppLanguage.swift
│   │   ├── Models.swift
│   │   ├── ScanError.swift
│   │   └── SpaceLensNode.swift
│   ├── Services/
│   │   ├── CleaningEngine.swift
│   │   ├── FullDiskAccessManager.swift
│   │   ├── Haptics.swift
│   │   ├── MenuBarController.swift
│   │   ├── PermissionCoordinator.swift
│   │   ├── ScanEngine.swift
│   │   ├── SchedulerService.swift
│   │   ├── SpaceLensEngine.swift
│   │   ├── SystemMonitor.swift
│   │   └── UpdateService.swift
│   ├── ViewModels/
│   │   ├── AppState.swift
│   │   └── SpaceLensViewModel.swift
│   ├── Views/
│   │   ├── Apps/
│   │   │   ├── AppFilesView.swift
│   │   │   └── AppListView.swift
│   │   ├── CategoryDetailView.swift
│   │   ├── Components/
│   │   │   ├── AppBundleDragHandle.swift
│   │   │   ├── AppTheme.swift
│   │   │   ├── AppearancePill.swift
│   │   │   ├── ConfettiView.swift
│   │   │   ├── DashboardCharts.swift
│   │   │   ├── EmptyStateView.swift
│   │   │   ├── FDADemoView.swift
│   │   │   ├── FileIconCache.swift
│   │   │   ├── MenuBarMonitorView.swift
│   │   │   └── PermissionSheet.swift
│   │   ├── DashboardView.swift
│   │   ├── MainWindow.swift
│   │   ├── OnboardingView.swift
│   │   ├── Orphans/
│   │   │   └── OrphanListView.swift
│   │   ├── Settings/
│   │   └── SpaceLens/
│   └── *.lproj/ (vi, en, ja, zh-Hans, zh-Hant)
├── MClean.xcodeproj/
├── MCleanTests/
├── README.md
├── dist/
│   └── MClean.app/
├── docs/ (đã đổi tên thành docs_upstream)
├── homebrew/
│   └── mclean.rb
├── project.yml
├── screenshot.png
└── scripts/
    ├── SECRETS.md
    ├── generate-appicon.swift
    └── release-local.sh
```
