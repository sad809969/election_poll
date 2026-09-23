import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Default to the host workstation's Wi-Fi / LAN IP (192.168.1.164:8000)
  static String baseUrl = 'http://192.168.1.164:8000/api';

  static String? token;
  static Map<String, dynamic>? currentUser;
  static Map<String, dynamic>? currentPu;
  static String lastErrorMessage = '';

  static String normalizeUrl(String raw) {
    var trimmed = raw.trim();
    if (trimmed.isEmpty) return baseUrl;
    // Prepend http:// if missing scheme
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'http://$trimmed';
    }
    // Remove trailing slashes
    while (trimmed.endsWith('/')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }
    // Ensure /api is appended
    if (!trimmed.endsWith('/api')) {
      trimmed = '$trimmed/api';
    }
    return trimmed;
  }

  static void setBaseUrl(String url) {
    baseUrl = normalizeUrl(url);
  }

  /// Ping the backend to check network reachability
  static Future<Map<String, dynamic>> testConnection([String? customUrl]) async {
    final target = customUrl != null ? normalizeUrl(customUrl) : baseUrl;
    final rootTarget = target.replaceAll(RegExp(r'/api$'), '');
    final stopwatch = Stopwatch()..start();
    try {
      final uri = Uri.parse('$rootTarget/');
      final res = await http.get(uri).timeout(const Duration(seconds: 3));
      stopwatch.stop();
      if (res.statusCode == 200) {
        return {
          'success': true,
          'latencyMs': stopwatch.elapsedMilliseconds,
          'message': 'Connected (${stopwatch.elapsedMilliseconds}ms)',
          'url': target,
        };
      } else {
        return {
          'success': false,
          'message': 'Server returned HTTP ${res.statusCode}',
          'url': target,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Cannot reach server at $rootTarget',
        'error': e.toString(),
        'url': target,
      };
    }
  }

  /// Concurrently probe candidate URLs and automatically lock on the fastest working one
  static Future<Map<String, dynamic>> autoDetectServer() async {
    final candidates = [
      'http://127.0.0.1:8000',     // USB Reverse Tunnel via adb
      'http://192.168.1.164:8000', // Wi-Fi LAN
      'http://10.0.2.2:8000',      // Android Emulator
    ];

    for (final candidate in candidates) {
      final res = await testConnection(candidate);
      if (res['success'] == true) {
        setBaseUrl(candidate);
        String mode = 'Wi-Fi';
        if (candidate.contains('127.0.0.1')) mode = 'USB Tunnel';
        if (candidate.contains('10.0.2.2')) mode = 'Emulator';
        return {
          'success': true,
          'url': candidate,
          'mode': mode,
          'latencyMs': res['latencyMs'],
          'message': 'Connected via $mode (${res['latencyMs']}ms)',
        };
      }
    }

    return {
      'success': false,
      'message': 'Could not reach server on USB or Wi-Fi. Check connection.',
    };
  }

  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  /// Authenticate agent with username & password
  static Future<bool> login(String username, String password) async {
    lastErrorMessage = '';
    try {
      final uri = Uri.parse('$baseUrl/auth/login');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {'username': username, 'password': password},
      ).timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        token = data['access_token'];

        // Fetch user profile
        final meResponse = await http.get(
          Uri.parse('$baseUrl/auth/me'),
          headers: {'Authorization': 'Bearer $token'},
        ).timeout(const Duration(seconds: 5));

        if (meResponse.statusCode == 200) {
          currentUser = json.decode(meResponse.body);
          final puId = currentUser?['polling_unit_id'];
          if (puId != null) {
            final puResponse = await http.get(
              Uri.parse('$baseUrl/electoral/polling-units/$puId'),
              headers: {'Authorization': 'Bearer $token'},
            ).timeout(const Duration(seconds: 5));
            if (puResponse.statusCode == 200) {
              currentPu = json.decode(puResponse.body);
            }
          }
        }
        return true;
      } else if (response.statusCode == 401) {
        lastErrorMessage = 'Invalid credentials. Please verify your username and password.';
        return false;
      } else {
        lastErrorMessage = 'Server error (${response.statusCode}): ${response.body}';
        return false;
      }
    } catch (e) {
      lastErrorMessage = 'Network error connecting to $baseUrl ($e). Check your Wi-Fi or server IP.';
      print('Login error: $e');
      return false;
    }
  }

  /// Submit Form EC8A Result
  static Future<Map<String, dynamic>> submitResult({
    required int pollingUnitId,
    required int pdp,
    required int apc,
    required int nnpp,
    required int lp,
    int others = 0,
    int rejected = 0,
    String? photoUrl,
    String? notes,
  }) async {
    final uri = Uri.parse('$baseUrl/results/submit');
    final body = json.encode({
      'polling_unit_id': pollingUnitId,
      'pdp_votes': pdp,
      'apc_votes': apc,
      'nnpp_votes': nnpp,
      'lp_votes': lp,
      'others_votes': others,
      'rejected_votes': rejected,
      'ec8a_photo_url': photoUrl,
      'notes': notes,
    });

    final response = await http.post(uri, headers: headers, body: body);
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['detail'] ?? 'Failed to submit result');
    }
  }

  /// Submit Field Incident Report
  static Future<Map<String, dynamic>> reportIncident({
    required int pollingUnitId,
    required String incidentType,
    required String severity,
    required String description,
    double? latitude,
    double? longitude,
  }) async {
    final uri = Uri.parse('$baseUrl/incidents');
    final body = json.encode({
      'polling_unit_id': pollingUnitId,
      'incident_type': incidentType,
      'severity': severity,
      'description': description,
      'latitude': latitude,
      'longitude': longitude,
    });

    final response = await http.post(uri, headers: headers, body: body);
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['detail'] ?? 'Failed to dispatch incident');
    }
  }

  /// Record Timeline Activity / Check-in
  static Future<Map<String, dynamic>> recordActivity({
    required int pollingUnitId,
    required String activityType,
    String? notes,
  }) async {
    final uri = Uri.parse('$baseUrl/activities');
    final body = json.encode({
      'polling_unit_id': pollingUnitId,
      'activity_type': activityType,
      'notes': notes,
    });

    final response = await http.post(uri, headers: headers, body: body);
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['detail'] ?? 'Failed to record activity');
    }
  }

  /// Fetch Timeline Activities
  static Future<List<dynamic>> getActivities({int? pollingUnitId}) async {
    String url = '$baseUrl/activities';
    if (pollingUnitId != null) {
      url += '?polling_unit_id=$pollingUnitId';
    }
    final response = await http.get(Uri.parse(url), headers: headers);
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    return [];
  }
}
