import 'package:flutter/material.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.forward();

    // Navigate to Login Screen after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) => const LoginScreen(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(opacity: animation, child: child);
            },
            transitionDuration: const Duration(milliseconds: 600),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070D1E), // Premium Situation Room Dark Theme
      body: SafeArea(
        child: Stack(
          children: [
            // Background Decorative PDP Gradient Blobs
            Positioned(
              top: -80,
              right: -80,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF008751).withOpacity(0.2),
                ),
              ),
            ),
            Positioned(
              bottom: -80,
              left: -80,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFE11D48).withOpacity(0.15),
                ),
              ),
            ),

            // Main Content Center
            Center(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: ScaleTransition(
                  scale: _scaleAnimation,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // PDP Official Umbrella Logo Card
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: const Color(0xFF141E38),
                            borderRadius: BorderRadius.circular(28),
                            border: Border.all(color: const Color(0xFF008751).withOpacity(0.5), width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF008751).withOpacity(0.3),
                                blurRadius: 30,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: Image.asset(
                            'assets/pdp_logo.png',
                            height: 120,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) => const Icon(
                              Icons.shield_outlined,
                              size: 100,
                              color: Color(0xFF008751),
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Title
                        RichText(
                          textAlign: TextAlign.center,
                          text: const TextSpan(
                            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: 1.2),
                            children: [
                              TextSpan(text: 'JIGAWA ', style: TextStyle(color: Color(0xFFE11D48))),
                              TextSpan(text: 'PDP ', style: TextStyle(color: Colors.white)),
                              TextSpan(text: 'POLLWATCH', style: TextStyle(color: Color(0xFF008751))),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),

                        const Text(
                          'Election Situation Room 2027',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.slate400,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.8,
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Official PDP Motto Banner
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF008751).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(30),
                            border: Border.all(color: const Color(0xFF008751).withOpacity(0.4)),
                          ),
                          child: const Text(
                            'POWER TO THE PEOPLE!',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF10B981),
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),

                        const SizedBox(height: 48),

                        // Progress Loader
                        const SizedBox(
                          width: 28,
                          height: 28,
                          child: CircularProgressIndicator(
                            color: Color(0xFF008751),
                            strokeWidth: 3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Footer Version
            Positioned(
              bottom: 20,
              left: 0,
              right: 0,
              child: Text(
                'Secured Field Operative Portal v1.0.0',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey.shade600,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
