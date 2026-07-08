export type ContactInput = {
  full_name: string;
  job_title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
};

function clean(value?: string) {
  return value?.trim() ?? "";
}

function escapeVcard(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function normalizeContact(input: ContactInput): ContactInput {
  return {
    full_name: clean(input.full_name),
    job_title: clean(input.job_title),
    company: clean(input.company),
    email: clean(input.email),
    phone: clean(input.phone),
    website: clean(input.website),
    address: clean(input.address),
  };
}

export function buildVcard(input: ContactInput) {
  const contact = normalizeContact(input);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcard(contact.full_name)}`,
  ];

  if (contact.company || contact.job_title) {
    lines.push(`ORG:${escapeVcard(contact.company ?? "")}`);
    lines.push(`TITLE:${escapeVcard(contact.job_title ?? "")}`);
  }
  if (contact.email) lines.push(`EMAIL:${escapeVcard(contact.email)}`);
  if (contact.phone) lines.push(`TEL:${escapeVcard(contact.phone)}`);
  if (contact.website) lines.push(`URL:${escapeVcard(contact.website)}`);
  if (contact.address) lines.push(`ADR:;;${escapeVcard(contact.address)};;;;`);

  lines.push("END:VCARD");
  return lines.join("\n");
}

export function buildDesignPrompt(contact: ContactInput) {
  const normalized = normalizeContact(contact);
  const elements = [
    normalized.full_name,
    normalized.job_title,
    normalized.company,
    normalized.email,
    normalized.phone,
    normalized.website,
  ].filter(Boolean);

  return `Premium minimalist metal business card design with a refined green sustainability accent, brushed metal texture, generous QR code space, and crisp typography. Include these text elements: ${elements.join(", ")}. Avoid mockup hands, clutter, and extra readable text.`;
}

export function fallbackDesignSvg(prompt: string, attempt: number) {
  const accent = ["#2f8f5b", "#0f766e", "#6aa84f", "#1f7a4d", "#3d9970"][
    (attempt - 1) % 5
  ];
  const encodedPrompt = prompt.slice(0, 180).replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720"><rect width="1200" height="720" rx="36" fill="#111318"/><rect x="54" y="54" width="1092" height="612" rx="28" fill="#1d2228" stroke="${accent}" stroke-width="6"/><circle cx="982" cy="184" r="86" fill="${accent}" opacity=".9"/><rect x="104" y="456" width="238" height="138" rx="12" fill="#f6f7f2"/><path d="M120 472h32v32h-32zm48 0h16v16h-16zm48 0h96v16h-96zm-96 48h16v16h-16zm48 0h48v16h-48zm80 0h64v16h-64zm-128 48h96v16h-96zm128 0h32v16h-32z" fill="#111318"/><text x="104" y="168" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#f6f7f2">Green Biz Card</text><text x="104" y="228" font-family="Arial, sans-serif" font-size="28" fill="${accent}">AI concept ${attempt}</text><text x="104" y="332" font-family="Arial, sans-serif" font-size="24" fill="#cdd3ca">${encodedPrompt}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
