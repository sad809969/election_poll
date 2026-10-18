import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class BroadcastTab extends StatefulWidget {
  const BroadcastTab({super.key});

  @override
  State<BroadcastTab> createState() => _BroadcastTabState();
}

class _BroadcastTabState extends State<BroadcastTab> {
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  String _selectedPriority = 'HIGH';
  bool _isSending = false;
  List<dynamic> _broadcasts = [];
  bool _isLoadingBroadcasts = true;

  @override
  void initState() {
    super.initState();
    _loadBroadcastHistory();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _loadBroadcastHistory() async {
    setState(() => _isLoadingBroadcasts = true);
    try {
      final list = await ApiService.getBroadcasts();
      if (mounted) {
        setState(() {
          _broadcasts = list;
          _isLoadingBroadcasts = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingBroadcasts = false);
    }
  }

  void _dispatchBroadcast() async {
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();

    if (title.isEmpty || content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter broadcast title and instructions.')),
      );
      return;
    }

    setState(() => _isSending = true);
    try {
      await ApiService.createBroadcast(
        title: title,
        message: content,
        priority: _selectedPriority,
      );
      if (mounted) {
        _titleController.clear();
        _contentController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF008751),
            content: Text('Broadcast dispatch dispatched to all field terminals.'),
          ),
        );
        _loadBroadcastHistory();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.redAccent, content: Text('Dispatch failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Dispatch Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF141E38),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white10),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.campaign, color: Color(0xFF10B981), size: 22),
                  SizedBox(width: 8),
                  Text(
                    'DISPATCH SITUATION ROOM BROADCAST',
                    style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Instant alert will pop up across all active mobile terminals and polling unit agent devices.',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _titleController,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Broadcast Headline (e.g. EC8A Photo Reminder, Caution in Ward 03)',
                  hintStyle: const TextStyle(color: Colors.white30),
                  filled: true,
                  fillColor: const Color(0xFF0B132B),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 12),

              TextField(
                controller: _contentController,
                maxLines: 3,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Actionable instructions to field agents...',
                  hintStyle: const TextStyle(color: Colors.white30),
                  filled: true,
                  fillColor: const Color(0xFF0B132B),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 14),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Text('Priority: ', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                      DropdownButton<String>(
                        value: _selectedPriority,
                        dropdownColor: const Color(0xFF0B132B),
                        underline: const SizedBox(),
                        items: const [
                          DropdownMenuItem(value: 'CRITICAL', child: Text('Critical (Red)', style: TextStyle(color: Colors.redAccent))),
                          DropdownMenuItem(value: 'HIGH', child: Text('High (Amber)', style: TextStyle(color: Colors.amberAccent))),
                          DropdownMenuItem(value: 'NORMAL', child: Text('Normal (Green)', style: TextStyle(color: Color(0xFF10B981)))),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedPriority = val);
                        },
                      ),
                    ],
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF008751),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                    onPressed: _isSending ? null : _dispatchBroadcast,
                    icon: _isSending ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.send, size: 16),
                    label: const Text('Send Broadcast', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Broadcast History
        const Text(
          'BROADCAST LOG & TRANSMISSIONS',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),

        if (_isLoadingBroadcasts)
          const Center(child: CircularProgressIndicator(color: Color(0xFF008751)))
        else if (_broadcasts.isEmpty)
          const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('No announcements logged yet.', style: TextStyle(color: Colors.white54))))
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _broadcasts.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final b = _broadcasts[index];
              final priority = (b['priority'] ?? 'HIGH').toString().toUpperCase();
              final isCrit = priority == 'CRITICAL' || priority == 'HIGH';

              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF141E38),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            b['title'] ?? 'Situation Room Alert',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: isCrit ? Colors.redAccent.withOpacity(0.2) : const Color(0xFF10B981).withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                priority,
                                style: TextStyle(
                                  color: isCrit ? Colors.redAccent : const Color(0xFF10B981),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            if (b['id'] != null) ...[
                              const SizedBox(width: 6),
                              IconButton(
                                tooltip: 'Delete Announcement',
                                icon: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                                onPressed: () async {
                                  try {
                                    await ApiService.deleteBroadcast(b['id']);
                                    _loadBroadcastHistory();
                                  } catch (_) {}
                                },
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      b['content'] ?? b['message'] ?? '',
                      style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }
}
