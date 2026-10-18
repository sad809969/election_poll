import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class GovernorDashboardTab extends StatefulWidget {
  final VoidCallback? onNavigateToResults;
  final VoidCallback? onNavigateToCollation;

  const GovernorDashboardTab({
    super.key,
    this.onNavigateToResults,
    this.onNavigateToCollation,
  });

  @override
  State<GovernorDashboardTab> createState() => _GovernorDashboardTabState();
}

class _GovernorDashboardTabState extends State<GovernorDashboardTab> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _resultsData = {};
  Timer? _refreshTimer;
  final _numberFormat = NumberFormat('#,###');
  String _lgaSearchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchGovernorData();
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (mounted) _fetchGovernorData(silent: true);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchGovernorData({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final data = await ApiService.getResults(
        electionType: 'GOVERNORSHIP',
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
              'Loading 2027 Jigawa Governorship Race Telemetry...',
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
              onPressed: () => _fetchGovernorData(),
              icon: const Icon(Icons.refresh, color: Colors.white),
              label: const Text('Retry Connection', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    final kpi = _resultsData['kpi'] ?? {};
    final chart = (_resultsData['chart'] as List<dynamic>?) ?? [];
    final rawBreakdown = (_resultsData['breakdown'] as List<dynamic>?) ?? [];

    final pdpVotes = kpi['pdp'] ?? 0;
    final apcVotes = kpi['apc'] ?? 0;
    final nnppVotes = kpi['nnpp'] ?? 0;
    final lpVotes = kpi['lp'] ?? 0;
    final totalValid = kpi['total_valid'] ?? 0;
    final collatedPus = kpi['collated_pus'] ?? 0;
    final totalPus = kpi['total_pus'] ?? 4827;
    final uploadPct = kpi['upload_pct'] ?? '0.0%';

    // Calculate 2/3 constitutional threshold: 18 of 27 LGAs must have >= 25% of valid votes
    int lgasMeetingThreshold = 0;
    for (final b in rawBreakdown) {
      final bPdp = (b['pdp'] as num?)?.toInt() ?? 0;
      final bTotal = ((b['pdp'] as num?) ?? 0) +
          ((b['apc'] as num?) ?? 0) +
          ((b['nnpp'] as num?) ?? 0) +
          ((b['lp'] as num?) ?? 0);
      if (bTotal > 0 && (bPdp / bTotal) >= 0.25) {
        lgasMeetingThreshold++;
      }
    }

    final filteredBreakdown = rawBreakdown.where((b) {
      final name = (b['lga_name'] ?? '').toString().toLowerCase();
      return name.contains(_lgaSearchQuery.toLowerCase());
    }).toList();

    final margin = pdpVotes - apcVotes;
    final isPdpLeading = margin >= 0;

    return RefreshIndicator(
      color: const Color(0xFF008751),
      onRefresh: () => _fetchGovernorData(),
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // Banner Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF004D2E), Color(0xFF0A192F)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF008751).withOpacity(0.4)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF008751).withOpacity(0.25),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Text('🏛️', style: TextStyle(fontSize: 32)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'JIGAWA GOVERNORSHIP COMMAND DASHBOARD',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('LIVE 2027 ELECTION', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Comprehensive gubernatorial vote tracking, LGA threshold requirements, and EC8A collation speed across all 27 Local Government Areas.',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Manual Refresh',
                  icon: const Icon(Icons.refresh, color: Colors.white70),
                  onPressed: () => _fetchGovernorData(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Constitutional 2/3 Threshold Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF141E38),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: lgasMeetingThreshold >= 18
                    ? const Color(0xFF10B981)
                    : const Color(0xFFF59E0B).withOpacity(0.5),
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
                          lgasMeetingThreshold >= 18 ? Icons.verified : Icons.gavel,
                          color: lgasMeetingThreshold >= 18 ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'CONSTITUTIONAL 2/3 THRESHOLD TRACKER (SEC 179(2))',
                          style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    Text(
                      '$lgasMeetingThreshold / 18 LGAs Qualified',
                      style: TextStyle(
                        color: lgasMeetingThreshold >= 18 ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'To secure victory, the candidate with the highest popular vote must obtain at least 25% of valid votes in at least 18 of the 27 LGAs (2/3 majority).',
                  style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 11),
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: (lgasMeetingThreshold / 18).clamp(0.0, 1.0),
                    minHeight: 10,
                    backgroundColor: Colors.white10,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      lgasMeetingThreshold >= 18 ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Main Race Summary Metrics
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 800;
              return Wrap(
                spacing: 16,
                runSpacing: 16,
                children: [
                  SizedBox(
                    width: isWide ? (constraints.maxWidth - 48) / 4 : (constraints.maxWidth - 16) / 2,
                    child: _buildMetricCard(
                      'PDP GOVERNORSHIP VOTES',
                      _numberFormat.format(pdpVotes),
                      'Lead Margin: ${isPdpLeading ? '+' : ''}${_numberFormat.format(margin)}',
                      const Color(0xFF008751),
                      Icons.how_to_vote,
                    ),
                  ),
                  SizedBox(
                    width: isWide ? (constraints.maxWidth - 48) / 4 : (constraints.maxWidth - 16) / 2,
                    child: _buildMetricCard(
                      'APC CHALLENGER',
                      _numberFormat.format(apcVotes),
                      'Opponent Tally',
                      const Color(0xFF3B82F6),
                      Icons.poll,
                    ),
                  ),
                  SizedBox(
                    width: isWide ? (constraints.maxWidth - 48) / 4 : (constraints.maxWidth - 16) / 2,
                    child: _buildMetricCard(
                      'TOTAL VALID VOTES',
                      _numberFormat.format(totalValid),
                      'Cast in Gubernatorial Race',
                      const Color(0xFF8B5CF6),
                      Icons.fact_check,
                    ),
                  ),
                  SizedBox(
                    width: isWide ? (constraints.maxWidth - 48) / 4 : (constraints.maxWidth - 16) / 2,
                    child: _buildMetricCard(
                      'REPORTING PROGRESS',
                      uploadPct,
                      '$_numberFormat.format(collatedPus) / ${_numberFormat.format(totalPus)} PUs Collated',
                      const Color(0xFF10B981),
                      Icons.cloud_done,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 24),

          // Party Vote Share Bars
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF141E38),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'GUBERNATORIAL POPULAR VOTE SHARE',
                  style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                ...chart.map((c) {
                  final party = c['party'] ?? '';
                  final votes = c['votes'] ?? 0;
                  final pctStr = (c['pct'] ?? '0%').toString().replaceAll('%', '');
                  final pct = (double.tryParse(pctStr) ?? 0.0) / 100.0;
                  final colorHex = c['color'] ?? '#10B981';
                  final col = Color(int.parse(colorHex.replaceAll('#', '0xFF')));

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('$party Candidate', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            Text(
                              '${_numberFormat.format(votes)} votes (${(pct * 100).toStringAsFixed(1)}%)',
                              style: TextStyle(color: col, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: pct.clamp(0.0, 1.0),
                            minHeight: 8,
                            backgroundColor: Colors.white10,
                            valueColor: AlwaysStoppedAnimation<Color>(col),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // 27 LGAs Breakdown Grid Header with Search
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '27 LOCAL GOVERNMENT AREAS: GUBERNATORIAL BREAKDOWN',
                style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
              ),
              SizedBox(
                width: 260,
                height: 38,
                child: TextField(
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    hintText: 'Search LGA...',
                    hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                    prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B), size: 16),
                    filled: true,
                    fillColor: const Color(0xFF0B132B),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                  ),
                  onChanged: (val) => setState(() => _lgaSearchQuery = val),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // LGA Breakdown Cards
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
                itemCount: filteredBreakdown.length,
                itemBuilder: (context, index) {
                  final lga = filteredBreakdown[index];
                  final name = lga['lga_name'] ?? 'LGA';
                  final pPdp = (lga['pdp'] as num?)?.toInt() ?? 0;
                  final pApc = (lga['apc'] as num?)?.toInt() ?? 0;
                  final pNnpp = (lga['nnpp'] as num?)?.toInt() ?? 0;
                  final collated = lga['collated_pus'] ?? 0;
                  final total = lga['total_pus'] ?? 0;
                  final pctPUs = total > 0 ? (collated / total * 100).toStringAsFixed(0) : '0';

                  final lgaTotal = pPdp + pApc + pNnpp;
                  final pdpShare = lgaTotal > 0 ? (pPdp / lgaTotal) : 0.0;
                  final meets25 = pdpShare >= 0.25;

                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF141E38),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: meets25
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
                            Text(
                              name.toUpperCase(),
                              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: meets25 ? const Color(0xFF10B981).withOpacity(0.2) : Colors.white10,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                meets25 ? '✅ 25%+ MET' : '⏳ <25%',
                                style: TextStyle(
                                  color: meets25 ? const Color(0xFF10B981) : Colors.white60,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          'Collation: $collated / $total PUs ($pctPUs%)',
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildPartyChip('PDP', pPdp, const Color(0xFF008751)),
                            _buildPartyChip('APC', pApc, const Color(0xFF3B82F6)),
                            _buildPartyChip('NNPP', pNnpp, const Color(0xFF8B5CF6)),
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

  Widget _buildMetricCard(String title, String value, String subtitle, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
              Icon(icon, color: color, size: 18),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(subtitle, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildPartyChip(String party, int votes, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF0B132B),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        '$party: ${_numberFormat.format(votes)}',
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
