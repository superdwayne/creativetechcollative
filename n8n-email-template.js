// Extract email and name from Notion data
const items = [];

for (const item of $input.all()) {
  const email = item.json.property_email || '';
  const name = item.json.property_name || 'User';

  if (email) {
    items.push({
      json: {
        email: email,
        name: name,
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>From Tools to Systems – Creative Technology Collective</title>
  <style>
    u + .body .gmail-blend-screen { background:#000 !important; mix-blend-mode:normal !important; }
    u + .body .gmail-blend-difference { background:#000 !important; mix-blend-mode:normal !important; }
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #000 !important; }
      .dark-mode-text { color: #ffffff !important; }
      .light-mode-bg { background-color: #ffffff !important; }
      .light-mode-text { color: #111111 !important; }
      .grey-bg { background-color: #f8f8f8 !important; }
    }
    @media only screen and (max-width: 620px) {
      .main-table { width:100% !important; margin:0 !important; }
      .two-col-table { width:100% !important; margin:0 !important; }
      .mobile-padding { padding:28px 20px !important; }
      .mobile-header { padding:40px 20px 32px 20px !important; }
      .mobile-h1 { font-size:24px !important; }
      .mobile-h2 { font-size:20px !important; }
      .mobile-h3 { font-size:16px !important; }
      .mobile-img { width:100% !important; height:auto !important; }
      .mobile-footer { padding:20px 16px !important; }
      .mobile-card-padding { padding:16px 12px 20px 12px !important; }
      .partner-section { padding:28px 20px !important; }
      .section-spacer { height:24px !important; }
      .desktop-logo { display:none !important; }
      .mobile-logo { display:block !important; }
      .mobile-logo-wrap { background:transparent !important; padding:0 !important; border-radius:0 !important; }
      .mobile-logo-wrap img { filter:invert(1) !important; width:48px !important; height:48px !important; }
    }
  </style>
</head>
<body class="body" style="margin:0; padding:0; background-color:#000 !important; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" class="dark-mode-bg" style="background-color:#000 !important;">
          <tr>
            <td align="center" class="dark-mode-bg mobile-header" style="padding:60px 20px 50px 20px; background-color:#000 !important;">
              <div class="mobile-logo-wrap" style="display:inline-block; background:#ffffff; border-radius:12px; padding:10px; margin:0 auto 24px auto;">
                <img src="https://www.creativetechnologists.nl/email-images/ctc-cube-logo.png" width="40" height="40" alt="CTC Logo" style="display:block;" />
              </div>
              <h1 class="mobile-h1" style="margin:0; font-size:32px; line-height:1.2; color:#ffffff; font-weight:700;">Creative Technology Collective</h1>
              <p style="margin:12px 0 0 0; font-size:16px; color:#bdbdbd;">Your Extended Innovation Team</p>
            </td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0" border="0" class="main-table light-mode-bg" style="background-color:#ffffff !important; border-radius:12px; margin:0 20px 40px 20px; max-width:100%;">
          <tr>
            <td class="light-mode-text mobile-padding" style="padding:20px; color:#111111 !important; font-size:16px; line-height:1.6;">
              <div class="grey-bg" style="margin-top:0; border-radius:8px;">
                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#333;">Hey there,</p>
                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#333;">Something fascinating is happening beneath the surface of the AI hype cycle. While everyone's chasing bigger models and flashier demos, we're seeing the quiet emergence of something more fundamental: the rise of MCP (Model Context Protocol) and the renaissance of CLI tools.</p>
                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#333;">These aren't just technical trends—they're indicators pointing toward a stable agentic genetic future. A future where AI systems can reliably interface with our digital world through standardized protocols, and where the humble command line becomes the backbone of human-AI collaboration.</p>
                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#333;">In this edition, we're exploring the missing layer between AI tools and integrated systems, and why these foundational shifts matter more than the next model release.</p>
                <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#333;">Also — I'm closing out <strong>The Creative Tech Identity</strong> conference with a panel tackling the question the whole industry is circling: <em>what actually is a creative technologist?</em> If you want to be part of the conversation, grab a ticket using code <strong>CTC100</strong> for a discount.</p>
                <p style="margin:0; font-size:14px; color:#999; text-align:left;"><strong>Dwayne Paisley-Marshall</strong><br/>Founder, Creative Technology Collective</p>
              </div>
              <img src="https://www.creativetechnologists.nl/email-images/tools-to-systems.jpg" alt="From Tools to Systems" class="mobile-img" width="600" style="width:100%; max-width:600px; height:auto; display:block; margin:32px 0 24px 0; border-radius:8px;" />
              <h2 class="mobile-h2" style="font-size:26px; line-height:1.3; margin:0 0 8px 0;">From Tools to Systems: The Missing Layer of AI Innovation</h2>
              <p style="margin:0 0 24px 0; font-size:16px; color:#666; font-style:italic;">We are adopting advanced tools faster than we are learning how to integrate them into reasonable systems</p>
              <p style="margin-top:0;">As an AI program leader I have observed a recurring pattern: we are adopting advanced tools faster than we are learning how to integrate them into reasonable systems.</p>
              <h3 class="mobile-h3" style="font-size:18px; margin:24px 0 12px 0; font-weight:700;">The Race Between Creation and Decision-Making</h3>
              <p>Today's technology opportunities are extraordinary thanks to AI. One big win is in the Creative industry, where velocity has exploded. Now, we can generate virtual environments in minutes, prototype instantly, and produce infinite variations with instant feedback improvements. <strong>Creation is no longer limited. Decision-making is.</strong></p>
              <p>Like the Road Runner and Wile E. Coyote, technology sprints forward while organizational systems are left chasing it. Projects still depend on human validation, governance processes, countless leadership escalations, and executive alignment. These systems move slowly by design, while generative technologies move at unprecedented speed.</p>
              <p>When creation becomes faster than decision, organizations accumulate creative overflow. Many great ideas, prototypes, and experiences never see the light of day, not because they lack quality, but because they cannot be absorbed and scaled.</p>
              <h3 class="mobile-h3" style="font-size:18px; margin:24px 0 12px 0; font-weight:700;">Innovation Without Integration</h3>
              <p>In this 'Age of AI Omnipresence', another big elephant in the room no one is talking about, is <strong>lack of integration</strong>. We have powerful AI tools for coding, UX design, image and video generation, real-time 3D, world-building, and simulation. Whatever you imagine, someone is already building it. However, most tools are developed in isolation, each optimized for its own roadmap, metrics, and business model.</p>
              <p>Very few tech solutions are designed to work seamlessly with others, even within the same industry. While exploring real-time 3D and animation workflows, I was amazed by how many talented creators spend more time <em>connecting the dots</em>, understanding each tool, rather than using them. Forums and documentation pages are filled with workarounds rather than long-term scalable solutions.</p>
              <p>This issue is also visible across industries. In some autonomous vehicle development, AI is used to simulate camera viewpoints and reconstruct 360-degree environments, while generative world models and real-time 3D technologies advance separately in creative industries.</p>
              <p>We are missing the opportunity to integrate these systems, and start delivering meaningful and unimaginable remarkable components, as a whole.</p>
              <h3 class="mobile-h3" style="font-size:18px; margin:24px 0 12px 0; font-weight:700;">Beyond Technical Performance</h3>
              <p>The industry remains focused on technical metrics: resolution, latency, speed, and scale. These matter, of course, but what about: how tools interact, how decisions are made, how people manage complexity and ambiguity, and how systems are sustained over time. Many workflows depend on invisible human effort to compensate for fragile integrations and fragmented architectures.</p>
              <p style="margin-bottom:36px;"><strong>The next phase of innovation will be defined not by what we can generate, but by what we can sustain.</strong></p>
              <p style="margin:0 0 36px 0; font-size:14px; color:#999; text-align:left; font-style:italic;">Written by <a href="https://www.creativetechnologists.nl/directory/profile/fabiola-campos" target="_blank" style="color:#999; text-decoration:underline;">Fabiola Campos</a></p>
            </td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0" border="0" class="main-table" style="margin:0 auto; max-width:100%;"><tr><td class="section-spacer" style="height:12px; font-size:0; line-height:0;">&nbsp;</td></tr></table>
        <table width="600" cellpadding="0" cellspacing="0" border="0" class="main-table" style="margin:0 20px 20px 20px; background:#111111; border-radius:12px; border:1px solid #333; max-width:100%;">
          <tr>
            <td align="center" class="partner-section" style="padding:30px 20px;">
              <p style="margin:0 0 16px 0; font-size:11px; color:#bdbdbd; text-transform:uppercase; letter-spacing:1px;">Featured partner</p>
              <a href="https://apps.apple.com/us/app/solaya-3d-scanner-pro/id6550921134" target="_blank">
                <img src="https://media.licdn.com/dms/image/v2/D4E0BAQHtxD1HvPtnCg/company-logo_200_200/B4EZk4c3ltHoAI-/0/1757588716463/solaya_platform_logo?e=2147483647&v=beta&t=S0kI_D6MiGOJ0SCi8-6tQ_cMSpGrjSVIcBHwuUSSUwQ" alt="Solaya Logo" width="80" height="80" style="display:block; margin:0 auto 12px auto; border-radius:50%; border:2px solid #ffffff;" />
              </a>
              <h4 style="margin:0 0 8px 0; font-size:20px; color:#ffffff; font-weight:700;">Solaya</h4>
              <p style="margin:0 0 20px 0; font-size:14px; color:#999; max-width:400px; margin-left:auto; margin-right:auto; line-height:1.6;">Your phone. Your scanner. High-fidelity 3D. Experience the future of 3D creation — scalable, high-fidelity, and effortlessly simple.</p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td bgcolor="#ffffff" style="border-radius:8px;">
                    <a href="https://apps.apple.com/us/app/solaya-3d-scanner-pro/id6550921134" target="_blank" style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:700; color:#000000; text-decoration:none; letter-spacing:0.5px;">DOWNLOAD ON APP STORE</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0" border="0" class="main-table" style="margin:0 auto; max-width:100%;"><tr><td class="section-spacer" style="height:12px; font-size:0; line-height:0;">&nbsp;</td></tr></table>
        <table width="600" cellpadding="0" cellspacing="0" border="0" class="main-table" style="margin:0 20px 60px 20px; max-width:100%;">
          <tr>
            <td align="center" class="mobile-footer" style="padding:20px;">
              <p style="margin:0 0 12px 0; font-size:12px; color:#999;">
                <a href="https://creativetechnologists.nl/" target="_blank" style="color:#bdbdbd; text-decoration:none; margin:0 8px;">Website</a>
                <span style="color:#555;">|</span>
                <a href="https://www.instagram.com/creativetechnologist.nl/" target="_blank" style="color:#bdbdbd; text-decoration:none; margin:0 8px;">Instagram</a>
                <span style="color:#555;">|</span>
                <a href="https://www.linkedin.com/company/creativetechnologycollective/" target="_blank" style="color:#bdbdbd; text-decoration:none; margin:0 8px;">LinkedIn</a>
                <span style="color:#555;">|</span>
                <a href="https://www.creativetechnologists.nl/contact" target="_blank" style="color:#bdbdbd; text-decoration:none; margin:0 8px;">Contact</a>
              </p>
              <p style="margin:0; font-size:11px; color:#666;">
                <a href="https://n8n.creativetechnologists.nl/webhook/unsubscribe?email=\${email}" target="_blank" style="color:#999; text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }
    });
  }
}

return items;
