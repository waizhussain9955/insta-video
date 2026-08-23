<?php
/**
 * Plugin Name: Instagram Bulk Video & Reel Harvester
 * Plugin URI: https://waizhussain9955.github.io/
 * Description: Fully customizable Gutenberg block & Shortcode to bulk harvest and download Instagram Reels with Multi-Page Pagination and ZIP export.
 * Version: 2.5.0
 * Author: Instagram Downloader Pro
 * Text Domain: insta-bulk-downloader
 */

if (!defined('ABSPATH')) {
    exit;
}

class InstaBulkDownloaderPlugin {
    public function __construct() {
        add_action('init', array($this, 'register_block'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('insta_bulk_downloader', array($this, 'render_shortcode'));
        add_shortcode('insta_profile_downloader', array($this, 'render_shortcode'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    public function enqueue_scripts() {
        wp_register_style('insta-bulk-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '2.5.0');
        wp_register_script('insta-jszip', plugin_dir_url(__FILE__) . 'assets/js/jszip.min.js', array(), '3.10.1', true);
        wp_register_script('insta-bulk-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array('insta-jszip'), '2.5.0', true);
    }

    public function register_block() {
        if (!function_exists('register_block_type')) return;

        wp_register_script(
            'insta-bulk-block-editor',
            plugin_dir_url(__FILE__) . 'assets/js/block.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor'),
            '2.5.0',
            true
        );

        register_block_type('insta-downloader/bulk', array(
            'editor_script'   => 'insta-bulk-block-editor',
            'render_callback' => array($this, 'render_shortcode')
        ));
    }

    public function render_shortcode($atts = array()) {
        wp_enqueue_style('insta-bulk-style');
        wp_enqueue_script('insta-jszip');
        wp_enqueue_script('insta-bulk-script');

        $default_api = get_option('insta_bulk_api_url', 'https://api.thecalicocats.com');

        $a = shortcode_atts(array(
            'title'         => get_option('insta_bulk_default_title', 'Instagram Bulk Profile Reel Harvester'),
            'subtitle'      => 'Harvest up to 50 public Reels and videos from any profile with Multi-Page browsing and one-click ZIP download.',
            'placeholder'   => 'Enter Instagram username (e.g. cristiano, leomessi)...',
            'button_text'   => 'Harvest Reels',
            'theme'         => 'dark',
            'api_url'       => $default_api,
            'bg_color'      => '',
            'border_color'  => '',
            'border_radius' => '16px',
            'title_color'   => '',
            'text_color'    => '',
            'input_bg'      => '',
            'input_text'    => '',
            'btn_bg'        => '',
            'btn_text'      => '',
            'max_width'     => '1050px',
            'box_shadow'    => ''
        ), $atts);

        $unique_id = 'insta_bulk_' . uniqid();

        $custom_css = '';
        if (!empty($a['bg_color'])) $custom_css .= "--ib-bg: {$a['bg_color']}; ";
        if (!empty($a['border_color'])) $custom_css .= "--ib-border: {$a['border_color']}; ";
        if (!empty($a['border_radius'])) $custom_css .= "--ib-radius: {$a['border_radius']}; ";
        if (!empty($a['title_color'])) $custom_css .= "--ib-title: {$a['title_color']}; ";
        if (!empty($a['text_color'])) $custom_css .= "--ib-text: {$a['text_color']}; ";
        if (!empty($a['input_bg'])) $custom_css .= "--ib-input-bg: {$a['input_bg']}; ";
        if (!empty($a['input_text'])) $custom_css .= "--ib-input-text: {$a['input_text']}; ";
        if (!empty($a['btn_bg'])) $custom_css .= "--ib-btn-bg: {$a['btn_bg']}; ";
        if (!empty($a['btn_text'])) $custom_css .= "--ib-btn-text: {$a['btn_text']}; ";
        if (!empty($a['max_width'])) $custom_css .= "--ib-max-width: {$a['max_width']}; ";
        if (!empty($a['box_shadow'])) $custom_css .= "--ib-shadow: {$a['box_shadow']}; ";

        ob_start();
        ?>
        <div id="<?php echo esc_attr($unique_id); ?>" class="insta-bulk-wrapper insta-theme-<?php echo esc_attr($a['theme']); ?>" data-api="<?php echo esc_url($a['api_url']); ?>" style="<?php echo esc_attr($custom_css); ?>">
            <div class="insta-bulk-card">
                <div class="insta-header">
                    <span class="insta-badge-bulk">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Bulk Reel Harvester
                    </span>
                    <h2 class="insta-title"><?php echo esc_html($a['title']); ?></h2>
                    <?php if (!empty($a['subtitle'])): ?>
                        <p class="insta-subtitle"><?php echo esc_html($a['subtitle']); ?></p>
                    <?php endif; ?>
                </div>

                <form class="insta-bulk-form" onsubmit="return false;">
                    <div class="insta-form-grid">
                        <div class="insta-input-group">
                            <span class="insta-input-icon">@</span>
                            <input type="text" class="insta-bulk-input" placeholder="<?php echo esc_attr($a['placeholder']); ?>" required />
                        </div>
                        <div>
                            <select class="insta-bulk-limit">
                                <option value="12">12 Videos</option>
                                <option value="24" selected>24 Videos</option>
                                <option value="50">50 Videos (Max)</option>
                            </select>
                        </div>
                        <div>
                            <button type="submit" class="insta-bulk-submit">
                                <span class="btn-text"><?php echo esc_html($a['button_text']); ?></span>
                                <span class="btn-loader" style="display: none; align-items: center; gap: 6px;">
                                    <svg class="insta-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                                    Harvesting...
                                </span>
                            </button>
                        </div>
                    </div>
                </form>

                <div class="insta-bulk-alert"></div>

                <div class="insta-bulk-results">
                    <!-- Top Toolbar -->
                    <div class="insta-bulk-toolbar">
                        <div class="insta-toolbar-left">
                            <button type="button" class="insta-tool-btn btn-select-all">Select All</button>
                            <button type="button" class="insta-tool-btn btn-select-page">Select Current Page</button>
                            <button type="button" class="insta-tool-btn btn-deselect-all">Deselect All</button>
                            <span class="insta-selected-badge"><b class="sel-count">0</b> Selected</span>
                        </div>
                        <div>
                            <button type="button" class="insta-zip-btn" disabled>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Package ZIP (<span class="zip-count">0</span>)
                            </button>
                        </div>
                    </div>

                    <!-- ZIP Progress Bar -->
                    <div class="insta-zip-progress">
                        <div class="insta-progress-info">
                            <span class="progress-status">Downloading videos...</span>
                            <span class="progress-pct">0%</span>
                        </div>
                        <div class="insta-progress-bar">
                            <div class="insta-progress-fill" style="width: 0%;"></div>
                        </div>
                    </div>

                    <!-- Top Pagination Bar -->
                    <div class="insta-pagination-bar insta-pagination-top"></div>

                    <!-- Video Grid -->
                    <div class="insta-bulk-grid"></div>

                    <!-- Bottom Pagination Bar -->
                    <div class="insta-pagination-bar insta-pagination-bottom"></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function add_admin_menu() {
        add_options_page(
            'Instagram Bulk Downloader',
            'Insta Bulk Downloader',
            'manage_options',
            'insta-bulk-downloader',
            array($this, 'render_admin_page')
        );
    }

    public function register_settings() {
        register_setting('insta_bulk_settings_group', 'insta_bulk_api_url');
        register_setting('insta_bulk_settings_group', 'insta_bulk_default_title');
    }

    public function render_admin_page() {
        ?>
        <div class="wrap" style="max-width: 800px;">
            <h1>Instagram Bulk Reel Harvester Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('insta_bulk_settings_group'); ?>
                <?php do_settings_sections('insta_bulk_settings_group'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">API Backend URL</th>
                        <td>
                            <input type="url" name="insta_bulk_api_url" value="<?php echo esc_attr(get_option('insta_bulk_api_url', 'https://api.thecalicocats.com')); ?>" class="regular-text" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Title</th>
                        <td>
                            <input type="text" name="insta_bulk_default_title" value="<?php echo esc_attr(get_option('insta_bulk_default_title', 'Instagram Bulk Profile Reel Harvester')); ?>" class="regular-text" />
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <hr />
            <h3>Shortcode Usage:</h3>
            <code>[insta_bulk_downloader]</code>
        </div>
        <?php
    }
}

new InstaBulkDownloaderPlugin();
