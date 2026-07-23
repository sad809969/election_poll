import 'package:flutter/material.dart';

class IncidentReportScreen extends StatefulWidget {
  final String puCode;
  const IncidentReportScreen({super.key, required this.puCode});

  @override
  State<IncidentReportScreen> createState() => _IncidentReportScreenState();
}

class _IncidentReportScreenState extends State<IncidentReportScreen> {
  String _selectedCategory = 'BVAS Issues';
  String _selectedSeverity = 'MEDIUM';
  final _descriptionController = TextEditingController();
  bool _hasPhoto = false;

  final List<String> _categories = [
    'Violence',
    'Intimidation',
    'BVAS Issues',
    'Vote Buying',
    'Ballot Shortage',
    'Late Arrival of Officials',
    'Others'
  ];

  void _submitIncident() {
    if (_descriptionController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please describe the incident')));
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF008751),
        content: Text('Incident report encrypted & queued with GPS metadata (Lat: 27.02, Lng: 12.34)'),
      ),
    );

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Report Incident — ${widget.puCode}')),
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
                    const Text('Incident Category', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: _selectedCategory,
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                      items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                      onChanged: (val) => setState(() => _selectedCategory = val!),
                    ),

                    const SizedBox(height: 16),
                    const Text('Severity Level', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 6),
                    Row(
                      children: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) {
                        final isSelected = _selectedSeverity == sev;
                        final color = sev == 'CRITICAL' ? Colors.red : sev == 'HIGH' ? Colors.orange : Colors.blue;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2.0),
                            child: ChoiceChip(
                              label: Text(sev, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : Colors.black)),
                              selected: isSelected,
                              selectedColor: color,
                              onSelected: (_) => setState(() => _selectedSeverity = sev),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 16),
                    const Text('Detailed Description', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _descriptionController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Describe what happened at the polling unit...',
                        border: OutlineInputBorder(),
                      ),
                    ),

                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () => setState(() => _hasPhoto = !_hasPhoto),
                      icon: Icon(_hasPhoto ? Icons.check_circle : Icons.camera_alt, color: _hasPhoto ? Colors.green : Colors.grey),
                      label: Text(_hasPhoto ? 'Photo Attached (1 file)' : 'Attach Photo / Short Video'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _submitIncident,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber.shade900,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('SUBMIT INCIDENT REPORT', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
