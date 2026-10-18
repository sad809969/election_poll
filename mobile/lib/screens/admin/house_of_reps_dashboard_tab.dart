import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class HouseOfRepsDashboardTab extends StatefulWidget {
  final VoidCallback? onNavigateToResults;
  final VoidCallback? onNavigateToCollation;

  const HouseOfRepsDashboardTab({
    super.key,
    this.onNavigateToResults,
    this.onNavigateToCollation,
  });

  @override
  State<HouseOfRepsDashboardTab> createState() => _HouseOfRepsDashboardTabState();
}

class _HouseOfRepsDashboardTabState extends State<HouseOfRepsDashboardTab> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _resultsData = {};
  Timer? _refreshTimer;
  final _numberFormat = NumberFormat('#,###');
  String _searchQuery = '';

  // The 11 official Federal Constituencies of Jigawa State
  static const List<Map<String, dynamic>> federalConstituencies = [
    {
      'id': 'fc-01',
      'name': 'Birnin Kudu / Buji',
      'code': 'FED-01',
      'lgas': ['Birnin Kudu', 'Buji'],
    },
    {
      'id': 'fc-02',
      'name': 'Dutse / Kiyawa',
      'code': 'FED-02',
      'lgas': ['Dutse', 'Kiyawa'],
    },
    {
      'id': 'fc-03',
      'name': 'Gwaram',
      'code': 'FED-03',
      'lgas': ['Gwaram'],
    },
    {
      'id': 'fc-04',
      'name': 'Hadejia / Auyo / Kafin Hausa',
      'code': 'FED-04',
      'lgas': ['Hadejia', 'Auyo', 'Kafin Hausa'],
    },
    {
      'id': 'fc-05',
      'name': 'Jahun / Miga',
      'code': 'FED-05',
      'lgas': ['Jahun', 'Miga'],
    },
    {
      'id': 'fc-06',
      'name': 'Kazaure / Roni / Gwiwa / Yankwashi',
      'code': 'FED-06',
      'lgas': ['Kazaure', 'Roni', 'Gwiwa', 'Yankwashi'],
    },
    {
      'id': 'fc-07',
      'name': 'Mallam Madori / Kaugama',
      'code': 'FED-07',
      'lgas': ['Malam Madori', 'Kaugama'],
    },
    {
      'id': 'fc-08',
      'name': 'Ringim / Taura',
      'code': 'FED-08',
      'lgas': ['Ringim', 'Taura'],
    },
    {
      'id': 'fc-09',
      'name': 'Babura / Garki',
      'code': 'FED-09',
      'lgas': ['Babura', 'Garki'],
    },
    {
      'id': 'fc-10',
      'name': 'Gumel / Maigatari / Sule Tankarkar / Gagarawa',
      'code': 'FED-10',
      'lgas': ['Gumel', 'Maigatari', 'Sule Tankarkar', 'Gagarawa'],
    },
    {
      'id': 'fc-11',
      'name': 'Birniwa / Guri / Kiri Kasama',
      'code': 'FED-11',
      'lgas': ['Biriniwa', 'Guri', 'Kiri Kasama'],
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchHouseData();
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (mounted) _fetchHouseData(silent: true);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchHouseData({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final data = await ApiService.getResults(
        electionType: 'HOUSE_OF_REPS',
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
              'Loading House of Representatives Telemetry...',
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
              onPressed: () => _fetchHouseData(),
              icon: const Icon(Icons.refresh, color: Colors.white),
              label: const Text('Retry Connection', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    final rawBreakdown = (_resultsData['breakdown'] as List<dynamic>?) ?? [];
    final lgaMap = <String, Map<String, dynamic>>{};
    for (final b in rawBreakdown) {
      final name = (b['lga_name'] ?? '').toString().toLowerCase().trim();
      lgaMap[name] = Map<String, dynamic>.from(b as Map);
    }

    final constituencyTallies = federalConstituencies.map((fc) {
      final lgas = fc['lgas'] as List<String>;
      int cPdp = 0, cApc = 0, cNnpp = 0, cCollated = 0, cTotalPUs = 0;

      for (final lgaName in lgas) {
        final b = lgaMap[lgaName.toLowerCase().trim()];
        if (b != null) {
          cPdp += (b['pdp'] as num?)?.toInt() ?? 0;
          cApc += (b['apc'] as num?)?.toInt() ?? 0;
          cNnpp += (b['nnpp'] as num?)?.toInt() ?? 0;
          cCollated += (b['collated_pus'] as num?)?.toInt() ?? 0;
          cTotalPUs += (b['total_pus'] as num?)?.toInt() ?? 0;
        }
      }

      String leader = 'UNDECIDED';
      Color leaderColor = Colors.white54;
      if (cPdp > cApc && cPdp > cNnpp) {
        leader = 'PDP LEADING';
        leaderColor = const Color(0xFF10B981);
      } else if (cApc > cPdp && cApc > cNnpp) {
        leader = 'APC LEADING';
        leaderColor = const Color(0xFF3B82F6);
      } else if (cNnpp > 0) {
        leader = 'NNPP LEADING';
        leaderColor = const Color(0xFF8B5CF6);
      }

      return {
        ...fc,
        'pdp': cPdp,
        'apc': cApc,
        'nnpp': cNnpp,
        'totalVotes': cPdp + cApc + cNnpp,
        'collated': cCollated,
        'totalPus': cTotalPUs > 0 ? cTotalPUs : lgas.length * 175,
        'leader': leader,
        'leaderColor': leaderColor,
      };
    }).toList();

    int pdpSeats = 0, apcSeats = 0, nnppSeats = 0;
    for (final c in constituencyTallies) {
      if (c['leader'] == 'PDP LEADING') pdpSeats++;
      if (c['leader'] == 'APC LEADING') apcSeats++;
      if (c['leader'] == 'NNPP LEADING') nnppSeats++;
    }

    final filtered = constituencyTallies.where((c) {
      final name = (c['name'] as String).toLowerCase();
      final lgas = (c['lgas'] as List<String>).join(' ').toLowerCase();
      return name.contains(_searchQuery.toLowerCase()) || lgas.contains(_searchQuery.toLowerCase());
    }).toList();

    return RefreshIndicator(
      color: const Color(0xFF008751),
      onRefresh: () => _fetchHouseData(),
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // Banner
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF063321), Color(0xFF0B192C)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Text('🏢', style: TextStyle(fontSize: 32)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'HOUSE OF REPRESENTATIVES COMMAND DASHBOARD',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('11 GREEN CHAMBER SEATS', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Federal Constituencies election tracking, member seat projections, and collation progress across all 11 Federal Constituencies in Jigawa.',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Manual Refresh',
                  icon: const Icon(Icons.refresh, color: Colors.white70),
                  onPressed: () => _fetchHouseData(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Green Chamber Seats Summary
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
                _buildSeatStat('PDP GREEN SEATS', pdpSeats, const Color(0xFF10B981)),
                Container(height: 40, width: 1, color: Colors.white10),
                _buildSeatStat('APC SEATS', apcSeats, const Color(0xFF3B82F6)),
                Container(height: 40, width: 1, color: Colors.white10),
                _buildSeatStat('NNPP SEATS', nnppSeats, const Color(0xFF8B5CF6)),
                Container(height: 40, width: 1, color: Colors.white10),
                _buildSeatStat('TOTAL FEDERAL SEATS', 11, Colors.white),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Header with search
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '11 FEDERAL CONSTITUENCIES: LIVE RACE LEDGER',
                style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
              ),
              SizedBox(
                width: 280,
                height: 38,
                child: TextField(
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    hintText: 'Search Constituency or LGA...',
                    hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                    prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B), size: 16),
                    filled: true,
                    fillColor: const Color(0xFF0B132B),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // 11 Constituency Cards Grid
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 900;
              final colCount = isWide ? 2 : 1;

              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: colCount,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: isWide ? 2.3 : 2.0,
                ),
                itemCount: filtered.length,
                itemBuilder: (context, index) {
                  final fc = filtered[index];
                  final name = fc['name'] as String;
                  final code = fc['code'] as String;
                  final lgas = (fc['lgas'] as List<String>).join(', ');
                  final pdp = fc['pdp'] as int;
                  final apc = fc['apc'] as int;
                  final nnpp = fc['nnpp'] as int;
                  final leader = fc['leader'] as String;
                  final leaderColor = fc['leaderColor'] as Color;
                  final collated = fc['collated'] as int;
                  final totalPus = fc['totalPus'] as int;
                  final pct = totalPus > 0 ? (collated / totalPus * 100).toStringAsFixed(0) : '0';

                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF141E38),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: leader.contains('PDP')
                            ? const Color(0xFF10B981).withOpacity(0.4)
                            : Colors.white10,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Text(code, style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.bold)),
                                const SizedBox(width: 8),
                                Text(name, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: leaderColor.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                leader,
                                style: TextStyle(color: leaderColor, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        Text('LGAs: $lgas', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                        Text('Collation: $collated / $totalPus PUs ($pct%)', style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildTallyBox('PDP', pdp, const Color(0xFF10B981)),
                            _buildTallyBox('APC', apc, const Color(0xFF3B82F6)),
                            _buildTallyBox('NNPP', nnpp, const Color(0xFF8B5CF6)),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSeatStat(String title, int count, Color color) {
    return Column(
      children: [
        Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text('$count', style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildTallyBox(String party, int votes, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF0B132B),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('$party: ', style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
          Text(_numberFormat.format(votes), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
