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
                        var isPhoto = item.type === 'photo' || item.type === 'image';
                        var filename = 'instagram_' + (isPhoto ? 'photo_' : 'video_') + (idx + 1) + (isPhoto ? '.jpg' : '.mp4');
                        var audioFilename = 'instagram_audio_' + (idx + 1) + '.mp3';

                        html += '<div class="insta-media-card" style="margin-bottom: 16px;">';
                        html += '  <div class="insta-media-preview">';
                        if (isPhoto) {
                            html += '    <img src="' + previewUrl + '" alt="Instagram Post" loading="lazy" decoding="async" referrerpolicy="no-referrer" />';
                        } else {
                            html += '    <video src="' + mediaUrl + '" controls playsinline poster="' + previewUrl + '" preload="none" referrerpolicy="no-referrer"></video>';
                        }
                        html += '  </div>';
                        html += '  <div class="insta-actions-row">';
                        if (isPhoto) {
                            html += '    <a href="' + mediaUrl + '" download="' + filename + '" class="insta-dl-btn insta-dl-video direct-cdn-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Download Full HD Photo</a>';
                        } else {
                            html += '    <a href="' + mediaUrl + '" download="' + filename + '" class="insta-dl-btn insta-dl-video direct-cdn-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Download HD Video (Direct CDN)</a>';
                            html += '    <a href="' + mediaUrl + '" download="' + audioFilename + '" class="insta-dl-btn insta-dl-audio direct-cdn-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Download Audio Track</a>';
                        }
                        html += '  </div>';
                        html += '</div>';
                    });

                    mediaContainer.innerHTML = html;
                    resultsBox.style.display = 'block';

                    // Attach client-side direct CDN trigger (Zero server bandwidth)
                    mediaContainer.querySelectorAll('.direct-cdn-btn').forEach(function(btn) {
                        btn.addEventListener('click', function(ev) {
                            var directUrl = this.getAttribute('href');
                            var dlName = this.getAttribute('download') || 'instagram_media.mp4';
                            if (window.fetch) {
                                ev.preventDefault();
                                var originalText = this.textContent;
                                var btnRef = this;
                                btnRef.textContent = '⏳ Downloading from CDN...';
                                fetch(directUrl, { mode: 'cors', referrerPolicy: 'no-referrer' })
                                    .then(function(r) { return r.blob(); })
                                    .then(function(b) {
                                        var bUrl = window.URL.createObjectURL(b);
                                        var tempA = document.createElement('a');
                                        tempA.href = bUrl;
                                        tempA.download = dlName;
                                        document.body.appendChild(tempA);
                                        tempA.click();
                                        document.body.removeChild(tempA);
                                        window.URL.revokeObjectURL(bUrl);
                                        btnRef.textContent = '✅ Download Started!';
                                        setTimeout(function() { btnRef.textContent = originalText; }, 2500);
                                    })
                                    .catch(function() {
                                        window.open(directUrl, '_blank');
                                        btnRef.textContent = originalText;
                                    });
                            }
                        });
                    });
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
