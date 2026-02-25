import { Issue, KnowledgeItem, IssuePriority, IssueCategory, UserQuery } from '../types';

const ISSUES_KEY = 'system_pilot_issues';
const KNOWLEDGE_KEY = 'system_pilot_knowledge';
const QUERIES_KEY = 'system_pilot_queries';

export const StorageService = {
  getIssues: (): Issue[] => {
    const data = localStorage.getItem(ISSUES_KEY);
    return data ? JSON.parse(data) : [];
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
    return data ? JSON.parse(data) : [];
  },

  saveKnowledgeItem: (item: KnowledgeItem): void => {
    const items = StorageService.getKnowledgeBase();
    const updatedItems = [item, ...items];
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(updatedItems));
  },

  // Queries Methods
  getQueries: (): UserQuery[] => {
      const data = localStorage.getItem(QUERIES_KEY);
      return data ? JSON.parse(data) : [];
  },

  saveQuery: (query: UserQuery): void => {
      const queries = StorageService.getQueries();
      const updatedQueries = [query, ...queries];
      localStorage.setItem(QUERIES_KEY, JSON.stringify(updatedQueries));
  },

  // Helper to get full context for AI
  getFullContextText: (): string => {
    const items = StorageService.getKnowledgeBase();
    if (!items || items.length === 0) return "אין מידע במאגר כרגע.";
    return items.map(item => `נושא: ${item.title}\nתוכן: ${item.content}`).join('\n\n');
  }
};
