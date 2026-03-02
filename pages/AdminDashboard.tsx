import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Upload, Plus, FileText, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2, FileUp, FileJson, Loader2, Save, MessageSquare, TrendingUp, HelpCircle, Download, Filter, ArrowUpDown, Users, Bell, Search, LayoutList, Activity, Paperclip, Lock, UserCog, ArrowLeft, Target, Timer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Issue, KnowledgeItem, IssuePriority, IssueCategory, UserQuery, QueryTrend, Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

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
  const [editCategory, setEditCategory] = useState<IssueCategory>(IssueCategory.OTHER);
  const [editPriority, setEditPriority] = useState<IssuePriority>(IssuePriority.MEDIUM);
  const [saveToKnowledgeBase, setSaveToKnowledgeBase] = useState(false);

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
    if (isAuthenticated) loadData();
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
    try {
      // משיכת נתונים אסינכרונית מסופבייס דרך ה-Service החדש
      const [loadedIssues, loadedQueries, loadedKB] = await Promise.all([
        StorageService.getIssues(),
        StorageService.getQueries(),
        StorageService.getKnowledgeBase()
      ]);

      setIssues(loadedIssues);
      setQueries(loadedQueries);
      setKnowledgeItems(loadedKB);

      if (activeView === 'dashboard' && loadedIssues.length > 0 && !aiInsight) {
          generateInsight(loadedIssues);
      }
      if (activeView === 'queries' && loadedQueries.length > 0 && queryTrends.length === 0) {
          generateTrends(loadedQueries);
      }
    } catch (error) {
      console.error("Load Data Error:", error);
    } finally {
      setLoading(false);
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
      sourceType: uploadedFileName ? 'file' : 'manual'
    };

    await StorageService.saveKnowledgeItem(newItem);
    setKnowledgeItems(prev => [newItem, ...prev]);
    
    setNewDocTitle('');
    setNewDocContent('');
    setUploadedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleDeleteKnowledge = (id: string) => {
      // כאן בהמשך אפשר להוסיף מחיקה מהענן
      setKnowledgeItems(prev => prev.filter(item => item.id !== id));
  };

  const startEditing = (issue: Issue) => {
      setEditingIssue(issue.id);
      setEditNotes(issue.treatmentNotes || '');
      setEditStatus(issue.status);
      setEditCategory(issue.category);
      setEditPriority(issue.priority);
      setSaveToKnowledgeBase(false);
  };

  const cancelEditing = () => {
      setEditingIssue(null);
      setEditNotes('');
  };

  const saveEdit = async (issue: Issue) => {
      const isNewlyClosed = editStatus === 'closed' && issue.status !== 'closed';
      
      const updatedIssue: Issue = {
          ...issue,
          treatmentNotes: editNotes,
          status: editStatus,
          category: editCategory,
          priority: editPriority,
          closedAt: isNewlyClosed ? Date.now() : (editStatus !== 'closed' ? undefined : issue.closedAt)
      };
      
      await StorageService.updateIssue(updatedIssue);
      setIssues(prev => prev.map(i => i.id === issue.id ? updatedIssue : i));
      
      if (saveToKnowledgeBase && editNotes.trim().length > 5) {
          const newItem: KnowledgeItem = { 
            id: uuidv4(), 
            title: `פתרון: ${issue.summary || issue.category}`, 
            content: editNotes, 
            createdAt: Date.now(), 
            sourceType: 'manual' 
          };
          await StorageService.saveKnowledgeItem(newItem);
          setKnowledgeItems(prev => [newItem, ...prev]);
          alert("✅ הפתרון נשמר במאגר הידע.");
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

  const resolutionStats = useMemo(() => {
    const total = issues.length;
    const closedIssues = issues.filter(i => i.status === 'closed');
    const closedCount = closedIssues.length;
    const rate = total === 0 ? 0 : Math.round((closedCount / total) * 100);

    let avgTimeHours = 0;
    const issuesWithTime = closedIssues.filter(i => i.closedAt && i.createdAt);
    if (issuesWithTime.length > 0) {
        const totalMs = issuesWithTime.reduce((acc, issue) => acc + (issue.closedAt! - issue.createdAt), 0);
        avgTimeHours = Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10; 
    }
    return { total, closedCount, rate, avgTimeHours };
  }, [issues]);

  const openTasksCount = useMemo(() => issues.filter(i => i.status === 'open').length, [issues]);

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
  const screenWrapperClass = "h-screen w-full overflow-y-auto bg-slate-50 p-4 md:p-8 animate-fadeIn";

  if (!isAuthenticated) {
      return (
          <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-50 p-6 animate-fadeIn">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
                  <div className="text-center mb-6">
                      <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600"><Lock size={32} /></div>
                      <h2 className="text-2xl font-bold text-slate-800">כניסת מנהלים</h2>
                      <p className="text-slate-500 mt-2">גישה ללוח בקרה (Supabase Cloud)</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="שם המנהל/ת" required />
                      <input type="password" value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setAuthError(false); }} className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${authError ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} placeholder="הזן סיסמה..." required />
                      {authError && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">סיסמה שגויה. נסה שוב.</p>}
                      <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg mt-4 transition-all">כניסה למערכת</button>
                  </form>
              </div>
          </div>
      );
  }

  if (activeView === 'knowledge') {
    return (
      <div className={screenWrapperClass}>
        <div className="max-w-7xl mx-auto w-full pb-20">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">ניהול מאגר ידע</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100">
                  <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Upload size={20} className="text-indigo-600" /> הוספת מידע חדש</h2>
                  <div onClick={() => !isReadingFile && fileInputRef.current?.click()} className={`mb-4 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-all ${isReadingFile ? 'opacity-50' : ''}`}>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.pdf" onChange={handleFileSelect} disabled={isReadingFile} />
                    <FileUp size={24} className="text-indigo-600 mb-2" />
                    <p className="text-sm font-medium text-slate-600">{isReadingFile ? 'קורא...' : 'לחץ להעלאה'}</p>
                    {uploadedFileName && <div className="mt-2 text-xs text-emerald-600 font-bold">{uploadedFileName}</div>}
                  </div>
                  <form onSubmit={handleAddKnowledge}>
                    <input type="text" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="כותרת" required />
                    <textarea value={newDocContent} onChange={(e) => setNewDocContent(e.target.value)} className="w-full h-32 p-2 bg-slate-50 border rounded-lg mb-4 outline-none resize-none" placeholder="תוכן..." required />
                    <button type="submit" disabled={isReadingFile || !newDocContent} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md flex justify-center items-center gap-2">
                        {uploadSuccess ? <CheckCircle size={20} /> : <Plus size={20} />} {uploadSuccess ? 'נשמר' : 'שמור למאגר'}
                    </button>
                  </form>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                 <h2 className="text-lg font-bold text-slate-700 mb-2">פריטי ידע קיימים ({knowledgeItems.length})</h2>
                {knowledgeItems.map((item) => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border group relative">
                        <div className="flex justify-between mb-2">
                            <h3 className="font-bold text-slate-800">{item.title}</h3>
                            <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('he-IL')}</span>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">{item.content}</p>
                        <button onClick={() => handleDeleteKnowledge(item.id)} className="absolute bottom-5 left-5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
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
          <div className="max-w-7xl mx-auto w-full pb-20">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h1 className="text-3xl font-bold text-slate-800">תיעוד שאלות ושיחות</h1>
                      <p className="text-slate-500">מעקב אחר שאלות עובדים מהענן</p>
                  </div>
                  <button onClick={loadData} className="p-2 bg-white border rounded-full hover:bg-slate-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                          <thead className="bg-slate-50 text-slate-700 text-sm font-bold border-b">
                              <tr><th className="p-4">תאריך</th><th className="p-4">שם עובד</th><th className="p-4">מחלקה</th><th className="p-4">השאלה</th><th className="p-4">תשובת המערכת</th><th className="p-4">סטטוס</th></tr>
                          </thead>
                          <tbody className="divide-y text-sm">
                              {filteredQueries.map(q => (
                                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-4 text-slate-500">{new Date(q.timestamp).toLocaleDateString('he-IL')}</td>
                                      <td className="p-4 font-medium text-slate-800">{q.username || 'אורח'}</td>
                                      <td className="p-4 text-slate-600">{q.department || '-'}</td>
                                      <td className="p-4 text-slate-700 font-medium">{q.question}</td>
                                      <td className="p-4 text-slate-500 text-xs leading-relaxed"><div className="line-clamp-2">{q.answer}</div></td>
                                      <td className="p-4">{q.isAnswered ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold">נענתה</span> : <span className="text-red-500 bg-red-50 px-2 py-1 rounded-full text-xs">שגיאה</span>}</td>
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
            <div className="max-w-7xl mx-auto w-full pb-20">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">דוח בקרה וטיפול</h1>
                    <div className="flex gap-2">
                        <button onClick={loadData} className="p-2 bg-white border rounded-full hover:bg-slate-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border overflow-hidden w-full">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-slate-50 text-slate-700 text-sm font-bold border-b">
                                <tr><th className="p-4">תאריך</th><th className="p-4">שם משתמש</th><th className="p-4">קטגוריה</th><th className="p-4">דחיפות</th><th className="p-4">סטטוס</th><th className="p-4 min-w-[250px]">תיאור התקלה</th><th className="p-4">קבצים</th><th className="p-4 min-w-[200px]">דרך טיפול</th><th className="p-4">פעולות</th></tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {filteredIssues.map(issue => (
                                    <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-500">
                                            {new Date(issue.createdAt).toLocaleDateString('he-IL')}
                                        </td>
                                        <td className="p-4 font-medium text-slate-800">{issue.username || '-'}</td>
                                        <td className="p-4">{issue.category}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${issue.priority === IssuePriority.CRITICAL ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{issue.priority}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${issue.status === 'open' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                {issue.status === 'open' ? 'פתוח' : 'סגור'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 text-xs">{issue.description}</td>
                                        <td className="p-4">
                                            {issue.attachments && issue.attachments.length > 0 ? (
                                                <button onClick={() => downloadAttachment(issue.attachments![0])} className="text-indigo-600 flex items-center gap-1 hover:underline"><Paperclip size={12}/> קובץ</button>
                                            ) : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="p-4">
                                            {editingIssue === issue.id ? (
                                                <div className="flex flex-col gap-2">
                                                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full p-2 border rounded-lg text-xs h-20 outline-none" />
                                                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                                        <input type="checkbox" checked={saveToKnowledgeBase} onChange={(e) => setSaveToKnowledgeBase(e.target.checked)} className="rounded" />
                                                        שמור למאגר ידע
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="text-slate-600 text-xs">{issue.treatmentNotes || 'טרם הוזן'}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingIssue === issue.id ? (
                                                <button onClick={() => saveEdit(issue)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 shadow-sm flex items-center gap-1"><Save size={14} /> שמור</button>
                                            ) : (
                                                <button onClick={() => startEditing(issue)} className="text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-50">עדכן</button>
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

  // --- תצוגת ברירת המחדל (לוח בקרה ניהולי עם גרפים) ---
  return (
    <div className={screenWrapperClass}>
      <div className="max-w-7xl mx-auto w-full pb-20">
          <div className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-3xl font-bold text-slate-800">לוח בקרה ניהולי</h1>
               <p className="text-slate-500">סקירה כללית על הטמעת המערכת (מחובר לענן)</p>
            </div>
            <button onClick={loadData} className="p-2 bg-white border rounded-full hover:bg-slate-50 transition-colors"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
          </div>

          <div className="flex items-center gap-2 mb-8 bg-white p-1 rounded-xl w-fit border shadow-sm">
              <button onClick={() => setDashboardTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dashboardTab === 'overview' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}>סקירה כללית</button>
              <button onClick={() => setDashboardTab('tasks')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dashboardTab === 'tasks' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}>משימות פתוחות ({openTasksCount})</button>
              <button onClick={() => setDashboardTab('users')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dashboardTab === 'users' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}>User Care</button>
          </div>

          {dashboardTab === 'overview' && (
            <div className="animate-fadeIn w-full">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col items-center justify-center">
                        <div className="text-slate-400 text-sm mb-2 font-medium flex items-center gap-1"><FileText size={16}/> סה"כ תקלות</div>
                        <div className="text-3xl font-black text-slate-700">{resolutionStats.total}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col items-center justify-center">
                        <div className="text-slate-400 text-sm mb-2 font-medium text-red-500 flex items-center gap-1"><AlertCircle size={16}/> פתוחות</div>
                        <div className="text-3xl font-black text-red-500">{openTasksCount}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col items-center justify-center">
                        <div className="text-slate-400 text-sm mb-2 font-medium text-emerald-500 flex items-center gap-1"><Target size={16}/> אחוז פתרון</div>
                        <div className="text-3xl font-black text-emerald-500">{resolutionStats.rate}%</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col items-center justify-center">
                        <div className="text-slate-400 text-sm mb-2 font-medium text-indigo-500 flex items-center gap-1"><Timer size={16}/> זמן פתרון ממוצע</div>
                        <div className="text-3xl font-black text-indigo-600" dir="ltr">{resolutionStats.avgTimeHours}h</div>
                    </div>
                </div>

                <div className="bg-gradient-to-l from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl mb-8">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Clock size={20} className="text-indigo-200" /> תובנות AI בזמן אמת</h3>
                    <div className="text-indigo-50 prose prose-invert prose-p:my-1 text-right">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiInsight || 'מנתח נתונים...'}</ReactMarkdown>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border w-full h-80">
                        <h3 className="font-bold text-slate-700 mb-6">התפלגות תקלות לפי קטגוריה</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border w-full h-80">
                        <h3 className="font-bold text-slate-700 mb-6">דחיפות תקלות</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
          )}

          {dashboardTab === 'tasks' && (
              <div className="animate-fadeIn w-full space-y-4">
                  {issues.filter(i => i.status === 'open').map(issue => (
                      <div key={issue.id} className="bg-white p-6 rounded-2xl border-l-4 border-l-red-500 shadow-sm border transition-all hover:shadow-md">
                          <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg mb-1">{issue.summary}</h4>
                                    <p className="text-slate-600 text-sm mb-3">{issue.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-400"><span>{new Date(issue.createdAt).toLocaleDateString('he-IL')}</span><span>•</span><span>{issue.username}</span></div>
                                </div>
                                <button onClick={() => startEditing(issue)} className="text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium">טפל בתקלה</button>
                          </div>
                      </div>
                  ))}
                  {openTasksCount === 0 && <div className="p-12 text-center text-slate-400">אין משימות פתוחות! 🎉</div>}
              </div>
          )}

          {dashboardTab === 'users' && (
              <div className="animate-fadeIn w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border">
                      <h3 className="font-bold text-slate-700 mb-6">משתמשים עם הפעילות הגבוהה ביותר</h3>
                      <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={userStats.slice(0, 5)} layout="vertical">
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                              <Tooltip cursor={{fill: '#f8fafc'}} />
                              <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
