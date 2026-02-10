# 📧 Simple Sendy SES Bridge

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![WordPress](https://img.shields.io/badge/WordPress-5.8%2B-aaaaaa.svg) ![License](https://img.shields.io/badge/license-GPLv2-green.svg)

**Connect WordPress to Sendy with style.**
Create beautiful, responsive newsletters directly from your WordPress posts and send them via your Sendy installation (Amazon SES).

---

## ✨ Features

### 🎨 Visual Newsletter Builder
*   **Drag-and-Drop Post Selection:** Search and add posts with a single click.
*   **Hero + Grid Layout:** First post displays as a featured "Hero" card, subsequent posts in a **2-column grid** (desktop).
*   **Two Layout Options:** Choose between List view (single column) or Grid view (2-column).
*   **Live Preview:** See exactly what your email will look like as you build it.
*   **Banner Upload:** Add custom hero banners via WordPress Media Library.

### 📱 Mobile-First Responsive Design
*   **Smart Stacking:** Grid items automatically switch to **single-column layout** on mobile (< 600px).
*   **Auto-Height:** Cards adjust dynamically to fit content, removing awkward whitespace.
*   **Readable Typography:** Optimized font sizes and spacing for mobile reading.

### 🖼️ Professional Media Handling
*   **Integrated Banners:** Banner images fully integrated into Hero card with rounded corners.
*   **No-Crop Scaling:** Banners use `height: auto` to ensure 100% visibility.
*   **High-Res Thumbnails:** Uses 'Large' image size for retina displays.

### 📧 Advanced Campaign Management
*   **Multi-List Support:** Send to multiple Sendy lists with checkboxes (all selected by default).
*   **Three Send Options:**
    *   **Save as Draft** - Create draft in Sendy for later editing
    *   **Send Immediately** - Send campaign right away
    *   **Schedule** - Set date/time for automatic sending (defaults to current time + 1 hour)
*   **Test Email:** Preview campaigns in your inbox before sending to subscribers.
*   **Status Tracking:** View `Draft`, `Sent`, or `Scheduled` status in campaign list.
*   **Error Handling:** Failed campaigns show detailed error messages in dedicated column.
*   **One-Click Retry:** Instantly retry failed campaigns with a single button.
*   **Automatic Recovery:** Overdue scheduled campaigns are automatically detected and sent.

### 🎨 Customizable Footer
*   **Logo Upload:** Add your brand logo to email footer.
*   **Copyright Text:** Customize copyright notice.
*   **Social Media Links:** Add Instagram, LinkedIn, X (Twitter), YouTube links.
*   **Read More Link:** Direct subscribers to your website or blog.

### 🏷️ Keywords
`Sendy` `Amazon SES` `Newsletter Builder` `Email Marketing` `WordPress Newsletter` `Drag and Drop` `Post to Email` `Responsive Email Template` `Email Automation` `Campaign Scheduler`

---

## 🚀 Installation

1.  **Download** the plugin zip file.
2.  **Upload** to your WordPress site via *Plugins > Add New > Upload Plugin*.
3.  **Activate** the plugin.
4.  **Configure** your Sendy details in *Settings > Simple Sendy Bridge*:
    *   Sendy Installation URL
    *   API Key
    *   Default List ID

## 📖 Usage

1.  Navigate to **Simple Sendy Bridge > Create Newsletter**.
2.  **Select a Banner:** Choose an image from your Media Library.
3.  **Add Posts:** Search for your articles and click "Add".
    *   1st Post = **Hero**
    *   2nd+ Posts = **Grid**
4.  **Preview:** Check the preview column.
5.  **Send or Schedule:** Choose to Send Now, Save as Draft (in Sendy), or Schedule for later.

---

## 🔧 Troubleshooting

### Scheduled Campaigns Not Sending on Time?

**Why:** WordPress uses WP-Cron, which only triggers when someone visits your site. Low-traffic sites may experience delays.

**Automatic Recovery:**
- The plugin **automatically detects and sends** overdue campaigns when you visit the Campaigns page
- You'll see a green success notice: *"Overdue Campaign Sent: [Campaign Name] was automatically sent."*
- If auto-send fails, you'll see the error message with a **"Retry Send"** button

**Permanent Solution (Recommended for Production):**

1. **Disable WP-Cron** by adding this to `wp-config.php`:
   ```php
   define('DISABLE_WP_CRON', true);
   ```

2. **Set up a real cron job** (via cPanel, Plesk, or server SSH):
   ```bash
   * * * * * wget -q -O - https://yourdomain.com/wp-cron.php?doing_wp_cron >/dev/null 2>&1
   ```
   
   Or using `curl`:
   ```bash
   * * * * * curl https://yourdomain.com/wp-cron.php?doing_wp_cron >/dev/null 2>&1
   ```

### Campaign Failed to Send?

Failed campaigns will display:
- ❌ Red error notice at the top of the Campaigns page
- 📋 Exact error message in the "Error" column
- 🔄 **"Retry Send"** button for instant retry

**Common Errors:**
- **"Reply to email not passed"** - Fixed automatically in v1.0.0+
- **"Invalid API key"** - Check your Sendy settings
- **"List ID is required"** - Verify your default list ID in settings

### Campaign Stuck at "Preparing to send..." in Sendy?

**Why:** Sendy requires its own cron job to process and send campaigns. Without it, campaigns get queued but never send.

**Quick Fix (Manual Trigger):**
```
https://your-sendy-domain.com/scheduled.php?i=1
```
Replace `your-sendy-domain.com` with your actual Sendy URL. This manually triggers campaign processing.

**Permanent Fix (Set Up Sendy Cron):**

Add this cron job to your server:

**Via cPanel:**
1. Go to **cPanel > Cron Jobs**
2. Set to run every 5 minutes: `*/5 * * * *`
3. Command:
   ```bash
   php /home/yourusername/public_html/sendy/scheduled.php > /dev/null 2>&1
   ```

**Via SSH:**
```bash
crontab -e
```
Add this line:
```bash
*/5 * * * * php /path/to/sendy/scheduled.php > /dev/null 2>&1
```

This automatically processes queued campaigns every 5 minutes.



---

## 🤝 Support

Created by **Gunjan Jaswal**.
If you like this plugin, consider [Buying Me A Coffee ☕](https://buymeacoffee.com/gunjanjaswal).
