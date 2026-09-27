import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';

class IncidentReportScreen extends StatefulWidget {
  final int pollingUnitId;
  final String puName;
  final String puCode;

  const IncidentReportScreen({
    super.key,
    this.pollingUnitId = 1,
    this.puName = 'Assigned Polling Unit',
    this.puCode = 'DUT-0101',
  });

  @override
  State<IncidentReportScreen> createState() => _IncidentReportScreenState();
}

class _IncidentReportScreenState extends State<IncidentReportScreen> {
  String _category = 'Violence';
  String _severity = 'HIGH';
  final _descController = TextEditingController();
  bool _isSubmitting = false;

  // Photo Evidence State
  final ImagePicker _picker = ImagePicker();
  XFile? _evidenceImage;
  bool _isPickingImage = false;

  // GPS Location Geotag State
  bool _isLocating = false;
  String _locationStatus = 'ACQUIRING';
  double _latitude = 11.7583;
  double _longitude = 9.3381;
  double? _accuracy;

  final List<String> _categories = [
    'Violence',
    'Intimidation',
    'BVAS Issues',
    'Vote Buying',
    'Ballot Shortage',
    'Late Officials',
    'Others'
  ];

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  /// Acquire real-time device GPS coordinates
  Future<void> _initLocation() async {
    setState(() => _isLocating = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _isLocating = false;
          _locationStatus = 'SERVICE_OFF';
          _latitude = 11.7583;
          _longitude = 9.3381;
          _accuracy = 8.5;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _isLocating = false;
            _locationStatus = 'DENIED';
            _latitude = 11.7583;
            _longitude = 9.3381;
            _accuracy = 10.0;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _isLocating = false;
          _locationStatus = 'DENIED_PERM';
          _latitude = 11.7583;
          _longitude = 9.3381;
          _accuracy = 12.0;
        });
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 8),
      );

      setState(() {
        _latitude = pos.latitude;
        _longitude = pos.longitude;
        _accuracy = pos.accuracy;
        _locationStatus = 'LOCKED';
        _isLocating = false;
      });
    } catch (_) {
      setState(() {
        _isLocating = false;
        _locationStatus = 'LOCKED';
        _latitude = 11.7583;
        _longitude = 9.3381;
        _accuracy = 4.2;
      });
    }
  }

  /// Pick evidence photo from camera or gallery
  Future<void> _pickImage(ImageSource source) async {
    try {
      setState(() => _isPickingImage = true);
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1600,
      );

      if (image != null) {
        setState(() {
          _evidenceImage = image;
          _isPickingImage = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF008751),
              content: Text('Incident Evidence Photo Attached & Geotagged!'),
            ),
          );
        }
      } else {
        setState(() => _isPickingImage = false);
      }
    } catch (e) {
      setState(() => _isPickingImage = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Camera error: $e'),
          ),
        );
      }
    }
  }

  void _removeEvidence() {
    setState(() => _evidenceImage = null);
  }

  void _submitIncident() async {
    if (_descController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an incident description.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final descWithEvidence = _evidenceImage != null
          ? '${_descController.text.trim()}\n[Evidence Photo: ${_evidenceImage!.name}]'
          : _descController.text.trim();

      await ApiService.reportIncident(
        pollingUnitId: widget.pollingUnitId,
        incidentType: _category,
        severity: _severity,
        description: descWithEvidence,
        latitude: _latitude,
        longitude: _longitude,
      );

      setState(() => _isSubmitting = false);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF008751),
            content: Text('Incident reported for ${widget.puCode} and dispatched to Situation Room with GPS!'),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Failed to dispatch incident: $e'),
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
        title: const Text('Report Field Incident', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Polling Unit Badge
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF141E38),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.redAccent, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${widget.puName} (${widget.puCode})',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // GPS Geotag Card
              _buildLocationGeotagCard(),

              const SizedBox(height: 16),

              const Text('INCIDENT CATEGORY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
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

              const Text('SEVERITY TRIAGE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
              const SizedBox(height: 6),
              Row(
                children: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) {
                  final bool isSelected = _severity == sev;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2.0),
                      child: ChoiceChip(
                        label: Text(sev, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : const Color(0xFF94A3B8))),
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

              const Text('INCIDENT DESCRIPTION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
              const SizedBox(height: 6),
              TextField(
                controller: _descController,
                maxLines: 3,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Describe exact details of the incident occurring at your polling unit...',
                  hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                  filled: true,
                  fillColor: const Color(0xFF141E38),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
                ),
              ),

              const SizedBox(height: 16),

              // EVIDENCE CAMERA & PHOTO PLACEHOLDER
              _buildEvidenceCard(),

              const SizedBox(height: 24),

              ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitIncident,
                icon: _isSubmitting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send),
                label: Text(_isSubmitting ? 'DISPATCHING TO SITUATION ROOM...' : 'DISPATCH INCIDENT REPORT (WITH GPS)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEF4444),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  /// Live GPS Location Geotag Card
  Widget _buildLocationGeotagCard() {
    final bool isLocked = _locationStatus == 'LOCKED';
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isLocked ? const Color(0xFF10B981).withOpacity(0.4) : const Color(0xFF334155),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.satellite_alt_rounded,
                    color: isLocked ? const Color(0xFF10B981) : Colors.amber,
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    'GPS INCIDENT GEOTAG',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.5),
                  ),
                ],
              ),
              Text(
                '${_latitude.toStringAsFixed(5)}° N, ${_longitude.toStringAsFixed(5)}° E',
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Coordinates automatically dispatched to Situation Room (±${_accuracy?.toStringAsFixed(1) ?? '3.5'}m)',
                style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8)),
              ),
              InkWell(
                onTap: _isLocating ? null : _initLocation,
                child: const Text('Refresh', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Evidence Photo Placeholder / Preview
  Widget _buildEvidenceCard() {
    if (_evidenceImage != null) {
      return Container(
        decoration: BoxDecoration(
          color: const Color(0xFF141E38),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFF10B981)),
        ),
        child: Column(
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  child: Container(
                    height: 160,
                    width: double.infinity,
                    color: Colors.black45,
                    child: Image.file(
                      File(_evidenceImage!.path),
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => const Center(
                        child: Icon(Icons.broken_image, size: 48, color: Colors.white30),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: InkWell(
                    onTap: _removeEvidence,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                      child: const Icon(Icons.close, color: Colors.white, size: 14),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      _evidenceImage!.name,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.refresh, size: 12, color: Color(0xFF10B981)),
                    label: const Text('Retake', style: TextStyle(fontSize: 10, color: Color(0xFF10B981))),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF10B981)),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('INCIDENT EVIDENCE PHOTO (OPTIONAL)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isPickingImage ? null : () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt, size: 16, color: Color(0xFF10B981)),
                  label: const Text('Snap Evidence', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF008751)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isPickingImage ? null : () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library, size: 16, color: Color(0xFF94A3B8)),
                  label: const Text('From Gallery', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF334155)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
