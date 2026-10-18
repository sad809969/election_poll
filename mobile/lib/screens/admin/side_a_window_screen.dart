import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class SideAWindowScreen extends StatefulWidget {
  const SideAWindowScreen({super.key});

  @override
  State<SideAWindowScreen> createState() => _SideAWindowScreenState();
}

class _SideAWindowScreenState extends State<SideAWindowScreen> {
  int _selectedSidebarIndex = 0;
  bool _isLoading = true;
  String? _error;
  Timer? _periodicRefreshTimer;

  Map<String, dynamic> _adminStats = {};
  List<dynamic> _lgas = [];
  List<dynamic> _wards = [];
  List<dynamic> _parties = [];
  List<dynamic> _users = [];
  List<dynamic> _pollingUnits = [];
  bool _isSeeding = false;

  // Setup sub-section for electoral setup: 'pu' | 'ward' | 'lga' | 'party'
  String _setupEntity = 'pu';

  // Filters
  int? _selectedLgaFilter;
  int? _selectedWardFilter;
  final TextEditingController _puSearchController = TextEditingController();
  final _numberFormat = NumberFormat('#,###');

  // Master catalog of all system pages for permission assignment
  static const List<Map<String, String>> systemPages = [
    {'path': '/', 'label': 'Situation Room Overview', 'desc': 'Central dashboard and KPIs'},
    {'path': '/governor-dashboard', 'label': '🏛️ Governor Command Dashboard', 'desc': 'Gubernatorial election race and 2/3 constitutional threshold'},
    {'path': '/senate-dashboard', 'label': '🎖️ Senate Command Dashboard', 'desc': '3 Senatorial Districts live returns and red chamber seats'},
    {'path': '/house-of-reps-dashboard', 'label': '🏢 House of Reps Dashboard', 'desc': '11 Federal Constituencies live returns and green chamber seats'},
    {'path': '/assembly-dashboard', 'label': '📜 State Assembly Dashboard', 'desc': '30 State Constituencies and 16-seat majority monitor'},
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

  final List<Map<String, dynamic>> _sidebarItems = [
    {
      'title': 'Master Overview',
      'subtitle': 'System Health & Engine',
      'icon': Icons.dashboard_customize_outlined,
      'selectedIcon': Icons.dashboard_customize,
    },
    {
      'title': 'Polling Units',
      'subtitle': '4,827 Polling Centers',
      'icon': Icons.how_to_vote_outlined,
      'selectedIcon': Icons.how_to_vote,
    },
    {
      'title': 'Wards & LGAs',
      'subtitle': '27 LGAs • 287 Wards',
      'icon': Icons.account_tree_outlined,
      'selectedIcon': Icons.account_tree,
    },
    {
      'title': 'Political Parties',
      'subtitle': 'Party Roster & Colors',
      'icon': Icons.flag_outlined,
      'selectedIcon': Icons.flag,
    },
    {
      'title': 'Users & Permissions',
      'subtitle': 'Roles & Page Access',
      'icon': Icons.admin_panel_settings_outlined,
      'selectedIcon': Icons.admin_panel_settings,
    },
    {
      'title': 'Data Vault & Exports',
      'subtitle': 'Audits, CSV & Backup',
      'icon': Icons.download_for_offline_outlined,
      'selectedIcon': Icons.download_for_offline,
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadSideAData();
    _periodicRefreshTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (mounted) _loadSideAData(silent: true);
    });
  }

  @override
  void dispose() {
    _periodicRefreshTimer?.cancel();
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

  // =========================================================================
  // MODAL DIALOGS FOR CRUD
  // =========================================================================

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
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
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
                  _loadSideAData(silent: true);
                } catch (e) {
                  _showSnack('Error: $e', isError: true);
                }
              },
              child: Text(pu == null ? 'Create PU' : 'Save Changes'),
            ),
          ],
        ),
      ),
    );
  }

  void _deletePollingUnit(int id, String name) async {
    final confirmed = await _confirmDialog('Delete Polling Unit', 'Are you sure you want to delete PU: $name?');
    if (confirmed == true) {
      try {
        await ApiService.deletePollingUnit(id);
        _showSnack('Polling Unit "$name" deleted.');
        _loadSideAData(silent: true);
      } catch (e) {
        _showSnack('Failed to delete PU: $e', isError: true);
      }
    }
  }

  void _showWardDialog({Map<String, dynamic>? ward}) {
    final nameCtrl = TextEditingController(text: ward?['name'] ?? '');
    final codeCtrl = TextEditingController(text: ward?['code'] ?? '');
    int selectedLgaId = ward?['lga_id'] ?? (_lgas.isNotEmpty ? _lgas.first['id'] : 1);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141E38),
        title: Text(ward == null ? 'Add Electoral Ward' : 'Edit Ward', style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildInput('Ward Name', nameCtrl),
            const SizedBox(height: 10),
            _buildInput('Ward Code', codeCtrl),
            const SizedBox(height: 10),
            DropdownButtonFormField<int>(
              value: selectedLgaId,
              dropdownColor: const Color(0xFF0B132B),
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: _inputDeco('LGA Jurisdiction'),
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
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
            onPressed: () async {
              Navigator.pop(ctx);
              final data = {'name': nameCtrl.text.trim(), 'code': codeCtrl.text.trim(), 'lga_id': selectedLgaId};
              try {
                if (ward == null) {
                  await ApiService.createWard(data);
                } else {
                  await ApiService.updateWard(ward['id'], data);
                }
                _loadSideAData(silent: true);
              } catch (e) {
                _showSnack('Error: $e', isError: true);
              }
            },
            child: const Text('Save Ward'),
          ),
        ],
      ),
    );
  }

  void _showLgaDialog({Map<String, dynamic>? lga}) {
    final nameCtrl = TextEditingController(text: lga?['name'] ?? '');
    final codeCtrl = TextEditingController(text: lga?['code'] ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141E38),
        title: Text(lga == null ? 'Register New LGA' : 'Edit LGA', style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildInput('LGA Name', nameCtrl),
            const SizedBox(height: 10),
            _buildInput('LGA Code', codeCtrl),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
            onPressed: () async {
              Navigator.pop(ctx);
              final data = {'name': nameCtrl.text.trim(), 'code': codeCtrl.text.trim()};
              try {
                if (lga == null) {
                  await ApiService.createLga(data);
                } else {
                  await ApiService.updateLga(lga['id'], data);
                }
                _loadSideAData(silent: true);
              } catch (e) {
                _showSnack('Error: $e', isError: true);
              }
            },
            child: const Text('Save LGA'),
          ),
        ],
      ),
    );
  }

  void _showPartyDialog({Map<String, dynamic>? party}) {
    final codeCtrl = TextEditingController(text: party?['code'] ?? '');
    final nameCtrl = TextEditingController(text: party?['name'] ?? '');
    final candCtrl = TextEditingController(text: party?['candidate_name'] ?? '');
    final colorCtrl = TextEditingController(text: party?['color_hex'] ?? '#10B981');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141E38),
        title: Text(party == null ? 'Register Political Party' : 'Edit Party', style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildInput('Party Acronym (e.g. PDP)', codeCtrl),
              const SizedBox(height: 10),
              _buildInput('Full Party Name', nameCtrl),
              const SizedBox(height: 10),
              _buildInput('Gubernatorial Candidate', candCtrl),
              const SizedBox(height: 10),
              _buildInput('Brand Color Hex (e.g. #008751)', colorCtrl),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
            onPressed: () async {
              Navigator.pop(ctx);
              final data = {
                'code': codeCtrl.text.trim().toUpperCase(),
                'name': nameCtrl.text.trim(),
                'candidate_name': candCtrl.text.trim(),
                'color_hex': colorCtrl.text.trim(),
              };
              try {
                if (party == null) {
                  await ApiService.createParty(data);
                } else {
                  await ApiService.updateParty(party['id'], data);
                }
                _loadSideAData(silent: true);
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

  void _showAddUserDialog() {
    final userCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    String selectedRole = 'Situation Room Officer';
    int? selectedLgaId = _lgas.isNotEmpty ? _lgas.first['id'] : null;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlg) => AlertDialog(
          backgroundColor: const Color(0xFF141E38),
          title: const Text('Provision New System User', style: TextStyle(color: Colors.white, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildInput('Username', userCtrl),
                const SizedBox(height: 10),
                _buildInput('Password', passCtrl, isPass: true),
                const SizedBox(height: 10),
                _buildInput('Full Legal Name', nameCtrl),
                const SizedBox(height: 10),
                _buildInput('Phone Number', phoneCtrl),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: selectedRole,
                  dropdownColor: const Color(0xFF0B132B),
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: _inputDeco('User Role'),
                  items: const [
                    DropdownMenuItem(value: 'Super Admin', child: Text('🛡️ Super Admin')),
                    DropdownMenuItem(value: 'State Director', child: Text('🏛️ State Director')),
                    DropdownMenuItem(value: 'Situation Room Officer', child: Text('💻 Situation Room Officer')),
                    DropdownMenuItem(value: 'Governorship Campaign Agent', child: Text('🏛️ Governorship Agent')),
                    DropdownMenuItem(value: 'Senatorial Campaign Agent', child: Text('🎖️ Senatorial Agent')),
                    DropdownMenuItem(value: 'House of Reps Agent', child: Text('🏢 House of Reps Agent')),
                    DropdownMenuItem(value: 'State Assembly Agent', child: Text('📜 State Assembly Agent')),
                    DropdownMenuItem(value: 'LGA Coordinator', child: Text('📍 LGA Coordinator')),
                    DropdownMenuItem(value: 'Ward Coordinator', child: Text('🏘️ Ward Coordinator')),
                    DropdownMenuItem(value: 'Polling Unit Agent', child: Text('🗳️ Polling Unit Agent')),
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
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
              onPressed: () async {
                Navigator.pop(ctx);
                final data = {
                  'username': userCtrl.text.trim(),
                  'password': passCtrl.text.trim(),
                  'full_name': nameCtrl.text.trim(),
                  'phone_number': phoneCtrl.text.trim(),
                  'role': selectedRole,
                  'lga_id': selectedLgaId,
                };
                try {
                  await ApiService.createAgent(data);
                  _showSnack('User "${userCtrl.text}" created successfully.');
                  _loadSideAData(silent: true);
                } catch (e) {
                  _showSnack('Error creating user: $e', isError: true);
                }
              },
              child: const Text('Provision User'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAllowedPagesDialog(int userId, String username, String role, List<dynamic> currentPages) {
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
            width: 520,
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
                        color: isChecked ? const Color(0xFFF59E0B).withOpacity(0.12) : const Color(0xFF0B132B),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isChecked ? const Color(0xFFF59E0B).withOpacity(0.4) : Colors.white10,
                        ),
                      ),
                      child: CheckboxListTile(
                        value: isChecked,
                        activeColor: const Color(0xFFF59E0B),
                        checkColor: Colors.black,
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
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  await ApiService.updateUserPermissions(userId, selectedPages);
                  _showSnack('Permissions saved for $username (${selectedPages.length} pages allowed).');
                  _loadSideAData(silent: true);
                } catch (e) {
                  _showSnack('Failed to update permissions: $e', isError: true);
                }
              },
              child: const Text('Save Permissions'),
            ),
          ],
        ),
      ),
    );
  }

  void _deleteUser(int id, String username) async {
    final confirmed = await _confirmDialog('Delete User Account', 'Are you sure you want to permanently delete user "$username"?');
    if (confirmed == true) {
      try {
        await ApiService.deleteUser(id);
        _showSnack('User "$username" removed from system.');
        _loadSideAData(silent: true);
      } catch (e) {
        _showSnack('Failed to delete user: $e', isError: true);
      }
    }
  }

  // =========================================================================
  // MAIN BUILD WITH DEDICATED SIDEBAR
  // =========================================================================

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 900;

    return Scaffold(
      backgroundColor: const Color(0xFF070D1E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 2,
        leading: isDesktop
            ? null
            : Builder(
                builder: (context) => IconButton(
                  icon: const Icon(Icons.menu, color: Color(0xFFF59E0B)),
                  onPressed: () => Scaffold.of(context).openDrawer(),
                ),
              ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFF59E0B), width: 1.2),
              ),
              child: const Icon(Icons.shield_moon, color: Color(0xFFF59E0B), size: 18),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'SIDE A: MASTER SYSTEM ADMIN CONSOLE',
                        style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                      SizedBox(width: 8),
                      Text('🔒 HIGH-SECURITY', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 10, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Text(
                    'Electoral Infrastructure Governance • Polling Units • Wards • LGAs • Users & Permissions',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // Return to Situation Room Button
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF10B981),
                side: const BorderSide(color: Color(0xFF008751)),
                backgroundColor: const Color(0xFF008751).withOpacity(0.15),
              ),
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back, size: 16),
              label: const Text('Return to Situation Room (Side B)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 10),

          // Lock Console
          IconButton(
            tooltip: 'Lock & Exit Side A',
            icon: const Icon(Icons.lock, color: Color(0xFFF59E0B), size: 20),
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: Color(0xFF141E38),
                  content: Text('🔒 Side A Master Console Locked.'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
          const SizedBox(width: 10),
        ],
      ),
      drawer: isDesktop ? null : Drawer(child: _buildSidebarContent()),
      body: Row(
        children: [
          // Dedicated Side A Left Sidebar (Desktop)
          if (isDesktop)
            Container(
              width: 280,
              decoration: const BoxDecoration(
                color: Color(0xFF0B132B),
                border: Border(right: BorderSide(color: Colors.white10)),
              ),
              child: _buildSidebarContent(),
            ),

          // Side A Content Area
          Expanded(
            child: _isLoading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: Color(0xFFF59E0B)),
                        SizedBox(height: 16),
                        Text('Loading Side A Master Architecture...', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                      ],
                    ),
                  )
                : _buildSelectedContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildSidebarContent() {
    return Column(
      children: [
        // Sidebar Branding Header
        Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: Color(0xFF081024),
            border: Border(bottom: BorderSide(color: Colors.white10)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFF59E0B)),
                ),
                child: const Icon(Icons.security, color: Color(0xFFF59E0B), size: 24),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('SIDE A CONSOLE', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                    SizedBox(height: 2),
                    Text('Master Setup & Controls', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Navigation Menu
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
            itemCount: _sidebarItems.length,
            itemBuilder: (context, idx) {
              final item = _sidebarItems[idx];
              final isSel = _selectedSidebarIndex == idx;

              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: () {
                    setState(() => _selectedSidebarIndex = idx);
                    if (Scaffold.of(context).isDrawerOpen) {
                      Navigator.pop(context);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSel ? const Color(0xFFF59E0B).withOpacity(0.2) : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSel ? const Color(0xFFF59E0B) : Colors.transparent,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isSel ? item['selectedIcon'] : item['icon'],
                          size: 20,
                          color: isSel ? const Color(0xFFF59E0B) : const Color(0xFF94A3B8),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['title'],
                                style: TextStyle(
                                  color: isSel ? Colors.white : const Color(0xFFCBD5E1),
                                  fontSize: 12,
                                  fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                                ),
                              ),
                              Text(
                                item['subtitle'],
                                style: TextStyle(
                                  color: isSel ? const Color(0xFFF59E0B) : const Color(0xFF64748B),
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        // Bottom Exit to Side B
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: Color(0xFF081024),
            border: Border(top: BorderSide(color: Colors.white10)),
          ),
          child: Column(
            children: [
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF008751),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back, size: 16),
                  label: const Text('Back to Situation Room', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Super Admin Session Active',
                style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSelectedContent() {
    switch (_selectedSidebarIndex) {
      case 0:
        return _buildMasterOverviewContent();
      case 1:
        return _buildPollingUnitsContent();
      case 2:
        return _buildWardsAndLgasContent();
      case 3:
        return _buildPartiesContent();
      case 4:
        return _buildUsersAndPermissionsContent();
      case 5:
        return _buildDataVaultContent();
      default:
        return _buildMasterOverviewContent();
    }
  }

  // =========================================================================
  // VIEW 1: MASTER OVERVIEW CONTENT
  // =========================================================================

  Widget _buildMasterOverviewContent() {
    final driver = _adminStats['database_driver'] ?? 'PostgreSQL';
    final sysStatus = _adminStats['system_status'] ?? 'ONLINE';

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        // Executive Header Card
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF854D0E), Color(0xFF451A03), Color(0xFF0F172A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.5)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.25),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFF59E0B), width: 1.5),
                ),
                child: const Icon(Icons.shield_moon, color: Color(0xFFF59E0B), size: 36),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'MASTER ELECTORAL GOVERNANCE ENGINE',
                          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.5)),
                          ),
                          child: Text(sysStatus, style: const TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Direct control over Polling Unit allocation, Ward & LGA mapping, Party ballot entries, and user permission matrices for the 2027 General Elections.',
                      style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // System Architecture & Metrics
        LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth > 800;
            return Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _buildMetricBox('REGISTERED POLLING UNITS', '${_numberFormat.format(_pollingUnits.length)} PUs', '4,827 Verified Baseline', Icons.how_to_vote, const Color(0xFF10B981), isWide, constraints.maxWidth),
                _buildMetricBox('ELECTORAL WARDS', '${_wards.length} Wards', 'Across 27 LGAs', Icons.layers, const Color(0xFF3B82F6), isWide, constraints.maxWidth),
                _buildMetricBox('LOCAL GOVERNMENT AREAS', '${_lgas.length} LGAs', 'Jigawa Sovereign State', Icons.location_city, const Color(0xFFF59E0B), isWide, constraints.maxWidth),
                _buildMetricBox('ACCREDITED FIELD USERS', '${_users.length} Users', 'Super Admins & Field Staff', Icons.people, const Color(0xFF8B5CF6), isWide, constraints.maxWidth),
              ],
            );
          },
        ),
        const SizedBox(height: 24),

        // Quick Setup Actions Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF141E38),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white10),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('RAPID PROVISIONING ACTIONS', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text('Add new records directly to the live PostgreSQL database:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
                    onPressed: () => _showPollingUnitDialog(),
                    icon: const Icon(Icons.add_location_alt, size: 16),
                    label: const Text('New Polling Unit'),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), foregroundColor: Colors.white),
                    onPressed: () => _showWardDialog(),
                    icon: const Icon(Icons.add_business, size: 16),
                    label: const Text('New Electoral Ward'),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.white),
                    onPressed: () => _showPartyDialog(),
                    icon: const Icon(Icons.flag, size: 16),
                    label: const Text('Register Party'),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B5CF6), foregroundColor: Colors.white),
                    onPressed: () => _showAddUserDialog(),
                    icon: const Icon(Icons.person_add, size: 16),
                    label: const Text('Provision User'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  // =========================================================================
  // VIEW 2: POLLING UNITS CONTENT
  // =========================================================================

  Widget _buildPollingUnitsContent() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('POLLING UNITS DIRECTORY & MANAGEMENT', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Managing ${_pollingUnits.length} official polling units across Jigawa State.', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
                onPressed: () => _showPollingUnitDialog(),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Add Polling Unit'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Filters Bar
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0xFF141E38), borderRadius: BorderRadius.circular(10)),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _puSearchController,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: InputDecoration(
                      hintText: 'Search PU by code or name...',
                      hintStyle: const TextStyle(color: Color(0xFF64748B)),
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B), size: 16),
                      filled: true,
                      fillColor: const Color(0xFF0B132B),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                    ),
                    onSubmitted: (_) => _loadSideAData(silent: true),
                  ),
                ),
                const SizedBox(width: 12),
                IconButton(
                  tooltip: 'Search',
                  icon: const Icon(Icons.arrow_forward, color: Color(0xFFF59E0B)),
                  onPressed: () => _loadSideAData(silent: true),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Polling Units Table
          Expanded(
            child: Container(
              decoration: BoxDecoration(color: const Color(0xFF141E38), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
              child: ListView.builder(
                itemCount: _pollingUnits.length,
                itemBuilder: (context, idx) {
                  final pu = _pollingUnits[idx];
                  final code = pu['code'] ?? 'PU-000';
                  final name = pu['name'] ?? 'Unnamed PU';
                  final lgaName = pu['lga_name'] ?? pu['lga']?['name'] ?? 'LGA';
                  final voters = pu['registered_voters'] ?? 750;

                  return Container(
                    decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.white10))),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF0B132B), borderRadius: BorderRadius.circular(6)),
                          child: Text(code, style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                              Text('LGA: $lgaName • Registered Voters: $voters', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Edit PU',
                          icon: const Icon(Icons.edit, color: Colors.white70, size: 18),
                          onPressed: () => _showPollingUnitDialog(pu: pu),
                        ),
                        IconButton(
                          tooltip: 'Delete PU',
                          icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                          onPressed: () => _deletePollingUnit(pu['id'], name),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // VIEW 3: WARDS & LGAS CONTENT
  // =========================================================================

  Widget _buildWardsAndLgasContent() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ELECTORAL GEOGRAPHY: WARDS & LGAS', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Jigawa State 27 LGAs and 287 Electoral Wards hierarchy.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ],
              ),
              Row(
                children: [
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), foregroundColor: Colors.white),
                    onPressed: () => _showLgaDialog(),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add LGA'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
                    onPressed: () => _showWardDialog(),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add Ward'),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),

          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 27 LGAs List
                Expanded(
                  flex: 2,
                  child: Container(
                    decoration: BoxDecoration(color: const Color(0xFF141E38), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(14),
                          child: Text('27 LOCAL GOVERNMENT AREAS', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                        const Divider(color: Colors.white10, height: 1),
                        Expanded(
                          child: ListView.builder(
                            itemCount: _lgas.length,
                            itemBuilder: (context, idx) {
                              final lga = _lgas[idx];
                              return ListTile(
                                dense: true,
                                title: Text(lga['name'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                                subtitle: Text('Code: ${lga['code'] ?? 'LGA-$idx'}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                                trailing: IconButton(
                                  icon: const Icon(Icons.edit, size: 16, color: Colors.white54),
                                  onPressed: () => _showLgaDialog(lga: lga),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 16),

                // Wards List
                Expanded(
                  flex: 3,
                  child: Container(
                    decoration: BoxDecoration(color: const Color(0xFF141E38), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('ELECTORAL WARDS (${_wards.length})', style: const TextStyle(color: Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.bold)),
                              const Text('INEC Accreditations', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                            ],
                          ),
                        ),
                        const Divider(color: Colors.white10, height: 1),
                        Expanded(
                          child: ListView.builder(
                            itemCount: _wards.length,
                            itemBuilder: (context, idx) {
                              final ward = _wards[idx];
                              return ListTile(
                                dense: true,
                                title: Text(ward['name'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 12)),
                                subtitle: Text('LGA ID: ${ward['lga_id']} • Code: ${ward['code'] ?? 'W-$idx'}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                                trailing: IconButton(
                                  icon: const Icon(Icons.edit, size: 16, color: Colors.white54),
                                  onPressed: () => _showWardDialog(ward: ward),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // VIEW 4: POLITICAL PARTIES CONTENT
  // =========================================================================

  Widget _buildPartiesContent() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('POLITICAL PARTIES REGISTRY', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Accredited political parties on the ballot for Jigawa 2027.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
                onPressed: () => _showPartyDialog(),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Register Party'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 2.2,
              ),
              itemCount: _parties.length,
              itemBuilder: (context, idx) {
                final party = _parties[idx];
                final code = party['code'] ?? '';
                final name = party['name'] ?? '';
                final cand = party['candidate_name'] ?? 'Candidate Not Set';
                final colorHex = party['color_hex'] ?? '#10B981';
                Color pColor;
                try {
                  pColor = Color(int.parse(colorHex.replaceAll('#', '0xFF')));
                } catch (_) {
                  pColor = const Color(0xFF10B981);
                }

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF141E38),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: pColor.withOpacity(0.4)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(color: pColor.withOpacity(0.2), shape: BoxShape.circle, border: Border.all(color: pColor)),
                        child: Center(
                          child: Text(code, style: TextStyle(color: pColor, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(name, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 2),
                            Text('Candidate: $cand', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit, size: 16, color: Colors.white54),
                        onPressed: () => _showPartyDialog(party: party),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // VIEW 5: USERS & PERMISSIONS CONTENT
  // =========================================================================

  Widget _buildUsersAndPermissionsContent() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('USERS & ROLE PERMISSIONS MATRIX', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('${_users.length} provisioned staff with granular view/page permissions.', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
                onPressed: () => _showAddUserDialog(),
                icon: const Icon(Icons.person_add, size: 16),
                label: const Text('Provision User'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Expanded(
            child: Container(
              decoration: BoxDecoration(color: const Color(0xFF141E38), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
              child: ListView.builder(
                itemCount: _users.length,
                itemBuilder: (context, idx) {
                  final user = _users[idx];
                  final username = user['username'] ?? '';
                  final fullName = user['full_name'] ?? username;
                  final role = user['role'] ?? 'Agent';
                  final allowed = (user['allowed_pages'] as List?) ?? [];
                  final isSuper = role.toString().toLowerCase().contains('super');

                  return Container(
                    decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.white10))),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: isSuper ? const Color(0xFFF59E0B).withOpacity(0.2) : const Color(0xFF3B82F6).withOpacity(0.2),
                          child: Icon(isSuper ? Icons.shield : Icons.person, color: isSuper ? const Color(0xFFF59E0B) : const Color(0xFF60A5FA), size: 18),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(fullName, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                              Text('@$username • Role: $role', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                            ],
                          ),
                        ),
                        // Allowed Pages Badge
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFF59E0B)),
                            foregroundColor: const Color(0xFFF59E0B),
                          ),
                          onPressed: () => _showAllowedPagesDialog(user['id'], username, role, allowed),
                          icon: const Icon(Icons.security, size: 14),
                          label: Text(
                            isSuper ? 'Full Access (Super)' : '${allowed.length} Pages Allowed',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          tooltip: 'Delete User',
                          icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                          onPressed: isSuper ? null : () => _deleteUser(user['id'], username),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // VIEW 6: DATA VAULT & EXPORTS CONTENT
  // =========================================================================

  Widget _buildDataVaultContent() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Text('DATA VAULT, AUDIT TRAIL & SYSTEM SEEDING', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        const Text('Export live collation tallies, download immutable records, or seed baseline datasets.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        const SizedBox(height: 20),

        // Export Actions
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: const Color(0xFF141E38), borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.white10)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('EXCEL / CSV DATA EXPORTS', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text('Download full tabular exports of collation records directly to your device:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
                    onPressed: () => _downloadExport('csv'),
                    icon: const Icon(Icons.table_view, size: 16),
                    label: const Text('Export Collation (CSV)'),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), foregroundColor: Colors.white),
                    onPressed: () => _downloadExport('json'),
                    icon: const Icon(Icons.code, size: 16),
                    label: const Text('Export JSON Telemetry'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _downloadExport(String format) async {
    try {
      final filename = 'jigawa_pdp_collation_${DateTime.now().millisecondsSinceEpoch}.$format';
      await ApiService.downloadExport('/exports/results.$format', filename);
      _showSnack('Export file "$filename" downloaded successfully.');
    } catch (e) {
      _showSnack('Export error: $e', isError: true);
    }
  }

  // =========================================================================
  // HELPER WIDGETS
  // =========================================================================

  Widget _buildMetricBox(String title, String val, String sub, IconData icon, Color color, bool isWide, double maxWidth) {
    final width = isWide ? (maxWidth - 48) / 4 : (maxWidth - 16) / 2;
    return Container(
      width: width,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141E38),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
              Icon(icon, color: color, size: 18),
            ],
          ),
          const SizedBox(height: 8),
          Text(val, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(sub, style: TextStyle(color: color, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildInput(String label, TextEditingController ctrl, {bool isNum = false, bool isPass = false}) {
    return TextField(
      controller: ctrl,
      keyboardType: isNum ? TextInputType.number : TextInputType.text,
      obscureText: isPass,
      style: const TextStyle(color: Colors.white, fontSize: 13),
      decoration: _inputDeco(label),
    );
  }

  InputDecoration _inputDeco(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
      filled: true,
      fillColor: const Color(0xFF0B132B),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    );
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: isError ? Colors.redAccent : const Color(0xFFF59E0B),
        content: Text(msg, style: TextStyle(color: isError ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<bool?> _confirmDialog(String title, String content) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141E38),
        title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 15)),
        content: Text(content, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
