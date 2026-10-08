#!/usr/bin/env python3
"""
verify_source.py — Script kiểm chứng cục bộ mã nguồn VXClean.
Kiểm tra:
  1. Swift parse syntax cho toàn bộ file Swift đã sửa đổi / nguồn dự án.
  2. Swift typecheck cho subset logic thuần (AppConstants + SystemMonitor).
  3. Plist lint và key parity 100% giữa 5 file localization.
  4. Cấu hình Xcode project (project.yml, project.pbxproj, xcscheme).
  5. Test chuyển đổi trạng thái vòng đời của AppLifecyclePolicy bằng code production thật.
"""

import os
import re
import subprocess
import sys
import tempfile

TIMEOUT_SECS = 90


def get_sdk_path():
    try:
        res = subprocess.run(
            ["xcrun", "--show-sdk-path"],
            capture_output=True,
            text=True,
            timeout=10,
            check=True
        )
        return res.stdout.strip()
    except Exception as e:
        print(f"[WARN] Không lấy được SDK qua xcrun: {e}. Dùng fallback chuẩn.")
        return "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk"


SDK_PATH = get_sdk_path()


def run_command(cmd, desc):
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=TIMEOUT_SECS)
        if res.returncode != 0:
            print(f"[FAIL] {desc}")
            if res.stdout:
                print(f"Stdout:\n{res.stdout}")
            if res.stderr:
                print(f"Stderr:\n{res.stderr}")
            return False, res.stderr
        return True, res.stdout
    except subprocess.TimeoutExpired:
        print(f"[TIMEOUT] {desc} (vượt quá {TIMEOUT_SECS}s)")
        return False, "Timeout"
    except Exception as e:
        print(f"[ERROR] {desc}: {e}")
        return False, str(e)


def get_modified_and_core_swift_files():
    core_files = [
        "MClean/MCleanApp.swift",
        "MClean/Core/AppConstants.swift",
        "MClean/Services/MenuBarController.swift",
        "MClean/Services/SchedulerService.swift",
        "MClean/Services/SystemMonitor.swift",
        "MClean/Services/UpdateService.swift",
        "MClean/Services/CleaningEngine.swift",
        "MClean/ViewModels/AppState.swift",
        "MClean/ViewModels/SpaceLensViewModel.swift",
        "MClean/Views/Components/MenuBarMonitorView.swift",
        "MClean/Views/Settings/SettingsView.swift",
        "MClean/Views/MainWindow.swift",
        "MClean/Views/OnboardingView.swift",
        "MClean/Views/Components/PermissionSheet.swift",
        "MClean/Views/Components/FDADemoView.swift",
        "MClean/Views/Components/AppBundleDragHandle.swift",
        "MClean/Views/Components/AppTheme.swift",
        "MClean/Views/Orphans/OrphanListView.swift",
        "MClean/Services/Haptics.swift",
        "MClean/Logic/Scanning/AppInfoFetcher.swift",
        "MClean/Logic/Utilities/CLI.swift",
    ]

    # Bổ sung các file Swift thay đổi từ git diff và untracked
    found = set(core_files)
    try:
        res = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if res.returncode == 0:
            for line in res.stdout.splitlines():
                line = line.strip()
                if line.endswith(".swift") and os.path.exists(line):
                    found.add(line)

        res_untracked = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if res_untracked.returncode == 0:
            for line in res_untracked.stdout.splitlines():
                line = line.strip()
                if line.endswith(".swift") and os.path.exists(line):
                    found.add(line)
    except Exception:
        pass

    return sorted(list(found))


def check_swift_parse():
    print("--- 1. Kiểm tra Cú pháp Swift (Frontend Parse) ---")
    files_to_check = get_modified_and_core_swift_files()

    all_passed = True
    for f in files_to_check:
        if not os.path.exists(f):
            print(f"[FAIL] Tệp không tồn tại: {f}")
            all_passed = False
            continue
        ok, err = run_command(
            ["swiftc", "-frontend", "-parse", "-sdk", SDK_PATH, f],
            f"Parse {f}"
        )
        if ok:
            print(f"  [OK] {f}")
        else:
            all_passed = False
    return all_passed


def check_swift_typecheck():
    print("\n--- 2. Kiểm tra Hệ thống Kiểu Dữ liệu (Typecheck Subset) ---")
    files = [
        "MClean/Core/AppConstants.swift",
        "MClean/Services/SystemMonitor.swift"
    ]
    with tempfile.TemporaryDirectory() as tmp_cache:
        cmd = [
            "swiftc", "-typecheck",
            "-sdk", SDK_PATH,
            "-module-cache-path", tmp_cache,
            "-target", "arm64-apple-macos13.0",
            "-parse-as-library"
        ] + files
        ok, err = run_command(cmd, "Typecheck AppConstants + SystemMonitor")
        if ok:
            print("  [OK] Typecheck AppConstants.swift + SystemMonitor.swift thành công.")
            return True
        return False


def parse_strings_keys(filepath):
    keys = set()
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    pattern = re.compile(r'"((?:[^"\\]|\\.)*)"\s*=\s*"((?:[^"\\]|\\.)*)";')
    for m in pattern.finditer(content):
        keys.add(m.group(1))
    return keys


def check_plists_and_localization():
    print("\n--- 3. Kiểm tra Property Lists & Đối xứng Localization (Key Parity) ---")
    all_passed = True

    # Lint Info.plist
    info_plist = "MClean/Info.plist"
    ok, _ = run_command(["plutil", "-lint", info_plist], f"Lint {info_plist}")
    if ok:
        print(f"  [OK] Lint {info_plist}")
    else:
        all_passed = False

    # Lint 5 localization files
    languages = ["en", "vi", "ja", "zh-Hans", "zh-Hant"]
    key_sets = {}
    for lang in languages:
        path = f"MClean/{lang}.lproj/Localizable.strings"
        ok, _ = run_command(["plutil", "-lint", path], f"Lint {path}")
        if ok:
            print(f"  [OK] Lint {path}")
            key_sets[lang] = parse_strings_keys(path)
        else:
            all_passed = False

    # Check key parity
    if len(key_sets) == 5:
        ref_keys = key_sets["en"]
        print(f"  Số lượng key cơ sở (en): {len(ref_keys)}")
        for lang in ["vi", "ja", "zh-Hans", "zh-Hant"]:
            cur_keys = key_sets[lang]
            missing = ref_keys - cur_keys
            extra = cur_keys - ref_keys
            if missing:
                print(f"  [FAIL] {lang} thiếu {len(missing)} key(s): {list(missing)[:5]}")
                all_passed = False
            elif extra:
                print(f"  [FAIL] {lang} thừa {len(extra)} key(s): {list(extra)[:5]}")
                all_passed = False
            else:
                print(f"  [OK] {lang} đối xứng 100% ({len(cur_keys)} keys)")

    return all_passed


def check_project_configs():
    print("\n--- 4. Kiểm tra Cấu hình Dự án Xcode & Scheme ---")
    all_passed = True

    # 1. project.yml
    with open("project.yml", "r", encoding="utf-8") as f:
        yml_content = f.read()
    if 'PRODUCT_NAME: "VXClean"' in yml_content or 'PRODUCT_NAME: VXClean' in yml_content:
        print("  [OK] project.yml: PRODUCT_NAME là VXClean")
    else:
        print("  [FAIL] project.yml thiếu cấu hình PRODUCT_NAME: VXClean")
        all_passed = False

    if 'PRODUCT_MODULE_NAME: "MClean"' in yml_content or 'PRODUCT_MODULE_NAME: MClean' in yml_content:
        print("  [OK] project.yml: PRODUCT_MODULE_NAME là MClean")
    else:
        print("  [FAIL] project.yml thiếu cấu hình PRODUCT_MODULE_NAME: MClean")
        all_passed = False

    # 2. project.pbxproj
    with open("MClean.xcodeproj/project.pbxproj", "r", encoding="utf-8") as f:
        pbx_content = f.read()
    if 'PRODUCT_NAME = VXClean;' in pbx_content:
        print("  [OK] project.pbxproj: PRODUCT_NAME = VXClean;")
    else:
        print("  [FAIL] project.pbxproj thiếu PRODUCT_NAME = VXClean;")
        all_passed = False

    if 'PRODUCT_MODULE_NAME = MClean;' in pbx_content:
        print("  [OK] project.pbxproj: PRODUCT_MODULE_NAME = MClean;")
    else:
        print("  [FAIL] project.pbxproj thiếu PRODUCT_MODULE_NAME = MClean;")
        all_passed = False

    if 'TEST_HOST = "$(BUILT_PRODUCTS_DIR)/VXClean.app/Contents/MacOS/VXClean";' in pbx_content:
        print("  [OK] project.pbxproj: TEST_HOST trỏ đúng VXClean.app")
    else:
        print("  [FAIL] project.pbxproj: TEST_HOST chưa trỏ đúng VXClean.app")
        all_passed = False

    if 'path = VXClean.app;' in pbx_content:
        print("  [OK] project.pbxproj: product reference path là VXClean.app")
    else:
        print("  [FAIL] project.pbxproj: product reference path chưa đổi thành VXClean.app")
        all_passed = False

    # 3. MClean.xcscheme
    with open("MClean.xcodeproj/xcshareddata/xcschemes/MClean.xcscheme", "r", encoding="utf-8") as f:
        scheme_content = f.read()
    if 'BuildableName = "VXClean.app"' in scheme_content and 'BuildableName = "MClean.app"' not in scheme_content:
        print("  [OK] MClean.xcscheme: BuildableName là VXClean.app (100% đồng bộ)")
    else:
        print("  [FAIL] MClean.xcscheme chưa đồng bộ BuildableName = VXClean.app")
        all_passed = False

    return all_passed


def check_lifecycle_policy_runtime():
    print("\n--- 5. Kiểm tra Logic Vòng đời Sản xuất (AppLifecyclePolicy Runtime) ---")
    print("  (Lưu ý: Đây là kiểm thử đơn vị logic sản xuất thuần; GUI runtime và FDA runtime chưa test)")

    runner_code = """
import Foundation

func runPolicyTests() {
    print("Testing AppLifecyclePolicy with production implementation...")

    // Case 1: Window closed, menu bar monitor ENABLED -> policy is accessory, do not terminate
    let d1 = AppLifecyclePolicy.decidePolicy(
        isMenuBarEnabled: true,
        hasNormalWindows: false,
        hasActiveModalOrSheet: false,
        currentPolicy: .regular
    )
    assert(d1.desiredPolicy == .accessory, "Case 1 failed: policy should be .accessory")
    assert(!d1.shouldTerminate, "Case 1 failed: shouldTerminate should be false")

    // Case 2: Window closed, menu bar monitor DISABLED -> policy is regular, should terminate
    let d2 = AppLifecyclePolicy.decidePolicy(
        isMenuBarEnabled: false,
        hasNormalWindows: false,
        hasActiveModalOrSheet: false,
        currentPolicy: .regular
    )
    assert(d2.desiredPolicy == .regular, "Case 2 failed: policy should be .regular")
    assert(d2.shouldTerminate, "Case 2 failed: shouldTerminate should be true")

    // Case 3: Normal windows still open -> policy is regular, do not terminate
    let d3 = AppLifecyclePolicy.decidePolicy(
        isMenuBarEnabled: true,
        hasNormalWindows: true,
        hasActiveModalOrSheet: false,
        currentPolicy: .accessory
    )
    assert(d3.desiredPolicy == .regular, "Case 3 failed: policy should be .regular")
    assert(!d3.shouldTerminate, "Case 3 failed: shouldTerminate should be false")

    // Case 4: Modal/sheet active -> do not change current policy, do not terminate
    let d4 = AppLifecyclePolicy.decidePolicy(
        isMenuBarEnabled: false,
        hasNormalWindows: false,
        hasActiveModalOrSheet: true,
        currentPolicy: .regular
    )
    assert(d4.desiredPolicy == .regular, "Case 4 failed: policy should remain currentPolicy")
    assert(!d4.shouldTerminate, "Case 4 failed: shouldTerminate should be false when modal active")

    // Case 5: Menu bar monitor disabled while app in background (.accessory) -> switch to .regular, reopen main window
    let d5 = AppLifecyclePolicy.handleMenuBarDisabledInBackground(
        hasNormalWindows: false,
        currentPolicy: .accessory
    )
    assert(d5.newPolicy == .regular, "Case 5 failed: newPolicy should be .regular")
    assert(d5.reopenMainWindow, "Case 5 failed: reopenMainWindow should be true")

    // Case 6: Menu bar monitor disabled while main window is already open -> no reopen needed
    let d6 = AppLifecyclePolicy.handleMenuBarDisabledInBackground(
        hasNormalWindows: true,
        currentPolicy: .regular
    )
    assert(!d6.reopenMainWindow, "Case 6 failed: reopenMainWindow should be false")

    // Case 7: App reopen (dock click, finder) -> regular policy, present main window
    let d7 = AppLifecyclePolicy.handleReopen()
    assert(d7.newPolicy == .regular, "Case 7 failed: newPolicy should be .regular")
    assert(d7.presentMain, "Case 7 failed: presentMain should be true")

    print("ALL AppLifecyclePolicy transitions PASSED using production code!")
}

runPolicyTests()
"""
    with tempfile.TemporaryDirectory() as tmp_dir:
        main_swift = os.path.join(tmp_dir, "main.swift")
        tmp_bin = os.path.join(tmp_dir, "policy_test_bin")
        tmp_module_cache = os.path.join(tmp_dir, "module_cache")
        os.makedirs(tmp_module_cache, exist_ok=True)

        with open(main_swift, "w", encoding="utf-8") as f:
            f.write(runner_code)

        # Biên dịch runner cùng MClean/Core/AppConstants.swift thật
        cmd = [
            "swiftc",
            "-sdk", SDK_PATH,
            "-module-cache-path", tmp_module_cache,
            "-target", "arm64-apple-macos13.0",
            "-o", tmp_bin,
            "MClean/Core/AppConstants.swift",
            main_swift
        ]
        ok, err = run_command(cmd, "Biên dịch AppLifecyclePolicy test runner")
        if not ok:
            return False

        # Thực thi binary
        ok, out = run_command([tmp_bin], "Chạy AppLifecyclePolicy test binary")
        if not ok:
            return False

        print("  " + out.strip())
        return True


def main():
    print("==================================================")
    print("VXClean Source Verification Runner (Production)")
    print("==================================================")

    results = [
        ("Swift Parse", check_swift_parse()),
        ("Swift Typecheck (Subset)", check_swift_typecheck()),
        ("Plists & Localization Parity", check_plists_and_localization()),
        ("Project Configs & Schemes", check_project_configs()),
        ("AppLifecyclePolicy Runtime", check_lifecycle_policy_runtime()),
    ]

    print("\n==================================================")
    print("TỔNG KẾT KẾT QUẢ KIỂM CHỨNG:")
    print("==================================================")
    all_ok = True
    for name, res in results:
        status = "PASSED" if res else "FAILED"
        print(f"  - {name}: {status}")
        if not res:
            all_ok = False

    if all_ok:
        print("\n=> TẤT CẢ KIỂM CHỨNG ĐÃ ĐẠT (ALL CHECKS PASSED)!")
        sys.exit(0)
    else:
        print("\n=> CÓ KIỂM CHỨNG THẤT BẠI (SOME CHECKS FAILED)!")
        sys.exit(1)


if __name__ == "__main__":
    main()
