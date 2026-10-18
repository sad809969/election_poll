import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class AuditLogsTab extends StatefulWidget {
  const AuditLogsTab({super.key});

  @override
  State<AuditLogsTab> createState() => _AuditLogsTabState();
}

class _AuditLogsTabState extends State<AuditLogsTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _logs = [];

  @override
  void initState() {
    super.initState();
    _loadAuditLogs();
  }

  Future<void> _loadAuditLogs() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final list = await ApiService.getAuditLogs(limit: 100);
      if (mounted) {
        setState(() {
          _logs = list;
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

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF141E38),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.security, color: Color(0xFF3B82F6), size: 22),
                    SizedBox(width: 8),
                    Text(
                      'SYSTEM SECURITY AUDIT TRAIL',
                      style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                IconButton(
                  onPressed: _loadAuditLogs,
                  icon: const Icon(Icons.refresh, color: Color(0xFF10B981)),
                  tooltip: 'Sync Audit Trail',
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Logs List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF008751)))
                : _error != null
                    ? Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.redAccent)))
                    : _logs.isEmpty
                        ? const Center(child: Text('No audit events logged.', style: TextStyle(color: Colors.white54)))
                        : ListView.separated(
                            itemCount: _logs.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final item = _logs[index];
                              final action = item['action'] ?? item['event'] ?? 'SECURITY_EVENT';
                              final actor = item['username'] ?? item['actor'] ?? 'System';
                              final details = item['details'] ?? item['description'] ?? '';
                              final timestamp = item['timestamp'] ?? item['created_at'] ?? '';
                              final ip = item['ip_address'] ?? '';

                              return Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF141E38),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.white10),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF0B132B),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Icon(Icons.history_toggle_off, color: Color(0xFF94A3B8), size: 16),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                '$action by $actor',
                                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                              ),
                                              Text(
                                                timestamp.toString(),
                                                style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
                                              ),
                                            ],
                                          ),
                                          if (details.isNotEmpty || ip.isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              '$details ${ip.isNotEmpty ? "• IP: $ip" : ""}',
                                              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
