(function (blocks, element, components, blockEditor) {
    const { registerBlockType } = blocks;
    const { createElement: el, Fragment } = element;
    const { InspectorControls, PanelColorSettings } = blockEditor;
    const { PanelBody, TextControl, SelectControl, RangeControl } = components;

    registerBlockType('insta-downloader/single', {
        title: 'Instagram Single Downloader',
        icon: 'video-alt3',
        category: 'widgets',
        description: 'Embed a high-speed Instagram Reel & Video Downloader with live color, text & transparency customizations.',
        attributes: {
            title: { type: 'string', default: 'Instagram Reel & Video Downloader' },
            subtitle: { type: 'string', default: 'Paste any public Instagram reel or video link to download in HD MP4.' },
            placeholder: { type: 'string', default: 'Paste Instagram video or reel link here...' },
            button_text: { type: 'string', default: 'Fetch Video' },
            bg_color: { type: 'string', default: 'rgba(24, 24, 27, 0.85)' },
            border_color: { type: 'string', default: 'rgba(255, 255, 255, 0.1)' },
            border_radius: { type: 'string', default: '16px' },
            title_color: { type: 'string', default: '#ffffff' },
            text_color: { type: 'string', default: '#a1a1aa' },
            input_bg: { type: 'string', default: 'rgba(255, 255, 255, 0.05)' },
            btn_bg: { type: 'string', default: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #a855f7 100%)' },
            btn_text: { type: 'string', default: '#ffffff' },
            dl_btn_bg: { type: 'string', default: '#10b981' },
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
                            label: 'Input Placeholder',
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
                        el(SelectControl, {
                            label: 'Theme Style',
                            value: attributes.theme,
                            options: [
                                { label: 'Modern Dark (Glassmorphic)', value: 'dark' },
                                { label: 'Clean Light', value: 'light' },
                                { label: 'Instagram Gradient', value: 'gradient' },
                                { label: 'Custom Palette', value: 'custom' }
                            ],
                            onChange: (val) => setAttributes({ theme: val })
                        }),
                        el(TextControl, {
                            label: 'Container Background (Hex or RGBA)',
                            value: attributes.bg_color,
                            onChange: (val) => setAttributes({ bg_color: val })
                        }),
                        el(TextControl, {
                            label: 'Title Color',
                            value: attributes.title_color,
                            onChange: (val) => setAttributes({ title_color: val })
                        }),
                        el(TextControl, {
                            label: 'Subtitle Text Color',
                            value: attributes.text_color,
                            onChange: (val) => setAttributes({ text_color: val })
                        }),
                        el(TextControl, {
                            label: 'Input Field Background',
                            value: attributes.input_bg,
                            onChange: (val) => setAttributes({ input_bg: val })
                        }),
                        el(TextControl, {
                            label: 'Action Button Background (CSS/Gradient)',
                            value: attributes.btn_bg,
                            onChange: (val) => setAttributes({ btn_bg: val })
                        }),
                        el(TextControl, {
                            label: 'Action Button Text Color',
                            value: attributes.btn_text,
                            onChange: (val) => setAttributes({ btn_text: val })
                        }),
                        el(TextControl, {
                            label: 'Download Button Color',
                            value: attributes.dl_btn_bg,
                            onChange: (val) => setAttributes({ dl_btn_bg: val })
                        })
                    ),
                    el(
                        PanelBody,
                        { title: 'Layout & API Settings', initialOpen: false },
                        el(TextControl, {
                            label: 'Border Radius',
                            value: attributes.border_radius,
                            onChange: (val) => setAttributes({ border_radius: val })
                        }),
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
                // Editor visual preview
                el(
                    'div',
                    {
                        className: 'insta-single-wrapper',
                        style: {
                            '--is-bg': attributes.bg_color,
                            '--is-border': attributes.border_color,
                            '--is-radius': attributes.border_radius,
                            '--is-title': attributes.title_color,
                            '--is-text': attributes.text_color,
                            '--is-input-bg': attributes.input_bg,
                            '--is-btn-bg': attributes.btn_bg,
                            '--is-btn-text': attributes.btn_text,
                            '--is-dl-bg': attributes.dl_btn_bg,
                            '--is-max-width': attributes.max_width
                        }
                    },
                    el(
                        'div',
                        { className: 'insta-single-card' },
                        el(
                            'div',
                            { className: 'insta-header' },
                            el('span', { className: 'insta-badge' }, '100% HD Downloader'),
                            el('h2', { className: 'insta-single-title' }, attributes.title),
                            el('p', { className: 'insta-single-subtitle' }, attributes.subtitle)
                        ),
                        el(
                            'div',
                            { className: 'insta-single-form' },
                            el(
                                'div',
                                { className: 'insta-input-group' },
                                el('input', {
                                    type: 'text',
                                    className: 'insta-single-input',
                                    placeholder: attributes.placeholder,
                                    disabled: true
                                }),
                                el('button', { className: 'insta-paste-btn', disabled: true }, 'Paste')
                            ),
                            el(
                                'button',
                                { className: 'insta-single-submit', disabled: true },
                                attributes.button_text
                            )
                        )
                    )
                )
            );
        },

        save: function () {
            // Rendered on server via PHP render_callback
            return null;
        }
    });
})(window.wp.blocks, window.wp.element, window.wp.components, window.wp.blockEditor || window.wp.editor);
