jQuery(document).ready(function ($) {
    $('.insta-story-wrapper').each(function () {
        const $wrapper = $(this);
        const apiUrl = $wrapper.data('api') || 'https://api.thecalicocats.com';
        const $form = $wrapper.find('.insta-story-form');
        const $input = $wrapper.find('.insta-story-input');
        const $submitBtn = $wrapper.find('.insta-story-submit');
        const $btnText = $submitBtn.find('.btn-text');
        const $btnLoader = $submitBtn.find('.btn-loader');
        const $alert = $wrapper.find('.insta-story-alert');
        const $results = $wrapper.find('.insta-story-results');
        const $grid = $wrapper.find('.insta-story-grid');
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
            const username = $input.val().trim();
            if (!username) return;

            $alert.hide().removeClass('error success').text('');
            $results.hide();
            $grid.html('');
            $submitBtn.prop('disabled', true);
            $btnText.hide();
            $btnLoader.show();

            try {
                const endpoint = `${apiUrl.replace(/\/$/, '')}/api/download`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'stories',
                        username: username,
                        url: username
                    })
                });

                const data = await response.json();

                if (!response.ok || data.error) {
                    throw new Error(data.error || 'No active stories found for this Instagram account. Verify the account is public.');
                }

                const stories = data.stories || data.media || [];
                if (stories.length === 0) {
                    throw new Error('No active 24h stories available for this user right now.');
                }

                let html = '';
                stories.forEach((item, idx) => {
                    const mediaUrl = item.video_url || item.url;
                    const isVideo = item.type === 'video' || (mediaUrl && mediaUrl.includes('.mp4'));
                    const proxyUrl = `${apiUrl.replace(/\/$/, '')}/api/proxy?url=${encodeURIComponent(mediaUrl)}`;

                    html += `
                        <div class="insta-story-item">
                            <div class="insta-story-thumb">
                                ${isVideo ? `
                                    <video src="${mediaUrl}" playsinline controls poster="${item.preview || ''}" preload="metadata"></video>
                                ` : `
                                    <img src="${mediaUrl}" alt="Story Media" loading="lazy" />
                                `}
                            </div>
                            <a href="${proxyUrl}" download="instagram_story_${idx + 1}.${isVideo ? 'mp4' : 'jpg'}" class="insta-story-dl" target="_blank" rel="noopener">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <span>Download ${isVideo ? 'Story Video' : 'Story Photo'}</span>
                            </a>
                        </div>
                    `;
                });

                $grid.html(html);
                $results.fadeIn();
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
