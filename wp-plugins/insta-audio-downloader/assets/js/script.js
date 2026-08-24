(function () {
    function initAudioDownloaders() {
        document.querySelectorAll('.insta-audio-wrapper').forEach(function (wrapper) {
            if (wrapper.dataset.initialized) return;
            wrapper.dataset.initialized = 'true';

            var apiUrl = wrapper.dataset.api || 'https://api.thecalicocats.com';
            var form = wrapper.querySelector('.insta-form');
            var input = wrapper.querySelector('.insta-input');
            var pasteBtn = wrapper.querySelector('.insta-paste-btn');
            var clearBtn = wrapper.querySelector('.insta-clear-btn');
            var submitBtn = wrapper.querySelector('.insta-submit-btn');
            var btnText = submitBtn.querySelector('.btn-text');
            var btnLoader = submitBtn.querySelector('.btn-loader');
            var alertBox = wrapper.querySelector('.insta-alert');
            var resultsBox = wrapper.querySelector('.insta-results');
            var playerContainer = wrapper.querySelector('.insta-audio-player-container');

            // 1. Clear button
            if (input && clearBtn) {
                input.addEventListener('input', function () {
                    clearBtn.style.display = input.value.trim().length > 0 ? 'inline-flex' : 'none';
                });
                clearBtn.addEventListener('click', function () {
                    input.value = '';
                    clearBtn.style.display = 'none';
                    input.focus();
                });
            }

            // 2. Paste button
            if (pasteBtn && input) {
                pasteBtn.addEventListener('click', async function () {
                    try {
                        if (navigator.clipboard && navigator.clipboard.readText) {
                            var clipText = await navigator.clipboard.readText();
                            if (clipText) {
                                input.value = clipText.trim();
                                if (clearBtn) clearBtn.style.display = 'inline-flex';
                                pasteBtn.textContent = '✅ Pasted!';
                                setTimeout(function () {
                                    pasteBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Paste';
                                }, 1500);
                            }
                        } else {
                            input.focus();
                        }
                    } catch (e) {
                        input.focus();
                    }
                });
            }

            // 3. Submit
            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                var targetUrl = input.value.trim();
                if (!targetUrl) return;

                alertBox.className = 'insta-alert';
                alertBox.style.display = 'none';
                alertBox.textContent = '';
                resultsBox.style.display = 'none';
                playerContainer.innerHTML = '';
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
                        throw new Error(data.error || 'Could not fetch Instagram audio. Please verify the URL.');
                    }

                    var mediaList = data.media || (data.url ? [{ url: data.url, type: 'video' }] : []);
                    if (!mediaList || mediaList.length === 0) {
                        throw new Error('No audio found in this Instagram post.');
                    }

                    var rawMediaUrl = mediaList[0].video_url || mediaList[0].url;
                    var dlName = 'instagram_audio_' + Date.now() + '.mp3';

                    var html = '<div class="insta-audio-preview-card">';
                    html += '  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">';
                    html += '    <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(168,85,247,0.2); display: flex; align-items: center; justify-content: center; color: #c084fc; border: 1px solid rgba(168,85,247,0.3);">';
                    html += '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
                    html += '    </div>';
                    html += '    <div>';
                    html += '      <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #fff;">Direct Audio Track</h4>';
                    html += '      <span style="font-size: 12px; color: #94a3b8;">High Quality Stream • Instagram CDN • 0 Server Bandwidth</span>';
                    html += '    </div>';
                    html += '  </div>';
                    html += '  <audio controls src="' + rawMediaUrl + '" preload="none" referrerpolicy="no-referrer" class="insta-audio-player"></audio>';
                    html += '  <a href="' + rawMediaUrl + '" download="' + dlName + '" class="insta-dl-mp3-btn direct-cdn-audio-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">';
                    html += '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
                    html += '    Download High Quality MP3 Audio';
                    html += '  </a>';
                    html += '</div>';

                    playerContainer.innerHTML = html;
                    resultsBox.style.display = 'block';

                    var dlBtn = playerContainer.querySelector('.direct-cdn-audio-btn');
                    if (dlBtn) {
                        dlBtn.addEventListener('click', function (ev) {
                            var directUrl = this.getAttribute('href');
                            if (window.fetch) {
                                ev.preventDefault();
                                var originalText = this.innerHTML;
                                var btnRef = this;
                                btnRef.innerHTML = '<span>⏳ Downloading audio...</span>';
                                fetch(directUrl, { mode: 'cors', referrerPolicy: 'no-referrer' })
                                    .then(function (r) { return r.blob(); })
                                    .then(function (b) {
                                        var bUrl = window.URL.createObjectURL(b);
                                        var tempA = document.createElement('a');
                                        tempA.href = bUrl;
                                        tempA.download = dlName;
                                        document.body.appendChild(tempA);
                                        tempA.click();
                                        document.body.removeChild(tempA);
                                        window.URL.revokeObjectURL(bUrl);
                                        btnRef.innerHTML = '<span>✅ Audio Downloaded!</span>';
                                        setTimeout(function () { btnRef.innerHTML = originalText; }, 2500);
                                    })
                                    .catch(function () {
                                        window.open(directUrl, '_blank');
                                        btnRef.innerHTML = originalText;
                                    });
                            }
                        });
                    }
                } catch (err) {
                    alertBox.className = 'insta-alert error';
                    alertBox.textContent = err.message || 'Failed to extract audio track.';
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
        document.addEventListener('DOMContentLoaded', initAudioDownloaders);
    } else {
        initAudioDownloaders();
    }
})();
