import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

class PollingUnitsTab extends StatefulWidget {
  const PollingUnitsTab({super.key});

  @override
  State<PollingUnitsTab> createState() => _PollingUnitsTabState();
}

class _PollingUnitsTabState extends State<PollingUnitsTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _pollingUnits = [];
  List<dynamic> _lgas = [];
  int? _selectedLgaId;
  final TextEditingController _searchController = TextEditingController();
  final _numberFormat = NumberFormat('#,###');

  @override
  void initState() {
    super.initState();
    _loadLgas();
    _loadPollingUnits();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadLgas() async {
    try {
      final lgas = await ApiService.getLgas();
      if (mounted) setState(() => _lgas = lgas);
    } catch (_) {}
  }

  Future<void> _loadPollingUnits() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final list = await ApiService.getPollingUnits(
        lgaId: _selectedLgaId,
        search: _searchController.text.trim().isNotEmpty ? _searchController.text.trim() : null,
      );
      if (mounted) {
        setState(() {
          _pollingUnits = list;
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
                if (_lgas.isNotEmpty)
                  DropdownButton<int?>(
                    value: _selectedLgaId,
                    dropdownColor: const Color(0xFF0B132B),
                    hint: const Text('All 27 LGAs', style: TextStyle(color: Colors.white70)),
                    underline: const SizedBox(),
                    items: [
                      const DropdownMenuItem<int?>(value: null, child: Text('All 27 LGAs', style: TextStyle(color: Colors.white))),
                      ..._lgas.map((l) => DropdownMenuItem<int?>(
                            value: l['id'],
                            child: Text(l['name'] ?? 'LGA', style: const TextStyle(color: Colors.white)),
                          )),
                    ],
                    onChanged: (val) {
                      setState(() => _selectedLgaId = val);
                      _loadPollingUnits();
                    },
                  ),
                SizedBox(
                  width: 240,
                  child: TextField(
                    controller: _searchController,
                    onSubmitted: (_) => _loadPollingUnits(),
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Search PU code / name...',
                      hintStyle: const TextStyle(color: Colors.white30),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      isDense: true,
                      filled: true,
                      fillColor: const Color(0xFF0B132B),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.search, size: 18, color: Colors.white70),
                        onPressed: _loadPollingUnits,
                      ),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: _loadPollingUnits,
                  icon: const Icon(Icons.refresh, color: Color(0xFF10B981)),
                  tooltip: 'Reload Polling Units',
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // PU List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF008751)))
                : _error != null
                    ? Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.redAccent)))
                    : _pollingUnits.isEmpty
                        ? const Center(child: Text('No Polling Units found matching criteria.', style: TextStyle(color: Colors.white54)))
                        : ListView.separated(
                            itemCount: _pollingUnits.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final pu = _pollingUnits[index];
                              final code = pu['code'] ?? 'PU-000';
                              final name = pu['name'] ?? 'Polling Unit';
                              final lgaName = pu['lga']?['name'] ?? pu['lga_name'] ?? 'Jigawa';
                              final wardName = pu['ward']?['name'] ?? pu['ward_name'] ?? 'Ward';
                              final voters = pu['registered_voters'] ?? 750;

                              return Container(
                                padding: const EdgeInsets.all(14),
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
                                                  color: const Color(0xFF3B82F6).withOpacity(0.15),
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: const Color(0xFF3B82F6), width: 0.8),
                                                ),
                                                child: Text(code, style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 11, fontWeight: FontWeight.bold)),
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  name,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            'LGA: $lgaName • Ward: $wardName',
                                            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          '${_numberFormat.format(voters)} Voters',
                                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                                        ),
                                        const SizedBox(height: 4),
                                        const Row(
                                          children: [
                                            Icon(Icons.check_circle, size: 12, color: Color(0xFF10B981)),
                                            SizedBox(width: 4),
                                            Text('Active Monitoring', style: TextStyle(color: Color(0xFF10B981), fontSize: 10)),
                                          ],
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
