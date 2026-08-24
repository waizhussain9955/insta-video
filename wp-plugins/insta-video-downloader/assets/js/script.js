(function () {
    function initVideoDownloaders() {
        document.querySelectorAll('.insta-video-wrapper').forEach(function (wrapper) {
            if (wrapper.dataset.initialized) return;
            wrapper.dataset.initialized = 'true';

            var apiUrl = wrapper.dataset.api || 'https://api.thecalicocats.com';
            var form = wrapper.querySelector('.insta-form');
            var input = wrapper.querySelector('.insta-input');
            var submitBtn = wrapper.querySelector('.insta-submit-btn');
            var btnText = submitBtn.querySelector('.btn-text');
            var btnLoader = submitBtn.querySelector('.btn-loader');
            var alertBox = wrapper.querySelector('.insta-alert');
            var resultsBox = wrapper.querySelector('.insta-results');
            var mediaContainer = wrapper.querySelector('.insta-media-container');

            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                var targetUrl = input.value.trim();
                if (!targetUrl) return;

                alertBox.className = 'insta-alert';
                alertBox.style.display = 'none';
                alertBox.textContent = '';
                resultsBox.style.display = 'none';
                mediaContainer.innerHTML = '';
                submitBtn.disabled = true;
                btnText.style.display = 'none';
                btnLoader.style.display = 'inline-flex';

                try {
                    var endpoint = apiUrl.replace(/\/$/, '') + '/api/download';
                    var response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'single',
                            url: targetUrl
                        })
                    });

                    var data = await response.json();

                    if (!response.ok || data.error) {
                        throw new Error(data.error || 'Could not fetch Instagram video. Please check the URL.');
                    }

                    var mediaList = data.media || (data.url ? [{ url: data.url, type: data.type || 'video', preview: data.preview || data.url }] : []);
                    if (!mediaList || mediaList.length === 0) {
                        throw new Error('No video or media found in this Instagram post.');
                    }

                    var html = '';
                    mediaList.forEach(function (item, idx) {
                        var mediaUrl = item.video_url || item.url;
                        var previewUrl = item.preview || mediaUrl;
                        var proxyVideoUrl = apiUrl.replace(/\/$/, '') + '/api/proxy?url=' + encodeURIComponent(mediaUrl);
                        var proxyAudioUrl = apiUrl.replace(/\/$/, '') + '/api/proxy?url=' + encodeURIComponent(mediaUrl) + '&format=mp3';

                        html += '<div class="insta-media-card" style="margin-bottom: 16px;">';
                        html += '  <div class="insta-media-preview">';
                        if (item.type === 'photo' || item.type === 'image') {
                            html += '    <img src="' + proxyVideoUrl + '" alt="Instagram Post" loading="lazy" decoding="async" />';
                        } else {
                            html += '    <video src="' + proxyVideoUrl + '" controls playsinline poster="' + previewUrl + '" preload="none"></video>';
                        }
                        html += '  </div>';
                        html += '  <div class="insta-actions-row">';
                        html += '    <a href="' + proxyVideoUrl + '" download="instagram_video_' + (idx + 1) + '.mp4" class="insta-dl-btn insta-dl-video" target="_blank" rel="noopener">Download HD Video (MP4)</a>';
                        html += '    <a href="' + proxyAudioUrl + '" download="instagram_audio_' + (idx + 1) + '.mp3" class="insta-dl-btn insta-dl-audio" target="_blank" rel="noopener">Download MP3 Audio</a>';
                        html += '  </div>';
                        html += '</div>';
                    });

                    mediaContainer.innerHTML = html;
                    resultsBox.style.display = 'block';
                } catch (err) {
                    alertBox.className = 'insta-alert error';
                    alertBox.textContent = err.message || 'Something went wrong. Please try again.';
                    alertBox.style.display = 'block';
                } finally {
                    submitBtn.disabled = false;
                    btnText.style.display = 'inline';
                    btnLoader.style.display = 'none';
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoDownloaders);
    } else {
        initVideoDownloaders();
    }
})();
