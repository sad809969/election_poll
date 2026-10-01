import 'package:flutter/material.dart';
import 'home_dashboard.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
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
      final lgaName = pu?['lga']?['name'] ?? pu?['lga_name'] ?? 'Jigawa Command';
      final puId = user?['polling_unit_id'] ?? pu?['id'] ?? 1;
      final registeredVoters = pu?['registered_voters'] ?? 650;

      Navigator.pushReplacement(
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
              Text(
                'Authentication Failed',
                style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
              ),
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
                decoration: BoxDecoration(
                  color: const Color(0xFF0B132B),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.cloud_done, size: 14, color: Color(0xFF10B981)),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Render Cloud Backend (Production)',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
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
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Render Cloud Live Network Pill (Replaces former Settings gear)
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF008751).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF008751).withOpacity(0.4)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.cloud_done, size: 13, color: Color(0xFF10B981)),
                        SizedBox(width: 6),
                        Text(
                          'RENDER CLOUD • LIVE NETWORK',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF10B981),
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

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
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF10B981),
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

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
                      const Text(
                        'AGENT USERNAME OR PHONE',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
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
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF334155)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF334155)),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'SECURITY PASSWORD',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.lock_outline, size: 18, color: Color(0xFF008751)),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                              size: 18,
                              color: const Color(0xFF64748B),
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                          filled: true,
                          fillColor: const Color(0xFF0B132B),
                          hintText: 'Enter secret password',
                          hintStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF334155)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF334155)),
                          ),
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
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text(
                                'AUTHENTICATE & CHECK-IN',
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 13,
                                  letterSpacing: 0.8,
                                ),
                              ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Restricted field access: Pre-assigned agent credentials only.\nSystem captures GPS telemetry and immutable audit logs on Render Cloud.',
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
