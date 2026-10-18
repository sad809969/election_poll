import 'package:flutter/material.dart';
import 'jigawa_map_widget.dart';
import '../../services/api_service.dart';

class MapTab extends StatefulWidget {
  final Function(String lgaName)? onNavigateToLgaPus;
  final Function(String lgaName)? onNavigateToLgaCollation;

  const MapTab({
    super.key,
    this.onNavigateToLgaPus,
    this.onNavigateToLgaCollation,
  });

  @override
  State<MapTab> createState() => _MapTabState();
}

class _MapTabState extends State<MapTab> {
  String _selectedLgaName = 'Dutse';
  List<dynamic> _incidents = [];
  // ignore: unused_field
  bool _isLoadingIncidents = false;

  @override
  void initState() {
    super.initState();
    _fetchLgaIncidents();
  }

  Future<void> _fetchLgaIncidents() async {
    setState(() => _isLoadingIncidents = true);
    try {
      final list = await ApiService.getIncidents();
      if (mounted) {
        setState(() {
          _incidents = list;
          _isLoadingIncidents = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingIncidents = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // ignore: unused_local_variable
    final isDesktop = MediaQuery.of(context).size.width >= 1000;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Title Bar
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF141E38),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.satellite_alt_outlined, color: Color(0xFF10B981), size: 24),
                  SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'JIGAWA STATE GEOSPATIAL COMMAND CENTER',
                        style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Interactive surveillance and incident telemetry across all 27 Local Government Areas',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
              IconButton(
                onPressed: _fetchLgaIncidents,
                icon: const Icon(Icons.refresh, color: Color(0xFF10B981)),
                tooltip: 'Refresh Map Telemetry',
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Interactive Map
        JigawaMapWidget(
          initialSelectedLga: _selectedLgaName,
          onSelectLga: (lga) {
            setState(() => _selectedLgaName = lga);
          },
        ),
        const SizedBox(height: 16),

        // Selected LGA Action Panel
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF141E38),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Color(0xFF10B981), size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'ACTIVE SECTOR: $_selectedLgaName LOCAL GOVERNMENT AREA',
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  Wrap(
                    spacing: 8,
                    children: [
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF008751),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        onPressed: () => widget.onNavigateToLgaPus?.call(_selectedLgaName),
                        icon: const Icon(Icons.how_to_vote, size: 14),
                        label: const Text('View PU Roster', style: TextStyle(fontSize: 11)),
                      ),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF3B82F6),
                          side: const BorderSide(color: Color(0xFF3B82F6)),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        onPressed: () => widget.onNavigateToLgaCollation?.call(_selectedLgaName),
                        icon: const Icon(Icons.table_chart, size: 14),
                        label: const Text('LGA Collation', style: TextStyle(fontSize: 11)),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(color: Colors.white10, height: 1),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildInfoCard('STATUS', 'Operational (Normal)', const Color(0xFF10B981), Icons.check_circle_outline),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildInfoCard('TELEMETRY FEED', 'Real-Time Synchronized', const Color(0xFF3B82F6), Icons.cloud_done_outlined),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildInfoCard('INCIDENT LOGS', '${_incidents.length} Reported Statewide', Colors.amberAccent, Icons.warning_amber_rounded),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard(String title, String val, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0B132B),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 6),
              Text(title, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            val,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
