import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ResultSubmissionScreen extends StatefulWidget {
  final int pollingUnitId;
  final String puName;
  final String puCode;
  final int registeredVoters;

  const ResultSubmissionScreen({
    super.key,
    this.pollingUnitId = 1,
    this.puName = 'Assigned Polling Unit',
    this.puCode = 'DUT-0101',
    this.registeredVoters = 650,
  });

  @override
  State<ResultSubmissionScreen> createState() => _ResultSubmissionScreenState();
}

class _ResultSubmissionScreenState extends State<ResultSubmissionScreen> {
  String _selectedElectionType = 'GOVERNORSHIP';
  final _pdpController = TextEditingController(text: '245');
  final _apcController = TextEditingController(text: '198');
  final _nnppController = TextEditingController(text: '42');
  final _lpController = TextEditingController(text: '12');
  final _rejectedController = TextEditingController(text: '5');
  bool _isSubmitting = false;
  bool _photoAttached = false;

  void _submitResult() async {
    final int pdp = int.tryParse(_pdpController.text) ?? 0;
    final int apc = int.tryParse(_apcController.text) ?? 0;
    final int nnpp = int.tryParse(_nnppController.text) ?? 0;
    final int lp = int.tryParse(_lpController.text) ?? 0;
    final int rejected = int.tryParse(_rejectedController.text) ?? 0;
    final int total = pdp + apc + nnpp + lp + rejected;

    setState(() => _isSubmitting = true);

    try {
      final res = await ApiService.submitResult(
        pollingUnitId: widget.pollingUnitId,
        electionType: _selectedElectionType,
        pdp: pdp,
        apc: apc,
        nnpp: nnpp,
        lp: lp,
        rejected: rejected,
        photoUrl: _photoAttached ? 'uploads/ec8a_${widget.puCode}_${_selectedElectionType.toLowerCase()}.jpg' : null,
      );

      setState(() => _isSubmitting = false);

      if (mounted) {
        final bool isOvervoting = res['is_overvoting'] == true;
        final String status = res['verification_status'] ?? 'SUBMITTED';

        if (isOvervoting) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (ctx) => AlertDialog(
              backgroundColor: const Color(0xFF141E38),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 28),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('Over-Voting Flagged', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              content: Text(
                'Total votes cast ($total) exceeds registered voters (${widget.registeredVoters}). '
                'In accordance with Electoral Act 2022 Section 51, this result has been automatically marked FLAGGED for tribunal investigation.',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              actions: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751)),
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.pop(context);
                  },
                  child: const Text('Acknowledge & Return', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF008751),
              content: Text('Form EC8A Submitted! Status: $status. Total: $total votes (PDP: $pdp)'),
            ),
          );
          Navigator.pop(context);
        }
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Submission failed: $e'),
          ),
        );
      }
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
                  children: [
                    const Icon(Icons.verified, color: Color(0xFF10B981), size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${widget.puName} (${widget.puCode})\nRegistered Voters: ${widget.registeredVoters}',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              const Text('SELECT ELECTION CONTEST / BALLOT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF141E38),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white12),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedElectionType,
                    isExpanded: true,
                    dropdownColor: const Color(0xFF141E38),
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                    items: const [
                      DropdownMenuItem(value: 'GOVERNORSHIP', child: Text('🗳️ Governorship Election')),
                      DropdownMenuItem(value: 'SENATORIAL', child: Text('🏛️ Senatorial Election (Senate)')),
                      DropdownMenuItem(value: 'HOUSE_OF_REPS', child: Text('🏛️ House of Representatives')),
                      DropdownMenuItem(value: 'PRESIDENTIAL', child: Text('🇳🇬 Presidential Election')),
                      DropdownMenuItem(value: 'STATE_ASSEMBLY', child: Text('📜 State House of Assembly')),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedElectionType = val);
                    },
                  ),
                ),
              ),

              const SizedBox(height: 16),

              const Text('PARTY VOTE TALLIES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
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
                  setState(() => _photoAttached = !_photoAttached);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: const Color(0xFF008751),
                      content: Text(_photoAttached ? 'EC8A Photo Sheet Attached!' : 'EC8A Photo Removed'),
                    ),
                  );
                },
                icon: Icon(_photoAttached ? Icons.check_circle : Icons.camera_alt, color: const Color(0xFF10B981)),
                label: Text(
                  _photoAttached ? 'Form EC8A Photo Proof Attached' : 'Attach Form EC8A Photo Proof',
                  style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 12),
                ),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(46),
                  side: BorderSide(color: _photoAttached ? const Color(0xFF10B981) : const Color(0xFF475569)),
                  backgroundColor: _photoAttached ? const Color(0xFF10B981).withOpacity(0.1) : null,
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
