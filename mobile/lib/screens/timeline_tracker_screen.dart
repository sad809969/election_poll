import 'package:flutter/material.dart';

class TimelineTrackerScreen extends StatefulWidget {
  final String puCode;
  const TimelineTrackerScreen({super.key, required this.puCode});

  @override
  State<TimelineTrackerScreen> createState() => _TimelineTrackerScreenState();
}

class _TimelineTrackerScreenState extends State<TimelineTrackerScreen> {
  final Map<String, bool> _completedSteps = {
    'Check-in at Polling Unit': true,
    'Accreditation Started (08:30 AM)': true,
    'Voting Started (08:45 AM)': true,
    'Voting Ended (02:30 PM)': false,
    'Counting Started (03:00 PM)': false,
    'Counting Completed & Result Declared': false,
  };

  void _toggleStep(String step) {
    setState(() {
      _completedSteps[step] = !(_completedSteps[step] ?? false);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Timestamped milestone updated: $step')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${widget.puCode} Timeline Tracker')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          const Text('ELECTION TIMELINE MILESTONES', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
          const SizedBox(height: 12),
          ..._completedSteps.entries.map((entry) => Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: CheckboxListTile(
              activeColor: const Color(0xFF008751),
              title: Text(entry.key, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              subtitle: Text(entry.value ? 'Completed & Synced to Command Center' : 'Tap to mark completed', style: const TextStyle(fontSize: 11)),
              value: entry.value,
              onChanged: (_) => _toggleStep(entry.key),
            ),
          )),
        ],
      ),
    );
  }
}
