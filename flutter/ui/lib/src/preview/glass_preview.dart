import 'dart:async';
import 'dart:convert';
import 'dart:developer' as developer;
import 'dart:ui' show FramePhase, FrameTiming;

import '../../acme_ui.dart';
import '../glass.dart' show GlassPreviewOverride, glassBlurEnabled;
import 'specimen.dart' show previewTabs;

/// A fixed backdrop makes the device tiers and their frame timings comparable.
class GlassPreview extends StatefulWidget {
  const GlassPreview({
    super.key,
    this.tier,
    this.autoscroll = false,
    this.sheet = false,
  });
  final String? tier;
  final bool autoscroll, sheet;

  @override
  State<GlassPreview> createState() => _GlassPreviewState();
}

class _GlassPreviewState extends State<GlassPreview> {
  final scroll = ScrollController();
  final sceneKey = GlobalKey();
  late bool sheet = widget.sheet;
  String selected = 'home';
  final frames = <FrameTiming>[];
  Timer? warmup, flush;
  bool listening = false;

  @override
  void initState() {
    super.initState();
    if (widget.autoscroll) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) warmup = Timer(const Duration(seconds: 2), _measure);
      });
    }
  }

  void collect(List<FrameTiming> batch) => frames.addAll(batch);

  Future<void> _measure() async {
    if (!mounted || !scroll.hasClients) return;
    final binding = WidgetsBinding.instance;
    binding.addTimingsCallback(collect);
    listening = true;
    String resolved() =>
        glassBlurEnabled(sceneKey.currentContext!) ? 'blur' : 'solid';
    final startTier = resolved();
    final task = developer.TimelineTask()..start('Glass scroll');
    await scroll.animateTo(
      scroll.position.maxScrollExtent,
      duration: const Duration(seconds: 10),
      curve: Curves.linear,
    );
    task.finish();
    if (!mounted) return;
    final end = binding.currentSystemFrameTimeStamp.inMicroseconds;
    final endTier = resolved();
    // In profile mode the engine delivers frame timings in batches, after raster completion.
    flush = Timer(const Duration(seconds: 2), () {
      binding.removeTimingsCallback(collect);
      listening = false;
      final measured = frames.where((f) {
        final time = f.timestampInMicroseconds(FramePhase.vsyncStart);
        return time >= end - 10000000 && time <= end;
      }).toList();
      if (measured.isEmpty) {
        debugPrint('XDS_GLASS_FRAMES {"frames":0}');
        return;
      }
      final builds =
          measured.map((f) => f.buildDuration.inMicroseconds).toList()..sort();
      final rasters =
          measured.map((f) => f.rasterDuration.inMicroseconds).toList()..sort();
      final durations = measured.map((f) => f.totalSpan.inMicroseconds).toList()
        ..sort();
      final vsync =
          measured
              .map((f) => f.timestampInMicroseconds(FramePhase.vsyncStart))
              .toList()
            ..sort();
      final intervals = [
        for (var i = 1; i < vsync.length; i++) vsync[i] - vsync[i - 1],
      ]..sort();
      double percentile(List<int> values, double share) =>
          values[(values.length * share).ceil() - 1] / 1000;
      final result = {
        'tier': widget.tier ?? 'auto',
        'actualTier': startTier,
        'finalTier': endTier,
        'sheet': widget.sheet,
        'frames': measured.length,
        'windowStartUs': end - 10000000,
        'windowEndUs': end,
        'firstVsyncUs': vsync.first,
        'lastVsyncUs': vsync.last,
        'vsyncGapsOver12_5Ms': intervals.where((time) => time > 12500).length,
        'vsyncSlotsMissedAt120Hz': intervals.fold<int>(
          0,
          (total, time) =>
              total + ((time * 120 / 1000000).round() - 1).clamp(0, 1200),
        ),
        'buildP90Ms': percentile(builds, .9),
        'rasterP90Ms': percentile(rasters, .9),
        'totalSpanP99Ms': percentile(durations, .99),
        if (intervals.isNotEmpty) 'vsyncP99Ms': percentile(intervals, .99),
        'buildOver8_33Ms': builds.where((time) => time > 8333).length,
        'rasterOver8_33Ms': rasters.where((time) => time > 8333).length,
      };
      debugPrint('XDS_GLASS_FRAMES ${jsonEncode(result)}');
    });
  }

  @override
  void dispose() {
    warmup?.cancel();
    flush?.cancel();
    if (listening) WidgetsBinding.instance.removeTimingsCallback(collect);
    scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = AcmeTheme.of(context).colors;
    final rows = [
      ('Information', colors.statusInfoSubtle),
      ('Success', colors.statusSuccessSubtle),
      ('Warning', colors.statusWarningSubtle),
      ('Review', colors.statusDangerSubtle),
    ];
    Widget scene = GlassScene(
      child: Stack(
        key: sceneKey,
        fit: StackFit.expand,
        children: [
          ListView(
            controller: scroll,
            padding: EdgeInsets.zero,
            children: [
              for (var index = 0; index < 24; index++)
                ColoredBox(
                  color: rows[index % rows.length].$2,
                  child: Padding(
                    padding: const EdgeInsets.all(SpaceTokens.s4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: SpaceTokens.s1,
                      children: [
                        Text(
                          rows[index % rows.length].$1,
                          variant: TextVariant.heading,
                        ),
                        Text('Collection ${index + 1}'),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          Align(
            alignment: Alignment.topCenter,
            child: TopBar(
              surface: Surface.glass,
              title: 'Collections',
              trailing: Button(
                label: 'Details',
                size: ControlSize.sm,
                onPressed: () => setState(() => sheet = true),
              ),
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.all(SpaceTokens.s3),
              child: TabBar(
                surface: Surface.glass,
                items: previewTabs,
                value: selected,
                onChanged: (value) => setState(() => selected = value),
              ),
            ),
          ),
          BottomSheet(
            surface: Surface.glass,
            open: sheet,
            onClose: () => setState(() => sheet = false),
            title: 'Collection details',
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: SpaceTokens.s4,
              children: [
                const Text(
                  'These collections are available offline.',
                  tone: TextTone.secondary,
                ),
                Button(
                  label: 'Done',
                  onPressed: () => setState(() => sheet = false),
                ),
              ],
            ),
          ),
        ],
      ),
    );
    // Flutter implements tier two on supported devices; native requests use the best available tier.
    if (widget.tier == 'blur' || widget.tier == 'solid') {
      scene = GlassPreviewOverride(blur: widget.tier == 'blur', child: scene);
    }
    return scene;
  }
}
