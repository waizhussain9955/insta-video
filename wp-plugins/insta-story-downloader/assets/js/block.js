(function (blocks, element, components, blockEditor) {
    const { registerBlockType } = blocks;
    const { createElement: el, Fragment } = element;
    const { InspectorControls } = blockEditor;
    const { PanelBody, TextControl, SelectControl } = components;

    registerBlockType('insta-downloader/story', {
        title: 'Instagram Story Downloader',
        icon: 'camera-alt',
        category: 'widgets',
        description: 'Embed an Instagram Story & Highlights Downloader with custom colors and glassmorphic designs.',
        attributes: {
            title: { type: 'string', default: 'Instagram Story Downloader' },
            subtitle: { type: 'string', default: 'View and download public Instagram stories anonymously.' },
            placeholder: { type: 'string', default: 'Instagram Username (e.g. cristiano)' },
            button_text: { type: 'string', default: 'Fetch Stories' },
            bg_color: { type: 'string', default: 'rgba(24, 24, 27, 0.85)' },
            border_color: { type: 'string', default: 'rgba(255, 255, 255, 0.1)' },
            border_radius: { type: 'string', default: '16px' },
            title_color: { type: 'string', default: '#ffffff' },
            text_color: { type: 'string', default: '#a1a1aa' },
            input_bg: { type: 'string', default: 'rgba(255, 255, 255, 0.05)' },
            btn_bg: { type: 'string', default: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)' },
            btn_text: { type: 'string', default: '#ffffff' },
            api_url: { type: 'string', default: 'https://api.thecalicocats.com' },
            theme: { type: 'string', default: 'dark' },
            max_width: { type: 'string', default: '900px' }
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
                            label: 'Placeholder',
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
                            label: 'Button Color / Gradient',
                            value: attributes.btn_bg,
                            onChange: (val) => setAttributes({ btn_bg: val })
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
                        className: 'insta-story-wrapper',
                        style: {
                            '--ist-bg': attributes.bg_color,
                            '--ist-border': attributes.border_color,
                            '--ist-radius': attributes.border_radius,
                            '--ist-title': attributes.title_color,
                            '--ist-text': attributes.text_color,
                            '--ist-input-bg': attributes.input_bg,
                            '--ist-btn-bg': attributes.btn_bg,
                            '--ist-btn-text': attributes.btn_text,
                            '--ist-max-width': attributes.max_width
                        }
                    },
                    el(
                        'div',
                        { className: 'insta-story-card' },
                        el(
                            'div',
                            { className: 'insta-header' },
                            el('span', { className: 'insta-badge insta-badge-story' }, 'Anonymous Story Viewer'),
                            el('h2', { className: 'insta-story-title' }, attributes.title),
                            el('p', { className: 'insta-story-subtitle' }, attributes.subtitle)
                        ),
                        el(
                            'div',
                            { className: 'insta-story-form' },
                            el(
                                'div',
                                { className: 'insta-input-group' },
                                el('input', {
                                    type: 'text',
                                    className: 'insta-story-input',
                                    placeholder: attributes.placeholder,
                                    disabled: true
                                }),
                                el('button', { className: 'insta-paste-btn', disabled: true }, 'Paste')
                            ),
                            el('button', { className: 'insta-story-submit', disabled: true }, attributes.button_text)
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
