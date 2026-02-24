// src/utils/contextBuilder.ts
import { businessLicensingGuidelines, systemManuals, commonFAQs } from '../data/knowledgeBase';

export function buildSystemContext(): string {
  let combinedContext = "### מידע מתוך נהלי רישוי עסקים רשמיים:\n";
  combinedContext += businessLicensingGuidelines + "\n\n";

  combinedContext += "### מידע מתוך מדריכי המערכת למשתמש:\n";
  systemManuals.forEach(manual => {
    combinedContext += `נושא: ${manual.title}\nפירוט: ${manual.content}\n\n`;
  });

  combinedContext += "### שאלות ותשובות נפוצות (FAQ):\n";
  combinedContext += commonFAQs + "\n\n";

  return combinedContext;
}
