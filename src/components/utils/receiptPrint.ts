export type ReceiptBadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface ReceiptBadge {
  label: string;
  tone?: ReceiptBadgeTone;
}

export interface ReceiptField {
  label: string;
  value?: string | null;
  wide?: boolean;
  multiline?: boolean;
}

export interface ReceiptSection {
  title: string;
  fields?: ReceiptField[];
  note?: string | null;
}

export interface ReceiptAmount {
  label: string;
  value?: string | null;
  helper?: string | null;
}

export interface ReceiptTemplateOptions {
  documentTitle: string;
  serviceLine: string;
  receiptLabel: string;
  code: string;
  issuedOn: string;
  codeLabel?: string;
  issuedLabel?: string;
  badges?: ReceiptBadge[];
  amount?: ReceiptAmount | null;
  sections: ReceiptSection[];
  footerTitle?: string;
  footerNote?: string;
  signatureLabels?: string[];
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const hasValue = (value?: string | null): value is string => {
  if (value === null || value === undefined) {
    return false;
  }

  return value.trim().length > 0;
};

const toToneClass = (tone: ReceiptBadgeTone = "neutral"): string => `badge--${tone}`;

const renderBadges = (badges?: ReceiptBadge[]): string => {
  const visibleBadges = (badges ?? []).filter((badge) => hasValue(badge.label));
  if (!visibleBadges.length) {
    return "";
  }

  return `
    <div class="receipt-badges">
      ${visibleBadges
        .map(
          (badge) =>
            `<span class="receipt-badge ${toToneClass(badge.tone)}">${escapeHtml(
              badge.label.trim(),
            )}</span>`,
        )
        .join("")}
    </div>
  `;
};

const renderAmount = (amount?: ReceiptAmount | null): string => {
  if (!amount || !hasValue(amount.value)) {
    return "";
  }

  return `
    <section class="amount-card">
      <div class="amount-label">${escapeHtml(amount.label)}</div>
      <div class="amount-value">${escapeHtml(amount.value.trim())}</div>
      ${
        hasValue(amount.helper)
          ? `<div class="amount-helper">${escapeHtml(amount.helper.trim())}</div>`
          : ""
      }
    </section>
  `;
};

const renderField = (field: ReceiptField): string => {
  if (!hasValue(field.value)) {
    return "";
  }

  const classes = ["receipt-field"];
  if (field.wide) {
    classes.push("receipt-field--wide");
  }
  if (field.multiline) {
    classes.push("receipt-field--multiline");
  }

  return `
    <article class="${classes.join(" ")}">
      <div class="field-label">${escapeHtml(field.label)}</div>
      <div class="field-value">${escapeHtml(field.value.trim())}</div>
    </article>
  `;
};

const renderSection = (section: ReceiptSection): string => {
  const fieldsHtml = (section.fields ?? [])
    .map((field) => renderField(field))
    .filter(Boolean)
    .join("");

  const noteHtml = hasValue(section.note)
    ? `
      <article class="receipt-field receipt-field--wide receipt-field--multiline">
        <div class="field-label">Notes</div>
        <div class="field-value">${escapeHtml(section.note.trim())}</div>
      </article>
    `
    : "";

  if (!fieldsHtml && !noteHtml) {
    return "";
  }

  return `
    <section class="receipt-section">
      <div class="section-title">${escapeHtml(section.title)}</div>
      <div class="section-grid">
        ${fieldsHtml}
        ${noteHtml}
      </div>
    </section>
  `;
};

const renderSignatures = (signatureLabels?: string[]): string => {
  const labels = (signatureLabels ?? []).filter((label) => hasValue(label));
  if (!labels.length) {
    return "";
  }

  return `
    <section class="signature-grid">
      ${labels
        .map(
          (label) => `
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">${escapeHtml(label.trim())}</div>
            </div>
          `,
        )
        .join("")}
    </section>
  `;
};

export const formatReceiptLabel = (value?: string | null): string => {
  if (!hasValue(value)) {
    return "";
  }

  return value
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const badgeToneForStatus = (value?: string | null): ReceiptBadgeTone => {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, "_");

  if (!normalized) {
    return "neutral";
  }

  if (
    [
      "completed",
      "paid",
      "active",
      "success",
      "done",
      "closed",
      "resolved",
      "in_warranty",
    ].includes(normalized)
  ) {
    return "success";
  }

  if (
    [
      "in_progress",
      "assigned",
      "ongoing",
      "processing",
      "under_service",
      "under_repair",
    ].includes(normalized)
  ) {
    return "info";
  }

  if (
    [
      "pending",
      "awaiting_parts",
      "awaiting_payment",
      "extended_warranty",
      "scheduled",
    ].includes(normalized)
  ) {
    return "warning";
  }

  if (
    [
      "cancelled",
      "failed",
      "expired",
      "out_of_warranty",
      "rejected",
      "unpaid",
    ].includes(normalized)
  ) {
    return "danger";
  }

  return "neutral";
};

export const buildPrintReceiptHtml = ({
  documentTitle,
  serviceLine,
  receiptLabel,
  code,
  issuedOn,
  codeLabel = "Reference",
  issuedLabel = "Issued On",
  badges,
  amount,
  sections,
  footerTitle = "Thank you for choosing Sun Water Service.",
  footerNote = "Computer-generated receipt. Valid without a handwritten signature.",
  signatureLabels = ["Customer", "Authorized By"],
}: ReceiptTemplateOptions): string => {
  const sectionsHtml = sections
    .map((section) => renderSection(section))
    .filter(Boolean)
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(documentTitle)}</title>
        <style>
          :root {
            color-scheme: light;
            --receipt-ink: #17362d;
            --receipt-text: #243630;
            --receipt-muted: #5b6f68;
            --receipt-line: #d6e3dd;
            --receipt-soft: #f4f7f2;
            --receipt-soft-2: #f7efe1;
            --receipt-paper: #ffffff;
            --receipt-accent: #1f7a63;
            --receipt-accent-deep: #153f34;
            --receipt-accent-soft: #e7f3ee;
            --receipt-gold: #d7b46a;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
          }

          body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            --receipt-print-scale: 1;
            color: var(--receipt-text);
            background:
              radial-gradient(circle at top, rgba(231, 243, 238, 0.95), transparent 48%),
              linear-gradient(180deg, #f6fbf8 0%, #fbf7ef 52%, #ffffff 100%);
            padding: 18px;
          }

          .receipt-shell {
            max-width: 760px;
            margin: 0 auto;
          }

          .receipt-card {
            background: var(--receipt-paper);
            border: 1px solid var(--receipt-line);
            border-radius: 30px;
            overflow: hidden;
            box-shadow: 0 28px 70px rgba(21, 63, 52, 0.14);
          }

          .receipt-hero {
            position: relative;
            padding: 20px 24px 18px;
            color: #ffffff;
            background:
              radial-gradient(circle at top right, rgba(255, 255, 255, 0.14), transparent 34%),
              linear-gradient(135deg, var(--receipt-accent-deep) 0%, var(--receipt-accent) 62%, #2d9277 100%);
          }

          .receipt-hero::after {
            content: "";
            position: absolute;
            inset: auto -110px -120px auto;
            width: 280px;
            height: 280px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 65%);
            pointer-events: none;
          }

          .hero-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            position: relative;
            z-index: 1;
          }

          .brand-lockup {
            display: flex;
            align-items: center;
            gap: 16px;
            min-width: 0;
          }

          .brand-mark {
            width: 58px;
            height: 58px;
            border-radius: 18px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #f5d799 0%, #fff3d1 100%);
            color: var(--receipt-accent-deep);
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: 0.18em;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
          }

          .brand-copy {
            min-width: 0;
          }

          .brand-name {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 1.7rem;
            font-weight: 700;
            letter-spacing: 0.04em;
          }

          .brand-line {
            margin: 6px 0 0;
            font-size: 0.88rem;
            color: rgba(255, 255, 255, 0.84);
          }

          .receipt-label {
            display: inline-flex;
            align-items: center;
            padding: 8px 14px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.22);
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(6px);
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .hero-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
            margin-top: 16px;
            position: relative;
            z-index: 1;
          }

          .meta-card {
            padding: 11px 13px;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.18);
          }

          .meta-label {
            font-size: 0.73rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.72);
          }

          .meta-value {
            margin-top: 4px;
            font-size: 0.92rem;
            font-weight: 700;
            word-break: break-word;
          }

          .receipt-content {
            padding: 16px 20px 18px;
          }

          .receipt-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .receipt-badge {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 6px 10px;
            border: 1px solid transparent;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.03em;
          }

          .badge--neutral {
            color: #51625d;
            background: #eef2f0;
            border-color: #d6e0dc;
          }

          .badge--success {
            color: #11583f;
            background: #e8f6ee;
            border-color: #bee4cf;
          }

          .badge--warning {
            color: #8b5a12;
            background: #fff6df;
            border-color: #f1dcac;
          }

          .badge--danger {
            color: #8e2d31;
            background: #fdeaea;
            border-color: #f2c2c4;
          }

          .badge--info {
            color: #1d5f7a;
            background: #e8f4fb;
            border-color: #bfdced;
          }

          .amount-card {
            margin-top: 12px;
            padding: 14px 16px;
            border-radius: 18px;
            border: 1px solid #d7e5df;
            background: linear-gradient(135deg, var(--receipt-accent-soft) 0%, #fffaf1 100%);
            break-inside: avoid;
          }

          .amount-label {
            font-size: 0.72rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--receipt-muted);
          }

          .amount-value {
            margin-top: 7px;
            color: var(--receipt-ink);
            font-size: 1.5rem;
            line-height: 1.1;
            font-weight: 800;
          }

          .amount-helper {
            margin-top: 6px;
            color: var(--receipt-muted);
            font-size: 0.82rem;
          }

          .section-stack {
            display: grid;
            gap: 10px;
            margin-top: 12px;
          }

          .receipt-section {
            border: 1px solid var(--receipt-line);
            border-radius: 18px;
            background: linear-gradient(180deg, #ffffff 0%, #fbfcfb 100%);
            padding: 12px;
            break-inside: avoid;
          }

          .section-title {
            margin-bottom: 10px;
            color: var(--receipt-muted);
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.13em;
            text-transform: uppercase;
          }

          .section-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .receipt-field {
            padding: 9px 10px;
            border-radius: 12px;
            border: 1px solid #e6ece8;
            background: linear-gradient(180deg, var(--receipt-soft) 0%, #ffffff 100%);
            min-width: 0;
          }

          .receipt-field--wide {
            grid-column: 1 / -1;
          }

          .receipt-field--multiline .field-value {
            white-space: pre-wrap;
          }

          .field-label {
            color: var(--receipt-muted);
            font-size: 0.64rem;
            font-weight: 700;
            letter-spacing: 0.11em;
            text-transform: uppercase;
          }

          .field-value {
            margin-top: 4px;
            color: var(--receipt-ink);
            font-size: 0.84rem;
            font-weight: 600;
            line-height: 1.35;
            word-break: break-word;
          }

          .receipt-footer {
            display: grid;
            grid-template-columns: 1.35fr 1fr;
            gap: 12px;
            align-items: end;
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px dashed var(--receipt-line);
          }

          .footer-title {
            margin: 0;
            color: var(--receipt-ink);
            font-family: Georgia, "Times New Roman", serif;
            font-size: 1rem;
            font-weight: 700;
          }

          .footer-note {
            margin: 5px 0 0;
            color: var(--receipt-muted);
            font-size: 0.78rem;
            line-height: 1.4;
          }

          .footer-badge {
            justify-self: end;
            padding: 9px 12px;
            border-radius: 14px;
            border: 1px solid #ead7a9;
            background: linear-gradient(135deg, #fff8e7 0%, #fcf0cf 100%);
            color: #7a5b22;
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            text-align: center;
          }

          .signature-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 14px;
          }

          .signature-block {
            padding-top: 16px;
          }

          .signature-line {
            border-top: 1px solid #bfcfc8;
          }

          .signature-label {
            margin-top: 6px;
            color: var(--receipt-muted);
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.05em;
          }

          @media (max-width: 640px) {
            body {
              padding: 14px;
            }

            .receipt-hero,
            .receipt-content {
              padding-left: 18px;
              padding-right: 18px;
            }

            .hero-top,
            .receipt-footer {
              grid-template-columns: 1fr;
              display: grid;
            }

            .brand-lockup {
              align-items: flex-start;
            }

            .brand-name {
              font-size: 1.7rem;
            }

            .section-grid,
            .signature-grid {
              grid-template-columns: 1fr;
            }

            .footer-badge {
              justify-self: stretch;
            }
          }

          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          @media print {
            body {
              padding: 0;
              zoom: var(--receipt-print-scale);
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .receipt-shell {
              max-width: none;
            }

            .receipt-card {
              border-radius: 0;
              border-color: #d6e3dd;
              box-shadow: none;
            }

            .receipt-hero {
              padding: 14px 16px 12px;
            }

            .receipt-content {
              padding: 12px 14px 14px;
            }

            .receipt-section {
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-shell">
          <main class="receipt-card">
            <header class="receipt-hero">
              <div class="hero-top">
                <div class="brand-lockup">
                  <div class="brand-mark">SO</div>
                  <div class="brand-copy">
                    <h1 class="brand-name">Sun Water Service</h1>
                    <p class="brand-line">${escapeHtml(serviceLine)}</p>
                  </div>
                </div>
                <div class="receipt-label">${escapeHtml(receiptLabel)}</div>
              </div>
              <div class="hero-meta">
                <div class="meta-card">
                  <div class="meta-label">${escapeHtml(codeLabel)}</div>
                  <div class="meta-value">${escapeHtml(code)}</div>
                </div>
                <div class="meta-card">
                  <div class="meta-label">${escapeHtml(issuedLabel)}</div>
                  <div class="meta-value">${escapeHtml(issuedOn)}</div>
                </div>
              </div>
            </header>
            <section class="receipt-content">
              ${renderBadges(badges)}
              ${renderAmount(amount)}
              <div class="section-stack">
                ${sectionsHtml}
              </div>
              ${renderSignatures(signatureLabels)}
              <footer class="receipt-footer">
                <div>
                  <p class="footer-title">${escapeHtml(footerTitle)}</p>
                  <p class="footer-note">${escapeHtml(footerNote)}</p>
                </div>
                <div class="footer-badge">Sun Water Service Copy</div>
              </footer>
            </section>
          </main>
        </div>
      </body>
    </html>
  `;
};

export const openPrintReceipt = (options: ReceiptTemplateOptions): boolean => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.border = "0";

  document.body.appendChild(iframe);

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove();
    }, 250);
  };

  const printWindow = iframe.contentWindow;
  const printDocument = printWindow?.document;

  if (!printWindow || !printDocument) {
    iframe.remove();
    return false;
  }

  printWindow.onafterprint = cleanup;
  printDocument.open();
  printDocument.write(buildPrintReceiptHtml(options));
  printDocument.close();

  const fitReceiptToPage = () => {
    const receiptCard = printDocument.querySelector(".receipt-card") as HTMLElement | null;
    const printBody = printDocument.body;

    if (!receiptCard || !printBody) {
      return;
    }

    const pxPerMm = 96 / 25.4;
    const pageWidth = 210 * pxPerMm;
    const pageHeight = 297 * pxPerMm;
    const pageMargins = 16 * pxPerMm;
    const availableWidth = pageWidth - pageMargins;
    const availableHeight = pageHeight - pageMargins;
    const widthScale = availableWidth / receiptCard.scrollWidth;
    const heightScale = availableHeight / receiptCard.scrollHeight;
    const printScale = Math.min(1, widthScale, heightScale);

    printBody.style.setProperty("--receipt-print-scale", `${Math.max(printScale, 0.68)}`);
  };

  window.setTimeout(() => {
    try {
      fitReceiptToPage();
      printWindow.focus();
      printWindow.print();
    } finally {
      window.setTimeout(cleanup, 1500);
    }
  }, 320);

  return true;
};
