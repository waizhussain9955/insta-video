<?php
/**
 * Plugin Name: Instagram Bulk Profile Video Downloader
 * Plugin URI: https://waizhussain9955.github.io/
 * Description: Bulk harvest and download up to 50 public Reels and MP4 videos from any Instagram profile with Multi-Page browsing and client-side ZIP packaging.
 * Version: 2.6.0
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
        wp_register_style('insta-bulk-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '2.6.0');
        wp_register_script('insta-jszip', plugin_dir_url(__FILE__) . 'assets/js/jszip.min.js', array(), '3.10.1', true);
        wp_register_script('insta-bulk-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array('insta-jszip'), '2.6.0', true);
    }

    public function register_block() {
        if (!function_exists('register_block_type')) return;

        wp_register_script(
            'insta-bulk-block-editor',
            plugin_dir_url(__FILE__) . 'assets/js/block.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor'),
            '2.6.0',
            true
        );

        register_block_type('insta-downloader/bulk', array(
            'editor_script'   => 'insta-bulk-block-editor',
            'render_callback' => array($this, 'render_shortcode'),
            'attributes'      => array(
                'badge_text'         => array('type' => 'string', 'default' => 'BULK REEL HARVESTER'),
                'show_badge'         => array('type' => 'boolean', 'default' => true),
                'title'              => array('type' => 'string', 'default' => 'Instagram Bulk Profile Reel Harvester'),
                'subtitle'           => array('type' => 'string', 'default' => 'Harvest up to 50 public Reels and videos from any profile with Multi-Page browsing and one-click ZIP download.'),
                'show_subtitle'      => array('type' => 'boolean', 'default' => true),
                'placeholder'        => array('type' => 'string', 'default' => 'Enter Instagram username or profile link...'),
                'button_text'        => array('type' => 'string', 'default' => 'Harvest Reels'),
                'default_limit'      => array('type' => 'string', 'default' => '24'),
                'api_url'            => array('type' => 'string', 'default' => 'https://api.thecalicocats.com'),
                'show_paste_btn'     => array('type' => 'boolean', 'default' => true),
                'theme'              => array('type' => 'string', 'default' => 'cyber-purple'),
                'bg_color'           => array('type' => 'string', 'default' => ''),
                'card_border'        => array('type' => 'string', 'default' => ''),
                'title_color'        => array('type' => 'string', 'default' => ''),
                'text_color'         => array('type' => 'string', 'default' => ''),
                'input_bg'           => array('type' => 'string', 'default' => ''),
                'input_text'         => array('type' => 'string', 'default' => ''),
                'btn_bg'             => array('type' => 'string', 'default' => ''),
                'btn_text'           => array('type' => 'string', 'default' => ''),
                'max_width'          => array('type' => 'number', 'default' => 900),
                'border_radius'      => array('type' => 'number', 'default' => 20),
                'card_padding'       => array('type' => 'number', 'default' => 36),
                'blur_amount'        => array('type' => 'number', 'default' => 16),
                'shadow_style'       => array('type' => 'string', 'default' => 'glow')
            )
        ));
    }

    public function render_shortcode($atts = array()) {
        wp_enqueue_style('insta-bulk-style');
        wp_enqueue_script('insta-jszip');
        wp_enqueue_script('insta-bulk-script');

        $default_api = get_option('insta_bulk_api_url', 'https://api.thecalicocats.com');

        $a = shortcode_atts(array(
            'badge_text'         => 'BULK REEL HARVESTER',
            'show_badge'         => 'true',
            'title'              => get_option('insta_bulk_default_title', 'Instagram Bulk Profile Reel Harvester'),
            'subtitle'           => 'Harvest up to 50 public Reels and videos from any profile with Multi-Page browsing and one-click ZIP download.',
            'show_subtitle'      => 'true',
            'placeholder'        => 'Enter Instagram username or profile link...',
            'button_text'        => 'Harvest Reels',
            'default_limit'      => '24',
            'theme'              => 'cyber-purple',
            'api_url'            => $default_api,
            'show_paste_btn'     => 'true',
            'bg_color'           => '',
            'border_color'       => '',
            'card_border'        => '',
            'title_color'        => '',
            'text_color'         => '',
            'input_bg'           => '',
            'input_text'         => '',
            'btn_bg'             => '',
            'btn_text'           => '',
            'max_width'          => '900',
            'border_radius'      => '20',
            'card_padding'       => '36',
            'blur_amount'        => '16',
            'shadow_style'       => 'glow'
        ), $atts);

        $unique_id = 'insta_blk_' . uniqid();

        $show_badge = filter_var($a['show_badge'], FILTER_VALIDATE_BOOLEAN);
        $show_subtitle = filter_var($a['show_subtitle'], FILTER_VALIDATE_BOOLEAN);
        $show_paste_btn = filter_var($a['show_paste_btn'], FILTER_VALIDATE_BOOLEAN);

        $shadowMap = array(
            'none' => 'none',
            'soft' => '0 10px 30px rgba(0, 0, 0, 0.3)',
            'glow' => '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(236, 72, 153, 0.15)',
            'neon' => '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 246, 0.3)'
        );

        $custom_css = '';
        if (!empty($a['bg_color'])) $custom_css .= "--ib-bg: {$a['bg_color']}; ";
        $bColor = !empty($a['card_border']) ? $a['card_border'] : (!empty($a['border_color']) ? $a['border_color'] : '');
        if (!empty($bColor)) $custom_css .= "--ib-border: {$bColor}; ";
        if (!empty($a['border_radius'])) $custom_css .= "--ib-radius: {$a['border_radius']}px; ";
        if (!empty($a['title_color'])) $custom_css .= "--ib-title: {$a['title_color']}; ";
        if (!empty($a['text_color'])) $custom_css .= "--ib-text: {$a['text_color']}; ";
        if (!empty($a['input_bg'])) $custom_css .= "--ib-input-bg: {$a['input_bg']}; ";
        if (!empty($a['input_text'])) $custom_css .= "--ib-input-text: {$a['input_text']}; ";
        if (!empty($a['btn_bg'])) $custom_css .= "--ib-btn-bg: {$a['btn_bg']}; ";
        if (!empty($a['btn_text'])) $custom_css .= "--ib-btn-text: {$a['btn_text']}; ";
        if (!empty($a['max_width'])) $custom_css .= "--ib-max-width: {$a['max_width']}px; ";
        if (!empty($a['card_padding'])) $custom_css .= "--ib-padding: {$a['card_padding']}px; ";
        if (!empty($a['blur_amount'])) $custom_css .= "--ib-blur: {$a['blur_amount']}px; ";
        if (!empty($a['shadow_style']) && isset($shadowMap[$a['shadow_style']])) {
            $custom_css .= "--ib-shadow: {$shadowMap[$a['shadow_style']]}; ";
        }

        ob_start();
        ?>
        <div id="<?php echo esc_attr($unique_id); ?>" class="insta-bulk-wrapper insta-theme-<?php echo esc_attr($a['theme']); ?>" data-api="<?php echo esc_url($a['api_url']); ?>" style="<?php echo esc_attr($custom_css); ?>">
            <div class="insta-bulk-card">
                <div class="insta-header">
                    <?php if ($show_badge && !empty($a['badge_text'])): ?>
                        <div class="insta-badge">
                            <span class="insta-badge-dot"></span>
                            <span><?php echo esc_html($a['badge_text']); ?></span>
                        </div>
                    <?php endif; ?>
                    <h2 class="insta-title"><?php echo esc_html($a['title']); ?></h2>
                    <?php if ($show_subtitle && !empty($a['subtitle'])): ?>
                        <p class="insta-subtitle"><?php echo esc_html($a['subtitle']); ?></p>
                    <?php endif; ?>
                </div>

                <form class="insta-bulk-form" onsubmit="return false;">
                    <div class="insta-input-row">
                        <div class="insta-input-box">
                            <span class="insta-input-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </span>
                            <input type="text" class="insta-input insta-bulk-input" placeholder="<?php echo esc_attr($a['placeholder']); ?>" autocomplete="off" required />
                            
                            <div class="insta-input-actions">
                                <button type="button" class="insta-clear-btn" title="Clear text">&times;</button>
                                <?php if ($show_paste_btn): ?>
                                    <button type="button" class="insta-paste-btn" title="Paste from clipboard">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                        Paste
                                    </button>
                                <?php endif; ?>
                            </div>
                        </div>

                        <select class="insta-select insta-bulk-limit">
                            <option value="12" <?php selected($a['default_limit'], '12'); ?>>12 Videos (Page 1)</option>
                            <option value="24" <?php selected($a['default_limit'], '24'); ?>>24 Videos (Multi-Page)</option>
                            <option value="50" <?php selected($a['default_limit'], '50'); ?>>50 Videos (Max Limit)</option>
                        </select>

                        <button type="submit" class="insta-submit-btn insta-bulk-submit">
                            <span class="btn-text"><?php echo esc_html($a['button_text']); ?></span>
                            <span class="btn-loader" style="display: none; align-items: center; gap: 8px;">
                                <svg class="insta-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                                Harvesting...
                            </span>
                        </button>
                    </div>
                </form>

                <div class="insta-bulk-alert" style="display: none;"></div>

                <div class="insta-bulk-results" style="display: none;">
                    <div class="insta-bulk-toolbar">
                        <div>
                            <strong>Selected:</strong> <span class="sel-count">0</span> / <span class="total-count">0</span>
                            <span style="margin-left: 10px;">
                                <a href="#" class="btn-select-all" style="color: #ec4899; text-decoration: none; font-weight: bold; margin-right: 8px;">Select All</a>
                                <a href="#" class="btn-select-page" style="color: #c084fc; text-decoration: none; font-weight: bold; margin-right: 8px;">Select Page</a>
                                <a href="#" class="btn-deselect-all" style="color: #94a3b8; text-decoration: none;">Deselect All</a>
                            </span>
                        </div>
                        <button type="button" class="insta-zip-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download <span class="zip-count">0</span> Reels as ZIP
                        </button>
                    </div>

                    <div class="insta-zip-progress" style="display: none; margin-bottom: 16px; background: rgba(255,255,255,0.06); border-radius: 8px; padding: 12px;">
                        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                            <span class="progress-status">Preparing packaging...</span>
                            <span class="progress-pct">0%</span>
                        </div>
                        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden;">
                            <div class="insta-progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #10b981, #06b6d4); transition: width 0.2s;"></div>
                        </div>
                    </div>

                    <div class="insta-pagination-bar insta-pagination-top"></div>
                    <div class="insta-bulk-grid"></div>
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
        <div class="wrap" style="max-width: 850px;">
            <h1>Instagram Bulk Downloader Settings</h1>
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
                </table>
                <?php submit_button(); ?>
            </form>
            <hr />
            <h3>Shortcode:</h3>
            <code>[insta_bulk_downloader]</code>
        </div>
        <?php
    }
}

new InstaBulkDownloaderPlugin();
