import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/user';
import Workspace from '../models/workspace';
import Document from '../models/document';
import { getPlainTextWordCountCharCount } from '../utils/documentHelpers';

dotenv.config();

const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@example.com',
  password: 'Demo123!',
};

const DEMO_WORKSPACES = [
  {
    name: 'Marketing Campaign 2026',
    description: 'Q1 marketing initiatives and content strategy',
  },
  {
    name: 'Product Development',
    description: 'Product roadmap and feature specifications',
  },
  {
    name: 'Research & Analysis',
    description: 'Market research and competitive analysis',
  },
  {
    name: 'Design System',
    description: 'UI components, brand guidelines and design tokens',
  },
  {
    name: 'Engineering Handbook',
    description: 'Development standards, onboarding and best practices',
  },
  {
    name: 'Customer Success',
    description: 'Onboarding guides, FAQs and support documentation',
  },
];

const DEMO_DOCUMENTS = [
  {
    workspaceIndex: 0,
    title: 'Social Media Strategy',
    content: `<h2>Social Media Strategy 2026</h2>
<p>Our comprehensive approach to social media marketing for Q1 2026.</p>
<h3>Objectives</h3>
<ul>
<li>Increase brand awareness by 40%</li>
<li>Grow follower base across all platforms</li>
<li>Improve engagement rates by 25%</li>
</ul>
<h3>Key Platforms</h3>
<ol>
<li><strong>LinkedIn</strong> - B2B thought leadership</li>
<li><strong>Twitter/X</strong> - Real-time updates and engagement</li>
<li><strong>Instagram</strong> - Visual storytelling</li>
</ol>
<p>We'll focus on creating authentic, value-driven content that resonates with our target audience.</p>`,
  },
  {
    workspaceIndex: 0,
    title: 'Q1 Campaign Brief',
    content: `<h2>Spring Launch Campaign Brief</h2>
<p>Campaign overview for the seasonal product launch targeting 25–40 year old urban professionals.</p>
<h3>Campaign Goals</h3>
<ul>
<li>Drive 15,000 sign-ups within the first 30 days</li>
<li>Achieve a cost-per-acquisition below £18</li>
<li>Generate 500+ pieces of user-generated content</li>
</ul>
<h3>Target Audience</h3>
<p>Primary: Urban professionals aged 25–40 with disposable income and interest in productivity tools.</p>
<p>Secondary: Small business owners seeking affordable solutions.</p>
<h3>Key Messages</h3>
<ol>
<li>Save 3 hours a week on repetitive tasks</li>
<li>Built for teams of any size</li>
<li>No setup fees, cancel anytime</li>
</ol>
<p>All creative assets must be submitted to the brand team by 14 February for review.</p>`,
  },
  {
    workspaceIndex: 1,
    title: 'API Integration Spec',
    content: `<h2>Third-Party API Integration Specification</h2>
<p>Technical requirements for integrating the payment and notification APIs in the upcoming release.</p>
<h3>Payment Gateway</h3>
<p>We will use <strong>Stripe</strong> as the primary payment provider. The integration must support:</p>
<ul>
<li>One-time payments and recurring subscriptions</li>
<li>Webhook handling for payment success, failure and refund events</li>
<li>SCA compliance for European customers</li>
</ul>
<h3>Notification Service</h3>
<p>Email notifications will be handled via <strong>Resend</strong>. Trigger points include:</p>
<ol>
<li>Account registration confirmation</li>
<li>Password reset requests</li>
<li>Weekly activity digest (opt-in)</li>
</ol>
<h3>Error Handling</h3>
<p>All external API calls must implement exponential backoff with a maximum of 3 retries before surfacing an error to the user.</p>`,
  },
  {
    workspaceIndex: 1,
    title: 'Sprint 12 Planning',
    content: `<h2>Sprint 12 — Planning Notes</h2>
<p>Two-week sprint running 3–17 March. Team capacity: 42 story points.</p>
<h3>Committed Stories</h3>
<ul>
<li><strong>AUTH-204</strong> - Refresh token rotation (5 pts)</li>
<li><strong>DASH-118</strong> - Export report as PDF (8 pts)</li>
<li><strong>NOTIF-33</strong> - In-app notification centre (13 pts)</li>
<li><strong>PERF-09</strong> - Lazy-load workspace list (3 pts)</li>
<li><strong>BUG-77</strong> - Fix date timezone offset on dashboard (2 pts)</li>
</ul>
<h3>Carry-over</h3>
<ul>
<li><strong>SEARCH-14</strong> - Full-text search indexing (8 pts) — blocked on DevOps infra</li>
</ul>
<h3>Definition of Done</h3>
<ol>
<li>Unit tests passing with &gt;80% coverage</li>
<li>Reviewed and approved by at least one other engineer</li>
<li>Deployed to staging and smoke tested</li>
</ol>`,
  },
  {
    workspaceIndex: 2,
    title: 'Competitor Analysis',
    content: `<h2>Competitor Landscape — Q1 2026</h2>
<p>Analysis of the five most relevant competitors based on feature set, pricing and market positioning.</p>
<h3>Key Findings</h3>
<ul>
<li><strong>Notion</strong> — Strongest brand recognition among individual users; weak enterprise security story</li>
<li><strong>Coda</strong> — Powerful automation but steep learning curve; churns non-technical users</li>
<li><strong>Confluence</strong> — Dominant in large enterprises; poor UX scores consistently in user reviews</li>
<li><strong>Slite</strong> — Clean interface; limited AI features; pricing undercuts the market</li>
</ul>
<h3>Pricing Comparison</h3>
<ol>
<li>Notion: Free / $10 / $18 per user per month</li>
<li>Confluence: Free up to 10 users / $5.75 per user</li>
<li>Coda: Free / $12 / $36 per user per month</li>
</ol>
<h3>Our Gap Opportunity</h3>
<p>No competitor offers a fully integrated AI chat layer at the document level without leaving the editor. This remains our primary differentiator to push in Q2 messaging.</p>`,
  },
  {
    workspaceIndex: 2,
    title: 'User Interview Notes',
    content: `<h2>User Research Findings</h2>
<p>Key insights from 25 user interviews conducted in January 2026.</p>
<h3>Pain Points</h3>
<ul>
<li>"I spend too much time searching for documents" - 19/25 users</li>
<li>"Need better AI tools for summarising long documents" - 16/25 users</li>
<li>"Want to ask questions about documents without reading everything" - 22/25 users</li>
</ul>
<h3>Feature Requests</h3>
<ol>
<li>Smart search with semantic understanding</li>
<li>AI document summarisation</li>
<li>Chat interface to query documents</li>
<li>Version history and rollback</li>
<li>Dark mode (mentioned by 18/25 users)</li>
</ol>
<blockquote>
<p>"If I could just chat with my documents and get instant answers, it would save me hours every week."</p>
<p>— Sarah, Product Manager</p>
</blockquote>`,
  },
  {
    workspaceIndex: 3,
    title: 'Accessibility Audit',
    content: `<h2>Accessibility Audit Report — March 2026</h2>
<p>Results of the WCAG 2.1 AA compliance audit carried out by an independent reviewer.</p>
<h3>Summary</h3>
<p>Overall score: <strong>74 / 100</strong>. The application meets most Level A criteria but has several Level AA failures that require attention before the public launch.</p>
<h3>Critical Issues</h3>
<ul>
<li>Form inputs missing associated <code>&lt;label&gt;</code> elements on the registration page</li>
<li>Colour contrast ratio of 2.8:1 on secondary button text (minimum 4.5:1 required)</li>
<li>Modal dialogs do not trap keyboard focus</li>
</ul>
<h3>Recommended Fixes</h3>
<ol>
<li>Add <code>htmlFor</code> / <code>id</code> pairing to all form fields</li>
<li>Darken secondary button text from slate-400 to slate-700</li>
<li>Implement focus trap using <code>focus-trap-react</code> library</li>
<li>Add <code>aria-live</code> region for toast notifications</li>
</ol>
<p>A follow-up audit is scheduled for 28 March to verify all critical issues have been resolved.</p>`,
  },
  {
    workspaceIndex: 3,
    title: 'Icon & Illustration Guide',
    content: `<h2>Icon & Illustration Standards</h2>
<p>Guidelines for consistent use of iconography and illustrations across all product surfaces.</p>
<h3>Icon Library</h3>
<p>We use <strong>Lucide React</strong> as the sole icon library. Do not mix with other icon sets.</p>
<ul>
<li>Default size: 16×16px inline, 20×20px standalone actions</li>
<li>Stroke width: 1.5 (default Lucide setting — do not override)</li>
<li>Colour: inherit from parent text colour unless indicating status</li>
</ul>
<h3>Status Colours</h3>
<ol>
<li><strong>Success</strong> — green-500</li>
<li><strong>Warning</strong> — amber-500</li>
<li><strong>Error</strong> — red-500</li>
<li><strong>Info</strong> — blue-500</li>
</ol>
<h3>Illustrations</h3>
<p>Empty states use a single centred illustration with a maximum width of 160px. Illustrations should be SVG format and optimised with SVGO before committing.</p>`,
  },
  {
    workspaceIndex: 4,
    title: 'Incident Response Playbook',
    content: `<h2>Incident Response Playbook</h2>
<p>Step-by-step guide for handling production incidents from detection to post-mortem.</p>
<h3>Severity Levels</h3>
<ul>
<li><strong>P1</strong> — Full outage or data loss. Page on-call immediately. All-hands response.</li>
<li><strong>P2</strong> — Major feature broken for all users. Response within 30 minutes.</li>
<li><strong>P3</strong> — Degraded performance or partial feature failure. Response within 4 hours.</li>
<li><strong>P4</strong> — Minor bug with workaround available. Schedule for next sprint.</li>
</ul>
<h3>Response Steps</h3>
<ol>
<li>Acknowledge the alert in PagerDuty within 5 minutes</li>
<li>Post an incident channel in Slack: <code>#inc-YYYY-MM-DD-description</code></li>
<li>Assign an Incident Commander and a Comms Lead</li>
<li>Diagnose, mitigate, then resolve — in that order</li>
<li>Update the status page every 30 minutes during active incidents</li>
</ol>
<h3>Post-Mortem</h3>
<p>A blameless post-mortem document must be completed within 48 hours of resolution for all P1 and P2 incidents.</p>`,
  },
  {
    workspaceIndex: 4,
    title: 'Git Workflow Guide',
    content: `<h2>Git Workflow & Branching Strategy</h2>
<p>Our branching model is based on trunk-based development with short-lived feature branches.</p>
<h3>Branch Naming</h3>
<ul>
<li><code>feat/short-description</code> — new features</li>
<li><code>fix/short-description</code> — bug fixes</li>
<li><code>chore/short-description</code> — dependency updates, refactors</li>
<li><code>docs/short-description</code> — documentation only</li>
</ul>
<h3>Commit Messages</h3>
<p>Follow the <strong>Conventional Commits</strong> specification:</p>
<pre><code>feat: add PDF export to report page
fix: correct timezone offset on dashboard stats
chore: upgrade Vite to v7
docs: update onboarding setup steps</code></pre>
<h3>Pull Request Rules</h3>
<ol>
<li>PRs must target <code>main</code> directly — no long-lived develop branch</li>
<li>Squash merge only to keep history clean</li>
<li>Delete branch after merge</li>
<li>CI must be green before merging — no exceptions</li>
</ol>`,
  },
  {
    workspaceIndex: 5,
    title: 'Onboarding Checklist',
    content: `<h2>New Customer Onboarding Checklist</h2>
<p>A step-by-step guide to ensure every new customer is set up for success within their first 30 days.</p>
<h3>Week 1 — Setup</h3>
<ul>
<li>Send welcome email with login credentials and getting started guide</li>
<li>Schedule a 30-minute kickoff call with the account manager</li>
<li>Confirm billing details and invoice delivery address</li>
<li>Ensure the customer has completed profile setup</li>
</ul>
<h3>Week 2 — Activation</h3>
<ol>
<li>Check the customer has created at least one project</li>
<li>Share the tutorial video library link</li>
<li>Invite customer to the monthly webinar series</li>
</ol>
<h3>Week 4 — Review</h3>
<p>Send a 30-day check-in survey and schedule a follow-up call if the health score is below 7/10. Flag any at-risk accounts to the team lead immediately.</p>`,
  },
  {
    workspaceIndex: 5,
    title: 'Support FAQ',
    content: `<h2>Frequently Asked Questions</h2>
<p>Answers to the most common questions raised by customers in the first 90 days.</p>
<h3>Billing</h3>
<ul>
<li><strong>When am I charged?</strong> Subscriptions renew on the same date each month. You will receive an invoice by email 3 days before each renewal.</li>
<li><strong>Can I change my plan mid-cycle?</strong> Yes. Upgrades take effect immediately and are prorated. Downgrades apply at the next renewal date.</li>
</ul>
<h3>Account Management</h3>
<ul>
<li><strong>How do I reset my password?</strong> Use the "Forgot password" link on the sign-in page. The reset link expires after 15 minutes.</li>
<li><strong>Can I have multiple users on one account?</strong> Yes, invite team members from the Settings page. Each user gets their own login.</li>
</ul>
<h3>Data & Privacy</h3>
<ol>
<li>All data is encrypted at rest and in transit using AES-256 and TLS 1.3</li>
<li>You can export all your data at any time from the Settings page</li>
<li>Account deletion permanently removes all data within 30 days</li>
</ol>`,
  },
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/deskinsights';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    await User.deleteOne({ email: DEMO_USER.email });
    console.log('Cleared existing demo user');

    const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
    const user = await User.create({
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      passwordHash: hashedPassword,
    });
    console.log('Created demo user:', DEMO_USER.email);

    await Workspace.deleteMany({ ownerId: user._id });
    await Document.deleteMany({ userId: user._id });
    console.log('Cleared existing workspaces and documents');

    for (let i = 0; i < DEMO_WORKSPACES.length; i++) {
      const workspaceData = DEMO_WORKSPACES[i];
      const workspace = await Workspace.create({
        name: workspaceData.name,
        description: workspaceData.description,
        ownerId: user._id,
        members: [
          {
            userId: user._id,
            role: 'owner',
            joinedAt: new Date(),
          },
        ],
      });
      console.log(`Created workspace: ${workspace.name}`);

      const workspaceDocs = DEMO_DOCUMENTS.filter(
        (doc) => doc.workspaceIndex === i,
      );
      for (const docData of workspaceDocs) {
        const { plainText, wordCount, characterCount } =
          getPlainTextWordCountCharCount(docData.content);

        await Document.create({
          title: docData.title,
          content: docData.content,
          workspaceId: workspace._id,
          userId: user._id,
          createdBy: user._id,
          lastEditedBy: user._id,
          wordCount,
          characterCount,
          plainText,
        });
        console.log(
          `  Created document: ${docData.title} (${wordCount} words)`,
        );
      }
    }

    console.log('\nDatabase seeding completed successfully');
    console.log('\nDemo credentials:');
    console.log(`   Email: ${DEMO_USER.email}`);
    console.log(`   Password: ${DEMO_USER.password}`);
    console.log('\n');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

void (async () => {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
})();
