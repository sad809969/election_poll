import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

class CollationTab extends StatefulWidget {
  const CollationTab({super.key});

  @override
  State<CollationTab> createState() => _CollationTabState();
}

class _CollationTabState extends State<CollationTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _lgas = [];
  Map<int, Map<String, dynamic>> _lgaCollationCache = {};
  int? _expandedLgaId;
  final _numberFormat = NumberFormat('#,###');

  @override
  void initState() {
    super.initState();
    _loadCollationOverview();
  }

  Future<void> _loadCollationOverview() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final lgas = await ApiService.getLgas();
      if (mounted) {
        setState(() {
          _lgas = lgas;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadLgaDetails(int lgaId) async {
    if (_lgaCollationCache.containsKey(lgaId)) return;

    try {
      final details = await ApiService.getLgaCollation(lgaId);
      if (mounted) {
        setState(() {
          _lgaCollationCache[lgaId] = details;
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF008751)));
    }

    if (_error != null && _lgas.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.amberAccent),
            const SizedBox(height: 12),
            Text('Error loading collation directory: $_error', style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadCollationOverview,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751)),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Header
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF141E38),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.table_view_rounded, color: Color(0xFF10B981), size: 22),
                      SizedBox(width: 8),
                      Text(
                        'JIGAWA STATE LGA COLLATION CENTER',
                        style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Official Returning & Collation Status across all 27 Local Government Areas',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                ],
              ),
              IconButton(
                onPressed: _loadCollationOverview,
                icon: const Icon(Icons.refresh, color: Color(0xFF10B981)),
                tooltip: 'Refresh Collation',
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // LGA Collation Accordion / Expansion Cards
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _lgas.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final lga = _lgas[index];
            final lgaId = lga['id'];
            final isExpanded = _expandedLgaId == lgaId;
            final cache = _lgaCollationCache[lgaId];

            return Container(
              decoration: BoxDecoration(
                color: const Color(0xFF141E38),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isExpanded ? const Color(0xFF008751).withOpacity(0.5) : Colors.white10,
                ),
              ),
              child: Column(
                children: [
                  ListTile(
                    title: Text(
                      lga['name'] ?? 'LGA $lgaId',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    subtitle: Text(
                      'Wards: ${lga['ward_count'] ?? lga['wards_count'] ?? '11'} • Polling Units: ${lga['polling_unit_count'] ?? lga['pu_count'] ?? '178'}',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF008751).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: const Color(0xFF008751), width: 0.8),
                          ),
                          child: const Text('COLLATING', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 8),
                        Icon(isExpanded ? Icons.expand_less : Icons.expand_more, color: Colors.white54),
                      ],
                    ),
                    onTap: () {
                      setState(() {
                        if (isExpanded) {
                          _expandedLgaId = null;
                        } else {
                          _expandedLgaId = lgaId;
                          _loadLgaDetails(lgaId);
                        }
                      });
                    },
                  ),
                  if (isExpanded) ...[
                    const Divider(color: Colors.white10, height: 1),
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: cache == null
                          ? const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(color: Color(0xFF008751), strokeWidth: 2)))
                          : _buildLgaCollationDetails(cache),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildLgaCollationDetails(Map<String, dynamic> cache) {
    final votes = cache['votes'] ?? cache['summary'] ?? {};
    final pdp = votes['pdp'] ?? votes['pdp_votes'] ?? 0;
    final apc = votes['apc'] ?? votes['apc_votes'] ?? 0;
    final nnpp = votes['nnpp'] ?? votes['nnpp_votes'] ?? 0;
    final lp = votes['lp'] ?? votes['lp_votes'] ?? 0;
    final total = pdp + apc + nnpp + lp;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'AGGREGATE LGA VOTE RETURNS (FORM EC8B/EC8C)',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildCollationPill('PDP', pdp, const Color(0xFF008751))),
            const SizedBox(width: 8),
            Expanded(child: _buildCollationPill('APC', apc, const Color(0xFF3B82F6))),
            const SizedBox(width: 8),
            Expanded(child: _buildCollationPill('NNPP', nnpp, const Color(0xFF8B5CF6))),
            const SizedBox(width: 8),
            Expanded(child: _buildCollationPill('LP', lp, const Color(0xFFEF4444))),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          'Total Valid Votes Tallied: ${_numberFormat.format(total)}',
          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildCollationPill(String party, int votes, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF0B132B),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(party, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(height: 4),
          Text(
            _numberFormat.format(votes),
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
