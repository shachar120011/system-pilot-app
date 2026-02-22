import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Upload, Plus, FileText, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2, FileUp, FileJson, FileType, Loader2, Save, MessageSquare, TrendingUp, HelpCircle, Download, Filter, ArrowUpDown, Users, Bell, Search, LayoutList, Activity, Paperclip, Eye, X, Lock, UserCog, ArrowLeft } from 'lucide-react';
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
    const loadedIssues = StorageService.getIssues();
    setIssues(loadedIssues);
    const loadedQueries = StorageService.getQueries();
    setQueries(loadedQueries);
    
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Knowledge_Base`);
      const result = await response.json();
      
      if (result.status === "success" && result.data) {
        const sheetItems = result.data.map((row: any, index: number) => ({
          id: `sheet-${index}`,
          createdAt: new Date(row[0]).getTime() || Date.now(),
          title: row[1] || '',
          content: row[2] || '',
          fileName: row[3] || '',
          sourceType: row[3] ? 'file' : 'manual'
        })).filter((item: any) => item.title !== ''); 
        
        setKnowledgeItems(sheetItems.reverse()); 
      } else {
         setKnowledgeItems(StorageService.getKnowledgeBase()); 
      }
    } catch (error) {
      console.error("Fetch GET Error:", error);
      setKnowledgeItems(StorageService.getKnowledgeBase());
    }
    
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

  const saveEdit = (issue: Issue) => {
      const updatedIssue: Issue = {
          ...issue,
          treatmentNotes: editNotes,
          status: editStatus
      };
      StorageService.updateIssue(updatedIssue);
      setIssues(prev => prev.map(i => i.id === issue.id ? updatedIssue : i));
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
                                onChange={(e) => setAdminName
