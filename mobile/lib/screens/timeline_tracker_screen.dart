import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TimelineTrackerScreen extends StatefulWidget {
  final int pollingUnitId;
  final String puName;
  final String puCode;

  const TimelineTrackerScreen({
    super.key,
    this.pollingUnitId = 1,
    this.puName = 'Assigned Polling Unit',
    this.puCode = 'DUT-0101',
  });

  @override
  State<TimelineTrackerScreen> createState() => _TimelineTrackerScreenState();
}

class _TimelineTrackerScreenState extends State<TimelineTrackerScreen> {
  final List<Map<String, dynamic>> _milestones = [
    {'title': 'Agent Check-in', 'time': '08:00 AM', 'done': true, 'notes': 'Checked in at Polling Unit'},
    {'title': 'Accreditation Started', 'time': '08:30 AM', 'done': true, 'notes': 'BVAS operational'},
    {'title': 'Voting Started', 'time': '09:00 AM', 'done': true, 'notes': 'Voter queue orderly'},
    {'title': 'Voting Ended', 'time': '02:30 PM', 'done': false, 'notes': 'Pending completion'},
    {'title': 'Counting Started', 'time': '--:--', 'done': false, 'notes': 'Pending'},
    {'title': 'Form EC8A Completed', 'time': '--:--', 'done': false, 'notes': 'Pending'},
  ];

  void _toggleMilestone(int index) async {
    final m = _milestones[index];
    final bool newDone = !m['done'];
    setState(() {
      m['done'] = newDone;
      if (newDone) {
        final now = DateTime.now();
        m['time'] = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
      }
    });

    if (newDone) {
      try {
        await ApiService.recordActivity(
          pollingUnitId: widget.pollingUnitId,
          activityType: m['title'],
          notes: '${m['title']} milestone recorded at ${m['time']}',
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF008751),
              content: Text('Milestone "${m['title']}" synced with Situation Room!'),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Saved locally: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070D1E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B132B),
        title: const Text('Election Timeline Tracker', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _milestones.length,
          itemBuilder: (context, index) {
            final m = _milestones[index];
            final bool isDone = m['done'];

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF141E38),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDone ? const Color(0xFF10B981).withOpacity(0.5) : const Color(0xFF334155)),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => _toggleMilestone(index),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDone ? const Color(0xFF10B981).withOpacity(0.2) : const Color(0xFF1E293B),
                        border: Border.all(color: isDone ? const Color(0xFF10B981) : Colors.grey, width: 2),
                      ),
                      child: isDone ? const Icon(Icons.check, size: 20, color: Color(0xFF10B981)) : null,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(m['title'], style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isDone ? Colors.white : const Color(0xFF94A3B8))),
                        Text(m['notes'], style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                  Text(m['time'], style: const TextStyle(fontSize: 12, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
