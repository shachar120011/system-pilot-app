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

  const [editingIssue, setEditingIssue] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<Issue['status']>('open');

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
    
    // 1. טעינת נתונים מקומיים כבסיס
    let loadedIssues = StorageService.getIssues();
    let loadedQueries = StorageService.getQueries();
    
    try {
      // 2. משיכת נתונים מהענן (Google Sheets)
      const response = await fetch(APPS_SCRIPT_URL);
      const result = await response.json();
      
      if (result.status === "success") {
        
        // --- שילוב תקלות ---
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

        // --- שילוב שאלות ---
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

        // --- שילוב מאגר ידע ---
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
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                fullText += `--- עמוד ${i} ---\n${pageText}\n\n`;
            }
            setNewDocContent(fullText);
        } else {
            const text = await file.text();
            setNewDocContent(text);
        }
    } catch (error) {
        console.error("File Reading Error:", error);
        alert("שגיאה בקריאת הקובץ. אנא נסה קובץ אחר.");
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
        body: JSON.stringify({
          sheet: "Knowledge_Base",
          data: [
            new Date().toISOString(),
            newItem.title,
            newItem.content,
            newItem.fileName || ""
          ]
        })
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

  const startEditing = (issue: Issue) => {
      setEditingIssue(issue.id);
      setEditNotes(issue.treatmentNotes || '');
      setEditStatus(issue.status);
  };

  const cancelEditing = () => {
      setEditingIssue(null);
      setEditNotes('');
  };

  // --- הפונקציה המשודרגת: למידה אוטומטית מתקלות ---
  const saveEdit = async (issue: Issue) => {
      const updatedIssue: Issue = {
          ...issue,
          treatmentNotes: editNotes,
          status: editStatus
      };
      StorageService.updateIssue(updatedIssue);
      setIssues(prev => prev.map(i => i.id === issue.id ? updatedIssue : i));
      
      // אם התקלה נסגרה, ויש הערות טיפול מפורטות - הופכים אותה לפריט ידע חדש!
      if (editStatus === 'closed' && editNotes.trim().length > 5 && issue.status !== 'closed') {
          const newTitle = `פתרון תקלה: ${issue.summary}`;
          const newContent = `**תיאור הבעיה המקורית שדווחה:**\n${issue.description}\n\n**דרך הטיפול והפתרון:**\n${editNotes}`;
          
          const newItem: KnowledgeItem = {
              id: uuidv4(),
              title: newTitle,
              content: newContent,
              createdAt: Date.now(),
              sourceType: 'manual'
          };

          StorageService.saveKnowledgeItem(newItem);
          setKnowledgeItems(prev => [newItem, ...prev]);

          try {
              await fetch(APPS_SCRIPT_URL, {
                  method: "POST",
                  body: JSON.stringify({
                      sheet: "Knowledge_Base",
                      data: [
                          new Date().toISOString(),
                          newItem.title,
                          newItem.content,
                          "נלמד אוטומטית ממערכת התקלות"
                      ]
                  })
              });
              alert("🤖 מעולה! הבוט למד משהו חדש. הפתרון שלך נוסף אוטומטית למאגר הידע של המערכת.");
          } catch (error) {
              console.error("Auto-Knowledge Sync Error:", error);
          }
      }

      setEditingIssue(null);
  };

  const downloadAttachment = (attachment: Attachment) => {
      const link = document.createElement("a");
      link.href = attachment.data;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
          new Date(i.createdAt).toLocaleDateString('he-IL'),
          i.username || '',
          i.userRole || '',
          i.category,
          i.priority,
          `"${i.summary.replace(/"/g, '""')}"`, 
          `"${i.description.replace(/"/g, '""')}"`,
          i.status,
          `"${(i.treatmentNotes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = "\uFEFF" + [header, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `system_pilot_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const exportQueriesToExcel = () => {
      const header = ["תאריך", "שעה", "שם משתמש", "מחלקה", "שאלה", "תשובה", "האם נענה"];
      const rows = filteredQueries.map(q => [
          new Date(q.timestamp).toLocaleDateString('he-IL'),
          new Date(q.timestamp).toLocaleTimeString('he-IL'),
          q.username || '',
          q.department || '',
          `"${q.question.replace(/"/g, '""')}"`,
          `"${q.answer.replace(/"/g, '""')}"`,
          q.isAnswered ? 'כן' : 'לא'
      ]);

      const csvContent = "\uFEFF" + [header, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `system_pilot_queries_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

      return Object.entries(stats)
          .map(([name, data]) => ({ name, ...data, total: data.queries + data.issues }))
          .sort((a, b) => b.total - a.total);
  }, [issues, queries]);

  const categoryData = useMemo(() => {
    const counts = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const priorityData = useMemo(() => {
     const counts = issues.reduce((acc, issue) => {
      acc[issue.priority] = (acc[issue.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

  if (!isAuthenticated) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-6 animate-fadeIn">
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
      <div className="p-6 max-w-6xl mx-auto animate-fadeIn">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">ניהול מאגר ידע</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 sticky top-6">
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
                
                {!isReadingFile && uploadedFileName && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        <CheckCircle size={12} />
                        {uploadedFileName}
                    </div>
                )}
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">או הזן ידנית</span>
                </div>
              </div>

              <form onSubmit={handleAddKnowledge}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-1">נושא / כותרת</label>
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="למשל: נהלי אבטחת מידע"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-1">תוכן ההדרכה</label>
                  <textarea
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    className="w-full h-40 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="התוכן יופיע כאן אוטומטית לאחר העלאת קובץ..."
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

          <div className="lg:col-span-2 space-y-4">
             <h2 className="text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
                <FileText size={20} className="text-slate-500" />
                פריטי ידע קיימים ({knowledgeItems.length})
              </h2>
            {knowledgeItems.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                    עדיין אין פריטי ידע. הוסף את הראשון!
                </div>
            ) : (
                knowledgeItems.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
                            {item.sourceType === 'file' && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100 flex items-center gap-1">
                                    <FileJson size={10} />
                                    קובץ
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">{item.content}</p>
                    <button 
                        onClick={() => handleDeleteKnowledge(item.id)}
                        className="absolute bottom-5 left-5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="מחק פריט"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'queries') {
      return (
        <div className="p-6 max-w-[95%] mx-auto animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">תיעוד שאלות ושיחות</h1>
                    <p className="text-slate-500">מעקב אחר שאלות עובדים וזיהוי מגמות חוזרות</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={exportQueriesToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm transition-all"
                    >
                        <Download size={18} />
                        יצוא לאקסל
                    </button>
                    <button 
                        onClick={() => {
                            loadData();
                            generateTrends(queries);
                        }}
                        className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="רענן נתונים וניתוח AI"
                    >
                        <RefreshCw size={20} className={trendsLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-500" />
                    ניתוח מגמות ודמיון (AI)
                </h3>
                
                {trendsLoading ? (
                    <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200">
                        <Loader2 size={32} className="animate-spin mb-2 text-indigo-400" />
                        <span className="text-sm">מנתח שאלות נפוצות...</span>
                    </div>
                ) : queryTrends.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {queryTrends.map((trend, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800">{trend.topic}</h4>
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold">
                                        {trend.count} חזרות
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-2 space-y-1">
                                    <p className="font-medium text-slate-400 mb-1">דוגמאות:</p>
                                    {trend.exampleQuestions.map((q, i) => (
                                        <div key={i} className="flex items-start gap-1.5">
                                            <HelpCircle size={10} className="mt-0.5 shrink-0" />
                                            <span className="truncate">{q}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-400 text-sm">
                        לא נמצאו מספיק נתונים לניתוח מגמות עדיין.
                    </div>
                )}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Filter size={18} />
                    סינון:
                </div>
                <select 
                    value={queryFilterStatus} 
                    onChange={(e) => setQueryFilterStatus(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">הכל</option>
                    <option value="answered">נענה</option>
                    <option value="error">שגיאה</option>
                </select>
                
                <div className="relative">
                    <Search size={16} className="absolute top-2.5 right-3 text-slate-400" />
                    <input 
                        type="text" 
                        value={queryFilterUser}
                        onChange={(e) => setQueryFilterUser(e.target.value)}
                        placeholder="חפש לפי שם עובד..."
                        className="p-2 pr-9 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                    />
                </div>

                <input 
                    type="date"
                    value={queryFilterDate}
                    onChange={(e) => setQueryFilterDate(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>

                <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <ArrowUpDown size={18} />
                    מיון:
                </div>
                <select 
                    value={querySortOption} 
                    onChange={(e) => setQuerySortOption(e.target.value as any)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="newest">מהחדש לישן</option>
                    <option value="oldest">מהישן לחדש</option>
                    <option value="unanswered_first">סטטוס פתוח/שגיאה קודם</option>
                </select>

                <div className="mr-auto text-xs text-slate-400 font-medium">
                    נמצאו {filteredQueries.length} רשומות
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <MessageSquare size={18} />
                        יומן שאלות מלא
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-slate-50 text-slate-700 text-sm font-bold border-b border-slate-200">
                            <tr>
                                <th className="p-4 whitespace-nowrap w-32">תאריך</th>
                                <th className="p-4 whitespace-nowrap w-32">שם עובד</th>
                                <th className="p-4 whitespace-nowrap w-32">מחלקה</th>
                                <th className="p-4 min-w-[200px]">מהות השאלה</th>
                                <th className="p-4 min-w-[200px]">תשובת המערכת</th>
                                <th className="p-4 whitespace-nowrap w-24">סטטוס</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredQueries.map(q => (
                                <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 text-slate-500 align-top">
                                        {new Date(q.timestamp).toLocaleDateString('he-IL')} 
                                        <div className="text-xs opacity-60">{new Date(q.timestamp).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-800 align-top">
                                        {q.username || 'אורח'}
                                    </td>
                                    <td className="p-4 text-slate-600 align-top">
                                        {q.department || '-'}
                                    </td>
                                    <td className="p-4 text-slate-700 font-medium align-top">
                                        {q.question}
                                    </td>
                                    <td className="p-4 text-slate-500 text-xs leading-relaxed align-top">
                                        <div className="line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                                            {q.answer}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top">
                                        {q.isAnswered ? (
                                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold w-fit">
                                                <CheckCircle size={12} />
                                                נענתה
                                            </span>
                                        ) : (
                                            <span className="text-red-500 bg-red-50 px-2 py-1 rounded-full text-xs">שגיאה</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredQueries.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400">
                                        לא נמצאו שאלות התואמות את הסינון
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  if (activeView === 'reports') {
      return (
        <div className="p-6 max-w-[95%] mx-auto animate-fadeIn">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">דוח בקרה וטיפול</h1>
                    <p className="text-slate-500">ניהול תקלות, סינון ויצוא נתונים</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm transition-all"
                    >
                        <Download size={18} />
                        יצוא לאקסל
                    </button>
                    <button 
                        onClick={loadData} 
                        className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="רענן נתונים"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Filter size={18} />
                    סינון:
                </div>
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">כל הסטטוסים</option>
                    <option value="open">פתוח</option>
                    <option value="in_progress">בטיפול</option>
                    <option value="transferred">הועבר לטיפול</option>
                    <option value="closed">סגור</option>
                </select>

                <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">כל הקטגוריות</option>
                    {Object.values(IssueCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <select 
                    value={filterPriority} 
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">כל הדחיפויות</option>
                    {Object.values(IssuePriority).map(prio => (
                        <option key={prio} value={prio}>{prio}</option>
                    ))}
                </select>
                
                <div className="relative">
                    <Search size={16} className="absolute top-2.5 right-3 text-slate-400" />
                    <input 
                        type="text" 
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        placeholder="חפש לפי שם משתמש..."
                        className="p-2 pr-9 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                    />
                </div>

                <input 
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>

                <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <ArrowUpDown size={18} />
                    מיון:
                </div>
                <select 
                    value={sortOption} 
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="newest">מהחדש לישן</option>
                    <option value="oldest">מהישן לחדש</option>
                    <option value="open_first">סטטוס פתוח קודם</option>
                </select>

                <div className="mr-auto text-xs text-slate-400 font-medium">
                    נמצאו {filteredIssues.length} רשומות
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-slate-50 text-slate-700 text-sm font-bold border-b border-slate-200">
                            <tr>
                                <th className="p-4 whitespace-nowrap">תאריך</th>
                                <th className="p-4 whitespace-nowrap">שם משתמש</th>
                                <th className="p-4 whitespace-nowrap">תפקיד</th>
                                <th className="p-4 whitespace-nowrap">קטגוריה</th>
                                <th className="p-4 whitespace-nowrap">דחיפות</th>
                                <th className="p-4 whitespace-nowrap">סטטוס</th>
                                <th className="p-4 min-w-[300px]">תיאור התקלה / הערות</th>
                                <th className="p-4 min-w-[150px]">קבצים מצורפים</th>
                                <th className="p-4 min-w-[250px]">דרך טיפול</th>
                                <th className="p-4 whitespace-nowrap">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredIssues.map(issue => (
                                <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 text-slate-500">
                                        {new Date(issue.createdAt).toLocaleDateString('he-IL')}
                                    </td>
                                    <td className="p-4 font-medium text-slate-800">
                                        {issue.username || '-'}
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {issue.userRole || '-'}
                                    </td>
                                    <td className="p-4 text-slate-700 font-medium">
                                        {issue.category}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                            issue.priority === IssuePriority.CRITICAL ? 'bg-red-100 text-red-600' :
                                            issue.priority === IssuePriority.HIGH ? 'bg-orange-100 text-orange-600' :
                                            issue.priority === IssuePriority.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                            {issue.priority}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {editingIssue === issue.id ? (
                                             <select 
                                                value={editStatus}
                                                onChange={(e) => setEditStatus(e.target.value as any)}
                                                className="p-1.5 border border-slate-300 rounded-lg text-xs"
                                             >
                                                <option value="open">פתוח</option>
                                                <option value="in_progress">בטיפול</option>
                                                <option value="transferred">הועבר לטיפול</option>
                                                <option value="closed">סגור</option>
                                             </select>
                                        ) : (
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                                                issue.status === 'open' ? 'bg-red-50 text-red-600 border-red-100' :
                                                issue.status === 'in_progress' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                issue.status === 'transferred' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                'bg-green-50 text-green-600 border-green-100'
                                            }`}>
                                                {issue.status === 'open' ? 'פתוח' : 
                                                 issue.status === 'in_progress' ? 'בטיפול' : 
                                                 issue.status === 'transferred' ? 'הועבר לטיפול' : 'סגור'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-700 mb-1">{issue.summary}</div>
                                        <div className="text-slate-500 leading-relaxed text-xs">{issue.description}</div>
                                    </td>
                                    <td className="p-4">
                                        {issue.attachments && issue.attachments.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {issue.attachments.map((att, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => downloadAttachment(att)}
                                                        className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-1 rounded text-[10px] hover:bg-indigo-100 transition-colors"
                                                        title={`הורד ${att.name}`}
                                                    >
                                                        <Paperclip size={10} />
                                                        <span className="truncate max-w-[80px]">{att.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingIssue === issue.id ? (
                                            <textarea 
                                                value={editNotes}
                                                onChange={(e) => setEditNotes(e.target.value)}
                                                className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs h-20"
                                                placeholder="הזן דרך טיפול..."
                                            />
                                        ) : (
                                            <div className="text-slate-600 whitespace-pre-wrap text-xs">
                                                {issue.treatmentNotes || <span className="text-slate-300 italic">טרם הוזן טיפול</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingIssue === issue.id ? (
                                            <button 
                                                onClick={() => saveEdit(issue)}
                                                className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 transition-colors shadow-sm"
                                            >
                                                <Save size={14} />
                                                שמור
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => startEditing(issue)}
                                                className="text-indigo-600 hover:text-indigo-800 text-xs font-medium border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                עדכן
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                             {filteredIssues.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400">
                                        לא נמצאו תקלות התואמות את הסינון
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">לוח בקרה ניהולי</h1>
           <p className="text-slate-500">סקירה כללית על הטמעת המערכת ודיווחי משתמשים</p>
        </div>
        <button 
            onClick={loadData} 
            className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors"
            title="רענן נתונים"
        >
            <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-8 bg-white p-1 rounded-xl w-fit border border-slate-200 shadow-sm">
          <button 
            onClick={() => setDashboardTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${dashboardTab === 'overview' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
              <Activity size={16} />
              סקירה כללית
          </button>
          <button 
            onClick={() => setDashboardTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${dashboardTab === 'tasks' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
              <LayoutList size={16} />
              משימות חדשות
              {openTasksCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{openTasksCount}</span>
              )}
          </button>
          <button 
            onClick={() => setDashboardTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${dashboardTab === 'users' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
              <Users size={16} />
              טיפול בעובדים (User Care)
          </button>
      </div>

      {dashboardTab === 'overview' && (
        <div className="animate-fadeIn">
            <div className="bg-gradient-to-l from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white/5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent pointer-events-none"></div>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Clock size={20} className="text-indigo-200" />
                    תובנות AI בזמן אמת
                </h3>
                <div className="text-indigo-50 leading-relaxed max-w-4xl font-light text-lg prose prose-invert prose-p:my-1 prose-headings:text-indigo-100">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {aiInsight || 'מנתח נתונים...'}
                    </ReactMarkdown>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-6">התפלגות תקלות לפי קטגוריה</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-6">דחיפות תקלות</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                    {priorityData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1 text-xs text-slate-500">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length]}}></div>
                            {entry.name}
                        </div>
                    ))}
                </div>
                </div>
            </div>
        </div>
      )}

      {dashboardTab === 'tasks' && (
          <div className="animate-fadeIn">
              <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold text-lg">
                 <Bell size={20} className="text-red-500" />
                 משימות פתוחות לטיפול ({openTasksCount})
              </div>
              
              <div className="space-y-4">
                  {issues.filter(i => i.status === 'open').map(issue => (
                      <div key={issue.id} className="bg-white p-6 rounded-2xl border-l-4 border-l-red-500 shadow-sm border-t border-r border-b border-slate-100 transition-all hover:shadow-md">
                          <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-slate-800 text-lg">{issue.summary}</h4>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                issue.priority === IssuePriority.CRITICAL ? 'bg-red-100 text-red-600' :
                                                issue.priority === IssuePriority.HIGH ? 'bg-orange-100 text-orange-600' :
                                                issue.priority === IssuePriority.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-600'
                                            }`}>
                                                {issue.priority}
                                        </span>
                                        {issue.attachments && issue.attachments.length > 0 && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                                                <Paperclip size={10} />
                                                {issue.attachments.length} קבצים
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-sm mb-3">{issue.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span>{new Date(issue.createdAt).toLocaleDateString('he-IL')}</span>
                                        <span>•</span>
                                        <span>{issue.username} ({issue.userRole})</span>
                                    </div>
                                </div>
                                
                                {editingIssue !== issue.id && (
                                    <button 
                                        onClick={() => startEditing(issue)}
                                        className="text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        טפל בתקלה
                                    </button>
                                )}
                          </div>

                          {editingIssue === issue.id && (
                              <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">עדכון סטטוס</label>
                                            <select 
                                                value={editStatus}
                                                onChange={(e) => setEditStatus(e.target.value as any)}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                                            >
                                                <option value="open">פתוח</option>
                                                <option value="in_progress">בטיפול</option>
                                                <option value="transferred">הועבר לטיפול</option>
                                                <option value="closed">סגור</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">הערות טיפול</label>
                                            <textarea 
                                                value={editNotes}
                                                onChange={(e) => setEditNotes(e.target.value)}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none h-20 resize-none"
                                                placeholder="הזן הערות לגבי הטיפול בתקלה..."
                                            />
                                        </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                      <button 
                                        onClick={cancelEditing}
                                        className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-sm"
                                      >
                                          ביטול
                                      </button>
                                      <button 
                                        onClick={() => saveEdit(issue)}
                                        className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm flex items-center gap-1 shadow-sm"
                                      >
                                          <Save size={16} />
                                          שמור שינויים
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}
                  {openTasksCount === 0 && (
                      <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center text-slate-400">
                          <CheckCircle size={48} className="text-green-500 mb-4" />
                          <h3 className="text-lg font-bold text-slate-600">הכל נקי!</h3>
                          <p>אין תקלות פתוחות במערכת כרגע.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {dashboardTab === 'users' && (
          <div className="animate-fadeIn">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6 text-indigo-800 text-sm">
                  <span className="font-bold block mb-1">💡 זיהוי צרכי הדרכה</span>
                  עובדים המופיעים בראש הרשימה מבצעים אינטראקציה גבוהה עם המערכת (שאלות + תקלות). מומלץ ליזום פנייה יזומה או הדרכה אישית.
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-700 mb-6">משתמשים עם הפעילות הגבוהה ביותר</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={userStats.slice(0, 7)} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Bar dataKey="queries" name="שאלות" stackId="a" fill="#6366f1" barSize={20} radius={[0, 4, 4, 0]} />
                                <Bar dataKey="issues" name="דיווחים" stackId="a" fill="#f43f5e" barSize={20} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-y-auto max-h-[420px]">
                      <h3 className="font-bold text-slate-700 mb-4">מומלצים להתייחסות</h3>
                      <div className="space-y-4">
                          {userStats.slice(0, 5).map((user, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                      {user.name.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                      <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                                      <div className="text-xs text-slate-500">{user.department}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-bold text-indigo-600 text-sm">{user.total}</div>
                                      <div className="text-[10px] text-slate-400">פניות</div>
                                  </div>
                              </div>
                          ))}
                           {userStats.length === 0 && (
                              <div className="text-center text-slate-400 py-8 text-sm">אין מספיק נתונים</div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
