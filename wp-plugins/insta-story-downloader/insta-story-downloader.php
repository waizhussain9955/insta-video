<?php
/**
 * Plugin Name: Instagram Story & Highlights Downloader
 * Plugin URI: https://api.thecalicocats.com
 * Description: Fully customizable Gutenberg block & shortcode to view and download Instagram Stories & Highlights anonymously.
 * Version: 2.0.0
 * Author: InstaSave Pro
 * Text Domain: insta-story-downloader
 */

if (!defined('ABSPATH')) {
    exit;
}

class InstaStoryDownloader {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_shortcode('insta_story_downloader', array($this, 'render_shortcode'));
        add_shortcode('insta_stories_downloader', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('init', array($this, 'register_gutenberg_block'));
    }

    public function add_settings_page() {
        add_options_page(
            'Insta Story Downloader',
            'Insta Story Downloader',
            'manage_options',
            'insta-story-downloader',
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        register_setting('insta_story_settings', 'insta_story_api_url');
        register_setting('insta_story_settings', 'insta_story_default_theme');
        register_setting('insta_story_settings', 'insta_story_bg_color');
        register_setting('insta_story_settings', 'insta_story_text_color');
        register_setting('insta_story_settings', 'insta_story_title_color');
        register_setting('insta_story_settings', 'insta_story_btn_bg');
        register_setting('insta_story_settings', 'insta_story_border_radius');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap" style="max-width: 800px;">
            <h1><span class="dashicons dashicons-camera-alt" style="font-size: 28px; margin-right: 8px;"></span> Instagram Story Downloader Settings</h1>
            <p>Configure default styling and backend API connection for Story Downloader.</p>
            <form method="post" action="options.php" style="background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 20px;">
                <?php settings_fields('insta_story_settings'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Backend API URL</th>
                        <td>
                            <input type="url" name="insta_story_api_url" value="<?php echo esc_attr(get_option('insta_story_api_url', 'https://api.thecalicocats.com')); ?>" class="regular-text" style="width: 100%;" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Container Background</th>
                        <td>
                            <input type="text" name="insta_story_bg_color" value="<?php echo esc_attr(get_option('insta_story_bg_color', 'rgba(24, 24, 27, 0.85)')); ?>" class="regular-text" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Button Background</th>
                        <td>
                            <input type="text" name="insta_story_btn_bg" value="<?php echo esc_attr(get_option('insta_story_btn_bg', 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)')); ?>" class="regular-text" />
                        </td>
                    </tr>
                </table>
                <?php submit_button('Save Settings'); ?>
            </form>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <h3>Shortcode Usage</h3>
                <p>Embed anywhere using: <code>[insta_story_downloader]</code></p>
            </div>
        </div>
        <?php
    }

    public function render_shortcode($atts) {
        $a = shortcode_atts(array(
            'title'         => 'Instagram Story Downloader',
            'subtitle'      => 'View and download public Instagram stories & highlights anonymously in full resolution.',
            'placeholder'   => 'Instagram Username (e.g. cristiano)',
            'button_text'   => 'Fetch Stories',
            'bg_color'      => get_option('insta_story_bg_color', 'rgba(24, 24, 27, 0.85)'),
            'border_color'  => 'rgba(255, 255, 255, 0.1)',
            'border_radius' => get_option('insta_story_border_radius', '16px'),
            'title_color'   => get_option('insta_story_title_color', '#ffffff'),
            'text_color'    => get_option('insta_story_text_color', '#a1a1aa'),
            'input_bg'      => 'rgba(255, 255, 255, 0.05)',
            'input_text'    => '#ffffff',
            'btn_bg'        => get_option('insta_story_btn_bg', 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)'),
            'btn_text'      => '#ffffff',
            'dl_btn_bg'     => '#10b981',
            'api_url'       => get_option('insta_story_api_url', 'https://api.thecalicocats.com'),
            'max_width'     => '900px',
            'theme'         => get_option('insta_story_default_theme', 'dark'),
            'box_shadow'    => '0 20px 40px rgba(0,0,0,0.3)',
            'blur'          => '16px'
        ), $atts, 'insta_story_downloader');

        $unique_id = 'insta_story_' . substr(md5(uniqid(rand(), true)), 0, 8);

        ob_start();
        ?>
        <style>
            #<?php echo esc_attr($unique_id); ?> {
                --ist-bg: <?php echo esc_attr($a['bg_color']); ?>;
                --ist-border: <?php echo esc_attr($a['border_color']); ?>;
                --ist-radius: <?php echo esc_attr($a['border_radius']); ?>;
                --ist-title: <?php echo esc_attr($a['title_color']); ?>;
                --ist-text: <?php echo esc_attr($a['text_color']); ?>;
                --ist-input-bg: <?php echo esc_attr($a['input_bg']); ?>;
                --ist-input-text: <?php echo esc_attr($a['input_text']); ?>;
                --ist-btn-bg: <?php echo esc_attr($a['btn_bg']); ?>;
                --ist-btn-text: <?php echo esc_attr($a['btn_text']); ?>;
                --ist-dl-bg: <?php echo esc_attr($a['dl_btn_bg']); ?>;
                --ist-max-width: <?php echo esc_attr($a['max_width']); ?>;
                --ist-shadow: <?php echo esc_attr($a['box_shadow']); ?>;
                --ist-blur: <?php echo esc_attr($a['blur']); ?>;
            }
        </style>

        <div id="<?php echo esc_attr($unique_id); ?>" class="insta-story-wrapper insta-theme-<?php echo esc_attr($a['theme']); ?>" data-api="<?php echo esc_url($a['api_url']); ?>">
            <div class="insta-story-card">
                <div class="insta-header">
                    <span class="insta-badge insta-badge-story">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Anonymous Story Viewer
                    </span>
                    <h2 class="insta-story-title"><?php echo esc_html($a['title']); ?></h2>
                    <?php if (!empty($a['subtitle'])): ?>
                        <p class="insta-story-subtitle"><?php echo esc_html($a['subtitle']); ?></p>
                    <?php endif; ?>
                </div>

                <form class="insta-story-form" onsubmit="return false;">
                    <div class="insta-input-group">
                        <span class="insta-input-icon">@</span>
                        <input type="text" class="insta-story-input" placeholder="<?php echo esc_attr($a['placeholder']); ?>" required />
                        <button type="button" class="insta-paste-btn" title="Paste from clipboard">Paste</button>
                    </div>
                    <button type="submit" class="insta-story-submit">
                        <span class="btn-text"><?php echo esc_html($a['button_text']); ?></span>
                        <span class="btn-loader" style="display: none;">
                            <svg class="insta-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                        </span>
                    </button>
                </form>

                <div class="insta-story-alert" style="display: none;"></div>

                <div class="insta-story-results" style="display: none;">
                    <div class="insta-story-grid"></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function enqueue_assets() {
        wp_enqueue_style('insta-story-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '2.0.0');
        wp_enqueue_script('insta-story-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array('jquery'), '2.0.0', true);
    }

    public function register_gutenberg_block() {
        if (!function_exists('register_block_type')) {
            return;
        }

        wp_register_script(
            'insta-story-block-editor',
            plugin_dir_url(__FILE__) . 'assets/js/block.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor'),
            '2.0.0',
            true
        );

        wp_register_style(
            'insta-story-block-editor-style',
            plugin_dir_url(__FILE__) . 'assets/css/style.css',
            array(),
            '2.0.0'
        );

        register_block_type('insta-downloader/story', array(
            'editor_script'   => 'insta-story-block-editor',
            'editor_style'    => 'insta-story-block-editor-style',
            'render_callback' => array($this, 'render_shortcode'),
            'attributes'      => array(
                'title'         => array('type' => 'string', 'default' => 'Instagram Story Downloader'),
                'subtitle'      => array('type' => 'string', 'default' => 'View and download public Instagram stories anonymously.'),
                'placeholder'   => array('type' => 'string', 'default' => 'Instagram Username (e.g. cristiano)'),
                'button_text'   => array('type' => 'string', 'default' => 'Fetch Stories'),
                'bg_color'      => array('type' => 'string', 'default' => 'rgba(24, 24, 27, 0.85)'),
                'btn_bg'        => array('type' => 'string', 'default' => 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)'),
                'api_url'       => array('type' => 'string', 'default' => 'https://api.thecalicocats.com'),
                'max_width'     => array('type' => 'string', 'default' => '900px')
            )
        ));
    }
}

new InstaStoryDownloader();
