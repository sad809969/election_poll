import 'dart:convert';
import 'package:http/http.dart' as http;
import 'socket_service.dart';
import '../utils/file_download_helper.dart';

class ApiService {
  // Render Cloud Production Backend (Default Endpoint, can be toggled)
  static String baseUrl = const String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://pdp-pollwatch-backend.onrender.com/api',
  );

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

  /// Fetch Recent Broadcasts from Situation Room and merge into socket state
  static Future<List<dynamic>> getBroadcasts() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/announcements'),
        headers: headers,
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) {
          SocketService.mergeHistoricalNotifications(data);
          return data;
        }
      }
    } catch (_) {
      try {
        final fallback = await http.get(
          Uri.parse('$baseUrl/broadcasts'),
          headers: headers,
        ).timeout(const Duration(seconds: 8));

        if (fallback.statusCode == 200) {
          final data = json.decode(fallback.body);
          if (data is List) {
            SocketService.mergeHistoricalNotifications(data);
            return data;
          }
        }
      } catch (_) {}
    }
    return [];
  }

  // =========================================================================
  // ADMINISTRATION & SITUATION ROOM APIs
  // =========================================================================

  /// Switch the active base API URL (e.g. localhost or custom deployment)
  static void setBaseUrl(String url) {
    baseUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  /// Situation Room Overview Metrics (KPIs, aggregated party votes)
  static Future<Map<String, dynamic>> getDashboardSummary() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/dashboard'),
        headers: headers,
      ).timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (_) {}

    try {
      final fallback = await http.get(
        Uri.parse('$baseUrl/dashboard/summary'),
        headers: headers,
      ).timeout(const Duration(seconds: 15));
      if (fallback.statusCode == 200) {
        return json.decode(fallback.body);
      }
    } catch (_) {}
    return {
      'kpi': {'polling_units': 4827, 'agents': 8, 'reports': 0, 'incidents': 0, 'pending': 4827},
      'votes': {'pdp': 0, 'apc': 0, 'nnpp': 0, 'lp': 0, 'others': 0, 'total': 0},
    };
  }

  /// Admin Electoral Statistics (total LGAs, wards, PUs, agents, results)
  static Future<Map<String, dynamic>> getAdminStats() async {
    final response = await http.get(
      Uri.parse('$baseUrl/admin/dashboard-stats'),
      headers: headers,
    ).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load admin stats (${response.statusCode})');
  }

  /// Get Live Results and verification feed
  static Future<Map<String, dynamic>> getResults({
    String? electionType = 'GOVERNORSHIP',
    int? lgaId,
    String? status,
    String? search,
    int limit = 100,
    int skip = 0,
  }) async {
    final queryParams = <String, String>{
      'limit': limit.toString(),
      'skip': skip.toString(),
    };
    if (electionType != null && electionType.isNotEmpty) {
      queryParams['election_type'] = electionType;
    }
    if (lgaId != null) queryParams['lga_id'] = lgaId.toString();
    if (status != null && status.isNotEmpty) queryParams['status'] = status;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final uri = Uri.parse('$baseUrl/results').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load election results (${response.statusCode})');
  }

  /// Approve / Verify a submitted polling unit result
  static Future<Map<String, dynamic>> approveResult(int resultId) async {
    final uri = Uri.parse('$baseUrl/results/approve/$resultId');
    final response = await http.post(uri, headers: headers).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to approve result');
  }

  /// Flag a submitted result for over-voting or discrepancy
  static Future<Map<String, dynamic>> flagResult(int resultId, String reason) async {
    final uri = Uri.parse('$baseUrl/results/flag/$resultId');
    final response = await http.post(
      uri,
      headers: headers,
      body: json.encode({'reason': reason}),
    ).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to flag result');
  }

  /// Collation Signoffs List
  static Future<List<dynamic>> getCollationSignoffs() async {
    final uri = Uri.parse('$baseUrl/collation/signoffs');
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    return [];
  }

  /// LGA Collation Details
  static Future<Map<String, dynamic>> getLgaCollation(int lgaId) async {
    final uri = Uri.parse('$baseUrl/collation/lga/$lgaId');
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load collation for LGA $lgaId');
  }

  /// List of all 27 LGAs
  static Future<List<dynamic>> getLgas() async {
    try {
      final uri = Uri.parse('$baseUrl/admin/lgas');
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final res = json.decode(response.body);
        if (res is List) return res;
        if (res is Map && res['items'] is List) return res['items'];
      }
    } catch (_) {}

    try {
      final fallbackUri = Uri.parse('$baseUrl/electoral/lgas');
      final fallbackResp = await http.get(fallbackUri, headers: headers).timeout(const Duration(seconds: 10));
      if (fallbackResp.statusCode == 200) {
        final res = json.decode(fallbackResp.body);
        if (res is List) return res;
        if (res is Map && res['items'] is List) return res['items'];
      }
    } catch (_) {}
    return [];
  }

  /// List Wards (optionally filtered by LGA)
  static Future<List<dynamic>> getWards({int? lgaId}) async {
    String url = '$baseUrl/admin/wards';
    if (lgaId != null) url += '?lga_id=$lgaId';
    try {
      final response = await http.get(Uri.parse(url), headers: headers).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final res = json.decode(response.body);
        if (res is List) return res;
        if (res is Map && res['items'] is List) return res['items'];
      }
    } catch (_) {}

    try {
      String fallbackUrl = '$baseUrl/electoral/wards';
      if (lgaId != null) fallbackUrl += '?lga_id=$lgaId';
      final fb = await http.get(Uri.parse(fallbackUrl), headers: headers).timeout(const Duration(seconds: 10));
      if (fb.statusCode == 200) {
        final res = json.decode(fb.body);
        if (res is List) return res;
        if (res is Map && res['items'] is List) return res['items'];
      }
    } catch (_) {}
    return [];
  }

  /// List Polling Units (with search / filter)
  static Future<List<dynamic>> getPollingUnits({int? lgaId, int? wardId, String? search}) async {
    final query = <String, String>{};
    if (lgaId != null) query['lga_id'] = lgaId.toString();
    if (wardId != null) query['ward_id'] = wardId.toString();
    if (search != null && search.isNotEmpty) query['search'] = search;

    try {
      final uri = Uri.parse('$baseUrl/admin/polling-units').replace(queryParameters: query);
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 12));
      if (response.statusCode == 200) {
        final res = json.decode(response.body);
        if (res is List) return res;
        if (res is Map && res['items'] is List) return res['items'];
      }
    } catch (_) {}

    try {
      final uriFb = Uri.parse('$baseUrl/electoral/polling-units').replace(queryParameters: query);
      final fb = await http.get(uriFb, headers: headers).timeout(const Duration(seconds: 12));
      if (fb.statusCode == 200) {
        final res = json.decode(fb.body);
        if (res is List) return res;
        if (res is Map && res['items'] is List) return res['items'];
      }
    } catch (_) {}
    return [];
  }

  /// Get Incidents List
  static Future<List<dynamic>> getIncidents({
    String? status,
    String? severity,
    int? lgaId,
  }) async {
    final query = <String, String>{};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (severity != null && severity.isNotEmpty) query['severity'] = severity;
    if (lgaId != null) query['lga_id'] = lgaId.toString();

    final uri = Uri.parse('$baseUrl/incidents').replace(queryParameters: query);
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    return [];
  }

  /// Update Incident Status / Resolution
  static Future<Map<String, dynamic>> updateIncident(
    int incidentId, {
    required String status,
    String? resolutionNotes,
  }) async {
    final uri = Uri.parse('$baseUrl/incidents/$incidentId');
    final response = await http.patch(
      uri,
      headers: headers,
      body: json.encode({
        'status': status,
        if (resolutionNotes != null) 'resolution_notes': resolutionNotes,
      }),
    ).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to update incident');
  }

  /// List Field Agents & Users
  static Future<List<dynamic>> getAgents({String? status, String? search, int? lgaId}) async {
    final query = <String, String>{};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (search != null && search.isNotEmpty) query['search'] = search;
    if (lgaId != null) query['lga_id'] = lgaId.toString();

    final uri = Uri.parse('$baseUrl/agents').replace(queryParameters: query);
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    return [];
  }

  /// Create new Field Agent or Supervisor
  static Future<Map<String, dynamic>> createAgent(Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/agents');
    final response = await http.post(
      uri,
      headers: headers,
      body: json.encode(data),
    ).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    }
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to register agent');
  }

  /// Fetch System Audit Logs
  static Future<List<dynamic>> getAuditLogs({int limit = 100}) async {
    final uri = Uri.parse('$baseUrl/audit?limit=$limit');
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    return [];
  }

  /// Dispatch Broadcast Announcement from Situation Room
  static Future<Map<String, dynamic>> createBroadcast({
    required String title,
    required String message,
    String priority = 'HIGH',
    String? targetRole,
    int? lgaId,
  }) async {
    final uri = Uri.parse('$baseUrl/announcements');
    String urgency = 'Normal';
    if (priority.toUpperCase().contains('HIGH') || priority.toUpperCase().contains('CRITICAL')) {
      urgency = 'High';
    } else if (priority.toUpperCase().contains('LOW')) {
      urgency = 'Low';
    }

    final body = json.encode({
      'title': title,
      'message': message,
      'urgency': urgency,
      'target_role': targetRole ?? 'All',
      if (lgaId != null) 'target_lga_id': lgaId,
    });
    final response = await http.post(uri, headers: headers, body: body).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    }
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to send broadcast');
  }

  /// Delete a Situation Room Announcement
  static Future<void> deleteBroadcast(int announcementId) async {
    final uri = Uri.parse('$baseUrl/announcements/$announcementId');
    final response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode != 200 && response.statusCode != 204) {
      final err = json.decode(response.body);
      throw Exception(err['detail'] ?? 'Failed to delete broadcast');
    }
  }

  /// Download and trigger browser file export
  static Future<void> downloadExport(String exportPath, String filename) async {
    final cleanPath = exportPath.startsWith('/') ? exportPath : '/$exportPath';
    final uri = Uri.parse('$baseUrl$cleanPath');
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 45));
    if (response.statusCode == 200) {
      downloadBytes(response.bodyBytes, filename);
      return;
    }
    String msg = 'Export failed (${response.statusCode})';
    try {
      final err = json.decode(response.body);
      if (err is Map && err['detail'] != null) msg = err['detail'];
    } catch (_) {}
    throw Exception(msg);
  }

  // =========================================================================
  // SIDE A: SYSTEM ADMIN & ELECTORAL MASTER ENGINE
  // =========================================================================

  /// Trigger seeding of 4,827 INEC polling units
  static Future<Map<String, dynamic>> seedPollingUnits({bool force = false}) async {
    final uri = Uri.parse('$baseUrl/admin/seed-polling-units?force=$force');
    final response = await http.post(uri, headers: headers).timeout(const Duration(seconds: 45));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to seed polling units');
  }

  /// Get Electoral Hierarchy (LGAs -> Wards -> Polling Units)
  static Future<Map<String, dynamic>> getElectoralHierarchy() async {
    final uri = Uri.parse('$baseUrl/admin/electoral-hierarchy');
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    return {};
  }

  /// List Political Parties
  static Future<List<dynamic>> getParties() async {
    final uri = Uri.parse('$baseUrl/admin/parties');
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) {
      final res = json.decode(response.body);
      if (res is List) return res;
      if (res is Map && res['items'] is List) return res['items'];
    }
    return [];
  }

  /// Create Political Party
  static Future<Map<String, dynamic>> createParty(Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/admin/parties');
    final response = await http.post(uri, headers: headers, body: json.encode(data)).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    }
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to register party');
  }

  /// Delete Political Party
  static Future<void> deleteParty(int partyId) async {
    final uri = Uri.parse('$baseUrl/admin/parties/$partyId');
    final response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode != 200 && response.statusCode != 204) {
      final err = json.decode(response.body);
      throw Exception(err['detail'] ?? 'Failed to delete party');
    }
  }

  /// Get Role Permissions Matrix
  static Future<List<dynamic>> getPermissions() async {
    final uri = Uri.parse('$baseUrl/admin/permissions');
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) {
      final res = json.decode(response.body);
      if (res is List) return res;
      if (res is Map && res['items'] is List) return res['items'];
    }
    return [];
  }

  /// Update User Allowed Pages / Permissions
  static Future<Map<String, dynamic>> updateUserPermissions(int userId, List<String> allowedPages) async {
    final uri = Uri.parse('$baseUrl/admin/permissions/update');
    final response = await http.post(
      uri,
      headers: headers,
      body: json.encode({'user_id': userId, 'allowed_pages': allowedPages}),
    ).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) {
      if (currentUser != null && currentUser!['id'] == userId) {
        currentUser!['allowed_pages'] = allowedPages;
      }
      return json.decode(response.body);
    }
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to update user permissions');
  }

  /// Update Role Allowed Pages
  static Future<Map<String, dynamic>> updateRolePermissions(String role, List<String> allowedPages) async {
    final uri = Uri.parse('$baseUrl/admin/permissions/role-update');
    final response = await http.post(
      uri,
      headers: headers,
      body: json.encode({'role': role, 'allowed_pages': allowedPages}),
    ).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to update role permissions');
  }

  // --- LGA CRUD ---
  static Future<Map<String, dynamic>> createLga(Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/admin/lgas');
    final response = await http.post(uri, headers: headers, body: json.encode(data)).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200 || response.statusCode == 201) return json.decode(response.body);
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to create LGA');
  }

  static Future<Map<String, dynamic>> updateLga(int id, Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/admin/lgas/$id');
    final response = await http.patch(uri, headers: headers, body: json.encode(data)).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) return json.decode(response.body);
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to update LGA');
  }

  static Future<void> deleteLga(int id) async {
    final uri = Uri.parse('$baseUrl/admin/lgas/$id');
    final response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode != 200 && response.statusCode != 204) {
      final err = json.decode(response.body);
      throw Exception(err['detail'] ?? 'Failed to delete LGA');
    }
  }

  // --- Ward CRUD ---
  static Future<Map<String, dynamic>> createWard(Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/admin/wards');
    final response = await http.post(uri, headers: headers, body: json.encode(data)).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200 || response.statusCode == 201) return json.decode(response.body);
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to create Ward');
  }

  static Future<Map<String, dynamic>> updateWard(int id, Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/admin/wards/$id');
    final response = await http.patch(uri, headers: headers, body: json.encode(data)).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) return json.decode(response.body);
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to update Ward');
  }

  static Future<void> deleteWard(int id) async {
    final uri = Uri.parse('$baseUrl/admin/wards/$id');
    final response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode != 200 && response.statusCode != 204) {
      final err = json.decode(response.body);
      throw Exception(err['detail'] ?? 'Failed to delete Ward');
    }
  }

  // --- Polling Unit CRUD ---
  static Future<Map<String, dynamic>> createPollingUnit(Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/admin/polling-units');
    final response = await http.post(uri, headers: headers, body: json.encode(data)).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200 || response.statusCode == 201) return json.decode(response.body);
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to create Polling Unit');
  }

  static Future<Map<String, dynamic>> updatePollingUnit(int id, Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/admin/polling-units/$id');
    final response = await http.patch(uri, headers: headers, body: json.encode(data)).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) return json.decode(response.body);
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to update Polling Unit');
  }

  static Future<void> deletePollingUnit(int id) async {
    final uri = Uri.parse('$baseUrl/admin/polling-units/$id');
    final response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode != 200 && response.statusCode != 204) {
      final err = json.decode(response.body);
      throw Exception(err['detail'] ?? 'Failed to delete Polling Unit');
    }
  }

  // --- Party Update ---
  static Future<Map<String, dynamic>> updateParty(int id, Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/admin/parties/$id');
    final response = await http.patch(uri, headers: headers, body: json.encode(data)).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) return json.decode(response.body);
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to update party');
  }

  // --- User / Agent Management ---
  static Future<Map<String, dynamic>> updateUser(int id, Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl/agents/$id');
    final response = await http.patch(uri, headers: headers, body: json.encode(data)).timeout(const Duration(seconds: 12));
    if (response.statusCode == 200) return json.decode(response.body);
    final err = json.decode(response.body);
    throw Exception(err['detail'] ?? 'Failed to update user');
  }

  static Future<void> deleteUser(int id) async {
    final uri = Uri.parse('$baseUrl/agents/$id');
    final response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 12));
    if (response.statusCode != 200 && response.statusCode != 204) {
      final err = json.decode(response.body);
      throw Exception(err['detail'] ?? 'Failed to delete user');
    }
  }
}
