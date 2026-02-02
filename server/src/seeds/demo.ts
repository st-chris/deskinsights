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
    title: 'Content Calendar',
    content: `<h2>Q1 2026 Content Calendar</h2>
<p>Planned content across all channels for January through March.</p>
<h3>January</h3>
<ul>
<li>Week 1: New Year, New Features announcement</li>
<li>Week 2: Customer success story</li>
<li>Week 3: Industry trends analysis</li>
<li>Week 4: Product tutorial series</li>
</ul>
<h3>February</h3>
<ul>
<li>Week 1: Valentine's Day campaign</li>
<li>Week 2: Behind the scenes content</li>
<li>Week 3: Expert interview series</li>
<li>Week 4: Community spotlight</li>
</ul>`,
  },
  {
    workspaceIndex: 1,
    title: 'Feature Specifications',
    content: `<h2>New Features - Q1 2026</h2>
<p>Detailed specifications for upcoming product enhancements.</p>
<h3>Feature 1: Advanced Analytics Dashboard</h3>
<p><strong>Description:</strong> Comprehensive analytics with real-time data visualization</p>
<p><strong>User Story:</strong> As a user, I want to see detailed analytics about my workspace activity so I can make data-driven decisions.</p>
<h3>Feature 2: Team Collaboration Tools</h3>
<ul>
<li>Real-time collaborative editing</li>
<li>Comment threads on documents</li>
<li>@mentions and notifications</li>
<li>Activity feed</li>
</ul>
<p><strong>Priority:</strong> High</p>
<p><strong>Estimated Effort:</strong> 3 sprints</p>`,
  },
  {
    workspaceIndex: 1,
    title: 'Technical Architecture',
    content: `<h2>System Architecture Overview</h2>
<p>High-level architecture design for scalability and performance.</p>
<h3>Frontend Architecture</h3>
<pre><code>React 18 + TypeScript
├── Redux Toolkit (State Management)
├── TanStack Query (Server State)
├── TailwindCSS (Styling)
└── Tiptap (Rich Text Editor)</code></pre>
<h3>Backend Architecture</h3>
<pre><code>Node.js + Express + TypeScript
├── MongoDB (Database)
├── JWT (Authentication)
├── Gemini AI (AI Features)
└── Rate Limiting</code></pre>
<p>The system is designed to handle 10,000+ concurrent users with horizontal scaling capabilities.</p>`,
  },
  {
    workspaceIndex: 2,
    title: 'Market Research Report',
    content: `<h2>Market Analysis - Document Management Industry</h2>
<p>Comprehensive analysis of the document management software market in 2026.</p>
<h3>Market Size</h3>
<p>The global document management market is projected to reach <strong>$12.8 billion by 2027</strong>, growing at a CAGR of 14.5%.</p>
<h3>Key Trends</h3>
<ol>
<li><strong>AI Integration</strong> - 78% of companies are investing in AI-powered features</li>
<li><strong>Remote Collaboration</strong> - Hybrid work has increased demand by 45%</li>
<li><strong>Security Focus</strong> - End-to-end encryption is now table stakes</li>
</ol>
<h3>Competitive Landscape</h3>
<ul>
<li>Notion - Strong in collaboration</li>
<li>Confluence - Enterprise focused</li>
<li>Google Docs - Market leader in simplicity</li>
</ul>
<p><strong>Our Differentiator:</strong> AI-powered insights with seamless document chat capabilities.</p>`,
  },
  {
    workspaceIndex: 2,
    title: 'User Interview Notes',
    content: `<h2>User Research Findings</h2>
<p>Key insights from 25 user interviews conducted in January 2026.</p>
<h3>Pain Points</h3>
<ul>
<li>"I spend too much time searching for documents" - 19/25 users</li>
<li>"Need better AI tools for summarizing long documents" - 16/25 users</li>
<li>"Want to ask questions about documents without reading everything" - 22/25 users</li>
</ul>
<h3>Feature Requests</h3>
<ol>
<li>Smart search with semantic understanding</li>
<li>AI document summarization</li>
<li>Chat interface to query documents</li>
<li>Version history and rollback</li>
<li>Dark mode (mentioned by 18/25 users)</li>
</ol>
<blockquote>
<p>"If I could just chat with my documents and get instant answers, it would save me hours every week."</p>
<p>- Sarah, Product Manager</p>
</blockquote>`,
  },
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/deskinsights';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing demo data
    await User.deleteOne({ email: DEMO_USER.email });
    console.log('Cleared existing demo user');

    // Create demo user
    const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
    const user = await User.create({
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      passwordHash: hashedPassword,
    });
    console.log('Created demo user:', DEMO_USER.email);

    // Delete existing workspaces for this user
    await Workspace.deleteMany({ ownerId: user._id });
    await Document.deleteMany({ userId: user._id });
    console.log('Cleared existing workspaces and documents');

    // Create workspaces and documents
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

      // Create documents for this workspace
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
