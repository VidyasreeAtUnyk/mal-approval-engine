const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  HeadingLevel, PageNumber, PageBreak, ExternalHyperlink, ImageRun,
} = require('docx')
const fs = require('fs')

const PURPLE = '7C3AED'
const PURPLE_LIGHT = 'F3EEFF'
const GRAY = '6B7280'
const DARK = '111827'
const WHITE = 'FFFFFF'
const BORDER_COLOR = 'E5E7EB'

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }

function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR, space: 1 } },
    spacing: { before: 0, after: 240 },
    children: [],
  })
}

function spacer(pts = 120) {
  return new Paragraph({ spacing: { before: 0, after: pts }, children: [] })
}

function sectionLabel(text) {
  return new Paragraph({
    spacing: { before: 360, after: 80 },
    children: [new TextRun({ text: text.toUpperCase(), font: 'Arial', size: 16, bold: true, color: PURPLE, characterSpacing: 80 })],
  })
}

function heading(text) {
  return new Paragraph({
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 36, bold: true, color: DARK })],
  })
}

function subheading(text) {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 24, bold: true, color: DARK })],
  })
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: opts.muted ? GRAY : DARK, bold: opts.bold || false })],
  })
}

function bulletItem(text, bold = false) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: DARK, bold })],
  })
}

function calloutBox(lines) {
  const children = lines.map(line =>
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: line, font: 'Arial', size: 22, color: DARK })],
    })
  )
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 12, color: PURPLE }, bottom: noBorder, left: noBorder, right: noBorder },
        shading: { fill: PURPLE_LIGHT, type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 160, left: 240, right: 240 },
        children,
      })]
    })]
  })
}

function decisionRow(number, title, body_text) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }
  const borders = { top: border, bottom: border, left: border, right: border }
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1200, 8160],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders,
          shading: { fill: PURPLE, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          verticalAlign: 'center',
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: number, font: 'Arial', size: 28, bold: true, color: WHITE })],
          })],
        }),
        new TableCell({
          borders,
          margins: { top: 120, bottom: 120, left: 200, right: 160 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: title, font: 'Arial', size: 22, bold: true, color: DARK })] }),
            new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: body_text, font: 'Arial', size: 20, color: GRAY })] }),
          ],
        }),
      ],
    })],
  })
}

function statRow(items) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }
  const borders = { top: border, bottom: border, left: border, right: border }
  const colWidth = Math.floor(9360 / items.length)
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: items.map(() => colWidth),
    rows: [new TableRow({
      children: items.map(({ value, label }) => new TableCell({
        borders,
        shading: { fill: PURPLE_LIGHT, type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 160, left: 160, right: 160 },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, font: 'Arial', size: 40, bold: true, color: PURPLE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, font: 'Arial', size: 18, color: GRAY })] }),
        ],
      }))
    })]
  })
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] })
}

function screenshotGrid(pairs) {
  // pairs: [{ file, caption }, { file, caption }] — two per row
  const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }
  const borders = { top: border, bottom: border, left: border, right: border }
  return pairs.map(([left, right]) => {
    const cells = [left, right].map(item => {
      const imgData = fs.readFileSync(item.file)
      return new TableCell({
        borders,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        width: { size: 4680, type: WidthType.DXA },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [new ImageRun({ type: 'png', data: imgData, transformation: { width: 300, height: 188 }, altText: { title: item.caption, description: item.caption, name: item.caption } })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: item.caption, font: 'Arial', size: 18, color: GRAY })],
          }),
        ],
      })
    })
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4680, 4680],
      rows: [new TableRow({ children: cells })],
    })
  }).flatMap(t => [t, spacer(120)])
}

const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0, format: 'bullet', text: '–', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 240 } } },
      }],
    }],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR, space: 1 } },
          spacing: { before: 0, after: 120 },
          children: [
            new TextRun({ text: 'Mal Approval Engine', font: 'Arial', size: 18, color: GRAY }),
            new TextRun({ text: '   ·   Vidyasree Natarajan', font: 'Arial', size: 18, color: GRAY }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR, space: 1 } },
          spacing: { before: 120, after: 0 },
          children: [new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: GRAY })],
        })],
      }),
    },
    children: [

      // ── TITLE PAGE ──────────────────────────────────────────────────────────

      spacer(720),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: 'Mal Approval Engine', font: 'Arial', size: 64, bold: true, color: DARK })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 480 },
        children: [new TextRun({ text: 'A Rapid Prototyper Assessment Submission', font: 'Arial', size: 28, color: GRAY })],
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: PURPLE, space: 1 } },
        spacing: { before: 0, after: 480 },
        children: [],
      }),
      spacer(120),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: 'Vidyasree Natarajan', font: 'Arial', size: 24, bold: true, color: DARK })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [new ExternalHyperlink({
          link: 'https://mal-approval-engine.vercel.app/',
          children: [new TextRun({ text: 'mal-approval-engine.vercel.app', font: 'Arial', size: 22, color: PURPLE, underline: {} })],
        })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 480 },
        children: [new TextRun({ text: 'Built in under 48 hours · June 2026', font: 'Arial', size: 22, color: GRAY })],
      }),
      spacer(240),
      statRow([
        { value: '< 48h', label: 'of 72 hours used' },
        { value: '2', label: 'flows live' },
        { value: '3', label: 'user roles' },
        { value: '101', label: 'tests passing' },
      ]),
      spacer(240),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: 'Test Accounts', font: 'Arial', size: 20, bold: true, color: DARK })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 40 },
        children: [
          new TextRun({ text: 'employee@test.com  ·  manager@test.com  ·  admin@test.com', font: 'Arial', size: 20, color: GRAY }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: 'Password: Test1234!', font: 'Arial', size: 20, color: GRAY })],
      }),

      pageBreak(),

      // ── 1. THE BRIEF ────────────────────────────────────────────────────────

      sectionLabel('01'),
      heading('The Brief'),
      rule(),
      calloutBox([
        '"Build a small web app. One request → review → decision flow.',
        'Two users. 72 hours."',
      ]),
      spacer(240),
      body('Simple brief. I had a different question.'),

      spacer(360),

      // ── 2. THE REAL QUESTION ────────────────────────────────────────────────

      sectionLabel('02'),
      heading('The Real Question'),
      rule(),
      body('What does a company actually need?'),
      spacer(120),
      body('Not one flow. Many flows.'),
      body('Not two users. A real org hierarchy.'),
      body('Not a demo. Something that could ship.'),
      spacer(240),
      body('So I built the engine once — and made every flow a config file.'),
      spacer(160),
      calloutBox([
        'budget-request/config.ts   ← live',
        'leave-request/config.ts    ← live',
        'access-request/config.ts   ← two files away',
        'vendor-payment/config.ts   ← two files away',
      ]),
      spacer(160),
      body('One platform. Every new flow is two files and one registry line.', { bold: true }),
      body('No engine changes. No schema migrations.', { muted: true }),

      pageBreak(),

      // ── 3. PRODUCT DECISIONS BEFORE CODE ────────────────────────────────────

      sectionLabel('03'),
      heading('Product Decisions Before Code'),
      rule(),
      body('Before touching Claude Code, four decisions were made. Each one is documented in docs/decisions/ with context, alternatives rejected, and consequences.', { muted: true }),
      spacer(200),

      decisionRow('01', 'Three roles, not two',
        'The brief said requester and approver. A manager submitting a request also needs an approver — a two-role system cannot model that. Three roles (employee → manager → admin) gives automatic routing, department-scoped visibility, and a realistic org model.'),
      spacer(120),
      decisionRow('02', 'One table, JSONB for form data',
        'Separate tables per flow means a schema migration for every new flow. EAV tables are complex and hard to query. JSONB + Zod: flexible at the DB layer, type-safe at the app layer. New flow, zero DB changes.'),
      spacer(120),
      decisionRow('03', 'Drafts to Supabase, not localStorage',
        'localStorage is device-specific. URL params expose financial data in browser history. DB drafts work across devices, survive tab crashes, and the same idempotency key promotes them to pending on submit. No orphan rows.'),
      spacer(120),
      decisionRow('04', 'Invite-only, not self-registration',
        'This is an internal tool. Open registration is a security hole. Admin invites by email and assigns a role. That is how internal platforms actually work — IT provisions access, not the user.'),

      pageBreak(),

      // ── 4. WHAT WAS BUILT ───────────────────────────────────────────────────

      sectionLabel('04'),
      heading('What Was Built'),
      rule(),

      subheading('Two Flows, Live'),
      bulletItem('Budget Request — amount, category, justification (AI assist), urgency, vendor'),
      bulletItem('Leave Request — date range picker, team overlap detection, reason'),
      bulletItem('AI summary generated on every submission, flags surface potential issues'),
      spacer(160),

      subheading('Three User Roles'),
      bulletItem('Employee — submits requests, sees their own, receives approval/rejection notifications'),
      bulletItem('Manager — sees team requests routed to them, approves or rejects with note'),
      bulletItem('Admin — org-wide dashboard, filters by dept/flow/status/date, approves manager requests'),
      spacer(160),

      subheading('Realtime'),
      bulletItem('Notification bell updates live — no page refresh needed'),
      bulletItem('Request detail page status flips live when manager approves'),
      bulletItem('Supabase Realtime with user-scoped channel filter'),
      spacer(160),

      subheading('Production Details'),
      bulletItem('RLS on every table — no exceptions'),
      bulletItem('Audit trail on every status change with timestamp'),
      bulletItem('Idempotency key on every submission — no duplicate rows'),
      bulletItem('Draft auto-save (1.5s debounce) with cross-device restore'),
      bulletItem('Soft delete — withdrawn requests are never permanently removed'),
      bulletItem('Error boundary and 404 page'),

      spacer(200),
      subheading('Screenshots'),
      spacer(80),
      ...screenshotGrid([
        [
          { file: 'screenshots/Employee dashboard.png', caption: 'Employee dashboard' },
          { file: 'screenshots/budget request form.png', caption: 'Budget request form' },
        ],
        [
          { file: 'screenshots/Request detail with AI Summary.png', caption: 'AI summary on submission' },
          { file: 'screenshots/notification.png', caption: 'Realtime notification bell' },
        ],
        [
          { file: 'screenshots/manager approval.png', caption: 'Manager approval view' },
          { file: 'screenshots/admin dashboard.png', caption: 'Admin org-wide dashboard' },
        ],
      ]),

      pageBreak(),

      // ── 5. THE PLAYBOOK ─────────────────────────────────────────────────────

      sectionLabel('05'),
      heading('The Playbook'),
      rule(),
      calloutBox([
        'Your JD says: in the first 60 days, document your prototyping',
        'workflow — prompts, decisions, gotchas — for the team.',
        '',
        'That file already exists. It was written while building.',
      ]),
      spacer(240),
      body('docs/prompts.md — 8 phases logged in real time:', { bold: true }),
      bulletItem('What was built in each phase'),
      bulletItem('Why each technical decision was made'),
      bulletItem('What broke and how it was fixed'),
      bulletItem('What was learned and what comes next'),
      spacer(160),
      body('docs/decisions/ — four architecture decisions written before any code.'),
      body('This is not a post-mortem. It was written as it happened.', { muted: true }),

      spacer(360),

      // ── 6. BUILT VS SKIPPED ─────────────────────────────────────────────────

      sectionLabel('06'),
      heading('Built vs Faked vs Skipped'),
      rule(),

      subheading('Built for real'),
      bulletItem('RLS, audit trail, idempotency, realtime, 101 tests'),
      bulletItem('Service client pattern for cross-user DB writes'),
      bulletItem('Role read from DB on every request — never from client'),
      spacer(160),

      subheading('Explicitly skipped — with a reason'),
      bulletItem('Email notifications → Supabase edge function pattern documented, not built'),
      bulletItem('Mobile optimisation → works on mobile, not optimised'),
      bulletItem('Full org chart → three roles covers the real use case'),
      bulletItem('Per-flow DB tables → JSONB + Zod is the right call for a prototype'),
      spacer(160),

      body('"Most prototypes fake the security layer and call it MVP. This one has RLS, a service client pattern, and an audit log — because at Mal, a prototype sometimes ships."', { bold: true }),

      pageBreak(),

      // ── 7. TIMELINE ─────────────────────────────────────────────────────────

      sectionLabel('07'),
      heading('Timeline'),
      rule(),
      calloutBox([
        'The brief gave 72 hours.',
        '',
        'This took under 48.',
      ]),
      spacer(240),
      body('Two flows. Three roles. Realtime. AI. 101 tests. Deployed.'),
      body('Full docs. Architecture decisions written before code.'),
      spacer(240),
      body('The remaining time is for performance, SEO, and whatever the team wants to test next.', { muted: true }),

      spacer(360),

      // ── 8. WHAT'S NEXT ──────────────────────────────────────────────────────

      sectionLabel('08'),
      heading("What's Next"),
      rule(),

      subheading('If this ships'),
      bulletItem('Arabic RTL — already built in a previous project'),
      bulletItem('Email notifications — Supabase edge function, one trigger'),
      bulletItem('access-request and vendor-payment flows — two files each'),
      bulletItem('Bulk approval for admins'),
      bulletItem('Performance + SEO polish'),
      spacer(160),

      subheading('If this is a prototype'),
      bulletItem('Hand the engine to the team — any engineer can add a flow from the docs alone'),
      bulletItem('docs/prompts.md becomes the starting point for the shared playbook'),
      bulletItem('Config-driven pattern becomes a reusable primitive for the next tool'),

      pageBreak(),

      // ── 9. THE META POINT ───────────────────────────────────────────────────

      sectionLabel('09'),
      heading('The Meta Point'),
      rule(),
      spacer(120),
      calloutBox([
        '"You said you need someone who turns a hypothesis into',
        'a deployed, usable product in days — not weeks.',
        '',
        'You said the prototype is the thing, and sometimes it ships.',
        '',
        'You said in the first 60 days, document your workflow',
        'for the team.',
        '',
        'I approached this the way I\'d work if I were already on the team.',
        '',
        'The build log is written, the decisions are documented,',
        'the engine is reusable by anyone who reads the docs.',
        '',
        'I wanted this to feel like something a teammate handed over —',
        'not a portfolio piece.',
        '',
        'That\'s the kind of contributor I want to be at Mal."',
      ]),
      spacer(360),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new ExternalHyperlink({
          link: 'https://mal-approval-engine.vercel.app/',
          children: [new TextRun({ text: 'mal-approval-engine.vercel.app', font: 'Arial', size: 24, bold: true, color: PURPLE, underline: {} })],
        })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: 'employee@test.com  ·  manager@test.com  ·  admin@test.com  ·  Test1234!', font: 'Arial', size: 20, color: GRAY })],
      }),
    ],
  }],
})

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('mal-approval-engine-presentation.docx', buffer)
  console.log('Done: mal-approval-engine-presentation.docx')
})
