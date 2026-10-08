import Foundation
import Darwin
import Combine
import IOKit.ps

/// Lightweight live system telemetry for the menu-bar monitor (CPU / memory /
/// disk / battery). Polls on a timer only while observing surfaces request it;
/// the menu bar keeps a single shared instance alive, and `start()` / `stop()`
/// gate the timer so the app does no background sampling when the monitor is disabled.
///
/// All readings use public Mach / Foundation / IOKit APIs (no sandbox-incompatible
/// shelling out), remaining safe under hardened-runtime and notarization.
@MainActor
final class SystemMonitor: ObservableObject {
    static let shared = SystemMonitor()

    // MARK: - CPU
    /// 0.0 - 1.0 fraction of total CPU time spent non-idle since the last sample.
    @Published private(set) var cpuUsage: Double = 0
    /// History of up to 30 CPU samples (sampled every 2s => ~1 min window).
    /// Sampled only when the popover is visible; reset upon opening.
    @Published private(set) var cpuHistory: [Double] = []

    // MARK: - Memory
    /// Estimated memory in active use (sum of active, wired, and compressed pages).
    @Published private(set) var memoryUsed: Int64 = 0
    @Published private(set) var memoryTotal: Int64 = 0
    /// Active pages from Mach VM (includes active file-backed and anonymous memory).
    @Published private(set) var memoryActive: Int64 = 0
    /// Wired pages (memory that cannot be paged out).
    @Published private(set) var memoryWired: Int64 = 0
    /// Compressed memory pages.
    @Published private(set) var memoryCompressed: Int64 = 0

    var memoryFraction: Double {
        guard memoryTotal > 0 else { return 0 }
        return Double(memoryUsed) / Double(memoryTotal)
    }

    // MARK: - Disk / Storage
    @Published private(set) var diskUsed: Int64 = 0
    @Published private(set) var diskTotal: Int64 = 0
    /// Available capacity for important usage (as reported by APFS/macOS, may include purgeable space).
    @Published private(set) var diskAvailable: Int64 = 0

    var diskFraction: Double {
        guard diskTotal > 0 else { return 0 }
        return Double(diskUsed) / Double(diskTotal)
    }

    // MARK: - Battery
    struct BatteryState: Equatable {
        var hasBattery: Bool = false
        var chargePercent: Int = 0
        var isCharging: Bool = false
        var isACPowered: Bool = false
        var isCharged: Bool = false
    }

    @Published private(set) var batteryState: BatteryState = BatteryState()

    // MARK: - Internal State
    private var timer: Timer?
    /// Previous CPU tick counters, kept to turn kernel totals into per-interval deltas.
    private var previousBusy: UInt64 = 0
    private var previousTotal: UInt64 = 0
    /// Number of live status item observers.
    private var observerCount = 0
    /// Observers that display memory/disk/battery/history (the popover).
    private var detailObserverCount = 0

    private init() {}

    /// Begin sampling. Refcounted so multiple observers share a timer.
    func start(interval: TimeInterval = 2.0) {
        observerCount += 1
        guard timer == nil else { return }
        memoryTotal = Int64(ProcessInfo.processInfo.physicalMemory)
        sample()
        let t = Timer(timeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.sample() }
        }
        RunLoop.main.add(t, forMode: .common)
        timer = t
    }

    /// Release one observer; timer stops once the last observer detaches.
    func stop() {
        observerCount = max(0, observerCount - 1)
        guard observerCount == 0 else { return }
        timer?.invalidate()
        timer = nil
    }

    /// The popover came on screen: reset stale history, sample detailed metrics
    /// immediately, and keep sampling them on each tick.
    func startDetail() {
        let wasInactive = (detailObserverCount == 0)
        detailObserverCount += 1

        if wasInactive {
            // Fresh popover presentation: reset history to start clean ~1-minute window
            cpuHistory = (cpuUsage > 0) ? [cpuUsage] : []
        }

        sampleMemory()
        sampleDisk()
        sampleBattery()
    }

    /// The popover closed: cease memory/disk/battery sampling to eliminate idle cost.
    func stopDetail() {
        detailObserverCount = max(0, detailObserverCount - 1)
    }

    private func sample() {
        sampleCPU()
        guard detailObserverCount > 0 else { return }

        // Update CPU history only when popover is visible
        var history = cpuHistory
        history.append(cpuUsage)
        if history.count > 30 {
            history.removeFirst(history.count - 30)
        }
        cpuHistory = history

        sampleMemory()
        sampleDisk()
        sampleBattery()
    }

    // MARK: - CPU Sampling

    private func sampleCPU() {
        var info = host_cpu_load_info()
        var count = mach_msg_type_number_t(
            MemoryLayout<host_cpu_load_info_data_t>.stride / MemoryLayout<integer_t>.stride
        )
        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                host_statistics(mach_host_self(), HOST_CPU_LOAD_INFO, $0, &count)
            }
        }
        guard result == KERN_SUCCESS else { return }

        let user = UInt64(info.cpu_ticks.0)
        let system = UInt64(info.cpu_ticks.1)
        let idle = UInt64(info.cpu_ticks.2)
        let nice = UInt64(info.cpu_ticks.3)
        let busy = user &+ system &+ nice
        let total = busy &+ idle

        defer { previousBusy = busy; previousTotal = total }
        guard previousTotal != 0, total > previousTotal else { return }

        let busyDelta = Double(busy &- previousBusy)
        let totalDelta = Double(total &- previousTotal)
        guard totalDelta > 0 else { return }
        cpuUsage = min(1, max(0, busyDelta / totalDelta))
    }

    // MARK: - Memory Sampling

    private func sampleMemory() {
        var stats = vm_statistics64()
        var count = mach_msg_type_number_t(
            MemoryLayout<vm_statistics64_data_t>.stride / MemoryLayout<integer_t>.stride
        )
        let result = withUnsafeMutablePointer(to: &stats) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                host_statistics64(mach_host_self(), HOST_VM_INFO64, $0, &count)
            }
        }
        guard result == KERN_SUCCESS else { return }

        let pageSize = Int64(vm_kernel_page_size)
        let active = Int64(stats.active_count) * pageSize
        let wired = Int64(stats.wire_count) * pageSize
        let compressed = Int64(stats.compressor_page_count) * pageSize

        memoryActive = active
        memoryWired = wired
        memoryCompressed = compressed
        memoryUsed = active + wired + compressed
    }

    // MARK: - Disk Sampling

    private func sampleDisk() {
        let url = URL(fileURLWithPath: NSHomeDirectory())
        guard let values = try? url.resourceValues(forKeys: [
            .volumeTotalCapacityKey,
            .volumeAvailableCapacityForImportantUsageKey,
        ]) else { return }

        if let total = values.volumeTotalCapacity {
            diskTotal = Int64(total)
        }
        if let available = values.volumeAvailableCapacityForImportantUsage {
            diskAvailable = Int64(available)
            diskUsed = max(0, diskTotal - diskAvailable)
        }
    }

    // MARK: - Battery Sampling

    private func sampleBattery() {
        guard let snapshot = IOPSCopyPowerSourcesInfo()?.takeRetainedValue() else {
            batteryState = BatteryState(hasBattery: false)
            return
        }
        guard let sources = IOPSCopyPowerSourcesList(snapshot)?.takeRetainedValue() as? [CFTypeRef], !sources.isEmpty else {
            batteryState = BatteryState(hasBattery: false)
            return
        }

        for source in sources {
            guard let desc = IOPSGetPowerSourceDescription(snapshot, source)?.takeUnretainedValue() as? [String: Any] else {
                continue
            }

            // Only accept real internal batteries (filters out UPS, accessories, external devices)
            guard let typeStr = desc[kIOPSTypeKey] as? String,
                  typeStr == kIOPSInternalBatteryType else {
                continue
            }

            let isPresent = desc[kIOPSIsPresentKey] as? Bool ?? false
            guard isPresent else { continue }

            guard let cur = desc[kIOPSCurrentCapacityKey] as? Int,
                  let maxCap = desc[kIOPSMaxCapacityKey] as? Int,
                  cur >= 0, maxCap > 0 else {
                continue
            }

            guard let pState = desc[kIOPSPowerSourceStateKey] as? String,
                  (pState == kIOPSACPowerValue || pState == kIOPSBatteryPowerValue) else {
                continue
            }
            let isAC = (pState == kIOPSACPowerValue)
            let charging = desc[kIOPSIsChargingKey] as? Bool ?? false
            let isCharged = desc[kIOPSIsChargedKey] as? Bool ?? false

            let rawPercent = Int((Double(cur) / Double(maxCap)) * 100)
            let clampedPercent = min(100, max(0, rawPercent))

            batteryState = BatteryState(
                hasBattery: true,
                chargePercent: clampedPercent,
                isCharging: charging,
                isACPowered: isAC,
                isCharged: isCharged
            )
            return
        }
        batteryState = BatteryState(hasBattery: false)
    }
}
