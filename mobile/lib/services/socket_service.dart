import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';

class AppNotification {
  final String id;
  final String title;
  final String message;
  final String type; // 'broadcast', 'incident', 'urgent', 'system'
  final DateTime timestamp;
  bool isRead;

  AppNotification({
    required this.id,
    required this.title,
    required this.message,
    this.type = 'broadcast',
    required this.timestamp,
    this.isRead = false,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
      title: json['title'] ?? 'Situation Room Alert',
      message: json['message'] ?? json['body'] ?? json['text'] ?? '',
      type: json['type'] ?? 'broadcast',
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp']) ?? DateTime.now()
          : DateTime.now(),
      isRead: json['is_read'] == true,
    );
  }
}

class SocketService {
  // Render Cloud Production WebSocket
  static const String wsBaseUrl = 'wss://pdp-pollwatch-backend.onrender.com/ws/live-feed';

  static WebSocket? _socket;
  static bool _isConnecting = false;
  static bool _isConnected = false;
  static Timer? _reconnectTimer;
  static int _reconnectAttempts = 0;
  static String? _currentToken;

  static final ValueNotifier<bool> connectionState = ValueNotifier<bool>(false);
  static final ValueNotifier<List<AppNotification>> notificationsNotifier =
      ValueNotifier<List<AppNotification>>([]);
  static final ValueNotifier<int> unreadCountNotifier = ValueNotifier<int>(0);

  static bool get isConnected => _isConnected;

  /// Initialize default state with welcome briefing
  static void init() {
    if (notificationsNotifier.value.isEmpty) {
      final initialAlerts = [
        AppNotification(
          id: 'sys-01',
          title: 'PDP PollWatch Command Online',
          message:
              'Connected to Render Cloud Command Center. Form EC8A submission, GPS geofencing, and live situation feeds are active.',
          type: 'system',
          timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
          isRead: false,
        ),
        AppNotification(
          id: 'sys-02',
          title: '2027 General Election Protocol',
          message:
              'All accredited polling unit agents must submit Form EC8A results immediately upon completion of vote sorting and counting.',
          type: 'broadcast',
          timestamp: DateTime.now().subtract(const Duration(minutes: 15)),
          isRead: false,
        ),
      ];
      notificationsNotifier.value = initialAlerts;
      _updateUnreadCount();
    }
  }

  /// Connect to Render Cloud WebSocket
  static Future<void> connect(String token) async {
    _currentToken = token;
    if (_isConnecting || (_isConnected && _socket != null)) return;

    _isConnecting = true;
    _reconnectTimer?.cancel();

    try {
      final uri = Uri.parse('$wsBaseUrl?token=$token');
      debugPrint('[SocketService] Connecting to Render Cloud: $uri');

      _socket = await WebSocket.connect(uri.toString())
          .timeout(const Duration(seconds: 10));

      _isConnected = true;
      _isConnecting = false;
      _reconnectAttempts = 0;
      connectionState.value = true;
      debugPrint('[SocketService] Connected to Render Cloud Live Feed.');

      // Listen for incoming messages
      _socket!.listen(
        _onMessageReceived,
        onDone: _onDisconnected,
        onError: (err) {
          debugPrint('[SocketService] Error: $err');
          _onDisconnected();
        },
        cancelOnError: true,
      );
    } catch (e) {
      debugPrint('[SocketService] Connection failed: $e');
      _isConnected = false;
      _isConnecting = false;
      connectionState.value = false;
      _scheduleReconnect();
    }
  }

  static void _onMessageReceived(dynamic data) {
    debugPrint('[SocketService] Message received: $data');
    try {
      Map<String, dynamic> payload = {};
      if (data is String) {
        try {
          payload = jsonDecode(data);
        } catch (_) {
          payload = {
            'title': 'Command Notification',
            'message': data,
            'type': 'broadcast',
          };
        }
      } else if (data is Map<String, dynamic>) {
        payload = data;
      }

      // Ignore acknowledgment loopback
      if (payload['status'] == 'acknowledged') return;

      final notification = AppNotification(
        id: payload['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: payload['title'] ?? 'Situation Room Update',
        message: payload['message'] ?? payload['text'] ?? payload['broadcast'] ?? jsonEncode(payload),
        type: payload['type'] ?? 'broadcast',
        timestamp: DateTime.now(),
        isRead: false,
      );

      final current = List<AppNotification>.from(notificationsNotifier.value);
      current.insert(0, notification);
      notificationsNotifier.value = current;
      _updateUnreadCount();
    } catch (e) {
      debugPrint('[SocketService] Failed to parse message: $e');
    }
  }

  static void _onDisconnected() {
    _isConnected = false;
    _isConnecting = false;
    _socket = null;
    connectionState.value = false;
    debugPrint('[SocketService] Disconnected from Render Cloud.');
    _scheduleReconnect();
  }

  static void _scheduleReconnect() {
    if (_currentToken == null) return;
    _reconnectTimer?.cancel();

    _reconnectAttempts++;
    final delaySeconds = (_reconnectAttempts * 3).clamp(3, 30);
    debugPrint('[SocketService] Reconnecting in ${delaySeconds}s (attempt #$_reconnectAttempts)...');

    _reconnectTimer = Timer(Duration(seconds: delaySeconds), () {
      if (_currentToken != null && !_isConnected) {
        connect(_currentToken!);
      }
    });
  }

  /// Send message or incident alert over socket
  static void sendMessage(Map<String, dynamic> message) {
    if (_socket != null && _isConnected) {
      _socket!.add(jsonEncode(message));
    }
  }

  /// Mark specific notification as read
  static void markAsRead(String id) {
    final list = List<AppNotification>.from(notificationsNotifier.value);
    final idx = list.indexWhere((n) => n.id == id);
    if (idx != -1) {
      list[idx].isRead = true;
      notificationsNotifier.value = list;
      _updateUnreadCount();
    }
  }

  /// Mark all notifications as read
  static void markAllAsRead() {
    final list = List<AppNotification>.from(notificationsNotifier.value);
    for (var n in list) {
      n.isRead = true;
    }
    notificationsNotifier.value = list;
    _updateUnreadCount();
  }

  /// Clear all notifications
  static void clearAll() {
    notificationsNotifier.value = [];
    _updateUnreadCount();
  }

  static void _updateUnreadCount() {
    unreadCountNotifier.value =
        notificationsNotifier.value.where((n) => !n.isRead).length;
  }

  /// Disconnect on user logout
  static void disconnect() {
    _currentToken = null;
    _reconnectTimer?.cancel();
    _socket?.close();
    _socket = null;
    _isConnected = false;
    _isConnecting = false;
    connectionState.value = false;
    _reconnectAttempts = 0;
  }
}
