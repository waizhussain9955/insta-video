(function (blocks, element, components, blockEditor) {
    const { registerBlockType } = blocks;
    const { createElement: el, Fragment } = element;
    const { InspectorControls } = blockEditor;
    const { PanelBody, TextControl, SelectControl } = components;

    registerBlockType('insta-downloader/bulk', {
        title: 'Instagram Bulk Downloader',
        icon: 'images-alt2',
        category: 'widgets',
        description: 'Embed a high-speed Instagram Bulk Profile Reels & Video Downloader with multi-select and ZIP packaging.',
        attributes: {
            title: { type: 'string', default: 'Bulk Reels & Video Downloader' },
            subtitle: { type: 'string', default: 'Harvest all Reels and MP4 Videos from any public Instagram profile.' },
            placeholder: { type: 'string', default: 'Instagram Username or Profile Link' },
            button_text: { type: 'string', default: 'Fetch Reels & Videos' },
            bg_color: { type: 'string', default: 'rgba(24, 24, 27, 0.85)' },
            border_color: { type: 'string', default: 'rgba(255, 255, 255, 0.1)' },
            border_radius: { type: 'string', default: '16px' },
            title_color: { type: 'string', default: '#ffffff' },
            text_color: { type: 'string', default: '#a1a1aa' },
            input_bg: { type: 'string', default: 'rgba(255, 255, 255, 0.05)' },
            btn_bg: { type: 'string', default: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)' },
            btn_text: { type: 'string', default: '#ffffff' },
            zip_btn_bg: { type: 'string', default: '#10b981' },
            api_url: { type: 'string', default: 'https://api.thecalicocats.com' },
            theme: { type: 'string', default: 'dark' },
            max_width: { type: 'string', default: '950px' }
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
                            label: 'Button Text',
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
                                { label: 'Modern Dark Glassmorphic', value: 'dark' },
                                { label: 'Clean Light', value: 'light' },
                                { label: 'Instagram Gradient', value: 'gradient' },
                                { label: 'Custom Palette', value: 'custom' }
                            ],
                            onChange: (val) => setAttributes({ theme: val })
                        }),
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
                            label: 'Fetch Button Color / Gradient',
                            value: attributes.btn_bg,
                            onChange: (val) => setAttributes({ btn_bg: val })
                        }),
                        el(TextControl, {
                            label: 'ZIP Download Button Color',
                            value: attributes.zip_btn_bg,
                            onChange: (val) => setAttributes({ zip_btn_bg: val })
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
                        className: 'insta-bulk-wrapper',
                        style: {
                            '--ib-bg': attributes.bg_color,
                            '--ib-border': attributes.border_color,
                            '--ib-radius': attributes.border_radius,
                            '--ib-title': attributes.title_color,
                            '--ib-text': attributes.text_color,
                            '--ib-input-bg': attributes.input_bg,
                            '--ib-btn-bg': attributes.btn_bg,
                            '--ib-btn-text': attributes.btn_text,
                            '--ib-zip-bg': attributes.zip_btn_bg,
                            '--ib-max-width': attributes.max_width
                        }
                    },
                    el(
                        'div',
                        { className: 'insta-bulk-card' },
                        el(
                            'div',
                            { className: 'insta-header' },
                            el('span', { className: 'insta-badge insta-badge-bulk' }, 'Bulk Profile Harvester'),
                            el('h2', { className: 'insta-bulk-title' }, attributes.title),
                            el('p', { className: 'insta-bulk-subtitle' }, attributes.subtitle)
                        ),
                        el(
                            'div',
                            { className: 'insta-form-grid' },
                            el('input', {
                                type: 'text',
                                className: 'insta-bulk-input',
                                placeholder: attributes.placeholder,
                                disabled: true
                            }),
                            el('select', { className: 'insta-bulk-limit', disabled: true }, el('option', null, '12 Videos')),
                            el('button', { className: 'insta-bulk-submit', disabled: true }, attributes.button_text)
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
