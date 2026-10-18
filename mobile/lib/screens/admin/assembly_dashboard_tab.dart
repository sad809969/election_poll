import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class AssemblyDashboardTab extends StatefulWidget {
  final VoidCallback? onNavigateToResults;
  final VoidCallback? onNavigateToCollation;

  const AssemblyDashboardTab({
    super.key,
    this.onNavigateToResults,
    this.onNavigateToCollation,
  });

  @override
  State<AssemblyDashboardTab> createState() => _AssemblyDashboardTabState();
}

class _AssemblyDashboardTabState extends State<AssemblyDashboardTab> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _resultsData = {};
  Timer? _refreshTimer;
  final _numberFormat = NumberFormat('#,###');
  String _searchQuery = '';

  // The 30 official State House of Assembly Constituencies in Jigawa State
  static const List<Map<String, String>> stateConstituencies = [
    {'code': 'SHA-01', 'name': 'Auyo', 'lga': 'Auyo'},
    {'code': 'SHA-02', 'name': 'Babura East', 'lga': 'Babura'},
    {'code': 'SHA-03', 'name': 'Babura West', 'lga': 'Babura'},
    {'code': 'SHA-04', 'name': 'Biriniwa', 'lga': 'Biriniwa'},
    {'code': 'SHA-05', 'name': 'Birnin Kudu', 'lga': 'Birnin Kudu'},
    {'code': 'SHA-06', 'name': 'Buji', 'lga': 'Buji'},
    {'code': 'SHA-07', 'name': 'Dutse Central', 'lga': 'Dutse'},
    {'code': 'SHA-08', 'name': 'Gagarawa', 'lga': 'Gagarawa'},
    {'code': 'SHA-09', 'name': 'Garki', 'lga': 'Garki'},
    {'code': 'SHA-10', 'name': 'Gumel', 'lga': 'Gumel'},
    {'code': 'SHA-11', 'name': 'Guri', 'lga': 'Guri'},
    {'code': 'SHA-12', 'name': 'Gwaram East', 'lga': 'Gwaram'},
    {'code': 'SHA-13', 'name': 'Gwaram West', 'lga': 'Gwaram'},
    {'code': 'SHA-14', 'name': 'Gwiwa', 'lga': 'Gwiwa'},
    {'code': 'SHA-15', 'name': 'Hadejia', 'lga': 'Hadejia'},
    {'code': 'SHA-16', 'name': 'Jahun', 'lga': 'Jahun'},
    {'code': 'SHA-17', 'name': 'Kafin Hausa', 'lga': 'Kafin Hausa'},
    {'code': 'SHA-18', 'name': 'Kaugama', 'lga': 'Kaugama'},
    {'code': 'SHA-19', 'name': 'Kazaure', 'lga': 'Kazaure'},
    {'code': 'SHA-20', 'name': 'Kiri Kasama', 'lga': 'Kiri Kasama'},
    {'code': 'SHA-21', 'name': 'Kiyawa', 'lga': 'Kiyawa'},
    {'code': 'SHA-22', 'name': 'Maigatari', 'lga': 'Maigatari'},
    {'code': 'SHA-23', 'name': 'Malam Madori', 'lga': 'Malam Madori'},
    {'code': 'SHA-24', 'name': 'Miga', 'lga': 'Miga'},
    {'code': 'SHA-25', 'name': 'Ringim', 'lga': 'Ringim'},
    {'code': 'SHA-26', 'name': 'Roni', 'lga': 'Roni'},
    {'code': 'SHA-27', 'name': 'Sule Tankarkar', 'lga': 'Sule Tankarkar'},
    {'code': 'SHA-28', 'name': 'Taura', 'lga': 'Taura'},
    {'code': 'SHA-29', 'name': 'Yankwashi', 'lga': 'Yankwashi'},
    {'code': 'SHA-30', 'name': 'Dutse West', 'lga': 'Dutse'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchAssemblyData();
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (mounted) _fetchAssemblyData(silent: true);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchAssemblyData({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final data = await ApiService.getResults(
        electionType: 'STATE_ASSEMBLY',
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
              'Loading State House of Assembly Telemetry...',
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
              onPressed: () => _fetchAssemblyData(),
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

    final constituencyList = stateConstituencies.map((sc) {
      final lgaName = sc['lga']!;
      final b = lgaMap[lgaName.toLowerCase().trim()];

      final isSplitLga = lgaName == 'Babura' || lgaName == 'Gwaram' || lgaName == 'Dutse';
      final factor = isSplitLga ? 0.5 : 1.0;

      final pdp = ((b?['pdp'] as num?)?.toInt() ?? 0 * factor).toInt();
      final apc = ((b?['apc'] as num?)?.toInt() ?? 0 * factor).toInt();
      final nnpp = ((b?['nnpp'] as num?)?.toInt() ?? 0 * factor).toInt();

      String leader = 'UNDECIDED';
      Color leaderColor = Colors.white54;
      if (pdp > apc && pdp > nnpp) {
        leader = 'PDP';
        leaderColor = const Color(0xFF10B981);
      } else if (apc > pdp && apc > nnpp) {
        leader = 'APC';
        leaderColor = const Color(0xFF3B82F6);
      } else if (nnpp > 0) {
        leader = 'NNPP';
        leaderColor = const Color(0xFF8B5CF6);
      }

      return {
        ...sc,
        'pdp': pdp,
        'apc': apc,
        'nnpp': nnpp,
        'total': pdp + apc + nnpp,
        'leader': leader,
        'leaderColor': leaderColor,
      };
    }).toList();

    int pdpSeats = 0, apcSeats = 0, nnppSeats = 0;
    for (final c in constituencyList) {
      if (c['leader'] == 'PDP') pdpSeats++;
      if (c['leader'] == 'APC') apcSeats++;
      if (c['leader'] == 'NNPP') nnppSeats++;
    }

    final filtered = constituencyList.where((c) {
      final name = (c['name'] ?? '').toString().toLowerCase();
      final lga = (c['lga'] ?? '').toString().toLowerCase();
      return name.contains(_searchQuery.toLowerCase()) || lga.contains(_searchQuery.toLowerCase());
    }).toList();

    return RefreshIndicator(
      color: const Color(0xFF008751),
      onRefresh: () => _fetchAssemblyData(),
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // Banner
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF2E1065), Color(0xFF0F172A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.4)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B5CF6).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Text('📜', style: TextStyle(fontSize: 32)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'STATE HOUSE OF ASSEMBLY COMMAND DASHBOARD',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF8B5CF6).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('30 CONSTITUENCY SEATS', style: TextStyle(color: Color(0xFFC084FC), fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Legislative election tracking, constituency candidate race margins, and majority threshold monitor (16 seats required for legislative control).',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Manual Refresh',
                  icon: const Icon(Icons.refresh, color: Colors.white70),
                  onPressed: () => _fetchAssemblyData(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 16-Seat Majority Meter
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF141E38),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: pdpSeats >= 16 ? const Color(0xFF10B981) : Colors.white10,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          pdpSeats >= 16 ? Icons.check_circle : Icons.balance,
                          color: pdpSeats >= 16 ? const Color(0xFF10B981) : const Color(0xFF8B5CF6),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'LEGISLATIVE MAJORITY MONITOR (16 SEATS NEEDED)',
                          style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    Text(
                      pdpSeats >= 16
                          ? '🎉 PDP HAS MAJORITY ($pdpSeats / 30)'
                          : '$pdpSeats / 16 Seats for Majority',
                      style: TextStyle(
                        color: pdpSeats >= 16 ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: (pdpSeats / 16.0).clamp(0.0, 1.0),
                    minHeight: 10,
                    backgroundColor: Colors.white10,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      pdpSeats >= 16 ? const Color(0xFF10B981) : const Color(0xFF8B5CF6),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Seat Distribution Counter
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
                _buildSeatStat('PDP SEATS', pdpSeats, const Color(0xFF10B981)),
                Container(height: 40, width: 1, color: Colors.white10),
                _buildSeatStat('APC SEATS', apcSeats, const Color(0xFF3B82F6)),
                Container(height: 40, width: 1, color: Colors.white10),
                _buildSeatStat('NNPP SEATS', nnppSeats, const Color(0xFF8B5CF6)),
                Container(height: 40, width: 1, color: Colors.white10),
                _buildSeatStat('TOTAL ASSEMBLY SEATS', 30, Colors.white),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Search Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '30 STATE CONSTITUENCIES: REAL-TIME LEDGER',
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

          // 30 Constituencies Grid
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 900;
              final colCount = isWide ? 3 : (constraints.maxWidth > 600 ? 2 : 1);

              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: colCount,
                  crossAxisSpacing: 14,
                  mainAxisSpacing: 14,
                  childAspectRatio: 2.1,
                ),
                itemCount: filtered.length,
                itemBuilder: (context, index) {
                  final c = filtered[index];
                  final name = c['name'] as String;
                  final code = c['code'] as String;
                  final lga = c['lga'] as String;
                  final pdp = c['pdp'] as int;
                  final apc = c['apc'] as int;
                  final leader = c['leader'] as String;
                  final leaderColor = c['leaderColor'] as Color;

                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF141E38),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: leader == 'PDP'
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
                            Expanded(
                              child: Text(
                                '$code: $name',
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
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
                        Text('LGA: $lga', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('PDP: ${_numberFormat.format(pdp)}', style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold)),
                            Text('APC: ${_numberFormat.format(apc)}', style: const TextStyle(color: Color(0xFF60A5FA), fontSize: 11)),
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
}
