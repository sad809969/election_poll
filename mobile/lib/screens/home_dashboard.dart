import 'package:flutter/material.dart';
import 'timeline_tracker_screen.dart';
import 'incident_report_screen.dart';
import 'result_submission_screen.dart';

class HomeDashboard extends StatefulWidget {
  final String agentName;
  final String assignedPu;
  final String lgaName;
  final String puCode;

  const HomeDashboard({
    super.key,
    required this.agentName,
    required this.assignedPu,
    required this.lgaName,
    required this.puCode,
  });

  @override
  State<HomeDashboard> createState() => _HomeDashboardState();
}

class _HomeDashboardState extends State<HomeDashboard> {
  int _pendingOfflineCount = 0;
  bool _isOnline = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Agent Field Command', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: Icon(_isOnline ? Icons.wifi : Icons.wifi_off, color: _isOnline ? Colors.lightGreenAccent : Colors.orange),
            onPressed: () {
              setState(() => _isOnline = !_isOnline);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(_isOnline ? 'Online Mode Active' : 'Offline Mode Active — Reports Queued Locally')),
              );
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Assigned PU Banner
            Card(
              color: const Color(0xFF008751),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('EXCLUSIVE AGENT ASSIGNMENT', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                        Text(widget.puCode, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(widget.assignedPu, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('LGA: ${widget.lgaName} • Agent: ${widget.agentName}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Offline Sync Status Banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _pendingOfflineCount > 0 ? Colors.amber.shade50 : Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _pendingOfflineCount > 0 ? Colors.amber.shade300 : Colors.green.shade300),
              ),
              child: Row(
                children: [
                  Icon(_pendingOfflineCount > 0 ? Icons.sync : Icons.cloud_done, color: _pendingOfflineCount > 0 ? Colors.amber.shade800 : Colors.green.shade800),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _pendingOfflineCount > 0 ? 'Queued Offline Items: $_pendingOfflineCount' : 'All Data Synchronized',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: _pendingOfflineCount > 0 ? Colors.amber.shade900 : Colors.green.shade900),
                        ),
                        Text(
                          _isOnline ? 'Automatic background sync connected' : 'Offline mode — Encrypted & saved locally',
                          style: const TextStyle(fontSize: 10, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),
            const Text('ELECTION DAY ACTIONS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 12),

            // Action Launchers Grid
            _buildActionCard(
              context,
              title: 'Timeline & Check-in Tracker',
              subtitle: 'Log Accreditation, Voting & Counting milestones',
              icon: Icons.timeline,
              color: Colors.blue.shade700,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => TimelineTrackerScreen(puCode: widget.puCode))),
            ),
            const SizedBox(height: 12),

            _buildActionCard(
              context,
              title: 'Report Field Incident',
              subtitle: 'Violence, BVAS issues, security & late officials',
              icon: Icons.warning_amber_rounded,
              color: Colors.amber.shade800,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => IncidentReportScreen(puCode: widget.puCode))),
            ),
            const SizedBox(height: 12),

            _buildActionCard(
              context,
              title: 'Submit Election Result (EC8A)',
              subtitle: 'Input party votes & upload official result sheet photo',
              icon: Icons.how_to_vote,
              color: const Color(0xFF008751),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ResultSubmissionScreen(puCode: widget.puCode))),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 24),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
      ),
    );
  }
}
