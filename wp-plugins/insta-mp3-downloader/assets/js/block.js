(function (blocks, element, components, blockEditor) {
    const { registerBlockType } = blocks;
    const { createElement: el, Fragment } = element;
    const { InspectorControls } = blockEditor;
    const { PanelBody, TextControl, SelectControl } = components;

    registerBlockType('insta-downloader/audio', {
        title: 'Instagram MP3 Downloader',
        icon: 'format-audio',
        category: 'widgets',
        description: 'Embed an Instagram MP3 & Audio Soundtrack Downloader with customizable themes and colors.',
        attributes: {
            title: { type: 'string', default: 'Instagram MP3 & Audio Downloader' },
            subtitle: { type: 'string', default: 'Extract high-fidelity 320kbps MP3 audio songs and soundtracks.' },
            placeholder: { type: 'string', default: 'Paste Instagram Reel or Video Link...' },
            button_text: { type: 'string', default: 'Extract Audio' },
            bg_color: { type: 'string', default: 'rgba(24, 24, 27, 0.85)' },
            border_color: { type: 'string', default: 'rgba(255, 255, 255, 0.1)' },
            border_radius: { type: 'string', default: '16px' },
            title_color: { type: 'string', default: '#ffffff' },
            text_color: { type: 'string', default: '#a1a1aa' },
            input_bg: { type: 'string', default: 'rgba(255, 255, 255, 0.05)' },
            btn_bg: { type: 'string', default: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)' },
            btn_text: { type: 'string', default: '#ffffff' },
            mp3_btn_bg: { type: 'string', default: '#06b6d4' },
            api_url: { type: 'string', default: 'https://api.thecalicocats.com' },
            theme: { type: 'string', default: 'dark' },
            max_width: { type: 'string', default: '650px' }
        },

        edit: function (props) {
            const { attributes, setAttributes } = props;

            return el(
                Fragment,
                null,
                el(
                    InspectorControls,
                    null,
                    el(
                        PanelBody,
                        { title: 'Content & Texts', initialOpen: true },
                        el(TextControl, {
                            label: 'Title',
                            value: attributes.title,
                            onChange: (val) => setAttributes({ title: val })
                        }),
                        el(TextControl, {
                            label: 'Subtitle / Description',
                            value: attributes.subtitle,
                            onChange: (val) => setAttributes({ subtitle: val })
                        }),
                        el(TextControl, {
                            label: 'Placeholder Text',
                            value: attributes.placeholder,
                            onChange: (val) => setAttributes({ placeholder: val })
                        }),
                        el(TextControl, {
                            label: 'Button Label',
                            value: attributes.button_text,
                            onChange: (val) => setAttributes({ button_text: val })
                        })
                    ),
                    el(
                        PanelBody,
                        { title: 'Color & Theme Customizations', initialOpen: false },
                        el(TextControl, {
                            label: 'Container Background (Hex/RGBA)',
                            value: attributes.bg_color,
                            onChange: (val) => setAttributes({ bg_color: val })
                        }),
                        el(TextControl, {
                            label: 'Title Color',
                            value: attributes.title_color,
                            onChange: (val) => setAttributes({ title_color: val })
                        }),
                        el(TextControl, {
                            label: 'Text Color',
                            value: attributes.text_color,
                            onChange: (val) => setAttributes({ text_color: val })
                        }),
                        el(TextControl, {
                            label: 'Extract Button Color / Gradient',
                            value: attributes.btn_bg,
                            onChange: (val) => setAttributes({ btn_bg: val })
                        }),
                        el(TextControl, {
                            label: 'MP3 Download Button Color',
                            value: attributes.mp3_btn_bg,
                            onChange: (val) => setAttributes({ mp3_btn_bg: val })
                        })
                    ),
                    el(
                        PanelBody,
                        { title: 'Layout & API URL', initialOpen: false },
                        el(TextControl, {
                            label: 'Max Width',
                            value: attributes.max_width,
                            onChange: (val) => setAttributes({ max_width: val })
                        }),
                        el(TextControl, {
                            label: 'Backend API URL',
                            value: attributes.api_url,
                            onChange: (val) => setAttributes({ api_url: val })
                        })
                    )
                ),
                el(
                    'div',
                    {
                        className: 'insta-mp3-wrapper',
                        style: {
                            '--ia-bg': attributes.bg_color,
                            '--ia-border': attributes.border_color,
                            '--ia-radius': attributes.border_radius,
                            '--ia-title': attributes.title_color,
                            '--ia-text': attributes.text_color,
                            '--ia-input-bg': attributes.input_bg,
                            '--ia-btn-bg': attributes.btn_bg,
                            '--ia-btn-text': attributes.btn_text,
                            '--ia-mp3-bg': attributes.mp3_btn_bg,
                            '--ia-max-width': attributes.max_width
                        }
                    },
                    el(
                        'div',
                        { className: 'insta-mp3-card' },
                        el(
                            'div',
                            { className: 'insta-header' },
                            el('span', { className: 'insta-badge insta-badge-mp3' }, '320kbps HQ Audio'),
                            el('h2', { className: 'insta-mp3-title' }, attributes.title),
                            el('p', { className: 'insta-mp3-subtitle' }, attributes.subtitle)
                        ),
                        el(
                            'div',
                            { className: 'insta-mp3-form' },
                            el(
                                'div',
                                { className: 'insta-input-group' },
                                el('input', {
                                    type: 'text',
                                    className: 'insta-mp3-input',
                                    placeholder: attributes.placeholder,
                                    disabled: true
                                }),
                                el('button', { className: 'insta-paste-btn', disabled: true }, 'Paste')
                            ),
                            el('button', { className: 'insta-mp3-submit', disabled: true }, attributes.button_text)
                        )
                    )
                )
            );
        },

        save: function () {
            return null;
        }
    });
})(window.wp.blocks, window.wp.element, window.wp.components, window.wp.blockEditor || window.wp.editor);
