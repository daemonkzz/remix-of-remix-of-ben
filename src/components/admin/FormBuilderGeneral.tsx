import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FormBuilderGeneralProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  coverImageUrl: string;
  setCoverImageUrl: (value: string) => void;
  isActive: boolean;
  setIsActive: (value: boolean) => void;
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
}: FormBuilderGeneralProps) => {
  return (
    <div className="space-y-6">
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
              placeholder="Örn: LSPD Başvurusu"
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
                Aktif formlar kullanıcılara gösterilir
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
