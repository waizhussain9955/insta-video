<?php
/**
 * cPanel Permission Fixer Script
 * Upload this file to your domain root on cPanel and open:
 * https://api.thecalicocats.com/fix_permissions.php
 */

$dir = dirname(__DIR__);

function fixPermissionsRecursively($path) {
    $filesCount = 0;
    $dirsCount = 0;

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $item) {
        if ($item->isDir()) {
            @chmod($item->getPathname(), 0755);
            $dirsCount++;
        } else {
            @chmod($item->getPathname(), 0644);
            $filesCount++;
        }
    }
    return ['files' => $filesCount, 'dirs' => $dirsCount];
}

// Ensure storage and cache are writable
@chmod($dir . '/storage', 0775);
@chmod($dir . '/bootstrap/cache', 0775);

$stats = fixPermissionsRecursively($dir);

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>cPanel Permission Fixer</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
        .card { background: #1e293b; max-width: 500px; margin: 0 auto; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
        h1 { color: #38bdf8; margin-top: 0; }
        .badge { background: #0284c7; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
        .btn { display: inline-block; background: #ec4899; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .btn:hover { background: #db2777; }
    </style>
</head>
<body>
    <div class="card">
        <h1>✅ Permissions Fixed!</h1>
        <p>Fixed permissions for <strong><?= $stats['files'] ?></strong> files and <strong><?= $stats['dirs'] ?></strong> folders.</p>
        <p>• Folders: <span class="badge">0755</span></p>
        <p>• Files: <span class="badge">0644</span></p>
        <p>• Storage/Cache: <span class="badge">0775</span></p>
        <a href="/" class="btn">Test API (https://api.thecalicocats.com/)</a>
    </div>
</body>
</html>
