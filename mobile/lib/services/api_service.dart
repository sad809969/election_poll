import 'dart:convert';
import 'package:http/http.dart' as http;
import 'socket_service.dart';

class ApiService {
  // Render Cloud Production Backend (Sole, Permanent Endpoint)
  static const String baseUrl = 'https://pdp-pollwatch-backend.onrender.com/api';

  static String? token;
  static Map<String, dynamic>? currentUser;
  static Map<String, dynamic>? currentPu;
  static String lastErrorMessage = '';

  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  /// Authenticate agent with username & password against Render Cloud
  static Future<bool> login(String username, String password) async {
    lastErrorMessage = '';
    try {
      final uri = Uri.parse('$baseUrl/auth/login');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {'username': username.trim(), 'password': password.trim()},
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        token = data['access_token'];

        // Populate initial currentUser from login response
        currentUser = {
          'id': data['id'],
          'username': data['username'] ?? username,
          'full_name': data['full_name'] ?? username,
          'role': data['role'] ?? 'Polling Unit Agent',
          'phone_number': data['phone_number'],
          'polling_unit_id': data['polling_unit_id'],
          'lga_id': data['lga_id'],
          'ward_id': data['ward_id'],
          'allowed_pages': data['allowed_pages'],
        };

        // Initialize and establish WebSocket connection to Render Cloud
        SocketService.init();
        if (token != null) {
          SocketService.connect(token!);
        }

        // Attempt non-blocking profile enrichment
        try {
          final meResponse = await http.get(
            Uri.parse('$baseUrl/auth/me'),
            headers: {'Authorization': 'Bearer $token'},
          ).timeout(const Duration(seconds: 5));

          if (meResponse.statusCode == 200) {
            final meData = json.decode(meResponse.body);
            currentUser!.addAll(meData);
          }
        } catch (_) {}

        // Attempt polling unit lookup if assigned
        final puId = currentUser?['polling_unit_id'];
        if (puId != null) {
          try {
            final puResponse = await http.get(
              Uri.parse('$baseUrl/electoral/polling-units/$puId'),
              headers: {'Authorization': 'Bearer $token'},
            ).timeout(const Duration(seconds: 5));
            if (puResponse.statusCode == 200) {
              currentPu = json.decode(puResponse.body);
            }
          } catch (_) {}
        }

        // Fallback polling unit information to prevent crashes
        if (currentPu == null) {
          final effectivePuId = puId ?? 1;
          currentPu = {
            'id': effectivePuId,
            'name': 'Assigned Polling Unit ($effectivePuId)',
            'code': 'PU-${effectivePuId.toString().padLeft(3, '0')}',
            'registered_voters': 750,
            'lga': {'name': 'Jigawa Command'},
          };
        }

        return true;
      } else if (response.statusCode == 401) {
        lastErrorMessage = 'Invalid credentials. Please verify your username/phone and password.';
        return false;
      } else {
        lastErrorMessage = 'Server error (${response.statusCode}): ${response.body}';
        return false;
      }
    } catch (e) {
      lastErrorMessage = 'Cannot connect to Render Cloud ($baseUrl). Please check internet connectivity.';
      return false;
    }
  }

  /// Logout and disconnect WebSocket
  static void logout() {
    SocketService.disconnect();
    token = null;
    currentUser = null;
    currentPu = null;
  }

  /// Submit Form EC8A Result (Multi-Category: Governorship, Senatorial, House of Reps, Presidential)
  static Future<Map<String, dynamic>> submitResult({
    required int pollingUnitId,
    String electionType = 'GOVERNORSHIP',
    required int pdp,
    required int apc,
    required int nnpp,
    required int lp,
    int others = 0,
    int rejected = 0,
    String? notes,
  }) async {
    final uri = Uri.parse('$baseUrl/results/submit');
    final body = json.encode({
      'polling_unit_id': pollingUnitId,
      'election_type': electionType,
      'pdp_votes': pdp,
      'apc_votes': apc,
      'nnpp_votes': nnpp,
      'lp_votes': lp,
      'others_votes': others,
      'rejected_votes': rejected,
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

  /// Upload the photographed Form EC8A sheet for a submitted result.
  static Future<Map<String, dynamic>> uploadEc8aPhoto({
    required int resultId,
    required String filePath,
  }) async {
    final uri = Uri.parse('$baseUrl/results/$resultId/ec8a-photo');
    final request = http.MultipartRequest('POST', uri);
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.files.add(await http.MultipartFile.fromPath('file', filePath));

    final response = await http.Response.fromStream(
      await request.send().timeout(const Duration(seconds: 60)),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['detail'] ?? 'Failed to upload EC8A photo');
    }
  }

  /// Upload a media file (Form EC8A result sheet or incident photo) to the backend
  static Future<String> uploadFile(dynamic fileInput, {String subfolder = 'results'}) async {
    final uri = Uri.parse('$baseUrl/upload');
    final request = http.MultipartRequest('POST', uri);

    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    request.fields['subfolder'] = subfolder;

    final String filePath = fileInput is String ? fileInput : fileInput.path;
    request.files.add(await http.MultipartFile.fromPath('file', filePath));

    final streamedResponse = await request.send().timeout(const Duration(seconds: 30));
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = json.decode(response.body);
      return data['url'] ?? data['relative_path'] ?? '';
    } else {
      String err = 'Upload failed (${response.statusCode})';
      try {
        final errJson = json.decode(response.body);
        if (errJson['detail'] != null) err = errJson['detail'];
      } catch (_) {}
      throw Exception(err);
    }
  }

  /// Submit Field Incident Report
  static Future<Map<String, dynamic>> reportIncident({
    required int pollingUnitId,
    required String incidentType,
    required String severity,
    required String description,
    String? mediaUrl,
    double? latitude,
    double? longitude,
  }) async {
    final uri = Uri.parse('$baseUrl/incidents');
    final body = json.encode({
      'polling_unit_id': pollingUnitId,
      'incident_type': incidentType,
      'severity': severity,
      'description': description,
      'media_url': mediaUrl,
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

  /// Fetch Recent Broadcasts from Situation Room
  static Future<List<dynamic>> getBroadcasts() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/broadcasts'),
        headers: headers,
      ).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (_) {}
    return [];
  }
}
