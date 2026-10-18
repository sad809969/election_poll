import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

class ResultsTab extends StatefulWidget {
  const ResultsTab({super.key});

  @override
  State<ResultsTab> createState() => _ResultsTabState();
}

class _ResultsTabState extends State<ResultsTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _results = [];
  Map<String, dynamic> _summary = {};
  List<dynamic> _lgas = [];

  String _selectedElectionType = 'GOVERNORSHIP';
  int? _selectedLgaId;
  String? _selectedStatus;
  final TextEditingController _searchController = TextEditingController();
  final _numberFormat = NumberFormat('#,###');

  @override
  void initState() {
    super.initState();
    _loadLgas();
    _loadResults();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadLgas() async {
    try {
      final lgas = await ApiService.getLgas();
      if (mounted) setState(() => _lgas = lgas);
    } catch (_) {}
  }

  Future<void> _loadResults() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ApiService.getResults(
        electionType: _selectedElectionType,
        lgaId: _selectedLgaId,
        status: _selectedStatus == 'ALL' ? null : _selectedStatus,
        search: _searchController.text.trim().isNotEmpty ? _searchController.text.trim() : null,
      );

      if (mounted) {
        setState(() {
          _results = data['results'] as List? ?? [];
          _summary = data['summary'] as Map<String, dynamic>? ?? {};
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

  void _verifyResult(int resultId) async {
    try {
      await ApiService.approveResult(resultId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF008751),
            content: Text('Result successfully verified and locked into official collation!'),
          ),
        );
        _loadResults();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Verification error: $e'),
          ),
        );
      }
    }
  }

  void _flagResult(int resultId) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141E38),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: const Row(
          children: [
            Icon(Icons.flag, color: Colors.redAccent, size: 22),
            SizedBox(width: 8),
            Text('Flag Result Submission', style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Specify reason for flagging (e.g. Over-voting detected, illegible EC8A sheet, figure mismatch):',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Enter justification for rejection/flagging...',
                hintStyle: const TextStyle(color: Colors.white30),
                filled: true,
                fillColor: const Color(0xFF0B132B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
            onPressed: () async {
              final reason = reasonController.text.trim();
              if (reason.isEmpty) return;
              Navigator.pop(ctx);
              try {
                await ApiService.flagResult(resultId, reason);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      backgroundColor: Colors.redAccent,
                      content: Text('Result successfully flagged for field rectification.'),
                    ),
                  );
                  _loadResults();
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(backgroundColor: Colors.redAccent, content: Text('Error: $e')),
                  );
                }
              }
            },
            child: const Text('Confirm Flag'),
          ),
        ],
      ),
    );
  }

  void _openEc8aViewer(Map<String, dynamic> item) {
    final photoUrl = item['ec8a_photo_url'] ?? item['photo_url'];
    final puName = item['polling_unit_name'] ?? item['pu_code'] ?? 'Polling Unit';
    final resultId = item['id'];
    final status = item['status'] ?? 'PENDING_REVIEW';

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: const Color(0xFF0B132B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 800, maxHeight: 750),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Official Form EC8A Result Sheet - $puName',
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Submission ID: #$resultId • Status: $status',
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white10),
                  ),
                  clipBehavior: Clip.antiAlias,
                  alignment: Alignment.center,
                  child: photoUrl != null && photoUrl.toString().isNotEmpty
                      ? InteractiveViewer(
                          panEnabled: true,
                          minScale: 0.5,
                          maxScale: 4.0,
                          child: Image.network(
                            photoUrl.toString().startsWith('http')
                                ? photoUrl.toString()
                                : '${ApiService.baseUrl}/uploads/$photoUrl',
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => const Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.broken_image, color: Colors.white30, size: 48),
                                  SizedBox(height: 8),
                                  Text('Form EC8A Image unavailable', style: TextStyle(color: Colors.white54)),
                                ],
                              ),
                            ),
                          ),
                        )
                      : const Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.no_photography, color: Colors.amberAccent, size: 48),
                              SizedBox(height: 8),
                              Text('No Form EC8A sheet attached yet', style: TextStyle(color: Colors.white70)),
                            ],
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent, side: const BorderSide(color: Colors.redAccent)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _flagResult(resultId);
                    },
                    icon: const Icon(Icons.flag_outlined, size: 16),
                    label: const Text('Flag / Reject'),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _verifyResult(resultId);
                    },
                    icon: const Icon(Icons.verified, size: 16),
                    label: const Text('Approve & Verify'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 900;

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header & Filters
          _buildFilterBar(isWide),
          const SizedBox(height: 16),

          // Summary Stats Pill
          _buildSummaryPill(),
          const SizedBox(height: 16),

          // Results Feed
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF008751)))
                : _error != null
                    ? Center(
                        child: Text('Error loading results: $_error', style: const TextStyle(color: Colors.redAccent)),
                      )
                    : _results.isEmpty
                        ? const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.search_off, size: 48, color: Colors.white30),
                                SizedBox(height: 8),
                                Text('No election results match criteria', style: TextStyle(color: Colors.white54)),
                              ],
                            ),
                          )
                        : ListView.separated(
                            itemCount: _results.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final item = _results[index];
                              return _buildResultCard(item, isWide);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar(bool isWide) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          // Election Type Selector
          DropdownButton<String>(
            value: _selectedElectionType,
            dropdownColor: const Color(0xFF0B132B),
            underline: const SizedBox(),
            items: const [
              DropdownMenuItem(value: 'GOVERNORSHIP', child: Text('🏛️ Governorship', style: TextStyle(color: Colors.white))),
              DropdownMenuItem(value: 'PRESIDENTIAL', child: Text('🇳🇬 Presidential', style: TextStyle(color: Colors.white))),
              DropdownMenuItem(value: 'SENATORIAL', child: Text('🎖️ Senatorial (Senate)', style: TextStyle(color: Colors.white))),
              DropdownMenuItem(value: 'HOUSE_OF_REPS', child: Text('🏢 House of Reps', style: TextStyle(color: Colors.white))),
              DropdownMenuItem(value: 'STATE_ASSEMBLY', child: Text('📜 State House of Assembly', style: TextStyle(color: Colors.white))),
            ],
            onChanged: (val) {
              if (val != null) {
                setState(() => _selectedElectionType = val);
                _loadResults();
              }
            },
          ),

          // Status Filter
          DropdownButton<String>(
            value: _selectedStatus ?? 'ALL',
            dropdownColor: const Color(0xFF0B132B),
            underline: const SizedBox(),
            items: const [
              DropdownMenuItem(value: 'ALL', child: Text('All Statuses', style: TextStyle(color: Colors.white))),
              DropdownMenuItem(value: 'PENDING_REVIEW', child: Text('Pending Review', style: TextStyle(color: Colors.amberAccent))),
              DropdownMenuItem(value: 'VERIFIED', child: Text('Verified Only', style: TextStyle(color: Color(0xFF10B981)))),
              DropdownMenuItem(value: 'FLAGGED', child: Text('Flagged Only', style: TextStyle(color: Colors.redAccent))),
            ],
            onChanged: (val) {
              setState(() => _selectedStatus = val);
              _loadResults();
            },
          ),

          // LGA Filter
          if (_lgas.isNotEmpty)
            DropdownButton<int?>(
              value: _selectedLgaId,
              dropdownColor: const Color(0xFF0B132B),
              hint: const Text('All 27 LGAs', style: TextStyle(color: Colors.white70)),
              underline: const SizedBox(),
              items: [
                const DropdownMenuItem<int?>(value: null, child: Text('All 27 LGAs', style: TextStyle(color: Colors.white))),
                ..._lgas.map((l) => DropdownMenuItem<int?>(
                      value: l['id'],
                      child: Text(l['name'] ?? 'LGA', style: const TextStyle(color: Colors.white)),
                    )),
              ],
              onChanged: (val) {
                setState(() => _selectedLgaId = val);
                _loadResults();
              },
            ),

          // Search Field
          SizedBox(
            width: 220,
            child: TextField(
              controller: _searchController,
              onSubmitted: (_) => _loadResults(),
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Search PU code/name...',
                hintStyle: const TextStyle(color: Colors.white30),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                isDense: true,
                filled: true,
                fillColor: const Color(0xFF0B132B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search, size: 18, color: Colors.white70),
                  onPressed: _loadResults,
                ),
              ),
            ),
          ),

          // Refresh Button
          IconButton(
            onPressed: _loadResults,
            icon: const Icon(Icons.refresh, color: Color(0xFF10B981)),
            tooltip: 'Reload Results',
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryPill() {
    final verified = _summary['verified_count'] ?? 0;
    final flagged = _summary['flagged_count'] ?? 0;
    final pending = _summary['pending_review_count'] ?? 0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF0B132B),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          const Icon(Icons.analytics_outlined, color: Color(0xFF3B82F6), size: 18),
          const SizedBox(width: 8),
          const Text('Verification Pipeline: ', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold)),
          Text('$verified Verified', style: const TextStyle(color: Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.bold)),
          const Text('  •  ', style: TextStyle(color: Colors.white24)),
          Text('$pending Pending Review', style: const TextStyle(color: Colors.amberAccent, fontSize: 12, fontWeight: FontWeight.bold)),
          const Text('  •  ', style: TextStyle(color: Colors.white24)),
          Text('$flagged Flagged', style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildResultCard(Map<String, dynamic> item, bool isWide) {
    final status = (item['status'] ?? 'PENDING_REVIEW').toString().toUpperCase();
    final pdp = item['pdp_votes'] ?? 0;
    final apc = item['apc_votes'] ?? 0;
    final nnpp = item['nnpp_votes'] ?? 0;
    final lp = item['lp_votes'] ?? 0;
    final others = item['others_votes'] ?? 0;
    final total = pdp + apc + nnpp + lp + others;
    final puName = item['polling_unit_name'] ?? item['pu_code'] ?? 'Polling Unit';
    final lgaName = item['lga_name'] ?? 'LGA';
    final hasProof = item['ec8a_photo_url'] != null || item['photo_url'] != null;

    Color statusColor;
    if (status == 'VERIFIED') {
      statusColor = const Color(0xFF10B981);
    } else if (status == 'FLAGGED') {
      statusColor = const Color(0xFFEF4444);
    } else {
      statusColor = Colors.amberAccent;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: PU info & status badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      puName,
                      style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'LGA: $lgaName • Result ID: #${item['id']}',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: statusColor, width: 0.8),
                ),
                child: Text(
                  status,
                  style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Vote Breakdown Grid
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: [
              _buildPartyVoteChip('PDP', pdp, const Color(0xFF008751)),
              _buildPartyVoteChip('APC', apc, const Color(0xFF3B82F6)),
              _buildPartyVoteChip('NNPP', nnpp, const Color(0xFF8B5CF6)),
              _buildPartyVoteChip('LP', lp, const Color(0xFFEF4444)),
              _buildPartyVoteChip('TOTAL', total, Colors.white, isBold: true),
            ],
          ),
          const SizedBox(height: 14),

          // Actions Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: () => _openEc8aViewer(item),
                icon: Icon(hasProof ? Icons.image_search : Icons.broken_image, size: 16, color: hasProof ? const Color(0xFF3B82F6) : Colors.white38),
                label: Text(
                  hasProof ? 'Inspect Form EC8A Proof' : 'No EC8A Photo Attached',
                  style: TextStyle(color: hasProof ? const Color(0xFF3B82F6) : Colors.white38, fontSize: 12),
                ),
              ),
              Row(
                children: [
                  if (status != 'FLAGGED')
                    IconButton(
                      tooltip: 'Flag Result',
                      onPressed: () => _flagResult(item['id']),
                      icon: const Icon(Icons.flag_outlined, color: Colors.redAccent, size: 20),
                    ),
                  if (status != 'VERIFIED') ...[
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF008751),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      onPressed: () => _verifyResult(item['id']),
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Verify', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPartyVoteChip(String party, int count, Color color, {bool isBold = false}) {
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
          '$party: ${_numberFormat.format(count)}',
          style: TextStyle(
            color: isBold ? Colors.white : const Color(0xFFCBD5E1),
            fontSize: 12,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
