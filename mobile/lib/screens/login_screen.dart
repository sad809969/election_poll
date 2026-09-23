import 'package:flutter/material.dart';
import 'home_dashboard.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController(text: 'agent');
  final _passwordController = TextEditingController(text: 'agent123');
  bool _isLoading = false;

  void _showServerConfigDialog() {
    final serverController = TextEditingController(
      text: ApiService.baseUrl.replaceAll(RegExp(r'/api$'), ''),
    );
    String testStatus = '';
    bool isTesting = false;
    bool isSuccess = false;

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF141E38),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: const [
              Icon(Icons.wifi, color: Color(0xFF10B981), size: 20),
              SizedBox(width: 8),
              Text(
                'Server Connection',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Enter Backend Host URL (Local Wi-Fi or Remote):',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: serverController,
                style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: const Color(0xFF0B132B),
                  hintText: 'http://192.168.1.164:8000',
                  hintStyle: const TextStyle(color: Color(0xFF475569)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
              ),
              const SizedBox(height: 12),
              InkWell(
                onTap: isTesting
                    ? null
                    : () async {
                        setDialogState(() {
                          isTesting = true;
                          testStatus = 'Probing USB tunnel & Wi-Fi LAN...';
                        });
                        final res = await ApiService.autoDetectServer();
                        setDialogState(() {
                          isTesting = false;
                          isSuccess = res['success'] == true;
                          testStatus = res['message'] ?? '';
                          if (res['url'] != null) {
                            serverController.text = (res['url'] as String).replaceAll('/api', '');
                          }
                        });
                      },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 9),
                  decoration: BoxDecoration(
                    color: const Color(0xFF008751),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (isTesting)
                        const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      else
                        const Icon(Icons.radar, color: Colors.white, size: 16),
                      const SizedBox(width: 8),
                      const Text(
                        '⚡ Auto-Detect Server (USB / Wi-Fi)',
                        style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Manual Presets:',
                style: TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  _presetChip('USB Tunnel (127.0.0.1:8000)', 'http://127.0.0.1:8000', serverController),
                  _presetChip('Wi-Fi LAN (192.168.1.164:8000)', 'http://192.168.1.164:8000', serverController),
                  _presetChip('Emulator (10.0.2.2:8000)', 'http://10.0.2.2:8000', serverController),
                ],
              ),
              if (testStatus.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isSuccess ? const Color(0xFF064E3B) : const Color(0xFF7F1D1D),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(isSuccess ? Icons.check_circle : Icons.error, color: Colors.white, size: 16),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          testStatus,
                          style: const TextStyle(color: Colors.white, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: isTesting
                  ? null
                  : () async {
                      setDialogState(() {
                        isTesting = true;
                        testStatus = 'Pinging server...';
                      });
                      final res = await ApiService.testConnection(serverController.text.trim());
                      setDialogState(() {
                        isTesting = false;
                        isSuccess = res['success'] == true;
                        testStatus = res['message'] ?? '';
                      });
                    },
              child: isTesting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF10B981)))
                  : const Text('Test Connection', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () {
                ApiService.setBaseUrl(serverController.text.trim());
                Navigator.pop(dialogCtx);
                setState(() {});
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: const Color(0xFF008751),
                    content: Text('Server set to ${ApiService.baseUrl}'),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF008751),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Save & Apply', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _presetChip(String label, String url, TextEditingController controller) {
    return InkWell(
      onTap: () {
        controller.text = url;
      },
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF0B132B),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: const Color(0xFF334155)),
        ),
        child: Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
      ),
    );
  }

  void _login() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter username and password.')),
      );
      return;
    }

    setState(() => _isLoading = true);
    final success = await ApiService.login(username, password);
    setState(() => _isLoading = false);

    if (success && mounted) {
      final user = ApiService.currentUser;
      final pu = ApiService.currentPu;
      final agentName = user?['full_name'] ?? 'Agent $username';
      final assignedPu = pu?['name'] ?? 'Assigned Polling Unit';
      final puCode = pu?['code'] ?? 'PU-001';
      final lgaName = pu?['lga']?['name'] ?? 'Jigawa Command';
      final puId = user?['polling_unit_id'] ?? pu?['id'] ?? 1;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => HomeDashboard(
            agentName: agentName,
            assignedPu: assignedPu,
            lgaName: lgaName,
            puCode: puCode,
            pollingUnitId: puId,
          ),
        ),
      );
    } else if (mounted) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF141E38),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: const [
              Icon(Icons.error_outline, color: Colors.redAccent, size: 22),
              SizedBox(width: 8),
              Text('Authentication Failed', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                ApiService.lastErrorMessage.isNotEmpty
                    ? ApiService.lastErrorMessage
                    : 'Invalid credentials or network timeout.',
                style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF0B132B), borderRadius: BorderRadius.circular(8)),
                child: Text(
                  'Current Server: ${ApiService.baseUrl}',
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontFamily: 'monospace'),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                _showServerConfigDialog();
              },
              child: const Text('Change Server IP', style: TextStyle(color: Color(0xFF10B981))),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF334155)),
              child: const Text('OK', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070D1E),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // PDP Logo Header Card
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF141E38),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF008751).withOpacity(0.4), width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF008751).withOpacity(0.25),
                          blurRadius: 20,
                        ),
                      ],
                    ),
                    child: Image.asset(
                      'assets/pdp_logo.png',
                      height: 80,
                      width: 80,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.shield_outlined,
                        size: 60,
                        color: Color(0xFF008751),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                RichText(
                  textAlign: TextAlign.center,
                  text: const TextSpan(
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: 1.1),
                    children: [
                      TextSpan(text: 'JIGAWA ', style: TextStyle(color: Color(0xFFE11D48))),
                      TextSpan(text: 'PDP ', style: TextStyle(color: Colors.white)),
                      TextSpan(text: 'POLLWATCH', style: TextStyle(color: Color(0xFF008751))),
                    ],
                  ),
                ),
                const SizedBox(height: 4),

                const Text(
                  'Polling Unit Agent Portal 2027',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600),
                ),

                const SizedBox(height: 12),

                // PDP Motto Subtitle
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF008751).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF008751).withOpacity(0.3)),
                    ),
                    child: const Text(
                      'POWER TO THE PEOPLE!',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF10B981), letterSpacing: 1.2),
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Server Connection Status & Config Banner
                InkWell(
                  onTap: _showServerConfigDialog,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF141E38),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.wifi, size: 16, color: Color(0xFF10B981)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Server: ${ApiService.baseUrl.replaceAll('/api', '')}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFFCBD5E1),
                              fontWeight: FontWeight.w600,
                              fontFamily: 'monospace',
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF008751).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFF008751).withOpacity(0.4)),
                          ),
                          child: const Text(
                            'CHANGE',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF10B981),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Login Form Card
                Container(
                  padding: const EdgeInsets.all(20.0),
                  decoration: BoxDecoration(
                    color: const Color(0xFF141E38),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF1E293B)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('AGENT USERNAME OR PHONE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF94A3B8))),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _usernameController,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.person_outline, size: 18, color: Color(0xFF008751)),
                          filled: true,
                          fillColor: const Color(0xFF0B132B),
                          hintText: 'e.g. agent or 08012345678',
                          hintStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text('SECURITY PASSWORD', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF94A3B8))),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.lock_outline, size: 18, color: Color(0xFF008751)),
                          filled: true,
                          fillColor: const Color(0xFF0B132B),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _login,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF008751),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          minimumSize: const Size.fromHeight(48),
                          elevation: 3,
                        ),
                        child: _isLoading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('AUTHENTICATE & CHECK-IN', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.8)),
                      ),
                      const SizedBox(height: 14),
                      // Quick Test Credentials
                      Center(
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          alignment: WrapAlignment.center,
                          children: [
                            InkWell(
                              onTap: () {
                                _usernameController.text = 'agent';
                                _passwordController.text = 'agent123';
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0B132B),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFF334155)),
                                ),
                                child: const Text('Agent (agent/agent123)', style: TextStyle(fontSize: 10, color: Color(0xFF10B981))),
                              ),
                            ),
                            InkWell(
                              onTap: () {
                                _usernameController.text = 'admin';
                                _passwordController.text = 'admin1283';
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0B132B),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFF334155)),
                                ),
                                child: const Text('Admin (admin/admin1283)', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Restricted field access: Pre-assigned agent credentials only.\nSystem captures GPS telemetry and immutable audit logs.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 10, color: Color(0xFF64748B), height: 1.4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
