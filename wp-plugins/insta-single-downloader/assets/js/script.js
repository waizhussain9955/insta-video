jQuery(document).ready(function ($) {
    $('.insta-single-wrapper').each(function () {
        const $wrapper = $(this);
        const apiUrl = $wrapper.data('api') || 'https://api.thecalicocats.com';
        const $form = $wrapper.find('.insta-single-form');
        const $input = $wrapper.find('.insta-single-input');
        const $submitBtn = $wrapper.find('.insta-single-submit');
        const $btnText = $submitBtn.find('.btn-text');
        const $btnLoader = $submitBtn.find('.btn-loader');
        const $alert = $wrapper.find('.insta-single-alert');
        const $results = $wrapper.find('.insta-single-results');
        const $pasteBtn = $wrapper.find('.insta-paste-btn');

        // Paste from clipboard handler
        $pasteBtn.on('click', async function () {
            try {
                if (navigator.clipboard) {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                        $input.val(text.trim());
                        $input.focus();
                    }
                }
            } catch (err) {}
        });

        // Submit form
        $form.on('submit', async function (e) {
            e.preventDefault();
            const rawUrl = $input.val().trim();
            if (!rawUrl) return;

            // Reset UI
            $alert.hide().removeClass('error success').text('');
            $results.hide().html('');
            $submitBtn.prop('disabled', true);
            $btnText.hide();
            $btnLoader.show();

            try {
                const endpoint = `${apiUrl.replace(/\/$/, '')}/api/download`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'single',
                        url: rawUrl
                    })
                });

                const data = await response.json();

                if (!response.ok || data.error) {
                    throw new Error(data.error || 'Failed to fetch Instagram media. Please make sure the link is public.');
                }

                const mediaItems = data.media || (data.url ? [{ url: data.url, type: 'video' }] : []);
                if (mediaItems.length === 0) {
                    throw new Error('No downloadable video or photo found for this Instagram link.');
                }

                renderResults(mediaItems, apiUrl);
            } catch (err) {
                $alert.addClass('error').text(err.message).fadeIn();
            } finally {
                $submitBtn.prop('disabled', false);
                $btnText.show();
                $btnLoader.hide();
            }
        });

        function renderResults(media, baseApi) {
            let html = '<div class="insta-media-container">';
            media.forEach((item, index) => {
                const isVideo = item.type === 'video' || (item.url && item.url.includes('.mp4')) || (item.video_url && item.video_url.includes('.mp4'));
                const mediaUrl = item.video_url || item.url;
                const proxyUrl = `${baseApi.replace(/\/$/, '')}/api/proxy?url=${encodeURIComponent(mediaUrl)}`;
                const audioProxy = `${baseApi.replace(/\/$/, '')}/api/proxy?url=${encodeURIComponent(mediaUrl)}&format=mp3`;

                html += `
                    <div class="insta-card-item">
                        <div class="insta-preview-box">
                            ${isVideo ? `
                                <video src="${mediaUrl}" controls playsinline poster="${item.preview || ''}" preload="metadata"></video>
                            ` : `
                                <img src="${mediaUrl}" alt="Instagram Media" loading="lazy" />
                            `}
                        </div>
                        <div class="insta-card-actions">
                            <a href="${proxyUrl}" download="instagram_${isVideo ? 'video' : 'photo'}_${index + 1}.${isVideo ? 'mp4' : 'jpg'}" class="insta-download-btn" target="_blank" rel="noopener">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <span>Download ${isVideo ? 'HD MP4 Video' : 'HD Photo'}</span>
                            </a>
                            ${isVideo ? `
                                <a href="${audioProxy}" download="instagram_audio_${index + 1}.mp3" class="insta-audio-btn" title="Download Audio Track (MP3)" target="_blank" rel="noopener">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                                    <span>MP3</span>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            $results.html(html).fadeIn();
        }
    });
});
