import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  FileText, 
  Check, 
  X, 
  Filter, 
  ShieldCheck, 
  Eye,
  LayoutGrid,
  LayoutList,
  Clock,
  User,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Application, FormTemplate, ApplicationFilterType } from '@/types/application';
import type { FormType } from '@/types/formBuilder';
import { formatDateTime } from '@/lib/formatters';
import { getStatusConfig } from '@/constants/status';

interface ApplicationsTabProps {
  applications: Application[];
  formTemplates: FormTemplate[];
  isLoading: boolean;
  updatingId: number | null;
  applicationFilter: ApplicationFilterType;
  setApplicationFilter: (filter: ApplicationFilterType) => void;
  updateApplicationStatus: (id: number, status: 'approved' | 'rejected') => Promise<void>;
}

type ViewMode = 'table' | 'cards';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'revision_requested';

export const ApplicationsTab = ({
  applications,
  formTemplates,
  isLoading,
  updatingId,
  applicationFilter,
  setApplicationFilter,
  updateApplicationStatus,
}: ApplicationsTabProps) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const getFormType = (template: FormTemplate): FormType => {
    return (template.settings as any)?.formType || 'other';
  };

  const getFormTypeByFormId = (formId: string): FormType => {
    const template = formTemplates.find(t => t.id === formId);
    if (template) {
      return getFormType(template);
    }
    return 'other';
  };

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    return (
      <Badge className={`${config.bgClass} ${config.textClass} ${config.borderClass}`}>
        {config.label}
      </Badge>
    );
  };

  const getCharacterName = (content: Record<string, string>) => {
    const nameKeys = Object.keys(content).filter(key => 
      key.toLowerCase().includes('karakter') || 
      key.toLowerCase().includes('character') ||
      key.toLowerCase().includes('isim') ||
      key.toLowerCase().includes('ad')
    );
    if (nameKeys.length > 0) {
      return content[nameKeys[0]] || 'Belirtilmemiş';
    }
    const values = Object.values(content);
    return values[0] || 'Belirtilmemiş';
  };

  const getFormTypeName = (type: string) => {
    const template = formTemplates.find(t => t.id === type);
    if (template) return template.title;
    return type;
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    // Type filter
    if (applicationFilter !== 'all') {
      const formType = getFormTypeByFormId(app.type);
      if (formType !== applicationFilter) return false;
    }
    // Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    return true;
  });

  // Quick filter counts
  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    revision_requested: applications.filter(a => a.status === 'revision_requested').length,
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {filteredApplications.map((app, index) => {
          const formType = getFormTypeByFormId(app.type);
          const appNumber = (app as any).application_number;
          
          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => navigate(`/admin/basvuru/${app.id}`)}
              className="group bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {appNumber && (
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {appNumber}
                      </span>
                    )}
                    {formType === 'whitelist' && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        WL
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {getCharacterName(app.content as Record<string, string>)}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {getFormTypeName(app.type)}
                  </p>
                </div>
                {getStatusBadge(app.status)}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(app.created_at)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 h-9 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate(`/admin/basvuru/${app.id}`)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  İncele
                </Button>
                {app.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => updateApplicationStatus(app.id, 'approved')}
                      disabled={updatingId === app.id}
                    >
                      {updatingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => updateApplicationStatus(app.id, 'rejected')}
                      disabled={updatingId === app.id}
                    >
                      {updatingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  const renderTableView = () => (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground w-[100px]">ID</TableHead>
            <TableHead className="text-muted-foreground">Başvuran</TableHead>
            <TableHead className="text-muted-foreground">Form</TableHead>
            <TableHead className="text-muted-foreground">Tip</TableHead>
            <TableHead className="text-muted-foreground">Tarih</TableHead>
            <TableHead className="text-muted-foreground">Durum</TableHead>
            <TableHead className="text-muted-foreground text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredApplications.map((app) => {
            const formType = getFormTypeByFormId(app.type);
            const appNumber = (app as any).application_number;
            
            return (
              <TableRow 
                key={app.id} 
                className="border-border cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/admin/basvuru/${app.id}`)}
              >
                <TableCell className="font-mono text-xs text-primary">
                  {appNumber || `#${app.id}`}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {getCharacterName(app.content as Record<string, string>)}
                </TableCell>
                <TableCell className="text-foreground">
                  {getFormTypeName(app.type)}
                </TableCell>
                <TableCell>
                  {formType === 'whitelist' ? (
                    <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Whitelist
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Diğer
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(app.created_at)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(app.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                      onClick={() => updateApplicationStatus(app.id, 'approved')}
                      disabled={updatingId === app.id || app.status === 'approved'}
                    >
                      {updatingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="ml-1">Onayla</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                      onClick={() => updateApplicationStatus(app.id, 'rejected')}
                      disabled={updatingId === app.id || app.status === 'rejected'}
                    >
                      {updatingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span className="ml-1">Reddet</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Başvurular</h2>
            <p className="text-muted-foreground">Tüm başvuruları görüntüle ve yönet</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                className="h-8 px-3"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                className="h-8 px-3"
                onClick={() => setViewMode('table')}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>

            {/* Type Filter */}
            <Select value={applicationFilter} onValueChange={(v) => setApplicationFilter(v as ApplicationFilterType)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Formlar</SelectItem>
                <SelectItem value="whitelist">Whitelist</SelectItem>
                <SelectItem value="other">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'pending', 'approved', 'rejected', 'revision_requested'] as StatusFilter[]).map((status) => {
            const labels: Record<StatusFilter, string> = {
              all: 'Tümü',
              pending: 'Beklemede',
              approved: 'Onaylı',
              rejected: 'Reddedildi',
              revision_requested: 'Revizyon'
            };
            const colors: Record<StatusFilter, string> = {
              all: '',
              pending: 'text-amber-500',
              approved: 'text-emerald-500',
              rejected: 'text-red-500',
              revision_requested: 'text-orange-500'
            };
            
            return (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? 'default' : 'outline'}
                className={`h-8 ${statusFilter !== status ? colors[status] : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {labels[status]}
                <span className="ml-1.5 text-xs opacity-70">
                  ({statusCounts[status]})
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {statusFilter !== 'all' || applicationFilter !== 'all'
              ? 'Bu filtreye uygun başvuru bulunamadı'
              : 'Henüz başvuru bulunmuyor'
            }
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        renderCardView()
      ) : (
        renderTableView()
      )}
    </div>
  );
};

export default ApplicationsTab;