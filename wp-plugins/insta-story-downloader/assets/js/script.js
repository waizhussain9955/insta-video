(function () {
    function initStoryDownloaders() {
        document.querySelectorAll('.insta-story-wrapper').forEach(function (wrapper) {
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
            var storiesGrid = wrapper.querySelector('.insta-stories-grid');

            function cleanUsername(raw) {
                var clean = raw.trim();
                if (clean.indexOf('?') !== -1) clean = clean.split('?')[0];
                clean = clean.replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, '');
                clean = clean.replace(/^stories\//i, '');
                clean = clean.replace(/^[\/@]+|[\/@]+$/g, '');
                var parts = clean.split('/');
                for (var i = 0; i < parts.length; i++) {
                    var p = parts[i].replace('@', '').trim();
                    if (p && ['stories', 'reels', 'p', 'reel'].indexOf(p.toLowerCase()) === -1) {
                        return p;
                    }
                }
                return clean.replace('@', '');
            }

            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                var targetUser = cleanUsername(input.value);
                if (!targetUser) return;

                alertBox.className = 'insta-alert';
                alertBox.style.display = 'none';
                alertBox.textContent = '';
                resultsBox.style.display = 'none';
                storiesGrid.innerHTML = '';
                submitBtn.disabled = true;
                btnText.style.display = 'none';
                btnLoader.style.display = 'inline-flex';

                try {
                    var endpoint = apiUrl.replace(/\/$/, '') + '/api/download';
                    var response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'stories',
                            username: targetUser,
                            url: targetUser
                        })
                    });

                    var data = await response.json();

                    if (!response.ok || data.error) {
                        throw new Error(data.error || 'Could not fetch active stories for this username.');
                    }

                    var storiesList = data.stories || data.media || [];
                    if (storiesList.length === 0) {
                        throw new Error('No active public stories found in the last 24 hours for @' + targetUser);
                    }

                    var html = '';
                    storiesList.forEach(function (story, idx) {
                        var mediaUrl = story.video_url || story.url;
                        var isVideo = story.type === 'video' || (mediaUrl && mediaUrl.indexOf('.mp4') !== -1);
                        var previewUrl = story.preview || mediaUrl;
                        var dlName = targetUser + '_story_' + (idx + 1) + (isVideo ? '.mp4' : '.jpg');

                        html += '<div class="insta-story-item">';
                        html += '  <div class="insta-story-preview">';
                        if (isVideo) {
                            html += '    <video src="' + mediaUrl + '" controls playsinline poster="' + previewUrl + '" preload="none" referrerpolicy="no-referrer"></video>';
                        } else {
                            html += '    <img src="' + previewUrl + '" alt="Story item ' + (idx + 1) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" />';
                        }
                        html += '  </div>';
                        html += '  <div class="insta-story-actions">';
                        html += '    <a href="' + mediaUrl + '" download="' + dlName + '" class="insta-story-dl-btn direct-cdn-story-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">';
                        html += '      Download ' + (isVideo ? 'Video Story' : 'Photo Story');
                        html += '    </a>';
                        html += '  </div>';
                        html += '</div>';
                    });

                    storiesGrid.innerHTML = html;
                    resultsBox.style.display = 'block';

                    // Attach client-side direct CDN trigger (0 server bandwidth)
                    storiesGrid.querySelectorAll('.direct-cdn-story-btn').forEach(function(btn) {
                        btn.addEventListener('click', function(ev) {
                            var directUrl = this.getAttribute('href');
                            var dlName = this.getAttribute('download') || 'instagram_story.mp4';
                            if (window.fetch) {
                                ev.preventDefault();
                                var originalText = this.textContent;
                                var btnRef = this;
                                btnRef.textContent = '⏳ Downloading...';
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
                                        btnRef.textContent = '✅ Downloaded!';
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
                    alertBox.textContent = err.message || 'Unable to retrieve stories.';
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
        document.addEventListener('DOMContentLoaded', initStoryDownloaders);
    } else {
        initStoryDownloaders();
    }
})();
