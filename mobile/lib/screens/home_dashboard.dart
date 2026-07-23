import 'package:flutter/material.dart';
import 'timeline_tracker_screen.dart';
import 'incident_report_screen.dart';
import 'result_submission_screen.dart';
import 'login_screen.dart';

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
  bool _isOnline = true;
  int _offlineQueueCount = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070D1E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B132B),
        title: Row(
          children: [
            Image.asset('assets/pdp_logo.png', height: 32, fit: BoxFit.contain),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('JIGAWA PDP POLLWATCH', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF008751))),
                Text(widget.lgaName, style: const TextStyle(fontSize: 10, color: Colors.slate400)),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(_isOnline ? Icons.wifi : Icons.wifi_off, color: _isOnline ? const Color(0xFF10B981) : Colors.red),
            onPressed: () => setState(() => _isOnline = !_isOnline),
            tooltip: _isOnline ? 'Online (Connected)' : 'Offline (Queue Mode)',
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.slate400),
            onPressed: () {
              Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
            },
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Agent & PU Info Banner Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF008751), Color(0xFF0B132B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF008751).withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4)),
                  ],
                ),
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
                          child: Row(
                            children: const [
                              Icon(Icons.check_circle, size: 12, color: Colors.white),
                              SizedBox(width: 4),
                              Text('AGENT CHECKED-IN', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white)),
                            ],
                          ),
                        ),
                        const Text('PDP POWER TO THE PEOPLE!', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF10B981))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(widget.agentName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
                    const SizedBox(height: 4),
                    Text('Assigned: ${widget.assignedPu}', style: const TextStyle(fontSize: 12, color: Colors.white70, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              const Text('FIELD OPERATIVE ACTIONS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.slate400, letterSpacing: 0.8)),
              const SizedBox(height: 12),

              // 4 Main Action Cards Grid
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.15,
                children: [
                  _buildActionCard(
                    context,
                    title: 'Timeline Tracker',
                    subtitle: 'Accreditation & Voting',
                    icon: Icons.access_time_filled,
                    color: const Color(0xFF3B82F6),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TimelineTrackerScreen())),
                  ),
                  _buildActionCard(
                    context,
                    title: 'Report Incident',
                    subtitle: 'Violence, BVAS, Queue',
                    icon: Icons.warning_amber_rounded,
                    color: const Color(0xFFEF4444),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const IncidentReportScreen())),
                  ),
                  _buildActionCard(
                    context,
                    title: 'Form EC8A Result',
                    subtitle: 'Vote Counts & Photo',
                    icon: Icons.fact_check,
                    color: const Color(0xFF10B981),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ResultSubmissionScreen())),
                  ),
                  _buildActionCard(
                    context,
                    title: 'Situation Desk',
                    subtitle: 'Call Coordinator',
                    icon: Icons.phone_in_talk,
                    color: const Color(0xFF8B5CF6),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Calling LGA Coordinator: 0812 345 6789...')),
                      );
                    },
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Queue Status Footer
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF141E38),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF1E293B)),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isOnline ? Icons.cloud_done : Icons.cloud_off,
                      color: _isOnline ? const Color(0xFF10B981) : Colors.amber,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isOnline ? 'Real-Time Sync Active' : 'Offline Queue Active',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: _isOnline ? const Color(0xFF10B981) : Colors.amber),
                          ),
                          Text(
                            _isOnline ? 'All telemetry synced with Situation Room' : '$_offlineQueueCount items queued for automatic sync',
                            style: const TextStyle(fontSize: 10, color: Colors.slate400),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF141E38),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
          boxShadow: [
            BoxShadow(color: color.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 3)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(fontSize: 9, color: Colors.slate400, fontWeight: FontWeight.w600)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
