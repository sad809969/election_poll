import 'package:flutter/material.dart';

class IncidentReportScreen extends StatefulWidget {
  const IncidentReportScreen({super.key});

  @override
  State<IncidentReportScreen> createState() => _IncidentReportScreenState();
}

class _IncidentReportScreenState extends State<IncidentReportScreen> {
  String _category = 'Violence';
  String _severity = 'HIGH';
  final _descController = TextEditingController();
  bool _isSubmitting = false;

  final List<String> _categories = [
    'Violence', 'Intimidation', 'BVAS Issues', 'Vote Buying', 'Ballot Shortage', 'Late Officials', 'Others'
  ];

  void _submitIncident() async {
    if (_descController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an incident description.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(seconds: 1));
    setState(() => _isSubmitting = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Field Incident Report Dispatched to Situation Room!')),
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
        title: const Text('Report Field Incident', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('INCIDENT CATEGORY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.slate400)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _category,
                dropdownColor: const Color(0xFF141E38),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: const Color(0xFF141E38),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
                ),
                items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (val) => setState(() => _category = val!),
              ),

              const SizedBox(height: 16),

              const Text('SEVERITY TRIAGE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.slate400)),
              const SizedBox(height: 6),
              Row(
                children: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) {
                  final bool isSelected = _severity == sev;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2.0),
                      child: ChoiceChip(
                        label: Text(sev, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : Colors.slate400)),
                        selected: isSelected,
                        selectedColor: sev == 'CRITICAL' ? Colors.red : sev == 'HIGH' ? Colors.amber : const Color(0xFF008751),
                        backgroundColor: const Color(0xFF141E38),
                        onSelected: (_) => setState(() => _severity = sev),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),

              const Text('INCIDENT DESCRIPTION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.slate400)),
              const SizedBox(height: 6),
              TextField(
                controller: _descController,
                maxLines: 4,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Describe exact details of the incident occurring at your polling unit...',
                  hintStyle: const TextStyle(color: Colors.slate500, fontSize: 12),
                  filled: true,
                  fillColor: const Color(0xFF141E38),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
                ),
              ),

              const SizedBox(height: 24),

              ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitIncident,
                icon: const Icon(Icons.send),
                label: Text(_isSubmitting ? 'DISPATCHING...' : 'DISPATCH INCIDENT REPORT'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEF4444),
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
}
