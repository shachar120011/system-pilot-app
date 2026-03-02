import { supabase } from './supabaseClient';
import { Issue, KnowledgeItem, UserQuery } from '../types';

export const StorageService = {
  // --- ניהול תקלות (Issues) ---
  getIssues: async (): Promise<Issue[]> => {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    
    return data.map(item => ({
      id: item.id,
      createdAt: new Date(item.created_at).getTime(),
      username: item.username || 'אנונימי',
      userRole: item.department || '', 
      summary: item.summary || item.category || 'תקלה',
      description: item.description || '',
      category: item.category || 'אחר',
      priority: item.priority || 'בינונית',
      status: item.status || 'open',
      treatmentNotes: item.treatment_notes || '',
      closedAt: item.closed_at ? new Date(item.closed_at).getTime() : undefined,
      // משיכת הקבצים מהענן!
      attachments: item.attachments || [] 
    }));
  },

  saveIssue: async (issue: Issue): Promise<boolean> => {
    const { error } = await supabase.from('issues').insert([{
      username: issue.username,
      department: issue.userRole,
      summary: issue.summary,
      description: issue.description,
      category: issue.category,
      priority: issue.priority,
      status: 'open',
      // שליחת הקבצים לענן!
      attachments: issue.attachments 
    }]);
    return !error;
  },

  updateIssue: async (updatedIssue: Issue): Promise<boolean> => {
    const { error } = await supabase
      .from('issues')
      .update({
        status: updatedIssue.status,
        treatment_notes: updatedIssue.treatmentNotes,
        category: updatedIssue.category,
        priority: updatedIssue.priority,
        summary: updatedIssue.summary,
        closed_at: updatedIssue.closedAt ? new Date(updatedIssue.closedAt).toISOString() : null
      })
      .eq('id', updatedIssue.id);
    return !error;
  },

  // --- ניהול מאגר ידע ---
  getKnowledgeBase: async (): Promise<KnowledgeItem[]> => {
    const { data, error } = await supabase
      .from('knowledge')
      .select('*')
      .order('created_at', { ascending: false });
    return error ? [] : data.map(item => ({
      id: item.id,
      createdAt: new Date(item.created_at).getTime(),
      title: item.title,
      content: item.content,
      sourceType: item.source_type
    }));
  },

  getFullContextText: async (): Promise<string> => {
    const { data, error } = await supabase.from('knowledge').select('title, content');
    if (error || !data) return "";
    return data.map(item => `נושא: ${item.title}\nתוכן: ${item.content}`).join('\n\n---\n\n');
  },

  saveKnowledgeItem: async (item: KnowledgeItem): Promise<boolean> => {
    const { error } = await supabase.from('knowledge').insert([{
      title: item.title,
      content: item.content,
      source_type: item.sourceType
    }]);
    return !error;
  },

  // --- ניהול יומן שאלות ---
  getQueries: async (): Promise<UserQuery[]> => {
    const { data, error } = await supabase.from('chat_logs').select('*').order('created_at', { ascending: false });
    return error ? [] : data.map(item => ({
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
