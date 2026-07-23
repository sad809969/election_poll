import 'package:flutter/material.dart';

class ResultSubmissionScreen extends StatefulWidget {
  const ResultSubmissionScreen({super.key});

  @override
  State<ResultSubmissionScreen> createState() => _ResultSubmissionScreenState();
}

class _ResultSubmissionScreenState extends State<ResultSubmissionScreen> {
  final _pdpController = TextEditingController(text: '245');
  final _apcController = TextEditingController(text: '198');
  final _nnppController = TextEditingController(text: '42');
  final _lpController = TextEditingController(text: '12');
  final _rejectedController = TextEditingController(text: '5');
  bool _isSubmitting = false;

  void _submitResult() async {
    final int pdp = int.tryParse(_pdpController.text) ?? 0;
    final int apc = int.tryParse(_apcController.text) ?? 0;
    final int nnpp = int.tryParse(_nnppController.text) ?? 0;
    final int lp = int.tryParse(_lpController.text) ?? 0;
    final int total = pdp + apc + nnpp + lp;

    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(seconds: 1));
    setState(() => _isSubmitting = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Form EC8A Submitted! Total Valid Votes: $total (PDP: $pdp)')),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070D1E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B132B),
        title: const Text('Submit Form EC8A Result', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF141E38),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.verified, color: Color(0xFF10B981), size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'PU 023 - Guri Ward A (Guri LGA)\nRegistered Voters: 650',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              const Text('PARTY VOTE TALLIES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.slate400)),
              const SizedBox(height: 10),

              _buildVoteInput('PDP (Peoples Democratic Party)', _pdpController, const Color(0xFF10B981)),
              const SizedBox(height: 10),
              _buildVoteInput('APC (All Progressives Congress)', _apcController, const Color(0xFF3B82F6)),
              const SizedBox(height: 10),
              _buildVoteInput('NNPP (New Nigeria Peoples Party)', _nnppController, const Color(0xFF8B5CF6)),
              const SizedBox(height: 10),
              _buildVoteInput('LP (Labour Party)', _lpController, const Color(0xFFF59E0B)),
              const SizedBox(height: 10),
              _buildVoteInput('Rejected / Cancelled Votes', _rejectedController, Colors.red),

              const SizedBox(height: 20),

              // Upload Photo Button
              OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('EC8A Photo Sheet Attached via Camera!')),
                  );
                },
                icon: const Icon(Icons.camera_alt, color: Color(0xFF10B981)),
                label: const Text('Attach Form EC8A Photo Proof', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(46),
                  side: const BorderSide(color: Color(0xFF10B981)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),

              const SizedBox(height: 20),

              ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitResult,
                icon: const Icon(Icons.cloud_upload),
                label: Text(_isSubmitting ? 'SUBMITTING EC8A...' : 'SUBMIT OFFICIAL RESULT SHEET'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF008751),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVoteInput(String label, TextEditingController controller, Color color) {
    return Row(
      children: [
        Container(width: 4, height: 40, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
        ),
        SizedBox(
          width: 90,
          child: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFF141E38),
              contentPadding: const EdgeInsets.symmetric(vertical: 8),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF334155))),
            ),
          ),
        ),
      ],
    );
  }
}
