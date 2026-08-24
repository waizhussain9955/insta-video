(function () {
    function initVideoDownloaders() {
        document.querySelectorAll('.insta-video-wrapper').forEach(function (wrapper) {
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
            var mediaContainer = wrapper.querySelector('.insta-media-container');

            // 1. Clear button logic
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

            // 2. Paste from Clipboard logic
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

            // 3. Form Submit logic
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
                        var filename = 'instagram_' + (isPhoto ? 'photo_' : 'reel_') + (idx + 1) + (isPhoto ? '.jpg' : '.mp4');
                        var audioFilename = 'instagram_audio_' + (idx + 1) + '.mp3';

                        html += '<div class="insta-media-card">';
                        html += '  <div class="insta-media-preview">';
                        html += '    <div class="insta-media-header-badges">';
                        html += '      <span class="insta-quality-badge">' + (isPhoto ? 'FULL HD PHOTO' : '1080P HD VIDEO') + '</span>';
                        html += '      <span class="insta-quality-badge" style="color: #38bdf8; border-color: rgba(56,189,248,0.3);">DIRECT CDN</span>';
                        html += '    </div>';

                        if (isPhoto) {
                            html += '    <img src="' + previewUrl + '" alt="Instagram Post" loading="lazy" decoding="async" referrerpolicy="no-referrer" />';
                        } else {
                            html += '    <video src="' + mediaUrl + '" controls playsinline poster="' + previewUrl + '" preload="none" referrerpolicy="no-referrer"></video>';
                        }
                        html += '  </div>';

                        html += '  <div class="insta-actions-row">';
                        if (isPhoto) {
                            html += '    <a href="' + mediaUrl + '" download="' + filename + '" class="insta-dl-btn insta-dl-video direct-cdn-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">';
                            html += '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
                            html += '      Download Full HD Photo';
                            html += '    </a>';
                        } else {
                            html += '    <a href="' + mediaUrl + '" download="' + filename + '" class="insta-dl-btn insta-dl-video direct-cdn-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">';
                            html += '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
                            html += '      Download HD Video';
                            html += '    </a>';
                            html += '    <a href="' + mediaUrl + '" download="' + audioFilename + '" class="insta-dl-btn insta-dl-audio direct-cdn-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">';
                            html += '      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
                            html += '      Download MP3 Audio';
                            html += '    </a>';
                        }

                        // Copy Link Helper Button
                        html += '    <button type="button" class="insta-copy-link-btn" data-url="' + mediaUrl + '" title="Copy Direct Video Link">';
                        html += '      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                        html += '    </button>';

                        html += '  </div>';
                        html += '</div>';
                    });

                    mediaContainer.innerHTML = html;
                    resultsBox.style.display = 'block';

                    // Attach Direct CDN Client-side Blob Download Logic
                    mediaContainer.querySelectorAll('.direct-cdn-btn').forEach(function (btn) {
                        btn.addEventListener('click', function (ev) {
                            var directUrl = this.getAttribute('href');
                            var dlName = this.getAttribute('download') || 'instagram_video.mp4';
                            if (window.fetch) {
                                ev.preventDefault();
                                var originalText = this.innerHTML;
                                var btnRef = this;
                                btnRef.innerHTML = '<span>⏳ Downloading...</span>';
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
                                        btnRef.innerHTML = '<span>✅ Saved!</span>';
                                        setTimeout(function () { btnRef.innerHTML = originalText; }, 2500);
                                    })
                                    .catch(function () {
                                        window.open(directUrl, '_blank');
                                        btnRef.innerHTML = originalText;
                                    });
                            }
                        });
                    });

                    // Attach Copy Link Button Logic
                    mediaContainer.querySelectorAll('.insta-copy-link-btn').forEach(function (copyBtn) {
                        copyBtn.addEventListener('click', function () {
                            var linkToCopy = this.getAttribute('data-url');
                            if (linkToCopy && navigator.clipboard) {
                                navigator.clipboard.writeText(linkToCopy);
                                var btnRef = this;
                                btnRef.innerHTML = '<span style="font-size:11px; color:#86efac; font-weight:bold;">Copied!</span>';
                                setTimeout(function () {
                                    btnRef.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                                }, 2000);
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
