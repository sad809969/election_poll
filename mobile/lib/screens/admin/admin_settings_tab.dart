import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../login_screen.dart';

class AdminSettingsTab extends StatefulWidget {
  final VoidCallback onSwitchToFieldMode;

  const AdminSettingsTab({super.key, required this.onSwitchToFieldMode});

  @override
  State<AdminSettingsTab> createState() => _AdminSettingsTabState();
}

class _AdminSettingsTabState extends State<AdminSettingsTab> {
  final _serverUrlController = TextEditingController();
  bool _isTesting = false;
  String? _testResult;

  @override
  void initState() {
    super.initState();
    _serverUrlController.text = ApiService.baseUrl;
  }

  @override
  void dispose() {
    _serverUrlController.dispose();
    super.dispose();
  }

  void _testConnection() async {
    setState(() {
      _isTesting = true;
      _testResult = null;
    });

    final newUrl = _serverUrlController.text.trim();
    ApiService.setBaseUrl(newUrl);

    try {
      final summary = await ApiService.getDashboardSummary();
      if (mounted) {
        setState(() {
          _isTesting = false;
          _testResult = 'Connection Successful! Total PUs: ${summary['kpi']?['polling_units'] ?? 'OK'}';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isTesting = false;
          _testResult = 'Connection Failed: $e';
        });
      }
    }
  }

  void _logout() {
    ApiService.logout();
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ApiService.currentUser ?? {};
    final fullName = user['full_name'] ?? user['username'] ?? 'Administrator';
    final role = user['role'] ?? 'Super Admin';
    final phone = user['phone_number'] ?? 'N/A';

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // User Profile Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF141E38),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white10),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFF008751),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      fullName,
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$role • Phone: $phone',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                  ],
                ),
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF10B981),
                  side: const BorderSide(color: Color(0xFF10B981)),
                ),
                onPressed: widget.onSwitchToFieldMode,
                icon: const Icon(Icons.phone_android, size: 16),
                label: const Text('Field Agent View', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Server Endpoint Configuration Card
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
                  Icon(Icons.dns, color: Color(0xFF3B82F6), size: 20),
                  SizedBox(width: 8),
                  Text(
                    'TELEMETRY SERVER CONFIGURATION',
                    style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Point the Flutter client at the production cloud or local development backend:',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(height: 14),

              TextField(
                controller: _serverUrlController,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'FastAPI Backend URL',
                  labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
                  filled: true,
                  fillColor: const Color(0xFF0B132B),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 12),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ActionChip(
                    backgroundColor: const Color(0xFF0B132B),
                    label: const Text('Render Production Cloud', style: TextStyle(color: Color(0xFF10B981), fontSize: 11)),
                    onPressed: () {
                      _serverUrlController.text = 'https://pdp-pollwatch-backend.onrender.com/api';
                    },
                  ),
                  ActionChip(
                    backgroundColor: const Color(0xFF0B132B),
                    label: const Text('Localhost (:8000)', style: TextStyle(color: Color(0xFF3B82F6), fontSize: 11)),
                    onPressed: () {
                      _serverUrlController.text = 'http://localhost:8000/api';
                    },
                  ),
                ],
              ),
              const SizedBox(height: 14),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
                    onPressed: _isTesting ? null : _testConnection,
                    icon: _isTesting
                        ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.wifi_tethering, size: 16),
                    label: const Text('Save & Test Telemetry'),
                  ),
                  if (_testResult != null)
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(left: 16.0),
                        child: Text(
                          _testResult!,
                          style: TextStyle(
                            color: _testResult!.startsWith('Connection Successful') ? const Color(0xFF10B981) : Colors.redAccent,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Session & Logout Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF141E38),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Terminal Session', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                  SizedBox(height: 2),
                  Text('Disconnect and revoke active Bearer JWT token', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
                onPressed: _logout,
                icon: const Icon(Icons.logout, size: 16),
                label: const Text('Log Out'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
