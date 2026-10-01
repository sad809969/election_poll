import 'package:flutter/material.dart';
import '../services/socket_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _selectedFilter = 'All';

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${dt.day}/${dt.month} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  Color _getTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'incident':
      case 'urgent':
        return const Color(0xFFE11D48); // Rose
      case 'system':
        return const Color(0xFF3B82F6); // Blue
      case 'broadcast':
      default:
        return const Color(0xFF10B981); // Emerald
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'incident':
      case 'urgent':
        return Icons.warning_amber_rounded;
      case 'system':
        return Icons.shield_outlined;
      case 'broadcast':
      default:
        return Icons.campaign_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070D1E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B132B),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Situation Alerts & Feed',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Colors.white),
            ),
            ValueListenableBuilder<bool>(
              valueListenable: SocketService.connectionState,
              builder: (context, isConnected, _) {
                return Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isConnected ? const Color(0xFF10B981) : Colors.amber,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      isConnected ? 'Live WebSocket • Render Cloud' : 'Connecting to Render Cloud...',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: isConnected ? const Color(0xFF10B981) : Colors.amber,
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all, color: Color(0xFF94A3B8), size: 20),
            tooltip: 'Mark All as Read',
            onPressed: () {
              SocketService.markAllAsRead();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('All alerts marked as read'),
                  duration: Duration(seconds: 1),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined, color: Color(0xFF94A3B8), size: 20),
            tooltip: 'Clear All',
            onPressed: () {
              SocketService.clearAll();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filter Pills
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: const Color(0xFF0B132B),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['All', 'Broadcast', 'Incident', 'System'].map((filter) {
                    final isSelected = _selectedFilter.toLowerCase() == filter.toLowerCase();
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: InkWell(
                        onTap: () => setState(() => _selectedFilter = filter),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF008751) : const Color(0xFF141E38),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF10B981) : const Color(0xFF1E293B),
                            ),
                          ),
                          child: Text(
                            filter,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                              color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            // Notifications List
            Expanded(
              child: ValueListenableBuilder<List<AppNotification>>(
                valueListenable: SocketService.notificationsNotifier,
                builder: (context, notifications, _) {
                  final filtered = notifications.where((n) {
                    if (_selectedFilter == 'All') return true;
                    return n.type.toLowerCase() == _selectedFilter.toLowerCase();
                  }).toList();

                  if (filtered.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(18),
                              decoration: BoxDecoration(
                                color: const Color(0xFF141E38),
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFF1E293B)),
                              ),
                              child: const Icon(Icons.notifications_none, size: 40, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'No Alerts at This Moment',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Real-time broadcasts and incident bulletins from the Jigawa Situation Room will stream here via Render Cloud WebSocket.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8), height: 1.4),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final item = filtered[index];
                      final color = _getTypeColor(item.type);
                      final icon = _getTypeIcon(item.type);

                      return Dismissible(
                        key: Key(item.id),
                        direction: DismissDirection.endToStart,
                        onDismissed: (_) {
                          SocketService.markAsRead(item.id);
                        },
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          color: Colors.red.withOpacity(0.2),
                          child: const Icon(Icons.delete, color: Colors.redAccent),
                        ),
                        child: InkWell(
                          onTap: () {
                            SocketService.markAsRead(item.id);
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: item.isRead ? const Color(0xFF0F172A) : const Color(0xFF141E38),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: item.isRead
                                    ? const Color(0xFF1E293B)
                                    : color.withOpacity(0.4),
                                width: item.isRead ? 1 : 1.5,
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Icon with type indicator
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: color.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(icon, color: color, size: 20),
                                ),
                                const SizedBox(width: 12),

                                // Content
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              item.title,
                                              style: TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold,
                                                color: item.isRead ? Colors.white70 : Colors.white,
                                              ),
                                            ),
                                          ),
                                          if (!item.isRead) ...[
                                            const SizedBox(width: 6),
                                            Container(
                                              width: 8,
                                              height: 8,
                                              decoration: BoxDecoration(
                                                shape: BoxShape.circle,
                                                color: color,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        item.message,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: item.isRead ? const Color(0xFF64748B) : const Color(0xFFCBD5E1),
                                          height: 1.35,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: color.withOpacity(0.12),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              item.type.toUpperCase(),
                                              style: TextStyle(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w900,
                                                color: color,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ),
                                          Text(
                                            _formatTimestamp(item.timestamp),
                                            style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                                          ),
                                        ],
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
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
