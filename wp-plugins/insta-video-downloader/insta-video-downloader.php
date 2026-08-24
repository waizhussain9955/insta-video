<?php
/**
 * Plugin Name: Instagram Video & Reel Downloader
 * Plugin URI: https://waizhussain9955.github.io/
 * Description: Fully customizable Gutenberg block & Shortcode to download Instagram Reels, MP4 Videos, and Carousels with zero server bandwidth.
 * Version: 2.6.0
 * Author: Instagram Downloader Pro
 * Text Domain: insta-video-downloader
 */

if (!defined('ABSPATH')) {
    exit;
}

class InstaVideoDownloaderPlugin {
    public function __construct() {
        add_action('init', array($this, 'register_block'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('insta_video_downloader', array($this, 'render_shortcode'));
        add_shortcode('insta_single_downloader', array($this, 'render_shortcode'));
        add_shortcode('insta_reel_downloader', array($this, 'render_shortcode'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    public function enqueue_scripts() {
        wp_register_style('insta-video-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '2.6.0');
        wp_register_script('insta-video-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array(), '2.6.0', true);
    }

    public function register_block() {
        if (!function_exists('register_block_type')) return;

        wp_register_script(
            'insta-video-block-editor',
            plugin_dir_url(__FILE__) . 'assets/js/block.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor'),
            '2.6.0',
            true
        );

        register_block_type('insta-downloader/video', array(
            'editor_script'   => 'insta-video-block-editor',
            'render_callback' => array($this, 'render_shortcode'),
            'attributes'      => array(
                'badge_text'         => array('type' => 'string', 'default' => 'HD REEL & VIDEO DOWNLOADER'),
                'show_badge'         => array('type' => 'boolean', 'default' => true),
                'title'              => array('type' => 'string', 'default' => 'Instagram Video & Reel Downloader'),
                'subtitle'           => array('type' => 'string', 'default' => 'Download high-definition MP4 videos and Reels from Instagram instantly.'),
                'show_subtitle'      => array('type' => 'boolean', 'default' => true),
                'placeholder'        => array('type' => 'string', 'default' => 'Paste Instagram Reel or Video link here...'),
                'button_text'        => array('type' => 'string', 'default' => 'Download Video'),
                'api_url'            => array('type' => 'string', 'default' => 'https://api.thecalicocats.com'),
                'show_paste_btn'     => array('type' => 'boolean', 'default' => true),
                'show_audio_btn'     => array('type' => 'boolean', 'default' => true),
                'theme'              => array('type' => 'string', 'default' => 'cyber-purple'),
                'bg_color'           => array('type' => 'string', 'default' => ''),
                'card_border'        => array('type' => 'string', 'default' => ''),
                'title_color'        => array('type' => 'string', 'default' => ''),
                'text_color'         => array('type' => 'string', 'default' => ''),
                'input_bg'           => array('type' => 'string', 'default' => ''),
                'input_text'         => array('type' => 'string', 'default' => ''),
                'btn_bg'             => array('type' => 'string', 'default' => ''),
                'btn_text'           => array('type' => 'string', 'default' => ''),
                'max_width'          => array('type' => 'number', 'default' => 680),
                'border_radius'      => array('type' => 'number', 'default' => 18),
                'card_padding'       => array('type' => 'number', 'default' => 32),
                'blur_amount'        => array('type' => 'number', 'default' => 16),
                'shadow_style'       => array('type' => 'string', 'default' => 'glow')
            )
        ));
    }

    public function render_shortcode($atts = array()) {
        wp_enqueue_style('insta-video-style');
        wp_enqueue_script('insta-video-script');

        $default_api = get_option('insta_video_api_url', 'https://api.thecalicocats.com');

        $a = shortcode_atts(array(
            'badge_text'         => 'HD REEL & VIDEO DOWNLOADER',
            'show_badge'         => 'true',
            'title'              => get_option('insta_video_default_title', 'Instagram Video & Reel Downloader'),
            'subtitle'           => 'Download high-definition MP4 videos and Reels from Instagram instantly.',
            'show_subtitle'      => 'true',
            'placeholder'        => 'Paste Instagram Reel or Video link here...',
            'button_text'        => 'Download Video',
            'theme'              => 'cyber-purple',
            'api_url'            => $default_api,
            'show_paste_btn'     => 'true',
            'show_audio_btn'     => 'true',
            'bg_color'           => '',
            'border_color'       => '',
            'card_border'        => '',
            'title_color'        => '',
            'text_color'         => '',
            'input_bg'           => '',
            'input_text'         => '',
            'btn_bg'             => '',
            'btn_text'           => '',
            'max_width'          => '680',
            'border_radius'      => '18',
            'card_padding'       => '32',
            'blur_amount'        => '16',
            'shadow_style'       => 'glow'
        ), $atts);

        $unique_id = 'insta_vid_' . uniqid();

        // Convert string booleans
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
        if (!empty($a['bg_color'])) $custom_css .= "--iv-bg: {$a['bg_color']}; ";
        $bColor = !empty($a['card_border']) ? $a['card_border'] : (!empty($a['border_color']) ? $a['border_color'] : '');
        if (!empty($bColor)) $custom_css .= "--iv-border: {$bColor}; ";
        if (!empty($a['border_radius'])) $custom_css .= "--iv-radius: {$a['border_radius']}px; ";
        if (!empty($a['title_color'])) $custom_css .= "--iv-title: {$a['title_color']}; ";
        if (!empty($a['text_color'])) $custom_css .= "--iv-text: {$a['text_color']}; ";
        if (!empty($a['input_bg'])) $custom_css .= "--iv-input-bg: {$a['input_bg']}; ";
        if (!empty($a['input_text'])) $custom_css .= "--iv-input-text: {$a['input_text']}; ";
        if (!empty($a['btn_bg'])) $custom_css .= "--iv-btn-bg: {$a['btn_bg']}; ";
        if (!empty($a['btn_text'])) $custom_css .= "--iv-btn-text: {$a['btn_text']}; ";
        if (!empty($a['max_width'])) $custom_css .= "--iv-max-width: {$a['max_width']}px; ";
        if (!empty($a['card_padding'])) $custom_css .= "--iv-padding: {$a['card_padding']}px; ";
        if (!empty($a['blur_amount'])) $custom_css .= "--iv-blur: {$a['blur_amount']}px; ";
        if (!empty($a['shadow_style']) && isset($shadowMap[$a['shadow_style']])) {
            $custom_css .= "--iv-shadow: {$shadowMap[$a['shadow_style']]}; ";
        }

        ob_start();
        ?>
        <div id="<?php echo esc_attr($unique_id); ?>" class="insta-video-wrapper insta-theme-<?php echo esc_attr($a['theme']); ?>" data-api="<?php echo esc_url($a['api_url']); ?>" style="<?php echo esc_attr($custom_css); ?>">
            <div class="insta-video-card">
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

                <form class="insta-form" onsubmit="return false;">
                    <div class="insta-input-box">
                        <span class="insta-input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        </span>
                        <input type="url" class="insta-input" placeholder="<?php echo esc_attr($a['placeholder']); ?>" autocomplete="off" required />
                        
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
                    
                    <button type="submit" class="insta-submit-btn">
                        <span class="btn-text">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                            <?php echo esc_html($a['button_text']); ?>
                        </span>
                        <span class="btn-loader" style="display: none; align-items: center; gap: 8px;">
                            <svg class="insta-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                            Harvesting HD Reel...
                        </span>
                    </button>
                </form>

                <div class="insta-alert"></div>

                <div class="insta-results">
                    <div class="insta-media-container"></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function add_admin_menu() {
        add_options_page(
            'Instagram Video Downloader',
            'Insta Video Downloader',
            'manage_options',
            'insta-video-downloader',
            array($this, 'render_admin_page')
        );
    }

    public function register_settings() {
        register_setting('insta_video_settings_group', 'insta_video_api_url');
        register_setting('insta_video_settings_group', 'insta_video_default_title');
    }

    public function render_admin_page() {
        ?>
        <div class="wrap" style="max-width: 850px;">
            <h1>Instagram Video Downloader Pro Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('insta_video_settings_group'); ?>
                <?php do_settings_sections('insta_video_settings_group'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">API Backend URL</th>
                        <td>
                            <input type="url" name="insta_video_api_url" value="<?php echo esc_attr(get_option('insta_video_api_url', 'https://api.thecalicocats.com')); ?>" class="regular-text" />
                            <p class="description">Backend API endpoint (e.g. <code>https://api.thecalicocats.com</code>).</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Default Title</th>
                        <td>
                            <input type="text" name="insta_video_default_title" value="<?php echo esc_attr(get_option('insta_video_default_title', 'Instagram Video & Reel Downloader')); ?>" class="regular-text" />
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <hr />
            <h3>🎨 Shortcode & Kadence Integration:</h3>
            <p>You can add the block directly in <strong>Gutenberg / Kadence</strong> or use the shortcode:</p>
            <code>[insta_video_downloader]</code>
            <h4>Full Customization Example:</h4>
            <code>[insta_video_downloader theme="cyber-purple" badge_text="100% FREE HD" title="Download Instagram Reels" max_width="720" border_radius="20" btn_bg="linear-gradient(135deg, #ec4899, #8b5cf6)"]</code>
        </div>
        <?php
    }
}

new InstaVideoDownloaderPlugin();
