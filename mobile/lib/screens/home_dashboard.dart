import 'package:flutter/material.dart';
import 'timeline_tracker_screen.dart';
import 'incident_report_screen.dart';
import 'result_submission_screen.dart';
import 'notifications_screen.dart';
import 'login_screen.dart';
import '../services/socket_service.dart';
import '../services/api_service.dart';

class HomeDashboard extends StatefulWidget {
  final String agentName;
  final String assignedPu;
  final String lgaName;
  final String puCode;
  final int pollingUnitId;
  final int registeredVoters;

  const HomeDashboard({
    super.key,
    required this.agentName,
    required this.assignedPu,
    required this.lgaName,
    required this.puCode,
    this.pollingUnitId = 1,
    this.registeredVoters = 650,
  });

  @override
  State<HomeDashboard> createState() => _HomeDashboardState();
}

class _HomeDashboardState extends State<HomeDashboard> {
  bool _isOnline = true;
  final int _offlineQueueCount = 0;

  @override
  void initState() {
    super.initState();
    SocketService.init();
    if (ApiService.token != null && !SocketService.isConnected) {
      SocketService.connect(ApiService.token!);
    }
  }

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
                const Text(
                  'JIGAWA PDP POLLWATCH',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF008751)),
                ),
                Text(widget.lgaName, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
              ],
            ),
          ],
        ),
        actions: [
          // Notification Bell with Badge
          ValueListenableBuilder<int>(
            valueListenable: SocketService.unreadCountNotifier,
            builder: (context, unreadCount, _) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22),
                    tooltip: 'Situation Alerts',
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                      );
                    },
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFFE11D48),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          unreadCount > 9 ? '9+' : '$unreadCount',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          IconButton(
            icon: Icon(
              _isOnline ? Icons.wifi : Icons.wifi_off,
              color: _isOnline ? const Color(0xFF10B981) : Colors.red,
            ),
            onPressed: () => setState(() => _isOnline = !_isOnline),
            tooltip: _isOnline ? 'Online (Connected)' : 'Offline (Queue Mode)',
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFF94A3B8)),
            tooltip: 'Logout',
            onPressed: () {
              ApiService.logout();
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
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
                    BoxShadow(
                      color: const Color(0xFF008751).withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
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
                          child: const Row(
                            children: [
                              Icon(Icons.check_circle, size: 12, color: Colors.white),
                              SizedBox(width: 4),
                              Text(
                                'AGENT CHECKED-IN',
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                        const Text(
                          'PDP POWER TO THE PEOPLE!',
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF10B981)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      widget.agentName,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Assigned: ${widget.assignedPu}',
                      style: const TextStyle(fontSize: 12, color: Colors.white70, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black26,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.location_on, size: 11, color: Color(0xFF10B981)),
                              SizedBox(width: 4),
                              Text(
                                'GPS Geofenced & Active',
                                style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black26,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.camera_alt, size: 11, color: Color(0xFF10B981)),
                              SizedBox(width: 4),
                              Text(
                                'Camera Ready',
                                style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              const Text(
                'FIELD OPERATIVE ACTIONS',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF94A3B8),
                  letterSpacing: 0.8,
                ),
              ),
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
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => TimelineTrackerScreen(
                          pollingUnitId: widget.pollingUnitId,
                          puName: widget.assignedPu,
                          puCode: widget.puCode,
                        ),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context,
                    title: 'Report Incident',
                    subtitle: 'Violence, BVAS, Queue',
                    icon: Icons.warning_amber_rounded,
                    color: const Color(0xFFEF4444),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => IncidentReportScreen(
                          pollingUnitId: widget.pollingUnitId,
                          puName: widget.assignedPu,
                          puCode: widget.puCode,
                        ),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context,
                    title: 'Form EC8A Result',
                    subtitle: 'Vote Counts & Photo',
                    icon: Icons.fact_check,
                    color: const Color(0xFF10B981),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ResultSubmissionScreen(
                          pollingUnitId: widget.pollingUnitId,
                          puName: widget.assignedPu,
                          puCode: widget.puCode,
                          registeredVoters: widget.registeredVoters,
                        ),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context,
                    title: 'Situation Alerts',
                    subtitle: 'Broadcast Feed & Audio',
                    icon: Icons.campaign_rounded,
                    color: const Color(0xFF8B5CF6),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const NotificationsScreen(),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Queue Status Footer with Reactive WebSocket Telemetry
              ValueListenableBuilder<bool>(
                valueListenable: SocketService.connectionState,
                builder: (context, isWsConnected, _) {
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF141E38),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isWsConnected
                            ? const Color(0xFF008751).withOpacity(0.5)
                            : const Color(0xFF1E293B),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isWsConnected ? Icons.cloud_done : (_isOnline ? Icons.cloud_sync : Icons.cloud_off),
                          color: isWsConnected
                              ? const Color(0xFF10B981)
                              : (_isOnline ? Colors.amber : Colors.redAccent),
                          size: 22,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isWsConnected
                                    ? 'Render Cloud WebSocket Active'
                                    : (_isOnline ? 'Connecting to Render Cloud...' : 'Offline Queue Active'),
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: isWsConnected
                                      ? const Color(0xFF10B981)
                                      : (_isOnline ? Colors.amber : Colors.redAccent),
                                ),
                              ),
                              Text(
                                isWsConnected
                                    ? 'Live telemetry streaming to Jigawa Situation Room'
                                    : '$_offlineQueueCount items queued for automatic sync',
                                style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
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
                Text(
                  title,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
