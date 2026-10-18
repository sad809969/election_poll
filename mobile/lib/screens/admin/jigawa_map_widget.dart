import 'package:flutter/material.dart';

class LgaMapData {
  final String id;
  final String name;
  final String zone;
  final double x;
  final double y;
  final String status; // 'Normal', 'Attention', 'Critical', 'Unknown'
  final int puCount;
  final int incidentsCount;

  const LgaMapData({
    required this.id,
    required this.name,
    required this.zone,
    required this.x,
    required this.y,
    this.status = 'Normal',
    this.puCount = 178,
    this.incidentsCount = 0,
  });
}

class JigawaMapWidget extends StatefulWidget {
  final Function(String lgaName)? onSelectLga;
  final String? initialSelectedLga;
  final bool compact;

  const JigawaMapWidget({
    super.key,
    this.onSelectLga,
    this.initialSelectedLga,
    this.compact = false,
  });

  @override
  State<JigawaMapWidget> createState() => _JigawaMapWidgetState();
}

class _JigawaMapWidgetState extends State<JigawaMapWidget> {
  String _statusFilter = 'All';
  LgaMapData? _selectedLga;
  LgaMapData? _hoveredLga;

  // 27 Jigawa State LGAs with SVG coordinates (viewBox 0 0 650 440)
  static const List<LgaMapData> lgaList = [
    LgaMapData(id: 'kz', name: 'Kazaure', zone: 'Kazaure Emirate', x: 88, y: 124, puCount: 162),
    LgaMapData(id: 'rn', name: 'Roni', zone: 'Kazaure Emirate', x: 62, y: 142, puCount: 124),
    LgaMapData(id: 'gw', name: 'Gwiwa', zone: 'Kazaure Emirate', x: 116, y: 114, puCount: 130),
    LgaMapData(id: 'yw', name: 'Yankwashi', zone: 'Kazaure Emirate', x: 110, y: 94, puCount: 98),
    LgaMapData(id: 'bb', name: 'Babura', zone: 'Ringim / North-West', x: 178, y: 100, puCount: 226),
    LgaMapData(id: 'gk', name: 'Garki', zone: 'Ringim Zone', x: 275, y: 156, puCount: 194),
    LgaMapData(id: 'rg', name: 'Ringim', zone: 'Ringim Zone', x: 268, y: 206, puCount: 218),
    LgaMapData(id: 'tr', name: 'Taura', zone: 'Ringim Zone', x: 338, y: 190, puCount: 182),
    LgaMapData(id: 'st', name: 'Sule Tankarkar', zone: 'Gumel Emirate', x: 288, y: 116, puCount: 168),
    LgaMapData(id: 'gm', name: 'Gumel', zone: 'Gumel Emirate', x: 332, y: 126, puCount: 148),
    LgaMapData(id: 'mg', name: 'Maigatari', zone: 'Gumel Emirate', x: 348, y: 88, puCount: 184),
    LgaMapData(id: 'gg', name: 'Gagarawa', zone: 'Gumel Emirate', x: 366, y: 162, puCount: 122),
    LgaMapData(id: 'dt', name: 'Dutse', zone: 'Dutse Emirate (Capital)', x: 318, y: 276, puCount: 286),
    LgaMapData(id: 'ky', name: 'Kiyawa', zone: 'Dutse Emirate', x: 382, y: 270, puCount: 202),
    LgaMapData(id: 'jh', name: 'Jahun', zone: 'Dutse Emirate', x: 386, y: 216, puCount: 234),
    LgaMapData(id: 'mi', name: 'Miga', zone: 'Dutse Emirate', x: 412, y: 204, puCount: 136),
    LgaMapData(id: 'bj', name: 'Buji', zone: 'Dutse Emirate', x: 404, y: 312, puCount: 118),
    LgaMapData(id: 'bk', name: 'Birnin Kudu', zone: 'Dutse Emirate', x: 352, y: 332, puCount: 314),
    LgaMapData(id: 'gwm', name: 'Gwaram', zone: 'Dutse Emirate', x: 450, y: 360, puCount: 262),
    LgaMapData(id: 'kg', name: 'Kaugama', zone: 'Hadejia Emirate', x: 424, y: 154, puCount: 156),
    LgaMapData(id: 'mm', name: 'Malam Madori', zone: 'Hadejia Emirate', x: 478, y: 132, puCount: 172),
    LgaMapData(id: 'hd', name: 'Hadejia', zone: 'Hadejia Emirate', x: 494, y: 154, puCount: 210),
    LgaMapData(id: 'au', name: 'Auyo', zone: 'Hadejia Emirate', x: 490, y: 174, puCount: 164),
    LgaMapData(id: 'kf', name: 'Kafin Hausa', zone: 'Hadejia Emirate', x: 458, y: 194, puCount: 228),
    LgaMapData(id: 'kr', name: 'Kirikasamma', zone: 'Hadejia Emirate', x: 538, y: 122, puCount: 142),
    LgaMapData(id: 'bw', name: 'Birniwa', zone: 'Hadejia Emirate', x: 540, y: 92, puCount: 176),
    LgaMapData(id: 'gr', name: 'Guri', zone: 'Hadejia Emirate', x: 588, y: 106, puCount: 144),
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialSelectedLga != null) {
      _selectedLga = lgaList.firstWhere(
        (l) => l.name.toLowerCase() == widget.initialSelectedLga!.toLowerCase(),
        orElse: () => lgaList[12], // Dutse default
      );
    } else {
      _selectedLga = lgaList[12]; // Dutse default
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Critical':
        return const Color(0xFFEF4444);
      case 'Attention':
        return const Color(0xFFF59E0B);
      case 'Normal':
      default:
        return const Color(0xFF10B981);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = lgaList.where((l) {
      if (_statusFilter == 'All') return true;
      return l.status == _statusFilter;
    }).toList();

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Bar & Filters
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFF0B132B),
              border: Border(bottom: BorderSide(color: Colors.white10)),
            ),
            child: Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 12,
              runSpacing: 8,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF008751).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.map, color: Color(0xFF10B981), size: 18),
                    ),
                    const SizedBox(width: 8),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'JIGAWA STATE GEOSPATIAL MAP',
                          style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Operational Readiness & PU Monitoring across 27 LGAs',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
                        ),
                      ],
                    ),
                  ],
                ),
                // Filter Buttons
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: ['All', 'Normal', 'Attention', 'Critical'].map((f) {
                    final isSel = _statusFilter == f;
                    final count = f == 'All' ? lgaList.length : lgaList.where((l) => l.status == f).length;
                    return Padding(
                      padding: const EdgeInsets.only(left: 4.0),
                      child: InkWell(
                        onTap: () => setState(() => _statusFilter = f),
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isSel ? const Color(0xFF008751) : const Color(0xFF141E38),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isSel ? const Color(0xFF10B981) : Colors.white10,
                            ),
                          ),
                          child: Text(
                            '$f ($count)',
                            style: TextStyle(
                              color: isSel ? Colors.white : const Color(0xFF94A3B8),
                              fontSize: 10,
                              fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),

          // Interactive Map Canvas Area
          SizedBox(
            height: widget.compact ? 320 : 420,
            child: Stack(
              children: [
                // Background & State Boundary Custom Painter
                Positioned.fill(
                  child: CustomPaint(
                    painter: _JigawaMapPainter(
                      lgas: filtered,
                      selectedLga: _selectedLga,
                      hoveredLga: _hoveredLga,
                      statusColorResolver: _getStatusColor,
                    ),
                  ),
                ),

                // Interactive LGA Tap Targets
                LayoutBuilder(
                  builder: (context, constraints) {
                    final scaleX = constraints.maxWidth / 650.0;
                    final scaleY = constraints.maxHeight / 440.0;

                    return Stack(
                      children: filtered.map((lga) {
                        final posX = lga.x * scaleX;
                        final posY = lga.y * scaleY;
                        final isSel = _selectedLga?.id == lga.id;
                        final isHov = _hoveredLga?.id == lga.id;
                        final color = _getStatusColor(lga.status);

                        return Positioned(
                          left: posX - 35,
                          top: posY - 22,
                          child: MouseRegion(
                            cursor: SystemMouseCursors.click,
                            onEnter: (_) => setState(() => _hoveredLga = lga),
                            onExit: (_) => setState(() => _hoveredLga = null),
                            child: GestureDetector(
                              onTap: () {
                                setState(() => _selectedLga = lga);
                                widget.onSelectLga?.call(lga.name);
                              },
                              child: Container(
                                width: 70,
                                height: 44,
                                alignment: Alignment.center,
                                color: Colors.transparent,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: isSel || isHov ? 16 : 12,
                                      height: isSel || isHov ? 16 : 12,
                                      decoration: BoxDecoration(
                                        color: color,
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isSel ? Colors.white : const Color(0xFF070D1E),
                                          width: isSel ? 2 : 1.5,
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: color.withValues(alpha: 0.6),
                                            blurRadius: isSel ? 8 : 4,
                                            spreadRadius: isSel ? 2 : 0,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      lga.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        color: isSel || isHov ? Colors.white : const Color(0xFFCBD5E1),
                                        fontSize: isSel || isHov ? 10 : 8.5,
                                        fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                                        shadows: const [
                                          Shadow(color: Colors.black, blurRadius: 4),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  },
                ),

                // Selected LGA Telemetry Card (Overlay Pill at bottom-left)
                if (_selectedLga != null)
                  Positioned(
                    bottom: 12,
                    left: 12,
                    child: Container(
                      width: 280,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B132B).withValues(alpha: 0.95),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
                        boxShadow: const [
                          BoxShadow(color: Colors.black54, blurRadius: 12, offset: Offset(0, 4)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 10,
                                    height: 10,
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(_selectedLga!.status),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    _selectedLga!.name,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(_selectedLga!.status).withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(
                                    color: _getStatusColor(_selectedLga!.status),
                                    width: 0.6,
                                  ),
                                ),
                                child: Text(
                                  _selectedLga!.status.toUpperCase(),
                                  style: TextStyle(
                                    color: _getStatusColor(_selectedLga!.status),
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _selectedLga!.zone,
                            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                          ),
                          const Divider(color: Colors.white10, height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${_selectedLga!.puCount} Polling Units',
                                style: const TextStyle(color: Colors.white70, fontSize: 11),
                              ),
                              const Row(
                                children: [
                                  Icon(Icons.check_circle, color: Color(0xFF10B981), size: 12),
                                  SizedBox(width: 4),
                                  Text(
                                    'Active Telemetry',
                                    style: TextStyle(color: Color(0xFF10B981), fontSize: 10),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                // Map Legend (Overlay at top-right)
                Positioned(
                  top: 10,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF070D1E).withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildLegendItem('Normal', const Color(0xFF10B981)),
                        const SizedBox(width: 8),
                        _buildLegendItem('Attention', const Color(0xFFF59E0B)),
                        const SizedBox(width: 8),
                        _buildLegendItem('Critical', const Color(0xFFEF4444)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 10),
        ),
      ],
    );
  }
}

class _JigawaMapPainter extends CustomPainter {
  final List<LgaMapData> lgas;
  final LgaMapData? selectedLga;
  final LgaMapData? hoveredLga;
  final Color Function(String status) statusColorResolver;

  _JigawaMapPainter({
    required this.lgas,
    required this.selectedLga,
    required this.hoveredLga,
    required this.statusColorResolver,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final scaleX = size.width / 650.0;
    final scaleY = size.height / 440.0;

    // 1. Grid Background Lines
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.03)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    const step = 30.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // 2. Jigawa State Geographic Boundary Polygon
    final path = Path();
    // Scaled SVG Path from JigawaMap.js:
    path.moveTo(55 * scaleX, 145 * scaleY);
    path.cubicTo(50 * scaleX, 130 * scaleY, 70 * scaleX, 110 * scaleY, 88 * scaleX, 110 * scaleY);
    path.cubicTo(98 * scaleX, 80 * scaleY, 115 * scaleX, 85 * scaleY, 140 * scaleX, 88 * scaleY);
    path.cubicTo(160 * scaleX, 82 * scaleY, 175 * scaleX, 95 * scaleY, 210 * scaleX, 95 * scaleY);
    path.cubicTo(250 * scaleX, 92 * scaleY, 280 * scaleX, 105 * scaleY, 320 * scaleX, 100 * scaleY);
    path.cubicTo(340 * scaleX, 75 * scaleY, 360 * scaleX, 78 * scaleY, 385 * scaleX, 82 * scaleY);
    path.cubicTo(430 * scaleX, 80 * scaleY, 480 * scaleX, 75 * scaleY, 525 * scaleX, 82 * scaleY);
    path.cubicTo(555 * scaleX, 85 * scaleY, 575 * scaleX, 95 * scaleY, 605 * scaleX, 105 * scaleY);
    path.cubicTo(615 * scaleX, 120 * scaleY, 600 * scaleX, 140 * scaleY, 575 * scaleX, 150 * scaleY);
    path.cubicTo(550 * scaleX, 165 * scaleY, 520 * scaleX, 175 * scaleY, 500 * scaleX, 185 * scaleY);
    path.cubicTo(485 * scaleX, 210 * scaleY, 475 * scaleX, 260 * scaleY, 480 * scaleX, 310 * scaleY);
    path.cubicTo(485 * scaleX, 345 * scaleY, 465 * scaleX, 385 * scaleY, 440 * scaleX, 380 * scaleY);
    path.cubicTo(410 * scaleX, 375 * scaleY, 390 * scaleX, 340 * scaleY, 370 * scaleX, 345 * scaleY);
    path.cubicTo(340 * scaleX, 350 * scaleY, 320 * scaleX, 325 * scaleY, 310 * scaleX, 295 * scaleY);
    path.cubicTo(295 * scaleX, 280 * scaleY, 270 * scaleX, 270 * scaleY, 250 * scaleX, 250 * scaleY);
    path.cubicTo(230 * scaleX, 225 * scaleY, 240 * scaleX, 190 * scaleY, 220 * scaleX, 180 * scaleY);
    path.cubicTo(190 * scaleX, 170 * scaleY, 150 * scaleX, 165 * scaleY, 110 * scaleX, 165 * scaleY);
    path.cubicTo(80 * scaleX, 165 * scaleY, 60 * scaleX, 160 * scaleY, 55 * scaleX, 145 * scaleY);
    path.close();

    // Fill Boundary with subtle PDP Green Gradient
    final fillPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF0B3C26), Color(0xFF062817), Color(0xFF041B10)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;
    canvas.drawPath(path, fillPaint);

    // Stroke Outline
    final strokePaint = Paint()
      ..color = const Color(0xFF10B981).withValues(alpha: 0.5)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;
    canvas.drawPath(path, strokePaint);

    // 3. Watermark Text: "JIGAWA STATE"
    final textPainter = TextPainter(
      text: TextSpan(
        text: 'JIGAWA STATE',
        style: TextStyle(
          color: const Color(0xFF10B981).withValues(alpha: 0.08),
          fontSize: 34 * scaleX,
          fontWeight: FontWeight.w900,
          letterSpacing: 8.0,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    textPainter.paint(
      canvas,
      Offset((size.width - textPainter.width) / 2, 220 * scaleY),
    );

    // 4. Inter-Emirate Zone Lines (Dotted connection network)
    final linePaint = Paint()
      ..color = const Color(0xFF10B981).withValues(alpha: 0.15)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    final subPath1 = Path()
      ..moveTo(140 * scaleX, 88 * scaleY)
      ..cubicTo(160 * scaleX, 130 * scaleY, 190 * scaleX, 170 * scaleY, 220 * scaleX, 180 * scaleY);
    canvas.drawPath(subPath1, linePaint);

    final subPath2 = Path()
      ..moveTo(320 * scaleX, 100 * scaleY)
      ..cubicTo(330 * scaleX, 150 * scaleY, 340 * scaleX, 180 * scaleY, 340 * scaleX, 210 * scaleY);
    canvas.drawPath(subPath2, linePaint);

    final subPath3 = Path()
      ..moveTo(385 * scaleX, 82 * scaleY)
      ..cubicTo(400 * scaleX, 140 * scaleY, 430 * scaleX, 190 * scaleY, 450 * scaleX, 220 * scaleY);
    canvas.drawPath(subPath3, linePaint);

    final subPath4 = Path()
      ..moveTo(250 * scaleX, 250 * scaleY)
      ..cubicTo(300 * scaleX, 260 * scaleY, 380 * scaleX, 260 * scaleY, 480 * scaleX, 260 * scaleY);
    canvas.drawPath(subPath4, linePaint);
  }

  @override
  bool shouldRepaint(covariant _JigawaMapPainter oldDelegate) {
    return oldDelegate.selectedLga != selectedLga ||
        oldDelegate.hoveredLga != hoveredLga ||
        oldDelegate.lgas != lgas;
  }
}
