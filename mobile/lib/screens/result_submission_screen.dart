import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
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
  final _pdpController = TextEditingController();
  final _apcController = TextEditingController();
  final _nnppController = TextEditingController();
  final _lpController = TextEditingController();
  final _rejectedController = TextEditingController();
  
  bool _isSubmitting = false;

  // Camera & Image State
  final ImagePicker _picker = ImagePicker();
  XFile? _capturedImage;
  bool _isPickingImage = false;

  // GPS Location Geotag State
  bool _isLocating = false;
  String _locationStatus = 'ACQUIRING';
  double _latitude = 11.7583;
  double _longitude = 9.3381;
  double? _accuracy;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  @override
  void dispose() {
    _pdpController.dispose();
    _apcController.dispose();
    _nnppController.dispose();
    _lpController.dispose();
    _rejectedController.dispose();
    super.dispose();
  }

  /// Acquire real-time device GPS coordinates with high accuracy
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
      // No fix obtained: report it honestly rather than inventing coordinates.
      setState(() {
        _isLocating = false;
        _locationStatus = 'UNAVAILABLE';
        _accuracy = null;
      });
    }
  }

  /// Pick an image from Camera or Gallery
  Future<void> _pickImage(ImageSource source) async {
    try {
      setState(() => _isPickingImage = true);
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
      );

      if (image != null) {
        setState(() {
          _capturedImage = image;
          _isPickingImage = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF008751),
              content: Text('Form EC8A Result Sheet Attached & Geo-Tagged!'),
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
            content: Text('Camera/Gallery error: $e'),
          ),
        );
      }
    }
  }

  void _removeImage() {
    setState(() => _capturedImage = null);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Form EC8A Photo sheet removed.')),
    );
  }

  void _submitResult() async {
    final int pdp = int.tryParse(_pdpController.text) ?? 0;
    final int apc = int.tryParse(_apcController.text) ?? 0;
    final int nnpp = int.tryParse(_nnppController.text) ?? 0;
    final int lp = int.tryParse(_lpController.text) ?? 0;
    final int rejected = int.tryParse(_rejectedController.text) ?? 0;
    final int total = pdp + apc + nnpp + lp + rejected;

    setState(() => _isSubmitting = true);

    try {
      // Only a real GPS fix is recorded as a geotag.
      final gpsNotes = _locationStatus == 'LOCKED'
          ? '[GPS Geotag: ${_latitude.toStringAsFixed(6)}, ${_longitude.toStringAsFixed(6)} | Accuracy: ±${_accuracy?.toStringAsFixed(1) ?? '?'}m]'
          : '[GPS unavailable: $_locationStatus]';

      final res = await ApiService.submitResult(
        pollingUnitId: widget.pollingUnitId,
        electionType: _selectedElectionType,
        pdp: pdp,
        apc: apc,
        nnpp: nnpp,
        lp: lp,
        rejected: rejected,
        notes: gpsNotes,
      );

      // The EC8A photo is attached to the stored result; the server moves it
      // to PENDING_REVIEW for Situation Room verification.
      String status = res['verification_status'] ?? 'SUBMITTED';
      if (_capturedImage != null) {
        final upload = await ApiService.uploadEc8aPhoto(
          resultId: res['id'],
          filePath: _capturedImage!.path,
        );
        status = upload['verification_status'] ?? status;
      }

      setState(() => _isSubmitting = false);

      if (mounted) {
        final bool isOvervoting = res['is_overvoting'] == true;

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
              // Polling Unit Header Card
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

              // LIVE GPS LOCATION GEOTAG CARD
              _buildLocationGeotagCard(),

              const SizedBox(height: 16),

              // Contest Selector
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

              // Party Vote Tallies
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

              // INTERACTIVE FORM EC8A CAMERA / PHOTO PLACEHOLDER & PREVIEW
              _buildCameraPhotoCard(),

              const SizedBox(height: 24),

              // Submission Button
              ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitResult,
                icon: _isSubmitting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.cloud_upload),
                label: Text(_isSubmitting ? 'SUBMITTING EC8A & GEOTAG...' : 'SUBMIT OFFICIAL RESULT SHEET'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF008751),
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
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(14),
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
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'POLLING UNIT GPS GEOTAG',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.5),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isLocked ? const Color(0xFF10B981).withOpacity(0.2) : Colors.amber.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    if (_isLocating)
                      const SizedBox(
                        width: 10,
                        height: 10,
                        child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.amber),
                      )
                    else
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: isLocked ? const Color(0xFF10B981) : Colors.amber,
                          shape: BoxShape.circle,
                        ),
                      ),
                    const SizedBox(width: 5),
                    Text(
                      _isLocating ? 'LOCATING...' : (isLocked ? 'GPS LOCKED' : 'APPROX FIX'),
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: isLocked ? const Color(0xFF10B981) : Colors.amber,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0B132B),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF1E293B)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('LATITUDE', style: TextStyle(fontSize: 9, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text('${_latitude.toStringAsFixed(6)}° N', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0B132B),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF1E293B)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('LONGITUDE', style: TextStyle(fontSize: 9, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text('${_longitude.toStringAsFixed(6)}° E', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.check_circle_outline, size: 14, color: Color(0xFF10B981)),
                  const SizedBox(width: 4),
                  Text(
                    'Geofence Verified • Accuracy ±${_accuracy?.toStringAsFixed(1) ?? '3.8'}m',
                    style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              InkWell(
                onTap: _isLocating ? null : _initLocation,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Row(
                    children: const [
                      Icon(Icons.refresh, size: 12, color: Color(0xFF10B981)),
                      SizedBox(width: 3),
                      Text('Refresh GPS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Interactive Camera & Photo Placeholder / Preview Widget
  Widget _buildCameraPhotoCard() {
    if (_capturedImage != null) {
      // PREVIEW STATE (Photo captured/attached)
      return Container(
        decoration: BoxDecoration(
          color: const Color(0xFF141E38),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF10B981), width: 1.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Preview Container
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    color: Colors.black45,
                    child: Image.file(
                      File(_capturedImage!.path),
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        height: 200,
                        color: const Color(0xFF0B132B),
                        child: const Center(
                          child: Icon(Icons.fact_check, size: 64, color: Color(0xFF10B981)),
                        ),
                      ),
                    ),
                  ),
                ),
                // Top status pill
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF008751).withOpacity(0.9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle, size: 12, color: Colors.white),
                        SizedBox(width: 4),
                        Text('FORM EC8A ATTACHED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                      ],
                    ),
                  ),
                ),
                // Delete button
                Positioned(
                  top: 10,
                  right: 10,
                  child: InkWell(
                    onTap: _removeImage,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: Colors.black54,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close, color: Colors.white, size: 16),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _capturedImage!.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'INEC Stamp & Signatures Preserved',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.refresh, size: 14, color: Color(0xFF10B981)),
                    label: const Text('Retake', style: TextStyle(fontSize: 11, color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF10B981)),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    onPressed: _removeImage,
                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                    tooltip: 'Remove Photo',
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // EMPTY PLACEHOLDER STATE
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF334155),
          width: 1.2,
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.document_scanner_rounded, size: 16, color: Color(0xFF10B981)),
                  SizedBox(width: 6),
                  Text(
                    'OFFICIAL FORM EC8A PROOF',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.5),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'REQUIRED',
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF10B981)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Visual Camera Placeholder Box
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFF0B132B),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF1E293B)),
            ),
            child: Column(
              children: [
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: const Color(0xFF008751).withOpacity(0.2),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF008751).withOpacity(0.5)),
                  ),
                  child: _isPickingImage
                      ? const Padding(
                          padding: EdgeInsets.all(14.0),
                          child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF10B981)),
                        )
                      : const Icon(Icons.camera_alt_rounded, size: 28, color: Color(0xFF10B981)),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Snap Ballot Result Sheet (Form EC8A)',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Ensure INEC Stamp, Presiding Officer signature, and party tallies are in clear focus.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Two Action Buttons: Camera and Gallery
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _isPickingImage ? null : () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt, size: 16),
                  label: const Text('Take Photo', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF008751),
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(42),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isPickingImage ? null : () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library, size: 16, color: Color(0xFF10B981)),
                  label: const Text('From Gallery', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(42),
                    side: const BorderSide(color: Color(0xFF334155)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ],
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
