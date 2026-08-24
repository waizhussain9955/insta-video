(function (blocks, element, blockEditor, components) {
    var el = element.createElement;
    var registerBlockType = blocks.registerBlockType;
    var InspectorControls = blockEditor.InspectorControls || blockEditor.BlockControls;
    var PanelBody = components.PanelBody;
    var TextControl = components.TextControl;
    var SelectControl = components.SelectControl;
    var RangeControl = components.RangeControl;
    var ToggleControl = components.ToggleControl;
    var ColorPalette = components.ColorPalette;

    var colorPresets = [
        { name: 'Pink Neon', color: '#ec4899' },
        { name: 'Purple Glow', color: '#8b5cf6' },
        { name: 'Cyan Tech', color: '#06b6d4' },
        { name: 'Dark Onyx', color: '#09090b' },
        { name: 'Pure White', color: '#ffffff' }
    ];

    registerBlockType('insta-downloader/bulk', {
        title: 'Instagram Bulk Profile Harvester',
        description: 'Bulk download multiple Reels & MP4 videos from any Instagram profile with multi-page browsing and client-side ZIP generator.',
        icon: 'grid-view',
        category: 'widgets',
        attributes: {
            badge_text: { type: 'string', default: 'BULK REEL HARVESTER' },
            show_badge: { type: 'boolean', default: true },
            title: { type: 'string', default: 'Instagram Bulk Profile Reel Harvester' },
            subtitle: { type: 'string', default: 'Harvest up to 50 public Reels and videos from any profile with Multi-Page browsing and one-click ZIP download.' },
            show_subtitle: { type: 'boolean', default: true },
            placeholder: { type: 'string', default: 'Enter Instagram username or profile link...' },
            button_text: { type: 'string', default: 'Harvest Reels' },
            default_limit: { type: 'string', default: '24' },
            api_url: { type: 'string', default: 'https://api.thecalicocats.com' },
            show_paste_btn: { type: 'boolean', default: true },
            theme: { type: 'string', default: 'cyber-purple' },
            bg_color: { type: 'string', default: '#09090b' },
            card_border: { type: 'string', default: 'rgba(255, 255, 255, 0.12)' },
            title_color: { type: 'string', default: '#ffffff' },
            text_color: { type: 'string', default: '#94a3b8' },
            input_bg: { type: 'string', default: 'rgba(255, 255, 255, 0.05)' },
            input_text: { type: 'string', default: '#ffffff' },
            btn_bg: { type: 'string', default: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' },
            btn_text: { type: 'string', default: '#ffffff' },
            max_width: { type: 'number', default: 900 },
            border_radius: { type: 'number', default: 20 },
            card_padding: { type: 'number', default: 36 },
            blur_amount: { type: 'number', default: 16 },
            shadow_style: { type: 'string', default: 'glow' }
        },
        edit: function (props) {
            var a = props.attributes;
            var set = props.setAttributes;

            var shadowMap = {
                'none': 'none',
                'soft': '0 10px 30px rgba(0, 0, 0, 0.3)',
                'glow': '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(236, 72, 153, 0.15)',
                'neon': '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 246, 0.3)'
            };

            return el('div', { className: 'insta-gutenberg-wrapper', style: { width: '100%', maxWidth: a.max_width + 'px', margin: '20px auto' } },
                el(InspectorControls, {},
                    el(PanelBody, { title: '📝 Content & Headings', initialOpen: true },
                        el(ToggleControl, {
                            label: 'Show Header Badge',
                            checked: a.show_badge,
                            onChange: function (v) { set({ show_badge: v }); }
                        }),
                        a.show_badge && el(TextControl, {
                            label: 'Badge Text',
                            value: a.badge_text,
                            onChange: function (v) { set({ badge_text: v }); }
                        }),
                        el(TextControl, {
                            label: 'Main Title',
                            value: a.title,
                            onChange: function (v) { set({ title: v }); }
                        }),
                        el(ToggleControl, {
                            label: 'Show Subtitle',
                            checked: a.show_subtitle,
                            onChange: function (v) { set({ show_subtitle: v }); }
                        }),
                        a.show_subtitle && el(TextControl, {
                            label: 'Subtitle Text',
                            value: a.subtitle,
                            onChange: function (v) { set({ subtitle: v }); }
                        }),
                        el(SelectControl, {
                            label: 'Default Harvest Limit',
                            value: a.default_limit,
                            options: [
                                { label: '12 Videos (Page 1)', value: '12' },
                                { label: '24 Videos (Multi-Page)', value: '24' },
                                { label: '50 Videos (Max Multi-Page)', value: '50' }
                            ],
                            onChange: function (v) { set({ default_limit: v }); }
                        }),
                        el(ToggleControl, {
                            label: 'Enable "Paste" Button',
                            checked: a.show_paste_btn,
                            onChange: function (v) { set({ show_paste_btn: v }); }
                        })
                    ),
                    el(PanelBody, { title: '🎨 Colors & Theme Palette', initialOpen: false },
                        el('p', { style: { fontWeight: 'bold', margin: '12px 0 6px' } }, 'Background Color:'),
                        el(ColorPalette, {
                            colors: colorPresets,
                            value: a.bg_color,
                            onChange: function (v) { set({ bg_color: v || '#09090b' }); }
                        }),
                        el('p', { style: { fontWeight: 'bold', margin: '12px 0 6px' } }, 'Title Color:'),
                        el(ColorPalette, {
                            colors: colorPresets,
                            value: a.title_color,
                            onChange: function (v) { set({ title_color: v || '#ffffff' }); }
                        }),
                        el(TextControl, {
                            label: 'Button Background (Color or Gradient)',
                            value: a.btn_bg,
                            onChange: function (v) { set({ btn_bg: v }); }
                        })
                    ),
                    el(PanelBody, { title: '📐 Layout & Sizing', initialOpen: false },
                        el(RangeControl, {
                            label: 'Max Width (px)',
                            value: a.max_width,
                            min: 600,
                            max: 1300,
                            step: 20,
                            onChange: function (v) { set({ max_width: v }); }
                        }),
                        el(RangeControl, {
                            label: 'Border Radius (px)',
                            value: a.border_radius,
                            min: 0,
                            max: 36,
                            step: 2,
                            onChange: function (v) { set({ border_radius: v }); }
                        }),
                        el(RangeControl, {
                            label: 'Card Padding (px)',
                            value: a.card_padding,
                            min: 16,
                            max: 60,
                            step: 4,
                            onChange: function (v) { set({ card_padding: v }); }
                        })
                    )
                ),
                el('div', {
                    style: {
                        background: a.bg_color,
                        color: a.text_color,
                        borderRadius: a.border_radius + 'px',
                        border: '1px solid ' + a.card_border,
                        padding: a.card_padding + 'px',
                        boxShadow: shadowMap[a.shadow_style] || shadowMap.glow,
                        backdropFilter: 'blur(' + a.blur_amount + 'px)',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }
                },
                    a.show_badge && el('div', { style: { textAlign: 'center', marginBottom: '10px' } },
                        el('span', { style: { display: 'inline-block', padding: '4px 14px', borderRadius: '999px', background: 'rgba(236,72,153,0.15)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.3)', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' } }, a.badge_text)
                    ),
                    el('h3', { style: { textAlign: 'center', margin: '0 0 8px', color: a.title_color, fontSize: '24px', fontWeight: '800' } }, a.title),
                    a.show_subtitle && el('p', { style: { textAlign: 'center', margin: '0 0 20px', color: a.text_color, fontSize: '13px', lineHeight: '1.5' } }, a.subtitle),
                    el('div', { style: { display: 'flex', gap: '8px' } },
                        el('input', {
                            type: 'text',
                            disabled: true,
                            placeholder: a.placeholder,
                            style: {
                                flex: 2,
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid ' + a.card_border,
                                background: a.input_bg,
                                color: a.input_text,
                                fontSize: '14px'
                            }
                        }),
                        el('select', {
                            disabled: true,
                            style: {
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid ' + a.card_border,
                                background: a.input_bg,
                                color: a.input_text
                            }
                        }, el('option', {}, a.default_limit + ' Videos')),
                        el('button', {
                            disabled: true,
                            style: {
                                padding: '12px 22px',
                                background: a.btn_bg,
                                color: a.btn_text,
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: '700',
                                fontSize: '14px'
                            }
                        }, a.button_text)
                    ),
                    el('div', { style: { marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#71717a' } },
                        el('span', {}, '📦 Bulk Harvester Multi-Page Gutenberg Live Preview'),
                        el('span', {}, 'Client-Side Offline JSZip Active')
                    )
                )
            );
        },
        save: function () {
            return null;
        }
    });
})(window.wp.blocks, window.wp.element, window.wp.blockEditor || window.wp.editor, window.wp.components);
