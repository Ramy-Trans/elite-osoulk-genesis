<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

// ─── CORS ─────────────────────────────────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key, X-User-Id, Retry-After');
header('X-Content-Type-Options: nosniff');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ─── Route Parsing ──────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Strip /api/ prefix (handles /api/ and /subdir/api/)
$scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$path      = ltrim(str_replace($scriptDir, '', $uri), '/');
$path      = trim($path, '/');

// ─── Router ────────────────────────────────────────────────────────────────
try {

// GET /health
if ($method === 'GET' && $path === 'health') {
    jsonResponse(['ok' => true, 'mode' => 'mysql', 'timestamp' => nowIso()]);
}

// GET /db-test — diagnostic endpoint (public, safe — no data exposed)
if ($method === 'GET' && $path === 'db-test') {
    $result = testDbConnection();
    jsonResponse($result, $result['ok'] ? 200 : 503);
}

// POST /admin/login (NO RATE LIMITING FOR DEPLOYMENT)
if ($method === 'POST' && $path === 'admin/login') {
    $b = getBody();
    if (($b['password'] ?? '') === ADMIN_PASSWORD) {
        jsonResponse(['token' => ADMIN_PASSWORD, 'ok' => true]);
    }
    jsonResponse(['message' => 'Invalid admin password'], 401);
}

// GET /admin/activity-log
if ($method === 'GET' && $path === 'admin/activity-log') {
    requireAdmin();
    jsonResponse(getAllRows('activity_log'));
}

// GET /stats
if ($method === 'GET' && $path === 'stats') {
    $users        = getAllRows('users');
    $subs         = getAllRows('subscribers');
    $reelReqs     = getAllRows('reel_requests');
    $userListings = getAllRows('user_listings');
    $articles     = getAllRows('articles');
    $projects     = getAllRows('public_projects');
    $views        = getAllViews();
    $totalViews   = array_sum($views);
    $STATIC       = 9;
    $approved     = count(array_filter($userListings, fn($l) => ($l['approvalStatus'] ?? '') === 'approved'));
    $now          = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    $thisMonth    = (new DateTimeImmutable('first day of this month', new DateTimeZone('UTC')))->format('c');
    $lastMonth    = (new DateTimeImmutable('first day of last month', new DateTimeZone('UTC')))->format('c');
    $endLastMonth = (new DateTimeImmutable('last day of last month 23:59:59', new DateTimeZone('UTC')))->format('c');
    $utm = count(array_filter($users, fn($u) => ($u['createdAt'] ?? '') >= $thisMonth));
    $ulm = count(array_filter($users, fn($u) => ($u['createdAt'] ?? '') >= $lastMonth && ($u['createdAt'] ?? '') <= $endLastMonth));
    $growth = null;
    if ($ulm > 0) $growth = round((($utm - $ulm) / $ulm) * 100);
    elseif ($utm > 0) $growth = 100;
    jsonResponse([
        'subscribers'     => count($subs),
        'users'           => count($users),
        'listings'        => $STATIC + $approved,
        'reels'           => count($reelReqs),
        'agencies'        => 4,
        'pendingApprovals'=> count(array_filter($reelReqs, fn($r) => ($r['status'] ?? '') === 'pending')),
        'approvedReels'   => count(array_filter($reelReqs, fn($r) => ($r['status'] ?? '') === 'approved')),
        'totalViews'      => $totalViews,
        'growth'          => $growth,
        'articles'        => count(array_filter($articles, fn($a) => ($a['status'] ?? '') === 'published')),
        'projects'        => count(array_filter($projects, fn($p) => ($p['publishStatus'] ?? '') === 'published')),
    ]);
}

// POST /subscribe
if ($method === 'POST' && $path === 'subscribe') {
    $b = getBody();
    $email = trim($b['email'] ?? '');
    $name  = trim($b['name'] ?? '');
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['message' => 'A valid email is required.'], 400);
    }
    $subs = getAllRows('subscribers');
    foreach ($subs as $s) {
        if (strtolower($s['email'] ?? '') === strtolower($email)) {
            jsonResponse(['message' => 'This email is already subscribed.'], 409);
        }
    }
    $entry = ['id' => uuid(), 'email' => $email, 'name' => $name, 'createdAt' => nowIso()];
    insertRow('subscribers', $entry);
    jsonResponse(['message' => 'Subscribed successfully!', 'subscriber' => $entry]);
}

// GET /subscribers (admin)
if ($method === 'GET' && $path === 'subscribers') {
    requireAdmin();
    jsonResponse(getAllRows('subscribers'));
}

// POST /register
if ($method === 'POST' && $path === 'register') {
    $b = getBody();
    $fullName = trim($b['fullName'] ?? '');
    $email    = trim($b['email'] ?? '');
    $phone    = trim($b['phone'] ?? '');
    $password = $b['password'] ?? '';
    $role     = $b['role'] ?? 'individual';
    $company  = trim($b['company'] ?? '');
    if (!$fullName || !$email || !$password) {
        jsonResponse(['message' => 'Full name, email, and password are required.'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['message' => 'A valid email is required.'], 400);
    }
    if (strlen($password) < 6) {
        jsonResponse(['message' => 'Password must be at least 6 characters.'], 400);
    }
    $users = getAllRows('users');
    foreach ($users as $u) {
        if (strtolower($u['email'] ?? '') === strtolower($email)) {
            jsonResponse(['message' => 'An account with this email already exists.'], 409);
        }
    }
    $user = [
        'id' => uuid(), 'fullName' => $fullName, 'email' => $email, 'phone' => $phone,
        'passwordHash' => hashPwd($password), 'plan' => 'free',
        'role' => normalizeRole($role), 'company' => $company, 'status' => 'active',
        'createdAt' => nowIso(),
    ];
    insertRow('users', $user);
    jsonResponse(['message' => 'Account created successfully!', 'user' => safeUser($user)]);
}

// POST /login
if ($method === 'POST' && $path === 'login') {
    $b = getBody();
    $email    = trim($b['email'] ?? '');
    $password = $b['password'] ?? '';
    if (!$email || !$password) jsonResponse(['message' => 'Email and password are required.'], 400);
    $users = getAllRows('users');
    $found = null;
    foreach ($users as $u) {
        if (strtolower($u['email'] ?? '') === strtolower($email)) { $found = $u; break; }
    }
    if (!$found || ($found['passwordHash'] ?? '') !== hashPwd($password)) {
        jsonResponse(['message' => 'Invalid email or password.'], 401);
    }
    if (($found['status'] ?? 'active') === 'inactive') {
        jsonResponse(['message' => 'Account is deactivated.'], 403);
    }
    logActivity(['type' => 'Access', 'event' => 'Login', 'userId' => $found['id'], 'userName' => $found['fullName']]);
    jsonResponse(['message' => 'Signed in successfully', 'user' => safeUser($found), 'token' => $found['id']]);
}

// POST /forgot-password
if ($method === 'POST' && $path === 'forgot-password') {
    $b     = getBody();
    $email = trim($b['email'] ?? '');
    if (!$email) jsonResponse(['message' => 'البريد الإلكتروني مطلوب.'], 400);
    $users = getAllRows('users');
    $found = null; $idx = -1;
    foreach ($users as $i => $u) {
        if (strtolower($u['email'] ?? '') === strtolower($email)) { $found = $u; $idx = $i; break; }
    }
    if (!$found) jsonResponse(['message' => 'لا يوجد حساب مرتبط بهذا البريد.'], 404);
    $token = strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
    $users[$idx]['resetToken']       = $token;
    $users[$idx]['resetTokenExpiry'] = date('c', time() + 3600);
    replaceAll('users', $users);
    jsonResponse(['message' => 'تم إنشاء رمز إعادة التعيين.', 'token' => $token]);
}

// POST /reset-password
if ($method === 'POST' && $path === 'reset-password') {
    $b   = getBody();
    $tok = strtoupper(trim($b['token'] ?? ''));
    $pwd = $b['newPassword'] ?? '';
    if (!$tok || !$pwd) jsonResponse(['message' => 'الرمز وكلمة المرور الجديدة مطلوبان.'], 400);
    if (strlen($pwd) < 6) jsonResponse(['message' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.'], 400);
    $users = getAllRows('users');
    $found = false;
    foreach ($users as &$u) {
        if (($u['resetToken'] ?? '') === $tok) {
            if (strtotime($u['resetTokenExpiry'] ?? '0') < time()) {
                jsonResponse(['message' => 'انتهت صلاحية الرمز.'], 400);
            }
            $u['passwordHash'] = hashPwd($pwd);
            unset($u['resetToken'], $u['resetTokenExpiry']);
            $found = true; break;
        }
    }
    unset($u);
    if (!$found) jsonResponse(['message' => 'الرمز غير صحيح.'], 400);
    replaceAll('users', $users);
    jsonResponse(['message' => 'تم تحديث كلمة المرور بنجاح.']);
}

// POST /auth/google
if ($method === 'POST' && $path === 'auth/google') {
    $b          = getBody();
    $credential = $b['credential'] ?? '';
    if (!$credential) jsonResponse(['message' => 'Missing credential'], 400);
    $resp = @file_get_contents("https://oauth2.googleapis.com/tokeninfo?id_token={$credential}");
    if (!$resp) jsonResponse(['message' => 'Invalid Google token'], 401);
    $payload = json_decode($resp, true);
    if (!($payload['email'] ?? null)) jsonResponse(['message' => 'Could not retrieve email from Google'], 401);
    $users = getAllRows('users');
    $found = null;
    foreach ($users as $u) {
        if (strtolower($u['email'] ?? '') === strtolower($payload['email'])) { $found = $u; break; }
    }
    if (!$found) {
        $found = [
            'id' => uuid(), 'fullName' => $payload['name'] ?? $payload['email'],
            'email' => $payload['email'], 'phone' => '', 'passwordHash' => null,
            'provider' => 'google', 'plan' => 'free', 'status' => 'active', 'createdAt' => nowIso(),
        ];
        insertRow('users', $found);
    }
    jsonResponse(['message' => 'Signed in with Google successfully!', 'user' => safeUser($found)]);
}

// GET /me
if ($method === 'GET' && $path === 'me') {
    $user = requireUser();
    jsonResponse(safeUser($user));
}

// PATCH /me
if ($method === 'PATCH' && $path === 'me') {
    $user  = requireUser();
    $b     = getBody();
    $users = getAllRows('users');
    foreach ($users as &$u) {
        if ($u['id'] === $user['id']) {
            if (isset($b['fullName'])) $u['fullName'] = $b['fullName'];
            if (isset($b['phone']))    $u['phone']    = $b['phone'];
            if (isset($b['company']))  $u['company']  = $b['company'];
            $user = $u; break;
        }
    }
    unset($u);
    replaceAll('users', $users);
    jsonResponse(safeUser($user));
}

// GET /users (admin)
if ($method === 'GET' && $path === 'users') {
    requireAdmin();
    $users = array_map('safeUser', getAllRows('users'));
    jsonResponse($users);
}

// PATCH /users/:id (admin)
if ($method === 'PATCH' && preg_match('#^users/([^/]+)$#', $path, $m) && !str_ends_with($path, '/reset-password')) {
    requireAdmin();
    $id    = $m[1];
    $b     = getBody();
    $users = getAllRows('users');
    $found = false;
    foreach ($users as &$u) {
        if ($u['id'] === $id) {
            $fields = ['plan','status','fullName','phone','role','company','planExpiry','isFree','featuredListings'];
            foreach ($fields as $f) {
                if (array_key_exists($f, $b)) {
                    if ($f === 'role') $u['role'] = normalizeRole($b['role']);
                    elseif ($f === 'isFree') $u['isFree'] = (bool)$b['isFree'];
                    elseif ($f === 'featuredListings') $u['featuredListings'] = (int)($b['featuredListings'] ?? 0);
                    else $u[$f] = $b[$f];
                }
            }
            $found = $u; break;
        }
    }
    unset($u);
    if (!$found) jsonResponse(['message' => 'User not found'], 404);
    replaceAll('users', $users);
    jsonResponse(safeUser($found));
}

// DELETE /users/:id (admin)
if ($method === 'DELETE' && preg_match('#^users/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id    = $m[1];
    $users = getAllRows('users');
    $new   = array_values(array_filter($users, fn($u) => $u['id'] !== $id));
    if (count($new) === count($users)) jsonResponse(['message' => 'User not found'], 404);
    replaceAll('users', $new);
    jsonResponse(['message' => 'User deleted successfully']);
}

// POST /admin/create-user
if ($method === 'POST' && $path === 'admin/create-user') {
    requireAdmin();
    $b        = getBody();
    $fullName = trim($b['fullName'] ?? '');
    $email    = trim($b['email'] ?? '');
    if (!$fullName || !$email) jsonResponse(['message' => 'Full name and email are required.'], 400);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['message' => 'A valid email is required.'], 400);
    $users = getAllRows('users');
    foreach ($users as $u) {
        if (strtolower($u['email'] ?? '') === strtolower($email)) {
            jsonResponse(['message' => 'An account with this email already exists.'], 409);
        }
    }
    $tempPwd = $b['password'] ?? (bin2hex(random_bytes(4)) . 'A1!');
    $user = [
        'id' => uuid(), 'fullName' => $fullName, 'email' => $email,
        'phone' => $b['phone'] ?? '', 'passwordHash' => hashPwd($tempPwd),
        'plan' => $b['plan'] ?? 'free', 'role' => normalizeRole($b['role'] ?? 'individual'),
        'company' => $b['company'] ?? '', 'status' => 'active',
        'createdByAdmin' => true, 'createdAt' => nowIso(),
    ];
    insertRow('users', $user);
    jsonResponse(['message' => 'User created successfully.', 'user' => safeUser($user), 'tempPassword' => $tempPwd]);
}

// PATCH /users/:id/reset-password (admin)
if ($method === 'PATCH' && preg_match('#^users/([^/]+)/reset-password$#', $path, $m)) {
    requireAdmin();
    $id    = $m[1];
    $b     = getBody();
    $users = getAllRows('users');
    $found = false;
    foreach ($users as &$u) {
        if ($u['id'] === $id) {
            $newPwd = $b['password'] ?? (bin2hex(random_bytes(4)) . 'A1!');
            $u['passwordHash'] = hashPwd($newPwd);
            $u['updatedAt']    = nowIso();
            $found = $newPwd; break;
        }
    }
    unset($u);
    if (!$found) jsonResponse(['message' => 'User not found'], 404);
    replaceAll('users', $users);
    jsonResponse(['message' => 'Password reset successfully.', 'newPassword' => $found]);
}

// POST /reel-request
if ($method === 'POST' && $path === 'reel-request') {
    $b    = getBody();
    $name = trim($b['name'] ?? '');
    $email= trim($b['email'] ?? '');
    if (!$name || !$email) jsonResponse(['message' => 'Name and email are required.'], 400);
    $entry = ['id' => uuid(), 'name' => $name, 'email' => $email, 'reason' => $b['reason'] ?? '', 'status' => 'pending', 'createdAt' => nowIso()];
    insertRow('reel_requests', $entry);
    jsonResponse(['message' => "Request submitted. We'll review and contact you."]);
}

// GET /reel-requests (admin)
if ($method === 'GET' && $path === 'reel-requests') {
    requireAdmin();
    jsonResponse(getAllRows('reel_requests'));
}

// PATCH /reel-requests/:id (admin)
if ($method === 'PATCH' && preg_match('#^reel-requests/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('reel_requests');
    $found= false;
    foreach ($rows as &$r) {
        if ($r['id'] === $id) {
            if (isset($b['status'])) $r['status'] = $b['status'];
            $r['updatedAt'] = nowIso();
            $found = $r; break;
        }
    }
    unset($r);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('reel_requests', $rows);
    jsonResponse($found);
}

// DELETE /reel-requests/:id (admin)
if ($method === 'DELETE' && preg_match('#^reel-requests/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $rows = getAllRows('reel_requests');
    replaceAll('reel_requests', array_values(array_filter($rows, fn($r) => $r['id'] !== $id)));
    jsonResponse(['message' => 'Deleted']);
}

// GET /seo
if ($method === 'GET' && $path === 'seo') {
    $defaults = [
        'home'     => ['title' => 'أصولك — وساطة عقارية فاخرة في مصر', 'description' => '', 'keywords' => ''],
        'explore'  => ['title' => 'استكشف العقارات — أصولك', 'description' => '', 'keywords' => ''],
        'articles' => ['title' => 'مقالات عقارية — أصولك', 'description' => '', 'keywords' => ''],
        'faqs'     => ['title' => 'أسئلة شائعة — أصولك', 'description' => '', 'keywords' => ''],
        'agencies' => ['title' => 'وكالات عقارية — أصولك', 'description' => '', 'keywords' => ''],
    ];
    $stored = getKv('seo', []);
    jsonResponse(array_merge($defaults, $stored));
}

// PUT /seo/:page (admin)
if ($method === 'PUT' && preg_match('#^seo/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $page   = urldecode($m[1]);
    $b      = getBody();
    $stored = getKv('seo', []);
    $stored[$page] = ['title' => $b['title'] ?? '', 'description' => $b['description'] ?? '', 'keywords' => $b['keywords'] ?? '', 'updatedAt' => nowIso()];
    setKv('seo', $stored);
    jsonResponse($stored[$page]);
}

// POST /seo (admin) — add page key
if ($method === 'POST' && $path === 'seo') {
    requireAdmin();
    $b      = getBody();
    $page   = $b['page'] ?? '';
    if (!$page) jsonResponse(['message' => 'page is required'], 400);
    $stored = getKv('seo', []);
    if (!isset($stored[$page])) { $stored[$page] = ['title' => '', 'description' => '', 'keywords' => '']; setKv('seo', $stored); }
    jsonResponse(['ok' => true]);
}

// DELETE /seo/:page (admin)
if ($method === 'DELETE' && preg_match('#^seo/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $page   = urldecode($m[1]);
    $stored = getKv('seo', []);
    unset($stored[$page]);
    setKv('seo', $stored);
    jsonResponse(['ok' => true]);
}

// POST /properties/:id/view
if ($method === 'POST' && preg_match('#^properties/([^/]+)/view$#', $path, $m)) {
    $count = incrementView($m[1]);
    jsonResponse(['views' => $count]);
}

// GET /properties/:id/views
if ($method === 'GET' && preg_match('#^properties/([^/]+)/views$#', $path, $m)) {
    jsonResponse(['views' => getViewCount($m[1])]);
}

// GET /site-settings
if ($method === 'GET' && $path === 'site-settings') {
    $defaults = [
        'brandName' => 'أصولك', 'tagline' => '', 'contactPhone' => '+201025812666',
        'contactEmail' => '', 'whatsappNumber' => '+201025812666', 'address' => '',
        'socials' => ['facebook' => '', 'instagram' => '', 'youtube' => '', 'linkedin' => '', 'tiktok' => ''],
        'hero' => ['kicker' => '', 'title' => '', 'subtitle' => ''],
        'promoBar' => ['enabled' => false, 'text' => ''],
        'features' => ['googleSignIn' => true, 'newsletter' => true, 'reels' => true, 'brokerSignup' => true, 'developerSignup' => true],
        'theme' => ['accent' => '#0ea5e9'],
    ];
    $stored = getKv('site-settings', []);
    jsonResponse(deepMerge($defaults, $stored));
}

// PUT /site-settings (admin)
if ($method === 'PUT' && $path === 'site-settings') {
    requireAdmin();
    $b      = getBody();
    $stored = getKv('site-settings', []);
    $merged = deepMerge($stored, $b);
    $merged['updatedAt'] = nowIso();
    setKv('site-settings', $merged);
    jsonResponse($merged);
}

// GET /sections
if ($method === 'GET' && $path === 'sections') {
    $sections = getAllRows('sections');
    jsonResponse(array_values(array_filter($sections, fn($s) => $s['visible'] ?? true)));
}

// GET /admin/sections (admin)
if ($method === 'GET' && $path === 'admin/sections') {
    requireAdmin();
    jsonResponse(getAllRows('sections'));
}

// PUT /sections (admin)
if ($method === 'PUT' && $path === 'sections') {
    requireAdmin();
    $b = getBody();
    if (!is_array($b)) jsonResponse(['message' => 'Array expected'], 400);
    replaceAll('sections', $b);
    jsonResponse($b);
}

// PATCH /admin/sections/:id (admin)
if ($method === 'PATCH' && preg_match('#^admin/sections/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id       = $m[1];
    $b        = getBody();
    $sections = getAllRows('sections');
    $found    = false;
    foreach ($sections as &$s) {
        if ($s['id'] === $id) {
            foreach ($b as $k => $v) { if ($k !== 'id') $s[$k] = $v; }
            $found = $s; break;
        }
    }
    unset($s);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('sections', $sections);
    jsonResponse($found);
}

// ─── Me / Inquiries ───────────────────────────────────────────────────────

// GET /me/inquiries
if ($method === 'GET' && $path === 'me/inquiries') {
    $user  = requireUser();
    $role  = $user['role'] ?? 'individual';
    $all   = getAllRows('inquiries');
    $mine  = ($role === 'broker' || $role === 'developer' || $role === 'admin')
        ? array_values(array_filter($all, fn($i) => ($i['toRole'] ?? '') === $role || ($i['fromUserId'] ?? '') === $user['id']))
        : array_values(array_filter($all, fn($i) => ($i['fromUserId'] ?? '') === $user['id']));
    jsonResponse($mine);
}

// POST /me/inquiries
if ($method === 'POST' && $path === 'me/inquiries') {
    $user = requireUser();
    $b    = getBody();
    $entry = [
        'id' => uuid(), 'fromUserId' => $user['id'], 'fromName' => $user['fullName'],
        'fromEmail' => $user['email'] ?? '', 'propertyId' => $b['propertyId'] ?? '',
        'message' => $b['message'] ?? '', 'toRole' => $b['toRole'] ?? 'broker',
        'status' => 'open', 'crmStatus' => 'new', 'notes' => [], 'createdAt' => nowIso(),
    ];
    insertRow('inquiries', $entry);
    jsonResponse($entry);
}

// PATCH /me/inquiries/:id
if ($method === 'PATCH' && preg_match('#^me/inquiries/([^/]+)$#', $path, $m)) {
    $user = requireUser();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('inquiries');
    $found= false;
    foreach ($rows as &$i) {
        if ($i['id'] === $id) {
            if (isset($b['status']))      $i['status']      = $b['status'];
            if (isset($b['crmStatus']))   $i['crmStatus']   = $b['crmStatus'];
            if (isset($b['followUpDate']))$i['followUpDate']= $b['followUpDate'];
            if (isset($b['source']))      $i['source']      = $b['source'];
            if (isset($b['note']) && $b['note']) {
                if (!isset($i['notes'])) $i['notes'] = [];
                $i['notes'][] = ['id' => uuid(), 'text' => $b['note'], 'authorName' => $user['fullName'], 'createdAt' => nowIso()];
            }
            $i['updatedAt'] = nowIso();
            $found = $i; break;
        }
    }
    unset($i);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('inquiries', $rows);
    jsonResponse($found);
}

// GET /me/leads/export
if ($method === 'GET' && $path === 'me/leads/export') {
    $user = requireUser();
    $role = $user['role'] ?? 'individual';
    $all  = getAllRows('inquiries');
    $mine = ($role === 'broker' || $role === 'developer' || $role === 'admin')
        ? array_values(array_filter($all, fn($i) => ($i['toRole'] ?? '') === $role))
        : array_values(array_filter($all, fn($i) => ($i['fromUserId'] ?? '') === $user['id']));
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="leads.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['ID','Name','Email','Property','Message','CRM Status','Follow-Up','Source','Created']);
    foreach ($mine as $i) {
        fputcsv($out, [$i['id'] ?? '', $i['fromName'] ?? '', $i['fromEmail'] ?? '', $i['propertyId'] ?? '',
            $i['message'] ?? '', $i['crmStatus'] ?? '', $i['followUpDate'] ?? '', $i['source'] ?? '', $i['createdAt'] ?? '']);
    }
    fclose($out);
    exit;
}

// ─── Me / Listings ──────────────────────────────────────────────────────

// GET /me/listings
if ($method === 'GET' && $path === 'me/listings') {
    $user = requireUser();
    $all  = getAllRows('user_listings');
    jsonResponse(array_values(array_filter($all, fn($l) => ($l['ownerId'] ?? '') === $user['id'])));
}

// POST /me/listings
if ($method === 'POST' && $path === 'me/listings') {
    $user = requireUser();
    $b    = getBody();
    $role = $user['role'] ?? 'individual';
    $limits = PLAN_LIMITS;
    $plan   = $user['plan'] ?? 'free';
    if ($role !== 'developer' && $role !== 'admin' && isset($limits[$plan])) {
        $all  = getAllRows('user_listings');
        $mine = array_filter($all, fn($l) => ($l['ownerId'] ?? '') === $user['id']);
        if (count($mine) >= $limits[$plan]) {
            jsonResponse(['message' => 'Plan limit reached. Please upgrade.', 'code' => 'limitReached'], 403);
        }
    }
    $entry = array_merge($b, [
        'id' => uuid(), 'ownerId' => $user['id'], 'ownerName' => $user['fullName'],
        'ownerRole' => $role, 'ownerPhone' => $user['phone'] ?? '',
        'approvalStatus' => 'pending', 'createdAt' => nowIso(), 'updatedAt' => nowIso(),
    ]);
    insertRow('user_listings', $entry);
    jsonResponse($entry);
}

// PATCH /me/listings/:id
if ($method === 'PATCH' && preg_match('#^me/listings/([^/]+)$#', $path, $m)) {
    $user = requireUser();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('user_listings');
    $found= false;
    foreach ($rows as &$l) {
        if ($l['id'] === $id && ($l['ownerId'] ?? '') === $user['id']) {
            foreach ($b as $k => $v) { if (!in_array($k, ['id','ownerId','createdAt'])) $l[$k] = $v; }
            $l['updatedAt'] = nowIso();
            $found = $l; break;
        }
    }
    unset($l);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('user_listings', $rows);
    jsonResponse($found);
}

// DELETE /me/listings/:id
if ($method === 'DELETE' && preg_match('#^me/listings/([^/]+)$#', $path, $m)) {
    $user = requireUser();
    $id   = $m[1];
    $rows = getAllRows('user_listings');
    $new  = array_values(array_filter($rows, fn($l) => !($l['id'] === $id && ($l['ownerId'] ?? '') === $user['id'])));
    replaceAll('user_listings', $new);
    jsonResponse(['message' => 'Deleted']);
}

// ─── Me / Projects (developer) ──────────────────────────────────────────

// GET /me/projects
if ($method === 'GET' && $path === 'me/projects') {
    $user = requireUser();
    $all  = getAllRows('dev_projects');
    jsonResponse(array_values(array_filter($all, fn($p) => ($p['developerId'] ?? '') === $user['id'])));
}

// POST /me/projects
if ($method === 'POST' && $path === 'me/projects') {
    $user  = requireUser();
    $b     = getBody();
    $entry = array_merge($b, ['id' => uuid(), 'developerId' => $user['id'], 'developerName' => $user['fullName'], 'createdAt' => nowIso()]);
    insertRow('dev_projects', $entry);
    jsonResponse($entry);
}

// PATCH /me/projects/:id
if ($method === 'PATCH' && preg_match('#^me/projects/([^/]+)$#', $path, $m)) {
    $user = requireUser();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('dev_projects');
    $found= false;
    foreach ($rows as &$p) {
        if ($p['id'] === $id && ($p['developerId'] ?? '') === $user['id']) {
            foreach ($b as $k => $v) { if ($k !== 'id') $p[$k] = $v; }
            $found = $p; break;
        }
    }
    unset($p);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('dev_projects', $rows);
    jsonResponse($found);
}

// DELETE /me/projects/:id
if ($method === 'DELETE' && preg_match('#^me/projects/([^/]+)$#', $path, $m)) {
    $user = requireUser();
    $id   = $m[1];
    $rows = getAllRows('dev_projects');
    replaceAll('dev_projects', array_values(array_filter($rows, fn($p) => !($p['id'] === $id && ($p['developerId'] ?? '') === $user['id']))));
    jsonResponse(['message' => 'Deleted']);
}

// ─── Me / Saved Properties ────────────────────────────────────────────────

// GET /me/saved-properties
if ($method === 'GET' && $path === 'me/saved-properties') {
    $user = requireUser();
    $all  = getKv('saved-properties', []);
    jsonResponse($all[$user['id']] ?? []);
}

// POST /me/saved-properties
if ($method === 'POST' && $path === 'me/saved-properties') {
    $user = requireUser();
    $b    = getBody();
    $all  = getKv('saved-properties', []);
    $uid  = $user['id'];
    if (!isset($all[$uid])) $all[$uid] = [];
    $pid  = $b['propertyId'] ?? '';
    if ($pid && !in_array($pid, array_column($all[$uid], 'propertyId'))) {
        $all[$uid][] = ['id' => uuid(), 'propertyId' => $pid, 'savedAt' => nowIso()];
    }
    setKv('saved-properties', $all);
    jsonResponse($all[$uid]);
}

// DELETE /me/saved-properties/:id
if ($method === 'DELETE' && preg_match('#^me/saved-properties/([^/]+)$#', $path, $m)) {
    $user = requireUser();
    $id   = $m[1];
    $all  = getKv('saved-properties', []);
    $uid  = $user['id'];
    if (isset($all[$uid])) {
        $all[$uid] = array_values(array_filter($all[$uid], fn($s) => $s['id'] !== $id && $s['propertyId'] !== $id));
    }
    setKv('saved-properties', $all);
    jsonResponse($all[$uid] ?? []);
}

// ─── Me / Saved Searches ────────────────────────────────────────────────

// GET /me/saved-searches
if ($method === 'GET' && $path === 'me/saved-searches') {
    $user = requireUser();
    $all  = getKv('saved-searches', []);
    jsonResponse($all[$user['id']] ?? []);
}

// POST /me/saved-searches
if ($method === 'POST' && $path === 'me/saved-searches') {
    $user  = requireUser();
    $b     = getBody();
    $all   = getKv('saved-searches', []);
    $uid   = $user['id'];
    if (!isset($all[$uid])) $all[$uid] = [];
    $entry = ['id' => uuid(), 'name' => $b['name'] ?? 'Search', 'filters' => $b['filters'] ?? [], 'alertFrequency' => $b['alertFrequency'] ?? 'instant', 'paused' => false, 'createdAt' => nowIso()];
    $all[$uid][] = $entry;
    setKv('saved-searches', $all);
    jsonResponse($entry);
}

// PATCH /me/saved-searches/:id
if ($method === 'PATCH' && preg_match('#^me/saved-searches/([^/]+)$#', $path, $m)) {
    $user  = requireUser();
    $id    = $m[1];
    $b     = getBody();
    $all   = getKv('saved-searches', []);
    $uid   = $user['id'];
    $found = false;
    foreach (($all[$uid] ?? []) as &$s) {
        if ($s['id'] === $id) {
            foreach ($b as $k => $v) { if ($k !== 'id') $s[$k] = $v; }
            $s['updatedAt'] = nowIso();
            $found = $s; break;
        }
    }
    unset($s);
    setKv('saved-searches', $all);
    jsonResponse($found ?: ['message' => 'Not found']);
}

// DELETE /me/saved-searches/:id
if ($method === 'DELETE' && preg_match('#^me/saved-searches/([^/]+)$#', $path, $m)) {
    $user = requireUser();
    $id   = $m[1];
    $all  = getKv('saved-searches', []);
    $uid  = $user['id'];
    if (isset($all[$uid])) {
        $all[$uid] = array_values(array_filter($all[$uid], fn($s) => $s['id'] !== $id));
    }
    setKv('saved-searches', $all);
    jsonResponse(['ok' => true]);
}

// ─── Me / Notifications ────────────────────────────────────────────────────

// GET /me/notifications
if ($method === 'GET' && $path === 'me/notifications') {
    $user = requireUser();
    $all  = getKv('notifications', []);
    jsonResponse(array_reverse($all[$user['id']] ?? []));
}

// PATCH /me/notifications/read-all
if ($method === 'PATCH' && $path === 'me/notifications/read-all') {
    $user = requireUser();
    $all  = getKv('notifications', []);
    $uid  = $user['id'];
    foreach (($all[$uid] ?? []) as &$n) { $n['read'] = true; }
    unset($n);
    setKv('notifications', $all);
    jsonResponse(['ok' => true]);
}

// PATCH /me/notifications/:id/read
if ($method === 'PATCH' && preg_match('#^me/notifications/([^/]+)/read$#', $path, $m)) {
    $user = requireUser();
    $id   = $m[1];
    $all  = getKv('notifications', []);
    $uid  = $user['id'];
    foreach (($all[$uid] ?? []) as &$n) { if ($n['id'] === $id) { $n['read'] = true; break; } }
    unset($n);
    setKv('notifications', $all);
    jsonResponse(['ok' => true]);
}

// DELETE /me/notifications/:id
if ($method === 'DELETE' && preg_match('#^me/notifications/([^/]+)$#', $path, $m)) {
    $user = requireUser();
    $id   = $m[1];
    $all  = getKv('notifications', []);
    $uid  = $user['id'];
    if (isset($all[$uid])) {
        $all[$uid] = array_values(array_filter($all[$uid], fn($n) => $n['id'] !== $id));
    }
    setKv('notifications', $all);
    jsonResponse(['ok' => true]);
}

// GET /me/alert-settings
if ($method === 'GET' && $path === 'me/alert-settings') {
    $user = requireUser();
    $all  = getKv('alert-settings', []);
    jsonResponse($all[$user['id']] ?? ['emailFrequency' => 'instant', 'inApp' => true]);
}

// PUT /me/alert-settings
if ($method === 'PUT' && $path === 'me/alert-settings') {
    $user = requireUser();
    $b    = getBody();
    $all  = getKv('alert-settings', []);
    $all[$user['id']] = array_merge($all[$user['id']] ?? [], $b);
    setKv('alert-settings', $all);
    jsonResponse($all[$user['id']]);
}

// ─── Public Listings ────────────────────────────────────────────────────────

// GET /listings (public — approved only)
if ($method === 'GET' && $path === 'listings') {
    $all = getAllRows('user_listings');
    jsonResponse(array_values(array_filter($all, fn($l) => ($l['approvalStatus'] ?? '') === 'approved')));
}

// GET /listings/all (admin)
if ($method === 'GET' && $path === 'listings/all') {
    requireAdmin();
    jsonResponse(getAllRows('user_listings'));
}

// GET /listings/:id
if ($method === 'GET' && preg_match('#^listings/([^/]+)$#', $path, $m) && $m[1] !== 'all') {
    $id  = $m[1];
    $all = getAllRows('user_listings');
    foreach ($all as $l) {
        if ($l['id'] === $id) jsonResponse($l);
    }
    jsonResponse(['message' => 'Not found'], 404);
}

// PATCH /listings/:id/approval (admin)
if ($method === 'PATCH' && preg_match('#^listings/([^/]+)/approval$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('user_listings');
    $found= false;
    foreach ($rows as &$l) {
        if ($l['id'] === $id) {
            $l['approvalStatus'] = $b['status'] ?? $l['approvalStatus'];
            $l['updatedAt']      = nowIso();
            $found = $l; break;
        }
    }
    unset($l);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('user_listings', $rows);
    jsonResponse($found);
}

// POST /admin/listings (admin)
if ($method === 'POST' && $path === 'admin/listings') {
    requireAdmin();
    $b     = getBody();
    $entry = array_merge($b, ['id' => uuid(), 'approvalStatus' => 'approved', 'createdAt' => nowIso(), 'updatedAt' => nowIso()]);
    insertRow('user_listings', $entry);
    jsonResponse($entry);
}

// PUT /admin/listings/:id (admin)
if ($method === 'PUT' && preg_match('#^admin/listings/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('user_listings');
    $found= false;
    foreach ($rows as &$l) {
        if ($l['id'] === $id) {
            foreach ($b as $k => $v) { if (!in_array($k, ['id','createdAt'])) $l[$k] = $v; }
            $l['updatedAt'] = nowIso();
            $found = $l; break;
        }
    }
    unset($l);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('user_listings', $rows);
    jsonResponse($found);
}

// DELETE /listings/:id (admin)
if ($method === 'DELETE' && preg_match('#^listings/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $rows = getAllRows('user_listings');
    replaceAll('user_listings', array_values(array_filter($rows, fn($l) => $l['id'] !== $id)));
    jsonResponse(['ok' => true]);
}

// ─── Analytics (admin) ────────────────────────────────────────────────────────

if ($method === 'GET' && $path === 'analytics') {
    requireAdmin();
    $users    = getAllRows('users');
    $inquiries= getAllRows('inquiries');
    $views    = getAllViews();
    $listings = getAllRows('user_listings');
    $now      = time();
    $days30   = [];
    for ($i = 29; $i >= 0; $i--) {
        $d   = date('Y-m-d', $now - $i * 86400);
        $lbl = date('n/j', $now - $i * 86400);
        $days30[] = ['label' => $lbl, 'users' => count(array_filter($users, fn($u) => substr($u['createdAt'] ?? '', 0, 10) === $d))];
    }
    $leadsChart = [];
    for ($i = 29; $i >= 0; $i--) {
        $d = date('Y-m-d', $now - $i * 86400);
        $leadsChart[] = ['label' => date('n/j', $now - $i * 86400), 'leads' => count(array_filter($inquiries, fn($q) => substr($q['createdAt'] ?? '', 0, 10) === $d))];
    }
    arsort($views);
    $topProps = [];
    foreach (array_slice($views, 0, 8, true) as $id => $count) { $topProps[] = ['id' => $id, 'views' => $count]; }
    $planChart = []; $planCounts = [];
    foreach ($users as $u) { $p = $u['plan'] ?? 'free'; $planCounts[$p] = ($planCounts[$p] ?? 0) + 1; }
    foreach ($planCounts as $n => $v) { $planChart[] = ['name' => $n, 'value' => $v]; }
    $roleChart = []; $roleCounts = [];
    foreach ($users as $u) { $r = $u['role'] ?? 'individual'; $roleCounts[$r] = ($roleCounts[$r] ?? 0) + 1; }
    foreach ($roleCounts as $n => $v) { $roleChart[] = ['name' => $n, 'value' => $v]; }
    $stages = ['new','contacted','interested','viewing','negotiation','closed','sold'];
    $crmFunnel = array_map(fn($s) => ['stage' => $s, 'count' => count(array_filter($inquiries, fn($q) => ($q['crmStatus'] ?? 'new') === $s))], $stages);
    jsonResponse([
        'userGrowth'  => $days30, 'leadsChart' => $leadsChart,
        'topProperties'=> $topProps, 'planChart' => $planChart, 'roleChart' => $roleChart,
        'crmFunnel'   => $crmFunnel,
        'listingStatus'=> [
            'pending'  => count(array_filter($listings, fn($l) => ($l['approvalStatus'] ?? '') === 'pending')),
            'approved' => count(array_filter($listings, fn($l) => ($l['approvalStatus'] ?? '') === 'approved')),
            'rejected' => count(array_filter($listings, fn($l) => ($l['approvalStatus'] ?? '') === 'rejected')),
        ],
        'totals' => ['users' => count($users), 'leads' => count($inquiries), 'listings' => count($listings), 'totalViews' => array_sum($views)],
    ]);
}

// ─── Articles ───────────────────────────────────────────────────────────────

if ($method === 'GET' && $path === 'articles') {
    $all    = getAllRows('articles');
    $status = $_GET['status'] ?? null;
    jsonResponse($status ? array_values(array_filter($all, fn($a) => ($a['status'] ?? '') === $status)) : $all);
}

if ($method === 'GET' && preg_match('#^articles/([^/]+)$#', $path, $m)) {
    $id  = $m[1];
    $all = getAllRows('articles');
    foreach ($all as $a) {
        if ($a['id'] === $id || ($a['slug'] ?? '') === $id) jsonResponse($a);
    }
    jsonResponse(['message' => 'Article not found'], 404);
}

if ($method === 'POST' && $path === 'articles') {
    requireAdmin();
    $b      = getBody();
    $title  = $b['title'] ?? ($b['titleAr'] ?? '');
    if (!$title) jsonResponse(['message' => 'Title is required.'], 400);
    $articles  = getAllRows('articles');
    $baseSlug  = $b['slug'] ?? preg_replace('/[^a-z0-9]+/', '-', strtolower($title)) ?: 'article-' . time();
    $slug      = in_array($baseSlug, array_column($articles, 'slug')) ? $baseSlug . '-' . time() : $baseSlug;
    $words     = str_word_count(strip_tags($b['content'] ?? ($b['contentAr'] ?? '')));
    $entry = array_merge($b, [
        'id' => uuid(), 'slug' => $slug, 'status' => $b['status'] ?? 'draft',
        'readingTime' => max(1, (int)ceil($words / 200)),
        'createdAt' => nowIso(), 'updatedAt' => nowIso(),
    ]);
    insertRow('articles', $entry);
    jsonResponse($entry);
}

if ($method === 'PUT' && preg_match('#^articles/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('articles');
    $found= false;
    foreach ($rows as &$a) {
        if ($a['id'] === $id) {
            $words = str_word_count(strip_tags($b['content'] ?? ($a['content'] ?? '')));
            $a = array_merge($a, $b, ['id' => $id, 'createdAt' => $a['createdAt'], 'updatedAt' => nowIso(), 'readingTime' => max(1, (int)ceil($words / 200))]);
            $found = $a; break;
        }
    }
    unset($a);
    if (!$found) jsonResponse(['message' => 'Article not found'], 404);
    replaceAll('articles', $rows);
    jsonResponse($found);
}

if ($method === 'DELETE' && preg_match('#^articles/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $rows = getAllRows('articles');
    replaceAll('articles', array_values(array_filter($rows, fn($a) => $a['id'] !== $id)));
    jsonResponse(['message' => 'Deleted']);
}

// ─── FAQs ───────────────────────────────────────────────────────────────────

if ($method === 'GET' && $path === 'faqs') {
    jsonResponse(getAllRows('faqs'));
}

if ($method === 'POST' && $path === 'faqs') {
    requireAdmin();
    $b = getBody();
    if (!($b['questionAr'] ?? '') || !($b['answerAr'] ?? '')) {
        jsonResponse(['message' => 'Arabic question and answer are required.'], 400);
    }
    $entry = array_merge($b, ['id' => uuid(), 'createdAt' => nowIso(), 'updatedAt' => nowIso()]);
    insertRow('faqs', $entry);
    jsonResponse($entry);
}

if ($method === 'PUT' && preg_match('#^faqs/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('faqs');
    $found= false;
    foreach ($rows as &$f) {
        if ($f['id'] === $id) {
            $f = array_merge($f, $b, ['id' => $id, 'updatedAt' => nowIso()]);
            $found = $f; break;
        }
    }
    unset($f);
    if (!$found) jsonResponse(['message' => 'FAQ not found'], 404);
    replaceAll('faqs', $rows);
    jsonResponse($found);
}

if ($method === 'DELETE' && preg_match('#^faqs/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    replaceAll('faqs', array_values(array_filter(getAllRows('faqs'), fn($f) => $f['id'] !== $id)));
    jsonResponse(['message' => 'Deleted']);
}

// ─── Public Projects / Compounds ──────────────────────────────────────────────

if ($method === 'GET' && $path === 'projects') {
    $all = getAllRows('public_projects');
    $pub = array_values(array_filter($all, fn($p) => !isset($p['publishStatus']) || $p['publishStatus'] === 'published'));
    usort($pub, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
    jsonResponse($pub);
}

if ($method === 'GET' && $path === 'admin/projects') {
    requireAdmin();
    jsonResponse(getAllRows('public_projects'));
}

if ($method === 'GET' && preg_match('#^projects/([^/]+)$#', $path, $m)) {
    $id  = $m[1];
    $all = getAllRows('public_projects');
    foreach ($all as $p) {
        if ($p['id'] === $id || ($p['slug'] ?? '') === $id) jsonResponse($p);
    }
    jsonResponse(['message' => 'Not found'], 404);
}

if ($method === 'POST' && $path === 'admin/projects') {
    requireAdmin();
    $b    = getBody();
    $all  = getAllRows('public_projects');
    $raw  = preg_replace('/[^a-z0-9-]/', '', strtolower(str_replace(' ', '-', $b['slug'] ?? ($b['name'] ?? 'project'))));
    $slug = in_array($raw, array_column($all, 'slug')) ? $raw . '-' . time() : $raw;
    $entry = array_merge($b, ['id' => uuid(), 'slug' => $slug, 'order' => $b['order'] ?? count($all), 'createdAt' => nowIso(), 'updatedAt' => nowIso()]);
    insertRow('public_projects', $entry);
    jsonResponse($entry);
}

if ($method === 'PUT' && preg_match('#^admin/projects/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('public_projects');
    $found= false;
    foreach ($rows as &$p) {
        if ($p['id'] === $id) {
            foreach ($b as $k => $v) { if (!in_array($k, ['id','createdAt'])) $p[$k] = $v; }
            $p['updatedAt'] = nowIso();
            $found = $p; break;
        }
    }
    unset($p);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('public_projects', $rows);
    jsonResponse($found);
}

if ($method === 'DELETE' && preg_match('#^admin/projects/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id = $m[1];
    replaceAll('public_projects', array_values(array_filter(getAllRows('public_projects'), fn($p) => $p['id'] !== $id)));
    jsonResponse(['message' => 'Deleted']);
}

// ─── CMS Pages ──────────────────────────────────────────────────────────────

if ($method === 'GET' && $path === 'pages') {
    $all = getAllRows('pages');
    jsonResponse(array_values(array_filter($all, fn($p) => !isset($p['publishStatus']) || $p['publishStatus'] === 'published')));
}

if ($method === 'GET' && $path === 'admin/pages') {
    requireAdmin();
    jsonResponse(getAllRows('pages'));
}

if ($method === 'GET' && preg_match('#^pages/([^/]+)$#', $path, $m)) {
    $id  = $m[1];
    $all = getAllRows('pages');
    foreach ($all as $p) {
        if ($p['id'] === $id || ($p['slug'] ?? '') === $id) jsonResponse($p);
    }
    jsonResponse(['message' => 'Not found'], 404);
}

if ($method === 'POST' && $path === 'admin/pages') {
    requireAdmin();
    $b    = getBody();
    $all  = getAllRows('pages');
    $base = preg_replace('/[^a-z0-9-]/', '', str_replace(' ', '-', strtolower($b['slug'] ?? ($b['title'] ?? ''))));
    $slug = $base ?: 'page-' . substr(uuid(), 0, 8);
    foreach ($all as $p) {
        if (($p['slug'] ?? '') === $slug) jsonResponse(['message' => 'A page with this slug already exists.'], 409);
    }
    $entry = array_merge($b, ['id' => uuid(), 'slug' => $slug, 'publishStatus' => $b['publishStatus'] ?? 'draft', 'createdAt' => nowIso(), 'updatedAt' => nowIso()]);
    insertRow('pages', $entry);
    jsonResponse($entry);
}

if ($method === 'PUT' && preg_match('#^admin/pages/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('pages');
    $found= false;
    foreach ($rows as &$p) {
        if ($p['id'] === $id) {
            foreach ($b as $k => $v) { if (!in_array($k, ['id','createdAt'])) $p[$k] = $v; }
            $p['updatedAt'] = nowIso();
            $found = $p; break;
        }
    }
    unset($p);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('pages', $rows);
    jsonResponse($found);
}

if ($method === 'DELETE' && preg_match('#^admin/pages/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id = $m[1];
    replaceAll('pages', array_values(array_filter(getAllRows('pages'), fn($p) => $p['id'] !== $id)));
    jsonResponse(['message' => 'Deleted']);
}

// ─── HTML Snippets ──────────────────────────────────────────────────────────

if ($method === 'GET' && $path === 'html-snippets') {
    $all = getAllRows('html_snippets');
    jsonResponse(array_values(array_filter($all, fn($s) => $s['enabled'] ?? true)));
}

if ($method === 'GET' && $path === 'admin/html-snippets') {
    requireAdmin();
    jsonResponse(getAllRows('html_snippets'));
}

if ($method === 'POST' && $path === 'admin/html-snippets') {
    requireAdmin();
    $b     = getBody();
    $entry = ['id' => uuid(), 'name' => $b['name'] ?? 'Snippet', 'html' => $b['html'] ?? '', 'placement' => $b['placement'] ?? 'body-end', 'enabled' => $b['enabled'] ?? true, 'createdAt' => nowIso()];
    insertRow('html_snippets', $entry);
    jsonResponse($entry);
}

if ($method === 'PUT' && preg_match('#^admin/html-snippets/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('html_snippets');
    $found= false;
    foreach ($rows as &$s) {
        if ($s['id'] === $id) {
            foreach (['name','html','placement','enabled'] as $k) { if (array_key_exists($k, $b)) $s[$k] = $b[$k]; }
            $found = $s; break;
        }
    }
    unset($s);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('html_snippets', $rows);
    jsonResponse($found);
}

if ($method === 'DELETE' && preg_match('#^admin/html-snippets/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id = $m[1];
    replaceAll('html_snippets', array_values(array_filter(getAllRows('html_snippets'), fn($s) => $s['id'] !== $id)));
    jsonResponse(['message' => 'Deleted']);
}

// ─── Text Content ───────────────────────────────────────────────────────────

if ($method === 'GET' && $path === 'text-content') {
    $defaults = [
        'hero'   => ['kicker' => 'المنصة العقارية الفاخرة في مصر', 'title' => 'اعثر على عقار أحلامك في مصر.', 'subtitle' => 'تجربة عقارية فاخرة'],
        'navbar' => ['explore' => 'استكشف', 'sell' => 'بيع', 'reels' => 'فيديوهات', 'agencies' => 'وكالات', 'packages' => 'الباقات'],
        'footer' => ['tagline' => 'منصة أصولك — وساطة عقارية فاخرة في مصر', 'copy' => '© 2026 أصولك.'],
    ];
    $stored = getKv('text-content', []);
    jsonResponse(deepMerge($defaults, $stored));
}

if ($method === 'PUT' && $path === 'text-content') {
    requireAdmin();
    $b      = getBody();
    $stored = getKv('text-content', []);
    $merged = deepMerge($stored, $b);
    $merged['updatedAt'] = nowIso();
    setKv('text-content', $merged);
    jsonResponse($merged);
}

// ─── Section SEO ────────────────────────────────────────────────────────────

if ($method === 'GET' && $path === 'section-seo') {
    jsonResponse(getKv('section-seo', []));
}

if ($method === 'PUT' && $path === 'section-seo') {
    requireAdmin();
    $b = getBody();
    setKv('section-seo', $b ?: []);
    jsonResponse($b ?: []);
}

// ─── Media Upload ───────────────────────────────────────────────────────────

if ($method === 'POST' && $path === 'admin/upload-media') {
    requireAdmin();
    $b      = getBody();
    $dataUrl= $b['dataUrl'] ?? '';
    if (!$dataUrl || !str_starts_with($dataUrl, 'data:')) jsonResponse(['message' => 'Invalid data URL'], 400);
    if (!preg_match('#^data:([^;]+);base64,(.+)$#', $dataUrl, $matches)) jsonResponse(['message' => 'Malformed data URL'], 400);
    $mime   = $matches[1];
    $ext    = explode('/', $mime)[1] ?? 'jpg';
    if ($ext === 'jpeg') $ext = 'jpg';
    $buffer = base64_decode($matches[2]);
    if (strlen($buffer) > 5 * 1024 * 1024) jsonResponse(['message' => 'File exceeds 5 MB limit'], 413);
    $mediaDir = dirname(__DIR__) . '/media';
    if (!is_dir($mediaDir)) mkdir($mediaDir, 0755, true);
    $safe   = preg_replace('/[^a-zA-Z0-9_-]/', '_', substr($b['filename'] ?? 'upload', 0, 40));
    $fname  = $safe . '_' . time() . '.' . $ext;
    file_put_contents($mediaDir . '/' . $fname, $buffer);
    jsonResponse(['url' => '/media/' . $fname]);
}

// ─── Media Gallery ──────────────────────────────────────────────────────────

if ($method === 'GET' && $path === 'admin/media') {
    requireAdmin();
    jsonResponse(getAllRows('media'));
}

if ($method === 'POST' && $path === 'admin/media') {
    requireAdmin();
    $b = getBody();
    if (!($b['url'] ?? '')) jsonResponse(['message' => 'url is required'], 400);
    $item = array_merge($b, ['id' => uuid(), 'url' => trim($b['url']), 'createdAt' => nowIso()]);
    $all  = getAllRows('media');
    array_unshift($all, $item);
    replaceAll('media', $all);
    jsonResponse($item, 201);
}

if ($method === 'PUT' && preg_match('#^admin/media/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id   = $m[1];
    $b    = getBody();
    $rows = getAllRows('media');
    $found= false;
    foreach ($rows as &$item) {
        if ($item['id'] === $id) {
            $item = array_merge($item, $b, ['id' => $id, 'updatedAt' => nowIso()]);
            $found = $item; break;
        }
    }
    unset($item);
    if (!$found) jsonResponse(['message' => 'Not found'], 404);
    replaceAll('media', $rows);
    jsonResponse($found);
}

if ($method === 'DELETE' && preg_match('#^admin/media/([^/]+)$#', $path, $m)) {
    requireAdmin();
    $id = $m[1];
    replaceAll('media', array_values(array_filter(getAllRows('media'), fn($m) => $m['id'] !== $id)));
    jsonResponse(['ok' => true]);
}

// ─── Server logs (stub) ──────────────────────────────────────────────────────

if ($method === 'GET' && $path === 'server/logs') {
    requireAdmin();
    jsonResponse([['time' => nowIso(), 'level' => 'info', 'msg' => 'PHP backend running on Hostinger']]);
}

// ─── 404 ────────────────────────────────────────────────────────────────────
jsonResponse(['message' => "API endpoint not found: {$method} /{$path}"], 404);

} catch (PDOException $e) {
    jsonResponse(['message' => 'Database error: ' . $e->getMessage()], 500);
} catch (Throwable $e) {
    jsonResponse(['message' => 'Server error: ' . $e->getMessage()], 500);
}
