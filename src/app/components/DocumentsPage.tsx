import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import {
  FileText, Upload, Download, Folder, AlertCircle, Trash2,
} from 'lucide-react';

const categoryIcons: Record<string, string> = {
  contract: 'text-brand-primary bg-brand-primary-light',
  id: 'text-brand-warning bg-brand-warning-light',
  tax: 'text-brand-success bg-brand-success-light',
  medical: 'text-brand-error bg-brand-error-light',
  policy: 'text-brand-secondary bg-brand-secondary-light',
  leave: 'text-brand-warning bg-brand-warning-light',
  other: 'text-muted-foreground bg-muted',
};

export function DocumentsPage() {
  const { session, reads, actions } = useAppStore('session', 'documents');
  const { currentUser, activeCompanyId } = session;

  const myDocs = reads.getDocumentsForUser(currentUser.id);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'other' as string, fileName: '' });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = () => {
    if (!form.name) { toast.error('Document name is required'); return; }
    const fileName = form.fileName || `${form.name.toLowerCase().replace(/\s+/g, '_')}.pdf`;
    actions.addDocument({ userId: currentUser.id, companyId: activeCompanyId, category: form.category as any, name: form.name, fileName, fileSize: Math.floor(Math.random() * 500000) + 50000, uploadedAt: new Date().toISOString().split('T')[0], uploadedBy: currentUser.id });
    toast.success('Document uploaded');
    setShowUpload(false); setForm({ name: '', category: 'other', fileName: '' });
  };

  const handleDelete = (id: string) => {
    actions.deleteDocument(id);
    toast.success('Document deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">My Documents</h1>
          <p className="text-muted-foreground">Access your uploaded documents and files</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="w-4 h-4 mr-2" /> Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['contract', 'id', 'medical', 'other'].map(cat => {
          const count = myDocs.filter(d => d.category === cat).length;
          return (
            <Card key={cat}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${categoryIcons[cat]}`}><FileText className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{cat === 'id' ? 'ID Documents' : `${cat}s`}</p>
                  <p className="text-xl">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>{myDocs.length} document(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {myDocs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myDocs.map(doc => {
                const isExpiring = doc.expiresAt && new Date(doc.expiresAt) <= new Date(new Date().setMonth(new Date().getMonth() + 3));
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${categoryIcons[doc.category]}`}><FileText className="w-5 h-5" /></div>
                      <div>
                        <p className="text-sm">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{doc.fileName}</span><span>-</span><span>{formatFileSize(doc.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs capitalize">{doc.category}</Badge>
                        {isExpiring && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-brand-warning">
                            <AlertCircle className="w-3 h-3" />
                            Expires {new Date(doc.expiresAt!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => toast.success('Download started')}><Download className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-brand-error" onClick={() => handleDelete(doc.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle><DialogDescription>Add a new document to your file vault.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Document Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Employment Contract" /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['contract', 'id', 'tax', 'medical', 'policy', 'leave', 'other'].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
              <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click or drag file to upload</p>
              <p className="text-xs mt-1">PDF, DOC, JPG up to 10MB</p>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button><Button onClick={handleUpload}>Upload</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
