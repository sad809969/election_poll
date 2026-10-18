import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../home_dashboard.dart';
import '../login_screen.dart';
import 'overview_tab.dart';
import 'map_tab.dart';
import 'results_tab.dart';
import 'collation_tab.dart';
import 'incidents_tab.dart';
import 'polling_units_tab.dart';
import 'agents_tab.dart';
import 'broadcast_tab.dart';
import 'audit_logs_tab.dart';
import 'side_a_system_admin_tab.dart';
import 'admin_settings_tab.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _selectedIndex = 0;
  int _countdown = 10;
  bool _autoRefreshEnabled = true;
  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();
    _startCountdownTimer();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _startCountdownTimer() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_autoRefreshEnabled) return;
      if (!mounted) return;
      setState(() {
        if (_countdown > 1) {
          _countdown--;
        } else {
          _countdown = 10;
          // Silent tick without recreating tab widgets
        }
      });
    });
  }

  void _manualRefresh() {
    setState(() {
      _countdown = 10;
    });
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF008751),
        duration: Duration(seconds: 1),
        content: Text('Auto-sync cycle refreshed.'),
      ),
    );
  }

  void _toggleAutoRefresh() {
    setState(() {
      _autoRefreshEnabled = !_autoRefreshEnabled;
      if (_autoRefreshEnabled) {
        _countdown = 10;
      }
    });
  }

  void _navigateToTab(int index) {
    setState(() => _selectedIndex = index);
  }

  void _navigateToPath(String path, List<_NavDestination> navItems) {
    final idx = navItems.indexWhere((n) => n.path == path);
    if (idx != -1) {
      setState(() => _selectedIndex = idx);
    }
  }

  void _switchToFieldMode() {
    final user = ApiService.currentUser;
    final pu = ApiService.currentPu;
    final agentName = user?['full_name'] ?? 'Agent';
    final assignedPu = pu?['name'] ?? 'Assigned Polling Unit';
    final puCode = pu?['code'] ?? 'PU-001';
    final lgaName = pu?['lga']?['name'] ?? pu?['lga_name'] ?? 'Jigawa Command';
    final puId = user?['polling_unit_id'] ?? pu?['id'] ?? 1;
    final registeredVoters = pu?['registered_voters'] ?? 750;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => HomeDashboard(
          agentName: agentName,
          assignedPu: assignedPu,
          lgaName: lgaName,
          puCode: puCode,
          pollingUnitId: puId,
          registeredVoters: registeredVoters,
        ),
      ),
    );
  }

  void _logout() {
    _countdownTimer?.cancel();
    ApiService.logout();
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
      (route) => false,
    );
  }

  List<_NavDestination> _getVisibleNavItems() {
    final user = ApiService.currentUser ?? {};
    final role = (user['role'] ?? 'Super Admin').toString();
    final isSuperAdmin = role.toLowerCase().contains('super');

    final allItems = [
      const _NavDestination(icon: Icons.dashboard_outlined, selectedIcon: Icons.dashboard, label: 'Situation Room', path: '/'),
      const _NavDestination(icon: Icons.map_outlined, selectedIcon: Icons.map, label: 'Interactive Map', path: '/map'),
      const _NavDestination(icon: Icons.verified_outlined, selectedIcon: Icons.verified, label: 'Results & EC8A', path: '/results'),
      const _NavDestination(icon: Icons.table_chart_outlined, selectedIcon: Icons.table_chart, label: 'LGA Collation', path: '/collation'),
      const _NavDestination(icon: Icons.warning_amber_rounded, selectedIcon: Icons.warning_rounded, label: 'Incidents Command', path: '/incidents'),
      const _NavDestination(icon: Icons.how_to_vote_outlined, selectedIcon: Icons.how_to_vote, label: 'Polling Units', path: '/polling-units'),
      const _NavDestination(icon: Icons.badge_outlined, selectedIcon: Icons.badge, label: 'Agents & Roster', path: '/agents'),
      const _NavDestination(icon: Icons.campaign_outlined, selectedIcon: Icons.campaign, label: 'Broadcast Dispatch', path: '/broadcast'),
      const _NavDestination(icon: Icons.security_outlined, selectedIcon: Icons.security, label: 'Security & Audit', path: '/audit-logs'),
      const _NavDestination(icon: Icons.shield_moon_outlined, selectedIcon: Icons.shield_moon, label: 'Side A: System Admin', path: '/system-admin', isHighlighted: true),
      const _NavDestination(icon: Icons.settings_outlined, selectedIcon: Icons.settings, label: 'Settings & Host', path: '/settings'),
    ];

    if (isSuperAdmin) {
      return allItems;
    }

    // Role or User specific permissions filter: "he'll allow the page they'll see"
    final allowedRaw = user['allowed_pages'];
    if (allowedRaw is List && allowedRaw.isNotEmpty) {
      final allowedList = allowedRaw.map((e) => e.toString()).toList();
      final filtered = allItems.where((item) {
        if (item.path == '/settings') return true; // Settings always accessible
        return allowedList.contains(item.path);
      }).toList();

      if (filtered.isNotEmpty) return filtered;
    }

    return allItems;
  }

  Widget _buildBodyForPath(String path, List<_NavDestination> navItems) {
    switch (path) {
      case '/':
        return OverviewTab(
          onNavigateToResults: () => _navigateToPath('/results', navItems),
          onNavigateToIncidents: () => _navigateToPath('/incidents', navItems),
          onNavigateToCollation: () => _navigateToPath('/collation', navItems),
          onNavigateToMap: () => _navigateToPath('/map', navItems),
        );
      case '/map':
        return MapTab(
          onNavigateToLgaPus: (lga) => _navigateToPath('/polling-units', navItems),
          onNavigateToLgaCollation: (lga) => _navigateToPath('/collation', navItems),
        );
      case '/results':
        return const ResultsTab();
      case '/collation':
        return const CollationTab();
      case '/incidents':
        return const IncidentsTab();
      case '/polling-units':
        return const PollingUnitsTab();
      case '/agents':
        return const AgentsTab();
      case '/broadcast':
        return const BroadcastTab();
      case '/audit-logs':
        return const AuditLogsTab();
      case '/system-admin':
        return const SideASystemAdminTab();
      case '/settings':
        return AdminSettingsTab(onSwitchToFieldMode: _switchToFieldMode);
      default:
        return const Center(child: Text('Section Under Construction', style: TextStyle(color: Colors.white70)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 900;
    final user = ApiService.currentUser ?? {};
    final role = user['role'] ?? 'Super Admin';
    final navItems = _getVisibleNavItems();

    if (_selectedIndex >= navItems.length) {
      _selectedIndex = 0;
    }

    final activeItem = navItems[_selectedIndex];
    final currentBody = _buildBodyForPath(activeItem.path, navItems);

    return Scaffold(
      backgroundColor: const Color(0xFF070D1E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B132B),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF008751).withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF008751), width: 1),
              ),
              child: const Icon(Icons.shield, color: Color(0xFF10B981), size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'JIGAWA PDP POLLWATCH 2027',
                    style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                  ),
                  Text(
                    'Command Administration & Situation Room • ${activeItem.label}',
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // 10-Second Auto-Sync Countdown Indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _autoRefreshEnabled ? const Color(0xFF10B981).withOpacity(0.15) : Colors.white10,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: _autoRefreshEnabled ? const Color(0xFF10B981).withOpacity(0.6) : Colors.white24,
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _autoRefreshEnabled
                        ? (_countdown <= 2 ? const Color(0xFFF59E0B) : const Color(0xFF10B981))
                        : Colors.white38,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  _autoRefreshEnabled ? 'AUTO-SYNC ${_countdown}s' : 'SYNC PAUSED',
                  style: TextStyle(
                    color: _autoRefreshEnabled ? Colors.white : Colors.white54,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
                const SizedBox(width: 4),
                InkWell(
                  onTap: _toggleAutoRefresh,
                  borderRadius: BorderRadius.circular(4),
                  child: Padding(
                    padding: const EdgeInsets.all(2),
                    child: Icon(
                      _autoRefreshEnabled ? Icons.pause_circle_outline : Icons.play_circle_outline,
                      size: 14,
                      color: _autoRefreshEnabled ? const Color(0xFF10B981) : Colors.white70,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),

          // Instant Manual Refresh Button
          IconButton(
            tooltip: 'Sync Telemetry Now',
            icon: const Icon(Icons.refresh, color: Colors.white70, size: 20),
            onPressed: _manualRefresh,
          ),
          const SizedBox(width: 6),

          // Role Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withOpacity(0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              role.toString().toUpperCase(),
              style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 10),

          // Field agent mode switcher
          IconButton(
            tooltip: 'Switch to Field Agent View',
            icon: const Icon(Icons.phone_android, color: Colors.white70, size: 20),
            onPressed: _switchToFieldMode,
          ),

          // Logout
          IconButton(
            tooltip: 'Log Out',
            icon: const Icon(Icons.logout, color: Colors.white70, size: 20),
            onPressed: _logout,
          ),
          const SizedBox(width: 8),
        ],
      ),
      drawer: isDesktop
          ? null
          : Drawer(
              backgroundColor: const Color(0xFF0B132B),
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  DrawerHeader(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF008751), Color(0xFF0A3622)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        const Icon(Icons.shield, color: Colors.white, size: 36),
                        const SizedBox(height: 10),
                        const Text(
                          'Jigawa PDP PollWatch',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        Text(
                          role.toString(),
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  ...navItems.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final item = entry.value;
                    final isSel = _selectedIndex == idx;
                    return ListTile(
                      leading: Icon(
                        isSel ? item.selectedIcon : item.icon,
                        color: isSel
                            ? (item.isHighlighted ? const Color(0xFFF59E0B) : const Color(0xFF10B981))
                            : Colors.white70,
                      ),
                      title: Text(
                        item.label,
                        style: TextStyle(
                          color: isSel
                              ? (item.isHighlighted ? const Color(0xFFFDE68A) : Colors.white)
                              : Colors.white70,
                          fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                          fontSize: 13,
                        ),
                      ),
                      selected: isSel,
                      selectedTileColor: const Color(0xFF141E38),
                      onTap: () {
                        Navigator.pop(context);
                        _navigateToTab(idx);
                      },
                    );
                  }),
                ],
              ),
            ),
      body: Row(
        children: [
          // Desktop Navigation Rail / Sidebar
          if (isDesktop)
            Container(
              width: 240,
              decoration: const BoxDecoration(
                color: Color(0xFF0B132B),
                border: Border(right: BorderSide(color: Colors.white10)),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.builder(
                      itemCount: navItems.length,
                      itemBuilder: (context, idx) {
                        final item = navItems[idx];
                        final isSel = _selectedIndex == idx;
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          child: InkWell(
                            onTap: () => _navigateToTab(idx),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isSel
                                    ? (item.isHighlighted
                                        ? const Color(0xFFF59E0B).withOpacity(0.22)
                                        : const Color(0xFF008751).withOpacity(0.18))
                                    : (item.isHighlighted ? const Color(0xFFF59E0B).withOpacity(0.08) : Colors.transparent),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isSel
                                      ? (item.isHighlighted ? const Color(0xFFF59E0B) : const Color(0xFF008751))
                                      : (item.isHighlighted ? const Color(0xFFF59E0B).withOpacity(0.3) : Colors.transparent),
                                  width: item.isHighlighted ? 1.2 : 1.0,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    isSel ? item.selectedIcon : item.icon,
                                    size: 18,
                                    color: isSel
                                        ? (item.isHighlighted ? const Color(0xFFF59E0B) : const Color(0xFF10B981))
                                        : (item.isHighlighted ? const Color(0xFFF59E0B) : const Color(0xFF94A3B8)),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      item.label,
                                      style: TextStyle(
                                        color: isSel
                                            ? Colors.white
                                            : (item.isHighlighted ? const Color(0xFFFDE68A) : const Color(0xFF94A3B8)),
                                        fontWeight: isSel || item.isHighlighted ? FontWeight.bold : FontWeight.w500,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                  if (item.isHighlighted)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF59E0B).withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(3),
                                      ),
                                      child: const Text('CORE', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 8, fontWeight: FontWeight.bold)),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      border: Border(top: BorderSide(color: Colors.white10)),
                    ),
                    child: Row(
                      children: [
                        const CircleAvatar(
                          backgroundColor: Color(0xFF008751),
                          radius: 16,
                          child: Icon(Icons.person, color: Colors.white, size: 16),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user['username'] ?? 'admin',
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                role.toString(),
                                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
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

          // Main View Content
          Expanded(child: currentBody),
        ],
      ),
      bottomNavigationBar: !isDesktop
          ? BottomNavigationBar(
              currentIndex: _selectedIndex < 5 ? _selectedIndex : 0,
              backgroundColor: const Color(0xFF0B132B),
              selectedItemColor: const Color(0xFF10B981),
              unselectedItemColor: Colors.white54,
              type: BottomNavigationBarType.fixed,
              selectedFontSize: 11,
              unselectedFontSize: 10,
              onTap: (idx) {
                if (idx < navItems.length) {
                  _navigateToTab(idx);
                }
              },
              items: navItems.take(5).map((item) {
                return BottomNavigationBarItem(
                  icon: Icon(item.icon),
                  activeIcon: Icon(item.selectedIcon),
                  label: item.label.split(' ').first,
                );
              }).toList(),
            )
          : null,
    );
  }
}

class _NavDestination {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final String path;
  final bool isHighlighted;

  const _NavDestination({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.path,
    this.isHighlighted = false,
  });
}
