import SwiftUI
import AppKit

/// Drop-down panel hosted in the menu-bar `NSPopover` (via `NSHostingController`)
/// with live CPU, memory, disk, and battery meters, plus quick actions.
/// Lifecycle is managed entirely by `MenuBarController` and `NSPopoverDelegate`.
struct MenuBarMonitorView: View {
    @ObservedObject private var monitor = SystemMonitor.shared
    let onSmartScan: () -> Void
    let onOpenApp: () -> Void
    let onOpenSettings: () -> Void
    let onQuit: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 12)

            Divider()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 16) {
                    // CPU Section
                    cpuSection

                    // Memory Section
                    memorySection

                    // Storage Section
                    storageSection

                    // Battery Section (only if real internal battery is present)
                    if monitor.batteryState.hasBattery {
                        batterySection
                    }
                }
                .padding(16)
            }
            .frame(maxHeight: 520)

            Divider()

            // Quick Actions
            HStack(spacing: 10) {
                Button(action: onSmartScan) {
                    Label("Smart Scan", systemImage: "sparkles")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.regular)

                Button(action: onOpenApp) {
                    Label("Open VXClean", systemImage: "macwindow")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .controlSize(.regular)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            Divider()

            // Footer
            HStack {
                Button(action: onOpenSettings) {
                    Label("Settings…", systemImage: "gearshape")
                }
                .buttonStyle(.plain)

                Spacer()

                Button(action: onQuit) {
                    Label("Quit VXClean", systemImage: "power")
                }
                .buttonStyle(.plain)
            }
            .font(.system(size: 12))
            .foregroundStyle(.secondary)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .frame(width: 380)
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 11) {
            MCleanAppIcon(size: 32, shadow: true)

            VStack(alignment: .leading, spacing: 2) {
                Text("VXClean")
                    .font(.system(size: 14, weight: .semibold))
                Text("System Monitor")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
            }

            Spacer()

            HStack(spacing: 5) {
                Circle()
                    .fill(Color.green)
                    .frame(width: 7, height: 7)
                Text("Live")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - CPU Section

    private var cpuSection: some View {
        VStack(spacing: 6) {
            MeterRow(
                title: "CPU",
                systemImage: "cpu",
                tint: Color.blue,
                fraction: monitor.cpuUsage,
                detail: "\(Int((monitor.cpuUsage * 100).rounded()))%"
            )

            if monitor.cpuHistory.count >= 2 {
                CPUSparklineView(data: monitor.cpuHistory, tint: Color.blue)
                    .frame(height: 24)
                    .padding(.leading, 28)
            }
        }
    }

    // MARK: - Memory Section

    private var memorySection: some View {
        VStack(spacing: 6) {
            MeterRow(
                title: "Memory",
                systemImage: "memorychip",
                tint: Color.purple,
                fraction: monitor.memoryFraction,
                detail: byteDetail(monitor.memoryUsed, monitor.memoryTotal)
            )

            VStack(spacing: 3) {
                subMetricRow(label: "Active Pages", bytes: monitor.memoryActive)
                subMetricRow(label: "Wired Memory", bytes: monitor.memoryWired)
                subMetricRow(label: "Compressed", bytes: monitor.memoryCompressed)
            }
            .padding(.leading, 28)
        }
    }

    // MARK: - Storage Section

    private var storageSection: some View {
        VStack(spacing: 6) {
            MeterRow(
                title: "Storage",
                systemImage: "internaldrive",
                tint: Color.teal,
                fraction: monitor.diskFraction,
                detail: byteDetail(monitor.diskUsed, monitor.diskTotal)
            )

            HStack {
                Text("Available")
                    .font(.system(size: 10.5))
                    .foregroundStyle(.tertiary)
                Spacer()
                Text(byteString(monitor.diskAvailable))
                    .font(.system(size: 10.5, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .padding(.leading, 28)
        }
    }

    // MARK: - Battery Section

    private var batterySection: some View {
        let state = monitor.batteryState
        let iconName: String = {
            if state.isCharging { return "battery.100.bolt" }
            if state.chargePercent > 50 { return "battery.100" }
            if state.chargePercent > 20 { return "battery.50" }
            return "battery.25"
        }()

        let tintColor: Color = {
            if state.isCharging { return Color.green }
            if state.chargePercent <= 20 { return Color.orange }
            return Color.green
        }()

        return VStack(spacing: 6) {
            MeterRow(
                title: "Battery",
                systemImage: iconName,
                tint: tintColor,
                fraction: Double(state.chargePercent) / 100.0,
                detail: "\(state.chargePercent)%"
            )

            HStack {
                if state.isACPowered {
                    Text("Power Source: AC Adapter")
                        .font(.system(size: 10.5))
                        .foregroundStyle(.tertiary)
                } else {
                    Text("Power Source: Battery")
                        .font(.system(size: 10.5))
                        .foregroundStyle(.tertiary)
                }
                Spacer()
                if state.isCharging {
                    Text("Charging")
                        .font(.system(size: 10.5, weight: .medium))
                        .foregroundStyle(Color.green)
                } else if state.isCharged {
                    Text("Fully Charged")
                        .font(.system(size: 10.5, weight: .medium))
                        .foregroundStyle(.secondary)
                } else if state.isACPowered {
                    Text("Not Charging")
                        .font(.system(size: 10.5, weight: .medium))
                        .foregroundStyle(.secondary)
                } else {
                    Text("Discharging")
                        .font(.system(size: 10.5, weight: .medium))
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.leading, 28)
        }
    }

    // MARK: - Helpers

    private func byteDetail(_ used: Int64, _ total: Int64) -> String {
        let u = byteString(used)
        let t = byteString(total)
        return "\(u) / \(t)"
    }

    private func byteString(_ bytes: Int64) -> String {
        ByteCountFormatter.string(fromByteCount: bytes, countStyle: .file)
    }

    private func subMetricRow(label: LocalizedStringKey, bytes: Int64) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 10.5))
                .foregroundStyle(.tertiary)
            Spacer()
            Text(byteString(bytes))
                .font(.system(size: 10.5, weight: .medium))
                .foregroundStyle(.secondary)
        }
    }
}

/// A compact sparkline path rendering the recent CPU history.
private struct CPUSparklineView: View {
    let data: [Double]
    let tint: Color

    var body: some View {
        GeometryReader { proxy in
            let w = proxy.size.width
            let h = proxy.size.height

            if data.count >= 2 {
                Path { path in
                    let step = w / CGFloat(max(1, data.count - 1))
                    for (index, val) in data.enumerated() {
                        let clamped = max(0.0, min(1.0, val))
                        let x = CGFloat(index) * step
                        let y = h - (CGFloat(clamped) * (h - 2)) - 1
                        if index == 0 {
                            path.move(to: CGPoint(x: x, y: y))
                        } else {
                            path.addLine(to: CGPoint(x: x, y: y))
                        }
                    }
                }
                .stroke(tint.opacity(0.8), lineWidth: 1.5)
            } else {
                Color.clear
            }
        }
        .accessibilityElement()
        .accessibilityLabel(Text("CPU History: \(data.count) samples"))
    }
}

/// One labeled meter: title on the left, a thin tinted progress bar, and trailing numeric detail.
private struct MeterRow: View {
    let title: LocalizedStringKey
    let systemImage: String
    let tint: Color
    let fraction: Double
    let detail: String

    private var clamped: Double { max(0, min(1, fraction)) }

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: systemImage)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(tint)
                .frame(width: 18)

            VStack(spacing: 5) {
                HStack {
                    Text(title)
                        .font(.system(size: 11.5, weight: .medium))
                    Spacer()
                    Text(detail)
                        .font(.system(size: 11, weight: .medium))
                        .monospacedDigit()
                        .foregroundStyle(.secondary)
                }

                ProgressView(value: clamped)
                    .progressViewStyle(.linear)
                    .tint(tint)
                    .controlSize(.small)
            }
        }
    }
}
