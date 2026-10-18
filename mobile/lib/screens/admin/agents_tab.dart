import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class AgentsTab extends StatefulWidget {
  const AgentsTab({super.key});

  @override
  State<AgentsTab> createState() => _AgentsTabState();
}

class _AgentsTabState extends State<AgentsTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _agents = [];
  final TextEditingController _searchController = TextEditingController();

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
    _loadAgents();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAgents() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final list = await ApiService.getAgents(
        search: _searchController.text.trim().isNotEmpty ? _searchController.text.trim() : null,
      );
      if (mounted) {
        setState(() {
          _agents = list;
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

  void _showAddAgentDialog() {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final usernameController = TextEditingController();
    final passwordController = TextEditingController();
    String selectedRole = 'Polling Unit Agent';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF141E38),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: const Row(
            children: [
              Icon(Icons.person_add, color: Color(0xFF10B981), size: 22),
              SizedBox(width: 8),
              Text('Accredit Field Agent', style: TextStyle(color: Colors.white, fontSize: 16)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildField('Full Legal Name', nameController, 'e.g. Ibrahim Aliyu'),
                const SizedBox(height: 10),
                _buildField('Phone Number', phoneController, '08012345678'),
                const SizedBox(height: 10),
                _buildField('Login Username', usernameController, 'agent_hadejia_01'),
                const SizedBox(height: 10),
                _buildField('Initial Password', passwordController, 'Min 8 characters', obscureText: true),
                const SizedBox(height: 10),
                const Text('Electoral Role:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                const SizedBox(height: 4),
                DropdownButton<String>(
                  value: selectedRole,
                  dropdownColor: const Color(0xFF0B132B),
                  isExpanded: true,
                  items: const [
                    // --- Administration ---
                    DropdownMenuItem(value: 'Super Admin', child: Text('🛡️ Super Admin', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'State Director', child: Text('🎖️ State Director (Overall)', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Situation Room Officer', child: Text('📡 Situation Room Officer', style: TextStyle(color: Colors.white))),
                    // --- Governorship ---
                    DropdownMenuItem(value: 'Governorship Agent', child: Text('🏛️ Governorship Campaign Agent', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Deputy Governorship Agent', child: Text('🏛️ Deputy Governorship Agent', style: TextStyle(color: Colors.white))),
                    // --- National ---
                    DropdownMenuItem(value: 'Senatorial Agent', child: Text('🎖️ Senatorial Agent (Senate)', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'House of Reps Agent', child: Text('🏢 House of Reps Agent', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Presidential Agent', child: Text('🇳🇬 Presidential Campaign Agent', style: TextStyle(color: Colors.white))),
                    // --- State ---
                    DropdownMenuItem(value: 'State Assembly Agent', child: Text('📜 State Assembly Agent', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'State Coordinator', child: Text('📋 State Coordinator', style: TextStyle(color: Colors.white))),
                    // --- Ground Level ---
                    DropdownMenuItem(value: 'LGA Coordinator', child: Text('🗺️ LGA Coordinator', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Ward Coordinator', child: Text('🏘️ Ward Coordinator', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Polling Unit Agent', child: Text('🗳️ Polling Unit Agent (PUA)', style: TextStyle(color: Colors.white))),
                    // --- Support ---
                    DropdownMenuItem(value: 'Legal Observer', child: Text('⚖️ Legal/Paralegal Observer', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Observer', child: Text('👁️ General Observer', style: TextStyle(color: Colors.white))),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => selectedRole = val);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
              onPressed: () async {
                final name = nameController.text.trim();
                final phone = phoneController.text.trim();
                final username = usernameController.text.trim();
                final password = passwordController.text.trim();

                if (name.isEmpty || username.isEmpty || password.isEmpty) {
                  return;
                }
                Navigator.pop(ctx);
                try {
                  await ApiService.createAgent({
                    'full_name': name,
                    'phone_number': phone,
                    'username': username,
                    'password': password,
                    'role': selectedRole,
                  });
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(backgroundColor: Color(0xFF008751), content: Text('Field agent registered and accredited.')),
                    );
                    _loadAgents();
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(backgroundColor: Colors.redAccent, content: Text('Registration error: $e')),
                    );
                  }
                }
              },
              child: const Text('Enroll Agent'),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditAgentDialog(Map<String, dynamic> agent) {
    final nameController = TextEditingController(text: agent['full_name'] ?? '');
    final phoneController = TextEditingController(text: agent['phone_number'] ?? '');
    final usernameController = TextEditingController(text: agent['username'] ?? '');
    final passwordController = TextEditingController();
    String selectedRole = agent['role'] ?? 'Polling Unit Agent';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF141E38),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: const Row(
            children: [
              Icon(Icons.edit, color: Color(0xFF3B82F6), size: 22),
              SizedBox(width: 8),
              Text('Edit User / Agent Profile', style: TextStyle(color: Colors.white, fontSize: 16)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildField('Full Legal Name', nameController, 'Full name'),
                const SizedBox(height: 10),
                _buildField('Phone Number', phoneController, 'Phone number'),
                const SizedBox(height: 10),
                _buildField('Username', usernameController, 'Username'),
                const SizedBox(height: 10),
                _buildField('Reset Password (leave empty to keep current)', passwordController, 'New password', obscureText: true),
                const SizedBox(height: 10),
                const Text('Assigned Role:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                const SizedBox(height: 4),
                DropdownButton<String>(
                  value: selectedRole,
                  dropdownColor: const Color(0xFF0B132B),
                  isExpanded: true,
                  items: const [
                    // --- Administration ---
                    DropdownMenuItem(value: 'Super Admin', child: Text('🛡️ Super Admin', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'State Director', child: Text('🎖️ State Director (Overall)', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Situation Room Officer', child: Text('📡 Situation Room Officer', style: TextStyle(color: Colors.white))),
                    // --- Governorship ---
                    DropdownMenuItem(value: 'Governorship Agent', child: Text('🏛️ Governorship Campaign Agent', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Deputy Governorship Agent', child: Text('🏛️ Deputy Governorship Agent', style: TextStyle(color: Colors.white))),
                    // --- National ---
                    DropdownMenuItem(value: 'Senatorial Agent', child: Text('🎖️ Senatorial Agent (Senate)', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'House of Reps Agent', child: Text('🏢 House of Reps Agent', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Presidential Agent', child: Text('🇳🇬 Presidential Campaign Agent', style: TextStyle(color: Colors.white))),
                    // --- State ---
                    DropdownMenuItem(value: 'State Assembly Agent', child: Text('📜 State Assembly Agent', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'State Coordinator', child: Text('📋 State Coordinator', style: TextStyle(color: Colors.white))),
                    // --- Ground Level ---
                    DropdownMenuItem(value: 'LGA Coordinator', child: Text('🗺️ LGA Coordinator', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Ward Coordinator', child: Text('🏘️ Ward Coordinator', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Polling Unit Agent', child: Text('🗳️ Polling Unit Agent (PUA)', style: TextStyle(color: Colors.white))),
                    // --- Support ---
                    DropdownMenuItem(value: 'Legal Observer', child: Text('⚖️ Legal/Paralegal Observer', style: TextStyle(color: Colors.white))),
                    DropdownMenuItem(value: 'Observer', child: Text('👁️ General Observer', style: TextStyle(color: Colors.white))),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => selectedRole = val);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), foregroundColor: Colors.white),
              onPressed: () async {
                Navigator.pop(ctx);
                final data = <String, dynamic>{
                  'full_name': nameController.text.trim(),
                  'phone_number': phoneController.text.trim(),
                  'username': usernameController.text.trim(),
                  'role': selectedRole,
                  if (passwordController.text.trim().isNotEmpty) 'password': passwordController.text.trim(),
                };
                try {
                  await ApiService.updateUser(agent['id'], data);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(backgroundColor: Color(0xFF008751), content: Text('User profile updated successfully.')),
                    );
                    _loadAgents();
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(backgroundColor: Colors.redAccent, content: Text('Update error: $e')),
                    );
                  }
                }
              },
              child: const Text('Save Changes'),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteConfirmation(Map<String, dynamic> agent) {
    final name = agent['full_name'] ?? agent['username'] ?? 'User';
    final username = agent['username'] ?? '';
    final role = agent['role'] ?? 'Agent';
    final id = agent['id'];

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141E38),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: Colors.redAccent.withOpacity(0.2), shape: BoxShape.circle),
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
            Text(
              'Are you sure you want to delete this user from the system?',
              style: const TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0B132B),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
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
              'This will revoke all permissions and remove user login access.',
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
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(backgroundColor: const Color(0xFF008751), content: Text('User $name deleted successfully.')),
                  );
                  _loadAgents();
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(backgroundColor: Colors.redAccent, content: Text('Delete failed: $e')),
                  );
                }
              }
            },
          ),
        ],
      ),
    );
  }

  void _showPermissionsDialog(Map<String, dynamic> agent) {
    final userId = agent['id'];
    final username = agent['username'] ?? 'User';
    final role = agent['role'] ?? 'Agent';

    List<dynamic> currentPages = agent['allowed_pages'] ?? [];
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
                        color: isChecked ? const Color(0xFF008751).withOpacity(0.15) : const Color(0xFF0B132B),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isChecked ? const Color(0xFF10B981).withOpacity(0.4) : Colors.white10,
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
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(backgroundColor: const Color(0xFF008751), content: Text('Permissions updated for $username.')),
                    );
                    _loadAgents();
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(backgroundColor: Colors.redAccent, content: Text('Error updating permissions: $e')),
                    );
                  }
                }
              },
              child: const Text('Save Permissions'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, String hint, {bool obscureText = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          obscureText: obscureText,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white30),
            filled: true,
            fillColor: const Color(0xFF0B132B),
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Filter & Enroll Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF141E38),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                SizedBox(
                  width: 300,
                  child: TextField(
                    controller: _searchController,
                    onSubmitted: (_) => _loadAgents(),
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Search agent name/phone/username...',
                      hintStyle: const TextStyle(color: Colors.white30),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      isDense: true,
                      filled: true,
                      fillColor: const Color(0xFF0B132B),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.search, size: 18, color: Colors.white70),
                        onPressed: _loadAgents,
                      ),
                    ),
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      tooltip: 'Refresh Roster',
                      icon: const Icon(Icons.refresh, color: Colors.white70, size: 20),
                      onPressed: _loadAgents,
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF008751), foregroundColor: Colors.white),
                      onPressed: _showAddAgentDialog,
                      icon: const Icon(Icons.person_add, size: 16),
                      label: const Text('Add User / Agent', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Agents List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF008751)))
                : _error != null
                    ? Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.redAccent)))
                    : _agents.isEmpty
                        ? const Center(child: Text('No users found.', style: TextStyle(color: Colors.white54)))
                        : ListView.separated(
                            itemCount: _agents.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final agent = _agents[index];
                              final name = agent['full_name'] ?? agent['username'] ?? 'User';
                              final username = agent['username'] ?? '';
                              final role = agent['role'] ?? 'Polling Unit Agent';
                              final phone = agent['phone_number'] ?? 'No phone logged';
                              final isSuper = role.toString().toLowerCase().contains('super');

                              return Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF141E38),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: isSuper ? const Color(0xFFF59E0B).withOpacity(0.3) : Colors.white10),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(10),
                                            decoration: BoxDecoration(
                                              color: isSuper ? const Color(0xFFF59E0B).withOpacity(0.15) : const Color(0xFF008751).withOpacity(0.15),
                                              shape: BoxShape.circle,
                                            ),
                                            child: Icon(
                                              isSuper ? Icons.shield_moon : Icons.person,
                                              color: isSuper ? const Color(0xFFF59E0B) : const Color(0xFF10B981),
                                              size: 18,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Text(
                                                      name,
                                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: isSuper ? const Color(0xFFF59E0B).withOpacity(0.15) : const Color(0xFF3B82F6).withOpacity(0.15),
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
                                                const SizedBox(height: 3),
                                                Text(
                                                  '@$username • Phone: $phone',
                                                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Row(
                                      children: [
                                        // Allowed Pages button
                                        ElevatedButton.icon(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF0B132B),
                                            foregroundColor: const Color(0xFFF59E0B),
                                            side: const BorderSide(color: Color(0xFFF59E0B), width: 0.8),
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          ),
                                          onPressed: () => _showPermissionsDialog(agent),
                                          icon: const Icon(Icons.rule, size: 14),
                                          label: const Text('Allowed Pages', style: TextStyle(fontSize: 11)),
                                        ),
                                        const SizedBox(width: 6),
                                        // Edit button
                                        IconButton(
                                          tooltip: 'Edit User',
                                          icon: const Icon(Icons.edit, size: 18, color: Colors.white70),
                                          onPressed: () => _showEditAgentDialog(agent),
                                        ),
                                        // Delete button
                                        IconButton(
                                          tooltip: 'Delete User Account',
                                          icon: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                                          onPressed: () => _showDeleteConfirmation(agent),
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
      ),
    );
  }
}
