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
        const $btnDeselectAll = $wrapper.find('.btn-deselect-all');
        const $zipBtn = $wrapper.find('.insta-zip-btn');
        const $progress = $wrapper.find('.insta-zip-progress');
        const $progressFill = $wrapper.find('.insta-progress-fill');
        const $progressPct = $wrapper.find('.progress-pct');
        const $progressStatus = $wrapper.find('.progress-status');

        let fetchedPosts = [];
        let selectedIds = new Set();

        $form.on('submit', async function (e) {
            e.preventDefault();
            const targetUsername = $input.val().trim();
            if (!targetUsername) return;

            $alert.hide().removeClass('error success').text('');
            $results.hide();
            $grid.html('');
            $submitBtn.prop('disabled', true);
            $btnText.hide();
            $btnLoader.show();
            selectedIds.clear();

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

                renderBulkGrid();
            } catch (err) {
                $alert.addClass('error').text(err.message).fadeIn();
            } finally {
                $submitBtn.prop('disabled', false);
                $btnText.show();
                $btnLoader.hide();
            }
        });

        function renderBulkGrid() {
            let html = '';
            fetchedPosts.forEach((post, idx) => {
                const id = post.id || `post_${idx}`;
                selectedIds.add(id);
                const videoUrl = post.video_url || post.url;
                const proxyUrl = `${apiUrl.replace(/\/$/, '')}/api/proxy?url=${encodeURIComponent(videoUrl)}`;
                const audioProxy = `${apiUrl.replace(/\/$/, '')}/api/proxy?url=${encodeURIComponent(videoUrl)}&format=mp3`;

                html += `
                    <div class="insta-bulk-item selected" data-id="${id}" data-url="${videoUrl}">
                        <div class="insta-select-overlay">
                            <input type="checkbox" class="insta-checkbox" checked />
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
            updateSelectionCounts();
            $results.fadeIn();
        }

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

        // ZIP Packaging via JSZip
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
            URL.revokeObjectURL(downloadUrl);

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
