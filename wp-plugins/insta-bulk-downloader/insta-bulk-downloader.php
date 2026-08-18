<?php
/**
 * Plugin Name: Instagram Bulk Reels & Video Downloader
 * Plugin URI: https://api.thecalicocats.com
 * Description: Fully customizable Gutenberg block & shortcode to harvest and bulk download Instagram Reels & MP4 Videos as ZIP.
 * Version: 2.0.0
 * Author: InstaSave Pro
 * Text Domain: insta-bulk-downloader
 */

if (!defined('ABSPATH')) {
    exit;
}

class InstaBulkDownloader {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_shortcode('insta_bulk_downloader', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('init', array($this, 'register_gutenberg_block'));
    }

    public function add_settings_page() {
        add_options_page(
            'Insta Bulk Downloader',
            'Insta Bulk Downloader',
            'manage_options',
            'insta-bulk-downloader',
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        register_setting('insta_bulk_settings', 'insta_bulk_api_url');
        register_setting('insta_bulk_settings', 'insta_bulk_default_theme');
        register_setting('insta_bulk_settings', 'insta_bulk_bg_color');
        register_setting('insta_bulk_settings', 'insta_bulk_text_color');
        register_setting('insta_bulk_settings', 'insta_bulk_title_color');
        register_setting('insta_bulk_settings', 'insta_bulk_btn_bg');
        register_setting('insta_bulk_settings', 'insta_bulk_btn_text');
        register_setting('insta_bulk_settings', 'insta_bulk_border_radius');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap" style="max-width: 800px;">
            <h1><span class="dashicons dashicons-images-alt2" style="font-size: 28px; margin-right: 8px;"></span> Instagram Bulk Downloader Settings</h1>
            <p>Configure default styling and backend API connection for Bulk Reels & Profile Video Downloader.</p>
            <form method="post" action="options.php" style="background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 20px;">
                <?php settings_fields('insta_bulk_settings'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Backend API URL</th>
                        <td>
                            <input type="url" name="insta_bulk_api_url" value="<?php echo esc_attr(get_option('insta_bulk_api_url', 'https://api.thecalicocats.com')); ?>" class="regular-text" style="width: 100%;" />
                            <p class="description">Your hosted downloader API endpoint (e.g. <code>https://api.thecalicocats.com</code>)</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Theme Preset</th>
                        <td>
                            <select name="insta_bulk_default_theme">
                                <option value="dark" <?php selected(get_option('insta_bulk_default_theme', 'dark'), 'dark'); ?>>Modern Dark Glassmorphism</option>
                                <option value="light" <?php selected(get_option('insta_bulk_default_theme'), 'light'); ?>>Clean Minimalist Light</option>
                                <option value="gradient" <?php selected(get_option('insta_bulk_default_theme'), 'gradient'); ?>>Instagram Vibrant Gradient</option>
                                <option value="custom" <?php selected(get_option('insta_bulk_default_theme'), 'custom'); ?>>Custom Palette</option>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Container Background</th>
                        <td>
                            <input type="text" name="insta_bulk_bg_color" value="<?php echo esc_attr(get_option('insta_bulk_bg_color', 'rgba(24, 24, 27, 0.85)')); ?>" class="regular-text" placeholder="rgba(24, 24, 27, 0.85) or #18181b" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Button Background</th>
                        <td>
                            <input type="text" name="insta_bulk_btn_bg" value="<?php echo esc_attr(get_option('insta_bulk_btn_bg', 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)')); ?>" class="regular-text" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Text & Title Color</th>
                        <td>
                            <input type="text" name="insta_bulk_title_color" value="<?php echo esc_attr(get_option('insta_bulk_title_color', '#ffffff')); ?>" placeholder="#ffffff" style="margin-right: 10px;" />
                            <input type="text" name="insta_bulk_text_color" value="<?php echo esc_attr(get_option('insta_bulk_text_color', '#a1a1aa')); ?>" placeholder="#a1a1aa" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Border Radius</th>
                        <td>
                            <input type="text" name="insta_bulk_border_radius" value="<?php echo esc_attr(get_option('insta_bulk_border_radius', '16px')); ?>" class="small-text" />
                        </td>
                    </tr>
                </table>
                <?php submit_button('Save Settings'); ?>
            </form>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <h3>Shortcode Usage</h3>
                <p>Embed anywhere using: <code>[insta_bulk_downloader]</code></p>
                <p>With Custom Attributes:</p>
                <code>[insta_bulk_downloader title="Bulk Instagram Reels Downloader" bg_color="rgba(15,23,42,0.95)" max_width="900px"]</code>
            </div>
        </div>
        <?php
    }

    public function render_shortcode($atts) {
        $a = shortcode_atts(array(
            'title'         => 'Bulk Reels & Video Downloader',
            'subtitle'      => 'Harvest all Reels and MP4 Videos from any public Instagram profile. Download individually or package as high-speed ZIP.',
            'placeholder'   => 'Instagram Username or Profile Link (e.g. ranacomputers)',
            'button_text'   => 'Fetch Reels & Videos',
            'bg_color'      => get_option('insta_bulk_bg_color', 'rgba(24, 24, 27, 0.85)'),
            'border_color'  => 'rgba(255, 255, 255, 0.1)',
            'border_radius' => get_option('insta_bulk_border_radius', '16px'),
            'title_color'   => get_option('insta_bulk_title_color', '#ffffff'),
            'text_color'    => get_option('insta_bulk_text_color', '#a1a1aa'),
            'input_bg'      => 'rgba(255, 255, 255, 0.05)',
            'input_text'    => '#ffffff',
            'btn_bg'        => get_option('insta_bulk_btn_bg', 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)'),
            'btn_text'      => get_option('insta_bulk_btn_text', '#ffffff'),
            'zip_btn_bg'    => '#10b981',
            'zip_btn_text'  => '#ffffff',
            'card_bg'       => 'rgba(255, 255, 255, 0.03)',
            'api_url'       => get_option('insta_bulk_api_url', 'https://api.thecalicocats.com'),
            'max_width'     => '950px',
            'theme'         => get_option('insta_bulk_default_theme', 'dark'),
            'box_shadow'    => '0 20px 40px rgba(0,0,0,0.3)',
            'blur'          => '16px'
        ), $atts, 'insta_bulk_downloader');

        $unique_id = 'insta_bulk_' . substr(md5(uniqid(rand(), true)), 0, 8);

        ob_start();
        ?>
        <style>
            #<?php echo esc_attr($unique_id); ?> {
                --ib-bg: <?php echo esc_attr($a['bg_color']); ?>;
                --ib-border: <?php echo esc_attr($a['border_color']); ?>;
                --ib-radius: <?php echo esc_attr($a['border_radius']); ?>;
                --ib-title: <?php echo esc_attr($a['title_color']); ?>;
                --ib-text: <?php echo esc_attr($a['text_color']); ?>;
                --ib-input-bg: <?php echo esc_attr($a['input_bg']); ?>;
                --ib-input-text: <?php echo esc_attr($a['input_text']); ?>;
                --ib-btn-bg: <?php echo esc_attr($a['btn_bg']); ?>;
                --ib-btn-text: <?php echo esc_attr($a['btn_text']); ?>;
                --ib-zip-bg: <?php echo esc_attr($a['zip_btn_bg']); ?>;
                --ib-zip-text: <?php echo esc_attr($a['zip_btn_text']); ?>;
                --ib-card-bg: <?php echo esc_attr($a['card_bg']); ?>;
                --ib-max-width: <?php echo esc_attr($a['max_width']); ?>;
                --ib-shadow: <?php echo esc_attr($a['box_shadow']); ?>;
                --ib-blur: <?php echo esc_attr($a['blur']); ?>;
            }
        </style>

        <div id="<?php echo esc_attr($unique_id); ?>" class="insta-bulk-wrapper insta-theme-<?php echo esc_attr($a['theme']); ?>" data-api="<?php echo esc_url($a['api_url']); ?>">
            <div class="insta-bulk-card">
                <div class="insta-header">
                    <span class="insta-badge insta-badge-bulk">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        Bulk Profile Harvester
                    </span>
                    <h2 class="insta-bulk-title"><?php echo esc_html($a['title']); ?></h2>
                    <?php if (!empty($a['subtitle'])): ?>
                        <p class="insta-bulk-subtitle"><?php echo esc_html($a['subtitle']); ?></p>
                    <?php endif; ?>
                </div>

                <form class="insta-bulk-form" onsubmit="return false;">
                    <div class="insta-form-grid">
                        <div class="insta-input-group">
                            <span class="insta-input-icon">@</span>
                            <input type="text" class="insta-bulk-input" placeholder="<?php echo esc_attr($a['placeholder']); ?>" required />
                        </div>
                        <div class="insta-select-group">
                            <select class="insta-bulk-limit">
                                <option value="12">12 Videos</option>
                                <option value="24">24 Videos</option>
                                <option value="50">50 Videos</option>
                            </select>
                        </div>
                        <button type="submit" class="insta-bulk-submit">
                            <span class="btn-text"><?php echo esc_html($a['button_text']); ?></span>
                            <span class="btn-loader" style="display: none;">
                                <svg class="insta-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                            </span>
                        </button>
                    </div>
                </form>

                <div class="insta-bulk-alert" style="display: none;"></div>

                <div class="insta-bulk-results" style="display: none;">
                    <div class="insta-bulk-toolbar">
                        <div class="insta-toolbar-left">
                            <button type="button" class="insta-tool-btn btn-select-all">Select All</button>
                            <button type="button" class="insta-tool-btn btn-deselect-all">Deselect All</button>
                            <span class="insta-selected-badge">Selected: <b class="sel-count">0</b></span>
                        </div>
                        <div class="insta-toolbar-right">
                            <button type="button" class="insta-zip-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <span>Download ZIP (<span class="zip-count">0</span>)</span>
                            </button>
                        </div>
                    </div>

                    <div class="insta-zip-progress" style="display: none;">
                        <div class="insta-progress-info">
                            <span class="progress-status">Packaging videos into high-speed ZIP...</span>
                            <span class="progress-pct">0%</span>
                        </div>
                        <div class="insta-progress-bar">
                            <div class="insta-progress-fill" style="width: 0%;"></div>
                        </div>
                    </div>

                    <div class="insta-bulk-grid"></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function enqueue_assets() {
        wp_enqueue_style('insta-bulk-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '2.0.0');
        wp_enqueue_script('jszip', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', array(), '3.10.1', true);
        wp_enqueue_script('insta-bulk-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array('jquery', 'jszip'), '2.0.0', true);
    }

    public function register_gutenberg_block() {
        if (!function_exists('register_block_type')) {
            return;
        }

        wp_register_script(
            'insta-bulk-block-editor',
            plugin_dir_url(__FILE__) . 'assets/js/block.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor'),
            '2.0.0',
            true
        );

        wp_register_style(
            'insta-bulk-block-editor-style',
            plugin_dir_url(__FILE__) . 'assets/css/style.css',
            array(),
            '2.0.0'
        );

        register_block_type('insta-downloader/bulk', array(
            'editor_script'   => 'insta-bulk-block-editor',
            'editor_style'    => 'insta-bulk-block-editor-style',
            'render_callback' => array($this, 'render_shortcode'),
            'attributes'      => array(
                'title'         => array('type' => 'string', 'default' => 'Bulk Reels & Video Downloader'),
                'subtitle'      => array('type' => 'string', 'default' => 'Harvest all Reels and MP4 Videos from any public Instagram profile.'),
                'placeholder'   => array('type' => 'string', 'default' => 'Instagram Username or Profile Link'),
                'button_text'   => array('type' => 'string', 'default' => 'Fetch Reels & Videos'),
                'bg_color'      => array('type' => 'string', 'default' => 'rgba(24, 24, 27, 0.85)'),
                'border_color'  => array('type' => 'string', 'default' => 'rgba(255, 255, 255, 0.1)'),
                'border_radius' => array('type' => 'string', 'default' => '16px'),
                'title_color'   => array('type' => 'string', 'default' => '#ffffff'),
                'text_color'    => array('type' => 'string', 'default' => '#a1a1aa'),
                'input_bg'      => array('type' => 'string', 'default' => 'rgba(255, 255, 255, 0.05)'),
                'btn_bg'        => array('type' => 'string', 'default' => 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)'),
                'btn_text'      => array('type' => 'string', 'default' => '#ffffff'),
                'zip_btn_bg'    => array('type' => 'string', 'default' => '#10b981'),
                'api_url'       => array('type' => 'string', 'default' => 'https://api.thecalicocats.com'),
                'theme'         => array('type' => 'string', 'default' => 'dark'),
                'max_width'     => array('type' => 'string', 'default' => '950px')
            )
        ));
    }
}

new InstaBulkDownloader();
