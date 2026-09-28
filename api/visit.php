<?php
/* =====================================================================
   XIRAIYA — new visitor → a Telegram message to the site owner.
   assets/js/core.js pings this once per browser (the first visit), and only
   on the live domain. The bot token is NOT in this repository: it is read
   from xr-telegram.php one folder above public_html (never web-reachable),
   or from api/.telegram.php (a dot-file, which .htaccess never serves).
   See DEPLOY.md, "Telegram visitor alerts".
   Bots, link-preview crawlers and automated browsers are ignored; one alert
   per visitor per 12 hours, at most 120 an hour; no IP address is sent.
   ===================================================================== */
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function done($code) { http_response_code($code); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') done(405);

/* only pings sent by the site's own pages */
$host = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
$src = (string) ($_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? ''));
$from = strtolower((string) parse_url($src, PHP_URL_HOST));
if ($host === '' || $from !== $host) done(403);

$ua = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 400);
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|skype|curl|wget|python|java\/|headless|lighthouse|pingdom|monitor|scan/i', $ua)) done(204);

/* the token and chat id live outside the repository */
$cfg = null;
foreach (array(dirname(__DIR__, 2) . '/xr-telegram.php', __DIR__ . '/.telegram.php') as $f) {
  if (is_file($f)) { $cfg = include $f; break; }
}
if (!is_array($cfg) || empty($cfg['token']) || empty($cfg['chat'])) done(204);

/* one alert per visitor per 12 hours, at most 120 an hour (behind the CDN the visitor's
   address is the first in X-Forwarded-For; it is only hashed here, never stored or sent) */
$ip = trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ($_SERVER['REMOTE_ADDR'] ?? '')))[0]);
$key = substr(hash('sha256', $ip . '|' . $ua), 0, 16);
$now = time();
$fh = @fopen(sys_get_temp_dir() . '/xr-visits-' . substr(hash('sha256', __DIR__), 0, 10) . '.json', 'c+');
if ($fh) {
  flock($fh, LOCK_EX);
  $db = json_decode((string) stream_get_contents($fh), true);
  if (!is_array($db)) $db = array();
  foreach ($db as $k => $t) if (!is_int($t) || $now - $t >= 43200) unset($db[$k]);
  $hour = 0;
  foreach ($db as $t) if ($now - $t < 3600) $hour++;
  $seen = isset($db[$key]) || $hour >= 120;
  if (!$seen) { $db[$key] = $now; ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($db)); fflush($fh); }
  flock($fh, LOCK_UN); fclose($fh);
  if ($seen) done(204);
}

/* what the page sent: where they landed, where they came from, their screen and language */
$in = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($in)) $in = $_POST;
function clip($v, $n) {
  $v = trim(preg_replace('/[\x00-\x1F\x7F]+/', ' ', (string) $v));
  return function_exists('mb_substr') ? mb_substr($v, 0, $n, 'UTF-8') : substr($v, 0, $n);
}
function esc($v) { return htmlspecialchars($v, ENT_QUOTES, 'UTF-8'); }
$page = clip(isset($in['page']) ? $in['page'] : '/', 120);
$ref = clip(isset($in['ref']) ? $in['ref'] : '', 300);
$refHost = $ref !== '' ? strtolower((string) parse_url($ref, PHP_URL_HOST)) : '';
if ($refHost === $host) $refHost = '';
$lang = clip(isset($in['lang']) ? $in['lang'] : '', 20);
$tz = clip(isset($in['tz']) ? $in['tz'] : '', 40);
$scr = clip(isset($in['scr']) ? $in['scr'] : '', 20);

$os = preg_match('/iPhone/', $ua) ? 'iPhone' : (preg_match('/iPad/', $ua) ? 'iPad' : (preg_match('/Android/', $ua) ? 'Android' :
  (preg_match('/Windows/', $ua) ? 'Windows' : (preg_match('/Mac OS X/', $ua) ? 'Mac' : (preg_match('/Linux|CrOS/', $ua) ? 'Linux' : 'Other')))));
$br = preg_match('/Edg\//', $ua) ? 'Edge' : (preg_match('/OPR\//', $ua) ? 'Opera' : (preg_match('/SamsungBrowser/', $ua) ? 'Samsung Internet' :
  (preg_match('/CriOS|Chrome\//', $ua) ? 'Chrome' : (preg_match('/FxiOS|Firefox\//', $ua) ? 'Firefox' : (preg_match('/Safari\//', $ua) ? 'Safari' : 'Browser')))));

/* a country code, when the host or CDN adds one */
$cc = '';
foreach (array('HTTP_CF_IPCOUNTRY', 'HTTP_X_COUNTRY_CODE', 'HTTP_X_GEO_COUNTRY', 'GEOIP_COUNTRY_CODE') as $h) {
  if (!empty($_SERVER[$h]) && preg_match('/^[A-Za-z]{2}$/', $_SERVER[$h])) { $cc = strtoupper($_SERVER[$h]); break; }
}
/* the flag emoji: two regional-indicator letters, written out as UTF-8 */
function u8($c) { return chr(0xF0 | ($c >> 18)) . chr(0x80 | (($c >> 12) & 0x3F)) . chr(0x80 | (($c >> 6) & 0x3F)) . chr(0x80 | ($c & 0x3F)); }
$flag = $cc !== '' ? u8(127397 + ord($cc[0])) . u8(127397 + ord($cc[1])) . ' ' . $cc : '';

try { $when = (new DateTime('now', new DateTimeZone('Asia/Dhaka')))->format('j M Y, H:i') . ' (Dhaka)'; } catch (Exception $e) { $when = gmdate('j M Y, H:i') . ' UTC'; }

$lines = array(
  '🆕 <b>New visitor</b> · ' . esc($host),
  '📄 Page: <code>' . esc($page) . '</code>',
  '🔗 From: ' . ($refHost !== '' ? esc($refHost) : 'direct / typed'),
  '📱 ' . esc($os . ' · ' . $br) . ($scr !== '' ? ' · ' . esc($scr) : ''),
  '🌐 ' . esc(implode(' · ', array_filter(array($lang, $tz)))) . ($flag !== '' ? ' · ' . $flag : ''),
  '🕒 ' . esc($when),
);
$post = http_build_query(array('chat_id' => $cfg['chat'], 'text' => implode("\n", $lines), 'parse_mode' => 'HTML', 'disable_web_page_preview' => 'true'));

/* answer the browser first, then talk to Telegram */
http_response_code(204);
if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
$url = 'https://api.telegram.org/bot' . $cfg['token'] . '/sendMessage';
if (function_exists('curl_init')) {
  $c = curl_init($url);
  curl_setopt_array($c, array(CURLOPT_POST => true, CURLOPT_POSTFIELDS => $post, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6, CURLOPT_CONNECTTIMEOUT => 4));
  curl_exec($c);
  curl_close($c);
} else {
  @file_get_contents($url, false, stream_context_create(array('http' => array('method' => 'POST', 'header' => "Content-Type: application/x-www-form-urlencoded\r\n", 'content' => $post, 'timeout' => 6))));
}
