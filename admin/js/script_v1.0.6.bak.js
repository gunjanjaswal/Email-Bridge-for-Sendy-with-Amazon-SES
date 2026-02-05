jQuery(document).ready(function ($) {
    const selectedPosts = [];
    let bannerUrl = '';
    let layoutType = 'list';

    // Load known lists if available
    const knownLists = sssb_ajax.known_lists || [];
    if (knownLists.length > 0) {
        const $listInput = $('#sssb-list-id');
        const $listContainer = $listInput.parent();

        let listHtml = '<label><strong>Choose your lists & segments</strong></label><div class="sssb-list-checkboxes" style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px; background: #fff; margin-top:5px;">';

        // Check if there is a default list ID
        const defaultListId = $listInput.val();

        knownLists.forEach(list => {
            const isChecked = list.id === defaultListId ? 'checked' : '';
            listHtml += `
                <label style="display:block; margin-bottom: 5px;">
                    <input type="checkbox" name="sssb_target_lists" value="${list.id}" ${isChecked}> ${list.name}
                </label>
            `;
        });

        listHtml += '</div>';

        // Hide original input but keep it for fallback/reference if needed
        $listInput.hide();
        $listContainer.find('label').first().hide(); // Hide original label
        $listContainer.append(listHtml);
    }

    // Banner Image Upload
    $('#sssb-upload-banner').on('click', function (e) {
        e.preventDefault();
        const image_frame = wp.media({
            title: 'Select Banner Image',
            multiple: false,
            library: { type: 'image' },
            button: { text: 'Use Banner' }
        });

        image_frame.on('select', function () {
            const uploaded_image = image_frame.state().get('selection').first().toJSON();
            bannerUrl = uploaded_image.url;
            $('#sssb-banner-url').val(bannerUrl);
            $('#sssb-banner-preview').html(`<img src="${bannerUrl}" style="max-width:100%; height:auto;">`);
            $('#sssb-remove-banner').show();
            $('#sssb-upload-banner').text('Change Banner');
            updatePreview();
        });

        image_frame.open();
    });

    $('#sssb-remove-banner').on('click', function (e) {
        e.preventDefault();
        bannerUrl = '';
        $('#sssb-banner-url').val('');
        $('#sssb-banner-preview').empty();
        $(this).hide();
        $('#sssb-upload-banner').text('Select Banner');
        updatePreview();
    });

    // Layout Change
    $('input[name="sssb_layout"]').on('change', function () {
        layoutType = $(this).val();
        updatePreview();
    });

    // Search Posts
    $('#sssb-search').on('input', function () {
        const query = $(this).val();
        // Allow empty query to reset to recent posts, otherwise wait for 3 chars
        if (query.length > 0 && query.length < 3) return;
        loadPosts(query);
    });

    // Add Post to selection
    $(document).on('click', '.sssb-add-post', function (e) {
        e.preventDefault();
        const postId = $(this).data('id');
        const title = $(this).data('title');
        const thumbnail = $(this).data('thumbnail');
        const excerpt = $(this).data('excerpt');
        const link = $(this).data('link');
        const content = $(this).data('content');

        if (selectedPosts.some(p => p.id === postId)) return;

        selectedPosts.push({ id: postId, title, thumbnail, excerpt, link, content });
        renderSelectedPosts();
        updatePreview();
    });

    // Remove Post
    $(document).on('click', '.sssb-remove-post', function (e) {
        e.preventDefault();
        const postId = $(this).data('id');
        const index = selectedPosts.findIndex(p => p.id === postId);
        if (index > -1) {
            selectedPosts.splice(index, 1);
            renderSelectedPosts();
            updatePreview();
        }
    });

    // Toggle Schedule Options
    $('input[name="sssb_send_type"]').on('change', function () {
        if ($(this).val() === 'schedule') {
            $('#sssb-schedule-options').slideDown();
        } else {
            $('#sssb-schedule-options').slideUp();
        }
    });

    // Create Campaign
    $('#sssb-create-campaign').on('click', function (e) {
        e.preventDefault();
        const $btn = $(this);
        $btn.prop('disabled', true).text('Processing...');

        const campaignData = {
            subject: $('#sssb-subject').val(),
            from_name: $('#sssb-from-name').val(),
            from_email: $('#sssb-from-email').val(),
            html_text: $('#sssb-preview-content').html(),
            list_id: (function () {
                const $selectedLists = $('input[name="sssb_target_lists"]:checked');
                if ($selectedLists.length > 0) {
                    const ids = [];
                    $selectedLists.each(function () { ids.push($(this).val()); });
                    return ids.join(',');
                }
                return $('#sssb-list-id').val();
            })(),
            send_type: $('input[name="sssb_send_type"]:checked').val(),
            schedule_date: $('#sssb-schedule-datetime').val()
        };

        campaignData.plain_text = $(campaignData.html_text).text();

        // Basic validation for schedule
        if (campaignData.send_type === 'schedule' && !campaignData.schedule_date) {
            alert('Please select a date and time for scheduling.');
            $btn.prop('disabled', false).text('Create Campaign');
            return;
        }

        $.ajax({
            url: sssb_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'sssb_create_campaign',
                nonce: sssb_ajax.nonce,
                campaign: campaignData
            },
            success: function (response) {
                $btn.prop('disabled', false).text('Create Campaign');
                if (response.success) {
                    alert(response.data.message);
                    if (window.confirm('Reload page to create another?')) {
                        window.location.reload();
                    }
                } else {
                    alert('Error: ' + response.data.message);
                }
            },
            error: function () {
                $btn.prop('disabled', false).text('Create Campaign');
                alert('Connection error');
            }
        });
    });

    function renderPostList(posts) {
        let html = '';
        if (posts.length === 0) {
            html = '<p>No posts found.</p>';
        } else {
            posts.forEach(post => {
                html += `
                    <div class="sssb-post-item">
                        <img src="${post.thumbnail}" alt="">
                        <div>
                            <strong>${post.title}</strong>
                            <br>
                            <button class="button button-small sssb-add-post" 
                                data-id="${post.id}" 
                                data-title="${post.title}" 
                                data-thumbnail="${post.thumbnail}" 
                                data-excerpt="${post.excerpt}"
                                data-link="${post.link}">Add</button>
                        </div>
                    </div>
                `;
            });
        }
        $('#sssb-post-results').html(html);
    }

    function renderSelectedPosts() {
        let html = '';
        selectedPosts.forEach(post => {
            html += `
                <div class="sssb-selected-item">
                    <span>${post.title}</span>
                    <a href="#" class="sssb-remove-post" data-id="${post.id}">Remove</a>
                </div>
            `;
        });
        $('#sssb-selected-list').html(html);
    }

    function updatePreview() {
        let html = '';
        const settings = sssb_ajax.settings || {};

        // 1. Template Wrapper & Styles
        html += `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Newsletter</title>
            <style type="text/css">
            body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Poppins', sans-serif; }
            table, td { border-collapse: collapse; }
            .container { width: 100%; max-width: 680px; margin: auto; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 34px rgba(0, 0, 0, 0.10); }
            a { text-decoration: underline; color: #ffffff !important; }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
        <div class="container">
        `;

        // 2. Banner (Integrated into Hero)
        const currentBanner = bannerUrl || 'https://via.placeholder.com/680x200?text=Select+Banner';

        // 3. Hero Section
        if (selectedPosts.length > 0) {
            const heroPost = selectedPosts[0];
            html += `
            <div style="padding: 26px 30px;">
                <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center;">
                    <img src="${currentBanner}" style="width: 100%; height: auto; display: block; border-top-left-radius: 12px; border-top-right-radius: 12px;" />
                    <div style="padding: 22px;">
                        <h2 style="margin-top: 0; color: #0f172a; text-align: center;">${heroPost.title}</h2>
                        
                        <table border="0" cellpadding="0" cellspacing="0" style="margin: auto;">
                            <tr>
                                <td style="background: #0f172a; border-radius: 10px; padding: 12px 22px; text-align: center;">
                                    <a href="${heroPost.link}" style="color: #ffffff !important; font-size: 14px; text-decoration: none; display: block; font-weight: 600;">Explore Insights</a>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            `;
        }

        // 4. Grid Section
        const gridPosts = selectedPosts.slice(1);
        if (gridPosts.length > 0) {
            html += `<div style="padding: 0 30px;"><table border="0" cellpadding="0" cellspacing="0" width="100%">`;

            for (let i = 0; i < gridPosts.length; i += 2) {
                html += `<tr>`;

                // Column 1
                const post1 = gridPosts[i];
                html += renderGridItem(post1);

                // Column 2
                if (i + 1 < gridPosts.length) {
                    const post2 = gridPosts[i + 1];
                    html += renderGridItem(post2);
                } else {
                    html += `<td width="50%"></td>`;
                }

                html += `</tr>`;
            }
            html += `</table></div>`;
        }

        // 5. Read More
        if (settings.more_articles_link) {
            html += `
           <div style="text-align: center; margin: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" style="margin: auto;">
                    <tr>
                        <td style="background: #0f172a; border-radius: 10px; padding: 12px 22px;">
                            <a href="${settings.more_articles_link}" style="color: #ffffff !important; font-size: 14px; text-decoration: none; font-weight: 600;">Read More Articles</a>
                        </td>
                    </tr>
                </table>
           </div>`;
        }

        // 6. Footer
        // Ensure settings exist, use defaults to prevent 'loading' errors
        const footerLogo = settings.footer_logo || '';
        const copyright = (settings.footer_copyright || 'TheYouthTalks').replace(/{year}/g, new Date().getFullYear());

        html += `
        <div style="background-color: #0f172a; padding: 32px 20px 40px; text-align: center; color: #cbd5e1; border-top: 1px solid #1e293b;">
            ${footerLogo ? `<img src="${footerLogo}" width="110" style="width: 110px; margin-bottom: 20px;" />` : ''}
            <div style="margin-bottom: 20px;">
                ${settings.social_instagram ? `<a href="${settings.social_instagram}" style="text-decoration:none; margin:0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="30" height="30" style="width:30px; height:30px; vertical-align:middle;" /></a>` : ''}
                ${settings.social_linkedin ? `<a href="${settings.social_linkedin}" style="text-decoration:none; margin:0 8px;"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/960px-LinkedIn_logo_initials.png" width="30" height="30" style="width:30px; height:30px; vertical-align:middle;" /></a>` : ''}
                ${settings.social_twitter ? `<a href="${settings.social_twitter}" style="text-decoration:none; margin:0 8px;"><img src="https://img.freepik.com/free-vector/twitter-new-2023-x-logo-white-background-vector_1017-45422.jpg" width="30" height="30" style="width:30px; height:30px; vertical-align:middle;" /></a>` : ''}
                ${settings.social_youtube ? `<a href="${settings.social_youtube}" style="text-decoration:none; margin:0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" width="30" height="30" style="width:30px; height:30px; vertical-align:middle;" /></a>` : ''}
            </div>
            <div>
                <p style="margin: 0 0 10px; font-size: 14px; color: #94a3b8;">${copyright}</p>
                <p style="margin: 0; font-size: 12px; color: #64748b;">You're receiving this email because you subscribed.</p>
                <div style="margin-top: 15px;">
                    <a href="[unsubscribe]" style="color: #ffffff !important; text-decoration: underline; font-size: 13px;">Unsubscribe</a>
                </div>
            </div>
        </div>
        </div>
        </body>
        </html>`;

        $('#sssb-preview-content').html(html);
    }

    function renderGridItem(post) {
        // Enforce consistent card height (e.g., 440px) to keep rows even
        // Image is now auto-height (proportional) and centered, max-width reduced to 250px
        return `
        <td style="padding:10px; vertical-align: top;" valign="top" width="50%">
            <table cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:12px; width: 100%; height: 440px; table-layout: fixed; background-color: #ffffff;">
                <tbody>
                    <tr>
                        <td align="center" valign="middle" style="height: 220px; vertical-align: middle; padding: 0;">
                            <img alt="" src="${post.thumbnail || 'https://via.placeholder.com/300'}" width="280" style="display:block; width: 100%; max-width: 100%; height: auto; margin: 0 auto; border-top-left-radius:12px; border-top-right-radius:12px;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:15px; text-align:center; vertical-align: top; height: auto;" valign="top">
                            <h3 style="font-size:16px; margin:0 0 12px; color:#0f172a; line-height: 1.4;">${post.title}</h3>
                            
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:auto;">
                                <tbody>
                                    <tr>
                                        <td style="background:#0f172a; border-radius:6px; padding:10px 20px; text-align:center;">
                                            <a href="${post.link}" style="color:#ffffff !important; font-size:13px; text-decoration:none; display:block; font-weight:600;">Read More</a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>`;
    }



    // Initial load of posts
    loadPosts();

    function loadPosts(query = '') {
        $.ajax({
            url: sssb_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'sssb_search_posts',
                nonce: sssb_ajax.nonce,
                query: query
            },
            success: function (response) {
                if (response.success) {
                    renderPostList(response.data);
                }
            }
        });
    }
});
