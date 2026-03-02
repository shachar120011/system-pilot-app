import React, { useState } from 'react';
import { AlertTriangle, Send, CheckCircle, Paperclip } from 'lucide-react';
import { siteConfig } from '../config';
import { StorageService } from '../services/storageService';
import { IssuePriority, IssueCategory, Issue } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const IssueReporter: React.FC = () => {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>(IssueCategory.OTHER);
  const [priority, setPriority] = useState<IssuePriority>(IssuePriority.MEDIUM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !description) return;
    setIsSubmitting(true);

    // יצירת אובייקט התקלה ושמירתו
    const newIssue: Issue = {
      id: uuidv4(),
      summary,
      description,
      category,
      priority,
      status: 'open',
      createdAt: Date.now(),
      username: 'משתמש מחובר', // כאן אפשר לחבר את השם האמיתי מה-State הכללי אם תרצה
      userRole: 'עובד עירייה',
      attachments: []
    };

    // שמירה לשירות האחסון המקומי/גיליון גוגל שלך
    StorageService.saveIssue(newIssue);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setSummary('');
      setDescription('');
      
      // החזרת הטופס למצב רגיל אחרי 3 שניות
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-slate-100 flex justify-center items-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* כותרת הטופס */}
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="bg-[#432A61] p-4 rounded-2xl text-white shadow-lg">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#432A61]">דיווח על תקלה או בקשת תמיכה</h2>
            <p className="text-sm text-slate-500 font-bold mt-1">מערכת {siteConfig.clientSystemName}</p>
          </div>
        </div>

        {/* גוף הטופס */}
        <div className="p-8">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn">
              <CheckCircle size={80} className="text-green-500 mb-6 drop-shadow-md" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">הפנייה נשלחה בהצלחה!</h3>
              <p className="text-slate-500">צוות התמיכה קיבל את הדיווח ויטפל בו בהקדם האפשרי.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* קטגוריה */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">סוג הפנייה</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IssueCategory)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61] cursor-pointer"
                  >
                    {Object.values(IssueCategory).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* דחיפות */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">דחיפות הטיפול</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IssuePriority)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61] cursor-pointer"
                  >
                    <option value={IssuePriority.LOW}>נמוכה - סובל דיחוי</option>
                    <option value={IssuePriority.MEDIUM}>בינונית - מפריע לעבודה הרגילה</option>
                    <option value={IssuePriority.HIGH}>גבוהה - משבית חלק מהפעילות</option>
                    <option value={IssuePriority.CRITICAL}>קריטית - משבית את כל המערכת</option>
                  </select>
                </div>
              </div>

              {/* תקציר הבעיה */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">נושא (תקציר קצר)</label>
                <input 
                  type="text" 
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61]"
                  placeholder="למשל: המדפסת במחלקת הנדסה לא מדפיסה"
                  required
                />
              </div>

              {/* תיאור מפורט */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">תיאור הבעיה (פירוט מלא)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61] min-h-[150px] resize-none"
                  placeholder="תאר בדיוק מה קרה, מה ניסית לעשות ומה הייתה התגובה של המערכת..."
                  required
                />
              </div>

              {/* כפתור שליחה */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button type="button" className="text-slate-400 hover:text-[#432A61] flex items-center gap-2 text-sm font-bold transition-colors">
                  <Paperclip size={18} /> צרף צילום מסך
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#432A61] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#2d1b42] transition-colors flex items-center gap-2 disabled:bg-slate-400"
                >
                  {isSubmitting ? 'שולח נתונים...' : 'שלח דיווח'}
                  <Send size={18} className="rotate-[-180deg]" />
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};
