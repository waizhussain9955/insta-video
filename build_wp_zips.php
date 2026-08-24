<?php

$plugins = [
    'insta-video-downloader',
    'insta-audio-downloader',
    'insta-story-downloader',
    'insta-bulk-downloader'
];

$baseDir = __DIR__ . '/wp-plugins';

foreach ($plugins as $plugin) {
    $pluginDir = $baseDir . '/' . $plugin;
    $zipPath = $baseDir . '/' . $plugin . '.zip';

    if (file_exists($zipPath)) {
        unlink($zipPath);
    }

    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        echo "Failed to create $zipPath\n";
        continue;
    }

    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($pluginDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($files as $file) {
        if (!$file->isDir()) {
            $filePath = $file->getRealPath();
            // Get relative path with forward slashes
            $relativePath = substr($filePath, strlen($pluginDir) + 1);
            $relativePath = str_replace('\\', '/', $relativePath);
            
            // WordPress expects: plugin-name/file.php (with standard Unix / slashes)
            $zipEntryName = $plugin . '/' . $relativePath;
            
            $zip->addFile($filePath, $zipEntryName);
        }
    }

    $zip->close();
    echo "Created: $zipPath (Clean Unix forward slashes)\n";
}
