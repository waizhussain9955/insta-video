jQuery(document).ready(function ($) {
    $('.insta-bulk-wrapper').each(function () {
        const $wrapper = $(this);
        const apiUrl = $wrapper.data('api') || 'https://api.thecalicocats.com';
        const $form = $wrapper.find('.insta-bulk-form');
        const $input = $wrapper.find('.insta-bulk-input');
        const $limit = $wrapper.find('.insta-bulk-limit');
        const $submitBtn = $wrapper.find('.insta-bulk-submit');
        const $btnText = $submitBtn.find('.btn-text');
        const $btnLoader = $submitBtn.find('.btn-loader');
        const $alert = $wrapper.find('.insta-bulk-alert');
        const $results = $wrapper.find('.insta-bulk-results');
        const $grid = $wrapper.find('.insta-bulk-grid');
        const $selCount = $wrapper.find('.sel-count');
        const $zipCount = $wrapper.find('.zip-count');
        const $btnSelectAll = $wrapper.find('.btn-select-all');
        const $btnSelectPage = $wrapper.find('.btn-select-page');
        const $btnDeselectAll = $wrapper.find('.btn-deselect-all');
        const $zipBtn = $wrapper.find('.insta-zip-btn');
        const $progress = $wrapper.find('.insta-zip-progress');
        const $progressFill = $wrapper.find('.insta-progress-fill');
        const $progressPct = $wrapper.find('.progress-pct');
        const $progressStatus = $wrapper.find('.progress-status');
        const $pagTop = $wrapper.find('.insta-pagination-top');
        const $pagBottom = $wrapper.find('.insta-pagination-bottom');

        let fetchedPosts = [];
        let selectedIds = new Set();
        let currentPage = 1;
        let pageSize = 12;

        $form.on('submit', async function (e) {
            e.preventDefault();
            const targetUsername = $input.val().trim();
            if (!targetUsername) return;

            $alert.hide().removeClass('error success').text('');
            $results.hide();
            $grid.html('');
            $pagTop.html('');
            $pagBottom.html('');
            $submitBtn.prop('disabled', true);
            $btnText.hide();
            $btnLoader.show();
            selectedIds.clear();
            currentPage = 1;

            try {
                const endpoint = `${apiUrl.replace(/\/$/, '')}/api/download`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'bulk-video',
                        username: targetUsername,
                        url: targetUsername,
                        limit: parseInt($limit.val()) || 12
                    })
                });

                const data = await response.json();

                if (!response.ok || data.error) {
                    throw new Error(data.error || 'Could not harvest reels for this username. Please ensure the profile is public.');
                }

                fetchedPosts = data.posts || [];
                if (fetchedPosts.length === 0) {
                    throw new Error('No public reels or MP4 videos found for this Instagram account.');
                }

                // Select all by default
                fetchedPosts.forEach((post, idx) => {
                    selectedIds.add(post.id || `post_${idx}`);
                });

                renderBulkGrid();
                $results.fadeIn();
            } catch (err) {
                $alert.addClass('error').text(err.message).fadeIn();
            } finally {
                $submitBtn.prop('disabled', false);
                $btnText.show();
                $btnLoader.hide();
            }
        });

        function renderBulkGrid() {
            const total = fetchedPosts.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            if (currentPage > totalPages) currentPage = totalPages;
            if (currentPage < 1) currentPage = 1;

            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, total);
            const pagePosts = fetchedPosts.slice(startIndex, endIndex);

            // Render Video Grid
            let html = '';
            pagePosts.forEach((post, idx) => {
                const id = post.id || `post_${startIndex + idx}`;
                const isSelected = selectedIds.has(id);
                const videoUrl = post.video_url || post.url;
                const proxyUrl = `${apiUrl.replace(/\/$/, '')}/api/proxy?url=${encodeURIComponent(videoUrl)}`;
                const audioProxy = `${apiUrl.replace(/\/$/, '')}/api/proxy?url=${encodeURIComponent(videoUrl)}&format=mp3`;

                html += `
                    <div class="insta-bulk-item ${isSelected ? 'selected' : ''}" data-id="${id}" data-url="${videoUrl}">
                        <div class="insta-select-overlay">
                            <input type="checkbox" class="insta-checkbox" ${isSelected ? 'checked' : ''} />
                        </div>
                        <div class="insta-thumb-container">
                            <video src="${videoUrl}" playsinline poster="${post.preview || ''}" preload="metadata" muted onmouseover="this.play()" onmouseout="this.pause()"></video>
                        </div>
                        <div class="insta-item-footer">
                            <a href="${proxyUrl}" download="reel_${id}.mp4" class="insta-mini-btn" target="_blank" rel="noopener">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <span>Video</span>
                            </a>
                            <a href="${audioProxy}" download="audio_${id}.mp3" class="insta-mini-btn" target="_blank" rel="noopener">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                                <span>MP3</span>
                            </a>
                        </div>
                    </div>
                `;
            });

            $grid.html(html);

            // Render Pagination Bar HTML
            renderPaginationControls(totalPages, startIndex, endIndex, total);
            updateSelectionCounts();
        }

        function renderPaginationControls(totalPages, startIndex, endIndex, total) {
            if (total <= 0) {
                $pagTop.hide();
                $pagBottom.hide();
                return;
            }

            let btnsHtml = `
                <button type="button" class="insta-page-btn insta-page-prev" ${currentPage === 1 ? 'disabled' : ''} title="Previous Page">
                    &laquo;
                </button>
            `;

            for (let p = 1; p <= totalPages; p++) {
                btnsHtml += `
                    <button type="button" class="insta-page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">
                        ${p}
                    </button>
                `;
            }

            btnsHtml += `
                <button type="button" class="insta-page-btn insta-page-next" ${currentPage === totalPages ? 'disabled' : ''} title="Next Page">
                    &raquo;
                </button>
            `;

            const pagHtml = `
                <div class="insta-pagination-info">
                    <span>Page <b>${currentPage}</b> of <b>${totalPages}</b></span>
                    <span>•</span>
                    <span>Showing <b>${startIndex + 1}–${endIndex}</b> of <b>${total}</b> Videos</span>
                </div>
                <div class="insta-pagination-controls">
                    <div class="insta-per-page-wrap">
                        <span>Show:</span>
                        <select class="insta-per-page-select">
                            <option value="12" ${pageSize === 12 ? 'selected' : ''}>12 / page</option>
                            <option value="24" ${pageSize === 24 ? 'selected' : ''}>24 / page</option>
                            <option value="50" ${pageSize === 50 ? 'selected' : ''}>50 / page</option>
                        </select>
                    </div>
                    <div class="insta-page-btns">
                        ${btnsHtml}
                    </div>
                </div>
            `;

            $pagTop.html(pagHtml).show();
            if (totalPages > 1) {
                $pagBottom.html(pagHtml).show();
            } else {
                $pagBottom.hide();
            }
        }

        // Pagination Events (Delegated)
        $wrapper.on('click', '.insta-page-btn:not(:disabled)', function () {
            const $btn = $(this);
            if ($btn.hasClass('insta-page-prev')) {
                if (currentPage > 1) {
                    currentPage--;
                    renderBulkGrid();
                }
            } else if ($btn.hasClass('insta-page-next')) {
                const totalPages = Math.ceil(fetchedPosts.length / pageSize);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderBulkGrid();
                }
            } else {
                const p = parseInt($btn.data('page'));
                if (p && p !== currentPage) {
                    currentPage = p;
                    renderBulkGrid();
                }
            }
        });

        $wrapper.on('change', '.insta-per-page-select', function () {
            const newSize = parseInt($(this).val()) || 12;
            if (newSize !== pageSize) {
                pageSize = newSize;
                currentPage = 1;
                renderBulkGrid();
            }
        });

        function updateSelectionCounts() {
            const count = selectedIds.size;
            $selCount.text(count);
            $zipCount.text(count);
            $zipBtn.prop('disabled', count === 0);
        }

        $grid.on('change', '.insta-checkbox', function () {
            const $item = $(this).closest('.insta-bulk-item');
            const id = $item.data('id');
            if ($(this).is(':checked')) {
                selectedIds.add(id);
                $item.addClass('selected');
            } else {
                selectedIds.delete(id);
                $item.removeClass('selected');
            }
            updateSelectionCounts();
        });

        $btnSelectAll.on('click', function () {
            fetchedPosts.forEach((post, idx) => {
                selectedIds.add(post.id || `post_${idx}`);
            });
            $grid.find('.insta-bulk-item').each(function () {
                $(this).addClass('selected').find('.insta-checkbox').prop('checked', true);
            });
            updateSelectionCounts();
        });

        $btnSelectPage.on('click', function () {
            $grid.find('.insta-bulk-item').each(function () {
                const id = $(this).data('id');
                selectedIds.add(id);
                $(this).addClass('selected').find('.insta-checkbox').prop('checked', true);
            });
            updateSelectionCounts();
        });

        $btnDeselectAll.on('click', function () {
            selectedIds.clear();
            $grid.find('.insta-bulk-item').removeClass('selected').find('.insta-checkbox').prop('checked', false);
            updateSelectionCounts();
        });

        // ZIP Packaging via JSZip across all selected videos
        $zipBtn.on('click', async function () {
            if (selectedIds.size === 0 || typeof JSZip === 'undefined') return;

            const selectedPosts = fetchedPosts.filter((p, idx) => selectedIds.has(p.id || `post_${idx}`));
            if (selectedPosts.length === 0) return;

            $zipBtn.prop('disabled', true);
            $progress.fadeIn();
            $progressFill.css('width', '0%');
            $progressPct.text('0%');
            $progressStatus.text(`Downloading 0 / ${selectedPosts.length} videos...`);

            const zip = new JSZip();
            let completed = 0;

            for (let i = 0; i < selectedPosts.length; i++) {
                const post = selectedPosts[i];
                const videoUrl = post.video_url || post.url;
                const proxyUrl = `${apiUrl.replace(/\/$/, '')}/api/proxy?url=${encodeURIComponent(videoUrl)}`;

                try {
                    const res = await fetch(proxyUrl);
                    if (!res.ok) throw new Error('Download stream error');
                    const blob = await res.blob();
                    zip.file(`instagram_reel_${i + 1}_${post.id || i}.mp4`, blob);
                } catch (e) {
                    console.warn('Proxy fetch failed, using fallback item:', e.message);
                }

                completed++;
                const pct = Math.round((completed / selectedPosts.length) * 80);
                $progressFill.css('width', `${pct}%`);
                $progressPct.text(`${pct}%`);
                $progressStatus.text(`Downloading ${completed} / ${selectedPosts.length} videos...`);
            }

            $progressStatus.text('Compressing ZIP package...');
            const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
                const pct = 80 + Math.round(metadata.percent * 0.2);
                $progressFill.css('width', `${pct}%`);
                $progressPct.text(`${pct}%`);
            });

            // Trigger browser download
            const downloadUrl = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `instagram_bulk_videos_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

            $progressStatus.text('ZIP download complete!');
            $progressFill.css('width', '100%');
            $progressPct.text('100%');
            $zipBtn.prop('disabled', false);

            setTimeout(() => {
                $progress.fadeOut();
            }, 3000);
        });
    });
});
