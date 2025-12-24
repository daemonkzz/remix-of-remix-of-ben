import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FormType } from '@/types/formBuilder';

interface FormBuilderGeneralProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  coverImageUrl: string;
  setCoverImageUrl: (value: string) => void;
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  formType: FormType;
  setFormType: (value: FormType) => void;
  hasActiveWhitelistForm: boolean;
  currentFormId?: string;
}

export const FormBuilderGeneral = ({
  title,
  setTitle,
  description,
  setDescription,
  coverImageUrl,
  setCoverImageUrl,
  isActive,
  setIsActive,
  formType,
  setFormType,
  hasActiveWhitelistForm,
  currentFormId,
}: FormBuilderGeneralProps) => {
  const isWhitelist = formType === 'whitelist';
  
  // Check if we can enable whitelist (only one active whitelist form allowed)
  const canEnableWhitelist = !hasActiveWhitelistForm || !isActive;

  const handleWhitelistToggle = (checked: boolean) => {
    if (checked) {
      setFormType('whitelist');
      // Whitelist forms are only for unverified users
    } else {
      setFormType('other');
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Type */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <CardTitle className="text-foreground">Form Tipi</CardTitle>
          </div>
          <CardDescription>
            Bu formun türünü belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-background">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-foreground font-medium">Whitelist Formu</Label>
                {isWhitelist && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    Whitelist
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Bu form onaylandığında kullanıcı "Onaylı Üye" statüsü kazanır
              </p>
            </div>
            <Switch
              checked={isWhitelist}
              onCheckedChange={handleWhitelistToggle}
              disabled={hasActiveWhitelistForm && !isWhitelist && isActive}
            />
          </div>

          {hasActiveWhitelistForm && !isWhitelist && (
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200">
                Şu anda aktif bir whitelist formu mevcut. Aynı anda yalnızca bir whitelist formu aktif olabilir.
              </AlertDescription>
            </Alert>
          )}

          {isWhitelist && (
            <Alert className="border-primary/30 bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground">
                Bu form sadece <strong>Onaysız Üyelere</strong> gösterilecek. Başvuru onaylandığında kullanıcı otomatik olarak "Onaylı Üye" olur.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Form Bilgileri</CardTitle>
          <CardDescription>
            Formunuzun temel bilgilerini buradan ayarlayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">
              Form Başlığı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isWhitelist ? "Örn: Whitelist Başvurusu" : "Örn: LSPD Başvurusu"}
              className="bg-background border-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Form Açıklaması
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Form hakkında açıklama yazın..."
              rows={4}
              className="bg-background border-border resize-none"
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label htmlFor="coverImage" className="text-foreground">
              Kapak Görseli URL
            </Label>
            <Input
              id="coverImage"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="bg-background border-border"
            />
            {coverImageUrl && (
              <div className="mt-3 relative rounded-lg overflow-hidden border border-border">
                <img
                  src={coverImageUrl}
                  alt="Kapak görseli önizleme"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-background">
            <div className="space-y-0.5">
              <Label className="text-foreground">Form Durumu</Label>
              <p className="text-sm text-muted-foreground">
                {isWhitelist 
                  ? 'Aktif olduğunda bu whitelist formu onaysız kullanıcılara gösterilir'
                  : 'Aktif formlar kullanıcılara gösterilir'
                }
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
