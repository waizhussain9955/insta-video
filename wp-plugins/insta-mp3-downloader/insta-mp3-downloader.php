<?php
/**
 * Plugin Name: Instagram MP3 & Audio Downloader
 * Plugin URI: https://api.thecalicocats.com
 * Description: Fully customizable Gutenberg block & shortcode to extract and download high-quality MP3 audio from Instagram Reels & Videos.
 * Version: 2.0.0
 * Author: InstaSave Pro
 * Text Domain: insta-mp3-downloader
 */

if (!defined('ABSPATH')) {
    exit;
}

class InstaMp3Downloader {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_shortcode('insta_mp3_downloader', array($this, 'render_shortcode'));
        add_shortcode('insta_audio_downloader', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('init', array($this, 'register_gutenberg_block'));
    }

    public function add_settings_page() {
        add_options_page(
            'Insta MP3 Downloader',
            'Insta MP3 Downloader',
            'manage_options',
            'insta-mp3-downloader',
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        register_setting('insta_mp3_settings', 'insta_mp3_api_url');
        register_setting('insta_mp3_settings', 'insta_mp3_default_theme');
        register_setting('insta_mp3_settings', 'insta_mp3_bg_color');
        register_setting('insta_mp3_settings', 'insta_mp3_text_color');
        register_setting('insta_mp3_settings', 'insta_mp3_title_color');
        register_setting('insta_mp3_settings', 'insta_mp3_btn_bg');
        register_setting('insta_mp3_settings', 'insta_mp3_border_radius');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap" style="max-width: 800px;">
            <h1><span class="dashicons dashicons-format-audio" style="font-size: 28px; margin-right: 8px;"></span> Instagram MP3 Downloader Settings</h1>
            <p>Configure default styling and backend API connection for MP3 Audio Extraction.</p>
            <form method="post" action="options.php" style="background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 20px;">
                <?php settings_fields('insta_mp3_settings'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Backend API URL</th>
                        <td>
                            <input type="url" name="insta_mp3_api_url" value="<?php echo esc_attr(get_option('insta_mp3_api_url', 'https://api.thecalicocats.com')); ?>" class="regular-text" style="width: 100%;" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Theme Preset</th>
                        <td>
                            <select name="insta_mp3_default_theme">
                                <option value="dark" <?php selected(get_option('insta_mp3_default_theme', 'dark'), 'dark'); ?>>Modern Dark Glassmorphism</option>
                                <option value="light" <?php selected(get_option('insta_mp3_default_theme'), 'light'); ?>>Clean Minimalist Light</option>
                                <option value="gradient" <?php selected(get_option('insta_mp3_default_theme'), 'gradient'); ?>>Instagram Vibrant Gradient</option>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Container Background</th>
                        <td>
                            <input type="text" name="insta_mp3_bg_color" value="<?php echo esc_attr(get_option('insta_mp3_bg_color', 'rgba(24, 24, 27, 0.85)')); ?>" class="regular-text" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Button Background</th>
                        <td>
                            <input type="text" name="insta_mp3_btn_bg" value="<?php echo esc_attr(get_option('insta_mp3_btn_bg', 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)')); ?>" class="regular-text" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Title & Text Color</th>
                        <td>
                            <input type="text" name="insta_mp3_title_color" value="<?php echo esc_attr(get_option('insta_mp3_title_color', '#ffffff')); ?>" placeholder="#ffffff" style="margin-right: 10px;" />
                            <input type="text" name="insta_mp3_text_color" value="<?php echo esc_attr(get_option('insta_mp3_text_color', '#a1a1aa')); ?>" placeholder="#a1a1aa" />
                        </td>
                    </tr>
                </table>
                <?php submit_button('Save Settings'); ?>
            </form>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <h3>Shortcode Usage</h3>
                <p>Embed anywhere using: <code>[insta_mp3_downloader]</code> or <code>[insta_audio_downloader]</code></p>
            </div>
        </div>
        <?php
    }

    public function render_shortcode($atts) {
        $a = shortcode_atts(array(
            'title'         => 'Instagram MP3 & Audio Downloader',
            'subtitle'      => 'Extract high-fidelity 320kbps MP3 audio songs and soundtracks from any Instagram Reel or Video.',
            'placeholder'   => 'Paste Instagram Reel or Video Link...',
            'button_text'   => 'Extract Audio',
            'bg_color'      => get_option('insta_mp3_bg_color', 'rgba(24, 24, 27, 0.85)'),
            'border_color'  => 'rgba(255, 255, 255, 0.1)',
            'border_radius' => get_option('insta_mp3_border_radius', '16px'),
            'title_color'   => get_option('insta_mp3_title_color', '#ffffff'),
            'text_color'    => get_option('insta_mp3_text_color', '#a1a1aa'),
            'input_bg'      => 'rgba(255, 255, 255, 0.05)',
            'input_text'    => '#ffffff',
            'btn_bg'        => get_option('insta_mp3_btn_bg', 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)'),
            'btn_text'      => '#ffffff',
            'mp3_btn_bg'    => '#06b6d4',
            'api_url'       => get_option('insta_mp3_api_url', 'https://api.thecalicocats.com'),
            'max_width'     => '650px',
            'theme'         => get_option('insta_mp3_default_theme', 'dark'),
            'box_shadow'    => '0 20px 40px rgba(0,0,0,0.3)',
            'blur'          => '16px'
        ), $atts, 'insta_mp3_downloader');

        $unique_id = 'insta_mp3_' . substr(md5(uniqid(rand(), true)), 0, 8);

        ob_start();
        ?>
        <style>
            #<?php echo esc_attr($unique_id); ?> {
                --ia-bg: <?php echo esc_attr($a['bg_color']); ?>;
                --ia-border: <?php echo esc_attr($a['border_color']); ?>;
                --ia-radius: <?php echo esc_attr($a['border_radius']); ?>;
                --ia-title: <?php echo esc_attr($a['title_color']); ?>;
                --ia-text: <?php echo esc_attr($a['text_color']); ?>;
                --ia-input-bg: <?php echo esc_attr($a['input_bg']); ?>;
                --ia-input-text: <?php echo esc_attr($a['input_text']); ?>;
                --ia-btn-bg: <?php echo esc_attr($a['btn_bg']); ?>;
                --ia-btn-text: <?php echo esc_attr($a['btn_text']); ?>;
                --ia-mp3-bg: <?php echo esc_attr($a['mp3_btn_bg']); ?>;
                --ia-max-width: <?php echo esc_attr($a['max_width']); ?>;
                --ia-shadow: <?php echo esc_attr($a['box_shadow']); ?>;
                --ia-blur: <?php echo esc_attr($a['blur']); ?>;
            }
        </style>

        <div id="<?php echo esc_attr($unique_id); ?>" class="insta-mp3-wrapper insta-theme-<?php echo esc_attr($a['theme']); ?>" data-api="<?php echo esc_url($a['api_url']); ?>">
            <div class="insta-mp3-card">
                <div class="insta-header">
                    <span class="insta-badge insta-badge-mp3">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                        320kbps HQ Audio
                    </span>
                    <h2 class="insta-mp3-title"><?php echo esc_html($a['title']); ?></h2>
                    <?php if (!empty($a['subtitle'])): ?>
                        <p class="insta-mp3-subtitle"><?php echo esc_html($a['subtitle']); ?></p>
                    <?php endif; ?>
                </div>

                <form class="insta-mp3-form" onsubmit="return false;">
                    <div class="insta-input-group">
                        <span class="insta-input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        </span>
                        <input type="text" class="insta-mp3-input" placeholder="<?php echo esc_attr($a['placeholder']); ?>" required />
                        <button type="button" class="insta-paste-btn" title="Paste from clipboard">Paste</button>
                    </div>
                    <button type="submit" class="insta-mp3-submit">
                        <span class="btn-text"><?php echo esc_html($a['button_text']); ?></span>
                        <span class="btn-loader" style="display: none;">
                            <svg class="insta-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                        </span>
                    </button>
                </form>

                <div class="insta-mp3-alert" style="display: none;"></div>

                <div class="insta-mp3-results" style="display: none;"></div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function enqueue_assets() {
        wp_enqueue_style('insta-mp3-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '2.0.0');
        wp_enqueue_script('insta-mp3-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array('jquery'), '2.0.0', true);
    }

    public function register_gutenberg_block() {
        if (!function_exists('register_block_type')) {
            return;
        }

        wp_register_script(
            'insta-mp3-block-editor',
            plugin_dir_url(__FILE__) . 'assets/js/block.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor'),
            '2.0.0',
            true
        );

        wp_register_style(
            'insta-mp3-block-editor-style',
            plugin_dir_url(__FILE__) . 'assets/css/style.css',
            array(),
            '2.0.0'
        );

        register_block_type('insta-downloader/audio', array(
            'editor_script'   => 'insta-mp3-block-editor',
            'editor_style'    => 'insta-mp3-block-editor-style',
            'render_callback' => array($this, 'render_shortcode'),
            'attributes'      => array(
                'title'         => array('type' => 'string', 'default' => 'Instagram MP3 & Audio Downloader'),
                'subtitle'      => array('type' => 'string', 'default' => 'Extract high-fidelity 320kbps MP3 audio songs and soundtracks.'),
                'placeholder'   => array('type' => 'string', 'default' => 'Paste Instagram Reel or Video Link...'),
                'button_text'   => array('type' => 'string', 'default' => 'Extract Audio'),
                'bg_color'      => array('type' => 'string', 'default' => 'rgba(24, 24, 27, 0.85)'),
                'border_color'  => array('type' => 'string', 'default' => 'rgba(255, 255, 255, 0.1)'),
                'border_radius' => array('type' => 'string', 'default' => '16px'),
                'title_color'   => array('type' => 'string', 'default' => '#ffffff'),
                'text_color'    => array('type' => 'string', 'default' => '#a1a1aa'),
                'input_bg'      => array('type' => 'string', 'default' => 'rgba(255, 255, 255, 0.05)'),
                'btn_bg'        => array('type' => 'string', 'default' => 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)'),
                'mp3_btn_bg'    => array('type' => 'string', 'default' => '#06b6d4'),
                'api_url'       => array('type' => 'string', 'default' => 'https://api.thecalicocats.com'),
                'theme'         => array('type' => 'string', 'default' => 'dark'),
                'max_width'     => array('type' => 'string', 'default' => '650px')
            )
        ));
    }
}

new InstaMp3Downloader();
