import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';
import 'jigawa_map_widget.dart';

class OverviewTab extends StatefulWidget {
  final VoidCallback onNavigateToResults;
  final VoidCallback onNavigateToIncidents;
  final VoidCallback onNavigateToCollation;
  final VoidCallback? onNavigateToMap;

  const OverviewTab({
    super.key,
    required this.onNavigateToResults,
    required this.onNavigateToIncidents,
    required this.onNavigateToCollation,
    this.onNavigateToMap,
  });

  @override
  State<OverviewTab> createState() => _OverviewTabState();
}

class _OverviewTabState extends State<OverviewTab> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _kpi = {};
  Map<String, dynamic> _votes = {};
  List<dynamic> _recentIncidents = [];
  // ignore: unused_field
  List<dynamic> _recentResults = [];
  Timer? _autoRefreshTimer;
  final _numberFormat = NumberFormat('#,###');

  // 27 Jigawa State LGAs
  static const List<String> jigawaLgas = [
    'Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa',
    'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun',
    'Kafin Hausa', 'Kaugama', 'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Maigatari',
    'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi'
  ];

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (mounted) {
        _fetchDashboardData(silent: true);
      }
    });
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchDashboardData({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final summary = await ApiService.getDashboardSummary();
      final incidents = await ApiService.getIncidents(status: 'OPEN');
      final resultsData = await ApiService.getResults(limit: 5);

      if (mounted) {
        setState(() {
          _kpi = summary['kpi'] ?? {};
          _votes = summary['votes'] ?? {};
          _recentIncidents = incidents.take(5).toList();
          _recentResults = (resultsData['results'] as List? ?? []).take(5).toList();
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
              'Loading Jigawa Situation Room telemetry...',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
            ),
          ],
        ),
      );
    }

    if (_error != null && _kpi.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, size: 48, color: Colors.amberAccent),
              const SizedBox(height: 12),
              Text(
                'Telemetry Sync Notice: $_error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _fetchDashboardData,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry Connection'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF008751),
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final isWide = MediaQuery.of(context).size.width > 900;
    final totalVotes = (_votes['total'] as num?)?.toInt() ?? 0;
    final pdpVotes = (_votes['pdp'] as num?)?.toInt() ?? 0;
    final apcVotes = (_votes['apc'] as num?)?.toInt() ?? 0;
    final nnppVotes = (_votes['nnpp'] as num?)?.toInt() ?? 0;
    final lpVotes = (_votes['lp'] as num?)?.toInt() ?? 0;
    final othersVotes = (_votes['others'] as num?)?.toInt() ?? 0;

    final pdpPct = totalVotes > 0 ? (pdpVotes / totalVotes * 100) : 0.0;
    final apcPct = totalVotes > 0 ? (apcVotes / totalVotes * 100) : 0.0;
    final nnppPct = totalVotes > 0 ? (nnppVotes / totalVotes * 100) : 0.0;
    final lpPct = totalVotes > 0 ? (lpVotes / totalVotes * 100) : 0.0;

    final totalPUs = (_kpi['polling_units'] as num?)?.toInt() ?? 4827;
    final reportsSubmitted = (_kpi['reports'] as num?)?.toInt() ?? 0;
    final reportingPct = totalPUs > 0 ? (reportsSubmitted / totalPUs * 100).toStringAsFixed(1) : '0';

    return RefreshIndicator(
      color: const Color(0xFF008751),
      onRefresh: _fetchDashboardData,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Banner Bar
          _buildSituationRoomBanner(reportingPct),
          const SizedBox(height: 20),

          // KPI Metric Cards Grid
          _buildKpiMetricsGrid(isWide, totalPUs, reportsSubmitted),
          const SizedBox(height: 24),

          // Vote Share & Collation Overview
          if (isWide)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 3,
                  child: _buildVoteShareCard(pdpVotes, apcVotes, nnppVotes, lpVotes, othersVotes, totalVotes, pdpPct, apcPct, nnppPct, lpPct),
                ),
                const SizedBox(width: 20),
                Expanded(
                  flex: 2,
                  child: _buildRecentAlertsCard(),
                ),
              ],
            )
          else ...[
            _buildVoteShareCard(pdpVotes, apcVotes, nnppVotes, lpVotes, othersVotes, totalVotes, pdpPct, apcPct, nnppPct, lpPct),
            const SizedBox(height: 20),
            _buildRecentAlertsCard(),
          ],

          const SizedBox(height: 24),

          // Interactive Jigawa Geospatial Map Section
          JigawaMapWidget(
            compact: !isWide,
            onSelectLga: (lga) {
              // Interactive sector focus
            },
          ),
          const SizedBox(height: 24),

          // 27 LGAs Collation Progress Monitor
          _buildLgaProgressSection(isWide),
        ],
      ),
    );
  }

  Widget _buildSituationRoomBanner(String reportingPct) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF008751), Color(0xFF0A3622)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF008751).withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.shield_outlined, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Text(
                      'JIGAWA STATE CENTRAL SITUATION ROOM',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 0.5),
                    ),
                    SizedBox(width: 8),
                    _LivePulseBadge(),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Monitoring 27 LGAs • 287 Wards • 4,827 Polling Units | Reporting Completion: $reportingPct%',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _fetchDashboardData,
            icon: const Icon(Icons.refresh, color: Colors.white),
            tooltip: 'Sync Live Telemetry',
          ),
        ],
      ),
    );
  }

  Widget _buildKpiMetricsGrid(bool isWide, int totalPUs, int reportsSubmitted) {
    final activeAgents = (_kpi['agents'] as num?)?.toInt() ?? 0;
    final totalIncidents = (_kpi['incidents'] as num?)?.toInt() ?? 0;
    final pending = (_kpi['pending'] as num?)?.toInt() ?? (totalPUs - reportsSubmitted);

    final cards = [
      _buildMetricCard(
        title: 'TOTAL POLLING UNITS',
        value: _numberFormat.format(totalPUs),
        subtext: '27 LGAs / 287 Wards',
        icon: Icons.how_to_vote,
        color: const Color(0xFF3B82F6),
        onTap: null,
      ),
      _buildMetricCard(
        title: 'REPORTS SUBMITTED',
        value: _numberFormat.format(reportsSubmitted),
        subtext: totalPUs > 0 ? '${(reportsSubmitted / totalPUs * 100).toStringAsFixed(1)}% collated' : '0% collated',
        icon: Icons.cloud_done,
        color: const Color(0xFF10B981),
        onTap: widget.onNavigateToResults,
      ),
      _buildMetricCard(
        title: 'ACTIVE FIELD AGENTS',
        value: _numberFormat.format(activeAgents),
        subtext: 'Accredited on ground',
        icon: Icons.badge_outlined,
        color: const Color(0xFF8B5CF6),
        onTap: null,
      ),
      _buildMetricCard(
        title: 'ACTIVE INCIDENTS',
        value: _numberFormat.format(totalIncidents),
        subtext: totalIncidents == 0 ? 'No alerts reported' : 'Requires triage',
        icon: Icons.warning_amber_rounded,
        color: totalIncidents > 0 ? const Color(0xFFEF4444) : const Color(0xFF10B981),
        onTap: widget.onNavigateToIncidents,
      ),
      _buildMetricCard(
        title: 'AWAITING REPORT',
        value: _numberFormat.format(pending > 0 ? pending : 0),
        subtext: 'Pending count closure',
        icon: Icons.hourglass_top_rounded,
        color: const Color(0xFFF59E0B),
        onTap: widget.onNavigateToCollation,
      ),
    ];

    if (isWide) {
      return Row(
        children: cards
            .map((c) => Expanded(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 6), child: c)))
            .toList(),
      );
    } else {
      return GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.5,
        children: cards,
      );
    }
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String subtext,
    required IconData icon,
    required Color color,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF141E38),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.25), width: 1),
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
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 2),
            Text(
              subtext,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: color.withValues(alpha: 0.9), fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVoteShareCard(
    int pdp, int apc, int nnpp, int lp, int others, int total,
    double pdpPct, double apcPct, double nnppPct, double lpPct,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
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
              const Row(
                children: [
                  Icon(Icons.pie_chart, color: Color(0xFF008751), size: 20),
                  SizedBox(width: 8),
                  Text(
                    'COMBINED POPULAR VOTE TALLY (ALL ELECTIONS)',
                    style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Text(
                'Total: ${_numberFormat.format(total)} votes',
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Multi-party distribution bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              height: 24,
              child: Row(
                children: [
                  if (pdpPct > 0)
                    Expanded(
                      flex: pdpPct.toInt().clamp(1, 100),
                      child: Container(color: const Color(0xFF008751)),
                    ),
                  if (apcPct > 0)
                    Expanded(
                      flex: apcPct.toInt().clamp(1, 100),
                      child: Container(color: const Color(0xFF3B82F6)),
                    ),
                  if (nnppPct > 0)
                    Expanded(
                      flex: nnppPct.toInt().clamp(1, 100),
                      child: Container(color: const Color(0xFF8B5CF6)),
                    ),
                  if (lpPct > 0)
                    Expanded(
                      flex: lpPct.toInt().clamp(1, 100),
                      child: Container(color: const Color(0xFFEF4444)),
                    ),
                  if (total == 0)
                    Expanded(
                      child: Container(color: Colors.white10),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Party Breakdown List
          _buildPartyTallyRow('PDP (Peoples Democratic Party)', pdp, pdpPct, const Color(0xFF008751), isLeader: pdp >= apc && pdp > 0),
          const SizedBox(height: 12),
          _buildPartyTallyRow('APC (All Progressives Congress)', apc, apcPct, const Color(0xFF3B82F6), isLeader: apc > pdp),
          const SizedBox(height: 12),
          _buildPartyTallyRow('NNPP (New Nigeria Peoples Party)', nnpp, nnppPct, const Color(0xFF8B5CF6), isLeader: false),
          const SizedBox(height: 12),
          _buildPartyTallyRow('LP (Labour Party)', lp, lpPct, const Color(0xFFEF4444), isLeader: false),
          if (others > 0) ...[
            const SizedBox(height: 12),
            _buildPartyTallyRow('Others', others, (others / (total > 0 ? total : 1) * 100), const Color(0xFF64748B), isLeader: false),
          ],
        ],
      ),
    );
  }

  Widget _buildPartyTallyRow(String partyName, int votes, double pct, Color color, {bool isLeader = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ),
                const SizedBox(width: 8),
                Text(
                  partyName,
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                ),
                if (isLeader) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF008751).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: const Color(0xFF008751), width: 0.8),
                    ),
                    child: const Text('LEADING', style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.bold)),
                  ),
                ],
              ],
            ),
            Text(
              '${_numberFormat.format(votes)} (${pct.toStringAsFixed(1)}%)',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct / 100.0,
            backgroundColor: Colors.white10,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }

  Widget _buildRecentAlertsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
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
              const Row(
                children: [
                  Icon(Icons.notifications_active_outlined, color: Colors.amberAccent, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'SITUATION ROOM ALERTS',
                    style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              TextButton(
                onPressed: widget.onNavigateToIncidents,
                child: const Text('View All', style: TextStyle(color: Color(0xFF10B981), fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_recentIncidents.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              alignment: Alignment.center,
              child: const Column(
                children: [
                  Icon(Icons.check_circle_outline, color: Color(0xFF10B981), size: 36),
                  SizedBox(height: 8),
                  Text(
                    'Zero critical incidents pending resolution',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _recentIncidents.length,
              separatorBuilder: (_, __) => const Divider(color: Colors.white10, height: 16),
              itemBuilder: (context, idx) {
                final inc = _recentIncidents[idx];
                final sev = (inc['severity'] ?? 'MEDIUM').toString().toUpperCase();
                final isCritical = sev == 'CRITICAL' || sev == 'HIGH';
                final color = isCritical ? const Color(0xFFEF4444) : Colors.amberAccent;

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: color, width: 0.8),
                      ),
                      child: Text(
                        sev,
                        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            inc['incident_type'] ?? inc['title'] ?? 'Field Incident',
                            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            inc['description'] ?? 'No description provided.',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildLgaProgressSection(bool isWide) {
    return Container(
      padding: const EdgeInsets.all(20),
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
              const Row(
                children: [
                  Icon(Icons.location_city, color: Color(0xFF3B82F6), size: 20),
                  SizedBox(width: 8),
                  Text(
                    '27 JIGAWA LGAs COLLATION COVERAGE',
                    style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              OutlinedButton.icon(
                onPressed: widget.onNavigateToCollation,
                icon: const Icon(Icons.table_chart_outlined, size: 14),
                label: const Text('Open Collation Center', style: TextStyle(fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF10B981),
                  side: const BorderSide(color: Color(0xFF10B981)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: isWide ? 4 : 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: isWide ? 2.8 : 2.2,
            ),
            itemCount: jigawaLgas.length,
            itemBuilder: (context, index) {
              final lga = jigawaLgas[index];
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF0B132B),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white10),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            lga,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Active telemetry',
                            style: TextStyle(color: Color(0xFF64748B), fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _LivePulseBadge extends StatefulWidget {
  const _LivePulseBadge();

  @override
  State<_LivePulseBadge> createState() => _LivePulseBadgeState();
}

class _LivePulseBadgeState extends State<_LivePulseBadge> with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animController,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.redAccent.withValues(alpha: 0.15 + (_animController.value * 0.2)),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.redAccent, width: 0.8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
              ),
              const SizedBox(width: 4),
              const Text(
                'LIVE',
                style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
      },
    );
  }
}
