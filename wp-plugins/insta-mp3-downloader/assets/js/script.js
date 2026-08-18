jQuery(document).ready(function ($) {
    $('.insta-mp3-wrapper').each(function () {
        const $wrapper = $(this);
        const apiUrl = $wrapper.data('api') || 'https://api.thecalicocats.com';
        const $form = $wrapper.find('.insta-mp3-form');
        const $input = $wrapper.find('.insta-mp3-input');
        const $submitBtn = $wrapper.find('.insta-mp3-submit');
        const $btnText = $submitBtn.find('.btn-text');
        const $btnLoader = $submitBtn.find('.btn-loader');
        const $alert = $wrapper.find('.insta-mp3-alert');
        const $results = $wrapper.find('.insta-mp3-results');
        const $pasteBtn = $wrapper.find('.insta-paste-btn');

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

        $form.on('submit', async function (e) {
            e.preventDefault();
            const rawUrl = $input.val().trim();
            if (!rawUrl) return;

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
                    throw new Error(data.error || 'Could not extract audio from this Instagram link. Please ensure link is public.');
                }

                const mediaItems = data.media || (data.url ? [{ url: data.url, type: 'video' }] : []);
                if (mediaItems.length === 0) {
                    throw new Error('No audio soundtrack detected for this link.');
                }

                const firstVideo = mediaItems.find(m => m.type === 'video' || (m.url && m.url.includes('.mp4'))) || mediaItems[0];
                const videoUrl = firstVideo.video_url || firstVideo.url;
                const audioProxy = `${apiUrl.replace(/\/$/, '')}/api/proxy?url=${encodeURIComponent(videoUrl)}&format=mp3`;

                const html = `
                    <div class="insta-audio-card">
                        <div class="insta-audio-player-box">
                            <div class="insta-audio-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                            </div>
                            <audio controls src="${audioProxy}" preload="metadata"></audio>
                        </div>
                        <a href="${audioProxy}" download="instagram_audio_${Date.now()}.mp3" class="insta-mp3-dl-btn" target="_blank" rel="noopener">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            <span>Download 320kbps MP3 Audio</span>
                        </a>
                    </div>
                `;

                $results.html(html).fadeIn();
            } catch (err) {
                $alert.addClass('error').text(err.message).fadeIn();
            } finally {
                $submitBtn.prop('disabled', false);
                $btnText.show();
                $btnLoader.hide();
            }
        });
    });
});
