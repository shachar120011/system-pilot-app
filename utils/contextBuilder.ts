import { businessLicensingGuidelines, systemManuals, commonFAQs } from '../data/knowledgeBase';
import { StorageService } from '../services/storageService';

export function buildSystemContext(): string {
  let combinedContext = "### מידע מתוך נהלי רישוי עסקים רשמיים:\n" + businessLicensingGuidelines + "\n\n";

  combinedContext += "### מידע מתוך מדריכי המערכת למשתמש:\n";
  systemManuals.forEach(manual => {
    combinedContext += `נושא: ${manual.title}\nפירוט: ${manual.content}\n\n`;
  });

  combinedContext += "### שאלות ותשובות נפוצות (FAQ):\n" + commonFAQs + "\n\n";

  // ---> התוספת החדשה והחכמה: שאיבת הידע הדינאמי שהבוט למד מתקלות! <---
  const dynamicKnowledge = StorageService.getKnowledgeBase();
  if (dynamicKnowledge && dynamicKnowledge.length > 0) {
     combinedContext += "### ידע עדכני שנלמד מפתרון תקלות עבר ומסמכים שהועלו למערכת:\n";
     dynamicKnowledge.forEach(item => {
        combinedContext += `נושא/תקלה: ${item.title}\nפתרון: ${item.content}\n\n`;
     });
  }

  return combinedContext;
}
