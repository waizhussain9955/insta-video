(function (blocks, element, blockEditor, components) {
    var el = element.createElement;
    var registerBlockType = blocks.registerBlockType;
    var InspectorControls = blockEditor.InspectorControls || blockEditor.BlockControls;
    var PanelBody = components.PanelBody;
    var TextControl = components.TextControl;
    var SelectControl = components.SelectControl;

    registerBlockType('insta-downloader/bulk', {
        title: 'Instagram Bulk Video Downloader',
        icon: 'grid-view',
        category: 'widgets',
        attributes: {
            title: { type: 'string', default: 'Instagram Bulk Profile Reel Harvester' },
            subtitle: { type: 'string', default: 'Enter an Instagram username to harvest and download up to 50 public Reels in one ZIP file.' },
            theme: { type: 'string', default: 'dark' },
            button_text: { type: 'string', default: 'Fetch Reels' },
            placeholder: { type: 'string', default: 'Enter username (e.g. cristiano, leomessi)...' },
            api_url: { type: 'string', default: 'https://api.thecalicocats.com' }
        },
        edit: function (props) {
            var attributes = props.attributes;
            var setAttributes = props.setAttributes;

            return el('div', { className: 'insta-block-preview', style: { padding: '20px', background: '#09090b', color: '#fff', borderRadius: '12px', border: '1px solid #333' } },
                el(InspectorControls, {},
                    el(PanelBody, { title: 'Bulk Harvester Settings', initialOpen: true },
                        el(TextControl, {
                            label: 'Title',
                            value: attributes.title,
                            onChange: function (val) { setAttributes({ title: val }); }
                        }),
                        el(TextControl, {
                            label: 'Subtitle',
                            value: attributes.subtitle,
                            onChange: function (val) { setAttributes({ subtitle: val }); }
                        }),
                        el(SelectControl, {
                            label: 'Color Theme',
                            value: attributes.theme,
                            options: [
                                { label: 'Dark Cyber Mode', value: 'dark' },
                                { label: 'Light Clean Mode', value: 'light' },
                                { label: 'Glassmorphism Blur', value: 'glass' }
                            ],
                            onChange: function (val) { setAttributes({ theme: val }); }
                        }),
                        el(TextControl, {
                            label: 'API Base URL',
                            value: attributes.api_url,
                            onChange: function (val) { setAttributes({ api_url: val }); }
                        })
                    )
                ),
                el('h3', { style: { margin: '0 0 10px', color: '#ec4899' } }, attributes.title),
                el('p', { style: { color: '#94a3b8', fontSize: '13px', margin: '0 0 15px' } }, attributes.subtitle),
                el('div', { style: { display: 'flex', gap: '8px' } },
                    el('input', { type: 'text', disabled: true, placeholder: attributes.placeholder, style: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#18181b', color: '#fff' } }),
                    el('button', { disabled: true, style: { padding: '10px 18px', background: '#ec4899', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' } }, attributes.button_text)
                ),
                el('small', { style: { display: 'block', marginTop: '10px', color: '#71717a' } }, 'Gutenberg Preview: Bulk Video Harvester active with Pagination & Multi-Page ZIP.')
            );
        },
        save: function () {
            return null;
        }
    });
})(window.wp.blocks, window.wp.element, window.wp.blockEditor || window.wp.editor, window.wp.components);
