import 'package:flutter/material.dart';

class ResultSubmissionScreen extends StatefulWidget {
  final String puCode;
  const ResultSubmissionScreen({super.key, required this.puCode});

  @override
  State<ResultSubmissionScreen> createState() => _ResultSubmissionScreenState();
}

class _ResultSubmissionScreenState extends State<ResultSubmissionScreen> {
  final _pdpController = TextEditingController(text: '245');
  final _apcController = TextEditingController(text: '198');
  final _nnppController = TextEditingController(text: '76');
  final _lpController = TextEditingController(text: '34');
  final _othersController = TextEditingController(text: '12');
  final _rejectedController = TextEditingController(text: '15');
  bool _hasEc8aPhoto = true;

  int get _totalValid =>
      (int.tryParse(_pdpController.text) ?? 0) +
      (int.tryParse(_apcController.text) ?? 0) +
      (int.tryParse(_nnppController.text) ?? 0) +
      (int.tryParse(_lpController.text) ?? 0) +
      (int.tryParse(_othersController.text) ?? 0);

  int get _totalCast => _totalValid + (int.tryParse(_rejectedController.text) ?? 0);

  void _submitResult() {
    if (!_hasEc8aPhoto) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please attach photo of EC8A official result sheet')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF008751),
        content: Text('Official Result Submitted for ${widget.puCode}: PDP $_totalValid / Total $_totalCast'),
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Official EC8A Entry — ${widget.puCode}')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('OFFICIAL VOTE COUNTS BY PARTY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF008751))),
                    const SizedBox(height: 16),
                    _buildVoteInput('PDP (Peoples Democratic Party)', _pdpController, const Color(0xFF008751)),
                    _buildVoteInput('APC (All Progressives Congress)', _apcController, const Color(0xFF1E40AF)),
                    _buildVoteInput('NNPP (New Nigeria Peoples Party)', _nnppController, Colors.purple.shade700),
                    _buildVoteInput('LP (Labour Party)', _lpController, Colors.amber.shade800),
                    _buildVoteInput('Others (Other Parties)', _othersController, Colors.grey),
                    _buildVoteInput('Rejected / Invalid Ballots', _rejectedController, Colors.red.shade700),
                    const Divider(height: 32),

                    // Calculated Total Summary Card
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Total Valid Votes: $_totalValid', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              Text('Total Votes Cast: $_totalCast', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF008751))),
                            ],
                          ),
                          const Icon(Icons.check_circle, color: Color(0xFF008751)),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),
                    const Text('EC8A RESULT SHEET PHOTO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 6),
                    OutlinedButton.icon(
                      onPressed: () => setState(() => _hasEc8aPhoto = !_hasEc8aPhoto),
                      icon: Icon(_hasEc8aPhoto ? Icons.photo_library : Icons.add_a_photo, color: _hasEc8aPhoto ? const Color(0xFF008751) : Colors.grey),
                      label: Text(_hasEc8aPhoto ? 'EC8A Photo Attached ✓' : 'Upload High-Res EC8A Photo'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _submitResult,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF008751),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('SUBMIT & LOCK OFFICIAL RESULT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVoteInput(String label, TextEditingController controller, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(label, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: color)),
          ),
          Expanded(
            flex: 2,
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
