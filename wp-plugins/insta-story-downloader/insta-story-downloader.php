<?php
/**
 * Plugin Name: Instagram Story & Highlights Downloader
 * Plugin URI: https://waizhussain9955.github.io/
 * Description: Fully customizable Gutenberg block & Shortcode to view and download Instagram stories & highlights in original HD quality.
 * Version: 2.5.0
 * Author: Instagram Downloader Pro
 * Text Domain: insta-story-downloader
 */

if (!defined('ABSPATH')) {
    exit;
}

class InstaStoryDownloaderPlugin {
    public function __construct() {
        add_action('init', array($this, 'register_block'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('insta_story_downloader', array($this, 'render_shortcode'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    public function enqueue_scripts() {
        wp_register_style('insta-story-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '2.5.0');
        wp_register_script('insta-story-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array(), '2.5.0', true);
    }

    public function register_block() {
        if (!function_exists('register_block_type')) return;

        wp_register_script(
            'insta-story-block-editor',
            plugin_dir_url(__FILE__) . 'assets/js/block.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor'),
            '2.5.0',
            true
        );

        register_block_type('insta-downloader/story', array(
            'editor_script'   => 'insta-story-block-editor',
            'render_callback' => array($this, 'render_shortcode')
        ));
    }

    public function render_shortcode($atts = array()) {
        wp_enqueue_style('insta-story-style');
        wp_enqueue_script('insta-story-script');

        $default_api = get_option('insta_story_api_url', 'https://api.thecalicocats.com');

        $a = shortcode_atts(array(
            'title'         => get_option('insta_story_default_title', 'Instagram Story & Highlights Downloader'),
            'subtitle'      => 'View and download public Instagram stories & highlights anonymously in full quality.',
            'placeholder'   => 'Enter username (e.g. cristiano, leomessi)...',
            'button_text'   => 'Fetch Stories',
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
            'max_width'     => '800px',
            'box_shadow'    => ''
        ), $atts);

        $unique_id = 'insta_sty_' . uniqid();

        $custom_css = '';
        if (!empty($a['bg_color'])) $custom_css .= "--is-bg: {$a['bg_color']}; ";
        if (!empty($a['border_color'])) $custom_css .= "--is-border: {$a['border_color']}; ";
        if (!empty($a['border_radius'])) $custom_css .= "--is-radius: {$a['border_radius']}; ";
        if (!empty($a['title_color'])) $custom_css .= "--is-title: {$a['title_color']}; ";
        if (!empty($a['text_color'])) $custom_css .= "--is-text: {$a['text_color']}; ";
        if (!empty($a['input_bg'])) $custom_css .= "--is-input-bg: {$a['input_bg']}; ";
        if (!empty($a['input_text'])) $custom_css .= "--is-input-text: {$a['input_text']}; ";
        if (!empty($a['btn_bg'])) $custom_css .= "--is-btn-bg: {$a['btn_bg']}; ";
        if (!empty($a['btn_text'])) $custom_css .= "--is-btn-text: {$a['btn_text']}; ";
        if (!empty($a['max_width'])) $custom_css .= "--is-max-width: {$a['max_width']}; ";
        if (!empty($a['box_shadow'])) $custom_css .= "--is-shadow: {$a['box_shadow']}; ";

        ob_start();
        ?>
        <div id="<?php echo esc_attr($unique_id); ?>" class="insta-story-wrapper insta-theme-<?php echo esc_attr($a['theme']); ?>" data-api="<?php echo esc_url($a['api_url']); ?>" style="<?php echo esc_attr($custom_css); ?>">
            <div class="insta-story-card">
                <div class="insta-header">
                    <span class="insta-badge-story">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Anonymous Story Viewer
                    </span>
                    <h2 class="insta-title"><?php echo esc_html($a['title']); ?></h2>
                    <?php if (!empty($a['subtitle'])): ?>
                        <p class="insta-subtitle"><?php echo esc_html($a['subtitle']); ?></p>
                    <?php endif; ?>
                </div>

                <form class="insta-form" onsubmit="return false;">
                    <div class="insta-input-box">
                        <span class="insta-input-icon">@</span>
                        <input type="text" class="insta-input" placeholder="<?php echo esc_attr($a['placeholder']); ?>" required />
                    </div>
                    <button type="submit" class="insta-submit-btn">
                        <span class="btn-text"><?php echo esc_html($a['button_text']); ?></span>
                        <span class="btn-loader" style="display: none; align-items: center; gap: 6px;">
                            <svg class="insta-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                            Fetching Stories...
                        </span>
                    </button>
                </form>

                <div class="insta-alert"></div>

                <div class="insta-results">
                    <div class="insta-stories-grid"></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function add_admin_menu() {
        add_options_page(
            'Instagram Story Downloader',
            'Insta Story Downloader',
            'manage_options',
            'insta-story-downloader',
            array($this, 'render_admin_page')
        );
    }

    public function register_settings() {
        register_setting('insta_story_settings_group', 'insta_story_api_url');
        register_setting('insta_story_settings_group', 'insta_story_default_title');
    }

    public function render_admin_page() {
        ?>
        <div class="wrap" style="max-width: 800px;">
            <h1>Instagram Story Downloader Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('insta_story_settings_group'); ?>
                <?php do_settings_sections('insta_story_settings_group'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">API Backend URL</th>
                        <td>
                            <input type="url" name="insta_story_api_url" value="<?php echo esc_attr(get_option('insta_story_api_url', 'https://api.thecalicocats.com')); ?>" class="regular-text" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Title</th>
                        <td>
                            <input type="text" name="insta_story_default_title" value="<?php echo esc_attr(get_option('insta_story_default_title', 'Instagram Story & Highlights Downloader')); ?>" class="regular-text" />
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <hr />
            <h3>Shortcode Usage:</h3>
            <code>[insta_story_downloader]</code>
        </div>
        <?php
    }
}

new InstaStoryDownloaderPlugin();
