<?php
/**
 * Plugin Name: Instagram Single Reel & Video Downloader
 * Plugin URI: https://api.thecalicocats.com
 * Description: Fully customizable Gutenberg block & shortcode to download Instagram Reels, Videos, Photos, and Carousels.
 * Version: 2.0.0
 * Author: InstaSave Pro
 * Text Domain: insta-single-downloader
 */

if (!defined('ABSPATH')) {
    exit;
}

class InstaSingleDownloader {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_shortcode('insta_single_downloader', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('init', array($this, 'register_gutenberg_block'));
    }

    public function add_settings_page() {
        add_options_page(
            'Insta Single Downloader',
            'Insta Single Downloader',
            'manage_options',
            'insta-single-downloader',
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        register_setting('insta_single_settings', 'insta_single_api_url');
        register_setting('insta_single_settings', 'insta_single_default_theme');
        register_setting('insta_single_settings', 'insta_single_bg_color');
        register_setting('insta_single_settings', 'insta_single_text_color');
        register_setting('insta_single_settings', 'insta_single_title_color');
        register_setting('insta_single_settings', 'insta_single_btn_bg');
        register_setting('insta_single_settings', 'insta_single_btn_text');
        register_setting('insta_single_settings', 'insta_single_border_radius');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap" style="max-width: 800px;">
            <h1><span class="dashicons dashicons-video-alt3" style="font-size: 28px; margin-right: 8px;"></span> Instagram Single Downloader Settings</h1>
            <p>Configure default styling and backend API connection. You can also customize individual blocks directly in Gutenberg or via shortcode attributes.</p>
            <form method="post" action="options.php" style="background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 20px;">
                <?php settings_fields('insta_single_settings'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Backend API URL</th>
                        <td>
                            <input type="url" name="insta_single_api_url" value="<?php echo esc_attr(get_option('insta_single_api_url', 'https://api.thecalicocats.com')); ?>" class="regular-text" style="width: 100%;" />
                            <p class="description">Your hosted downloader API endpoint (e.g. <code>https://api.thecalicocats.com</code>)</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Theme Preset</th>
                        <td>
                            <select name="insta_single_default_theme">
                                <option value="dark" <?php selected(get_option('insta_single_default_theme', 'dark'), 'dark'); ?>>Modern Dark Glassmorphism</option>
                                <option value="light" <?php selected(get_option('insta_single_default_theme'), 'light'); ?>>Clean Minimalist Light</option>
                                <option value="gradient" <?php selected(get_option('insta_single_default_theme'), 'gradient'); ?>>Instagram Vibrant Gradient</option>
                                <option value="custom" <?php selected(get_option('insta_single_default_theme'), 'custom'); ?>>Custom Palette</option>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Container Background</th>
                        <td>
                            <input type="text" name="insta_single_bg_color" value="<?php echo esc_attr(get_option('insta_single_bg_color', 'rgba(24, 24, 27, 0.85)')); ?>" class="regular-text" placeholder="rgba(24, 24, 27, 0.85) or #18181b" />
                            <p class="description">Supports RGBA transparency or HEX colors.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Button Background</th>
                        <td>
                            <input type="text" name="insta_single_btn_bg" value="<?php echo esc_attr(get_option('insta_single_btn_bg', 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #a855f7 100%)')); ?>" class="regular-text" placeholder="linear-gradient(...) or #e1306c" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Text & Title Color</th>
                        <td>
                            <input type="text" name="insta_single_title_color" value="<?php echo esc_attr(get_option('insta_single_title_color', '#ffffff')); ?>" placeholder="#ffffff" style="margin-right: 10px;" />
                            <input type="text" name="insta_single_text_color" value="<?php echo esc_attr(get_option('insta_single_text_color', '#a1a1aa')); ?>" placeholder="#a1a1aa" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Border Radius</th>
                        <td>
                            <input type="text" name="insta_single_border_radius" value="<?php echo esc_attr(get_option('insta_single_border_radius', '16px')); ?>" class="small-text" />
                        </td>
                    </tr>
                </table>
                <?php submit_button('Save Settings'); ?>
            </form>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <h3>Shortcode Usage</h3>
                <p>Embed anywhere using: <code>[insta_single_downloader]</code></p>
                <p>With Custom Attributes:</p>
                <code>[insta_single_downloader title="Download Instagram Video" bg_color="rgba(15,23,42,0.9)" btn_bg="#e1306c" border_radius="20px"]</code>
            </div>
        </div>
        <?php
    }

    public function render_shortcode($atts) {
        $a = shortcode_atts(array(
            'title'         => 'Instagram Reel & Video Downloader',
            'subtitle'      => 'Paste any public Instagram reel or video link to download in HD MP4.',
            'placeholder'   => 'Paste Instagram video or reel link here...',
            'button_text'   => 'Fetch Video',
            'bg_color'      => get_option('insta_single_bg_color', 'rgba(24, 24, 27, 0.85)'),
            'border_color'  => 'rgba(255, 255, 255, 0.1)',
            'border_radius' => get_option('insta_single_border_radius', '16px'),
            'title_color'   => get_option('insta_single_title_color', '#ffffff'),
            'text_color'    => get_option('insta_single_text_color', '#a1a1aa'),
            'input_bg'      => 'rgba(255, 255, 255, 0.05)',
            'input_text'    => '#ffffff',
            'btn_bg'        => get_option('insta_single_btn_bg', 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #a855f7 100%)'),
            'btn_text'      => get_option('insta_single_btn_text', '#ffffff'),
            'btn_hover'     => 'linear-gradient(135deg, #fb7185 0%, #f472b6 50%, #c084fc 100%)',
            'dl_btn_bg'     => '#10b981',
            'dl_btn_text'   => '#ffffff',
            'api_url'       => get_option('insta_single_api_url', 'https://api.thecalicocats.com'),
            'max_width'     => '650px',
            'theme'         => get_option('insta_single_default_theme', 'dark'),
            'box_shadow'    => '0 20px 40px rgba(0,0,0,0.3)',
            'blur'          => '16px'
        ), $atts, 'insta_single_downloader');

        $unique_id = 'insta_single_' . substr(md5(uniqid(rand(), true)), 0, 8);

        ob_start();
        ?>
        <style>
            #<?php echo esc_attr($unique_id); ?> {
                --is-bg: <?php echo esc_attr($a['bg_color']); ?>;
                --is-border: <?php echo esc_attr($a['border_color']); ?>;
                --is-radius: <?php echo esc_attr($a['border_radius']); ?>;
                --is-title: <?php echo esc_attr($a['title_color']); ?>;
                --is-text: <?php echo esc_attr($a['text_color']); ?>;
                --is-input-bg: <?php echo esc_attr($a['input_bg']); ?>;
                --is-input-text: <?php echo esc_attr($a['input_text']); ?>;
                --is-btn-bg: <?php echo esc_attr($a['btn_bg']); ?>;
                --is-btn-text: <?php echo esc_attr($a['btn_text']); ?>;
                --is-btn-hover: <?php echo esc_attr($a['btn_hover']); ?>;
                --is-dl-bg: <?php echo esc_attr($a['dl_btn_bg']); ?>;
                --is-dl-text: <?php echo esc_attr($a['dl_btn_text']); ?>;
                --is-max-width: <?php echo esc_attr($a['max_width']); ?>;
                --is-shadow: <?php echo esc_attr($a['box_shadow']); ?>;
                --is-blur: <?php echo esc_attr($a['blur']); ?>;
            }
        </style>

        <div id="<?php echo esc_attr($unique_id); ?>" class="insta-single-wrapper insta-theme-<?php echo esc_attr($a['theme']); ?>" data-api="<?php echo esc_url($a['api_url']); ?>">
            <div class="insta-single-card">
                <div class="insta-header">
                    <span class="insta-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        100% HD Downloader
                    </span>
                    <h2 class="insta-single-title"><?php echo esc_html($a['title']); ?></h2>
                    <?php if (!empty($a['subtitle'])): ?>
                        <p class="insta-single-subtitle"><?php echo esc_html($a['subtitle']); ?></p>
                    <?php endif; ?>
                </div>

                <form class="insta-single-form" onsubmit="return false;">
                    <div class="insta-input-group">
                        <span class="insta-input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        </span>
                        <input type="text" class="insta-single-input" placeholder="<?php echo esc_attr($a['placeholder']); ?>" required />
                        <button type="button" class="insta-paste-btn" title="Paste from clipboard">Paste</button>
                    </div>
                    <button type="submit" class="insta-single-submit">
                        <span class="btn-text"><?php echo esc_html($a['button_text']); ?></span>
                        <span class="btn-loader" style="display: none;">
                            <svg class="insta-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                        </span>
                    </button>
                </form>

                <div class="insta-single-alert" style="display: none;"></div>

                <div class="insta-single-results" style="display: none;"></div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function enqueue_assets() {
        wp_enqueue_style('insta-single-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '2.0.0');
        wp_enqueue_script('insta-single-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array('jquery'), '2.0.0', true);
    }

    public function register_gutenberg_block() {
        if (!function_exists('register_block_type')) {
            return;
        }

        wp_register_script(
            'insta-single-block-editor',
            plugin_dir_url(__FILE__) . 'assets/js/block.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor'),
            '2.0.0',
            true
        );

        wp_register_style(
            'insta-single-block-editor-style',
            plugin_dir_url(__FILE__) . 'assets/css/style.css',
            array(),
            '2.0.0'
        );

        register_block_type('insta-downloader/single', array(
            'editor_script'   => 'insta-single-block-editor',
            'editor_style'    => 'insta-single-block-editor-style',
            'render_callback' => array($this, 'render_shortcode'),
            'attributes'      => array(
                'title'         => array('type' => 'string', 'default' => 'Instagram Reel & Video Downloader'),
                'subtitle'      => array('type' => 'string', 'default' => 'Paste any public Instagram reel or video link to download in HD MP4.'),
                'placeholder'   => array('type' => 'string', 'default' => 'Paste Instagram video or reel link here...'),
                'button_text'   => array('type' => 'string', 'default' => 'Fetch Video'),
                'bg_color'      => array('type' => 'string', 'default' => 'rgba(24, 24, 27, 0.85)'),
                'border_color'  => array('type' => 'string', 'default' => 'rgba(255, 255, 255, 0.1)'),
                'border_radius' => array('type' => 'string', 'default' => '16px'),
                'title_color'   => array('type' => 'string', 'default' => '#ffffff'),
                'text_color'    => array('type' => 'string', 'default' => '#a1a1aa'),
                'input_bg'      => array('type' => 'string', 'default' => 'rgba(255, 255, 255, 0.05)'),
                'input_text'    => array('type' => 'string', 'default' => '#ffffff'),
                'btn_bg'        => array('type' => 'string', 'default' => 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #a855f7 100%)'),
                'btn_text'      => array('type' => 'string', 'default' => '#ffffff'),
                'dl_btn_bg'     => array('type' => 'string', 'default' => '#10b981'),
                'dl_btn_text'   => array('type' => 'string', 'default' => '#ffffff'),
                'api_url'       => array('type' => 'string', 'default' => 'https://api.thecalicocats.com'),
                'theme'         => array('type' => 'string', 'default' => 'dark'),
                'max_width'     => array('type' => 'string', 'default' => '650px')
            )
        ));
    }
}

new InstaSingleDownloader();
