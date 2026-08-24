(function () {
    function initBulkDownloaders() {
        document.querySelectorAll('.insta-bulk-wrapper').forEach(function (wrapper) {
            if (wrapper.dataset.initialized) return;
            wrapper.dataset.initialized = 'true';

            var apiUrl = wrapper.dataset.api || 'https://api.thecalicocats.com';
            var form = wrapper.querySelector('.insta-bulk-form');
            var input = wrapper.querySelector('.insta-bulk-input');
            var limitSelect = wrapper.querySelector('.insta-bulk-limit');
            var submitBtn = wrapper.querySelector('.insta-bulk-submit');
            var btnText = submitBtn.querySelector('.btn-text');
            var btnLoader = submitBtn.querySelector('.btn-loader');
            var alertBox = wrapper.querySelector('.insta-bulk-alert');
            var resultsBox = wrapper.querySelector('.insta-bulk-results');
            var grid = wrapper.querySelector('.insta-bulk-grid');
            var selCount = wrapper.querySelector('.sel-count');
            var zipCount = wrapper.querySelector('.zip-count');
            var btnSelectAll = wrapper.querySelector('.btn-select-all');
            var btnSelectPage = wrapper.querySelector('.btn-select-page');
            var btnDeselectAll = wrapper.querySelector('.btn-deselect-all');
            var zipBtn = wrapper.querySelector('.insta-zip-btn');
            var progress = wrapper.querySelector('.insta-zip-progress');
            var progressFill = wrapper.querySelector('.insta-progress-fill');
            var progressPct = wrapper.querySelector('.progress-pct');
            var progressStatus = wrapper.querySelector('.progress-status');
            var pagTop = wrapper.querySelector('.insta-pagination-top');
            var pagBottom = wrapper.querySelector('.insta-pagination-bottom');

            var fetchedPosts = [];
            var selectedIds = new Set();
            var currentPage = 1;
            var pageSize = 12;
            var targetUsername = '';

            function cleanUsername(raw) {
                var clean = raw.trim();
                if (clean.indexOf('?') !== -1) clean = clean.split('?')[0];
                clean = clean.replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, '');
                clean = clean.replace(/^[\/@]+|[\/@]+$/g, '');
                var parts = clean.split('/');
                for (var i = 0; i < parts.length; i++) {
                    var p = parts[i].replace('@', '').trim();
                    if (p && ['reels', 'stories', 'reel', 'p', 'tv', 's'].indexOf(p.toLowerCase()) === -1) {
                        return p;
                    }
                }
                return clean.replace('@', '');
            }

            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                targetUsername = cleanUsername(input.value);
                if (!targetUsername) return;

                alertBox.className = 'insta-bulk-alert';
                alertBox.style.display = 'none';
                alertBox.textContent = '';
                resultsBox.style.display = 'none';
                grid.innerHTML = '';
                pagTop.innerHTML = '';
                pagBottom.innerHTML = '';
                submitBtn.disabled = true;
                btnText.style.display = 'none';
                btnLoader.style.display = 'inline-flex';
                selectedIds.clear();
                currentPage = 1;

                try {
                    var limit = parseInt(limitSelect ? limitSelect.value : '12', 10) || 12;
                    var endpoint = apiUrl.replace(/\/$/, '') + '/api/download';
                    var response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'bulk-video',
                            username: targetUsername,
                            url: targetUsername,
                            limit: limit
                        })
                    });

                    var data = await response.json();

                    if (!response.ok || data.error) {
                        throw new Error(data.error || 'Could not harvest reels for this username. Please ensure the profile is public.');
                    }

                    fetchedPosts = data.posts || [];
                    if (fetchedPosts.length === 0) {
                        throw new Error('No public reels or MP4 videos found for this account.');
                    }

                    // Select all items by default
                    fetchedPosts.forEach(function (post, idx) {
                        selectedIds.add(post.id || ('post_' + idx));
                    });

                    renderBulkGrid();
                    resultsBox.style.display = 'block';
                } catch (err) {
                    alertBox.className = 'insta-bulk-alert error';
                    alertBox.textContent = err.message || 'Something went wrong. Please try again.';
                    alertBox.style.display = 'block';
                } finally {
                    submitBtn.disabled = false;
                    btnText.style.display = 'inline';
                    btnLoader.style.display = 'none';
                }
            });

            function renderBulkGrid() {
                var total = fetchedPosts.length;
                var totalPages = Math.max(1, Math.ceil(total / pageSize));
                if (currentPage > totalPages) currentPage = totalPages;
                if (currentPage < 1) currentPage = 1;

                var startIndex = (currentPage - 1) * pageSize;
                var endIndex = Math.min(startIndex + pageSize, total);
                var pagePosts = fetchedPosts.slice(startIndex, endIndex);

                var html = '';
                pagePosts.forEach(function (post, idx) {
                    var id = post.id || ('post_' + (startIndex + idx));
                    var isSelected = selectedIds.has(id);
                    var videoUrl = post.video_url || post.url;
                    var proxyUrl = apiUrl.replace(/\/$/, '') + '/api/proxy?url=' + encodeURIComponent(videoUrl);
                    var audioProxy = apiUrl.replace(/\/$/, '') + '/api/proxy?url=' + encodeURIComponent(videoUrl) + '&format=mp3';

                    html += '<div class="insta-bulk-item ' + (isSelected ? 'selected' : '') + '" data-id="' + id + '" data-url="' + videoUrl + '">';
                    html += '  <div class="insta-select-overlay">';
                    html += '    <input type="checkbox" class="insta-checkbox" data-id="' + id + '" ' + (isSelected ? 'checked' : '') + ' />';
                    html += '  </div>';
                    html += '  <div class="insta-thumb-container">';
                    html += '    <video src="' + videoUrl + '" playsinline poster="' + (post.preview || '') + '" preload="none" muted onmouseover="this.play()" onmouseout="this.pause()"></video>';
                    html += '  </div>';
                    html += '  <div class="insta-item-footer">';
                    html += '    <a href="' + videoUrl + '" download="' + targetUsername + '_reel_' + id + '.mp4" class="insta-mini-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Video</a>';
                    html += '    <a href="' + videoUrl + '" download="' + targetUsername + '_audio_' + id + '.mp3" class="insta-mini-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">MP3</a>';
                    html += '  </div>';
                    html += '</div>';
                });

                grid.innerHTML = html;

                renderPaginationControls(totalPages, startIndex, endIndex, total);
                updateSelectionCounts();
            }

            function renderPaginationControls(totalPages, startIndex, endIndex, total) {
                if (total <= 0) {
                    pagTop.style.display = 'none';
                    pagBottom.style.display = 'none';
                    return;
                }

                var btnsHtml = '<button type="button" class="insta-page-btn insta-page-prev" ' + (currentPage === 1 ? 'disabled' : '') + '>&laquo;</button>';
                for (var p = 1; p <= totalPages; p++) {
                    btnsHtml += '<button type="button" class="insta-page-btn ' + (p === currentPage ? 'active' : '') + '" data-page="' + p + '">' + p + '</button>';
                }
                btnsHtml += '<button type="button" class="insta-page-btn insta-page-next" ' + (currentPage === totalPages ? 'disabled' : '') + '>&raquo;</button>';

                var pagHtml = '<div class="insta-pagination-info">' +
                    '<span>Page <b>' + currentPage + '</b> of <b>' + totalPages + '</b></span>' +
                    '<span>•</span>' +
                    '<span>Showing <b>' + (startIndex + 1) + '–' + endIndex + '</b> of <b>' + total + '</b> Videos</span>' +
                    '</div>' +
                    '<div class="insta-pagination-controls">' +
                    '<div class="insta-per-page-wrap">' +
                    '<span>Show:</span>' +
                    '<select class="insta-per-page-select">' +
                    '<option value="12" ' + (pageSize === 12 ? 'selected' : '') + '>12 / page</option>' +
                    '<option value="24" ' + (pageSize === 24 ? 'selected' : '') + '>24 / page</option>' +
                    '<option value="50" ' + (pageSize === 50 ? 'selected' : '') + '>50 / page</option>' +
                    '</select>' +
                    '</div>' +
                    '<div class="insta-page-btns">' + btnsHtml + '</div>' +
                    '</div>';

                pagTop.innerHTML = pagHtml;
                pagTop.style.display = 'flex';

                if (totalPages > 1) {
                    pagBottom.innerHTML = pagHtml;
                    pagBottom.style.display = 'flex';
                } else {
                    pagBottom.style.display = 'none';
                }
            }

            function updateSelectionCounts() {
                var count = selectedIds.size;
                selCount.textContent = count;
                zipCount.textContent = count;
                zipBtn.disabled = (count === 0);
            }

            // Delegated events on wrapper
            wrapper.addEventListener('click', function (e) {
                var target = e.target;

                // Page buttons
                var pageBtn = target.closest('.insta-page-btn');
                if (pageBtn && !pageBtn.disabled) {
                    if (pageBtn.classList.contains('insta-page-prev')) {
                        if (currentPage > 1) {
                            currentPage--;
                            renderBulkGrid();
                        }
                    } else if (pageBtn.classList.contains('insta-page-next')) {
                        var totalPages = Math.ceil(fetchedPosts.length / pageSize);
                        if (currentPage < totalPages) {
                            currentPage++;
                            renderBulkGrid();
                        }
                    } else {
                        var p = parseInt(pageBtn.dataset.page, 10);
                        if (p && p !== currentPage) {
                            currentPage = p;
                            renderBulkGrid();
                        }
                    }
                }
            });

            wrapper.addEventListener('change', function (e) {
                var target = e.target;

                // Per page select
                if (target.classList.contains('insta-per-page-select')) {
                    var newSize = parseInt(target.value, 10) || 12;
                    if (newSize !== pageSize) {
                        pageSize = newSize;
                        currentPage = 1;
                        renderBulkGrid();
                    }
                }

                // Checkbox toggle
                if (target.classList.contains('insta-checkbox')) {
                    var id = target.dataset.id;
                    var item = target.closest('.insta-bulk-item');
                    if (target.checked) {
                        selectedIds.add(id);
                        if (item) item.classList.add('selected');
                    } else {
                        selectedIds.delete(id);
                        if (item) item.classList.remove('selected');
                    }
                    updateSelectionCounts();
                }
            });

            btnSelectAll.addEventListener('click', function () {
                fetchedPosts.forEach(function (post, idx) {
                    selectedIds.add(post.id || ('post_' + idx));
                });
                wrapper.querySelectorAll('.insta-bulk-item').forEach(function (item) {
                    item.classList.add('selected');
                    var cb = item.querySelector('.insta-checkbox');
                    if (cb) cb.checked = true;
                });
                updateSelectionCounts();
            });

            btnSelectPage.addEventListener('click', function () {
                wrapper.querySelectorAll('.insta-bulk-item').forEach(function (item) {
                    var id = item.dataset.id;
                    selectedIds.add(id);
                    item.classList.add('selected');
                    var cb = item.querySelector('.insta-checkbox');
                    if (cb) cb.checked = true;
                });
                updateSelectionCounts();
            });

            btnDeselectAll.addEventListener('click', function () {
                selectedIds.clear();
                wrapper.querySelectorAll('.insta-bulk-item').forEach(function (item) {
                    item.classList.remove('selected');
                    var cb = item.querySelector('.insta-checkbox');
                    if (cb) cb.checked = false;
                });
                updateSelectionCounts();
            });

            // ZIP Packaging via JSZip
            zipBtn.addEventListener('click', async function () {
                if (selectedIds.size === 0 || typeof JSZip === 'undefined') return;

                var selectedPosts = fetchedPosts.filter(function (p, idx) {
                    return selectedIds.has(p.id || ('post_' + idx));
                });

                if (selectedPosts.length === 0) return;

                zipBtn.disabled = true;
                progress.style.display = 'block';
                progressFill.style.width = '0%';
                progressPct.textContent = '0%';
                progressStatus.textContent = 'Downloading 0 / ' + selectedPosts.length + ' videos...';

                var zip = new JSZip();
                var completed = 0;

                for (var i = 0; i < selectedPosts.length; i++) {
                    var post = selectedPosts[i];
                    var videoUrl = post.video_url || post.url;
                    var proxyUrl = apiUrl.replace(/\/$/, '') + '/api/proxy?url=' + encodeURIComponent(videoUrl);

                    try {
                        var res = await fetch(proxyUrl);
                        if (!res.ok) throw new Error('Stream error');
                        var blob = await res.blob();
                        zip.file((targetUsername || 'instagram') + '_reel_' + (i + 1) + '_' + (post.id || i) + '.mp4', blob);
                    } catch (e) {
                        console.warn('Fallback item fetch error:', e);
                    }

                    completed++;
                    var pct = Math.round((completed / selectedPosts.length) * 80);
                    progressFill.style.width = pct + '%';
                    progressPct.textContent = pct + '%';
                    progressStatus.textContent = 'Downloading ' + completed + ' / ' + selectedPosts.length + ' videos...';
                }

                progressStatus.textContent = 'Packaging high-speed ZIP...';
                var zipBlob = await zip.generateAsync({ type: 'blob' }, function (metadata) {
                    var finalPct = 80 + Math.round(metadata.percent * 0.2);
                    progressFill.style.width = finalPct + '%';
                    progressPct.textContent = finalPct + '%';
                });

                var downloadUrl = URL.createObjectURL(zipBlob);
                var a = document.createElement('a');
                a.href = downloadUrl;
                a.download = (targetUsername || 'instagram') + '_bulk_videos_' + Date.now() + '.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 5000);

                progressStatus.textContent = 'ZIP download complete!';
                progressFill.style.width = '100%';
                progressPct.textContent = '100%';
                zipBtn.disabled = false;

                setTimeout(function () {
                    progress.style.display = 'none';
                }, 3500);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBulkDownloaders);
    } else {
        initBulkDownloaders();
    }
})();
