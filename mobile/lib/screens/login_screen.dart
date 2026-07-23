import 'package:flutter/material.dart';
import 'home_dashboard.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController(text: 'agent_pu_023');
  final _passwordController = TextEditingController(text: 'password123');
  bool _isLoading = false;

  void _login() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 1));
    setState(() => _isLoading = false);

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const HomeDashboard(
            agentName: 'Murtala A. (PU Agent)',
            assignedPu: 'PU 023 - Guri Ward A',
            lgaName: 'Guri LGA',
            puCode: 'PU 023',
          ),
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
                  style: TextStyle(fontSize: 12, color: Colors.slate400, fontWeight: FontWeight.w600),
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

                const SizedBox(height: 28),

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
                      const Text('AGENT USERNAME', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.slate400)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _usernameController,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.person_outline, size: 18, color: Color(0xFF008751)),
                          filled: true,
                          fillColor: const Color(0xFF0B132B),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text('SECURITY PASSWORD', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.slate400)),
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
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Restricted field access: Pre-assigned agent credentials only.\nSystem captures GPS telemetry and immutable audit logs.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 10, color: Colors.slate500, height: 1.4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
