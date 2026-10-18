import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

class SideASystemAdminTab extends StatefulWidget {
  const SideASystemAdminTab({super.key});

  @override
  State<SideASystemAdminTab> createState() => _SideASystemAdminTabState();
}

class _SideASystemAdminTabState extends State<SideASystemAdminTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  // ignore: unused_field
  String? _error;
  Timer? _periodicRefreshTimer;

  Map<String, dynamic> _adminStats = {};
  List<dynamic> _lgas = [];
  List<dynamic> _wards = [];
  List<dynamic> _parties = [];
  List<dynamic> _users = [];
  List<dynamic> _pollingUnits = [];
  bool _isSeeding = false;

  // Setup sub-section: 'pu' | 'ward' | 'lga' | 'party'
  String _setupEntity = 'pu';

  // Filters
  int? _selectedLgaFilter;
  int? _selectedWardFilter;
  final TextEditingController _puSearchController = TextEditingController();

  final _numberFormat = NumberFormat('#,###');

  // Master catalog of all system pages
  static const List<Map<String, String>> systemPages = [
    {'path': '/', 'label': 'Situation Room Overview', 'desc': 'Central dashboard and KPIs'},
    {'path': '/map', 'label': 'Interactive Geospatial Map', 'desc': '27 LGA vector surveillance'},
    {'path': '/results', 'label': 'Results & EC8A Inspection', 'desc': 'Form EC8A approvals and proofs'},
    {'path': '/collation', 'label': 'LGA Collation Center', 'desc': 'State and LGA vote returns'},
    {'path': '/incidents', 'label': 'Incident Command', 'desc': 'Incident triage and security dispatch'},
    {'path': '/polling-units', 'label': 'Polling Units Directory', 'desc': 'Polling unit database'},
    {'path': '/agents', 'label': 'Agents & Staff Roster', 'desc': 'Field personnel and assignments'},
    {'path': '/broadcast', 'label': 'Broadcast Dispatch', 'desc': 'Situation room broadcast alerts'},
    {'path': '/audit-logs', 'label': 'Security Audit Trail', 'desc': 'Immutable event logs'},
    {'path': '/system-admin', 'label': 'Side A: Master System Admin', 'desc': 'Core electoral setup and governance'},
    {'path': '/settings', 'label': 'Server & Telemetry Settings', 'desc': 'Endpoint switcher and diagnostics'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadSideAData();
    _periodicRefreshTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (mounted) {
        _loadSideAData(silent: true);
      }
    });
  }

  @override
  void dispose() {
    _periodicRefreshTimer?.cancel();
    _tabController.dispose();
    _puSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadSideAData({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final stats = await ApiService.getAdminStats();
      final lgas = await ApiService.getLgas();
      final wards = await ApiService.getWards(lgaId: _selectedLgaFilter);
      final parties = await ApiService.getParties();
      final users = await ApiService.getPermissions();
      final pus = await ApiService.getPollingUnits(
        lgaId: _selectedLgaFilter,
        wardId: _selectedWardFilter,
        search: _puSearchController.text.trim().isNotEmpty ? _puSearchController.text.trim() : null,
      );

      if (mounted) {
        setState(() {
          _adminStats = stats;
          _lgas = lgas;
          _wards = wards;
          _parties = parties;
          _users = users;
          _pollingUnits = pus;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted && !silent) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _triggerSeedPollingUnits() async {
    setState(() => _isSeeding = true);
    try {
      final res = await ApiService.seedPollingUnits();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF008751),
            content: Text(res['message'] ?? 'Successfully verified official INEC reference data.'),
          ),
        );
        _loadSideAData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.redAccent, content: Text('Seeding notice: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSeeding = false);
    }
  }

  // =========================================================================
  // MODAL DIALOGS FOR CRUD
  // =========================================================================

  // 1. Polling Unit Add/Edit Dialog
  void _showPollingUnitDialog({Map<String, dynamic>? pu}) {
    final codeCtrl = TextEditingController(text: pu?['code'] ?? '');
    final nameCtrl = TextEditingController(text: pu?['name'] ?? '');
    final votersCtrl = TextEditingController(text: (pu?['registered_voters'] ?? 750).toString());
    int selectedLgaId = pu?['lga_id'] ?? (_lgas.isNotEmpty ? _lgas.first['id'] : 1);
    int selectedWardId = pu?['ward_id'] ?? (_wards.isNotEmpty ? _wards.first['id'] : 1);

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlg) => AlertDialog(
          backgroundColor: const Color(0xFF141E38),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: Text(pu == null ? 'Create Polling Unit' : 'Edit Polling Unit', style: const TextStyle(color: Colors.white, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildInput('PU Code (e.g. 18-01-01-001)', codeCtrl),
                const SizedBox(height: 10),
                _buildInput('Polling Unit Name', nameCtrl),
                const SizedBox(height: 10),
                _buildInput('Registered Voters Quota', votersCtrl, isNum: true),
                const SizedBox(height: 10),
                DropdownButtonFormField<int>(
                  value: selectedLgaId,
                  dropdownColor: const Color(0xFF0B132B),
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: _inputDeco('Assigned LGA'),
                  items: _lgas.map<DropdownMenuItem<int>>((l) => DropdownMenuItem<int>(value: l['id'], child: Text(l['name']))).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setDlg(() => selectedLgaId = val);
                    }
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
              onPressed: () async {
                Navigator.pop(ctx);
                final data = {
                  'code': codeCtrl.text.trim(),
                  'name': nameCtrl.text.trim(),
                  'registered_voters': int.tryParse(votersCtrl.text.trim()) ?? 750,
                  'lga_id': selectedLgaId,
                  'ward_id': selectedWardId,
                };
                try {
                  if (pu == null) {
                    await ApiService.createPollingUnit(data);
                  } else {
                    await ApiService.updatePollingUnit(pu['id'], data);
                  }
                  _loadSideAData();
                } catch (e) {
                  _showSnack('Error: $e', isError: true);
                }
              },
              child: Text(pu == null ? 'Save PU' : 'Update PU'),
            ),
          ],
        ),
      ),
    );
  }

  // 2. Ward Add/Edit Dialog
  void _showWardDialog({Map<String, dynamic>? ward}) {
    final nameCtrl = TextEditingController(text: ward?['name'] ?? '');
    final codeCtrl = TextEditingController(text: ward?['code'] ?? '');
    int selectedLgaId = ward?['lga_id'] ?? (_lgas.isNotEmpty ? _lgas.first['id'] : 1);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141E38),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Text(ward == null ? 'Create Ward' : 'Edit Ward', style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildInput('Ward Name (e.g. Dutse Central)', nameCtrl),
            const SizedBox(height: 10),
            _buildInput('Ward Code (Optional)', codeCtrl),
            const SizedBox(height: 10),
            DropdownButtonFormField<int>(
              value: selectedLgaId,
              dropdownColor: const Color(0xFF0B132B),
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: _inputDeco('LGA'),
              items: _lgas.map<DropdownMenuItem<int>>((l) => DropdownMenuItem<int>(value: l['id'], child: Text(l['name']))).toList(),
              onChanged: (val) {
                if (val != null) selectedLgaId = val;
              },
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              final data = {
                'name': nameCtrl.text.trim(),
                if (codeCtrl.text.trim().isNotEmpty) 'code': codeCtrl.text.trim(),
                'lga_id': selectedLgaId,
              };
              try {
                if (ward == null) {
                  await ApiService.createWard(data);
                } else {
                  await ApiService.updateWard(ward['id'], data);
                }
                _loadSideAData();
              } catch (e) {
                _showSnack('Error: $e', isError: true);
              }
            },
            child: Text(ward == null ? 'Create Ward' : 'Update Ward'),
          ),
        ],
      ),
    );
  }

  // 3. LGA Add/Edit Dialog
  void _showLgaDialog({Map<String, dynamic>? lga}) {
    final nameCtrl = TextEditingController(text: lga?['name'] ?? '');
    final codeCtrl = TextEditingController(text: lga?['code'] ?? '');
    final votersCtrl = TextEditingController(text: (lga?['registered_voters'] ?? 85000).toString());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141E38),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Text(lga == null ? 'Create LGA' : 'Edit LGA', style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildInput('LGA Name (e.g. Dutse)', nameCtrl),
            const SizedBox(height: 10),
            _buildInput('LGA Code (e.g. DT)', codeCtrl),
            const SizedBox(height: 10),
            _buildInput('Estimated Registered Voters', votersCtrl, isNum: true),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              final data = {
                'name': nameCtrl.text.trim(),
                'code': codeCtrl.text.trim().toUpperCase(),
                'registered_voters': int.tryParse(votersCtrl.text.trim()) ?? 0,
              };
              try {
                if (lga == null) {
                  await ApiService.createLga(data);
                } else {
                  await ApiService.updateLga(lga['id'], data);
                }
                _loadSideAData();
              } catch (e) {
                _showSnack('Error: $e', isError: true);
              }
            },
            child: Text(lga == null ? 'Create LGA' : 'Update LGA'),
          ),
        ],
      ),
    );
  }

  // 4. Political Party Add/Edit Dialog
  void _showPartyDialog({Map<String, dynamic>? party}) {
    final nameCtrl = TextEditingController(text: party?['name'] ?? '');
    final abbrevCtrl = TextEditingController(text: party?['abbreviation'] ?? '');
    final colorCtrl = TextEditingController(text: party?['color'] ?? '#008751');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141E38),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Text(party == null ? 'Register Political Party' : 'Edit Party', style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildInput('Party Abbreviation (e.g. PDP)', abbrevCtrl),
            const SizedBox(height: 10),
            _buildInput('Full Official Name', nameCtrl),
            const SizedBox(height: 10),
            _buildInput('Brand Color Hex (e.g. #008751)', colorCtrl),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              final data = {
                'name': nameCtrl.text.trim(),
                'abbreviation': abbrevCtrl.text.trim().toUpperCase(),
                'color': colorCtrl.text.trim(),
                'is_active': true,
              };
              try {
                if (party == null) {
                  await ApiService.createParty(data);
                } else {
                  await ApiService.updateParty(party['id'], data);
                }
                _loadSideAData();
              } catch (e) {
                _showSnack('Error: $e', isError: true);
              }
            },
            child: const Text('Save Party'),
          ),
        ],
      ),
    );
  }

  // 5. User Add/Edit Dialog
  void _showUserDialog({Map<String, dynamic>? user}) {
    final nameCtrl = TextEditingController(text: user?['full_name'] ?? '');
    final usernameCtrl = TextEditingController(text: user?['username'] ?? '');
    final phoneCtrl = TextEditingController(text: user?['phone_number'] ?? '');
    final passCtrl = TextEditingController();
    String selectedRole = user?['role'] ?? 'Polling Unit Agent';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlg) => AlertDialog(
          backgroundColor: const Color(0xFF141E38),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: Text(user == null ? 'Create Administrative User' : 'Edit User', style: const TextStyle(color: Colors.white, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildInput('Full Legal Name', nameCtrl),
                const SizedBox(height: 10),
                _buildInput('Username', usernameCtrl),
                const SizedBox(height: 10),
                _buildInput('Phone Number', phoneCtrl),
                const SizedBox(height: 10),
                if (user == null) ...[
                  _buildInput('Initial Password', passCtrl, obscureText: true),
                  const SizedBox(height: 10),
                ],
                DropdownButtonFormField<String>(
                  value: selectedRole,
                  dropdownColor: const Color(0xFF0B132B),
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: _inputDeco('Assigned Role'),
                  items: const [
                    // --- Administration ---
                    DropdownMenuItem(value: 'Super Admin', child: Text('🛡️ Super Admin')),
                    DropdownMenuItem(value: 'State Director', child: Text('🎖️ State Director (Overall)')),
                    DropdownMenuItem(value: 'Situation Room Officer', child: Text('📡 Situation Room Officer')),
                    // --- Governorship ---
                    DropdownMenuItem(value: 'Governorship Agent', child: Text('🏛️ Governorship Campaign Agent')),
                    DropdownMenuItem(value: 'Deputy Governorship Agent', child: Text('🏛️ Deputy Governorship Agent')),
                    // --- National ---
                    DropdownMenuItem(value: 'Senatorial Agent', child: Text('🎖️ Senatorial Agent (Senate)')),
                    DropdownMenuItem(value: 'House of Reps Agent', child: Text('🏢 House of Reps Agent')),
                    DropdownMenuItem(value: 'Presidential Agent', child: Text('🇳🇬 Presidential Campaign Agent')),
                    // --- State ---
                    DropdownMenuItem(value: 'State Assembly Agent', child: Text('📜 State Assembly Agent')),
                    DropdownMenuItem(value: 'State Coordinator', child: Text('📋 State Coordinator')),
                    // --- Ground Level ---
                    DropdownMenuItem(value: 'LGA Coordinator', child: Text('🗺️ LGA Coordinator')),
                    DropdownMenuItem(value: 'Ward Coordinator', child: Text('🏘️ Ward Coordinator')),
                    DropdownMenuItem(value: 'Polling Unit Agent', child: Text('🗳️ Polling Unit Agent (PUA)')),
                    // --- Support ---
                    DropdownMenuItem(value: 'Legal Observer', child: Text('⚖️ Legal/Paralegal Observer')),
                    DropdownMenuItem(value: 'Observer', child: Text('👁️ General Observer')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDlg(() => selectedRole = val);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
              onPressed: () async {
                Navigator.pop(ctx);
                final data = {
                  'full_name': nameCtrl.text.trim(),
                  'username': usernameCtrl.text.trim(),
                  'phone_number': phoneCtrl.text.trim(),
                  'role': selectedRole,
                  if (passCtrl.text.trim().isNotEmpty) 'password': passCtrl.text.trim(),
                };
                try {
                  if (user == null) {
                    await ApiService.createAgent(data);
                  } else {
                    await ApiService.updateUser(user['id'], data);
                  }
                  _loadSideAData();
                } catch (e) {
                  _showSnack('Error: $e', isError: true);
                }
              },
              child: Text(user == null ? 'Create User' : 'Save Changes'),
            ),
          ],
        ),
      ),
    );
  }

  // 6. User Permissions / Allowed Pages Matrix Dialog ("he'll allow the page they'll see")
  void _showPermissionsDialog(Map<String, dynamic> user) {
    final userId = user['id'];
    final username = user['username'] ?? 'User';
    final role = user['role'] ?? 'Agent';

    List<dynamic> currentPages = user['allowed_pages'] ?? [];
    List<String> selectedPages = currentPages.map((p) => p.toString()).toList();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlg) => AlertDialog(
          backgroundColor: const Color(0xFF141E38),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: Row(
            children: [
              const Icon(Icons.security, color: Color(0xFFF59E0B), size: 22),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Allowed Pages: $username ($role)', style: const TextStyle(color: Colors.white, fontSize: 14)),
              ),
            ],
          ),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Select which modules and views this user is authorized to access:',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  ...systemPages.map((page) {
                    final path = page['path']!;
                    final isChecked = selectedPages.contains(path);

                    return Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      decoration: BoxDecoration(
                        color: isChecked ? const Color(0xFF008751).withValues(alpha: 0.15) : const Color(0xFF0B132B),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isChecked ? const Color(0xFF10B981).withValues(alpha: 0.4) : Colors.white10,
                        ),
                      ),
                      child: CheckboxListTile(
                        value: isChecked,
                        activeColor: const Color(0xFF10B981),
                        title: Text(page['label']!, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: Text('${page['desc']} ($path)', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                        onChanged: (val) {
                          setDlg(() {
                            if (val == true) {
                              if (!selectedPages.contains(path)) selectedPages.add(path);
                            } else {
                              selectedPages.remove(path);
                            }
                          });
                        },
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                setDlg(() {
                  selectedPages = systemPages.map((p) => p['path']!).toList();
                });
              },
              child: const Text('Allow All', style: TextStyle(color: Color(0xFF10B981), fontSize: 11)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  await ApiService.updateUserPermissions(userId, selectedPages);
                  _showSnack('Permissions successfully updated for $username.');
                  _loadSideAData();
                } catch (e) {
                  _showSnack('Error updating permissions: $e', isError: true);
                }
              },
              child: const Text('Save Permissions'),
            ),
          ],
        ),
      ),
    );
  }

  void _showSnack(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: isError ? Colors.redAccent : const Color(0xFF008751),
        content: Text(msg),
      ),
    );
  }

  Widget _buildInput(String hint, TextEditingController ctrl, {bool isNum = false, bool obscureText = false}) {
    return TextField(
      controller: ctrl,
      keyboardType: isNum ? TextInputType.number : TextInputType.text,
      obscureText: obscureText,
      style: const TextStyle(color: Colors.white, fontSize: 13),
      decoration: _inputDeco(hint),
    );
  }

  InputDecoration _inputDeco(String hint) {
    return InputDecoration(
      labelText: hint,
      labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
      filled: true,
      fillColor: const Color(0xFF0B132B),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
    );
  }

  // =========================================================================
  // TAB BUILDERS
  // =========================================================================

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner Header
          _buildSideABanner(),
          const SizedBox(height: 16),

          // Subtabs Navigation
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF141E38),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white10),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorColor: const Color(0xFFF59E0B),
              labelColor: const Color(0xFFF59E0B),
              unselectedLabelColor: const Color(0xFF94A3B8),
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              tabs: const [
                Tab(icon: Icon(Icons.dashboard_customize, size: 16), text: 'Master Telemetry'),
                Tab(icon: Icon(Icons.account_tree_outlined, size: 16), text: 'Electoral Setup'),
                Tab(icon: Icon(Icons.admin_panel_settings, size: 16), text: 'Users & Permissions'),
                Tab(icon: Icon(Icons.download_for_offline_outlined, size: 16), text: 'Data Vault & Exports'),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Tab Body
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFF59E0B)))
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildMasterTelemetryTab(),
                      _buildElectoralSetupTab(),
                      _buildUserPermissionsTab(),
                      _buildDataVaultTab(),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSideABanner() {
    final driver = _adminStats['database_driver'] ?? 'PostgreSQL / SQLite';
    final sysStatus = _adminStats['system_status'] ?? 'ONLINE';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF854D0E), Color(0xFF451A03), Color(0xFF0F172A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF59E0B).withValues(alpha: 0.2),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFF59E0B), width: 1.2),
            ),
            child: const Icon(Icons.shield_moon, color: Color(0xFFF59E0B), size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Text(
                      'SIDE A: SYSTEM ADMIN CONTROL PANEL',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 0.5),
                    ),
                    SizedBox(width: 8),
                    _SideABadge(),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Core Electoral Engine • Governance & Database Vault | Engine: $driver • Status: $sysStatus',
                  style: const TextStyle(color: Color(0xFFFDE68A), fontSize: 11),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _loadSideAData,
            icon: const Icon(Icons.refresh, color: Colors.white),
            tooltip: 'Sync Side A Telemetry',
          ),
        ],
      ),
    );
  }

  Widget _buildMasterTelemetryTab() {
    final isWide = MediaQuery.of(context).size.width > 900;
    final totalLgas = _adminStats['lgas_count'] ?? _lgas.length;
    final totalWards = _adminStats['wards_count'] ?? 287;
    final totalPUs = _adminStats['polling_units_count'] ?? 4827;
    final totalVoters = _adminStats['registered_voters'] ?? 2342500;
    final totalParties = _adminStats['parties_count'] ?? _parties.length;
    final totalUsers = _adminStats['users_count'] ?? _users.length;

    return ListView(
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _buildStatCard('TOTAL LGAs', '$totalLgas', '27 Jigawa Councils', Icons.location_city, const Color(0xFF3B82F6), isWide),
            _buildStatCard('TOTAL WARDS', '$totalWards', '287 Electoral Wards', Icons.layers, const Color(0xFF8B5CF6), isWide),
            _buildStatCard('POLLING UNITS', _numberFormat.format(totalPUs), '4,827 Verified PUs', Icons.how_to_vote, const Color(0xFF10B981), isWide),
            _buildStatCard('REGISTERED VOTERS', _numberFormat.format(totalVoters), 'Official INEC Quota', Icons.people_alt, const Color(0xFFF59E0B), isWide),
            _buildStatCard('POLITICAL PARTIES', '$totalParties', 'Registered Contenders', Icons.flag, const Color(0xFFEC4899), isWide),
            _buildStatCard('USERS / AGENTS', '$totalUsers', 'Staff Across 9 Roles', Icons.badge, const Color(0xFF06B6D4), isWide),
          ],
        ),
        const SizedBox(height: 20),

        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF141E38),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.inventory_2_outlined, color: Color(0xFFF59E0B), size: 20),
                        SizedBox(width: 8),
                        Text('INEC ELECTORAL REFERENCE SEED ENGINE', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Ensures all 27 LGAs, 287 Wards, and 4,827 Polling Units are populated into the database with exact registered voter counts.',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF59E0B),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                onPressed: _isSeeding ? null : _triggerSeedPollingUnits,
                icon: _isSeeding ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black)) : const Icon(Icons.bolt, size: 16),
                label: const Text('Seed / Sync Polling Units', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String val, String sub, IconData icon, Color color, bool isWide) {
    return Container(
      width: isWide ? 260 : double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
              Icon(icon, color: color, size: 18),
            ],
          ),
          const SizedBox(height: 8),
          Text(val, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(sub, style: TextStyle(color: color, fontSize: 11)),
        ],
      ),
    );
  }

  // Electoral Master Setup Tab (Sub-navigation for PU, Ward, LGA, Party)
  Widget _buildElectoralSetupTab() {
    return Column(
      children: [
        // Sub-selector Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFF141E38),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Wrap(
                spacing: 8,
                children: [
                  _buildSubTabButton('pu', 'Polling Units (${_pollingUnits.length})', Icons.how_to_vote),
                  _buildSubTabButton('ward', 'Wards (${_wards.length})', Icons.layers),
                  _buildSubTabButton('lga', 'LGAs (${_lgas.length})', Icons.location_city),
                  _buildSubTabButton('party', 'Parties (${_parties.length})', Icons.flag),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
                onPressed: () {
                  if (_setupEntity == 'pu') _showPollingUnitDialog();
                  if (_setupEntity == 'ward') _showWardDialog();
                  if (_setupEntity == 'lga') _showLgaDialog();
                  if (_setupEntity == 'party') _showPartyDialog();
                },
                icon: const Icon(Icons.add, size: 16),
                label: Text('Add ${_setupEntity.toUpperCase()}'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // List View based on active entity
        Expanded(
          child: _setupEntity == 'pu'
              ? _buildPollingUnitsManager()
              : _setupEntity == 'ward'
                  ? _buildWardsManager()
                  : _setupEntity == 'lga'
                      ? _buildLgasManager()
                      : _buildPartiesManager(),
        ),
      ],
    );
  }

  Widget _buildSubTabButton(String id, String label, IconData icon) {
    final isSel = _setupEntity == id;
    return InkWell(
      onTap: () => setState(() => _setupEntity = id),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSel ? const Color(0xFFF59E0B) : const Color(0xFF0B132B),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: isSel ? Colors.black : Colors.white70),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: isSel ? Colors.black : Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  // 1. Polling Units Manager
  Widget _buildPollingUnitsManager() {
    return Column(
      children: [
        // Filter & Search Controls Header
        Container(
          margin: const EdgeInsets.only(bottom: 10),
          child: Row(
            children: [
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 38,
                  child: TextField(
                    controller: _puSearchController,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: InputDecoration(
                      hintText: 'Search PU by code (e.g. 18-01) or name...',
                      hintStyle: const TextStyle(color: Colors.white38, fontSize: 11),
                      prefixIcon: const Icon(Icons.search, color: Colors.white54, size: 16),
                      suffixIcon: _puSearchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 14, color: Colors.white54),
                              onPressed: () {
                                _puSearchController.clear();
                                _loadSideAData();
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: const Color(0xFF141E38),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                    ),
                    onSubmitted: (_) => _loadSideAData(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // LGA Filter Dropdown
              Container(
                height: 38,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF141E38),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButton<int?>(
                  value: _selectedLgaFilter,
                  dropdownColor: const Color(0xFF0B132B),
                  underline: const SizedBox(),
                  hint: const Text('All LGAs', style: TextStyle(color: Colors.white70, fontSize: 11)),
                  style: const TextStyle(color: Colors.white, fontSize: 11),
                  items: [
                    const DropdownMenuItem<int?>(value: null, child: Text('All 27 LGAs')),
                    ..._lgas.map<DropdownMenuItem<int?>>((l) => DropdownMenuItem<int?>(value: l['id'], child: Text(l['name']))),
                  ],
                  onChanged: (val) {
                    setState(() {
                      _selectedLgaFilter = val;
                      _selectedWardFilter = null;
                    });
                    _loadSideAData();
                  },
                ),
              ),
              const SizedBox(width: 6),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF141E38),
                  foregroundColor: const Color(0xFFF59E0B),
                  side: const BorderSide(color: Color(0xFFF59E0B), width: 0.8),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
                onPressed: () => _loadSideAData(),
                icon: const Icon(Icons.search, size: 13),
                label: const Text('Search', style: TextStyle(fontSize: 11)),
              ),
            ],
          ),
        ),

        // Results List
        Expanded(
          child: _pollingUnits.isEmpty
              ? const Center(
                  child: Text(
                    'No polling units match current filter.',
                    style: TextStyle(color: Colors.white54, fontSize: 13),
                  ),
                )
              : ListView.separated(
                  itemCount: _pollingUnits.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, idx) {
                    final pu = _pollingUnits[idx];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF141E38),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.white10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(pu['code'] ?? 'PU', style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 10, fontWeight: FontWeight.bold)),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(pu['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'LGA: ${pu['lga_name']} • Ward: ${pu['ward_name']} • Voters: ${_numberFormat.format(pu['registered_voters'] ?? 750)}',
                                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.edit, size: 16, color: Colors.white70),
                                onPressed: () => _showPollingUnitDialog(pu: pu),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                                onPressed: () async {
                                  try {
                                    await ApiService.deletePollingUnit(pu['id']);
                                    _loadSideAData();
                                  } catch (e) {
                                    _showSnack('Error: $e', isError: true);
                                  }
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // 2. Wards Manager
  Widget _buildWardsManager() {
    return ListView.separated(
      itemCount: _wards.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, idx) {
        final w = _wards[idx];
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: const Color(0xFF141E38), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white10)),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(w['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 2),
                  Text('Code: ${w['code'] ?? 'W'} • LGA: ${w['lga_name'] ?? ''}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                ],
              ),
              Row(
                children: [
                  IconButton(icon: const Icon(Icons.edit, size: 16, color: Colors.white70), onPressed: () => _showWardDialog(ward: w)),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                    onPressed: () async {
                      try {
                        await ApiService.deleteWard(w['id']);
                        _loadSideAData();
                      } catch (e) {
                        _showSnack('Error: $e', isError: true);
                      }
                    },
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // 3. LGAs Manager
  Widget _buildLgasManager() {
    return ListView.separated(
      itemCount: _lgas.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, idx) {
        final l = _lgas[idx];
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: const Color(0xFF141E38), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white10)),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 2),
                  Text('Code: ${l['code'] ?? 'LGA'} • Wards: ${l['wards_count'] ?? 11} • PUs: ${l['polling_unit_count'] ?? 178}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                ],
              ),
              Row(
                children: [
                  IconButton(icon: const Icon(Icons.edit, size: 16, color: Colors.white70), onPressed: () => _showLgaDialog(lga: l)),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                    onPressed: () async {
                      try {
                        await ApiService.deleteLga(l['id']);
                        _loadSideAData();
                      } catch (e) {
                        _showSnack('Error: $e', isError: true);
                      }
                    },
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // 4. Parties Manager
  Widget _buildPartiesManager() {
    return ListView.separated(
      itemCount: _parties.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, idx) {
        final p = _parties[idx];
        final colStr = p['color'] ?? '#008751';
        Color color = const Color(0xFF008751);
        try {
          color = Color(int.parse(colStr.replaceFirst('#', '0xFF')));
        } catch (_) {}

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: const Color(0xFF141E38), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white10)),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(width: 14, height: 14, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                  const SizedBox(width: 10),
                  Text(p['abbreviation'] ?? '', style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(width: 8),
                  Text('(${p['name'] ?? ''})', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
              Row(
                children: [
                  IconButton(icon: const Icon(Icons.edit, size: 16, color: Colors.white70), onPressed: () => _showPartyDialog(party: p)),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                    onPressed: () async {
                      try {
                        await ApiService.deleteParty(p['id']);
                        _loadSideAData();
                      } catch (e) {
                        _showSnack('Error: $e', isError: true);
                      }
                    },
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // Users & Permissions Matrix Tab
  Widget _buildUserPermissionsTab() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'USER ACCESS ROSTER & ALLOWED PAGES MATRIX',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
              onPressed: () => _showUserDialog(),
              icon: const Icon(Icons.person_add, size: 14),
              label: const Text('Add User'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: ListView.separated(
            itemCount: _users.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, idx) {
              final u = _users[idx];
              final name = u['full_name'] ?? u['username'] ?? 'User';
              final role = u['role'] ?? 'Agent';
              final pages = (u['allowed_pages'] as List? ?? []).map((p) => p.toString()).toList();
              final isSuper = role.toString().toLowerCase().contains('super');

              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF141E38),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: isSuper ? const Color(0xFFF59E0B).withValues(alpha: 0.3) : Colors.white10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: isSuper ? const Color(0xFFF59E0B).withValues(alpha: 0.15) : const Color(0xFF3B82F6).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  role,
                                  style: TextStyle(
                                    color: isSuper ? const Color(0xFFF59E0B) : const Color(0xFF3B82F6),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('Username: ${u['username']} • Phone: ${u['phone_number'] ?? 'N/A'}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 4,
                            runSpacing: 4,
                            children: pages.isEmpty
                                ? [
                                    const Text('Default role views', style: TextStyle(color: Colors.white38, fontSize: 10)),
                                  ]
                                : pages.map((p) => Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF0B132B),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(p, style: const TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.w600)),
                                    )).toList(),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      children: [
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0B132B),
                            foregroundColor: const Color(0xFFF59E0B),
                            side: const BorderSide(color: Color(0xFFF59E0B), width: 0.8),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          ),
                          onPressed: () => _showPermissionsDialog(u),
                          icon: const Icon(Icons.rule, size: 14),
                          label: const Text('Allowed Pages', style: TextStyle(fontSize: 11)),
                        ),
                        const SizedBox(width: 6),
                        IconButton(
                          tooltip: 'Edit User Profile',
                          icon: const Icon(Icons.edit, size: 16, color: Colors.white70),
                          onPressed: () => _showUserDialog(user: u),
                        ),
                        IconButton(
                          tooltip: 'Delete User Account',
                          icon: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                          onPressed: () => _showDeleteUserConfirmation(u),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showDeleteUserConfirmation(Map<String, dynamic> user) {
    final name = user['full_name'] ?? user['username'] ?? 'User';
    final username = user['username'] ?? '';
    final role = user['role'] ?? 'Agent';
    final id = user['id'];

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141E38),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: Colors.redAccent.withValues(alpha: 0.2), shape: BoxShape.circle),
              child: const Icon(Icons.delete_forever, color: Colors.redAccent, size: 22),
            ),
            const SizedBox(width: 10),
            const Text('Delete User Account', style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Are you sure you want to delete this user from the system?',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0B132B),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Name: $name', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text('Username: @$username • Role: $role', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                  const SizedBox(height: 4),
                  Text('User ID: #$id', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                ],
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'This action immediately deletes the user and revokes platform login access.',
              style: TextStyle(color: Colors.redAccent, fontSize: 11),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
            icon: const Icon(Icons.delete_outline, size: 16),
            label: const Text('Confirm Delete'),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ApiService.deleteUser(id);
                _showSnack('User $name deleted successfully.');
                _loadSideAData();
              } catch (e) {
                _showSnack('Delete failed: $e', isError: true);
              }
            },
          ),
        ],
      ),
    );
  }

  // Data Vault Tab
  Widget _buildDataVaultTab() {
    return ListView(
      children: [
        _buildVaultCard(
          'RESULTS RAW DATA CSV EXPORT',
          'Download complete Form EC8A figures across all 4,827 polling units.',
          Icons.file_download,
          const Color(0xFF10B981),
          '/exports/results.csv',
          'jigawa_pdp_results_raw.csv',
        ),
        const SizedBox(height: 12),
        _buildVaultCard(
          'POLLING UNITS DIRECTORY (4,827 UNITS)',
          'Export complete INEC polling unit database with LGA & Ward mappings.',
          Icons.how_to_vote,
          const Color(0xFF3B82F6),
          '/exports/polling-units.csv',
          'jigawa_polling_units_directory.csv',
        ),
        const SizedBox(height: 12),
        _buildVaultCard(
          'FIELD AGENTS & STAFF ROSTER',
          'Export accredited agents list across all 27 LGAs with contact telemetry.',
          Icons.badge,
          const Color(0xFF8B5CF6),
          '/exports/agents.csv',
          'jigawa_field_agents_roster.csv',
        ),
        const SizedBox(height: 12),
        _buildVaultCard(
          'INCIDENTS REPORT EVIDENCE LOG',
          'Export real-time incident reports, category flags, and coordinates.',
          Icons.warning_amber_rounded,
          Colors.amberAccent,
          '/exports/incidents.csv',
          'jigawa_incidents_report.csv',
        ),
        const SizedBox(height: 12),
        _buildVaultCard(
          'SECURITY AUDIT TRAIL LOGS',
          'Download immutable compliance trail of all user actions and timestamps.',
          Icons.security,
          const Color(0xFFF59E0B),
          '/exports/audit-logs.csv',
          'situation_room_audit_logs.csv',
        ),
        const SizedBox(height: 12),
        _buildVaultCard(
          'COMPLETE DATABASE JSON BACKUP',
          'Full structured JSON archive of all election results, LGAs, wards, and users.',
          Icons.backup_outlined,
          const Color(0xFF06B6D4),
          '/exports/database-backup.json',
          'pollwatch_database_backup.json',
        ),
        const SizedBox(height: 12),
        _buildVaultCard(
          'TRIBUNAL EVIDENCE PACK (ZIP)',
          'Complete legal bundle with certified result tallies and incident manifests.',
          Icons.folder_zip_outlined,
          Colors.pinkAccent,
          '/exports/tribunal-evidence-pack.zip',
          'tribunal_evidence_pack.zip',
        ),
      ],
    );
  }

  Widget _buildVaultCard(String title, String desc, IconData icon, Color color, String endpoint, String filename) {
    bool isDownloading = false;

    return StatefulBuilder(
      builder: (context, setCardState) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF141E38),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                    child: Icon(icon, color: color, size: 20),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(height: 4),
                        Text(desc, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0B132B),
                foregroundColor: Colors.white,
                side: BorderSide(color: color.withValues(alpha: 0.5)),
              ),
              onPressed: isDownloading
                  ? null
                  : () async {
                      setCardState(() => isDownloading = true);
                      try {
                        await ApiService.downloadExport(endpoint, filename);
                        _showSnack('Export file "$filename" downloaded successfully.');
                      } catch (e) {
                        _showSnack('Download failed: $e', isError: true);
                      } finally {
                        setCardState(() => isDownloading = false);
                      }
                    },
              icon: isDownloading
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.download, size: 14),
              label: Text(isDownloading ? 'Downloading...' : 'Download', style: const TextStyle(fontSize: 11)),
            ),
          ],
        ),
      ),
    );
  }
}

class _SideABadge extends StatelessWidget {
  const _SideABadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFFF59E0B).withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: const Color(0xFFF59E0B), width: 0.8),
      ),
      child: const Text('MASTER ENGINE', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 9, fontWeight: FontWeight.bold)),
    );
  }
}
