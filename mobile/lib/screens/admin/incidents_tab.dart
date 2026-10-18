import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class IncidentsTab extends StatefulWidget {
  const IncidentsTab({super.key});

  @override
  State<IncidentsTab> createState() => _IncidentsTabState();
}

class _IncidentsTabState extends State<IncidentsTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _incidents = [];
  String? _selectedSeverity;
  String? _selectedStatus;

  @override
  void initState() {
    super.initState();
    _loadIncidents();
  }

  Future<void> _loadIncidents() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final list = await ApiService.getIncidents(
        severity: _selectedSeverity == 'ALL' ? null : _selectedSeverity,
        status: _selectedStatus == 'ALL' ? null : _selectedStatus,
      );
      if (mounted) {
        setState(() {
          _incidents = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _resolveIncident(int incidentId) {
    final notesController = TextEditingController();
    String newStatus = 'RESOLVED';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF141E38),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: const Row(
            children: [
              Icon(Icons.shield_outlined, color: Color(0xFF10B981), size: 22),
              SizedBox(width: 8),
              Text('Triage Incident', style: TextStyle(color: Colors.white, fontSize: 16)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Update Status:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              const SizedBox(height: 6),
              DropdownButton<String>(
                value: newStatus,
                dropdownColor: const Color(0xFF0B132B),
                isExpanded: true,
                items: const [
                  DropdownMenuItem(value: 'INVESTIGATING', child: Text('Investigating', style: TextStyle(color: Colors.amberAccent))),
                  DropdownMenuItem(value: 'RESOLVED', child: Text('Resolved & Secured', style: TextStyle(color: Color(0xFF10B981)))),
                  DropdownMenuItem(value: 'ESCALATED', child: Text('Escalated to Security Forces', style: TextStyle(color: Colors.redAccent))),
                ],
                onChanged: (val) {
                  if (val != null) setDialogState(() => newStatus = val);
                },
              ),
              const SizedBox(height: 12),
              const Text('Resolution / Action Log:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              const SizedBox(height: 6),
              TextField(
                controller: notesController,
                maxLines: 2,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'e.g. Police dispatched, BVAS machine rebooted...',
                  hintStyle: const TextStyle(color: Colors.white30),
                  filled: true,
                  fillColor: const Color(0xFF0B132B),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  await ApiService.updateIncident(
                    incidentId,
                    status: newStatus,
                    resolutionNotes: notesController.text.trim().isNotEmpty ? notesController.text.trim() : null,
                  );
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(backgroundColor: Color(0xFF008751), content: Text('Incident status updated.')),
                    );
                    _loadIncidents();
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(backgroundColor: Colors.redAccent, content: Text('Error: $e')),
                    );
                  }
                }
              },
              child: const Text('Save Triage'),
            ),
          ],
        ),
      ),
    );
  }

  void _viewPhotoProof(String photoUrl) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.black,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              title: const Text('Incident Photo Proof', style: TextStyle(color: Colors.white, fontSize: 14)),
              actions: [
                IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            InteractiveViewer(
              child: Image.network(
                photoUrl.startsWith('http') ? photoUrl : '${ApiService.baseUrl}/uploads/$photoUrl',
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Padding(
                  padding: EdgeInsets.all(40.0),
                  child: Text('Image failed to load', style: TextStyle(color: Colors.white54)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Filter Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF141E38),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white10),
            ),
            child: Wrap(
              spacing: 16,
              runSpacing: 10,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                DropdownButton<String>(
                  value: _selectedSeverity ?? 'ALL',
                  dropdownColor: const Color(0xFF0B132B),
                  underline: const SizedBox(),
                  items: const [
                    DropdownMenuItem(value: 'ALL', child: Text('All Severities', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'CRITICAL', child: Text('Critical Only', style: TextStyle(color: Colors.redAccent))),
                    DropdownMenuItem(value: 'HIGH', child: Text('High Only', style: TextStyle(color: Colors.orangeAccent))),
                    DropdownMenuItem(value: 'MEDIUM', child: Text('Medium Only', style: TextStyle(color: Colors.amberAccent))),
                    DropdownMenuItem(value: 'LOW', child: Text('Low Only', style: TextStyle(color: Color(0xFF3B82F6)))),
                  ],
                  onChanged: (val) {
                    setState(() => _selectedSeverity = val);
                    _loadIncidents();
                  },
                ),
                DropdownButton<String>(
                  value: _selectedStatus ?? 'ALL',
                  dropdownColor: const Color(0xFF0B132B),
                  underline: const SizedBox(),
                  items: const [
                    DropdownMenuItem(value: 'ALL', child: Text('All Statuses', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'OPEN', child: Text('Open / Pending', style: TextStyle(color: Colors.amberAccent))),
                    DropdownMenuItem(value: 'INVESTIGATING', child: Text('Investigating', style: TextStyle(color: Color(0xFF3B82F6)))),
                    DropdownMenuItem(value: 'RESOLVED', child: Text('Resolved', style: TextStyle(color: Color(0xFF10B981)))),
                  ],
                  onChanged: (val) {
                    setState(() => _selectedStatus = val);
                    _loadIncidents();
                  },
                ),
                IconButton(
                  onPressed: _loadIncidents,
                  icon: const Icon(Icons.refresh, color: Color(0xFF10B981)),
                  tooltip: 'Refresh Incidents',
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Incident List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF008751)))
                : _error != null
                    ? Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.redAccent)))
                    : _incidents.isEmpty
                        ? const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle_outline, color: Color(0xFF10B981), size: 48),
                                SizedBox(height: 12),
                                Text('No active incidents reported.', style: TextStyle(color: Colors.white70)),
                              ],
                            ),
                          )
                        : ListView.separated(
                            itemCount: _incidents.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final inc = _incidents[index];
                              return _buildIncidentCard(inc);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildIncidentCard(Map<String, dynamic> inc) {
    final sev = (inc['severity'] ?? 'MEDIUM').toString().toUpperCase();
    final status = (inc['status'] ?? 'OPEN').toString().toUpperCase();
    final isCritical = sev == 'CRITICAL' || sev == 'HIGH';
    final sevColor = isCritical ? const Color(0xFFEF4444) : Colors.amberAccent;
    final photoUrl = inc['media_url'] ?? inc['photo_url'];
    final lat = inc['latitude'];
    final lng = inc['longitude'];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: sevColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: sevColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: sevColor, width: 0.8),
                    ),
                    child: Text(sev, style: TextStyle(color: sevColor, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    inc['incident_type'] ?? 'Electoral Incident',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: status == 'RESOLVED' ? const Color(0xFF10B981).withOpacity(0.15) : Colors.amberAccent.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: status == 'RESOLVED' ? const Color(0xFF10B981) : Colors.amberAccent,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            inc['description'] ?? 'No detailed narrative provided.',
            style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  if (lat != null && lng != null) ...[
                    const Icon(Icons.pin_drop, size: 14, color: Color(0xFF3B82F6)),
                    const SizedBox(width: 4),
                    Text('$lat, $lng', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                    const SizedBox(width: 12),
                  ],
                  if (photoUrl != null && photoUrl.toString().isNotEmpty)
                    TextButton.icon(
                      onPressed: () => _viewPhotoProof(photoUrl),
                      icon: const Icon(Icons.image, size: 14, color: Color(0xFF3B82F6)),
                      label: const Text('View Evidence Photo', style: TextStyle(color: Color(0xFF3B82F6), fontSize: 11)),
                    ),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0B132B),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                ),
                onPressed: () => _resolveIncident(inc['id']),
                icon: const Icon(Icons.edit_note, size: 14),
                label: const Text('Triage', style: TextStyle(fontSize: 11)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
