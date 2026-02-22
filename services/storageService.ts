import { Issue, KnowledgeItem, IssuePriority, IssueCategory, UserQuery } from '../types';

const ISSUES_KEY = 'system_pilot_issues';
const KNOWLEDGE_KEY = 'system_pilot_knowledge';
const QUERIES_KEY = 'system_pilot_queries';

// Initial Mock Data to populate if empty
const MOCK_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: '1',
    title: 'מדריך התחברות ראשונית',
    content: 'כדי להתחבר למערכת יש להזין את מספר העובד ולאחר מכן את הסיסמה הזמנית שנשלחה ב-SMS. לאחר ההתחברות הראשונה תתבקש להחליף סיסמה.',
    createdAt: Date.now()
  },
  {
    id: '2',
    title: 'הפקת דוחות חודשיים',
    content: 'במסך הראשי, יש ללחוץ על לשונית "דוחות", לבחור את טווח התאריכים הרצוי וללחוץ על כפתור "ייצא לאקסל".',
    createdAt: Date.now()
  }
];

// Initial Mock Issues with User Data
const MOCK_ISSUES: Issue[] = [
  {
    id: '101',
    description: 'לא מצליח להתחבר למערכת מהבית, מקבל שגיאה 403',
    summary: 'שגיאת התחברות 403 מהבית',
    priority: IssuePriority.HIGH,
    category: IssueCategory.BUG,
    status: 'open',
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
    username: 'ישראל ישראלי',
    userRole: 'מנהל חשבונות',
    treatmentNotes: ''
  },
  {
    id: '102',
    description: 'איך אני מוסיף עובד חדש למערכת? הכפתור לא מגיב',
    summary: 'כפתור הוספת עובד לא מגיב',
    priority: IssuePriority.MEDIUM,
    category: IssueCategory.UI_UX,
    status: 'in_progress',
    createdAt: Date.now() - 86400000 * 5, // 5 days ago
    username: 'דנה כהן',
    userRole: 'משאבי אנוש',
    treatmentNotes: 'בבדיקה מול צוות הפיתוח'
  },
  {
    id: '103',
    description: "הדוחות יוצאים בג'יבריש כשאני מייצא ל-PDF",
    summary: "דוחות PDF בג'יבריש",
    priority: IssuePriority.CRITICAL,
    category: IssueCategory.DATA,
    status: 'closed',
    createdAt: Date.now() - 86400000 * 7,
    username: 'אבי לוי',
    userRole: 'מנהל תפעול',
    treatmentNotes: 'הותקן פונט עברית בשרת, הבעיה נפתרה'
  }
];

const MOCK_QUERIES: UserQuery[] = [
    {
        id: 'q1',
        username: 'ישראל ישראלי',
        department: 'הנהלת חשבונות',
        question: 'איך אני מחליף סיסמה?',
        answer: 'כדי להחליף סיסמה יש ללחוץ על תמונת הפרופיל בפינה השמאלית...',
        timestamp: Date.now() - 86400000 * 1,
        isAnswered: true
    },
    {
        id: 'q2',
        username: 'דנה כהן',
        department: 'משאבי אנוש',
        question: 'איפה נמצא כפתור הדוחות?',
        answer: 'כפתור הדוחות נמצא בתפריט העליון...',
        timestamp: Date.now() - 86400000 * 3,
        isAnswered: true
    },
    {
        id: 'q3',
        username: 'רוני אלון',
        department: 'מכירות',
        question: 'אני לא מצליח לשנות סיסמה',
        answer: 'אנא וודא שהסיסמה החדשה מכילה 8 תווים...',
        timestamp: Date.now() - 86400000 * 4,
        isAnswered: true
    },
    {
        id: 'q4',
        username: 'אבי לוי',
        department: 'תפעול',
        question: 'איך משחזרים סיסמה?',
        answer: 'יש ללחוץ על "שכחתי סיסמה" במסך הכניסה.',
        timestamp: Date.now() - 3600000,
        isAnswered: true
    }
];

export const StorageService = {
  getIssues: (): Issue[] => {
    const data = localStorage.getItem(ISSUES_KEY);
    if (!data) {
        localStorage.setItem(ISSUES_KEY, JSON.stringify(MOCK_ISSUES));
        return MOCK_ISSUES;
    }
    return JSON.parse(data);
  },

  saveIssue: (issue: Issue): void => {
    const issues = StorageService.getIssues();
    const updatedIssues = [issue, ...issues];
    localStorage.setItem(ISSUES_KEY, JSON.stringify(updatedIssues));
  },

  updateIssueStatus: (id: string, status: Issue['status']): void => {
    const issues = StorageService.getIssues();
    const updated = issues.map(i => i.id === id ? { ...i, status } : i);
    localStorage.setItem(ISSUES_KEY, JSON.stringify(updated));
  },

  updateIssue: (updatedIssue: Issue): void => {
    const issues = StorageService.getIssues();
    const updated = issues.map(i => i.id === updatedIssue.id ? updatedIssue : i);
    localStorage.setItem(ISSUES_KEY, JSON.stringify(updated));
  },

  getKnowledgeBase: (): KnowledgeItem[] => {
    const data = localStorage.getItem(KNOWLEDGE_KEY);
    if (!data) {
      localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(MOCK_KNOWLEDGE));
      return MOCK_KNOWLEDGE;
    }
    return JSON.parse(data);
  },

  saveKnowledgeItem: (item: KnowledgeItem): void => {
    const items = StorageService.getKnowledgeBase();
    const updatedItems = [item, ...items];
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(updatedItems));
  },

  // Queries Methods
  getQueries: (): UserQuery[] => {
      const data = localStorage.getItem(QUERIES_KEY);
      if (!data) {
          localStorage.setItem(QUERIES_KEY, JSON.stringify(MOCK_QUERIES));
          return MOCK_QUERIES;
      }
      return JSON.parse(data);
  },

  saveQuery: (query: UserQuery): void => {
      const queries = StorageService.getQueries();
      const updatedQueries = [query, ...queries];
      localStorage.setItem(QUERIES_KEY, JSON.stringify(updatedQueries));
  },

  // Helper to get full context for AI
  getFullContextText: (): string => {
    const items = StorageService.getKnowledgeBase();
    return items.map(item => `נושא: ${item.title}\nתוכן: ${item.content}`).join('\n\n');
  }
};