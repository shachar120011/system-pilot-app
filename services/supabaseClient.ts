import { supabase } from './supabaseClient';
import { Issue, KnowledgeItem, UserQuery } from '../types';

export const StorageService = {
  // --- ניהול תקלות (Issues) ---
  getIssues: async (): Promise<Issue[]> => {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching issues:", error);
      return [];
    }
    
    // מיפוי השדות מהדאטה-בייס לסוג הנתונים באפליקציה
    return data.map(item => ({
      id: item.id,
      createdAt: new Date(item.created_at).getTime(),
      username: item.username,
      userRole: item.department, // מחלקה
      description: item.description,
      category: item.category,
      priority: item.priority,
      status: item.status,
      treatmentNotes: item.treatment_notes,
      closedAt: item.closed_at ? new Date(item.closed_at).getTime() : undefined,
      attachments: [] // טיפול בקבצים נעשה בשלב הבא
    }));
  },

  saveIssue: async (issue: Issue): Promise<boolean> => {
    const { error } = await supabase.from('issues').insert([{
      username: issue.username,
      department: issue.userRole,
      description: issue.description,
      category: issue.category,
      priority: issue.priority,
      status: issue.status
    }]);

    if (error) {
      console.error("Error saving issue:", error);
      return false;
    }
    return true;
  },

  updateIssue: async (updatedIssue: Issue): Promise<boolean> => {
    const { error } = await supabase
      .from('issues')
      .update({
        status: updatedIssue.status,
        treatment_notes: updatedIssue.treatmentNotes,
        category: updatedIssue.category,
        priority: updatedIssue.priority,
        closed_at: updatedIssue.closedAt ? new Date(updatedIssue.closedAt).toISOString() : null
      })
      .eq('id', updatedIssue.id);

    if (error) {
      console.error("Error updating issue:", error);
      return false;
    }
    return true;
  },

  // --- ניהול מאגר ידע (Knowledge Base) ---
  getKnowledgeBase: async (): Promise<KnowledgeItem[]> => {
    const { data, error } = await supabase
      .from('knowledge')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    
    return data.map(item => ({
      id: item.id,
      createdAt: new Date(item.created_at).getTime(),
      title: item.title,
      content: item.content,
      sourceType: item.source_type
    }));
  },

  saveKnowledgeItem: async (item: KnowledgeItem): Promise<boolean> => {
    const { error } = await supabase.from('knowledge').insert([{
      title: item.title,
      content: item.content,
      source_type: item.sourceType
    }]);
    return !error;
  },

  // --- ניהול יומן שאלות (Chat Logs) ---
  getQueries: async (): Promise<UserQuery[]> => {
    const { data, error } = await supabase
      .from('chat_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];

    return data.map(item => ({
      id: item.id,
      timestamp: new Date(item.created_at).getTime(),
      username: item.username,
      department: item.department,
      question: item.question,
      answer: item.answer,
      isAnswered: true
    }));
  },

  saveQuery: async (query: UserQuery): Promise<boolean> => {
    const { error } = await supabase.from('chat_logs').insert([{
      username: query.username,
      department: query.department,
      question: query.question,
      answer: query.answer
    }]);
    return !error;
  }
};
