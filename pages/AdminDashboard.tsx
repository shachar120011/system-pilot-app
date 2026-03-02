import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Upload, Plus, FileText, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2, FileUp, FileJson, Loader2, Save, MessageSquare, TrendingUp, HelpCircle, Download, Filter, ArrowUpDown, Users, Bell, Search, LayoutList, Activity, Paperclip, Lock, UserCog, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Issue, KnowledgeItem, IssuePriority, IssueCategory, UserQuery, QueryTrend, Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwfIFA_uSeLGUU5WPyhU5kDCSIGmFGBnKy8co6dAN_t4PEM8ttygaJtT5eu3IjLM3XY/exec";

interface AdminDashboardProps {
  activeView: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeView }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [queries, setQueries] = useState<UserQuery[]>([]);
  const [queryTrends, setQueryTrends] = useState<QueryTrend[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');

  const [dashboardTab, setDashboardTab] = useState<'overview' | 'tasks' | 'users'>('overview');

  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States לעריכת תקלות כולל קטגוריה ודחיפות
  const [editingIssue, setEditingIssue] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<Issue['status']>('open');
  const [editCategory, setEditCategory] = useState<IssueCategory>(IssueCategory.OTHER);
  const [editPriority, setEditPriority] = useState<IssuePriority>(IssuePriority.MEDIUM);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'open_first'>('newest');

  const [queryFilterStatus, setQueryFilterStatus] = useState<string>('all');
  const [queryFilterUser, setQueryFilterUser] = useState<string>('');
  const [queryFilterDate, setQueryFilterDate] = useState<string>('');
  const [querySortOption, setQuerySortOption] = useState<'newest' | 'oldest' | 'unanswered_first'>('newest');

  useEffect(() => {
    if (isAuthenticated) {
        loadData();
    }
  }, [activeView, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (adminPassword === '1602') {
          setIsAuthenticated(true);
          setAuthError(false);
      } else {
          setAuthError(true);
      }
  };

  const loadData = async () => {
    setLoading(true);
    let loadedIssues = StorageService.getIssues();
    let loadedQueries = StorageService.getQueries();
    
    try {
      const response = await fetch(APPS_SCRIPT_URL);
      const result = await response.json();
      
      if (result.status === "success") {
        if (result.issues && result.issues.length > 0) {
          const localIssuesMap = new Map(loadedIssues.map(i => [i.id, i]));
          let hasNewIssues = false;
          result.issues.forEach((row: any) => {
            if (!localIssuesMap.has(row.id)) {
              loadedIssues.push({
                id: row.id,
                createdAt: new Date(row.timestamp).getTime() || Date.now(),
                username: row.username || '',
                userRole: row.userRole || '',
                category: row.category as IssueCategory || IssueCategory.OTHER,
                priority: row.priority as IssuePriority || IssuePriority.MEDIUM,
                summary: row.summary || '',
                description: row.description || '',
                status: row.status || 'open',
                treatmentNotes: '',
                attachments: [] 
              });
              hasNewIssues = true;
            }
          });
          if (hasNewIssues) {
            loadedIssues.sort((a, b) => b.createdAt - a.createdAt);
            localStorage.setItem('systempilot_issues', JSON.stringify(loadedIssues));
          }
        }

        if (result.queries && result.queries.length > 0) {
          loadedQueries = result.queries.map((row: any) => ({
            id: uuidv4(),
            timestamp: new Date(row.timestamp).getTime() || Date.now(),
            username: row.username || '',
            department: row.department || '',
            question: row.question || '',
            answer: row.answer || '',
            isAnswered: true
          })).reverse();
        }

        if (result.knowledge && result.knowledge.length > 0) {
            const syncedKb = result.knowledge.map((row: any, idx: number) => ({
                id: `kb-cloud-${idx}`,
                createdAt: new Date(row.timestamp).getTime() || Date.now(),
                title: row.title || '',
                content: row.content || '',
                fileName: row.fileName || '',
                sourceType: row.fileName ? 'file' : 'manual'
            })).reverse();
            setKnowledgeItems(syncedKb);
            localStorage.setItem('systempilot_knowledge', JSON.stringify(syncedKb));
        } else {
            setKnowledgeItems(StorageService.getKnowledgeBase());
        }
      }
    } catch (error) {
      console.error("Fetch GET Error:", error);
      setKnowledgeItems(StorageService.getKnowledgeBase());
    }

    setIssues(loadedIssues);
    setQueries(loadedQueries);
    setLoading(false);
    
    if (activeView === 'dashboard' && loadedIssues.length > 0 && !aiInsight) {
        generateInsight(loadedIssues);
    }
    if (activeView === 'queries' && loadedQueries.length > 0 && queryTrends.length === 0) {
        generateTrends(loadedQueries);
    }
  };

  const generateInsight = async (currentIssues: Issue[]) => {
      const recentIssues = currentIssues.slice(0, 10).map(i => ({ category: i.category, summary: i.summary }));
      const insight = await GeminiService.generateInsights(JSON.stringify(recentIssues));
      setAiInsight(insight);
  }

  const generateTrends = async (currentQueries: UserQuery[]) => {
      setTrendsLoading(true);
      const trends = await GeminiService.analyzeQueryTrends(currentQueries);
      setQueryTrends(trends);
      setTrendsLoading(false);
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingFile(true);
    setUploadedFileName(file.name);
    
    if (!newDocTitle) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.') || file.name;
        setNewDocTitle(nameWithoutExt);
    }

    try {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += `--- עמוד ${i} ---\n${pageText}\n\n`;
            }
            setNewDocContent(fullText);
        } else {
            const text = await file.text();
            setNewDocContent(text);
        }
    } catch (error) {
        console.error("File Reading Error:", error);
        alert("שגיאה בקריאת הקובץ.");
        setUploadedFileName(null);
    } finally {
        setIsReadingFile(false);
    }
  };

  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle || !newDocContent) return;

    const newItem: KnowledgeItem = {
      id: uuidv4(),
      title: newDocTitle,
      content: newDocContent,
      createdAt: Date.now(),
      sourceType: uploadedFileName ? 'file' : 'manual',
      fileName: uploadedFileName || undefined
    };

    StorageService.saveKnowledgeItem(newItem);
    setKnowledgeItems(prev => [newItem, ...prev]);

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ sheet: "Knowledge_Base", data: [new Date().toISOString(), newItem.title, newItem.content, newItem.fileName || ""] })
      });
    } catch (error) {
      console.error("Fetch POST Error:", error);
    }
    
    setNewDocTitle('');
    setNewDocContent('');
    setUploadedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleDeleteKnowledge = (id: string) => {
      setKnowledgeItems(prev => prev.filter(item => item.id !== id));
  };

  // פונקציות העריכה המעודכנות למנהל
  const startEditing = (issue: Issue) => {
      setEditingIssue(issue.id);
      setEditNotes(issue.treatmentNotes || '');
      setEditStatus(issue.status);
      setEditCategory(issue.category);
      setEditPriority(issue.priority);
  };

  const cancelEditing = () => {
      setEditingIssue(null);
      setEditNotes('');
  };

  const saveEdit = async (issue: Issue) => {
      const updatedIssue: Issue = {
          ...issue,
          treatmentNotes: editNotes,
          status: editStatus,
          category: editCategory,
          priority: editPriority
      };
      StorageService.updateIssue(updatedIssue);
      setIssues(prev => prev.map(i => i.id === issue.id ? updatedIssue : i));
      
      if (editStatus === 'closed' && editNotes.trim().length > 5 && issue.status !== 'closed') {
          const newTitle = `פתרון תקלה: ${issue.summary}`;
          const newContent = `**תיאור הבעיה המקורית שדווחה:**\n${issue.description}\n\n**דרך הטיפול והפתרון:**\n${editNotes}`;
          const newItem: KnowledgeItem = { id: uuidv4(), title: newTitle, content: newContent, createdAt: Date.now(), sourceType: 'manual' };
          StorageService.saveKnowledgeItem(newItem);
          setKnowledgeItems(prev => [newItem, ...prev]);
          try {
              await fetch(APPS_SCRIPT_URL, {
                  method: "POST",
                  body: JSON.stringify({ sheet: "Knowledge_Base", data: [new Date().toISOString(), newItem.title, newItem.content, "נלמד אוטומטית"] })
              });
          } catch (error) {
              console.error("Auto-Knowledge Sync Error:", error);
          }
      }
      setEditingIssue(null);
  };

  const downloadAttachment = (attachment: Attachment) => {
      const link = document.createElement("a");
      link.href = attachment.data; link.download = attachment.name;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
        if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
        if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
        if (filterPriority !== 'all' && issue.priority !== filterPriority) return false;
        if (filterUser && !(issue.username || '').includes(filterUser)) return false;
        if (filterDate) {
            const issueDate = new Date(issue.createdAt).setHours(0,0,0,0);
            const filterD = new Date(filterDate).setHours(0,0,0,0);
            if (issueDate !== filterD) return false;
        }
        return true;
    }).sort((a, b) => {
        if (sortOption === 'newest') return b.createdAt - a.createdAt;
        if (sortOption === 'oldest') return a.createdAt - b.createdAt;
        if (sortOption === 'open_first') {
            if (a.status === 'open' && b.status !== 'open') return -1;
            if (a.status !== 'open' && b.status === 'open') return 1;
            return b.createdAt - a.createdAt;
        }
        return 0;
    });
  }, [issues, filterStatus, filterCategory, filterPriority, filterUser, filterDate, sortOption]);

  const filteredQueries = useMemo(() => {
    return queries.filter(q => {
        if (queryFilterStatus === 'answered' && !q.isAnswered) return false;
        if (queryFilterStatus === 'error' && q.isAnswered) return false;
        if (queryFilterUser && !(q.username || '').includes(queryFilterUser)) return false;
        if (queryFilterDate) {
            const queryDate = new Date(q.timestamp).setHours(0,0,0,0);
            const filterD = new Date(queryFilterDate).setHours(0,0,0,0);
            if (queryDate !== filterD) return false;
        }
        return true;
    }).sort((a, b) => {
        if (querySortOption === 'newest') return b.timestamp - a.timestamp;
        if (querySortOption === 'oldest') return a.timestamp - b.timestamp;
        if (querySortOption === 'unanswered_first') {
            if (!a.isAnswered && b.isAnswered) return -1;
            if (a.isAnswered && !b.isAnswered) return 1;
            return b.timestamp - a.timestamp;
        }
        return 0;
    });
  }, [queries, queryFilterStatus, queryFilterUser, queryFilterDate, querySortOption]);

  const exportToExcel = () => {
      const header = ["תאריך", "שם משתמש", "תפקיד", "קטגוריה", "דחיפות", "תקציר", "תיאור", "סטטוס", "הערות טיפול"];
      const rows = filteredIssues.map(i => [
          new Date(i.createdAt).toLocaleDateString('he-IL'), i.username || '', i.userRole || '', i.category, i.priority,
          `"${i.summary.replace(/"/g, '""')}"`, `"${i.description.replace(/"/g, '""')}"`, i.status, `"${(i.treatmentNotes || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = "\uFEFF" + [header, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.setAttribute("href", url); link.setAttribute("download", `system_pilot_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportQueriesToExcel = () => {
      const header = ["תאריך", "שעה", "שם משתמש", "מחלקה", "שאלה", "תשובה", "האם נענה"];
      const rows = filteredQueries.map(q => [
          new Date(q.timestamp).toLocaleDateString('he-IL'), new Date(q.timestamp).toLocaleTimeString('he-IL'), q.username || '', q.department || '',
          `"${q.question.replace(/"/g, '""')}"`, `"${q.answer.replace(/"/g, '""')}"`, q.isAnswered ? 'כן' : 'לא'
      ]);
      const csvContent = "\uFEFF" + [header, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.setAttribute("href", url); link.setAttribute("download", `system_pilot_queries_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const openTasksCount = useMemo(() => issues.filter(i => i.status === 'open').length, [issues]);

  const userStats = useMemo(() => {
      const stats: Record<string, { queries: number, issues: number, department: string }> = {};
      queries.forEach(q => {
          if (!stats[q.username]) stats[q.username] = { queries: 0, issues: 0, department: q.department || '' };
          stats[q.username].queries++;
      });
      issues.forEach(i => {
          const name = i.username || 'אנונימי';
          if (!stats[name]) stats[name] = { queries: 0, issues: 0, department: i.userRole || '' };
          stats[name].issues++;
      });
      return Object.entries(stats).map(([name, data]) => ({ name, ...data, total: data.queries + data.issues })).sort((a, b) => b.total - a.total);
  }, [issues, queries]);

  const categoryData = useMemo(() => {
    const counts = issues.reduce((acc, issue) => { acc[issue.category] = (acc[issue.category] || 0) + 1; return acc; }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const priorityData = useMemo(() => {
     const counts = issues.reduce((acc, issue) => { acc[issue.priority] = (acc[issue.priority] || 0) + 1; return acc; }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

  // --- מחלקות בסיס מותאמות לגדלי מסך ומונעות פדינג מוגזם ---
  const screenWrapperClass = "h-screen w-full overflow-y-auto bg-slate-50 p-3 md:p-6 lg:p-8 animate-fadeIn";
  const containerClass = "max-w-full mx-auto w-full"; // ביטלנו את max-w-1600 כדי לתת רוחב מלא

  if (!isAuthenticated) {
      return (
          <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-50 p-6 animate-fadeIn">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
                  <div className="text-center mb-6">
                      <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                          <Lock size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">כניסת מנהלים</h2>
                      <p className="text-slate-500 mt-2">גישה ללוח בקרה ודוחות מערכת</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
                          <div className="relative">
                              <UserCog size={20} className="absolute top-3 right-3 text-slate-400" />
                              <input 
                                type="text" 
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="שם המנהל/ת"
                                required
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">סיסמה</label>
                          <input 
                            type="password"
                            value={adminPassword}
                            onChange={(e) => {
                                setAdminPassword(e.target.value);
                                setAuthError(false);
                            }}
                            className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${authError ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            placeholder="הזן סיסמה..."
                            required
                          />
                          {authError && (
                              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  סיסמה שגויה. נסה שנית.
                              </p>
                          )}
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-4"
                      >
                          כניסה למערכת
                          <ArrowLeft size={20} />
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  if (activeView === 'knowledge') {
    return (
      <div className={screenWrapperClass}>
        <div className={containerClass}>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">ניהול מאגר ידע</h1>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 sticky top-0">
                  <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-indigo-600" />
                    הוספת מידע חדש
                  </h2>
                  <div 
                    onClick={() => !isReadingFile && fileInputRef.current?.click()}
                    className={`mb-4 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group ${isReadingFile ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden"
                        accept=".txt,.md,.json,.csv,.log,.pdf"
                        onChange={handleFileSelect}
                        disabled={isReadingFile}
                    />
                    {isReadingFile ? (
                       <Loader2 size={32} className="text-indigo-600 animate-spin mb-2" />
                    ) : (
                       <div className="bg-indigo-100 p-3 rounded-full mb-3 group-hover:bg-indigo-200 transition-colors">
                           <FileUp size={24} className="text-indigo-600" />
                       </div>
                    )}
                    <p className="text-sm font-medium text-slate-600 text-center">
                        {isReadingFile ? 'קורא קובץ...' : 'לחץ להעלאת קובץ'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 text-center">TXT, JSON, CSV, PDF</p>
                  </div>

                  <form onSubmit={handleAddKnowledge}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-600 mb-1">נושא / כותרת</label>
                      <input
                        type="text"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-600 mb-1">תוכן ההדרכה</label>
                      <textarea
                        value={newDocContent}
                        onChange={(e) => setNewDocContent(e.target.value)}
                        className="w-full h-32 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isReadingFile || !newDocContent}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                    >
                      {uploadSuccess ? <CheckCircle size={20} /> : <Plus size={20} />}
                      {uploadSuccess ? 'נוסף בהצלחה' : 'שמור למאגר'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="xl:col-span-2 space-y-4">
                 <h2 className="text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText size={20} className="text-slate-500" />
                    פריטי ידע קיימים ({knowledgeItems.length})
                  </h2>
                {knowledgeItems.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">{item.content}</p>
                    <button 
                        onClick={() => handleDeleteKnowledge(item.id)}
                        className="absolute bottom-5 left-5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                ))}
              </div>
            </div>
        </div>
      </div>
    );
  }

  if (activeView === 'queries') {
      return (
        <div className={screenWrapperClass}>
            <div className={containerClass}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">תיעוד שאלות ושיחות</h1>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportQueriesToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl shadow-sm">
                            <Download size={18} /> יצוא
                        </button>
                        <button onClick={() => { loadData(); generateTrends(queries); }} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500">
                            <RefreshCw size={20} className={trendsLoading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-500" /> ניתוח מגמות ודמיון (AI)
                    </h3>
                    {trendsLoading ? (
                        <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-dashed border-slate-200"><Loader2 size={32} className="animate-spin mx-auto mb-2 text-indigo-400" /></div>
                    ) : queryTrends.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {queryTrends.map((trend, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800">{trend.topic}</h4>
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold">{trend.count} חזרות</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-400 text-sm">לא נמצאו מספיק נתונים לניתוח מגמות.</div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-slate-50 text-slate-700 text-sm font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-4">תאריך</th>
                                    <th className="p-4">שם עובד</th>
                                    <th className="p-4 min-w-[200px]">שאלה</th>
                                    <th className="p-4 min-w-[200px]">תשובה</th>
                                    <th className="p-4">סטטוס</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredQueries.map(q => (
                                    <tr key={q.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-slate-500 align-top">{new Date(q.timestamp).toLocaleDateString('he-IL')}</td>
                                        <td className="p-4 font-medium align-top">{q.username || 'אורח'}</td>
                                        <td className="p-4 text-slate-700 align-top">{q.question}</td>
                                        <td className="p-4 text-slate-500 text-xs align-top"><div className="line-clamp-2 hover:line-clamp-none">{q.answer}</div></td>
                                        <td className="p-4 align-top">{q.isAnswered ? <CheckCircle size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-red-500" />}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  if (activeView === 'reports') {
      return (
        <div className={screenWrapperClass}>
            <div className={containerClass}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">דוח בקרה וטיפול</h1>
                    </div>
                    <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl shadow-sm"><Download size={18} /> יצוא</button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden w-full">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-slate-50 text-slate-700 text-sm font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">תאריך</th>
                                    <th className="p-3">שם משתמש</th>
                                    <th className="p-3">קטגוריה</th>
                                    <th className="p-3">דחיפות</th>
                                    <th className="p-3">סטטוס</th>
                                    <th className="p-3 min-w-[200px]">תיאור התקלה</th>
                                    <th className="p-3 min-w-[200px]">דרך טיפול</th>
                                    <th className="p-3">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredIssues.map(issue => (
                                    <tr key={issue.id} className="hover:bg-slate-50/50">
                                        <td className="p-3 text-slate-500">{new Date(issue.createdAt).toLocaleDateString('he-IL')}</td>
                                        <td className="p-3 font-medium text-slate-800">{issue.username || '-'}</td>
                                        <td className="p-3">
                                            {editingIssue === issue.id ? (
                                                 <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as any)} className="p-1 border border-slate-300 rounded text-xs w-full">
                                                    {Object.values(IssueCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                 </select>
                                            ) : (
                                                <span className="text-slate-700 font-medium">{issue.category}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingIssue === issue.id ? (
                                                 <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as any)} className="p-1 border border-slate-300 rounded text-xs w-full">
                                                    {Object.values(IssuePriority).map(prio => <option key={prio} value={prio}>{prio}</option>)}
                                                 </select>
                                            ) : (
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${issue.priority === IssuePriority.CRITICAL ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{issue.priority}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingIssue === issue.id ? (
                                                 <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="p-1 border border-slate-300 rounded text-xs w-full">
                                                    <option value="open">פתוח</option>
                                                    <option value="in_progress">בטיפול</option>
                                                    <option value="closed">סגור</option>
                                                 </select>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full border">{issue.status}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="font-semibold text-slate-700">{issue.summary}</div>
                                        </td>
                                        <td className="p-3">
                                            {editingIssue === issue.id ? (
                                                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full p-1 border border-blue-300 rounded text-xs h-16" />
                                            ) : (
                                                <div className="text-slate-600 text-xs">{issue.treatmentNotes || '-'}</div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingIssue === issue.id ? (
                                                <button onClick={() => saveEdit(issue)} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs">שמור</button>
                                            ) : (
                                                <button onClick={() => startEditing(issue)} className="text-indigo-600 border border-indigo-200 px-3 py-1 rounded text-xs">עדכן</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className={screenWrapperClass}>
      <div className={containerClass}>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">לוח בקרה ניהולי</h1>
            <button onClick={loadData} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500"><RefreshCw size={20} /></button>
          </div>

          <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl w-fit border border-slate-200 shadow-sm flex-wrap">
              <button onClick={() => setDashboardTab('overview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${dashboardTab === 'overview' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}><Activity size={16} /> סקירה כללית</button>
              <button onClick={() => setDashboardTab('tasks')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${dashboardTab === 'tasks' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}>משימות פתוחות</button>
          </div>

          {dashboardTab === 'overview' && (
            <div className="w-full animate-fadeIn">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-6">התפלגות תקלות</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData}><CartesianGrid vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-6">דחיפות תקלות</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart><Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">{priorityData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {dashboardTab === 'tasks' && (
              <div className="w-full animate-fadeIn">
                  <div className="space-y-4">
                      {issues.filter(i => i.status === 'open').map(issue => (
                          <div key={issue.id} className="bg-white p-6 rounded-2xl border-l-4 border-l-red-500 shadow-sm">
                              <h4 className="font-bold text-slate-800 text-lg">{issue.summary} ({issue.category})</h4>
                              <p className="text-slate-600 text-sm mb-3">{issue.description}</p>
                              <button onClick={() => startEditing(issue)} className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm">טפל בתקלה</button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
