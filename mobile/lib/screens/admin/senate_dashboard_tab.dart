import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class SenateDashboardTab extends StatefulWidget {
  final VoidCallback? onNavigateToResults;
  final VoidCallback? onNavigateToCollation;

  const SenateDashboardTab({
    super.key,
    this.onNavigateToResults,
    this.onNavigateToCollation,
  });

  @override
  State<SenateDashboardTab> createState() => _SenateDashboardTabState();
}

class _SenateDashboardTabState extends State<SenateDashboardTab> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _resultsData = {};
  Timer? _refreshTimer;
  final _numberFormat = NumberFormat('#,###');
  int _selectedDistrictIndex = 0;

  // The 3 official Senatorial Districts of Jigawa State
  static const List<Map<String, dynamic>> senatorialDistricts = [
    {
      'id': 'ne',
      'name': 'Jigawa North-East Senatorial District',
      'code': 'SD-01',
      'headquarters': 'Hadejia',
      'lgas': ['Hadejia', 'Auyo', 'Kafin Hausa', 'Biriniwa', 'Guri', 'Kiri Kasama', 'Malam Madori', 'Kaugama'],
    },
    {
      'id': 'nw',
      'name': 'Jigawa North-West Senatorial District',
      'code': 'SD-02',
      'headquarters': 'Kazaure',
      'lgas': ['Babura', 'Garki', 'Gumel', 'Gwiwa', 'Kazaure', 'Roni', 'Yankwashi', 'Sule Tankarkar', 'Maigatari'],
    },
    {
      'id': 'sw',
      'name': 'Jigawa South-West Senatorial District',
      'code': 'SD-03',
      'headquarters': 'Dutse',
      'lgas': ['Birnin Kudu', 'Buji', 'Dutse', 'Gwaram', 'Jahun', 'Kiyawa', 'Miga', 'Ringim', 'Taura', 'Gagarawa'],
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchSenateData();
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (mounted) _fetchSenateData(silent: true);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchSenateData({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final data = await ApiService.getResults(
        electionType: 'SENATORIAL',
        limit: 100,
      );
      if (mounted) {
        setState(() {
          _resultsData = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted && !silent) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Color(0xFF008751)),
            SizedBox(height: 16),
            Text(
              'Loading Jigawa Senatorial Districts Telemetry...',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, color: Colors.redAccent, size: 48),
            const SizedBox(height: 12),
            Text('Telemetry Connection Issue: $_error', style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751)),
              onPressed: () => _fetchSenateData(),
              icon: const Icon(Icons.refresh, color: Colors.white),
              label: const Text('Retry Connection', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    final kpi = _resultsData['kpi'] ?? {};
    final rawBreakdown = (_resultsData['breakdown'] as List<dynamic>?) ?? [];

    final lgaMap = <String, Map<String, dynamic>>{};
    for (final b in rawBreakdown) {
      final name = (b['lga_name'] ?? '').toString().toLowerCase().trim();
      lgaMap[name] = Map<String, dynamic>.from(b as Map);
    }

    // Calculate aggregated tallies for each district
    final districtTallies = senatorialDistricts.map((district) {
      final lgas = district['lgas'] as List<String>;
      int dPdp = 0, dApc = 0, dNnpp = 0, dLp = 0, dCollated = 0, dTotalPUs = 0;

      for (final lgaName in lgas) {
        final b = lgaMap[lgaName.toLowerCase().trim()];
        if (b != null) {
          dPdp += (b['pdp'] as num?)?.toInt() ?? 0;
          dApc += (b['apc'] as num?)?.toInt() ?? 0;
          dNnpp += (b['nnpp'] as num?)?.toInt() ?? 0;
          dLp += (b['lp'] as num?)?.toInt() ?? 0;
          dCollated += (b['collated_pus'] as num?)?.toInt() ?? 0;
          dTotalPUs += (b['total_pus'] as num?)?.toInt() ?? 0;
        }
      }

      final dTotal = dPdp + dApc + dNnpp + dLp;
      String leader = 'UNDECIDED';
      Color leaderColor = Colors.white54;
      if (dPdp > dApc && dPdp > dNnpp) {
        leader = 'PDP LEADING';
        leaderColor = const Color(0xFF10B981);
      } else if (dApc > dPdp && dApc > dNnpp) {
        leader = 'APC LEADING';
        leaderColor = const Color(0xFF3B82F6);
      } else if (dNnpp > dPdp && dNnpp > dApc) {
        leader = 'NNPP LEADING';
        leaderColor = const Color(0xFF8B5CF6);
      }

      return {
        ...district,
        'pdp': dPdp,
        'apc': dApc,
        'nnpp': dNnpp,
        'lp': dLp,
        'total': dTotal,
        'collated': dCollated,
        'totalPus': dTotalPUs > 0 ? dTotalPUs : lgas.length * 178,
        'leader': leader,
        'leaderColor': leaderColor,
      };
    }).toList();

    int pdpSeats = 0, apcSeats = 0, nnppSeats = 0;
    for (final d in districtTallies) {
      if (d['leader'] == 'PDP LEADING') pdpSeats++;
      if (d['leader'] == 'APC LEADING') apcSeats++;
      if (d['leader'] == 'NNPP LEADING') nnppSeats++;
    }

    final activeDistrict = districtTallies[_selectedDistrictIndex];
    final activeDistrictLgas = activeDistrict['lgas'] as List<String>;

    return RefreshIndicator(
      color: const Color(0xFF008751),
      onRefresh: () => _fetchSenateData(),
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // Banner
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0A2540), Color(0xFF141E38)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.4)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Text('🎖️', style: TextStyle(fontSize: 32)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'JIGAWA SENATORIAL DISTRICTS COMMAND',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF3B82F6).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('3 RED CHAMBER SEATS', style: TextStyle(color: Color(0xFF60A5FA), fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Live returns and collation tracking for Jigawa North-East, North-West, and South-West Senatorial Districts.',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Manual Refresh',
                  icon: const Icon(Icons.refresh, color: Colors.white70),
                  onPressed: () => _fetchSenateData(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Senate Seats Allocation Tracker (3 Seats)
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF141E38),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildSeatPill('PDP SENATE SEATS', pdpSeats, const Color(0xFF10B981)),
                Container(height: 40, width: 1, color: Colors.white10),
                _buildSeatPill('APC SENATE SEATS', apcSeats, const Color(0xFF3B82F6)),
                Container(height: 40, width: 1, color: Colors.white10),
                _buildSeatPill('NNPP SENATE SEATS', nnppSeats, const Color(0xFF8B5CF6)),
                Container(height: 40, width: 1, color: Colors.white10),
                _buildSeatPill('TOTAL RED CHAMBER SEATS', 3, Colors.white),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // 3 District Cards Selector
          Row(
            children: List.generate(districtTallies.length, (idx) {
              final d = districtTallies[idx];
              final isSelected = _selectedDistrictIndex == idx;

              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: idx < 2 ? 14 : 0),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () => setState(() => _selectedDistrictIndex = idx),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF18274A) : const Color(0xFF141E38),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF10B981) : Colors.white10,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(d['code'] as String, style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.bold)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: (d['leaderColor'] as Color).withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  d['leader'] as String,
                                  style: TextStyle(color: d['leaderColor'] as Color, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            d['name'] as String,
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'HQ: ${d['headquarters']} • ${(d['lgas'] as List).length} LGAs',
                            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('PDP: ${_numberFormat.format(d['pdp'])}', style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold)),
                              Text('APC: ${_numberFormat.format(d['apc'])}', style: const TextStyle(color: Color(0xFF60A5FA), fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 24),

          // Active District Deep Dive Header
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF141E38),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (activeDistrict['name'] as String).toUpperCase(),
                          style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Constituent Local Governments: ${activeDistrictLgas.join(', ')}',
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF008751).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                      ),
                      child: Text(
                        'Total Votes Cast: ${_numberFormat.format(activeDistrict['total'])}',
                        style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(color: Colors.white10),
                const SizedBox(height: 12),

                // LGA-by-LGA Results within selected Senatorial District
                const Text(
                  'DISTRICT LGA COLLATION LEDGER',
                  style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),

                Table(
                  columnWidths: const {
                    0: FlexColumnWidth(2.5),
                    1: FlexColumnWidth(2),
                    2: FlexColumnWidth(2),
                    3: FlexColumnWidth(2),
                    4: FlexColumnWidth(2),
                  },
                  children: [
                    TableRow(
                      decoration: const BoxDecoration(color: Color(0xFF0B132B)),
                      children: [
                        _buildTableHeader('LGA NAME'),
                        _buildTableHeader('PDP VOTES'),
                        _buildTableHeader('APC VOTES'),
                        _buildTableHeader('NNPP VOTES'),
                        _buildTableHeader('LEADING'),
                      ],
                    ),
                    ...activeDistrictLgas.map((lgaName) {
                      final b = lgaMap[lgaName.toLowerCase().trim()];
                      final lPdp = (b?['pdp'] as num?)?.toInt() ?? 0;
                      final lApc = (b?['apc'] as num?)?.toInt() ?? 0;
                      final lNnpp = (b?['nnpp'] as num?)?.toInt() ?? 0;

                      String lLeader = '-';
                      Color lColor = Colors.white54;
                      if (lPdp > lApc && lPdp > lNnpp) {
                        lLeader = 'PDP';
                        lColor = const Color(0xFF10B981);
                      } else if (lApc > lPdp && lApc > lNnpp) {
                        lLeader = 'APC';
                        lColor = const Color(0xFF3B82F6);
                      } else if (lNnpp > 0) {
                        lLeader = 'NNPP';
                        lColor = const Color(0xFF8B5CF6);
                      }

                      return TableRow(
                        decoration: const BoxDecoration(
                          border: Border(bottom: BorderSide(color: Colors.white10)),
                        ),
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                            child: Text(lgaName, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                            child: Text(_numberFormat.format(lPdp), style: const TextStyle(color: Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                            child: Text(_numberFormat.format(lApc), style: const TextStyle(color: Color(0xFF60A5FA), fontSize: 12)),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                            child: Text(_numberFormat.format(lNnpp), style: const TextStyle(color: Color(0xFFC084FC), fontSize: 12)),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: lColor.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                              child: Text(lLeader, style: TextStyle(color: lColor, fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      );
                    }),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSeatPill(String title, int count, Color color) {
    return Column(
      children: [
        Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text('$count', style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildTableHeader(String text) {
    return Padding(
      padding: const EdgeInsets.all(10),
      child: Text(
        text,
        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }
}
